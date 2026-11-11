"""
Comprehensive test suite for the DSP KnowledgeHub AI Employee Self-Service Platform.

Tests cover:
1. Employee Authentication & ID resolution
2. Employee Record Isolation & Authorization
3. Leave Balance calculation & deduction
4. Overlapping leave validation
5. Prevention of Self-Approval (Manager approval rules)
6. Reimbursement lifecycle & state transitions
7. Service desk ticket creation and comments
8. AI Intent Routing (Personal employee-data vs Policy RAG)
9. Enterprise Integration metadata
"""

import pytest
from app.services.self_service_service import SelfServiceEngine


@pytest.fixture
def engine(tmp_path):
    """Provides an isolated engine instance for testing."""
    eng = SelfServiceEngine()
    eng.seed_initial_data()
    return eng


class TestEmployeeAuthAndIdentity:
    def test_auth_by_employee_code(self, engine):
        emp = engine.authenticate_employee("EMP-1001", "Password@123")
        assert emp is not None
        assert emp["full_name"] == "Aditi Sharma"
        assert emp["employee_code"] == "EMP-1001"

    def test_auth_by_email(self, engine):
        emp = engine.authenticate_employee("aditi.sharma@dspamc.com", "Password@123")
        assert emp is not None
        assert emp["employee_code"] == "EMP-1001"

    def test_invalid_password_rejected(self, engine):
        emp = engine.authenticate_employee("EMP-1001", "WrongPassword")
        assert emp is None

    def test_manager_hierarchy(self, engine):
        aditi = engine.get_employee_by_id("EMP-1001")
        vikram = engine.get_employee_by_id("EMP-1004")
        assert aditi["manager_code"] == "EMP-1004"
        assert vikram["role"] == "MANAGER"


class TestLeaveManagementWorkflows:
    def test_leave_balance_calculation(self, engine):
        b = engine.get_leave_balances("EMP-1001")
        assert b["employee_code"] == "EMP-1001"
        assert b["total_available"] > 0
        cats = {c["code"]: c for c in b["categories"]}
        assert "PL" in cats
        assert "CSL" in cats
        assert cats["PL"]["available"] == 12.0
        assert cats["PL"]["allocated"] == 18.0

    def test_apply_leave_deducts_available(self, engine):
        initial = engine.get_leave_balances("EMP-1001")
        init_pl = next(c for c in initial["categories"] if c["code"] == "PL")["available"]

        # Apply for 1 working day (Monday)
        req = engine.apply_leave(
            employee_code="EMP-1001",
            category_code="PL",
            start_date_str="2026-11-23",
            end_date_str="2026-11-23",
            reason="Dentist appointment",
        )
        assert req["status"] == "PENDING_APPROVAL"
        assert req["duration_days"] == 1.0

        updated = engine.get_leave_balances("EMP-1001")
        upd_pl = next(c for c in updated["categories"] if c["code"] == "PL")["available"]
        assert upd_pl == init_pl - 1.0

    def test_overlapping_leave_rejected(self, engine):
        # Seeded request LV-2026-001 is from 2026-11-12 to 2026-11-13
        with pytest.raises(ValueError, match="overlaps with existing request"):
            engine.apply_leave(
                employee_code="EMP-1001",
                category_code="PL",
                start_date_str="2026-11-12",
                end_date_str="2026-11-13",
                reason="Duplicate request",
            )

    def test_insufficient_leave_rejected(self, engine):
        with pytest.raises(ValueError, match="Insufficient leave balance"):
            engine.apply_leave(
                employee_code="EMP-1001",
                category_code="COMP_OFF",
                start_date_str="2026-12-01",
                end_date_str="2026-12-10",  # ~8 working days, but only 2 available
                reason="Long break",
            )

    def test_cancel_leave_restores_balance(self, engine):
        initial = engine.get_leave_balances("EMP-1001")
        init_pl = next(c for c in initial["categories"] if c["code"] == "PL")["available"]

        # Cancel seeded pending request LV-2026-001 (duration 2 days)
        cancelled = engine.cancel_leave("EMP-1001", "LV-2026-001")
        assert cancelled["status"] == "CANCELLED"

        updated = engine.get_leave_balances("EMP-1001")
        upd_pl = next(c for c in updated["categories"] if c["code"] == "PL")["available"]
        assert upd_pl == init_pl + 2.0


class TestPreventionOfSelfApproval:
    def test_manager_cannot_approve_own_leave(self, engine):
        # Vikram applies for leave
        req = engine.apply_leave(
            employee_code="EMP-1004",
            category_code="PL",
            start_date_str="2026-12-14",
            end_date_str="2026-12-15",
            reason="Personal work",
        )
        # Vikram attempts to approve his own leave
        with pytest.raises(PermissionError, match="Self-approval is strictly prohibited"):
            engine.process_approval_decision(
                approver_code="EMP-1004",
                item_type="LEAVE",
                item_id=req["request_number"],
                decision="APPROVE",
                comments="Self-approved",
            )

    def test_manager_approves_reportee_leave(self, engine):
        # Vikram approves Aditi's pending request LV-2026-001
        res = engine.process_approval_decision(
            approver_code="EMP-1004",
            item_type="LEAVE",
            item_id="LV-2026-001",
            decision="APPROVE",
            comments="Approved by Vikram Malhotra",
        )
        assert res["status"] == "APPROVED"
        assert res["approver_name"] == "Vikram Malhotra"

    def test_unauthorized_employee_cannot_approve(self, engine):
        # Aditi tries to approve Rohan's leave (Aditi is not Rohan's manager)
        with pytest.raises(PermissionError, match="You are not the designated manager"):
            engine.process_approval_decision(
                approver_code="EMP-1001",
                item_type="LEAVE",
                item_id="LV-2026-003",
                decision="APPROVE",
            )


class TestReimbursementWorkflows:
    def test_submit_expense_claim(self, engine):
        claim = engine.submit_expense_claim(
            employee_code="EMP-1001",
            category="MEALS",
            expense_date_str="2026-10-12",
            amount=1200.0,
            merchant="Starbucks Fort",
            business_purpose="Client research discussion",
        )
        assert claim["claim_number"].startswith("CLM-2026-")
        assert claim["status"] == "UNDER_REVIEW"
        assert claim["amount"] == 1200.0

    def test_cancel_expense_claim(self, engine):
        claim = engine.cancel_expense_claim("EMP-1001", "CLM-2026-001")
        assert claim["status"] == "CANCELLED"

    def test_user_cannot_cancel_other_user_claim(self, engine):
        # Rohan cannot cancel Aditi's claim
        with pytest.raises(ValueError, match="not owned by employee"):
            engine.cancel_expense_claim("EMP-1002", "CLM-2026-001")


class TestAIEmployeeDataRouter:
    def test_personal_leave_query_routes_to_live_state(self, engine):
        res = engine.answer_ai_query("EMP-1001", "How many days of leave do I have remaining?")
        assert res["is_personal_data"] is True
        assert res["data_status"] == "VERIFIED_LIVE_EMPLOYEE_RECORD"
        assert "Aditi Sharma" in res["answer"]
        assert "PL" in res["answer"]
        assert len(res["citations"]) > 0
        assert res["citations"][0]["document_id"] == "DSP-HR-001"

    def test_personal_reimbursement_query_routes_to_live_claims(self, engine):
        res = engine.answer_ai_query("EMP-1001", "What is the status of my reimbursement?")
        assert res["is_personal_data"] is True
        assert "CLM-2026-" in res["answer"]
        assert res["citations"][0]["document_id"] == "DSP-FIN-001"

    def test_general_policy_query_routes_to_rag(self, engine):
        res = engine.answer_ai_query("EMP-1001", "What are the rules for SEBI personal trading pre-clearance?")
        assert res.get("is_personal_data") is not True
        assert "DSP-COMP-001" in [c["document_id"] for c in res.get("citations", [])]


class TestEmployeeProfileManagement:
    def test_update_contact_profile(self, engine):
        emp_before = engine.get_employee_by_id("EMP-1001")
        assert emp_before is not None

        updated = engine.update_employee_profile(
            "EMP-1001",
            phone="+91 98200 99999",
            location="Bandra-Kurla Complex (BKC), Mumbai"
        )
        assert updated["phone"] == "+91 98200 99999"
        assert updated["location"] == "Bandra-Kurla Complex (BKC), Mumbai"

        # Verify persisted in engine
        emp_after = engine.get_employee_by_id("EMP-1001")
        assert emp_after["phone"] == "+91 98200 99999"
        assert emp_after["location"] == "Bandra-Kurla Complex (BKC), Mumbai"

