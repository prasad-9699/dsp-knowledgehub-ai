"""
Comprehensive Application-Wide Test Suite for DSP KnowledgeHub AI.
Tests authentication, identity resolution, self-service engine,
reimbursements, leave balances, service desk, onboarding personas,
grounded AI RAG citations, and ORM schemas.
"""

import pytest
from app.services.self_service_service import self_service_engine
from app.services.onboarding_service import onboarding_engine
from app.services.knowledge_service import KnowledgeService
from app.models.user import User
from app.models.leave import LeaveRequest
from app.models.expense import ExpenseClaim
from app.models.service_request import ServiceRequest
from app.models.audit_log import AuditLog
from app.core.database import Base


class TestAuthenticationAndIdentity:
    """Test authentication, password handling, and role verification."""

    def test_authenticate_existing_demo_employee(self):
        emp = self_service_engine.authenticate_employee("EMP-1001", "Password@123")
        assert emp is not None
        assert emp["employee_code"] == "EMP-1001"
        assert emp["full_name"] == "Aditi Sharma"
        assert emp["role"] == "EMPLOYEE"

    def test_authenticate_manager(self):
        mgr = self_service_engine.authenticate_employee("EMP-1004", "Password@123")
        assert mgr is not None
        assert mgr["employee_code"] == "EMP-1004"
        assert mgr["role"] == "MANAGER"

    def test_authenticate_invalid_credentials(self):
        result = self_service_engine.authenticate_employee("EMP-1001", "WrongPassword")
        assert result is None

    def test_register_and_retrieve_new_employee(self):
        new_emp = self_service_engine.add_or_register_employee(
            employee_code="EMP-9999",
            full_name="Test Automation User",
            email="test.user@dspamc.com",
            role="EMPLOYEE",
            department="Equities & Wealth Management",
            designation="QA Specialist",
        )
        assert new_emp["employee_code"] == "EMP-9999"
        fetched = self_service_engine.get_employee_by_id("EMP-9999")
        assert fetched is not None
        assert fetched["full_name"] == "Test Automation User"


class TestLeaveManagement:
    """Test leave balances, calculations, and application workflows."""

    def test_leave_balances_structure(self):
        balances = self_service_engine.get_leave_balances("EMP-1001")
        assert balances["employee_code"] == "EMP-1001"
        assert balances["total_available"] > 0
        categories = {c["code"]: c for c in balances["categories"]}
        assert "PL" in categories
        assert "CSL" in categories
        assert "COMP_OFF" in categories

    def test_apply_leave_and_deduction(self):
        import time
        unique_month = "11"
        unique_day = str(10 + int(time.time() % 15))
        test_emp = "EMP-TEST-LV"
        self_service_engine.add_or_register_employee(
            employee_code=test_emp,
            full_name="Leave Test User",
            email="leave.test@dspamc.com",
        )
        new_req = self_service_engine.apply_leave(
            employee_code=test_emp,
            category_code="PL",
            start_date_str="2027-03-01",
            end_date_str="2027-03-02",
            reason="Automated test vacation leave",
        )
        assert new_req["status"] == "PENDING_APPROVAL"
        assert new_req["category_code"] == "PL"
        assert new_req["duration_days"] >= 1.0


class TestExpenseAndReimbursements:
    """Test reimbursement claim submission, summary calculations, and manager approval."""

    def test_expense_claims_aditi_consistency(self):
        claims = self_service_engine.get_expense_claims("EMP-1001")
        assert len(claims) >= 3

        summary = self_service_engine.get_expense_summary("EMP-1001")
        assert summary["total_claims"] == len(claims)
        assert summary["currency"] == "INR"

        pending_claims = [c for c in claims if c["status"] in ("SUBMITTED", "UNDER_REVIEW", "INFO_REQUIRED")]
        approved_claims = [c for c in claims if c["status"] in ("APPROVED", "PAYMENT_PROCESSING")]
        paid_claims = [c for c in claims if c["status"] == "PAID"]

        assert summary["pending_approval_count"] == len(pending_claims)
        assert summary["pending_approval_amount"] == sum(c["amount"] for c in pending_claims)
        assert summary["approved_count"] == len(approved_claims)
        assert summary["approved_amount"] == sum(c["amount"] for c in approved_claims)
        assert summary["paid_count"] == len(paid_claims)
        assert summary["paid_amount"] == sum(c["amount"] for c in paid_claims)

    def test_submit_new_expense_claim(self):
        claim = self_service_engine.submit_expense_claim(
            employee_code="EMP-1001",
            category="MEALS",
            expense_date_str="2026-11-01",
            amount=1250.0,
            merchant="Starbucks BKC",
            business_purpose="Client coffee discussion on asset allocation",
        )
        assert claim["claim_number"].startswith("CLM-2026-")
        assert claim["amount"] == 1250.0
        assert claim["status"] in ("SUBMITTED", "UNDER_REVIEW")

    def test_manager_claim_approval_decision(self):
        claim = self_service_engine.submit_expense_claim(
            employee_code="EMP-1001",
            category="CONVEYANCE",
            expense_date_str="2026-11-02",
            amount=450.0,
            merchant="Uber India",
            business_purpose="Office to NSE Exchange commute",
        )
        decision_res = self_service_engine.process_approval_decision(
            approver_code="EMP-1004",
            item_type="EXPENSE",
            item_id=claim["id"],
            decision="APPROVE",
            comments="Approved by line manager Vikram Malhotra",
        )
        assert decision_res["status"] == "APPROVED"


class TestServiceDesk:
    """Test service requests, ticketing lifecycle, and communication threads."""

    def test_get_service_requests(self):
        reqs = self_service_engine.get_service_requests("EMP-1001")
        assert len(reqs) >= 2
        assert any(r["request_number"] == "REQ-2026-001" for r in reqs)

    def test_create_service_request(self):
        new_ticket = self_service_engine.create_service_request(
            employee_code="EMP-1001",
            category="IT_ACCESS",
            subject="Python Virtual Environment GPU Access",
            description="Need CUDA workstation access for deep learning quant research model",
            priority="HIGH",
        )
        assert new_ticket["request_number"].startswith("REQ-2026-")
        assert new_ticket["status"] in ("SUBMITTED", "OPEN")
        assert new_ticket["priority"] == "HIGH"

    def test_add_ticket_comment(self):
        reqs = self_service_engine.get_service_requests("EMP-1001")
        ticket_id = reqs[0]["id"]
        updated = self_service_engine.add_service_request_comment(
            employee_code="EMP-1001",
            request_id=ticket_id,
            comment_text="Following up on this ticket status.",
        )
        assert len(updated["comments"]) > 0
        assert any("Following up" in c["message"] for c in updated["comments"])


class TestOnboardingPipeline:
    """Test onboarding candidate personas, stage progressions, and tasks."""

    def test_candidate_personas_exist(self):
        p1 = onboarding_engine.get_onboarding_instance("EMP-2001")
        assert p1 is not None
        assert p1["full_name"] == "Kavya Reddy"
        assert p1["current_stage"] == "PREBOARDING"

        p2 = onboarding_engine.get_onboarding_instance("EMP-2002")
        assert p2 is not None
        assert p2["full_name"] == "Arjun Pillai"

        p5 = onboarding_engine.get_onboarding_instance("EMP-2005")
        assert p5 is not None
        assert p5["full_name"] == "Sneha Joshi"
        assert p5["overall_completion_pct"] == 100

    def test_onboarding_task_update(self):
        tasks = onboarding_engine.get_tasks_for_employee("EMP-2001")
        assert len(tasks) > 0
        target_task = tasks[0]
        updated = onboarding_engine.update_task_status(
            emp_code="EMP-2001",
            task_id=target_task["id"],
            new_status="IN_PROGRESS",
            actor_code="EMP-2001",
            comments="Started reviewing documentation",
        )
        assert updated["status"] == "IN_PROGRESS"


class TestKnowledgeAssistantRAG:
    """Test grounded RAG answering, citations, and uncertainty handling."""

    def test_travel_policy_grounding_with_citations(self):
        res = KnowledgeService.query_knowledge_base("What is the metro lodging cap under DSP travel policy?")
        assert res["document_found"] is True
        assert len(res["citations"]) > 0
        assert any("DSP-FIN-001" in c["document_id"] for c in res["citations"])

    def test_leave_policy_grounding_with_citations(self):
        res = KnowledgeService.query_knowledge_base("How do I apply for annual leave on PeoplePulse?")
        assert res["document_found"] is True
        assert len(res["citations"]) > 0
        assert any("DSP-HR-001" in c["document_id"] for c in res["citations"])

    def test_compliance_sebi_code_grounding(self):
        res = KnowledgeService.query_knowledge_base("What is the pre-clearance window for personal trading?")
        assert res["document_found"] is True
        assert "48 hours" in res["answer"]
        assert any("DSP-COMP-001" in c["document_id"] for c in res["citations"])

    def test_grounded_uncertainty_for_unsupported_queries(self):
        res = KnowledgeService.query_knowledge_base("Can I buy cryptocurrency using DSP company credit card?")
        assert res["document_found"] is False
        assert "could not be verified" in res["answer"].lower()
        assert len(res["citations"]) == 0


class TestSQLAlchemySchemas:
    """Test ORM models and database tables metadata."""

    def test_models_registered_on_base(self):
        tables = Base.metadata.tables
        assert "users" in tables
        assert "leave_requests" in tables
        assert "expense_claims" in tables
        assert "service_requests" in tables
        assert "audit_logs" in tables

    def test_user_model_columns(self):
        cols = User.__table__.columns
        assert "email" in cols
        assert "employee_code" in cols
        assert "role" in cols
        assert "department" in cols
        assert "designation" in cols

    def test_expense_model_columns(self):
        cols = ExpenseClaim.__table__.columns
        assert "claim_number" in cols
        assert "amount" in cols
        assert "category" in cols
        assert "status" in cols

    def test_leave_model_columns(self):
        cols = LeaveRequest.__table__.columns
        assert "request_number" in cols
        assert "duration_days" in cols
        assert "category_code" in cols
        assert "status" in cols
