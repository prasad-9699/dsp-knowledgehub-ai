"""
DSP KnowledgeHub AI — Employee Onboarding & Preboarding Service Engine

Provides complete onboarding workflow management for DSPAMC:
- Onboarding templates and stage configuration
- Employee onboarding instances and task tracking
- Document submission and HR review workflows
- Manager and IT task management
- Notification system for onboarding events
- AI assistant integration for onboarding queries

All demo data is explicitly synthetic. Persists to data/onboarding_db.json.
This module is a DEMONSTRATION DATASET and does not represent actual DSPAMC procedures.
"""

import json
import os
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional
import structlog

logger = structlog.get_logger()

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
ONBOARDING_DB_FILE = os.path.join(DATA_DIR, "onboarding_db.json")

# ─── Status constants ───────────────────────────────────────────────────
TASK_STATUS_NOT_STARTED = "NOT_STARTED"
TASK_STATUS_IN_PROGRESS = "IN_PROGRESS"
TASK_STATUS_SUBMITTED = "SUBMITTED_FOR_REVIEW"
TASK_STATUS_COMPLETED = "COMPLETED"
TASK_STATUS_ACTION_REQUIRED = "ACTION_REQUIRED"
TASK_STATUS_OVERDUE = "OVERDUE"

STAGE_PREBOARDING = "PREBOARDING"
STAGE_DAY_1 = "DAY_1"
STAGE_FIRST_WEEK = "FIRST_WEEK"
STAGE_FIRST_30_DAYS = "FIRST_30_DAYS"
STAGE_COMPLETED = "COMPLETED"

STAGE_ORDER = [
    STAGE_PREBOARDING,
    STAGE_DAY_1,
    STAGE_FIRST_WEEK,
    STAGE_FIRST_30_DAYS,
    STAGE_COMPLETED,
]

STAGE_LABELS = {
    STAGE_PREBOARDING: "Preboarding",
    STAGE_DAY_1: "Day 1",
    STAGE_FIRST_WEEK: "First Week",
    STAGE_FIRST_30_DAYS: "First 30 Days",
    STAGE_COMPLETED: "Onboarding Complete",
}


def _now_iso() -> str:
    return datetime.now(timezone.utc).isoformat()


def _today() -> date:
    return date.today()


def _date_str(d: date) -> str:
    return d.isoformat()


class OnboardingEngine:
    """
    State manager for employee onboarding platform.
    Seeds synthetic demo data and supports end-to-end onboarding workflows.
    """

    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        self.data: Dict[str, Any] = {}
        self.load_data()

    def load_data(self):
        if os.path.exists(ONBOARDING_DB_FILE):
            try:
                with open(ONBOARDING_DB_FILE, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
                    return
            except Exception as e:
                logger.error("Failed to load onboarding_db.json, re-seeding", error=str(e))

        self.seed_initial_data()
        self.save_data()

    def save_data(self):
        try:
            with open(ONBOARDING_DB_FILE, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2, default=str)
        except Exception as e:
            logger.error("Failed to write onboarding_db.json", error=str(e))

    def seed_initial_data(self):
        """Seed complete synthetic onboarding dataset for demonstration."""
        logger.info("Seeding synthetic DSPAMC onboarding dataset")

        today = _today()

        # ── Standard Onboarding Template ──────────────────────────────
        template_id = "TPL-OB-STANDARD-001"
        templates = {
            template_id: {
                "id": template_id,
                "name": "Standard Employee Onboarding — DSPAMC",
                "description": (
                    "DEMONSTRATION TEMPLATE — Illustrative onboarding tasks for DSPAMC. "
                    "Actual requirements must be configured by authorized HR administrators."
                ),
                "is_active": True,
                "department": "All",
                "created_by": "EMP-1005",
                "created_at": "2026-01-10T09:00:00+00:00",
                "updated_at": "2026-09-01T09:00:00+00:00",
                "stages": {
                    STAGE_PREBOARDING: {
                        "label": "Preboarding",
                        "description": "Tasks to complete before your joining date.",
                        "tasks": [
                            {
                                "id": "TASK-PRE-001",
                                "title": "Review onboarding instructions",
                                "description": (
                                    "Read the onboarding welcome packet and instructions "
                                    "sent by HR. Familiarise yourself with the schedule for your first day."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "EMPLOYEE",
                                "requires_document": False,
                                "days_offset": -7,
                            },
                            {
                                "id": "TASK-PRE-002",
                                "title": "Submit required employment documents",
                                "description": (
                                    "Upload the documents requested by HR for employment verification. "
                                    "See your document checklist for the specific items required."
                                ),
                                "is_required": True,
                                "requires_approval": True,
                                "responsible_party": "EMPLOYEE",
                                "requires_document": True,
                                "days_offset": -5,
                            },
                            {
                                "id": "TASK-PRE-003",
                                "title": "Review and acknowledge applicable policies",
                                "description": (
                                    "Review the Employee Handbook, Code of Conduct, and IT Acceptable "
                                    "Use Policy. Submit the signed acknowledgement form."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "EMPLOYEE",
                                "requires_document": True,
                                "days_offset": -3,
                            },
                            {
                                "id": "TASK-PRE-004",
                                "title": "Confirm joining details with HR",
                                "description": (
                                    "Confirm your joining date, reporting time, and office location "
                                    "with your assigned HR coordinator."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "EMPLOYEE",
                                "requires_document": False,
                                "days_offset": -2,
                            },
                            {
                                "id": "TASK-PRE-005",
                                "title": "HR: Prepare joining kit and workstation",
                                "description": (
                                    "HR to prepare welcome kit, ID card request, and confirm "
                                    "workstation assignment before joining date."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "HR",
                                "requires_document": False,
                                "days_offset": -1,
                            },
                            {
                                "id": "TASK-PRE-006",
                                "title": "IT: Create system accounts",
                                "description": (
                                    "IT to create email, network, and system accounts "
                                    "for the new employee before joining date."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "IT",
                                "requires_document": False,
                                "days_offset": -1,
                            },
                        ],
                    },
                    STAGE_DAY_1: {
                        "label": "Day 1",
                        "description": "Joining formalities and initial orientation.",
                        "tasks": [
                            {
                                "id": "TASK-D1-001",
                                "title": "Complete joining formalities with HR",
                                "description": (
                                    "Submit any remaining original documents, sign the appointment "
                                    "letter, and complete HR joining formalities."
                                ),
                                "is_required": True,
                                "requires_approval": True,
                                "responsible_party": "HR",
                                "requires_document": True,
                                "days_offset": 0,
                            },
                            {
                                "id": "TASK-D1-002",
                                "title": "Attend orientation session",
                                "description": (
                                    "Attend the mandatory new employee orientation covering DSPAMC's "
                                    "mission, values, organizational structure, and key policies."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "HR",
                                "requires_document": False,
                                "days_offset": 0,
                            },
                            {
                                "id": "TASK-D1-003",
                                "title": "Receive assigned equipment",
                                "description": (
                                    "Collect or confirm receipt of your assigned laptop, "
                                    "access card, and any role-specific equipment."
                                ),
                                "is_required": True,
                                "requires_approval": True,
                                "responsible_party": "IT",
                                "requires_document": False,
                                "days_offset": 0,
                            },
                            {
                                "id": "TASK-D1-004",
                                "title": "Complete IT account and access setup",
                                "description": (
                                    "Set up email, VPN, Microsoft Authenticator 2FA, and access "
                                    "the ServiceHub portal. Log the completion through the IT team."
                                ),
                                "is_required": True,
                                "requires_approval": True,
                                "responsible_party": "IT",
                                "requires_document": False,
                                "days_offset": 0,
                            },
                            {
                                "id": "TASK-D1-005",
                                "title": "Review workplace and security guidelines",
                                "description": (
                                    "Review the workplace safety, physical security access, "
                                    "and emergency procedure guidelines."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "EMPLOYEE",
                                "requires_document": False,
                                "days_offset": 0,
                            },
                            {
                                "id": "TASK-D1-006",
                                "title": "Manager: Introduce employee to team",
                                "description": (
                                    "Reporting manager to introduce the new employee to their "
                                    "immediate team and key stakeholders."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "MANAGER",
                                "requires_document": False,
                                "days_offset": 0,
                            },
                        ],
                    },
                    STAGE_FIRST_WEEK: {
                        "label": "First Week",
                        "description": "Orientation, system access, and initial role exposure.",
                        "tasks": [
                            {
                                "id": "TASK-W1-001",
                                "title": "Complete assigned introductory training",
                                "description": (
                                    "Complete the assigned introductory training modules available "
                                    "on the DSP Learning Portal."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "EMPLOYEE",
                                "requires_document": False,
                                "days_offset": 5,
                            },
                            {
                                "id": "TASK-W1-002",
                                "title": "Meet reporting manager and team",
                                "description": (
                                    "Schedule and attend one-on-one introductory meetings with "
                                    "your reporting manager and key team members."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "EMPLOYEE",
                                "requires_document": False,
                                "days_offset": 3,
                            },
                            {
                                "id": "TASK-W1-003",
                                "title": "Review role-specific documentation",
                                "description": (
                                    "Review the role-specific process guides, team SOPs, and "
                                    "regulatory documentation relevant to your position."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "EMPLOYEE",
                                "requires_document": False,
                                "days_offset": 5,
                            },
                            {
                                "id": "TASK-W1-004",
                                "title": "Complete security awareness training",
                                "description": (
                                    "Complete the mandatory information security awareness training "
                                    "covering data handling, phishing awareness, and clean desk policy."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "EMPLOYEE",
                                "requires_document": False,
                                "days_offset": 5,
                            },
                            {
                                "id": "TASK-W1-005",
                                "title": "Confirm access to required internal systems",
                                "description": (
                                    "Verify and confirm that you have access to all systems required "
                                    "for your role. Raise any access issues through ServiceHub."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "EMPLOYEE",
                                "requires_document": False,
                                "days_offset": 5,
                            },
                        ],
                    },
                    STAGE_FIRST_30_DAYS: {
                        "label": "First 30 Days",
                        "description": "Training, role familiarization, and feedback.",
                        "tasks": [
                            {
                                "id": "TASK-30D-001",
                                "title": "Complete assigned learning modules",
                                "description": (
                                    "Complete all mandatory learning modules assigned to your role "
                                    "on the DSP Learning Portal within your first 30 days."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "EMPLOYEE",
                                "requires_document": False,
                                "days_offset": 25,
                            },
                            {
                                "id": "TASK-30D-002",
                                "title": "Review role-specific processes",
                                "description": (
                                    "Shadow and review the core workflows and processes relevant "
                                    "to your role with your team and manager."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "EMPLOYEE",
                                "requires_document": False,
                                "days_offset": 20,
                            },
                            {
                                "id": "TASK-30D-003",
                                "title": "Attend scheduled check-ins with manager",
                                "description": (
                                    "Attend all scheduled check-in meetings with your reporting "
                                    "manager during the first 30 days."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "MANAGER",
                                "requires_document": False,
                                "days_offset": 30,
                            },
                            {
                                "id": "TASK-30D-004",
                                "title": "Submit onboarding feedback form",
                                "description": (
                                    "Complete the onboarding experience feedback survey to help HR "
                                    "improve the onboarding process."
                                ),
                                "is_required": True,
                                "requires_approval": False,
                                "responsible_party": "EMPLOYEE",
                                "requires_document": False,
                                "days_offset": 30,
                            },
                            {
                                "id": "TASK-30D-005",
                                "title": "Manager: Conduct initial performance review",
                                "description": (
                                    "Reporting manager to conduct a 30-day initial review meeting, "
                                    "record observations, and submit the review form."
                                ),
                                "is_required": True,
                                "requires_approval": True,
                                "responsible_party": "MANAGER",
                                "requires_document": True,
                                "days_offset": 30,
                            },
                        ],
                    },
                },
            }
        }

        # ── Document Types ─────────────────────────────────────────────
        document_types = {
            "DOC-TYPE-001": {
                "id": "DOC-TYPE-001",
                "name": "Appointment Letter Acknowledgement",
                "description": "Signed acknowledgement of the appointment letter.",
                "is_sensitive": False,
                "allowed_formats": ["pdf"],
                "max_size_mb": 5,
                "required_for_stages": [STAGE_DAY_1],
            },
            "DOC-TYPE-002": {
                "id": "DOC-TYPE-002",
                "name": "Educational Qualification Certificates",
                "description": "Scanned copies of degree / diploma certificates.",
                "is_sensitive": False,
                "allowed_formats": ["pdf", "jpg", "jpeg", "png"],
                "max_size_mb": 10,
                "required_for_stages": [STAGE_PREBOARDING],
            },
            "DOC-TYPE-003": {
                "id": "DOC-TYPE-003",
                "name": "Previous Employment Experience Letter",
                "description": "Relieving or experience letter from previous employer.",
                "is_sensitive": False,
                "allowed_formats": ["pdf"],
                "max_size_mb": 5,
                "required_for_stages": [STAGE_PREBOARDING],
            },
            "DOC-TYPE-004": {
                "id": "DOC-TYPE-004",
                "name": "Policy Acknowledgement Form",
                "description": "Signed acknowledgement of reviewed HR policies.",
                "is_sensitive": False,
                "allowed_formats": ["pdf"],
                "max_size_mb": 5,
                "required_for_stages": [STAGE_PREBOARDING],
            },
            "DOC-TYPE-005": {
                "id": "DOC-TYPE-005",
                "name": "Bank Account Details Form",
                "description": "Bank account details for salary credit. RESTRICTED ACCESS.",
                "is_sensitive": True,
                "allowed_formats": ["pdf"],
                "max_size_mb": 5,
                "required_for_stages": [STAGE_DAY_1],
            },
            "DOC-TYPE-006": {
                "id": "DOC-TYPE-006",
                "name": "30-Day Manager Review Form",
                "description": "Manager's initial performance review at 30 days.",
                "is_sensitive": False,
                "allowed_formats": ["pdf"],
                "max_size_mb": 5,
                "required_for_stages": [STAGE_FIRST_30_DAYS],
            },
        }

        # ── Employee Onboarding Instances ─────────────────────────────
        joining_not_started = _date_str(today + timedelta(days=3))
        joining_preboarding = _date_str(today + timedelta(days=1))
        joining_doc_review = _date_str(today)
        joining_it_request = _date_str(today - timedelta(days=6))
        joining_completed = _date_str(today - timedelta(days=35))

        onboarding_instances = {
            # Persona 1: Has not started (joining in 3 days)
            "EMP-2001": {
                "employee_code": "EMP-2001",
                "full_name": "Kavya Reddy",
                "email": "kavya.reddy@dspamc.com",
                "department": "Fixed Income & Debt Markets",
                "designation": "Fixed Income Analyst",
                "role": "EMPLOYEE",
                "joining_date": joining_not_started,
                "current_stage": STAGE_PREBOARDING,
                "template_id": template_id,
                "hr_coordinator_code": "EMP-1005",
                "hr_coordinator_name": "Ananya Desai",
                "manager_code": "EMP-1004",
                "manager_name": "Vikram Malhotra",
                "buddy_code": "EMP-1001",
                "buddy_name": "Aditi Sharma",
                "avatar_initials": "KR",
                "is_demo": True,
                "assigned_at": _now_iso(),
                "overall_completion_pct": 0,
            },
            # Persona 2: Partially completed preboarding
            "EMP-2002": {
                "employee_code": "EMP-2002",
                "full_name": "Arjun Pillai",
                "email": "arjun.pillai@dspamc.com",
                "department": "Technology & Innovation",
                "designation": "Software Engineer — FinTech",
                "role": "EMPLOYEE",
                "joining_date": joining_preboarding,
                "current_stage": STAGE_PREBOARDING,
                "template_id": template_id,
                "hr_coordinator_code": "EMP-1005",
                "hr_coordinator_name": "Ananya Desai",
                "manager_code": "EMP-1004",
                "manager_name": "Vikram Malhotra",
                "buddy_code": "EMP-1002",
                "buddy_name": "Rohan Mehta",
                "avatar_initials": "AP",
                "is_demo": True,
                "assigned_at": _now_iso(),
                "overall_completion_pct": 25,
            },
            # Persona 3: Awaiting HR document review (joined today)
            "EMP-2003": {
                "employee_code": "EMP-2003",
                "full_name": "Meera Kapoor",
                "email": "meera.kapoor@dspamc.com",
                "department": "Risk Management",
                "designation": "Risk Analyst",
                "role": "EMPLOYEE",
                "joining_date": joining_doc_review,
                "current_stage": STAGE_DAY_1,
                "template_id": template_id,
                "hr_coordinator_code": "EMP-1005",
                "hr_coordinator_name": "Ananya Desai",
                "manager_code": "EMP-1004",
                "manager_name": "Vikram Malhotra",
                "buddy_code": "EMP-1003",
                "buddy_name": "Priya Nair",
                "avatar_initials": "MK",
                "is_demo": True,
                "assigned_at": _now_iso(),
                "overall_completion_pct": 45,
            },
            # Persona 4: Outstanding IT request (first week in progress)
            "EMP-2004": {
                "employee_code": "EMP-2004",
                "full_name": "Rahul Singh",
                "email": "rahul.singh@dspamc.com",
                "department": "Equities & Wealth Management",
                "designation": "Investment Analyst",
                "role": "EMPLOYEE",
                "joining_date": joining_it_request,
                "current_stage": STAGE_FIRST_WEEK,
                "template_id": template_id,
                "hr_coordinator_code": "EMP-1005",
                "hr_coordinator_name": "Ananya Desai",
                "manager_code": "EMP-1004",
                "manager_name": "Vikram Malhotra",
                "buddy_code": "EMP-1001",
                "buddy_name": "Aditi Sharma",
                "avatar_initials": "RS",
                "is_demo": True,
                "assigned_at": _now_iso(),
                "overall_completion_pct": 60,
            },
            # Persona 5: Completed onboarding
            "EMP-2005": {
                "employee_code": "EMP-2005",
                "full_name": "Sneha Joshi",
                "email": "sneha.joshi@dspamc.com",
                "department": "Research & Analysis",
                "designation": "Research Analyst",
                "role": "EMPLOYEE",
                "joining_date": joining_completed,
                "current_stage": STAGE_COMPLETED,
                "template_id": template_id,
                "hr_coordinator_code": "EMP-1005",
                "hr_coordinator_name": "Ananya Desai",
                "manager_code": "EMP-1004",
                "manager_name": "Vikram Malhotra",
                "buddy_code": "EMP-1001",
                "buddy_name": "Aditi Sharma",
                "avatar_initials": "SJ",
                "is_demo": True,
                "assigned_at": _now_iso(),
                "completed_at": _date_str(today - timedelta(days=5)),
                "overall_completion_pct": 100,
            },
        }

        # ── Task Instances (per employee) ─────────────────────────────
        def make_task(
            inst_id: str,
            template_task: dict,
            stage: str,
            emp_code: str,
            joining_date_str: str,
            status: str,
            completed_at: Optional[str] = None,
            hr_comments: Optional[str] = None,
            employee_comments: Optional[str] = None,
        ) -> dict:
            joining = date.fromisoformat(joining_date_str)
            days_offset = template_task.get("days_offset", 0)
            due_date = joining + timedelta(days=days_offset)
            overdue = status not in (TASK_STATUS_COMPLETED,) and due_date < today

            return {
                "id": inst_id,
                "task_template_id": template_task["id"],
                "employee_code": emp_code,
                "stage": stage,
                "title": template_task["title"],
                "description": template_task["description"],
                "is_required": template_task["is_required"],
                "requires_approval": template_task["requires_approval"],
                "responsible_party": template_task["responsible_party"],
                "requires_document": template_task["requires_document"],
                "due_date": _date_str(due_date),
                "status": TASK_STATUS_OVERDUE if overdue and status == TASK_STATUS_NOT_STARTED else status,
                "completed_at": completed_at,
                "hr_comments": hr_comments,
                "employee_comments": employee_comments,
                "created_at": _now_iso(),
                "updated_at": _now_iso(),
                "status_history": [
                    {
                        "status": TASK_STATUS_NOT_STARTED,
                        "changed_at": _now_iso(),
                        "changed_by": "SYSTEM",
                        "comments": "Task created",
                    }
                ],
            }

        # Persona 1: Not started — all tasks NOT_STARTED
        def _tid(emp: str, n: int) -> str:
            return f"OINST-{emp}-{n:04d}"

        emp2001_tasks = {}
        i = 1
        for stage in [STAGE_PREBOARDING, STAGE_DAY_1, STAGE_FIRST_WEEK, STAGE_FIRST_30_DAYS]:
            tpl_stage = templates[template_id]["stages"][stage]
            for t in tpl_stage["tasks"]:
                tid = _tid("2001", i)
                emp2001_tasks[tid] = make_task(tid, t, stage, "EMP-2001", joining_not_started, TASK_STATUS_NOT_STARTED)
                i += 1

        # Persona 2: Partially done preboarding
        emp2002_tasks = {}
        i = 1
        pre_tasks = templates[template_id]["stages"][STAGE_PREBOARDING]["tasks"]
        # Task 0 = Completed, Task 1 = Submitted, others Not Started
        pre_statuses = [TASK_STATUS_COMPLETED, TASK_STATUS_SUBMITTED, TASK_STATUS_NOT_STARTED,
                        TASK_STATUS_NOT_STARTED, TASK_STATUS_NOT_STARTED, TASK_STATUS_NOT_STARTED]
        for idx, t in enumerate(pre_tasks):
            tid = _tid("2002", i)
            emp2002_tasks[tid] = make_task(
                tid, t, STAGE_PREBOARDING, "EMP-2002", joining_preboarding,
                pre_statuses[idx],
                completed_at=_now_iso() if pre_statuses[idx] == TASK_STATUS_COMPLETED else None,
            )
            i += 1
        for stage in [STAGE_DAY_1, STAGE_FIRST_WEEK, STAGE_FIRST_30_DAYS]:
            for t in templates[template_id]["stages"][stage]["tasks"]:
                tid = _tid("2002", i)
                emp2002_tasks[tid] = make_task(tid, t, stage, "EMP-2002", joining_preboarding, TASK_STATUS_NOT_STARTED)
                i += 1

        # Persona 3: Day 1 tasks, some completed, document awaiting HR review
        emp2003_tasks = {}
        i = 1
        for t in templates[template_id]["stages"][STAGE_PREBOARDING]["tasks"]:
            tid = _tid("2003", i)
            emp2003_tasks[tid] = make_task(
                tid, t, STAGE_PREBOARDING, "EMP-2003", joining_doc_review,
                TASK_STATUS_COMPLETED,
                completed_at=_date_str(today - timedelta(days=2)),
            )
            i += 1
        d1_statuses = [TASK_STATUS_SUBMITTED, TASK_STATUS_COMPLETED, TASK_STATUS_IN_PROGRESS,
                       TASK_STATUS_NOT_STARTED, TASK_STATUS_COMPLETED, TASK_STATUS_COMPLETED]
        for idx, t in enumerate(templates[template_id]["stages"][STAGE_DAY_1]["tasks"]):
            tid = _tid("2003", i)
            emp2003_tasks[tid] = make_task(
                tid, t, STAGE_DAY_1, "EMP-2003", joining_doc_review,
                d1_statuses[idx],
                hr_comments="Pending HR review of submitted documents." if d1_statuses[idx] == TASK_STATUS_SUBMITTED else None,
            )
            i += 1
        for stage in [STAGE_FIRST_WEEK, STAGE_FIRST_30_DAYS]:
            for t in templates[template_id]["stages"][stage]["tasks"]:
                tid = _tid("2003", i)
                emp2003_tasks[tid] = make_task(tid, t, stage, "EMP-2003", joining_doc_review, TASK_STATUS_NOT_STARTED)
                i += 1

        # Persona 4: First week in progress, outstanding IT request
        emp2004_tasks = {}
        i = 1
        for stage in [STAGE_PREBOARDING, STAGE_DAY_1]:
            for t in templates[template_id]["stages"][stage]["tasks"]:
                tid = _tid("2004", i)
                emp2004_tasks[tid] = make_task(
                    tid, t, stage, "EMP-2004", joining_it_request,
                    TASK_STATUS_COMPLETED,
                    completed_at=_date_str(today - timedelta(days=5)),
                )
                i += 1
        w1_statuses = [TASK_STATUS_COMPLETED, TASK_STATUS_COMPLETED,
                       TASK_STATUS_IN_PROGRESS, TASK_STATUS_NOT_STARTED, TASK_STATUS_ACTION_REQUIRED]
        for idx, t in enumerate(templates[template_id]["stages"][STAGE_FIRST_WEEK]["tasks"]):
            tid = _tid("2004", i)
            emp2004_tasks[tid] = make_task(
                tid, t, STAGE_FIRST_WEEK, "EMP-2004", joining_it_request,
                w1_statuses[idx],
                hr_comments="IT access to Bloomberg terminal pending provisioning." if w1_statuses[idx] == TASK_STATUS_ACTION_REQUIRED else None,
            )
            i += 1
        for t in templates[template_id]["stages"][STAGE_FIRST_30_DAYS]["tasks"]:
            tid = _tid("2004", i)
            emp2004_tasks[tid] = make_task(tid, t, STAGE_FIRST_30_DAYS, "EMP-2004", joining_it_request, TASK_STATUS_NOT_STARTED)
            i += 1

        # Persona 5: All tasks completed
        emp2005_tasks = {}
        i = 1
        for stage in [STAGE_PREBOARDING, STAGE_DAY_1, STAGE_FIRST_WEEK, STAGE_FIRST_30_DAYS]:
            for t in templates[template_id]["stages"][stage]["tasks"]:
                tid = _tid("2005", i)
                emp2005_tasks[tid] = make_task(
                    tid, t, stage, "EMP-2005", joining_completed,
                    TASK_STATUS_COMPLETED,
                    completed_at=_date_str(today - timedelta(days=30 - (i % 30))),
                )
                i += 1

        task_instances = {
            "EMP-2001": emp2001_tasks,
            "EMP-2002": emp2002_tasks,
            "EMP-2003": emp2003_tasks,
            "EMP-2004": emp2004_tasks,
            "EMP-2005": emp2005_tasks,
        }

        # ── Document Submissions ───────────────────────────────────────
        document_submissions = {
            "EMP-2002": [
                {
                    "id": "DOCSUBM-2002-001",
                    "employee_code": "EMP-2002",
                    "doc_type_id": "DOC-TYPE-001",
                    "doc_type_name": "Appointment Letter Acknowledgement",
                    "filename": "appointment_letter_signed.pdf",
                    "file_size_kb": 145,
                    "is_sensitive": False,
                    "status": "SUBMITTED",
                    "submitted_at": _now_iso(),
                    "hr_reviewer_code": None,
                    "hr_reviewer_name": None,
                    "review_comments": None,
                    "reviewed_at": None,
                    "is_demo": True,
                },
            ],
            "EMP-2003": [
                {
                    "id": "DOCSUBM-2003-001",
                    "employee_code": "EMP-2003",
                    "doc_type_id": "DOC-TYPE-002",
                    "doc_type_name": "Educational Qualification Certificates",
                    "filename": "degree_certificate.pdf",
                    "file_size_kb": 890,
                    "is_sensitive": False,
                    "status": "SUBMITTED",
                    "submitted_at": _date_str(today - timedelta(days=2)),
                    "hr_reviewer_code": None,
                    "hr_reviewer_name": None,
                    "review_comments": None,
                    "reviewed_at": None,
                    "is_demo": True,
                },
                {
                    "id": "DOCSUBM-2003-002",
                    "employee_code": "EMP-2003",
                    "doc_type_id": "DOC-TYPE-003",
                    "doc_type_name": "Previous Employment Experience Letter",
                    "filename": "experience_letter.pdf",
                    "file_size_kb": 310,
                    "is_sensitive": False,
                    "status": "CORRECTION_REQUIRED",
                    "submitted_at": _date_str(today - timedelta(days=2)),
                    "hr_reviewer_code": "EMP-1005",
                    "hr_reviewer_name": "Ananya Desai",
                    "review_comments": "Please resubmit with the correct document — the uploaded file appears to be from the wrong employer. Please upload the letter from your most recent employer.",
                    "reviewed_at": _now_iso(),
                    "is_demo": True,
                },
                {
                    "id": "DOCSUBM-2003-003",
                    "employee_code": "EMP-2003",
                    "doc_type_id": "DOC-TYPE-004",
                    "doc_type_name": "Policy Acknowledgement Form",
                    "filename": "policy_acknowledgement.pdf",
                    "file_size_kb": 220,
                    "is_sensitive": False,
                    "status": "VERIFIED",
                    "submitted_at": _date_str(today - timedelta(days=3)),
                    "hr_reviewer_code": "EMP-1005",
                    "hr_reviewer_name": "Ananya Desai",
                    "review_comments": "Verified. Acknowledgement received and recorded.",
                    "reviewed_at": _date_str(today - timedelta(days=1)),
                    "is_demo": True,
                },
            ],
            "EMP-2004": [
                {
                    "id": "DOCSUBM-2004-001",
                    "employee_code": "EMP-2004",
                    "doc_type_id": "DOC-TYPE-001",
                    "doc_type_name": "Appointment Letter Acknowledgement",
                    "filename": "appointment_signed.pdf",
                    "file_size_kb": 189,
                    "is_sensitive": False,
                    "status": "VERIFIED",
                    "submitted_at": _date_str(today - timedelta(days=6)),
                    "hr_reviewer_code": "EMP-1005",
                    "hr_reviewer_name": "Ananya Desai",
                    "review_comments": "Verified and recorded.",
                    "reviewed_at": _date_str(today - timedelta(days=5)),
                    "is_demo": True,
                },
            ],
            "EMP-2005": [
                {
                    "id": "DOCSUBM-2005-001",
                    "employee_code": "EMP-2005",
                    "doc_type_id": "DOC-TYPE-006",
                    "doc_type_name": "30-Day Manager Review Form",
                    "filename": "30day_review_sneha_joshi.pdf",
                    "file_size_kb": 450,
                    "is_sensitive": False,
                    "status": "VERIFIED",
                    "submitted_at": _date_str(today - timedelta(days=6)),
                    "hr_reviewer_code": "EMP-1005",
                    "hr_reviewer_name": "Ananya Desai",
                    "review_comments": "30-day review recorded. Onboarding marked complete.",
                    "reviewed_at": _date_str(today - timedelta(days=5)),
                    "is_demo": True,
                },
            ],
        }

        # ── Notifications ─────────────────────────────────────────────
        notifications = {
            "EMP-2001": [
                {
                    "id": "NOTIF-2001-001",
                    "employee_code": "EMP-2001",
                    "type": "TASK_ASSIGNED",
                    "title": "Onboarding tasks assigned",
                    "message": "Your onboarding plan has been set up. You have tasks to complete before your joining date of " + joining_not_started + ". Please review your onboarding checklist.",
                    "link_path": "/onboarding",
                    "created_at": _now_iso(),
                    "is_read": False,
                    "is_demo": True,
                },
            ],
            "EMP-2002": [
                {
                    "id": "NOTIF-2002-001",
                    "employee_code": "EMP-2002",
                    "type": "TASK_DEADLINE",
                    "title": "Document submission due soon",
                    "message": "Your employment document submission is due before your joining date. Please complete this task to avoid delays.",
                    "link_path": "/onboarding",
                    "created_at": _now_iso(),
                    "is_read": False,
                    "is_demo": True,
                },
            ],
            "EMP-2003": [
                {
                    "id": "NOTIF-2003-001",
                    "employee_code": "EMP-2003",
                    "type": "DOCUMENT_CORRECTION",
                    "title": "Document correction required",
                    "message": "HR has requested a correction for your Previous Employment Experience Letter. Please review the HR comments and resubmit the correct document.",
                    "link_path": "/onboarding",
                    "created_at": _now_iso(),
                    "is_read": False,
                    "is_demo": True,
                },
                {
                    "id": "NOTIF-2003-002",
                    "employee_code": "EMP-2003",
                    "type": "DOCUMENT_VERIFIED",
                    "title": "Policy Acknowledgement verified",
                    "message": "Your Policy Acknowledgement Form has been verified by HR.",
                    "link_path": "/onboarding",
                    "created_at": _date_str(today - timedelta(days=1)),
                    "is_read": True,
                    "is_demo": True,
                },
            ],
            "EMP-2004": [
                {
                    "id": "NOTIF-2004-001",
                    "employee_code": "EMP-2004",
                    "type": "TASK_ACTION_REQUIRED",
                    "title": "IT access pending — action required",
                    "message": "Your Bloomberg terminal access request is pending IT provisioning. Please follow up with the IT team via ServiceHub if this is impacting your work.",
                    "link_path": "/onboarding",
                    "created_at": _now_iso(),
                    "is_read": False,
                    "is_demo": True,
                },
            ],
            "EMP-2005": [
                {
                    "id": "NOTIF-2005-001",
                    "employee_code": "EMP-2005",
                    "type": "ONBOARDING_COMPLETED",
                    "title": "Onboarding complete!",
                    "message": "Congratulations! Your onboarding is complete. Welcome to the DSPAMC team!",
                    "link_path": "/",
                    "created_at": _date_str(today - timedelta(days=5)),
                    "is_read": True,
                    "is_demo": True,
                },
            ],
        }

        # ── HR Notifications for Existing Employees ───────────────────
        hr_notifications = {
            "EMP-1005": [  # Ananya Desai — Admin/HR
                {
                    "id": "HRNOTIF-1005-001",
                    "employee_code": "EMP-1005",
                    "type": "HR_DOCUMENT_SUBMITTED",
                    "title": "New document submission — Kavya Reddy",
                    "message": "Arjun Pillai has submitted an Appointment Letter Acknowledgement for your review.",
                    "link_path": "/onboarding/hr",
                    "created_at": _now_iso(),
                    "is_read": False,
                    "is_demo": True,
                },
                {
                    "id": "HRNOTIF-1005-002",
                    "employee_code": "EMP-1005",
                    "type": "HR_DOCUMENT_SUBMITTED",
                    "title": "Document awaiting review — Meera Kapoor",
                    "message": "Meera Kapoor has submitted onboarding documents for review. The experience letter requires correction.",
                    "link_path": "/onboarding/hr",
                    "created_at": _now_iso(),
                    "is_read": False,
                    "is_demo": True,
                },
            ],
        }

        # Merge HR notifications into employee notifications
        notifications.update(hr_notifications)

        self.data = {
            "is_demo": True,
            "demo_notice": (
                "SYNTHETIC DEMONSTRATION DATA — All employees, tasks, documents, and "
                "onboarding details in this dataset are fictional. This is not an official "
                "DSPAMC onboarding record. HR administrators must configure actual "
                "requirements for production use."
            ),
            "templates": templates,
            "document_types": document_types,
            "onboarding_instances": onboarding_instances,
            "task_instances": task_instances,
            "document_submissions": document_submissions,
            "notifications": notifications,
            "audit_log": [],
        }

        # Recalculate completion percentages from actual task states
        for emp_code in onboarding_instances:
            self._recalculate_completion(emp_code)

    # ─── Internal Helpers ────────────────────────────────────────────

    def _get_instance(self, emp_code: str) -> Optional[Dict]:
        return self.data.get("onboarding_instances", {}).get(emp_code)

    def _get_tasks(self, emp_code: str) -> Dict:
        return self.data.get("task_instances", {}).get(emp_code, {})

    def _get_submissions(self, emp_code: str) -> List:
        return self.data.get("document_submissions", {}).get(emp_code, [])

    def _get_notifications(self, emp_code: str) -> List:
        return self.data.get("notifications", {}).get(emp_code, [])

    def _recalculate_completion(self, emp_code: str):
        """Recalculate overall completion % from actual task states."""
        tasks = list(self._get_tasks(emp_code).values())
        if not tasks:
            return
        total = len(tasks)
        completed = sum(1 for t in tasks if t["status"] == TASK_STATUS_COMPLETED)
        pct = round((completed / total) * 100)
        instance = self._get_instance(emp_code)
        if instance:
            instance["overall_completion_pct"] = pct

    def _add_audit(self, action: str, emp_code: str, actor_code: str, details: dict):
        entry = {
            "id": str(uuid.uuid4()),
            "action": action,
            "employee_code": emp_code,
            "actor_code": actor_code,
            "details": details,
            "timestamp": _now_iso(),
        }
        self.data.setdefault("audit_log", []).append(entry)
        # Keep last 500
        if len(self.data["audit_log"]) > 500:
            self.data["audit_log"] = self.data["audit_log"][-500:]

    # ─── Public API Methods ──────────────────────────────────────────

    def get_onboarding_instance(self, emp_code: str) -> Optional[Dict]:
        return self._get_instance(emp_code)

    def get_all_instances_for_hr(self) -> List[Dict]:
        """Return all onboarding instances (for HR workspace)."""
        return list(self.data.get("onboarding_instances", {}).values())

    def get_tasks_for_employee(self, emp_code: str, stage: Optional[str] = None) -> List[Dict]:
        tasks = list(self._get_tasks(emp_code).values())
        if stage:
            tasks = [t for t in tasks if t["stage"] == stage]
        # Sort by due_date
        tasks.sort(key=lambda t: t.get("due_date", ""))
        return tasks

    def get_task_summary(self, emp_code: str) -> Dict:
        tasks = list(self._get_tasks(emp_code).values())
        completed = [t for t in tasks if t["status"] == TASK_STATUS_COMPLETED]
        pending = [t for t in tasks if t["status"] in (TASK_STATUS_NOT_STARTED, TASK_STATUS_IN_PROGRESS)]
        overdue = [t for t in tasks if t["status"] == TASK_STATUS_OVERDUE]
        action_required = [t for t in tasks if t["status"] == TASK_STATUS_ACTION_REQUIRED]
        submitted = [t for t in tasks if t["status"] == TASK_STATUS_SUBMITTED]
        return {
            "total": len(tasks),
            "completed": len(completed),
            "pending": len(pending),
            "overdue": len(overdue),
            "action_required": len(action_required),
            "submitted_for_review": len(submitted),
        }

    def update_task_status(
        self,
        emp_code: str,
        task_id: str,
        new_status: str,
        actor_code: str,
        comments: Optional[str] = None,
        is_hr: bool = False,
    ) -> Dict:
        tasks = self._get_tasks(emp_code)
        if task_id not in tasks:
            raise ValueError(f"Task {task_id} not found for employee {emp_code}")

        task = tasks[task_id]

        # Enforce: approval-required tasks cannot be COMPLETED without HR
        if new_status == TASK_STATUS_COMPLETED and task.get("requires_approval") and not is_hr:
            raise PermissionError(
                "This task requires HR or manager approval before it can be marked complete."
            )

        old_status = task["status"]
        task["status"] = new_status
        task["updated_at"] = _now_iso()

        if new_status == TASK_STATUS_COMPLETED:
            task["completed_at"] = _now_iso()

        if comments:
            if is_hr:
                task["hr_comments"] = comments
            else:
                task["employee_comments"] = comments

        task.setdefault("status_history", []).append({
            "status": new_status,
            "changed_at": _now_iso(),
            "changed_by": actor_code,
            "comments": comments,
        })

        self._recalculate_completion(emp_code)
        self._add_audit("TASK_STATUS_UPDATED", emp_code, actor_code, {
            "task_id": task_id, "old_status": old_status, "new_status": new_status
        })
        self.save_data()
        return task

    def submit_document(
        self,
        emp_code: str,
        doc_type_id: str,
        filename: str,
        file_size_kb: int,
    ) -> Dict:
        """Record a document submission (file content is handled separately)."""
        doc_types = self.data.get("document_types", {})
        if doc_type_id not in doc_types:
            raise ValueError(f"Unknown document type: {doc_type_id}")

        doc_type = doc_types[doc_type_id]

        submission = {
            "id": f"DOCSUBM-{emp_code}-{uuid.uuid4().hex[:8].upper()}",
            "employee_code": emp_code,
            "doc_type_id": doc_type_id,
            "doc_type_name": doc_type["name"],
            "filename": filename,
            "file_size_kb": file_size_kb,
            "is_sensitive": doc_type["is_sensitive"],
            "status": "SUBMITTED",
            "submitted_at": _now_iso(),
            "hr_reviewer_code": None,
            "hr_reviewer_name": None,
            "review_comments": None,
            "reviewed_at": None,
            "is_demo": True,
        }

        self.data.setdefault("document_submissions", {}).setdefault(emp_code, []).append(submission)
        self._add_audit("DOCUMENT_SUBMITTED", emp_code, emp_code, {"doc_type_id": doc_type_id, "filename": filename})
        self.save_data()
        return submission

    def get_document_submissions(self, emp_code: str) -> List[Dict]:
        return self._get_submissions(emp_code)

    def review_document(
        self,
        emp_code: str,
        submission_id: str,
        new_status: str,
        reviewer_code: str,
        reviewer_name: str,
        comments: Optional[str] = None,
    ) -> Dict:
        """HR reviews a submitted document (VERIFIED, CORRECTION_REQUIRED, REJECTED)."""
        submissions = self.data.get("document_submissions", {}).get(emp_code, [])
        for subm in submissions:
            if subm["id"] == submission_id:
                subm["status"] = new_status
                subm["hr_reviewer_code"] = reviewer_code
                subm["hr_reviewer_name"] = reviewer_name
                subm["review_comments"] = comments
                subm["reviewed_at"] = _now_iso()

                self._add_audit("DOCUMENT_REVIEWED", emp_code, reviewer_code, {
                    "submission_id": submission_id, "status": new_status
                })

                # Add notification to employee
                notif_type = {
                    "VERIFIED": "DOCUMENT_VERIFIED",
                    "CORRECTION_REQUIRED": "DOCUMENT_CORRECTION",
                    "REJECTED": "DOCUMENT_REJECTED",
                }.get(new_status, "DOCUMENT_REVIEWED")

                notif_msg = {
                    "VERIFIED": f"Your document '{subm['doc_type_name']}' has been verified by HR.",
                    "CORRECTION_REQUIRED": f"HR has requested a correction for your '{subm['doc_type_name']}'. Please review the comments and resubmit.",
                    "REJECTED": f"Your document '{subm['doc_type_name']}' was not accepted. Please contact HR.",
                }.get(new_status, f"Your document '{subm['doc_type_name']}' has been reviewed.")

                self._push_notification(
                    emp_code=emp_code,
                    notif_type=notif_type,
                    title=f"Document review: {subm['doc_type_name']}",
                    message=notif_msg,
                    link_path="/onboarding",
                )
                self.save_data()
                return subm

        raise ValueError(f"Document submission {submission_id} not found for employee {emp_code}")

    def _push_notification(self, emp_code: str, notif_type: str, title: str, message: str, link_path: str = "/onboarding"):
        """Push an in-app notification to an employee."""
        notif = {
            "id": f"NOTIF-{emp_code}-{uuid.uuid4().hex[:8].upper()}",
            "employee_code": emp_code,
            "type": notif_type,
            "title": title,
            "message": message,
            "link_path": link_path,
            "created_at": _now_iso(),
            "is_read": False,
            "is_demo": True,
        }
        self.data.setdefault("notifications", {}).setdefault(emp_code, []).append(notif)

    def get_notifications(self, emp_code: str) -> List[Dict]:
        notifs = self._get_notifications(emp_code)
        return sorted(notifs, key=lambda n: n.get("created_at", ""), reverse=True)

    def mark_notification_read(self, emp_code: str, notif_id: str) -> bool:
        notifs = self._get_notifications(emp_code)
        for notif in notifs:
            if notif["id"] == notif_id:
                notif["is_read"] = True
                self.save_data()
                return True
        return False

    def get_templates(self) -> List[Dict]:
        return list(self.data.get("templates", {}).values())

    def get_document_types(self) -> List[Dict]:
        return list(self.data.get("document_types", {}).values())

    def get_audit_log(self, limit: int = 50) -> List[Dict]:
        log = self.data.get("audit_log", [])
        return sorted(log, key=lambda e: e.get("timestamp", ""), reverse=True)[:limit]

    def get_manager_tasks(self, manager_code: str) -> List[Dict]:
        """Get all onboarding tasks assigned to a manager across all employees."""
        result = []
        for emp_code, tasks in self.data.get("task_instances", {}).items():
            for task in tasks.values():
                if task.get("responsible_party") == "MANAGER":
                    inst = self._get_instance(emp_code)
                    if inst and inst.get("manager_code") == manager_code:
                        result.append({**task, "employee_name": inst.get("full_name", emp_code)})
        return result

    def get_it_tasks(self) -> List[Dict]:
        """Get all IT-responsible onboarding tasks."""
        result = []
        for emp_code, tasks in self.data.get("task_instances", {}).items():
            for task in tasks.values():
                if task.get("responsible_party") == "IT":
                    inst = self._get_instance(emp_code)
                    result.append({**task, "employee_name": inst.get("full_name", emp_code) if inst else emp_code})
        return result

    def assign_onboarding_to_employee(
        self,
        emp_code: str,
        full_name: str,
        email: str,
        department: str,
        designation: str,
        joining_date_str: str,
        template_id: str,
        manager_code: Optional[str],
        manager_name: Optional[str],
        buddy_code: Optional[str],
        buddy_name: Optional[str],
        hr_coordinator_code: str,
        hr_coordinator_name: str,
        assigned_by: str,
    ) -> Dict:
        """Create a new onboarding instance for an employee."""
        templates = self.data.get("templates", {})
        if template_id not in templates:
            raise ValueError(f"Template {template_id} not found")

        if emp_code in self.data.get("onboarding_instances", {}):
            raise ValueError(f"Onboarding already assigned for {emp_code}")

        instance = {
            "employee_code": emp_code,
            "full_name": full_name,
            "email": email,
            "department": department,
            "designation": designation,
            "role": "EMPLOYEE",
            "joining_date": joining_date_str,
            "current_stage": STAGE_PREBOARDING,
            "template_id": template_id,
            "hr_coordinator_code": hr_coordinator_code,
            "hr_coordinator_name": hr_coordinator_name,
            "manager_code": manager_code,
            "manager_name": manager_name,
            "buddy_code": buddy_code,
            "buddy_name": buddy_name,
            "avatar_initials": "".join(n[0].upper() for n in full_name.split() if n)[:2],
            "is_demo": True,
            "assigned_at": _now_iso(),
            "overall_completion_pct": 0,
        }

        self.data.setdefault("onboarding_instances", {})[emp_code] = instance

        # Create task instances from template
        tpl = templates[template_id]
        task_map = {}
        i = 1
        for stage, stage_data in tpl["stages"].items():
            for t in stage_data["tasks"]:
                tid = f"OINST-{emp_code.replace('-', '')}-{i:04d}"
                joining = date.fromisoformat(joining_date_str)
                due_date = joining + timedelta(days=t.get("days_offset", 0))
                task_map[tid] = {
                    "id": tid,
                    "task_template_id": t["id"],
                    "employee_code": emp_code,
                    "stage": stage,
                    "title": t["title"],
                    "description": t["description"],
                    "is_required": t["is_required"],
                    "requires_approval": t["requires_approval"],
                    "responsible_party": t["responsible_party"],
                    "requires_document": t["requires_document"],
                    "due_date": _date_str(due_date),
                    "status": TASK_STATUS_NOT_STARTED,
                    "completed_at": None,
                    "hr_comments": None,
                    "employee_comments": None,
                    "created_at": _now_iso(),
                    "updated_at": _now_iso(),
                    "status_history": [{"status": TASK_STATUS_NOT_STARTED, "changed_at": _now_iso(), "changed_by": assigned_by, "comments": "Task created"}],
                }
                i += 1

        self.data.setdefault("task_instances", {})[emp_code] = task_map

        # Push welcome notification
        self._push_notification(
            emp_code=emp_code,
            notif_type="TASK_ASSIGNED",
            title="Your onboarding plan is ready",
            message=f"Welcome, {full_name}! Your onboarding plan has been set up with {len(task_map)} tasks. Your joining date is {joining_date_str}.",
            link_path="/onboarding",
        )

        self._add_audit("ONBOARDING_ASSIGNED", emp_code, assigned_by, {"template_id": template_id})
        self.save_data()

        # Register employee in self-service & demo users so they can log in immediately
        try:
            from app.services.self_service_service import self_service_engine
            self_service_engine.add_or_register_employee(
                employee_code=emp_code,
                full_name=full_name,
                email=email,
                role="EMPLOYEE",
                department=department,
                designation=designation,
                manager_code=manager_code or "EMP-1004",
                manager_name=manager_name or "Vikram Malhotra",
            )
            from app.api.auth import INSTITUTIONAL_DEMO_USERS
            demo_user = {
                "id": str(uuid.uuid4()),
                "employee_code": emp_code,
                "email": email.strip().lower(),
                "password": "Password@123",
                "full_name": full_name,
                "department": department,
                "designation": designation,
                "role": "EMPLOYEE",
                "is_active": True,
            }
            INSTITUTIONAL_DEMO_USERS[emp_code.lower()] = demo_user
            INSTITUTIONAL_DEMO_USERS[email.strip().lower()] = demo_user
        except Exception:
            pass

        return instance

    def answer_onboarding_ai_query(self, emp_code: str, question: str) -> Dict:
        """
        AI assistant for onboarding questions.
        Returns task-specific data from persisted state, not fabricated values.
        """
        question_lower = question.lower()
        instance = self._get_instance(emp_code)

        if not instance:
            return {
                "answer": "I don't have an onboarding plan on record for you. Please contact your HR coordinator.",
                "onboarding_data": None,
                "citations": [],
            }

        tasks = list(self._get_tasks(emp_code).values())
        summary = self.get_task_summary(emp_code)
        submissions = self._get_submissions(emp_code)

        # Determine relevant tasks
        pending_tasks = [t for t in tasks if t["status"] in (TASK_STATUS_NOT_STARTED, TASK_STATUS_IN_PROGRESS, TASK_STATUS_OVERDUE)]
        action_tasks = [t for t in tasks if t["status"] == TASK_STATUS_ACTION_REQUIRED]
        doc_correction = [s for s in submissions if s["status"] == "CORRECTION_REQUIRED"]

        if any(kw in question_lower for kw in ("pending", "outstanding", "not done", "incomplete")):
            if not pending_tasks:
                answer = "All your tasks are completed. Great work!"
            else:
                task_lines = "\n".join(f"- **{t['title']}** (Due: {t['due_date']}, Stage: {STAGE_LABELS.get(t['stage'], t['stage'])})" for t in pending_tasks[:10])
                answer = f"You have **{len(pending_tasks)} pending task(s)**:\n\n{task_lines}\n\nPlease complete these at your earliest to stay on track with your onboarding schedule."

        elif any(kw in question_lower for kw in ("document", "correction", "resubmit")):
            if doc_correction:
                lines = "\n".join(f"- **{s['doc_type_name']}**: {s.get('review_comments', 'Correction required')}" for s in doc_correction)
                answer = f"The following document(s) require your attention:\n\n{lines}\n\nPlease resubmit the corrected documents through the Onboarding portal."
            else:
                answer = "I don't see any documents requiring correction for you currently."

        elif any(kw in question_lower for kw in ("progress", "completion", "how far", "how much")):
            pct = instance.get("overall_completion_pct", 0)
            stage = STAGE_LABELS.get(instance.get("current_stage", ""), instance.get("current_stage", ""))
            answer = (
                f"Your onboarding is **{pct}% complete**.\n\n"
                f"**Current stage:** {stage}\n"
                f"- ✅ Completed: {summary['completed']} tasks\n"
                f"- ⏳ Pending: {summary['pending']} tasks\n"
                f"- ⚠️ Overdue: {summary['overdue']} tasks\n"
                f"- 🔴 Action required: {summary['action_required']} tasks"
            )

        elif any(kw in question_lower for kw in ("before joining", "preboarding", "pre-boarding")):
            pre_tasks = [t for t in tasks if t["stage"] == STAGE_PREBOARDING]
            pending_pre = [t for t in pre_tasks if t["status"] != TASK_STATUS_COMPLETED]
            if not pending_pre:
                answer = "You have completed all your preboarding tasks. Well done!"
            else:
                lines = "\n".join(f"- {t['title']}" for t in pending_pre)
                answer = f"Your remaining preboarding tasks are:\n\n{lines}\n\nEnsure these are completed before your joining date of **{instance.get('joining_date')}**."

        elif any(kw in question_lower for kw in ("first week", "week 1")):
            week_tasks = [t for t in tasks if t["stage"] == STAGE_FIRST_WEEK]
            lines = "\n".join(f"- **{t['title']}** — {t['status'].replace('_', ' ').title()}" for t in week_tasks)
            answer = f"Your first week onboarding tasks:\n\n{lines}"

        elif any(kw in question_lower for kw in ("it access", "system access", "bloomberg", "vpn")):
            it_tasks = [t for t in action_tasks if "it" in t.get("responsible_party", "").lower() or "access" in t["title"].lower()]
            if it_tasks:
                lines = "\n".join(f"- **{t['title']}**: {t.get('hr_comments', 'Contact IT team')}" for t in it_tasks)
                answer = f"You have IT access tasks requiring attention:\n\n{lines}\n\nPlease raise a ticket through ServiceHub if your access has not been provisioned."
            else:
                answer = "I don't see any outstanding IT access issues. If you're experiencing system access problems, please raise a request through ServiceHub."

        else:
            answer = (
                f"You're currently in the **{STAGE_LABELS.get(instance.get('current_stage', ''), '')}** stage of onboarding with "
                f"**{instance.get('overall_completion_pct', 0)}%** completion.\n\n"
                f"You have {summary['pending']} pending tasks and {summary['action_required']} items requiring action.\n\n"
                "You can ask me about:\n"
                "- Pending or overdue tasks\n"
                "- Document corrections\n"
                "- Your preboarding checklist\n"
                "- IT access issues\n"
                "- Your onboarding progress"
            )

        return {
            "answer": answer,
            "onboarding_data": {
                "employee_code": emp_code,
                "current_stage": instance.get("current_stage"),
                "completion_pct": instance.get("overall_completion_pct", 0),
                "task_summary": summary,
            },
            "citations": [
                {
                    "document_id": "DSPAMC-ONBOARDING-GUIDE",
                    "document_title": "DSPAMC New Employee Onboarding Guide (Synthetic Demo)",
                    "section": "Onboarding Checklist",
                    "snippet": "Task-specific status retrieved from your onboarding record. Not fabricated.",
                    "relevance": 1.0,
                    "verified": True,
                }
            ],
            "is_demo": True,
        }


# ── Singleton Instance ────────────────────────────────────────────────
onboarding_engine = OnboardingEngine()
