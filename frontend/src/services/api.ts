/**
 * DSP KnowledgeHub AI – Employee Self-Service Portal
 * API Service Layer
 * 
 * Centralizes all API calls with proper error handling,
 * authentication, and response typing.
 */

import axios, { AxiosInstance, AxiosResponse } from 'axios';

let rawBase = (import.meta.env.VITE_API_BASE_URL || import.meta.env.VITE_API_URL || '/api/v1').trim();
rawBase = rawBase.replace(/\/+$/, '');
// If remote URL is provided without /api/v1, append /api/v1 for standard API endpoints
if (rawBase.startsWith('http') && !rawBase.endsWith('/api/v1')) {
  rawBase = `${rawBase}/api/v1`;
}
const API_BASE_URL = rawBase;

// API Response wrapper type matching backend schema
export interface APIResponse<T = any> {
  success: boolean;
  data: T;
  metadata: {
    timestamp: string;
    source: string;
    data_status: string;
    model_version?: string;
    is_demo: boolean;
  };
  error: string | null;
}

export interface CitationItem {
  document_id: string;
  document_title: string;
  section: string;
  page?: number;
  snippet: string;
  relevance: number;
  category: string;
  verified: boolean;
  url?: string;
  effective_date?: string;
  version?: string;
  excerpt?: string;
  relevance_score?: number;
}

export interface DocumentSection {
  section: string;
  page?: number;
  keywords?: string[];
  content: string;
}

export interface DocumentItem {
  id: string;
  title: string;
  category: string;
  version: string;
  last_updated: string;
  author: string;
  department: string;
  summary: string;
  status: string;
  chunk_count: number;
  security_clearance: string;
  file_type: string;
  size_kb: number;
  sections?: DocumentSection[];
}

export interface ConversationMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  sources?: any[];
  citations?: CitationItem[];
  follow_up_suggestions?: string[];
  follow_ups?: string[];
  timestamp: string;
  metrics?: Record<string, any>;
  warnings?: string[];
}

export interface ConversationRecord {
  id: string;
  title: string;
  created_at: string;
  updated_at: string;
  pinned?: boolean;
  message_count?: number;
  last_snippet?: string;
  messages?: ConversationMessage[];
}

export interface ResearchResponse {
  answer: string;
  sources: any[];
  citations?: CitationItem[];
  follow_up_suggestions?: string[];
  structured_metrics?: Record<string, any>;
  model_context?: Record<string, any>;
  warnings: string[];
  data_status: string;
}


// Create axios instance
const api: AxiosInstance = axios.create({
  baseURL: API_BASE_URL,
  timeout: 45000,
  withCredentials: true,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Auth interceptor
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('dsp_access_token');
  if (token && token !== 'undefined' && token !== 'null') {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Response interceptor
api.interceptors.response.use(
  (response) => response,
  (error) => {
    const token = localStorage.getItem('dsp_access_token');
    const isDemoSession = (token && token.startsWith('demo-session')) || !!localStorage.getItem('dsp_active_demo_user');

    // Never evict active demo user sessions on 401
    if (error.response?.status === 401 && !isDemoSession && !error.config?.url?.includes('/auth/login')) {
      localStorage.removeItem('dsp_access_token');
      localStorage.removeItem('dsp_refresh_token');
      window.dispatchEvent(new CustomEvent('dsp:session-expired', {
        detail: { message: 'Your session has expired. Please log in again.' }
      }));
    }
    return Promise.reject(error);
  }
);

// ─── API Functions ──────────────────────────────────────────────────

export const authAPI = {
  login: (email: string, password: string) =>
    api.post<APIResponse>('/auth/login', { email, password }),

  logout: () => api.post<APIResponse>('/auth/logout'),

  register: (
    dataOrEmail: {
      email: string;
      password: string;
      full_name: string;
      role?: string;
      employee_code?: string;
      department?: string;
      designation?: string;
    } | string,
    password?: string,
    full_name?: string,
    role: string = 'EMPLOYEE'
  ) => {
    if (typeof dataOrEmail === 'object') {
      return api.post<APIResponse>('/auth/register', dataOrEmail);
    }
    return api.post<APIResponse>('/auth/register', { email: dataOrEmail, password, full_name, role });
  },

  getMe: () => api.get<APIResponse>('/auth/me'),
};

export const researchAPI = {
  ask: (question: string, context?: any, conversation_id?: string) =>
    api.post<APIResponse<ResearchResponse>>('/research/ask', { question, context, conversation_id }),

  getDocuments: (category?: string, search?: string) =>
    api.get<APIResponse<DocumentItem[]>>('/research/documents', { params: { category, search } }),

  getDocument: (docId: string) =>
    api.get<APIResponse<DocumentItem>>(`/research/documents/${docId}`),

  searchDocuments: (query: string, filters?: any, limit: number = 10) =>
    api.post<APIResponse>('/research/documents/search', { query, filters, limit }),

  uploadDocument: (data: { title: string; category: string; department: string; content?: string; author?: string }) =>
    api.post<APIResponse>('/research/documents/upload', data),

  getIngestionStatus: (docId: string) =>
    api.get<APIResponse>(`/research/documents/status/${docId}`),

  getConversations: () =>
    api.get<APIResponse<ConversationRecord[]>>('/research/conversations'),

  getConversation: (convId: string) =>
    api.get<APIResponse<ConversationRecord>>(`/research/conversations/${convId}`),

  saveConversation: (conversation: ConversationRecord) =>
    api.post<APIResponse<ConversationRecord>>('/research/conversations', conversation),

  deleteConversation: (convId: string) =>
    api.delete<APIResponse>(`/research/conversations/${convId}`),

  submitFeedback: (data: { message_id: string; question?: string; rating: string; citation_accurate?: boolean; feedback_text?: string }) =>
    api.post<APIResponse>('/research/feedback', data),
};

export const healthAPI = {
  check: () => api.get('/health'),
};

// ─── DSP KnowledgeHub AI Employee Self-Service API ───────────────────

export interface EmployeeProfile {
  id: string;
  employee_code: string;
  email: string;
  full_name: string;
  department: string;
  designation: string;
  role: string;
  location: string;
  phone?: string;
  date_of_joining?: string;
  manager_code?: string;
  manager_name?: string;
  avatar_initials: string;
  is_active: boolean;
  is_demo: boolean;
}

export interface LeaveCategoryBalance {
  category_id: string;
  category_name: string;
  code: string;
  allocated: number;
  used: number;
  pending: number;
  available: number;
  description: string;
}

export interface LeaveBalancesSummary {
  employee_code: string;
  year: number;
  categories: LeaveCategoryBalance[];
  total_available: number;
  upcoming_approved_days: number;
}

export interface LeaveRequestItem {
  id: string;
  request_number: string;
  employee_code: string;
  employee_name: string;
  category_code: string;
  category_name: string;
  start_date: string;
  end_date: string;
  duration_days: number;
  is_half_day: boolean;
  status: string;
  reason: string;
  handover_notes?: string;
  applied_on: string;
  approver_name?: string;
  approver_comments?: string;
  can_cancel?: boolean;
}

export interface ExpenseClaimItem {
  id: string;
  claim_number: string;
  employee_code: string;
  employee_name: string;
  category: string;
  category_label: string;
  expense_date: string;
  amount: number;
  currency: string;
  merchant: string;
  business_purpose: string;
  receipt_filename?: string;
  receipt_url?: string;
  status: string;
  submitted_on: string;
  approver_name?: string;
  reviewer_comments?: string;
  settlement_reference?: string;
  settlement_date?: string;
  can_cancel?: boolean;
}

export interface ExpenseSummary {
  employee_code: string;
  total_claims: number;
  pending_approval_count: number;
  pending_approval_amount: number;
  approved_count: number;
  approved_amount: number;
  paid_count: number;
  paid_amount: number;
  currency: string;
}

export interface ServiceRequestItem {
  id: string;
  request_number: string;
  employee_code: string;
  employee_name: string;
  category: string;
  category_label: string;
  subject: string;
  description: string;
  priority: string;
  status: string;
  assigned_team: string;
  assignee_name?: string;
  created_at: string;
  updated_at: string;
  comments: {
    id: string;
    author_name: string;
    author_role: string;
    message: string;
    timestamp: string;
  }[];
}

export interface PendingApprovalItem {
  id: string;
  item_type: 'LEAVE' | 'EXPENSE';
  reference_number: string;
  employee_code: string;
  employee_name: string;
  department: string;
  title: string;
  subtitle: string;
  amount?: number;
  currency?: string;
  date_summary: string;
  submitted_on: string;
  status: string;
  details: any;
}

export interface InAppNotification {
  id: string;
  employee_code: string;
  type: string;
  title: string;
  message: string;
  link_path?: string;
  created_at: string;
  is_read: boolean;
}

export interface CompanyHoliday {
  date: string;
  name: string;
  day_of_week: string;
  is_trading_holiday: boolean;
  description: string;
}

export interface EmployeeDashboardData {
  employee: EmployeeProfile;
  leave_summary: LeaveBalancesSummary;
  expense_summary: ExpenseSummary;
  open_requests_count: number;
  pending_approvals_count: number;
  recent_activities: any[];
  upcoming_holidays: CompanyHoliday[];
  is_demo_data: boolean;
}

export const selfServiceAPI = {
  getProfile: () =>
    api.get<APIResponse<EmployeeProfile>>('/self-service/profile'),

  updateProfile: (data: Partial<EmployeeProfile>) =>
    api.put<APIResponse<EmployeeProfile>>('/self-service/profile', data),

  getDashboard: () =>
    api.get<APIResponse<EmployeeDashboardData>>('/self-service/dashboard'),

  // Leave
  getLeaveBalances: () =>
    api.get<APIResponse<LeaveBalancesSummary>>('/self-service/leave/balances'),

  getLeaveRequests: () =>
    api.get<APIResponse<LeaveRequestItem[]>>('/self-service/leave/requests'),

  applyLeave: (data: {
    category_code: string;
    start_date: string;
    end_date: string;
    reason: string;
    is_half_day?: boolean;
    handover_notes?: string;
  }) => api.post<APIResponse<LeaveRequestItem>>('/self-service/leave/apply', data),

  cancelLeave: (requestId: string) =>
    api.post<APIResponse<LeaveRequestItem>>(`/self-service/leave/cancel/${requestId}`),

  // Expenses & Reimbursements
  getExpenseSummary: () =>
    api.get<APIResponse<ExpenseSummary>>('/self-service/expenses/summary'),

  getExpenseClaims: () =>
    api.get<APIResponse<ExpenseClaimItem[]>>('/self-service/expenses/claims'),

  submitExpenseClaim: (data: {
    category: string;
    expense_date: string;
    amount: number;
    merchant: string;
    business_purpose: string;
    receipt_filename?: string;
    notes?: string;
  }) => api.post<APIResponse<ExpenseClaimItem>>('/self-service/expenses/claim', data),

  cancelExpenseClaim: (claimId: string) =>
    api.post<APIResponse<ExpenseClaimItem>>(`/self-service/expenses/cancel/${claimId}`),

  // Service Desk
  getServiceRequests: () =>
    api.get<APIResponse<ServiceRequestItem[]>>('/self-service/requests'),

  createServiceRequest: (data: {
    category: string;
    subject: string;
    description: string;
    priority?: string;
  }) => api.post<APIResponse<ServiceRequestItem>>('/self-service/requests/create', data),

  addServiceRequestComment: (ticketId: string, message: string) =>
    api.post<APIResponse<ServiceRequestItem>>(`/self-service/requests/${ticketId}/comment`, { message }),

  // Unified Activity
  getActivityFeed: () =>
    api.get<APIResponse<any[]>>('/self-service/activity'),

  // Manager Approvals
  getPendingApprovals: () =>
    api.get<APIResponse<PendingApprovalItem[]>>('/self-service/approvals/pending'),

  processApprovalDecision: (data: {
    item_type: 'LEAVE' | 'EXPENSE';
    item_id: string;
    decision: 'APPROVE' | 'REJECT' | 'REQUEST_INFO';
    comments?: string;
  }) => api.post<APIResponse<any>>('/self-service/approvals/decision', data),

  // Notifications
  getNotifications: () =>
    api.get<APIResponse<InAppNotification[]>>('/self-service/notifications'),

  markNotificationRead: (notifId: string) =>
    api.post<APIResponse<{ read: boolean }>>(`/self-service/notifications/${notifId}/read`),

  // Admin & Integrations
  getAdminIntegrations: () =>
    api.get<APIResponse<any[]>>('/self-service/admin/integrations'),

  getAuditLogs: (limit: number = 50) =>
    api.get<APIResponse<any[]>>('/self-service/admin/audit-logs', { params: { limit } }),

  // AI Assistant with live routing
  queryAssistant: (question: string) =>
    api.post<APIResponse<any>>('/self-service/assistant/query', { question }),
};

export default api;


// ─── Employee Onboarding Module ──────────────────────────────────────

export interface OnboardingTask {
  id: string;
  task_template_id: string;
  employee_code: string;
  stage: string;
  title: string;
  description: string;
  is_required: boolean;
  requires_approval: boolean;
  responsible_party: 'EMPLOYEE' | 'HR' | 'MANAGER' | 'IT';
  requires_document: boolean;
  due_date: string;
  status: 'NOT_STARTED' | 'IN_PROGRESS' | 'SUBMITTED_FOR_REVIEW' | 'COMPLETED' | 'ACTION_REQUIRED' | 'OVERDUE';
  completed_at?: string;
  hr_comments?: string;
  employee_comments?: string;
  created_at: string;
  updated_at: string;
  employee_name?: string; // for HR/manager views
}

export interface OnboardingTaskSummary {
  total: number;
  completed: number;
  pending: number;
  overdue: number;
  action_required: number;
  submitted_for_review: number;
}

export interface OnboardingInstance {
  employee_code: string;
  full_name: string;
  email: string;
  department: string;
  designation: string;
  role: string;
  joining_date: string;
  current_stage: string;
  template_id: string;
  hr_coordinator_code: string;
  hr_coordinator_name: string;
  manager_code?: string;
  manager_name?: string;
  buddy_code?: string;
  buddy_name?: string;
  avatar_initials: string;
  is_demo: boolean;
  assigned_at: string;
  completed_at?: string;
  overall_completion_pct: number;
}

export interface DocumentSubmission {
  id: string;
  employee_code: string;
  doc_type_id: string;
  doc_type_name: string;
  filename: string;
  file_size_kb: number;
  is_sensitive: boolean;
  status: 'SUBMITTED' | 'VERIFIED' | 'CORRECTION_REQUIRED' | 'REJECTED';
  submitted_at: string;
  hr_reviewer_code?: string;
  hr_reviewer_name?: string;
  review_comments?: string;
  reviewed_at?: string;
  is_demo: boolean;
}

export interface DocumentType {
  id: string;
  name: string;
  description: string;
  is_sensitive: boolean;
  allowed_formats: string[];
  max_size_mb: number;
  required_for_stages: string[];
}

export interface OnboardingNotification {
  id: string;
  employee_code: string;
  type: string;
  title: string;
  message: string;
  link_path?: string;
  created_at: string;
  is_read: boolean;
  is_demo: boolean;
}

export interface OnboardingStatus {
  has_active_onboarding: boolean;
  message?: string;
  instance?: OnboardingInstance;
  task_summary?: OnboardingTaskSummary;
  all_tasks?: OnboardingTask[];
  document_submissions?: DocumentSubmission[];
  is_demo?: boolean;
  demo_notice?: string;
}

export const onboardingAPI = {
  // Employee endpoints
  getMyStatus: (previewCode?: string) =>
    api.get<APIResponse<OnboardingStatus>>('/onboarding/status', {
      params: previewCode ? { preview_emp_code: previewCode } : undefined,
    }),

  getMyTasks: (stage?: string) =>
    api.get<APIResponse<{ tasks: OnboardingTask[]; summary: OnboardingTaskSummary }>>('/onboarding/tasks', {
      params: stage ? { stage } : undefined,
    }),

  updateTaskStatus: (data: { task_id: string; new_status: string; comments?: string }) =>
    api.post<APIResponse<OnboardingTask>>('/onboarding/tasks/update', data),

  submitDocument: (data: { doc_type_id: string; filename: string; file_size_kb: number }) =>
    api.post<APIResponse<DocumentSubmission>>('/onboarding/documents/submit', data),

  getMyDocuments: () =>
    api.get<APIResponse<{ submissions: DocumentSubmission[]; document_types: DocumentType[] }>>('/onboarding/documents'),

  getNotifications: () =>
    api.get<APIResponse<OnboardingNotification[]>>('/onboarding/notifications'),

  markNotificationRead: (notifId: string) =>
    api.post<APIResponse<{ read: boolean }>>(`/onboarding/notifications/${notifId}/read`),

  queryAssistant: (question: string) =>
    api.post<APIResponse<any>>('/onboarding/assistant/query', { question }),

  // HR endpoints
  hrGetAllEmployees: (stage?: string, department?: string) =>
    api.get<APIResponse<{ employees: OnboardingInstance[]; total: number }>>('/onboarding/hr/employees', {
      params: { stage, department },
    }),

  hrGetEmployeeStatus: (empCode: string) =>
    api.get<APIResponse<any>>(`/onboarding/hr/employee/${empCode}/status`),

  hrReviewTask: (data: { task_id: string; employee_code: string; new_status: string; comments?: string }) =>
    api.post<APIResponse<OnboardingTask>>('/onboarding/hr/tasks/review', data),

  hrReviewDocument: (data: { employee_code: string; submission_id: string; new_status: string; comments?: string }) =>
    api.post<APIResponse<DocumentSubmission>>('/onboarding/hr/documents/review', data),

  hrAssignOnboarding: (data: {
    employee_code: string;
    full_name: string;
    email: string;
    department: string;
    designation: string;
    joining_date: string;
    template_id?: string;
    manager_code?: string;
    manager_name?: string;
    buddy_code?: string;
    buddy_name?: string;
  }) => api.post<APIResponse<OnboardingInstance>>('/onboarding/hr/assign', data),

  hrGetTemplates: () =>
    api.get<APIResponse<any[]>>('/onboarding/hr/templates'),

  hrGetDocumentTypes: () =>
    api.get<APIResponse<DocumentType[]>>('/onboarding/hr/document-types'),

  hrGetAuditLog: (limit?: number) =>
    api.get<APIResponse<any[]>>('/onboarding/hr/audit-log', { params: { limit } }),

  // Manager endpoints
  managerGetTasks: () =>
    api.get<APIResponse<OnboardingTask[]>>('/onboarding/manager/tasks'),

  // IT endpoints
  itGetTasks: () =>
    api.get<APIResponse<OnboardingTask[]>>('/onboarding/it/tasks'),

  itUpdateTask: (data: { task_id: string; employee_code: string; new_status: string; comments?: string }) =>
    api.post<APIResponse<OnboardingTask>>('/onboarding/it/tasks/update', data),
};
