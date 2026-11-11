"""
DSP KnowledgeHub AI — Employee Onboarding API

Versioned REST endpoints for the complete onboarding module:
- Employee onboarding status and task management
- Document submission and review workflows
- HR workspace: template management, employee assignment, document review
- Manager and IT task views
- Onboarding-specific AI assistant
- In-app notifications

All endpoints require authentication. Role-based access is enforced
on the server side using the authenticated user identity.
"""

from datetime import datetime, timezone
from typing import Any, Dict, List, Optional

from fastapi import APIRouter, Depends, HTTPException, Query, status
import structlog

from app.core.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.schemas.schemas import APIResponse, ResponseMetadata
from app.schemas.onboarding_schemas import (
    TaskStatusUpdate,
    HRTaskReview,
    DocumentSubmitRequest,
    DocumentReviewRequest,
    OnboardingAssignRequest,
    OnboardingAIQueryRequest,
)
from app.services.onboarding_service import onboarding_engine

logger = structlog.get_logger()
router = APIRouter(prefix="/onboarding", tags=["Employee Onboarding"])


# ─── Helper: resolve employee code ────────────────────────────────────

_EMAIL_TO_EMP = {
    "aditi.sharma@dspamc.com": "EMP-1001",
    "rohan.mehta@dspamc.com": "EMP-1002",
    "priya.nair@dspamc.com": "EMP-1003",
    "vikram.malhotra@dspamc.com": "EMP-1004",
    "ananya.desai@dspamc.com": "EMP-1005",
    # New joiner demo accounts — these employees have onboarding instances
    "kavya.reddy@dspamc.com": "EMP-2001",
    "arjun.pillai@dspamc.com": "EMP-2002",
    "meera.kapoor@dspamc.com": "EMP-2003",
    "rahul.singh@dspamc.com": "EMP-2004",
    "sneha.joshi@dspamc.com": "EMP-2005",
}


def _resolve_emp_code(current_user: User) -> str:
    if getattr(current_user, "employee_code", None):
        return current_user.employee_code
    email = current_user.email.lower()
    return _EMAIL_TO_EMP.get(email, "EMP-1001")


def _is_hr_or_admin(current_user: User) -> bool:
    role = (current_user.role or "").upper()
    return role in ("ADMIN", "HR", "MANAGER", "COMPLIANCE")


def _require_hr_admin(current_user: User):
    if not _is_hr_or_admin(current_user):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="This action requires HR administrator or manager access."
        )


def _meta(source: str = "onboarding_engine", data_status: str = "SYNTHETIC_DEMO") -> ResponseMetadata:
    return ResponseMetadata(
        timestamp=datetime.now(timezone.utc),
        source=source,
        data_status=data_status,
        is_demo=True,
    )


# ─── 1. Employee Onboarding Dashboard ─────────────────────────────────

@router.get("/status", response_model=APIResponse)
async def get_my_onboarding_status(
    preview_emp_code: Optional[str] = Query(None, description="Employee code to preview (HR/Admin only)"),
    current_user: User = Depends(get_current_user),
):
    """
    Returns the authenticated employee's onboarding status.
    If the caller is HR/Admin, they can supply preview_emp_code to inspect
    any onboardee's view directly.
    """
    is_admin = _is_hr_or_admin(current_user)
    if preview_emp_code and is_admin:
        emp_code = preview_emp_code
    else:
        emp_code = _resolve_emp_code(current_user)

    instance = onboarding_engine.get_onboarding_instance(emp_code)

    # Demo personas for easy previewing by HR / managers
    demo_personas = [
        {"employee_code": "EMP-2001", "name": "Kavya Reddy", "stage": "PREBOARDING", "dept": "Equities & Wealth", "desc": "Preboarding (Joining in 3 days)"},
        {"employee_code": "EMP-2002", "name": "Arjun Pillai", "stage": "FIRST_WEEK", "dept": "Quant Strategies", "desc": "First Week (Orientation)"},
        {"employee_code": "EMP-2003", "name": "Meera Kapoor", "stage": "DAY_1", "dept": "Compliance", "desc": "Day 1 (Awaiting HR Review)"},
        {"employee_code": "EMP-2004", "name": "Rahul Singh", "stage": "FIRST_WEEK", "dept": "Technology", "desc": "First Week (Pending IT Access)"},
        {"employee_code": "EMP-2005", "name": "Sneha Joshi", "stage": "COMPLETED", "dept": "Risk & Ops", "desc": "30-Day Checklist Complete"},
    ]

    if not instance:
        # Existing employee / HR Admin — no personal active onboarding
        return APIResponse(
            success=True,
            data={
                "has_active_onboarding": False,
                "is_hr_admin": is_admin,
                "available_personas": demo_personas if is_admin else [],
                "message": (
                    f"You are logged in as {current_user.full_name or 'Administrator'} ({current_user.role or 'ADMIN'}). "
                    "Existing staff members do not have a personal onboarding checklist. "
                    "You can manage candidates in the HR Workspace or preview a candidate below."
                    if is_admin else
                    "You do not have an active onboarding plan. If you believe this is incorrect, please contact HR."
                ),
                "employee_code": emp_code,
            },
            metadata=_meta(data_status="NO_ACTIVE_ONBOARDING"),
        )

    tasks = onboarding_engine.get_tasks_for_employee(emp_code)
    summary = onboarding_engine.get_task_summary(emp_code)
    submissions = onboarding_engine.get_document_submissions(emp_code)

    return APIResponse(
        success=True,
        data={
            "has_active_onboarding": True,
            "is_preview": bool(preview_emp_code and is_admin),
            "is_hr_admin": is_admin,
            "available_personas": demo_personas if is_admin else [],
            "instance": instance,
            "task_summary": summary,
            "all_tasks": tasks,
            "document_submissions": submissions,
            "is_demo": True,
            "demo_notice": "SYNTHETIC DEMONSTRATION DATA — Not actual DSPAMC records.",
        },
        metadata=_meta(data_status="ONBOARDING_ACTIVE"),
    )


@router.get("/tasks", response_model=APIResponse)
async def get_my_onboarding_tasks(
    stage: Optional[str] = Query(None, description="Filter by stage: PREBOARDING, DAY_1, FIRST_WEEK, FIRST_30_DAYS"),
    current_user: User = Depends(get_current_user),
):
    """List onboarding tasks for the authenticated employee, optionally filtered by stage."""
    emp_code = _resolve_emp_code(current_user)
    tasks = onboarding_engine.get_tasks_for_employee(emp_code, stage=stage)
    summary = onboarding_engine.get_task_summary(emp_code)

    return APIResponse(
        success=True,
        data={"tasks": tasks, "summary": summary},
        metadata=_meta(data_status="TASK_LIST"),
    )


@router.post("/tasks/update", response_model=APIResponse)
async def update_my_task_status(
    req: TaskStatusUpdate,
    current_user: User = Depends(get_current_user),
):
    """
    Update the status of an onboarding task owned by the authenticated employee.
    Tasks requiring approval cannot be marked COMPLETED by employees directly.
    """
    emp_code = _resolve_emp_code(current_user)

    valid_statuses = ["NOT_STARTED", "IN_PROGRESS", "SUBMITTED_FOR_REVIEW", "ACTION_REQUIRED"]
    if req.new_status not in valid_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Employees may set task status to: {valid_statuses}. Contact HR for completion approval.",
        )

    try:
        updated = onboarding_engine.update_task_status(
            emp_code=emp_code,
            task_id=req.task_id,
            new_status=req.new_status,
            actor_code=emp_code,
            comments=req.comments,
            is_hr=False,
        )
        return APIResponse(
            success=True,
            data=updated,
            metadata=_meta(data_status="TASK_UPDATED"),
        )
    except PermissionError as pe:
        raise HTTPException(status_code=403, detail=str(pe))
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


# ─── 2. Document Submission ────────────────────────────────────────────

@router.post("/documents/submit", response_model=APIResponse)
async def submit_onboarding_document(
    req: DocumentSubmitRequest,
    current_user: User = Depends(get_current_user),
):
    """
    Record an onboarding document submission for the authenticated employee.
    In this demo environment, file content is not persisted (metadata only).
    Sensitive documents receive stronger access restriction labels.
    """
    emp_code = _resolve_emp_code(current_user)

    try:
        submission = onboarding_engine.submit_document(
            emp_code=emp_code,
            doc_type_id=req.doc_type_id,
            filename=req.filename,
            file_size_kb=req.file_size_kb,
        )
        return APIResponse(
            success=True,
            data={
                **submission,
                "access_note": (
                    "RESTRICTED — Sensitive document. Access restricted to authorized HR personnel only."
                    if submission.get("is_sensitive")
                    else "Document submitted for HR review."
                ),
            },
            metadata=_meta(data_status="DOCUMENT_SUBMITTED"),
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


@router.get("/documents", response_model=APIResponse)
async def get_my_document_submissions(current_user: User = Depends(get_current_user)):
    """
    Get document submissions for the authenticated employee only.
    Employees cannot access other employees' documents.
    """
    emp_code = _resolve_emp_code(current_user)
    submissions = onboarding_engine.get_document_submissions(emp_code)
    doc_types = onboarding_engine.get_document_types()

    return APIResponse(
        success=True,
        data={"submissions": submissions, "document_types": doc_types},
        metadata=_meta(data_status="DOCUMENT_LIST"),
    )


# ─── 3. Onboarding Notifications ──────────────────────────────────────

@router.get("/notifications", response_model=APIResponse)
async def get_onboarding_notifications(current_user: User = Depends(get_current_user)):
    """Get onboarding notifications for the authenticated employee."""
    emp_code = _resolve_emp_code(current_user)
    notifs = onboarding_engine.get_notifications(emp_code)

    return APIResponse(
        success=True,
        data=notifs,
        metadata=_meta(data_status="NOTIFICATIONS_DELIVERED"),
    )


@router.post("/notifications/{notif_id}/read", response_model=APIResponse)
async def mark_onboarding_notification_read(
    notif_id: str,
    current_user: User = Depends(get_current_user),
):
    """Mark an onboarding notification as read."""
    emp_code = _resolve_emp_code(current_user)
    ok = onboarding_engine.mark_notification_read(emp_code, notif_id)
    return APIResponse(
        success=ok,
        data={"read": ok, "notif_id": notif_id},
        metadata=_meta(data_status="NOTIFICATION_UPDATED"),
    )


# ─── 4. Onboarding AI Assistant ───────────────────────────────────────

@router.post("/assistant/query", response_model=APIResponse)
async def onboarding_ai_query(
    req: OnboardingAIQueryRequest,
    current_user: User = Depends(get_current_user),
):
    """
    AI assistant for onboarding queries.
    Retrieves real task status from the authenticated employee's onboarding record.
    Does NOT fabricate deadlines, completion states, or approvals.
    """
    emp_code = _resolve_emp_code(current_user)

    if not req.question.strip():
        raise HTTPException(status_code=400, detail="Question cannot be empty.")

    result = onboarding_engine.answer_onboarding_ai_query(emp_code, req.question)

    return APIResponse(
        success=True,
        data=result,
        metadata=_meta(source="dsp_onboarding_ai", data_status="GROUNDED_ONBOARDING_RESPONSE"),
    )


# ─── 5. HR Workspace Endpoints ────────────────────────────────────────

@router.get("/hr/employees", response_model=APIResponse)
async def hr_get_all_onboarding_employees(
    stage: Optional[str] = Query(None),
    department: Optional[str] = Query(None),
    current_user: User = Depends(get_current_user),
):
    """
    HR: Get all employees with onboarding plans.
    Requires ADMIN, HR, or MANAGER role.
    """
    _require_hr_admin(current_user)

    instances = onboarding_engine.get_all_instances_for_hr()

    if stage:
        instances = [i for i in instances if i.get("current_stage") == stage]
    if department:
        instances = [i for i in instances if department.lower() in i.get("department", "").lower()]

    return APIResponse(
        success=True,
        data={
            "employees": instances,
            "total": len(instances),
            "is_demo": True,
            "demo_notice": "SYNTHETIC DEMONSTRATION DATA — Not actual DSPAMC records.",
        },
        metadata=_meta(data_status="HR_EMPLOYEE_LIST"),
    )


@router.get("/hr/employee/{emp_code}/status", response_model=APIResponse)
async def hr_get_employee_onboarding_status(
    emp_code: str,
    current_user: User = Depends(get_current_user),
):
    """HR: Get full onboarding status for a specific employee."""
    _require_hr_admin(current_user)

    instance = onboarding_engine.get_onboarding_instance(emp_code)
    if not instance:
        raise HTTPException(status_code=404, detail=f"No onboarding record for {emp_code}")

    tasks = onboarding_engine.get_tasks_for_employee(emp_code)
    summary = onboarding_engine.get_task_summary(emp_code)
    submissions = onboarding_engine.get_document_submissions(emp_code)

    return APIResponse(
        success=True,
        data={
            "instance": instance,
            "task_summary": summary,
            "all_tasks": tasks,
            "document_submissions": submissions,
        },
        metadata=_meta(data_status="HR_EMPLOYEE_DETAIL"),
    )


@router.post("/hr/tasks/review", response_model=APIResponse)
async def hr_review_task(
    req: HRTaskReview,
    current_user: User = Depends(get_current_user),
):
    """
    HR/Manager: Review and update any onboarding task status.
    Only HR and managers may mark approval-required tasks as COMPLETED.
    """
    _require_hr_admin(current_user)
    actor_code = _resolve_emp_code(current_user)

    try:
        updated = onboarding_engine.update_task_status(
            emp_code=req.employee_code,
            task_id=req.task_id,
            new_status=req.new_status,
            actor_code=actor_code,
            comments=req.comments,
            is_hr=True,
        )
        return APIResponse(
            success=True,
            data=updated,
            metadata=_meta(data_status="HR_TASK_REVIEWED"),
        )
    except (ValueError, PermissionError) as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("/hr/documents/review", response_model=APIResponse)
async def hr_review_document(
    req: DocumentReviewRequest,
    current_user: User = Depends(get_current_user),
):
    """
    HR: Review a submitted document.
    Status options: VERIFIED, CORRECTION_REQUIRED, REJECTED.
    Action is audited.
    """
    _require_hr_admin(current_user)
    actor_code = _resolve_emp_code(current_user)
    actor_name = getattr(current_user, "full_name", None) or "HR Reviewer"

    valid_review_statuses = ["VERIFIED", "CORRECTION_REQUIRED", "REJECTED"]
    if req.new_status not in valid_review_statuses:
        raise HTTPException(
            status_code=400,
            detail=f"Document review status must be one of: {valid_review_statuses}"
        )

    try:
        updated = onboarding_engine.review_document(
            emp_code=req.employee_code,
            submission_id=req.submission_id,
            new_status=req.new_status,
            reviewer_code=actor_code,
            reviewer_name=actor_name,
            comments=req.comments,
        )
        return APIResponse(
            success=True,
            data=updated,
            metadata=_meta(data_status="DOCUMENT_REVIEWED_AND_AUDITED"),
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


@router.post("/hr/assign", response_model=APIResponse)
async def hr_assign_onboarding(
    req: OnboardingAssignRequest,
    current_user: User = Depends(get_current_user),
):
    """
    HR: Assign an onboarding plan to a new employee.
    Creates a full task set from the specified template.
    """
    _require_hr_admin(current_user)
    actor_code = _resolve_emp_code(current_user)
    actor_name = getattr(current_user, "full_name", None) or "HR Admin"

    try:
        instance = onboarding_engine.assign_onboarding_to_employee(
            emp_code=req.employee_code,
            full_name=req.full_name,
            email=req.email,
            department=req.department,
            designation=req.designation,
            joining_date_str=req.joining_date,
            template_id=req.template_id,
            manager_code=req.manager_code,
            manager_name=req.manager_name,
            buddy_code=req.buddy_code,
            buddy_name=req.buddy_name,
            hr_coordinator_code=actor_code,
            hr_coordinator_name=actor_name,
            assigned_by=actor_code,
        )
        return APIResponse(
            success=True,
            data=instance,
            metadata=_meta(data_status="ONBOARDING_ASSIGNED"),
        )
    except ValueError as ve:
        raise HTTPException(status_code=400, detail=str(ve))


@router.get("/hr/templates", response_model=APIResponse)
async def hr_get_templates(current_user: User = Depends(get_current_user)):
    """HR: Get all configured onboarding templates."""
    _require_hr_admin(current_user)
    templates = onboarding_engine.get_templates()
    return APIResponse(
        success=True,
        data=templates,
        metadata=_meta(data_status="TEMPLATE_LIST"),
    )


@router.get("/hr/document-types", response_model=APIResponse)
async def hr_get_document_types(current_user: User = Depends(get_current_user)):
    """HR: Get configured onboarding document types."""
    _require_hr_admin(current_user)
    doc_types = onboarding_engine.get_document_types()
    return APIResponse(
        success=True,
        data=doc_types,
        metadata=_meta(data_status="DOCUMENT_TYPE_LIST"),
    )


@router.get("/hr/audit-log", response_model=APIResponse)
async def hr_get_audit_log(
    limit: int = Query(50, ge=1, le=200),
    current_user: User = Depends(get_current_user),
):
    """HR/Admin: Get onboarding audit log."""
    _require_hr_admin(current_user)
    log = onboarding_engine.get_audit_log(limit)
    return APIResponse(
        success=True,
        data=log,
        metadata=_meta(data_status="AUDIT_LOG"),
    )


# ─── 6. Manager Task View ─────────────────────────────────────────────

@router.get("/manager/tasks", response_model=APIResponse)
async def manager_get_onboarding_tasks(current_user: User = Depends(get_current_user)):
    """
    Manager: View onboarding tasks assigned to the authenticated manager
    across all employees in their reporting structure.
    """
    _require_hr_admin(current_user)
    manager_code = _resolve_emp_code(current_user)
    tasks = onboarding_engine.get_manager_tasks(manager_code)

    return APIResponse(
        success=True,
        data=tasks,
        metadata=_meta(data_status="MANAGER_TASK_LIST"),
    )


# ─── 7. IT Task View ──────────────────────────────────────────────────

@router.get("/it/tasks", response_model=APIResponse)
async def it_get_onboarding_tasks(current_user: User = Depends(get_current_user)):
    """
    IT Support: View all IT-responsible onboarding tasks across all new joiners.
    Requires ADMIN or MANAGER role.
    """
    _require_hr_admin(current_user)
    tasks = onboarding_engine.get_it_tasks()

    return APIResponse(
        success=True,
        data=tasks,
        metadata=_meta(data_status="IT_TASK_LIST"),
    )


@router.post("/it/tasks/update", response_model=APIResponse)
async def it_update_task_status(
    req: HRTaskReview,
    current_user: User = Depends(get_current_user),
):
    """IT Support: Update an IT-responsible onboarding task status."""
    _require_hr_admin(current_user)
    actor_code = _resolve_emp_code(current_user)

    try:
        updated = onboarding_engine.update_task_status(
            emp_code=req.employee_code,
            task_id=req.task_id,
            new_status=req.new_status,
            actor_code=actor_code,
            comments=req.comments,
            is_hr=True,
        )
        return APIResponse(
            success=True,
            data=updated,
            metadata=_meta(data_status="IT_TASK_UPDATED"),
        )
    except (ValueError, PermissionError) as e:
        raise HTTPException(status_code=400, detail=str(e))
