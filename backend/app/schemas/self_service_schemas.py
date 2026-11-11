"""
Pydantic schemas for the DSP KnowledgeHub AI Employee Self-Service Platform.
All schemas adhere to Pydantic V2 and provide strong typing and validation.
"""

from datetime import date, datetime
from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


# ─── Employee Identity & Profile ─────────────────────────────────────

class EmployeeProfile(BaseModel):
    id: str
    employee_code: str = Field(..., description="Unique employee identifier (e.g. EMP-1001)")
    email: str
    full_name: str
    department: str
    designation: str
    role: str = Field(..., description="EMPLOYEE, MANAGER, or ADMIN")
    location: str = Field(default="Mumbai - Nariman Point (Mafatlal Centre)")
    phone: Optional[str] = None
    date_of_joining: Optional[str] = None
    manager_code: Optional[str] = None
    manager_name: Optional[str] = None
    avatar_initials: str
    is_active: bool = True
    is_demo: bool = True


# ─── Leave Management ────────────────────────────────────────────────

class LeaveCategoryBalance(BaseModel):
    category_id: str
    category_name: str
    code: str
    allocated: float
    used: float
    pending: float
    available: float
    description: str


class LeaveBalancesSummary(BaseModel):
    employee_code: str
    year: int
    categories: List[LeaveCategoryBalance]
    total_available: float
    upcoming_approved_days: float


class LeaveRequestCreate(BaseModel):
    category_code: str = Field(..., description="PL, CSL, ML_PL, or COMP_OFF")
    start_date: str = Field(..., description="YYYY-MM-DD")
    end_date: str = Field(..., description="YYYY-MM-DD")
    is_half_day: bool = False
    half_day_session: Optional[str] = None  # MORNING or AFTERNOON
    reason: str = Field(..., min_length=3, max_length=500)
    handover_notes: Optional[str] = None


class LeaveRequestItem(BaseModel):
    id: str
    request_number: str
    employee_code: str
    employee_name: str
    category_code: str
    category_name: str
    start_date: str
    end_date: str
    duration_days: float
    is_half_day: bool
    status: str = Field(..., description="DRAFT, PENDING_APPROVAL, APPROVED, REJECTED, CANCELLED")
    reason: str
    handover_notes: Optional[str] = None
    applied_on: str
    approver_name: Optional[str] = None
    approver_comments: Optional[str] = None
    actioned_on: Optional[str] = None
    can_cancel: bool = False


# ─── Reimbursements & Expenses ───────────────────────────────────────

class ExpenseClaimCreate(BaseModel):
    category: str = Field(..., description="TRAVEL, LODGING, MEALS, CONVEYANCE, INTERNET_MOBILE, OTHER")
    expense_date: str = Field(..., description="YYYY-MM-DD")
    amount: float = Field(..., gt=0)
    currency: str = Field(default="INR")
    merchant: str = Field(..., min_length=2)
    business_purpose: str = Field(..., min_length=3)
    receipt_filename: Optional[str] = None
    notes: Optional[str] = None


class ExpenseClaimItem(BaseModel):
    id: str
    claim_number: str
    employee_code: str
    employee_name: str
    category: str
    category_label: str
    expense_date: str
    amount: float
    currency: str
    merchant: str
    business_purpose: str
    receipt_filename: Optional[str] = None
    receipt_url: Optional[str] = None
    status: str = Field(
        ...,
        description="DRAFT, SUBMITTED, UNDER_REVIEW, INFO_REQUIRED, APPROVED, REJECTED, PAYMENT_PROCESSING, PAID, CANCELLED"
    )
    submitted_on: str
    approver_name: Optional[str] = None
    reviewer_comments: Optional[str] = None
    actioned_on: Optional[str] = None
    settlement_reference: Optional[str] = None
    can_cancel: bool = False


class ExpenseSummary(BaseModel):
    employee_code: str
    total_claims: int
    pending_approval_count: int
    pending_approval_amount: float
    approved_count: int
    approved_amount: float
    paid_count: int
    paid_amount: float
    currency: str = "INR"


# ─── Service Desk & Internal Requests ────────────────────────────────

class ServiceRequestCreate(BaseModel):
    category: str = Field(..., description="IT_ACCESS, HARDWARE, SOFTWARE, HR_INQUIRY, HR_DOCUMENT, TRAVEL_DESK, FACILITIES")
    subject: str = Field(..., min_length=3, max_length=150)
    description: str = Field(..., min_length=5, max_length=1000)
    priority: str = Field(default="MEDIUM", description="LOW, MEDIUM, HIGH, URGENT")


class ServiceRequestComment(BaseModel):
    id: str
    author_name: str
    author_role: str
    message: str
    timestamp: str


class ServiceRequestItem(BaseModel):
    id: str
    request_number: str
    employee_code: str
    employee_name: str
    category: str
    category_label: str
    subject: str
    description: str
    priority: str
    status: str = Field(..., description="OPEN, IN_PROGRESS, WAITING_ON_EMPLOYEE, RESOLVED, CLOSED, CANCELLED")
    assigned_team: str
    assignee_name: Optional[str] = None
    created_at: str
    updated_at: str
    comments: List[ServiceRequestComment] = []


# ─── Approvals (Managers & Approvers) ────────────────────────────────

class ApprovalDecisionRequest(BaseModel):
    item_type: str = Field(..., description="LEAVE or EXPENSE")
    item_id: str
    decision: str = Field(..., description="APPROVE, REJECT, or REQUEST_INFO")
    comments: Optional[str] = None


class PendingApprovalItem(BaseModel):
    id: str
    item_type: str = Field(..., description="LEAVE or EXPENSE")
    reference_number: str
    employee_code: str
    employee_name: str
    department: str
    title: str
    subtitle: str
    amount: Optional[float] = None
    currency: Optional[str] = None
    date_summary: str
    submitted_on: str
    status: str
    details: Dict[str, Any] = {}


# ─── Notifications ───────────────────────────────────────────────────

class InAppNotification(BaseModel):
    id: str
    employee_code: str
    type: str  # LEAVE_UPDATE, EXPENSE_UPDATE, TICKET_UPDATE, APPROVAL_PENDING
    title: str
    message: str
    link_path: Optional[str] = None
    created_at: str
    is_read: bool = False


# ─── Audit Log ───────────────────────────────────────────────────────

class AuditLogEntry(BaseModel):
    id: str
    timestamp: str
    actor_code: str
    actor_name: str
    action: str
    entity_type: str
    entity_id: str
    details: str
    ip_address: Optional[str] = "127.0.0.1"


# ─── Upcoming Company Calendar ───────────────────────────────────────

class CompanyHoliday(BaseModel):
    date: str
    name: str
    day_of_week: str
    is_trading_holiday: bool = True
    description: str


# ─── Dashboard Unified State ─────────────────────────────────────────

class EmployeeDashboardResponse(BaseModel):
    employee: EmployeeProfile
    leave_summary: Dict[str, Any]
    expense_summary: ExpenseSummary
    open_requests_count: int
    pending_approvals_count: int
    recent_activities: List[Dict[str, Any]]
    upcoming_holidays: List[CompanyHoliday]
    is_demo_data: bool = True
