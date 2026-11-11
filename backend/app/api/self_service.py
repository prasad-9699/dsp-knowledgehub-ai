"""
DSP KnowledgeHub AI — Employee Self-Service API Router

Exposes production-structured REST endpoints for:
- Employee Identity & Home Dashboard
- Leave Balances & Leave Applications
- Reimbursement & Expense Claim Processing
- Unified Service Desk Requests & Activity
- Manager Approvals & Decision Processing
- Enterprise Integration Adapters & Audit Logs
- AI Conversational Assistant with Live Employee-Data Routing
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional
from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy.ext.asyncio import AsyncSession
import structlog

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.schemas import APIResponse, ResponseMetadata
from app.schemas.self_service_schemas import (
    ApprovalDecisionRequest,
    EmployeeProfile,
    ExpenseClaimCreate,
    LeaveRequestCreate,
    ServiceRequestCreate,
)
from app.services.self_service_service import self_service_engine, COMPANY_HOLIDAYS_2026

logger = structlog.get_logger()

router = APIRouter(prefix="/self-service", tags=["Employee Self-Service"])


def _resolve_employee_code(current_user: User) -> str:
    """
    Resolves the authenticated employee code from server-side user credentials.
    NEVER trusts client-supplied query params or body identifiers for authorization.
    """
    # 1. If user has employee_code
    if getattr(current_user, "employee_code", None):
        return current_user.employee_code

    # 2. Map standard demo emails to synthetic employee codes
    email = current_user.email.lower()
    email_map = {
        "aditi.sharma@dspamc.com": "EMP-1001",
        "advisor@dspim.com": "EMP-1001",
        "rohan.mehta@dspamc.com": "EMP-1002",
        "quant@dspim.com": "EMP-1002",
        "priya.nair@dspamc.com": "EMP-1003",
        "compliance@dspim.com": "EMP-1003",
        "vikram.malhotra@dspamc.com": "EMP-1004",
        "ananya.desai@dspamc.com": "EMP-1005",
        "admin@dspim.com": "EMP-1005",
    }
    if email in email_map:
        return email_map[email]

    # Default to Aditi Sharma for any viewer account
    return "EMP-1001"


# ─── 1. Employee Profile & Personalized Dashboard ────────────────────

@router.get("/profile", response_model=APIResponse)
async def get_profile(current_user: User = Depends(get_current_user)):
    """Fetch authenticated employee profile."""
    emp_code = _resolve_employee_code(current_user)
    emp = self_service_engine.get_employee_by_id(emp_code)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee record not found")

    return APIResponse(
        success=True,
        data=emp,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="hrms_adapter",
            data_status="VERIFIED_EMPLOYEE_RECORD",
            is_demo=True,
        ),
    )


@router.put("/profile", response_model=APIResponse)
async def update_profile(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """Update authenticated employee profile contact information."""
    emp_code = _resolve_employee_code(current_user)
    try:
        updated_emp = self_service_engine.update_employee_profile(emp_code, payload)
        return APIResponse(
            success=True,
            data=updated_emp,
            metadata=ResponseMetadata(
                timestamp=datetime.now(timezone.utc),
                source="hrms_adapter",
                data_status="PROFILE_UPDATED",
                is_demo=True,
            ),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/dashboard", response_model=APIResponse)
async def get_dashboard(current_user: User = Depends(get_current_user)):
    """
    Returns consolidated personalized dashboard state:
    Employee details, leave summary, reimbursement totals, open requests,
    pending manager approvals, recent activity, and company holidays.
    """
    emp_code = _resolve_employee_code(current_user)
    emp = self_service_engine.get_employee_by_id(emp_code)
    if not emp:
        raise HTTPException(status_code=404, detail="Employee record not found")

    leave_summary = self_service_engine.get_leave_balances(emp_code)
    expense_summary = self_service_engine.get_expense_summary(emp_code)
    open_requests = [r for r in self_service_engine.get_service_requests(emp_code) if r["status"] != "RESOLVED"]
    pending_approvals = self_service_engine.get_pending_approvals(emp_code)
    recent_activities = self_service_engine.get_unified_activity(emp_code)[:5]

    data = {
        "employee": emp,
        "leave_summary": leave_summary,
        "expense_summary": expense_summary,
        "open_requests_count": len(open_requests),
        "pending_approvals_count": len(pending_approvals),
        "recent_activities": recent_activities,
        "upcoming_holidays": COMPANY_HOLIDAYS_2026,
        "is_demo_data": True,
    }

    return APIResponse(
        success=True,
        data=data,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="self_service_engine",
            data_status="AGGREGATED_LIVE_STATE",
            is_demo=True,
        ),
    )


# ─── 2. Leave Management Endpoints ───────────────────────────────────

@router.get("/leave/balances", response_model=APIResponse)
async def get_leave_balances(current_user: User = Depends(get_current_user)):
    """Get live leave balances for the authenticated employee."""
    emp_code = _resolve_employee_code(current_user)
    balances = self_service_engine.get_leave_balances(emp_code)
    return APIResponse(
        success=True,
        data=balances,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="hrms_leave_provider",
            data_status="VERIFIED_BALANCE",
            is_demo=True,
        ),
    )


@router.get("/leave/requests", response_model=APIResponse)
async def get_leave_requests(current_user: User = Depends(get_current_user)):
    """List leave requests applied by the authenticated employee."""
    emp_code = _resolve_employee_code(current_user)
    requests = self_service_engine.get_employee_leave_requests(emp_code)
    return APIResponse(
        success=True,
        data=requests,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="leave_transaction_store",
            data_status="LIVE_RECORDS",
            is_demo=True,
        ),
    )


@router.post("/leave/apply", response_model=APIResponse)
async def apply_leave(
    req: LeaveRequestCreate,
    current_user: User = Depends(get_current_user)
):
    """
    Submits a new leave application.
    Validates date range, balance sufficiency, overlap, and updates balance state.
    """
    emp_code = _resolve_employee_code(current_user)
    try:
        new_leave = self_service_engine.apply_leave(
            employee_code=emp_code,
            category_code=req.category_code,
            start_date_str=req.start_date,
            end_date_str=req.end_date,
            reason=req.reason,
            is_half_day=req.is_half_day,
            handover_notes=req.handover_notes,
        )
        return APIResponse(
            success=True,
            data=new_leave,
            metadata=ResponseMetadata(
                timestamp=datetime.now(timezone.utc),
                source="leave_service",
                data_status="SUBMITTED_FOR_APPROVAL",
                is_demo=True,
            ),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/leave/cancel/{request_id}", response_model=APIResponse)
async def cancel_leave(
    request_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancels a pending or approved future leave request, restoring balance."""
    emp_code = _resolve_employee_code(current_user)
    try:
        cancelled = self_service_engine.cancel_leave(emp_code, request_id)
        return APIResponse(
            success=True,
            data=cancelled,
            metadata=ResponseMetadata(
                timestamp=datetime.now(timezone.utc),
                source="leave_service",
                data_status="CANCELLED_AND_RESTORED",
                is_demo=True,
            ),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── 3. Reimbursements & Expenses Endpoints ──────────────────────────

@router.get("/expenses/summary", response_model=APIResponse)
async def get_expense_summary(current_user: User = Depends(get_current_user)):
    """Returns expense reimbursement summary counts and amounts."""
    emp_code = _resolve_employee_code(current_user)
    summary = self_service_engine.get_expense_summary(emp_code)
    return APIResponse(
        success=True,
        data=summary,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="concur_adapter",
            data_status="VERIFIED_EXPENSES",
            is_demo=True,
        ),
    )


@router.get("/expenses/claims", response_model=APIResponse)
async def get_expense_claims(current_user: User = Depends(get_current_user)):
    """List reimbursement claims submitted by the authenticated employee."""
    emp_code = _resolve_employee_code(current_user)
    claims = self_service_engine.get_expense_claims(emp_code)
    return APIResponse(
        success=True,
        data=claims,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="concur_adapter",
            data_status="LIVE_CLAIMS",
            is_demo=True,
        ),
    )


@router.post("/expenses/claim", response_model=APIResponse)
async def submit_expense_claim(
    claim_req: ExpenseClaimCreate,
    current_user: User = Depends(get_current_user)
):
    """Submits a new reimbursement claim."""
    emp_code = _resolve_employee_code(current_user)
    try:
        new_claim = self_service_engine.submit_expense_claim(
            employee_code=emp_code,
            category=claim_req.category,
            expense_date_str=claim_req.expense_date,
            amount=claim_req.amount,
            merchant=claim_req.merchant,
            business_purpose=claim_req.business_purpose,
            receipt_filename=claim_req.receipt_filename,
            notes=claim_req.notes,
        )
        return APIResponse(
            success=True,
            data=new_claim,
            metadata=ResponseMetadata(
                timestamp=datetime.now(timezone.utc),
                source="expense_service",
                data_status="UNDER_REVIEW",
                is_demo=True,
            ),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/expenses/cancel/{claim_id}", response_model=APIResponse)
async def cancel_expense_claim(
    claim_id: str,
    current_user: User = Depends(get_current_user)
):
    """Cancels a pending expense claim."""
    emp_code = _resolve_employee_code(current_user)
    try:
        cancelled = self_service_engine.cancel_expense_claim(emp_code, claim_id)
        return APIResponse(
            success=True,
            data=cancelled,
            metadata=ResponseMetadata(
                timestamp=datetime.now(timezone.utc),
                source="expense_service",
                data_status="CANCELLED",
                is_demo=True,
            ),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


# ─── 4. Service Desk & Unified Requests Endpoints ────────────────────

@router.get("/requests", response_model=APIResponse)
async def get_service_requests(current_user: User = Depends(get_current_user)):
    """List service requests created by the authenticated employee."""
    emp_code = _resolve_employee_code(current_user)
    reqs = self_service_engine.get_service_requests(emp_code)
    return APIResponse(
        success=True,
        data=reqs,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="servicedesk_adapter",
            data_status="LIVE_TICKETS",
            is_demo=True,
        ),
    )


@router.post("/requests/create", response_model=APIResponse)
async def create_service_request(
    ticket_req: ServiceRequestCreate,
    current_user: User = Depends(get_current_user)
):
    """Creates a new internal service desk request."""
    emp_code = _resolve_employee_code(current_user)
    try:
        new_ticket = self_service_engine.create_service_request(
            employee_code=emp_code,
            category=ticket_req.category,
            subject=ticket_req.subject,
            description=ticket_req.description,
            priority=ticket_req.priority,
        )
        return APIResponse(
            success=True,
            data=new_ticket,
            metadata=ResponseMetadata(
                timestamp=datetime.now(timezone.utc),
                source="servicedesk_adapter",
                data_status="CREATED_AND_ASSIGNED",
                is_demo=True,
            ),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/requests/{ticket_id}/comment", response_model=APIResponse)
async def add_service_request_comment(
    ticket_id: str,
    payload: Dict[str, str],
    current_user: User = Depends(get_current_user)
):
    """Add a comment/response to an existing service ticket."""
    emp_code = _resolve_employee_code(current_user)
    comment = payload.get("message", "").strip()
    if not comment:
        raise HTTPException(status_code=400, detail="Comment message cannot be empty")

    try:
        updated = self_service_engine.add_service_request_comment(emp_code, ticket_id, comment)
        return APIResponse(
            success=True,
            data=updated,
            metadata=ResponseMetadata(
                timestamp=datetime.now(timezone.utc),
                source="servicedesk_adapter",
                data_status="COMMENT_ADDED",
                is_demo=True,
            ),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/activity", response_model=APIResponse)
async def get_activity_feed(current_user: User = Depends(get_current_user)):
    """Returns unified activity timeline across leaves, expenses, and service desk tickets."""
    emp_code = _resolve_employee_code(current_user)
    activities = self_service_engine.get_unified_activity(emp_code)
    return APIResponse(
        success=True,
        data=activities,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="self_service_engine",
            data_status="UNIFIED_TIMELINE",
            is_demo=True,
        ),
    )


# ─── 5. Manager Approvals Endpoints ──────────────────────────────────

@router.get("/approvals/pending", response_model=APIResponse)
async def get_pending_approvals(current_user: User = Depends(get_current_user)):
    """
    Returns pending leave and expense requests submitted by direct reportees.
    Only accessible to authorized managers or admins.
    """
    emp_code = _resolve_employee_code(current_user)
    try:
        items = self_service_engine.get_pending_approvals(emp_code)
        return APIResponse(
            success=True,
            data=items,
            metadata=ResponseMetadata(
                timestamp=datetime.now(timezone.utc),
                source="approvals_engine",
                data_status="PENDING_DECISION",
                is_demo=True,
            ),
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/approvals/decision", response_model=APIResponse)
async def process_approval_decision(
    decision_req: ApprovalDecisionRequest,
    current_user: User = Depends(get_current_user)
):
    """
    Process an approval decision (APPROVE, REJECT, or REQUEST_INFO).
    STRICTLY ENFORCES:
    1. Prevention of self-approval.
    2. Manager-reportee authorization checks.
    3. Audit logging of decision actor and rationale.
    """
    emp_code = _resolve_employee_code(current_user)
    try:
        res = self_service_engine.process_approval_decision(
            approver_code=emp_code,
            item_type=decision_req.item_type,
            item_id=decision_req.item_id,
            decision=decision_req.decision,
            comments=decision_req.comments,
        )
        return APIResponse(
            success=True,
            data=res,
            metadata=ResponseMetadata(
                timestamp=datetime.now(timezone.utc),
                source="approvals_engine",
                data_status="DECISION_PROCESSED_AND_AUDITED",
                is_demo=True,
            ),
        )
    except PermissionError as pe:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=status.HTTP_400_BAD_REQUEST, detail=str(ve))


# ─── 6. In-App Notifications Endpoints ───────────────────────────────

@router.get("/notifications", response_model=APIResponse)
async def get_notifications(current_user: User = Depends(get_current_user)):
    """Get in-app notifications for authenticated employee."""
    emp_code = _resolve_employee_code(current_user)
    notifs = self_service_engine.get_notifications(emp_code)
    return APIResponse(
        success=True,
        data=notifs,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="notification_service",
            data_status="DELIVERED",
            is_demo=True,
        ),
    )


@router.post("/notifications/{notif_id}/read", response_model=APIResponse)
async def mark_notification_read(
    notif_id: str,
    current_user: User = Depends(get_current_user)
):
    """Mark a notification as read."""
    emp_code = _resolve_employee_code(current_user)
    ok = self_service_engine.mark_notification_read(emp_code, notif_id)
    return APIResponse(
        success=ok,
        data={"read": ok},
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="notification_service",
            data_status="UPDATED",
            is_demo=True,
        ),
    )


# ─── 7. Enterprise Integration & Audit Endpoints (Admin) ─────────────

@router.get("/admin/integrations", response_model=APIResponse)
async def get_admin_integrations(current_user: User = Depends(get_current_user)):
    """Returns connectivity and configuration of enterprise integration adapters."""
    # Check admin/manager access
    emp_code = _resolve_employee_code(current_user)
    emp = self_service_engine.get_employee_by_id(emp_code)
    if emp and emp.get("role") not in ("ADMIN", "MANAGER"):
        raise HTTPException(status_code=403, detail="Administrator permissions required")

    integrations = self_service_engine.get_admin_integrations()
    return APIResponse(
        success=True,
        data=integrations,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="admin_subsystem",
            data_status="INTEGRATION_METADATA",
            is_demo=True,
        ),
    )


@router.get("/admin/audit-logs", response_model=APIResponse)
async def get_audit_logs(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user)
):
    """Returns system audit log entries."""
    emp_code = _resolve_employee_code(current_user)
    emp = self_service_engine.get_employee_by_id(emp_code)
    if emp and emp.get("role") not in ("ADMIN", "MANAGER"):
        raise HTTPException(status_code=403, detail="Administrator permissions required")

    logs = self_service_engine.get_audit_logs(limit)
    return APIResponse(
        success=True,
        data=logs,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="audit_subsystem",
            data_status="VERIFIED_AUDIT_TRAIL",
            is_demo=True,
        ),
    )


# ─── 8. AI Conversational Assistant (Intent Router + Personal Data) ──

@router.post("/assistant/query", response_model=APIResponse)
async def query_ai_assistant(
    payload: Dict[str, Any],
    current_user: User = Depends(get_current_user)
):
    """
    Intelligent Employee Assistant:
    1. Distinguishes personal employee-data questions ("What is my leave balance?")
       from general policy questions ("How do I apply for parental leave?").
    2. Resolves personal questions through live backend state with verifiable policy citations.
    3. Resolves policy questions through vector RAG groundings.
    """
    emp_code = _resolve_employee_code(current_user)
    question = payload.get("question", "").strip()
    if not question:
        raise HTTPException(status_code=400, detail="Query question cannot be empty")

    res = self_service_engine.answer_ai_query(emp_code, question)
    return APIResponse(
        success=True,
        data=res,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="dsp_ai_intent_copilot",
            data_status="GROUNDED_AI_RESPONSE",
            is_demo=True,
        ),
    )
