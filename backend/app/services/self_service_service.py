"""
DSP KnowledgeHub AI — Employee Self-Service Platform Engine

Provides live state, business logic, validation, audit logging, and data persistence for:
- Employee profiles & identity resolution
- Leave balance computation and application lifecycle
- Reimbursement claims and financial validation
- Unified service desk requests & timeline
- Manager approval hierarchies with strict self-approval prevention
- AI Assistant live employee-data routing & policy RAG integration

All data in local development is explicitly synthetic and persists to data/self_service_db.json.
"""

import json
import os
import uuid
from datetime import date, datetime, timedelta, timezone
from typing import Any, Dict, List, Optional, Tuple
import structlog

from app.services.knowledge_service import KnowledgeService
from app.services.integration_adapters import (
    identity_adapter,
    hrms_adapter,
    expense_adapter,
    servicedesk_adapter,
)

logger = structlog.get_logger()

DATA_DIR = os.path.join(os.path.dirname(os.path.dirname(os.path.dirname(__file__))), "data")
DB_FILE = os.path.join(DATA_DIR, "self_service_db.json")


# ─── Company Holiday Calendar (NSE/BSE & DSPAMC Maharashtra Office) ───

COMPANY_HOLIDAYS_2026 = [
    {
        "date": "2026-01-26",
        "name": "Republic Day",
        "day_of_week": "Monday",
        "is_trading_holiday": True,
        "description": "National Holiday — Indian Constitution Day"
    },
    {
        "date": "2026-03-03",
        "name": "Holi (Second Day)",
        "day_of_week": "Tuesday",
        "is_trading_holiday": True,
        "description": "Festival of Colors"
    },
    {
        "date": "2026-04-03",
        "name": "Good Friday",
        "day_of_week": "Friday",
        "is_trading_holiday": True,
        "description": "NSE / BSE Trading Holiday"
    },
    {
        "date": "2026-04-14",
        "name": "Dr. Babasaheb Ambedkar Jayanti",
        "day_of_week": "Tuesday",
        "is_trading_holiday": True,
        "description": "Public Holiday"
    },
    {
        "date": "2026-05-01",
        "name": "Maharashtra Day & Labour Day",
        "day_of_week": "Friday",
        "is_trading_holiday": True,
        "description": "State & Financial Market Holiday"
    },
    {
        "date": "2026-08-15",
        "name": "Independence Day",
        "day_of_week": "Saturday",
        "is_trading_holiday": True,
        "description": "National Independence Day"
    },
    {
        "date": "2026-09-15",
        "name": "Ganesh Chaturthi",
        "day_of_week": "Tuesday",
        "is_trading_holiday": True,
        "description": "Regional Festival in Maharashtra"
    },
    {
        "date": "2026-10-02",
        "name": "Mahatma Gandhi Jayanti",
        "day_of_week": "Friday",
        "is_trading_holiday": True,
        "description": "National Holiday"
    },
    {
        "date": "2026-10-20",
        "name": "Dussehra",
        "day_of_week": "Tuesday",
        "is_trading_holiday": True,
        "description": "Vijaya Dashami"
    },
    {
        "date": "2026-11-08",
        "name": "Diwali (Laxmi Pujan & Muhurat Trading)",
        "day_of_week": "Sunday",
        "is_trading_holiday": False,
        "description": "Special 1-hour Muhurat Trading Session"
    },
    {
        "date": "2026-11-10",
        "name": "Diwali Balipratipada",
        "day_of_week": "Tuesday",
        "is_trading_holiday": True,
        "description": "Post-Diwali Market Holiday"
    },
    {
        "date": "2026-12-25",
        "name": "Christmas",
        "day_of_week": "Friday",
        "is_trading_holiday": True,
        "description": "Public Holiday"
    },
]


class SelfServiceEngine:
    """
    State manager for employee self-service platform.
    Seeds synthetic demo data and supports end-to-end transactional workflows.
    """

    def __init__(self):
        os.makedirs(DATA_DIR, exist_ok=True)
        self.data: Dict[str, Any] = {}
        self.load_data()

    def load_data(self):
        if os.path.exists(DB_FILE):
            try:
                with open(DB_FILE, "r", encoding="utf-8") as f:
                    self.data = json.load(f)
                    return
            except Exception as e:
                logger.error("Failed to load self_service_db.json, re-seeding", error=str(e))

        self.seed_initial_data()
        self.save_data()

    def save_data(self):
        try:
            with open(DB_FILE, "w", encoding="utf-8") as f:
                json.dump(self.data, f, indent=2, default=str)
        except Exception as e:
            logger.error("Failed to write self_service_db.json", error=str(e))

    def seed_initial_data(self):
        """Seed complete, consistent synthetic demo dataset."""
        logger.info("Seeding synthetic DSPAMC self-service dataset")

        # 1. Employees Directory
        employees = {
            "EMP-1001": {
                "id": "11111111-1111-1111-1111-111111111111",
                "employee_code": "EMP-1001",
                "email": "aditi.sharma@dspamc.com",
                "password": "Password@123",
                "full_name": "Aditi Sharma",
                "department": "Equities & Wealth Management",
                "designation": "Senior Investment Analyst",
                "role": "EMPLOYEE",
                "location": "Mumbai - Nariman Point (Mafatlal Centre, 10th Floor)",
                "phone": "+91 98201 44512",
                "date_of_joining": "2022-04-15",
                "manager_code": "EMP-1004",
                "manager_name": "Vikram Malhotra",
                "avatar_initials": "AS",
                "is_active": True,
                "is_demo": True,
            },
            "EMP-1002": {
                "id": "22222222-2222-2222-2222-222222222222",
                "employee_code": "EMP-1002",
                "email": "rohan.mehta@dspamc.com",
                "password": "Password@123",
                "full_name": "Rohan Mehta",
                "department": "Quantitative Strategies & Risk",
                "designation": "Quantitative Strategist",
                "role": "EMPLOYEE",
                "location": "Mumbai - Nariman Point (Mafatlal Centre, 9th Floor)",
                "phone": "+91 98203 11849",
                "date_of_joining": "2023-07-01",
                "manager_code": "EMP-1004",
                "manager_name": "Vikram Malhotra",
                "avatar_initials": "RM",
                "is_active": True,
                "is_demo": True,
            },
            "EMP-1003": {
                "id": "33333333-3333-3333-3333-333333333333",
                "employee_code": "EMP-1003",
                "email": "priya.nair@dspamc.com",
                "password": "Password@123",
                "full_name": "Priya Nair",
                "department": "Legal & Regulatory Compliance",
                "designation": "Compliance Specialist",
                "role": "COMPLIANCE",
                "location": "Mumbai - Nariman Point (Mafatlal Centre, 11th Floor)",
                "phone": "+91 98192 77410",
                "date_of_joining": "2021-11-10",
                "manager_code": "EMP-1005",
                "manager_name": "Ananya Desai",
                "avatar_initials": "PN",
                "is_active": True,
                "is_demo": True,
            },
            "EMP-1004": {
                "id": "44444444-4444-4444-4444-444444444444",
                "employee_code": "EMP-1004",
                "email": "vikram.malhotra@dspamc.com",
                "password": "Password@123",
                "full_name": "Vikram Malhotra",
                "department": "Equities & Asset Management",
                "designation": "Managing Director & Head of Equities",
                "role": "MANAGER",
                "location": "Mumbai - Nariman Point (Mafatlal Centre, 10th Floor)",
                "phone": "+91 98200 99881",
                "date_of_joining": "2018-02-01",
                "manager_code": "EMP-1005",
                "manager_name": "Ananya Desai",
                "avatar_initials": "VM",
                "is_active": True,
                "is_demo": True,
            },
            "EMP-1005": {
                "id": "55555555-5555-5555-5555-555555555555",
                "employee_code": "EMP-1005",
                "email": "ananya.desai@dspamc.com",
                "password": "Password@123",
                "full_name": "Ananya Desai",
                "department": "Executive Leadership & Operations",
                "designation": "Chief Operating Officer & System Admin",
                "role": "ADMIN",
                "location": "Mumbai - Nariman Point (Mafatlal Centre, 12th Floor)",
                "phone": "+91 98200 11223",
                "date_of_joining": "2016-05-15",
                "manager_code": None,
                "manager_name": "Board of Directors",
                "avatar_initials": "AD",
                "is_active": True,
                "is_demo": True,
            },
        }

        # 2. Leave Balances per employee
        leave_balances = {
            "EMP-1001": [
                {
                    "category_id": "pl",
                    "category_name": "Privilege Leave (Annual)",
                    "code": "PL",
                    "allocated": 18.0,
                    "used": 4.0,
                    "pending": 2.0,
                    "available": 12.0,
                    "description": "Encashable or carry-forward up to 30 days. Prior manager approval required.",
                },
                {
                    "category_id": "csl",
                    "category_name": "Casual & Sick Leave",
                    "code": "CSL",
                    "allocated": 12.0,
                    "used": 3.0,
                    "pending": 0.0,
                    "available": 9.0,
                    "description": "Personal exigencies or illness. Up to 3 consecutive days without medical cert.",
                },
                {
                    "category_id": "comp_off",
                    "category_name": "Compensatory Off",
                    "code": "COMP_OFF",
                    "allocated": 2.0,
                    "used": 0.0,
                    "pending": 0.0,
                    "available": 2.0,
                    "description": "Earned for weekend regulatory or fund launch deployments. Valid for 60 days.",
                },
                {
                    "category_id": "parental",
                    "category_name": "Parental / Maternity / Paternity",
                    "code": "ML_PL",
                    "allocated": 15.0,
                    "used": 0.0,
                    "pending": 0.0,
                    "available": 15.0,
                    "description": "Statutory parental leaves as per Maternity Benefit Act / DSPAMC policy.",
                },
            ],
            "EMP-1002": [
                {
                    "category_id": "pl",
                    "category_name": "Privilege Leave (Annual)",
                    "code": "PL",
                    "allocated": 18.0,
                    "used": 3.0,
                    "pending": 0.0,
                    "available": 15.0,
                    "description": "Annual vacation allocation.",
                },
                {
                    "category_id": "csl",
                    "category_name": "Casual & Sick Leave",
                    "code": "CSL",
                    "allocated": 12.0,
                    "used": 4.0,
                    "pending": 0.0,
                    "available": 8.0,
                    "description": "Casual emergency leave.",
                },
                {
                    "category_id": "comp_off",
                    "category_name": "Compensatory Off",
                    "code": "COMP_OFF",
                    "allocated": 1.0,
                    "used": 0.0,
                    "pending": 0.0,
                    "available": 1.0,
                    "description": "Comp off earned.",
                },
            ],
            "EMP-1004": [
                {
                    "category_id": "pl",
                    "category_name": "Privilege Leave (Annual)",
                    "code": "PL",
                    "allocated": 22.0,
                    "used": 5.0,
                    "pending": 0.0,
                    "available": 17.0,
                    "description": "Executive leave allocation.",
                },
                {
                    "category_id": "csl",
                    "category_name": "Casual & Sick Leave",
                    "code": "CSL",
                    "allocated": 12.0,
                    "used": 2.0,
                    "pending": 0.0,
                    "available": 10.0,
                    "description": "Casual emergency leave.",
                },
            ]
        }

        # 3. Seed Leave Requests
        leave_requests = [
            {
                "id": "lv_req_001",
                "request_number": "LV-2026-001",
                "employee_code": "EMP-1001",
                "employee_name": "Aditi Sharma",
                "category_code": "PL",
                "category_name": "Privilege Leave (Annual)",
                "start_date": "2026-11-12",
                "end_date": "2026-11-13",
                "duration_days": 2.0,
                "is_half_day": False,
                "status": "PENDING_APPROVAL",
                "reason": "Family function post-Diwali vacation.",
                "handover_notes": "Rohan Mehta will monitor portfolio pre-market rebalancing checks.",
                "applied_on": "2026-10-10T10:15:00Z",
                "approver_name": "Vikram Malhotra",
                "approver_comments": None,
                "actioned_on": None,
            },
            {
                "id": "lv_req_002",
                "request_number": "LV-2026-002",
                "employee_code": "EMP-1001",
                "employee_name": "Aditi Sharma",
                "category_code": "CSL",
                "category_name": "Casual & Sick Leave",
                "start_date": "2026-08-18",
                "end_date": "2026-08-19",
                "duration_days": 2.0,
                "is_half_day": False,
                "status": "APPROVED",
                "reason": "Viral fever recovery.",
                "handover_notes": "Client emails redirected to wealth team desk.",
                "applied_on": "2026-08-17T08:30:00Z",
                "approver_name": "Vikram Malhotra",
                "approver_comments": "Approved. Take care and get well soon.",
                "actioned_on": "2026-08-17T09:45:00Z",
            },
            {
                "id": "lv_req_003",
                "request_number": "LV-2026-003",
                "employee_code": "EMP-1002",
                "employee_name": "Rohan Mehta",
                "category_code": "PL",
                "category_name": "Privilege Leave (Annual)",
                "start_date": "2026-12-28",
                "end_date": "2026-12-31",
                "duration_days": 4.0,
                "is_half_day": False,
                "status": "PENDING_APPROVAL",
                "reason": "Year-end annual break with family.",
                "handover_notes": "Quant model daily batch scripts monitored by Devops.",
                "applied_on": "2026-10-11T14:20:00Z",
                "approver_name": "Vikram Malhotra",
                "approver_comments": None,
                "actioned_on": None,
            }
        ]

        # 4. Seed Expense Claims
        expense_claims = [
            {
                "id": "clm_001",
                "claim_number": "CLM-2026-001",
                "employee_code": "EMP-1001",
                "employee_name": "Aditi Sharma",
                "category": "MEALS",
                "category_label": "Client Business Entertainment",
                "expense_date": "2026-10-08",
                "amount": 4850.0,
                "currency": "INR",
                "merchant": "Trident Hotel, Nariman Point",
                "business_purpose": "Annual portfolio review dinner with ultra-HNI wealth client delegation.",
                "receipt_filename": "receipt_trident_dinner_oct08.pdf",
                "receipt_url": "/api/v1/self-service/receipts/receipt_trident_dinner_oct08.pdf",
                "status": "UNDER_REVIEW",
                "submitted_on": "2026-10-09T11:00:00Z",
                "approver_name": "Vikram Malhotra",
                "reviewer_comments": "Verified under DSP-FIN-001 client entertainment limits. Pending final signoff.",
                "actioned_on": None,
                "settlement_reference": None,
            },
            {
                "id": "clm_002",
                "claim_number": "CLM-2026-002",
                "employee_code": "EMP-1001",
                "employee_name": "Aditi Sharma",
                "category": "CONVEYANCE",
                "category_label": "Local Travel & Airport Taxi",
                "expense_date": "2026-09-22",
                "amount": 850.0,
                "currency": "INR",
                "merchant": "Uber India Systems",
                "business_purpose": "Travel from BKC Client Office to Mumbai Domestic Airport T1.",
                "receipt_filename": "uber_receipt_bkc_airport.pdf",
                "receipt_url": "/api/v1/self-service/receipts/uber_receipt_bkc_airport.pdf",
                "status": "APPROVED",
                "submitted_on": "2026-09-23T09:15:00Z",
                "approver_name": "Vikram Malhotra",
                "reviewer_comments": "Approved. Forwarded to Finance for Concur batch settlement.",
                "actioned_on": "2026-09-24T16:20:00Z",
                "settlement_reference": "CONCUR-SETTLE-8819",
            },
            {
                "id": "clm_003",
                "claim_number": "CLM-2026-003",
                "employee_code": "EMP-1001",
                "employee_name": "Aditi Sharma",
                "category": "INTERNET_MOBILE",
                "category_label": "WFH Broadband & Mobile Reimbursement",
                "expense_date": "2026-09-01",
                "amount": 1500.0,
                "currency": "INR",
                "merchant": "Airtel Broadband Solutions",
                "business_purpose": "Monthly WFH corporate internet allowance for trading workstation connectivity.",
                "receipt_filename": "airtel_bill_aug2026.pdf",
                "receipt_url": "/api/v1/self-service/receipts/airtel_bill_aug2026.pdf",
                "status": "PAID",
                "submitted_on": "2026-09-02T10:00:00Z",
                "approver_name": "Vikram Malhotra",
                "reviewer_comments": "Settled via monthly payroll credit.",
                "actioned_on": "2026-09-05T12:00:00Z",
                "settlement_reference": "NEFT-DSP-PAY-9921",
            },
            {
                "id": "clm_004",
                "claim_number": "CLM-2026-004",
                "employee_code": "EMP-1002",
                "employee_name": "Rohan Mehta",
                "category": "TRAVEL",
                "category_label": "Domestic Flight Ticket",
                "expense_date": "2026-09-15",
                "amount": 8200.0,
                "currency": "INR",
                "merchant": "IndiGo Airlines",
                "business_purpose": "Travel to Bengaluru branch office for quantitative model training symposium.",
                "receipt_filename": "indigo_flight_blr_bom.pdf",
                "receipt_url": "/api/v1/self-service/receipts/indigo_flight_blr_bom.pdf",
                "status": "INFO_REQUIRED",
                "submitted_on": "2026-09-18T15:30:00Z",
                "approver_name": "Vikram Malhotra",
                "reviewer_comments": "Please attach the boarding pass stub along with the e-ticket as per DSP-FIN-001 Section 4.",
                "actioned_on": "2026-09-20T11:45:00Z",
                "settlement_reference": None,
            }
        ]

        # 5. Seed Service Desk Requests
        service_requests = [
            {
                "id": "req_001",
                "request_number": "REQ-2026-001",
                "employee_code": "EMP-1001",
                "employee_name": "Aditi Sharma",
                "category": "IT_ACCESS",
                "category_label": "Application & Terminal Access",
                "subject": "Bloomberg Terminal B-PIPE Data Feed License Add-on",
                "description": "Need access to institutional equities fixed-income spread analytics module on Bloomberg terminal #BOM-BBG-12.",
                "priority": "HIGH",
                "status": "IN_PROGRESS",
                "assigned_team": "IT Market Data Services",
                "assignee_name": "Santosh Kadam (IT Support)",
                "created_at": "2026-10-07T11:30:00Z",
                "updated_at": "2026-10-08T14:15:00Z",
                "comments": [
                    {
                        "id": "c1",
                        "author_name": "Santosh Kadam",
                        "author_role": "IT Analyst",
                        "message": "Vendor quote received from Bloomberg India. Manager approval confirmed. Provisioning token.",
                        "timestamp": "2026-10-08T14:15:00Z",
                    }
                ],
            },
            {
                "id": "req_002",
                "request_number": "REQ-2026-002",
                "employee_code": "EMP-1001",
                "employee_name": "Aditi Sharma",
                "category": "HR_DOCUMENT",
                "category_label": "Employment Verification & Letter",
                "subject": "Bonafide Employment Letter for Schengen Visa Application",
                "description": "Requesting official DSPAMC letterhead bonafide employment certificate for upcoming private travel in December.",
                "priority": "MEDIUM",
                "status": "RESOLVED",
                "assigned_team": "People Operations Helpdesk",
                "assignee_name": "Kavita Rao (HR Ops)",
                "created_at": "2026-09-28T09:00:00Z",
                "updated_at": "2026-09-29T16:00:00Z",
                "comments": [
                    {
                        "id": "c2",
                        "author_name": "Kavita Rao",
                        "author_role": "HR Ops Lead",
                        "message": "Digitally signed letter attached to ticket and emailed to registered corporate inbox.",
                        "timestamp": "2026-09-29T16:00:00Z",
                    }
                ],
            },
            {
                "id": "req_003",
                "request_number": "REQ-2026-003",
                "employee_code": "EMP-1002",
                "employee_name": "Rohan Mehta",
                "category": "HARDWARE",
                "category_label": "Laptop & Peripherals",
                "subject": "High-Memory Workstation Upgrade for Monte Carlo Simulations",
                "description": "Requesting upgrade from 32GB to 64GB RAM on engineering ThinkPad for parallel risk simulations.",
                "priority": "MEDIUM",
                "status": "OPEN",
                "assigned_team": "IT Infrastructure",
                "assignee_name": "Unassigned",
                "created_at": "2026-10-12T10:00:00Z",
                "updated_at": "2026-10-12T10:00:00Z",
                "comments": [],
            }
        ]

        # 6. Seed In-App Notifications
        notifications = [
            {
                "id": "notif_001",
                "employee_code": "EMP-1001",
                "type": "EXPENSE_UPDATE",
                "title": "Expense Claim Approved",
                "message": "Your claim CLM-2026-002 (INR 850 for Airport Taxi) has been approved by Vikram Malhotra.",
                "link_path": "/reimbursements",
                "created_at": "2026-09-24T16:20:00Z",
                "is_read": True,
            },
            {
                "id": "notif_002",
                "employee_code": "EMP-1001",
                "type": "TICKET_UPDATE",
                "title": "IT Request Updated",
                "message": "Santosh Kadam commented on REQ-2026-001 (Bloomberg Terminal Access).",
                "link_path": "/requests",
                "created_at": "2026-10-08T14:15:00Z",
                "is_read": False,
            },
            {
                "id": "notif_003",
                "employee_code": "EMP-1004",
                "type": "APPROVAL_PENDING",
                "title": "Pending Leave Approval",
                "message": "Aditi Sharma has applied for 2 days Privilege Leave (Nov 12-13, 2026).",
                "link_path": "/approvals",
                "created_at": "2026-10-10T10:15:00Z",
                "is_read": False,
            },
            {
                "id": "notif_004",
                "employee_code": "EMP-1004",
                "type": "APPROVAL_PENDING",
                "title": "Pending Expense Review",
                "message": "Aditi Sharma submitted claim CLM-2026-001 for INR 4,850 (Trident Hotel).",
                "link_path": "/approvals",
                "created_at": "2026-10-09T11:00:00Z",
                "is_read": False,
            }
        ]

        # 7. Audit Log
        audit_logs = [
            {
                "id": "aud_001",
                "timestamp": "2026-08-17T09:45:00Z",
                "actor_code": "EMP-1004",
                "actor_name": "Vikram Malhotra",
                "action": "LEAVE_APPROVAL",
                "entity_type": "LEAVE_REQUEST",
                "entity_id": "LV-2026-002",
                "details": "Approved 2 days CSL for Aditi Sharma (Viral fever).",
                "ip_address": "127.0.0.1",
            },
            {
                "id": "aud_002",
                "timestamp": "2026-09-24T16:20:00Z",
                "actor_code": "EMP-1004",
                "actor_name": "Vikram Malhotra",
                "action": "EXPENSE_APPROVAL",
                "entity_type": "EXPENSE_CLAIM",
                "entity_id": "CLM-2026-002",
                "details": "Approved taxi expense INR 850 for Aditi Sharma.",
                "ip_address": "127.0.0.1",
            }
        ]

        self.data = {
            "employees": employees,
            "leave_balances": leave_balances,
            "leave_requests": leave_requests,
            "expense_claims": expense_claims,
            "service_requests": service_requests,
            "notifications": notifications,
            "audit_logs": audit_logs,
        }

    # ─── 1. Identity & Profile Resolution ────────────────────────────────

    def authenticate_employee(self, identifier: str, password: str) -> Optional[Dict[str, Any]]:
        """
        Authenticate by employee code (EMP-1001) or email (aditi.sharma@dspamc.com).
        Returns employee profile dictionary if valid.
        """
        clean_id = identifier.strip().lower()
        employees = self.data.get("employees", {})

        for emp in employees.values():
            if emp["employee_code"].lower() == clean_id or emp["email"].lower() == clean_id:
                # Accept development passwords
                valid_passwords = (emp["password"], "Password@123", "Demo@123", "password", "demo")
                if password in valid_passwords:
                    return emp
        return None

    def get_employee_by_id(self, user_id_or_code: str) -> Optional[Dict[str, Any]]:
        employees = self.data.get("employees", {})
        # Search by UUID or code
        for emp in employees.values():
            if emp["id"] == user_id_or_code or emp["employee_code"] == user_id_or_code:
                return emp
        return None

    def update_employee_profile(self, employee_code: str, updates: Optional[Dict[str, Any]] = None, **kwargs) -> Dict[str, Any]:
        emp = self.get_employee_by_id(employee_code)
        if not emp:
            raise ValueError(f"Employee {employee_code} not found")
        data_to_apply: Dict[str, Any] = {}
        if updates and isinstance(updates, dict):
            data_to_apply.update(updates)
        data_to_apply.update(kwargs)
        allowed_fields = ["phone", "location", "emergency_contact", "emergency_phone", "preferred_name", "bio"]
        for k in allowed_fields:
            if k in data_to_apply:
                emp[k] = data_to_apply[k]
        self.save_data()
        return emp

    def list_all_demo_employees(self) -> List[Dict[str, Any]]:
        return list(self.data.get("employees", {}).values())

    # ─── 2. Leave Management ─────────────────────────────────────────────

    def get_leave_balances(self, employee_code: str) -> Dict[str, Any]:
        """Calculates and returns live leave balance quotas for an employee."""
        emp = self.get_employee_by_id(employee_code)
        if not emp:
            raise ValueError(f"Employee {employee_code} not found")

        balances = self.data.get("leave_balances", {}).get(emp["employee_code"], [])
        if not balances:
            # Default template for new demo employee
            balances = [
                {
                    "category_id": "pl",
                    "category_name": "Privilege Leave (Annual)",
                    "code": "PL",
                    "allocated": 18.0,
                    "used": 0.0,
                    "pending": 0.0,
                    "available": 18.0,
                    "description": "Standard annual vacation quota.",
                },
                {
                    "category_id": "csl",
                    "category_name": "Casual & Sick Leave",
                    "code": "CSL",
                    "allocated": 12.0,
                    "used": 0.0,
                    "pending": 0.0,
                    "available": 12.0,
                    "description": "Personal exigencies.",
                },
            ]
            self.data.setdefault("leave_balances", {})[emp["employee_code"]] = balances
            self.save_data()

        total_avail = sum(b["available"] for b in balances)

        # Calculate upcoming approved days
        now_str = date.today().isoformat()
        upcoming_approved = sum(
            r["duration_days"]
            for r in self.data.get("leave_requests", [])
            if r["employee_code"] == emp["employee_code"]
            and r["status"] == "APPROVED"
            and r["start_date"] >= now_str
        )

        return {
            "employee_code": emp["employee_code"],
            "year": date.today().year,
            "categories": balances,
            "total_available": total_avail,
            "upcoming_approved_days": upcoming_approved,
        }

    def calculate_leave_duration(self, start_date_str: str, end_date_str: str, is_half_day: bool) -> float:
        """Computes working days excluding weekends."""
        d1 = date.fromisoformat(start_date_str)
        d2 = date.fromisoformat(end_date_str)
        if d2 < d1:
            raise ValueError("End date cannot be prior to start date")

        if is_half_day:
            return 0.5

        days = 0.0
        cur = d1
        while cur <= d2:
            # Exclude Saturday (5) and Sunday (6)
            if cur.weekday() < 5:
                days += 1.0
            cur += timedelta(days=1)
        return max(days, 1.0)

    def apply_leave(
        self,
        employee_code: str,
        category_code: str,
        start_date_str: str,
        end_date_str: str,
        reason: str,
        is_half_day: bool = False,
        handover_notes: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Submits a new leave request.
        Validates dates, balance sufficiency, overlap, and updates balance state.
        """
        emp = self.get_employee_by_id(employee_code)
        if not emp:
            raise ValueError(f"Employee {employee_code} not found")

        # Duration
        duration = self.calculate_leave_duration(start_date_str, end_date_str, is_half_day)

        # Check overlaps against active requests
        existing_requests = self.data.get("leave_requests", [])
        for req in existing_requests:
            if req["employee_code"] == emp["employee_code"] and req["status"] in ("PENDING_APPROVAL", "APPROVED"):
                # Overlap test: (StartA <= EndB) and (EndA >= StartB)
                if (start_date_str <= req["end_date"]) and (end_date_str >= req["start_date"]):
                    raise ValueError(
                        f"Requested leave period overlaps with existing request {req['request_number']} "
                        f"({req['start_date']} to {req['end_date']})"
                    )

        # Check balance
        balances = self.data.get("leave_balances", {}).get(emp["employee_code"], [])
        cat_match = None
        for b in balances:
            if b["code"].upper() == category_code.upper():
                cat_match = b
                break

        if not cat_match:
            raise ValueError(f"Invalid leave category {category_code}")

        if cat_match["available"] < duration:
            raise ValueError(
                f"Insufficient leave balance. Requested {duration} days, but only {cat_match['available']} days available in {cat_match['category_name']}."
            )

        # Update balance (hold pending)
        cat_match["available"] -= duration
        cat_match["pending"] += duration

        req_num = f"LV-2026-{len(existing_requests) + 1:03d}"
        new_request = {
            "id": f"lv_req_{uuid.uuid4().hex[:8]}",
            "request_number": req_num,
            "employee_code": emp["employee_code"],
            "employee_name": emp["full_name"],
            "category_code": cat_match["code"],
            "category_name": cat_match["category_name"],
            "start_date": start_date_str,
            "end_date": end_date_str,
            "duration_days": duration,
            "is_half_day": is_half_day,
            "status": "PENDING_APPROVAL",
            "reason": reason,
            "handover_notes": handover_notes,
            "applied_on": datetime.now(timezone.utc).isoformat(),
            "approver_name": emp.get("manager_name", "Manager"),
            "approver_comments": None,
            "actioned_on": None,
        }

        self.data["leave_requests"].insert(0, new_request)

        # Notify manager
        if emp.get("manager_code"):
            self.data["notifications"].insert(0, {
                "id": f"notif_{uuid.uuid4().hex[:8]}",
                "employee_code": emp["manager_code"],
                "type": "APPROVAL_PENDING",
                "title": "New Leave Request Submitted",
                "message": f"{emp['full_name']} has applied for {duration} day(s) {cat_match['code']} ({start_date_str} to {end_date_str}).",
                "link_path": "/approvals",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_read": False,
            })

        # Log audit
        self._record_audit(
            emp["employee_code"],
            emp["full_name"],
            "APPLY_LEAVE",
            "LEAVE_REQUEST",
            req_num,
            f"Applied for {duration} days of {cat_match['code']}"
        )

        self.save_data()
        return new_request

    def cancel_leave(self, employee_code: str, request_id: str) -> Dict[str, Any]:
        """Cancels a pending or future approved leave and restores balance."""
        emp = self.get_employee_by_id(employee_code)
        if not emp:
            raise ValueError("Employee not found")

        req = None
        for r in self.data.get("leave_requests", []):
            if (r["id"] == request_id or r["request_number"] == request_id) and r["employee_code"] == emp["employee_code"]:
                req = r
                break

        if not req:
            raise ValueError("Leave request not found or not owned by employee")

        if req["status"] not in ("PENDING_APPROVAL", "APPROVED"):
            raise ValueError(f"Cannot cancel leave in '{req['status']}' state")

        # Restore balance
        balances = self.data.get("leave_balances", {}).get(emp["employee_code"], [])
        for b in balances:
            if b["code"] == req["category_code"]:
                if req["status"] == "PENDING_APPROVAL":
                    b["pending"] = max(0.0, b["pending"] - req["duration_days"])
                    b["available"] += req["duration_days"]
                elif req["status"] == "APPROVED":
                    b["used"] = max(0.0, b["used"] - req["duration_days"])
                    b["available"] += req["duration_days"]
                break

        req["status"] = "CANCELLED"
        req["actioned_on"] = datetime.now(timezone.utc).isoformat()

        self._record_audit(
            emp["employee_code"],
            emp["full_name"],
            "CANCEL_LEAVE",
            "LEAVE_REQUEST",
            req["request_number"],
            f"Cancelled leave of {req['duration_days']} days"
        )

        self.save_data()
        return req

    def get_employee_leave_requests(self, employee_code: str) -> List[Dict[str, Any]]:
        emp = self.get_employee_by_id(employee_code)
        if not emp:
            return []
        requests = [r for r in self.data.get("leave_requests", []) if r["employee_code"] == emp["employee_code"]]
        # Annotate whether employee can cancel
        for r in requests:
            r["can_cancel"] = r["status"] in ("PENDING_APPROVAL", "APPROVED") and r["start_date"] >= date.today().isoformat()
        return requests

    # ─── 3. Reimbursement & Expense Management ───────────────────────────

    def get_expense_summary(self, employee_code: str) -> Dict[str, Any]:
        emp = self.get_employee_by_id(employee_code)
        if not emp:
            raise ValueError("Employee not found")

        claims = [c for c in self.data.get("expense_claims", []) if c["employee_code"] == emp["employee_code"]]
        total = len(claims)
        pending_claims = [c for c in claims if c["status"] in ("SUBMITTED", "UNDER_REVIEW", "INFO_REQUIRED")]
        approved_claims = [c for c in claims if c["status"] in ("APPROVED", "PAYMENT_PROCESSING")]
        paid_claims = [c for c in claims if c["status"] == "PAID"]

        return {
            "employee_code": emp["employee_code"],
            "total_claims": total,
            "pending_approval_count": len(pending_claims),
            "pending_approval_amount": sum(c["amount"] for c in pending_claims),
            "approved_count": len(approved_claims),
            "approved_amount": sum(c["amount"] for c in approved_claims),
            "paid_count": len(paid_claims),
            "paid_amount": sum(c["amount"] for c in paid_claims),
            "currency": "INR",
        }

    def get_expense_claims(self, employee_code: str) -> List[Dict[str, Any]]:
        emp = self.get_employee_by_id(employee_code)
        if not emp:
            return []
        claims = [c for c in self.data.get("expense_claims", []) if c["employee_code"] == emp["employee_code"]]
        for c in claims:
            c["can_cancel"] = c["status"] in ("SUBMITTED", "UNDER_REVIEW")
        return claims

    def submit_expense_claim(
        self,
        employee_code: str,
        category: str,
        expense_date_str: str,
        amount: float,
        merchant: str,
        business_purpose: str,
        receipt_filename: Optional[str] = None,
        notes: Optional[str] = None
    ) -> Dict[str, Any]:
        emp = self.get_employee_by_id(employee_code)
        if not emp:
            raise ValueError("Employee not found")

        if amount <= 0:
            raise ValueError("Expense claim amount must be greater than zero")

        category_labels = {
            "TRAVEL": "Domestic & International Travel",
            "LODGING": "Hotel & Accommodation",
            "MEALS": "Client Entertainment & Meals",
            "CONVEYANCE": "Local Transport & Fuel",
            "INTERNET_MOBILE": "WFH Broadband & Mobile Bill",
            "OTHER": "General Business Expense",
        }

        claims = self.data.get("expense_claims", [])
        claim_num = f"CLM-2026-{len(claims) + 1:03d}"

        new_claim = {
            "id": f"clm_{uuid.uuid4().hex[:8]}",
            "claim_number": claim_num,
            "employee_code": emp["employee_code"],
            "employee_name": emp["full_name"],
            "category": category.upper(),
            "category_label": category_labels.get(category.upper(), "Business Expense"),
            "expense_date": expense_date_str,
            "amount": float(amount),
            "currency": "INR",
            "merchant": merchant,
            "business_purpose": business_purpose,
            "receipt_filename": receipt_filename or "receipt_attached.pdf",
            "receipt_url": f"/api/v1/self-service/receipts/{receipt_filename or 'receipt.pdf'}",
            "status": "UNDER_REVIEW",
            "submitted_on": datetime.now(timezone.utc).isoformat(),
            "approver_name": emp.get("manager_name", "Manager"),
            "reviewer_comments": None,
            "actioned_on": None,
            "settlement_reference": None,
        }

        self.data["expense_claims"].insert(0, new_claim)

        # Notify manager
        if emp.get("manager_code"):
            self.data["notifications"].insert(0, {
                "id": f"notif_{uuid.uuid4().hex[:8]}",
                "employee_code": emp["manager_code"],
                "type": "APPROVAL_PENDING",
                "title": "New Reimbursement Claim",
                "message": f"{emp['full_name']} submitted claim {claim_num} for INR {amount:,.2f} ({merchant}).",
                "link_path": "/approvals",
                "created_at": datetime.now(timezone.utc).isoformat(),
                "is_read": False,
            })

        self._record_audit(
            emp["employee_code"],
            emp["full_name"],
            "SUBMIT_EXPENSE",
            "EXPENSE_CLAIM",
            claim_num,
            f"Submitted claim for INR {amount} ({merchant})"
        )

        self.save_data()
        return new_claim

    def cancel_expense_claim(self, employee_code: str, claim_id: str) -> Dict[str, Any]:
        emp = self.get_employee_by_id(employee_code)
        if not emp:
            raise ValueError("Employee not found")

        claim = None
        for c in self.data.get("expense_claims", []):
            if (c["id"] == claim_id or c["claim_number"] == claim_id) and c["employee_code"] == emp["employee_code"]:
                claim = c
                break

        if not claim:
            raise ValueError("Expense claim not found or not owned by employee")

        if claim["status"] not in ("SUBMITTED", "UNDER_REVIEW"):
            raise ValueError(f"Cannot cancel claim in '{claim['status']}' state")

        claim["status"] = "CANCELLED"
        claim["actioned_on"] = datetime.now(timezone.utc).isoformat()

        self._record_audit(
            emp["employee_code"],
            emp["full_name"],
            "CANCEL_EXPENSE",
            "EXPENSE_CLAIM",
            claim["claim_number"],
            "Employee cancelled reimbursement claim"
        )

        self.save_data()
        return claim

    # ─── 4. Service Desk & Internal Requests ─────────────────────────────

    def get_service_requests(self, employee_code: str) -> List[Dict[str, Any]]:
        emp = self.get_employee_by_id(employee_code)
        if not emp:
            return []
        return [r for r in self.data.get("service_requests", []) if r["employee_code"] == emp["employee_code"]]

    def create_service_request(
        self,
        employee_code: str,
        category: str,
        subject: str,
        description: str,
        priority: str = "MEDIUM"
    ) -> Dict[str, Any]:
        emp = self.get_employee_by_id(employee_code)
        if not emp:
            raise ValueError("Employee not found")

        cat_labels = {
            "IT_ACCESS": "IT Access & Permissions",
            "HARDWARE": "Hardware & Devices",
            "SOFTWARE": "Software Licenses",
            "HR_INQUIRY": "HR Query",
            "HR_DOCUMENT": "Employment Document",
            "TRAVEL_DESK": "Travel Desk Support",
            "FACILITIES": "Facilities & ID Card",
        }
        teams = {
            "IT_ACCESS": "IT Market Data Services",
            "HARDWARE": "IT Infrastructure",
            "SOFTWARE": "IT Core Support",
            "HR_INQUIRY": "People Operations",
            "HR_DOCUMENT": "People Operations",
            "TRAVEL_DESK": "Corporate Travel Desk",
            "FACILITIES": "Facilities & Security",
        }

        reqs = self.data.get("service_requests", [])
        req_num = f"REQ-2026-{len(reqs) + 1:03d}"

        new_req = {
            "id": f"req_{uuid.uuid4().hex[:8]}",
            "request_number": req_num,
            "employee_code": emp["employee_code"],
            "employee_name": emp["full_name"],
            "category": category.upper(),
            "category_label": cat_labels.get(category.upper(), "Service Request"),
            "subject": subject,
            "description": description,
            "priority": priority.upper(),
            "status": "OPEN",
            "assigned_team": teams.get(category.upper(), "Internal ServiceDesk"),
            "assignee_name": "Unassigned",
            "created_at": datetime.now(timezone.utc).isoformat(),
            "updated_at": datetime.now(timezone.utc).isoformat(),
            "comments": [],
        }

        self.data["service_requests"].insert(0, new_req)

        self._record_audit(
            emp["employee_code"],
            emp["full_name"],
            "CREATE_REQUEST",
            "SERVICE_REQUEST",
            req_num,
            f"Created {priority} priority request: {subject}"
        )

        self.save_data()
        return new_req

    def add_service_request_comment(
        self,
        employee_code: str,
        request_id: str,
        comment_text: str
    ) -> Dict[str, Any]:
        emp = self.get_employee_by_id(employee_code)
        if not emp:
            raise ValueError("Employee not found")

        req = None
        for r in self.data.get("service_requests", []):
            if r["id"] == request_id or r["request_number"] == request_id:
                req = r
                break

        if not req:
            raise ValueError("Service request not found")

        # Employee or assigned admin can comment
        new_comment = {
            "id": f"c_{uuid.uuid4().hex[:6]}",
            "author_name": emp["full_name"],
            "author_role": emp["role"],
            "message": comment_text,
            "timestamp": datetime.now(timezone.utc).isoformat(),
        }

        req.setdefault("comments", []).append(new_comment)
        req["updated_at"] = datetime.now(timezone.utc).isoformat()

        self.save_data()
        return req

    # ─── 5. Manager Approvals (Protected Workspace) ──────────────────────

    def get_pending_approvals(self, manager_code: str) -> List[Dict[str, Any]]:
        """
        Returns all pending requests belonging to direct reportees of the authenticated manager.
        """
        mgr = self.get_employee_by_id(manager_code)
        if not mgr:
            raise ValueError("Manager not found")

        # Find all reportees where manager_code matches mgr["employee_code"]
        reportee_codes = {
            e["employee_code"]: e
            for e in self.data.get("employees", {}).values()
            if e.get("manager_code") == mgr["employee_code"]
        }

        # If admin, can also see unassigned or company-wide approvals
        is_admin = mgr.get("role") == "ADMIN"

        pending_items: List[Dict[str, Any]] = []

        # 1. Pending Leaves
        for lv in self.data.get("leave_requests", []):
            if lv["status"] == "PENDING_APPROVAL":
                if lv["employee_code"] in reportee_codes or is_admin:
                    # STRICT: Do not allow self to appear as pending approval
                    if lv["employee_code"] != mgr["employee_code"]:
                        pending_items.append({
                            "id": lv["id"],
                            "item_type": "LEAVE",
                            "reference_number": lv["request_number"],
                            "employee_code": lv["employee_code"],
                            "employee_name": lv["employee_name"],
                            "department": reportee_codes.get(lv["employee_code"], {}).get("department", "DSP AMC"),
                            "title": f"Leave Request: {lv['category_name']} ({lv['duration_days']} Days)",
                            "subtitle": lv["reason"],
                            "amount": None,
                            "currency": None,
                            "date_summary": f"{lv['start_date']} to {lv['end_date']}",
                            "submitted_on": lv["applied_on"],
                            "status": lv["status"],
                            "details": lv,
                        })

        # 2. Pending Expenses
        for clm in self.data.get("expense_claims", []):
            if clm["status"] in ("SUBMITTED", "UNDER_REVIEW"):
                if clm["employee_code"] in reportee_codes or is_admin:
                    if clm["employee_code"] != mgr["employee_code"]:
                        pending_items.append({
                            "id": clm["id"],
                            "item_type": "EXPENSE",
                            "reference_number": clm["claim_number"],
                            "employee_code": clm["employee_code"],
                            "employee_name": clm["employee_name"],
                            "department": reportee_codes.get(clm["employee_code"], {}).get("department", "DSP AMC"),
                            "title": f"Reimbursement Claim: {clm['category_label']}",
                            "subtitle": f"{clm['merchant']} — {clm['business_purpose']}",
                            "amount": clm["amount"],
                            "currency": clm["currency"],
                            "date_summary": f"Incurred on {clm['expense_date']}",
                            "submitted_on": clm["submitted_on"],
                            "status": clm["status"],
                            "details": clm,
                        })

        return pending_items

    def process_approval_decision(
        self,
        approver_code: str,
        item_type: str,
        item_id: str,
        decision: str,
        comments: Optional[str] = None
    ) -> Dict[str, Any]:
        """
        Processes an approval decision (APPROVE, REJECT, REQUEST_INFO).
        Strictly enforces:
        1. Approver cannot be the same employee as the requester (NO SELF-APPROVAL).
        2. Approver must be the requester's manager or an authorized Admin.
        """
        mgr = self.get_employee_by_id(approver_code)
        if not mgr:
            raise ValueError("Approver not found")

        decision_upper = decision.upper()
        if decision_upper not in ("APPROVE", "REJECT", "REQUEST_INFO"):
            raise ValueError(f"Invalid decision '{decision}'. Must be APPROVE, REJECT, or REQUEST_INFO")

        if item_type.upper() == "LEAVE":
            return self._process_leave_approval(mgr, item_id, decision_upper, comments)
        elif item_type.upper() == "EXPENSE":
            return self._process_expense_approval(mgr, item_id, decision_upper, comments)
        else:
            raise ValueError(f"Invalid item_type '{item_type}'")

    def _process_leave_approval(self, mgr: Dict[str, Any], item_id: str, decision: str, comments: Optional[str]) -> Dict[str, Any]:
        req = None
        for r in self.data.get("leave_requests", []):
            if r["id"] == item_id or r["request_number"] == item_id:
                req = r
                break

        if not req:
            raise ValueError(f"Leave request '{item_id}' not found")

        # 1. STRICT PREVENTION OF SELF-APPROVAL
        if req["employee_code"] == mgr["employee_code"]:
            raise PermissionError("Self-approval is strictly prohibited by DSPAMC Governance policy.")

        # 2. Authorization check
        requester = self.get_employee_by_id(req["employee_code"])
        if mgr["role"] != "ADMIN" and requester.get("manager_code") != mgr["employee_code"]:
            raise PermissionError(f"You are not the designated manager for {requester['full_name']}")

        # 3. Update state
        balances = self.data.get("leave_balances", {}).get(req["employee_code"], [])
        cat_match = next((b for b in balances if b["code"] == req["category_code"]), None)

        if decision == "APPROVE":
            req["status"] = "APPROVED"
            req["approver_comments"] = comments or "Approved by Manager."
            if cat_match:
                cat_match["pending"] = max(0.0, cat_match["pending"] - req["duration_days"])
                cat_match["used"] += req["duration_days"]

            self._send_notification(
                req["employee_code"],
                "LEAVE_UPDATE",
                "Leave Request Approved",
                f"Your request {req['request_number']} for {req['duration_days']} days ({req['start_date']}) was approved by {mgr['full_name']}.",
                "/leave"
            )
        elif decision == "REJECT":
            req["status"] = "REJECTED"
            req["approver_comments"] = comments or "Rejected by Manager."
            if cat_match:
                cat_match["pending"] = max(0.0, cat_match["pending"] - req["duration_days"])
                cat_match["available"] += req["duration_days"]

            self._send_notification(
                req["employee_code"],
                "LEAVE_UPDATE",
                "Leave Request Rejected",
                f"Your request {req['request_number']} was not approved. Note: {comments or 'Contact manager'}.",
                "/leave"
            )

        req["actioned_on"] = datetime.now(timezone.utc).isoformat()
        req["approver_name"] = mgr["full_name"]

        self._record_audit(
            mgr["employee_code"],
            mgr["full_name"],
            f"LEAVE_{decision}",
            "LEAVE_REQUEST",
            req["request_number"],
            f"Manager decided {decision} for {req['employee_name']}. Comment: {comments or 'None'}"
        )

        self.save_data()
        return req

    def _process_expense_approval(self, mgr: Dict[str, Any], item_id: str, decision: str, comments: Optional[str]) -> Dict[str, Any]:
        claim = None
        for c in self.data.get("expense_claims", []):
            if c["id"] == item_id or c["claim_number"] == item_id:
                claim = c
                break

        if not claim:
            raise ValueError(f"Expense claim '{item_id}' not found")

        # 1. STRICT PREVENTION OF SELF-APPROVAL
        if claim["employee_code"] == mgr["employee_code"]:
            raise PermissionError("Self-approval is strictly prohibited by DSPAMC Finance Governance policy.")

        # 2. Authorization check
        requester = self.get_employee_by_id(claim["employee_code"])
        if mgr["role"] != "ADMIN" and requester.get("manager_code") != mgr["employee_code"]:
            raise PermissionError(f"You are not the designated manager for {requester['full_name']}")

        # 3. Update state
        if decision == "APPROVE":
            claim["status"] = "APPROVED"
            claim["reviewer_comments"] = comments or "Approved for payment processing."
            self._send_notification(
                claim["employee_code"],
                "EXPENSE_UPDATE",
                "Reimbursement Claim Approved",
                f"Your claim {claim['claim_number']} for INR {claim['amount']:,.2f} has been approved by {mgr['full_name']}.",
                "/reimbursements"
            )
        elif decision == "REJECT":
            claim["status"] = "REJECTED"
            claim["reviewer_comments"] = comments or "Claim rejected."
            self._send_notification(
                claim["employee_code"],
                "EXPENSE_UPDATE",
                "Reimbursement Claim Rejected",
                f"Claim {claim['claim_number']} was rejected. Reason: {comments or 'Non-compliant expense'}.",
                "/reimbursements"
            )
        elif decision == "REQUEST_INFO":
            claim["status"] = "INFO_REQUIRED"
            claim["reviewer_comments"] = comments or "Additional supporting documentation required."
            self._send_notification(
                claim["employee_code"],
                "EXPENSE_UPDATE",
                "Information Required on Claim",
                f"Reviewer requested information for {claim['claim_number']}: {comments or 'Attach invoice'}.",
                "/reimbursements"
            )

        claim["actioned_on"] = datetime.now(timezone.utc).isoformat()
        claim["approver_name"] = mgr["full_name"]

        self._record_audit(
            mgr["employee_code"],
            mgr["full_name"],
            f"EXPENSE_{decision}",
            "EXPENSE_CLAIM",
            claim["claim_number"],
            f"Manager decided {decision} for {claim['employee_name']}. Comment: {comments or 'None'}"
        )

        self.save_data()
        return claim

    # ─── 6. Notifications & Audit Logging ────────────────────────────────

    def _send_notification(self, employee_code: str, notif_type: str, title: str, message: str, link_path: str):
        self.data["notifications"].insert(0, {
            "id": f"notif_{uuid.uuid4().hex[:8]}",
            "employee_code": employee_code,
            "type": notif_type,
            "title": title,
            "message": message,
            "link_path": link_path,
            "created_at": datetime.now(timezone.utc).isoformat(),
            "is_read": False,
        })

    def get_notifications(self, employee_code: str) -> List[Dict[str, Any]]:
        emp = self.get_employee_by_id(employee_code)
        if not emp:
            return []
        return [n for n in self.data.get("notifications", []) if n["employee_code"] == emp["employee_code"]]

    def mark_notification_read(self, employee_code: str, notification_id: str) -> bool:
        emp = self.get_employee_by_id(employee_code)
        if not emp:
            return False
        for n in self.data.get("notifications", []):
            if n["id"] == notification_id and n["employee_code"] == emp["employee_code"]:
                n["is_read"] = True
                self.save_data()
                return True
        return False

    def _record_audit(self, actor_code: str, actor_name: str, action: str, entity_type: str, entity_id: str, details: str):
        self.data.setdefault("audit_logs", []).insert(0, {
            "id": f"aud_{uuid.uuid4().hex[:8]}",
            "timestamp": datetime.now(timezone.utc).isoformat(),
            "actor_code": actor_code,
            "actor_name": actor_name,
            "action": action,
            "entity_type": entity_type,
            "entity_id": entity_id,
            "details": details,
            "ip_address": "127.0.0.1",
        })

    def get_audit_logs(self, limit: int = 50) -> List[Dict[str, Any]]:
        return self.data.get("audit_logs", [])[:limit]

    def get_admin_integrations(self) -> List[Dict[str, Any]]:
        return [
            identity_adapter.get_system_metadata(),
            hrms_adapter.get_system_metadata(),
            expense_adapter.get_system_metadata(),
            servicedesk_adapter.get_system_metadata(),
            {
                "name": "DSPAMC Qdrant Vector Knowledge Store",
                "status": "ONLINE (IN-MEMORY / CLUSTER CONNECTED)",
                "protocol": "gRPC / REST v1.8",
                "production_endpoint": "http://127.0.0.1:6333",
                "is_mock": False,
                "capabilities": ["Semantic Document Search", "RAG Grounded Citations", "Policy Indexing"],
                "indexed_documents": 6,
                "notes": "Houses indexed DSPAMC HR, IT, Finance, Compliance and Operations policies."
            }
        ]

    # ─── 7. Unified Activity Feed ────────────────────────────────────────

    def get_unified_activity(self, employee_code: str) -> List[Dict[str, Any]]:
        emp = self.get_employee_by_id(employee_code)
        if not emp:
            return []

        activities: List[Dict[str, Any]] = []

        # Leaves
        for r in self.get_employee_leave_requests(emp["employee_code"]):
            activities.append({
                "id": f"act_lv_{r['id']}",
                "type": "LEAVE",
                "reference": r["request_number"],
                "title": f"Leave Request: {r['category_name']}",
                "subtitle": f"{r['duration_days']} days ({r['start_date']} to {r['end_date']})",
                "status": r["status"],
                "timestamp": r.get("actioned_on") or r["applied_on"],
                "link": "/leave",
            })

        # Expenses
        for c in self.get_expense_claims(emp["employee_code"]):
            activities.append({
                "id": f"act_clm_{c['id']}",
                "type": "EXPENSE",
                "reference": c["claim_number"],
                "title": f"Claim: {c['category_label']}",
                "subtitle": f"INR {c['amount']:,.2f} at {c['merchant']}",
                "status": c["status"],
                "timestamp": c.get("actioned_on") or c["submitted_on"],
                "link": "/reimbursements",
            })

        # Service requests
        for s in self.get_service_requests(emp["employee_code"]):
            activities.append({
                "id": f"act_req_{s['id']}",
                "type": "SERVICE_DESK",
                "reference": s["request_number"],
                "title": f"Ticket: {s['subject']}",
                "subtitle": f"Priority {s['priority']} • {s['category_label']}",
                "status": s["status"],
                "timestamp": s["updated_at"],
                "link": "/requests",
            })

        activities.sort(key=lambda a: a["timestamp"], reverse=True)
        return activities

    # ─── 8. AI Assistant Live Employee-Data Routing ───────────────────────

    def answer_ai_query(self, employee_code: str, query: str) -> Dict[str, Any]:
        """
        Distinguishes between:
        1. Personal employee-data queries (e.g., leave balance, claim status, open tickets).
           -> Fetches live records from the backend service for this employee and constructs a verified, grounded answer!
        2. General policy & procedural questions (e.g., leave encashment rules, SEBI trading code, per diem allowances).
           -> Routes to knowledge_service.ask() with full citations!
        """
        emp = self.get_employee_by_id(employee_code)
        if not emp:
            # Fallback to general policy
            return KnowledgeService.query_knowledge_base(query)

        q_lower = query.lower()

        # Intent: Leave Balance or Remaining Days
        if any(k in q_lower for k in ("my leave", "leave balance", "days remaining", "how many days", "leave quota", "remaining leave", "casual leave balance")):
            b_data = self.get_leave_balances(emp["employee_code"])
            cats = b_data["categories"]
            lines = [f"Hello **{emp['full_name']}**, here is your real-time leave entitlement summary:"]
            for c in cats:
                lines.append(f"- **{c['category_name']} ({c['code']})**: **{c['available']} days available** (Allocated: {c['allocated']}, Used: {c['used']}, Pending Approval: {c['pending']})")

            lines.append(f"\nTotal available leave across all categories: **{b_data['total_available']} days**.")
            if b_data['upcoming_approved_days'] > 0:
                lines.append(f"Upcoming approved leave: **{b_data['upcoming_approved_days']} days**.")

            lines.append("\n*Rules:* Grounded in approved policy **DSP-HR-001 (Section 3: Annual Entitlement & Carry Forward)**.")

            citations = [{
                "document_id": "DSP-HR-001",
                "document_title": "DSPAMC Comprehensive Leave & Attendance Policy",
                "section": "Section 3: Annual Entitlement & Carry-Forward Quotas",
                "snippet": "Employees receive 18 days Privilege Leave and 12 days Casual/Sick Leave per calendar year.",
                "relevance": 0.99,
                "category": "HR Policy",
                "verified": True,
                "effective_date": "2025-01-01",
                "version": "2.4",
            }]

            return {
                "answer": "\n".join(lines),
                "citations": citations,
                "sources": citations,
                "follow_up_suggestions": [
                    "How do I apply for leave on PeoplePulse?",
                    "What are the carry-forward limits for Privilege Leave?",
                    "What is the status of my latest leave application?"
                ],
                "warnings": [],
                "data_status": "VERIFIED_LIVE_EMPLOYEE_RECORD",
                "is_personal_data": True,
            }

        # Intent: Latest Leave Status
        if any(k in q_lower for k in ("my latest leave", "status of my leave", "leave request status", "track my leave")):
            reqs = self.get_employee_leave_requests(emp["employee_code"])
            if not reqs:
                answer = f"**{emp['full_name']}**, you do not currently have any active or past leave applications on record."
            else:
                latest = reqs[0]
                answer = (
                    f"**{emp['full_name']}**, your latest leave application is **{latest['request_number']}**:\n"
                    f"- **Category:** {latest['category_name']}\n"
                    f"- **Dates:** {latest['start_date']} to {latest['end_date']} ({latest['duration_days']} days)\n"
                    f"- **Status:** **{latest['status']}**\n"
                    f"- **Assigned Approver:** {latest['approver_name']}\n"
                    f"- **Reason:** {latest['reason']}"
                )
                if latest.get("approver_comments"):
                    answer += f"\n- **Approver Comments:** {latest['approver_comments']}"

            return {
                "answer": answer,
                "citations": [{
                    "document_id": "DSP-HR-001",
                    "document_title": "DSPAMC Leave & Attendance Policy",
                    "section": "Section 4: Manager Approval Hierarchy & SLAs",
                    "snippet": "Leave requests must be approved by designated reporting managers within 48 business hours.",
                    "relevance": 0.98,
                    "category": "HR Policy",
                    "verified": True,
                    "effective_date": "2025-01-01",
                    "version": "2.4",
                }],
                "follow_up_suggestions": ["How do I cancel my leave request?", "Check my leave balance"],
                "warnings": [],
                "data_status": "VERIFIED_LIVE_EMPLOYEE_RECORD",
                "is_personal_data": True,
            }

        # Intent: Reimbursement Claim Status / Summary
        if any(k in q_lower for k in ("my reimbursement", "status of my claim", "expense claim status", "my claims", "track my expense")):
            claims = self.get_expense_claims(emp["employee_code"])
            if not claims:
                answer = f"**{emp['full_name']}**, you currently have no reimbursement claims submitted on SAP Concur."
            else:
                latest = claims[0]
                lines = [f"**{emp['full_name']}**, here is the status of your most recent reimbursement claims:"]
                for c in claims[:3]:
                    lines.append(f"- **{c['claim_number']}** ({c['category_label']}): **INR {c['amount']:,.2f}** at {c['merchant']} — Status: **{c['status']}**")
                    if c.get("reviewer_comments"):
                        lines.append(f"  *Reviewer note:* {c['reviewer_comments']}")

                summary = self.get_expense_summary(emp["employee_code"])
                lines.append(f"\nTotal pending reimbursement awaiting payout: **INR {summary['pending_approval_amount']:,.2f}**.")
                answer = "\n".join(lines)

            citations = [{
                "document_id": "DSP-FIN-001",
                "document_title": "DSPAMC Business Travel & Expense Reimbursement Policy",
                "section": "Section 6: SAP Concur Claims Approval & Payroll Credit Cycle",
                "snippet": "Approved expense claims are settled in the bi-weekly reimbursement payroll cycle on the 10th and 25th of every month.",
                "relevance": 0.98,
                "category": "Finance Policy",
                "verified": True,
                "effective_date": "2025-01-01",
                "version": "3.1",
            }]

            return {
                "answer": answer,
                "citations": citations,
                "sources": citations,
                "follow_up_suggestions": [
                    "What documents are needed to submit a reimbursement?",
                    "What are the per diem food limits in Mumbai?"
                ],
                "warnings": [],
                "data_status": "VERIFIED_LIVE_EMPLOYEE_RECORD",
                "is_personal_data": True,
            }

        # Intent: Service Desk / IT Tickets
        if any(k in q_lower for k in ("my ticket", "my it request", "open requests", "service request status", "track my request")):
            tickets = self.get_service_requests(emp["employee_code"])
            if not tickets:
                answer = f"**{emp['full_name']}**, you have no active service desk requests."
            else:
                lines = [f"**{emp['full_name']}**, here are your internal service desk tickets:"]
                for t in tickets:
                    lines.append(f"- **{t['request_number']}**: {t['subject']} — Priority: **{t['priority']}** | Status: **{t['status']}** (Team: {t['assigned_team']})")
                answer = "\n".join(lines)

            citations = [{
                "document_id": "DSP-IT-001",
                "document_title": "DSPAMC Information Security & Identity Access Management Policy",
                "section": "Section 2: ServiceHub IT Access Request Lifecycle",
                "snippet": "Application and infrastructure access requests require role entitlement checks and line manager authorization.",
                "relevance": 0.95,
                "category": "IT Policy",
                "verified": True,
                "effective_date": "2025-01-01",
                "version": "2.2",
            }]

            return {
                "answer": answer,
                "citations": citations,
                "sources": citations,
                "follow_up_suggestions": ["How do I request Bloomberg access?", "Create a new IT ticket"],
                "warnings": [],
                "data_status": "VERIFIED_LIVE_EMPLOYEE_RECORD",
                "is_personal_data": True,
            }

        # Default: General Organizational Policy & Workflow Knowledge (RAG)
        return KnowledgeService.query_knowledge_base(query)


# Singleton self-service engine instance
self_service_engine = SelfServiceEngine()
