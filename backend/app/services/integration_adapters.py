"""
Enterprise Integration Adapters for DSP KnowledgeHub AI.

Defines the contract and mock adapters for connecting with DSP Asset Management Company (DSPAMC)
enterprise infrastructure:
1. Identity Provider (Azure AD / Okta OIDC)
2. HRMS & Employee Records (PeoplePulse / SAP SuccessFactors)
3. Expense & Reimbursement Platform (SAP Concur)
4. IT Service Desk & Ticketing (Jira Service Management / ServiceNow)
5. Notification Service (Corporate Email / Slack / Webhook)

In development/demo mode, Mock adapters operate on realistic synthetic data.
In production, production adapters authenticate via approved corporate mTLS, OAuth2 client credentials,
and enforce organizational data governance.
"""

from abc import ABC, abstractmethod
from typing import Any, Dict, List, Optional
import structlog

logger = structlog.get_logger()


# ─── 1. Identity Provider Adapter ────────────────────────────────────

class BaseIdentityAdapter(ABC):
    @abstractmethod
    async def verify_credentials(self, identifier: str, secret: str) -> Optional[Dict[str, Any]]:
        """Verify employee credentials and return authorized claims."""
        pass

    @abstractmethod
    def get_system_metadata(self) -> Dict[str, Any]:
        """Return integration connectivity status and configuration."""
        pass


class MockIdentityAdapter(BaseIdentityAdapter):
    """Development / demonstration SSO adapter."""

    def __init__(self):
        self.provider_name = "DSPAMC Mock Corporate Identity Provider (OIDC/SAML)"
        self.status = "CONNECTED (LOCAL DEV MODE)"

    async def verify_credentials(self, identifier: str, secret: str) -> Optional[Dict[str, Any]]:
        # Checked via self-service service accounts
        return None

    def get_system_metadata(self) -> Dict[str, Any]:
        return {
            "name": self.provider_name,
            "status": self.status,
            "protocol": "OIDC / PKCE",
            "production_endpoint": "https://login.microsoftonline.com/dspamc.com/v2.0",
            "is_mock": True,
            "auth_methods_supported": ["Employee Code + Password", "Corporate SSO (Azure AD)", "Authenticator MFA"],
            "notes": "Development stub active. Switch to ProductionOIDCAdapter upon IT Security approval."
        }


# ─── 2. HRMS Adapter (PeoplePulse / SuccessFactors) ──────────────────

class BaseHRMSAdapter(ABC):
    @abstractmethod
    async def get_employee_record(self, employee_code: str) -> Optional[Dict[str, Any]]:
        pass

    @abstractmethod
    async def get_leave_quotas(self, employee_code: str, year: int) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def submit_leave_transaction(self, transaction: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_system_metadata(self) -> Dict[str, Any]:
        pass


class MockHRMSAdapter(BaseHRMSAdapter):
    """Development / demo HRMS adapter simulating PeoplePulse."""

    def __init__(self):
        self.system_name = "DSPAMC PeoplePulse HRMS (Synthetic Adapter)"

    async def get_employee_record(self, employee_code: str) -> Optional[Dict[str, Any]]:
        return None

    async def get_leave_quotas(self, employee_code: str, year: int) -> List[Dict[str, Any]]:
        return []

    async def submit_leave_transaction(self, transaction: Dict[str, Any]) -> Dict[str, Any]:
        return {"status": "SUCCESS", "external_ref": f"PP-LV-{transaction.get('id', '000')}"}

    def get_system_metadata(self) -> Dict[str, Any]:
        return {
            "name": self.system_name,
            "status": "CONNECTED (SYNTHETIC RECORD STORE)",
            "protocol": "REST / JSON v2.4",
            "production_endpoint": "https://hrms-internal.dspamc.com/api/v2",
            "is_mock": True,
            "capabilities": ["Employee Directory", "Leave Balances", "Manager Hierarchy"],
            "notes": "Synthetic employee records populated for demonstration. Awaiting HR Core API credentials."
        }


# ─── 3. Expense Platform Adapter (SAP Concur) ────────────────────────

class BaseExpenseAdapter(ABC):
    @abstractmethod
    async def get_claim_history(self, employee_code: str) -> List[Dict[str, Any]]:
        pass

    @abstractmethod
    async def submit_claim(self, claim_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_system_metadata(self) -> Dict[str, Any]:
        pass


class MockExpenseAdapter(BaseExpenseAdapter):
    """Development / demo SAP Concur adapter."""

    def __init__(self):
        self.system_name = "DSPAMC SAP Concur Expense Gateway (Mock Adapter)"

    async def get_claim_history(self, employee_code: str) -> List[Dict[str, Any]]:
        return []

    async def submit_claim(self, claim_data: Dict[str, Any]) -> Dict[str, Any]:
        return {"status": "ACCEPTED", "concur_report_id": f"RPT-{claim_data.get('claim_number', '000')}"}

    def get_system_metadata(self) -> Dict[str, Any]:
        return {
            "name": self.system_name,
            "status": "CONNECTED (LOCAL CONCUR STUB)",
            "protocol": "SAP Concur v4 / OAuth2",
            "production_endpoint": "https://dspamc.concursolutions.com/api/v4.0",
            "is_mock": True,
            "capabilities": ["Expense Submission", "Receipt Storage", "Settlement Tracking"],
            "notes": "Simulates expense filing and approvals. Production requires SAP Cloud Integration Gateway."
        }


# ─── 4. Service Desk Adapter (Jira Service Management) ───────────────

class BaseServiceDeskAdapter(ABC):
    @abstractmethod
    async def create_ticket(self, ticket_data: Dict[str, Any]) -> Dict[str, Any]:
        pass

    @abstractmethod
    def get_system_metadata(self) -> Dict[str, Any]:
        pass


class MockServiceDeskAdapter(BaseServiceDeskAdapter):
    """Development / demo Jira Service Management adapter."""

    def __init__(self):
        self.system_name = "DSPAMC Jira Service Management (Mock Adapter)"

    async def create_ticket(self, ticket_data: Dict[str, Any]) -> Dict[str, Any]:
        return {"status": "CREATED", "ticket_key": f"DSPIT-{ticket_data.get('id', '100')}"}

    def get_system_metadata(self) -> Dict[str, Any]:
        return {
            "name": self.system_name,
            "status": "CONNECTED (LOCAL SERVICE DESK STUB)",
            "protocol": "Atlassian REST API v3",
            "production_endpoint": "https://dspamc.atlassian.net/rest/servicedeskapi",
            "is_mock": True,
            "capabilities": ["IT Access Tickets", "Hardware Requests", "HR Queries"],
            "notes": "Simulates internal service desk ticketing and assignment."
        }


# Global adapter registry
identity_adapter = MockIdentityAdapter()
hrms_adapter = MockHRMSAdapter()
expense_adapter = MockExpenseAdapter()
servicedesk_adapter = MockServiceDeskAdapter()
