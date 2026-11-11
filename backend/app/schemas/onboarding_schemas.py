"""
DSP KnowledgeHub AI — Employee Onboarding Schemas

Request/Response models for the onboarding API endpoints.
"""

from typing import Any, Dict, List, Optional
from pydantic import BaseModel, Field


class TaskStatusUpdate(BaseModel):
    """Update the status of an onboarding task."""
    task_id: str
    new_status: str  # NOT_STARTED | IN_PROGRESS | SUBMITTED_FOR_REVIEW | COMPLETED | ACTION_REQUIRED
    comments: Optional[str] = None


class HRTaskReview(BaseModel):
    """HR/manager reviews and updates an onboarding task."""
    task_id: str
    employee_code: str
    new_status: str  # COMPLETED | ACTION_REQUIRED | NOT_STARTED
    comments: Optional[str] = None


class DocumentSubmitRequest(BaseModel):
    """Request model for submitting an onboarding document."""
    doc_type_id: str
    filename: str = Field(..., min_length=1, max_length=255)
    file_size_kb: int = Field(..., ge=1, le=51200)  # Max 50 MB


class DocumentReviewRequest(BaseModel):
    """HR reviews a submitted document."""
    employee_code: str
    submission_id: str
    new_status: str  # VERIFIED | CORRECTION_REQUIRED | REJECTED
    comments: Optional[str] = None


class OnboardingAssignRequest(BaseModel):
    """Assign an onboarding plan to a new employee."""
    employee_code: str
    full_name: str
    email: str
    department: str
    designation: str
    joining_date: str  # ISO date string YYYY-MM-DD
    template_id: str = "TPL-OB-STANDARD-001"
    manager_code: Optional[str] = None
    manager_name: Optional[str] = None
    buddy_code: Optional[str] = None
    buddy_name: Optional[str] = None


class OnboardingAIQueryRequest(BaseModel):
    """AI assistant query related to onboarding."""
    question: str = Field(..., min_length=1, max_length=1000)
