"""
API response schemas.

Consistent API response structures with metadata for data provenance.
"""

from datetime import datetime
from typing import Any, Generic, Optional, TypeVar
from pydantic import BaseModel, Field

T = TypeVar("T")


class ResponseMetadata(BaseModel):
    """Metadata attached to every API response."""
    timestamp: datetime
    fetched_at: Optional[datetime] = None
    source: str = "demo"
    data_status: str = "DEMO"
    model_version: Optional[str] = None
    is_demo: bool = True


class APIResponse(BaseModel, Generic[T]):
    """Standard API response wrapper."""
    success: bool = True
    data: Optional[T] = None
    metadata: ResponseMetadata
    error: Optional[str] = None

    class Config:
        json_schema_extra = {
            "example": {
                "success": True,
                "data": {},
                "metadata": {
                    "timestamp": "2026-09-29T15:30:00+05:30",
                    "source": "demo",
                    "data_status": "DEMO",
                    "is_demo": True,
                },
                "error": None,
            }
        }


class PaginatedResponse(BaseModel, Generic[T]):
    """Paginated API response."""
    success: bool = True
    data: list[T] = []
    total: int = 0
    page: int = 1
    page_size: int = 20
    pages: int = 0
    metadata: ResponseMetadata
    error: Optional[str] = None


# ─── Auth Schemas ────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class RegisterRequest(BaseModel):
    email: str
    password: str
    full_name: str
    role: str = "EMPLOYEE"
    employee_code: Optional[str] = None
    department: Optional[str] = "Equities & Wealth Management"
    designation: Optional[str] = "Employee"


class TokenResponse(BaseModel):
    access_token: str
    refresh_token: str
    token_type: str = "bearer"
    expires_in: int


class UserResponse(BaseModel):
    id: str
    email: str
    full_name: str
    role: str
    is_active: bool
    is_verified: bool
    created_at: datetime

    class Config:
        from_attributes = True


# ─── Market Schemas ──────────────────────────────────────────────────

class QuoteResponse(BaseModel):
    symbol: str
    exchange: str
    company_name: str
    last_price: float
    change: float
    change_pct: float
    open: float
    high: float
    low: float
    close: float
    previous_close: float
    volume: int
    market_cap: Optional[float] = None
    high_52w: Optional[float] = None
    low_52w: Optional[float] = None
    timestamp: Optional[datetime] = None
    data_status: str = "DEMO"


class IndexResponse(BaseModel):
    symbol: str
    name: str
    last_value: float
    change: float
    change_pct: float
    open: float
    high: float
    low: float
    close: float
    timestamp: Optional[datetime] = None
    data_status: str = "DEMO"


class MarketOverviewResponse(BaseModel):
    indices: list[IndexResponse]
    breadth: dict
    data_freshness: dict
    data_status: str = "DEMO"


class HistoricalPriceResponse(BaseModel):
    trade_date: str
    open: float
    high: float
    low: float
    close: float
    adj_close: float
    volume: int


class FundamentalResponse(BaseModel):
    symbol: str
    company_name: str
    sector: str
    industry: str
    market_cap: float
    pe_ratio: Optional[float] = None
    pb_ratio: Optional[float] = None
    ev_ebitda: Optional[float] = None
    dividend_yield: Optional[float] = None
    eps: Optional[float] = None
    book_value: Optional[float] = None
    roe: Optional[float] = None
    roce: Optional[float] = None
    operating_margin: Optional[float] = None
    net_margin: Optional[float] = None
    revenue_growth: Optional[float] = None
    profit_growth: Optional[float] = None
    eps_growth: Optional[float] = None
    debt_equity: Optional[float] = None
    interest_coverage: Optional[float] = None
    free_cash_flow: Optional[float] = None
    data_date: Optional[str] = None
    data_status: str = "DEMO"


# ─── Prediction Schemas ─────────────────────────────────────────────

class PredictionResponse(BaseModel):
    symbol: str
    prediction_horizon: str = "30D"
    expected_return_estimate: float
    risk_estimate: float
    relative_score: Optional[float] = None
    signal: Optional[str] = None
    model_version: str
    prediction_timestamp: str
    data_timestamp: str
    explanations: list[dict] = []
    data_status: str = "DEMO"


class ShapExplanation(BaseModel):
    feature: str
    value: float
    shap_value: float
    direction: str  # "positive" or "negative"


# ─── Portfolio Schemas ───────────────────────────────────────────────

class PortfolioHoldingInput(BaseModel):
    symbol: str
    quantity: int
    average_cost: float
    asset_class: str = "EQUITY"


class PortfolioCreateRequest(BaseModel):
    name: str
    holdings: list[PortfolioHoldingInput] = []
    benchmark: str = "NIFTY 50"
    description: Optional[str] = None


class PortfolioAnalyticsResponse(BaseModel):
    portfolio_id: str
    total_value: float
    invested_value: float
    pnl: float
    pnl_pct: float
    cagr: Optional[float] = None
    volatility: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    sortino_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    beta: Optional[float] = None
    tracking_error: Optional[float] = None
    sector_allocation: dict = {}
    top_holdings: list[dict] = []
    data_status: str = "DEMO"


class ScenarioResult(BaseModel):
    scenario_name: str
    description: str
    portfolio_impact_pct: float
    portfolio_impact_value: float
    affected_holdings: list[dict] = []


# ─── Client Schemas ──────────────────────────────────────────────────

class InvestorProfileCreate(BaseModel):
    age: Optional[int] = None
    employment_status: Optional[str] = None
    dependents: Optional[int] = None
    annual_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    monthly_investable_surplus: Optional[float] = None
    total_assets: Optional[float] = None
    total_liabilities: Optional[float] = None
    emergency_fund_months: Optional[int] = None
    initial_investment: Optional[float] = None
    monthly_sip: Optional[float] = None
    investment_horizon_years: Optional[int] = None
    investment_objective: Optional[str] = None
    liquidity_requirement: Optional[str] = None
    investment_experience: Optional[str] = None


class RiskAssessmentRequest(BaseModel):
    responses: dict  # Questionnaire answers


class RiskAssessmentResponse(BaseModel):
    risk_tolerance_score: float
    risk_capacity_score: float
    suitability_profile: str
    max_equity_allocation: float
    max_single_security_weight: float
    max_sector_weight: float


class GoalCreate(BaseModel):
    name: str
    goal_type: str
    target_amount: float
    target_date: str
    current_savings: float = 0
    monthly_contribution: float = 0
    priority: int = 1


class GoalResponse(BaseModel):
    id: str
    name: str
    goal_type: str
    target_amount: float
    target_date: str
    current_savings: float
    monthly_contribution: float
    progress_pct: float
    time_remaining_months: int
    required_return_estimate: Optional[float] = None
    is_active: bool

    class Config:
        from_attributes = True


# ─── Research & KnowledgeHub Schemas ─────────────────────────────────

class ResearchQuery(BaseModel):
    question: str
    context: Optional[dict] = None  # Optional context like portfolio_id, symbol, department
    conversation_id: Optional[str] = None


class CitationItem(BaseModel):
    document_id: str
    document_title: str
    section: str
    page: Optional[int] = None
    snippet: str
    relevance: float = 0.95
    category: str = "HR"
    verified: bool = True
    url: Optional[str] = None


class ResearchResponse(BaseModel):
    answer: str
    sources: list[dict] = []
    citations: list[CitationItem] = []
    follow_up_suggestions: list[str] = []
    structured_metrics: Optional[dict] = None
    model_context: Optional[dict] = None
    warnings: list[str] = []
    data_status: str = "DEMO"


class DocumentSearchRequest(BaseModel):
    query: str
    filters: Optional[dict] = None
    limit: int = 10


class DocumentItem(BaseModel):
    id: str
    title: str
    category: str  # HR, IT, Compliance, Finance, Operations, Equity
    version: str
    last_updated: str
    author: str
    department: str
    summary: str
    status: str = "INDEXED"
    chunk_count: int = 12
    security_clearance: str = "Internal Employee"
    file_type: str = "PDF"
    size_kb: int = 245
    sections: list[dict] = []


class DocumentSearchResponse(BaseModel):
    results: list[dict] = []
    total: int = 0


class DocumentUploadRequest(BaseModel):
    title: str
    category: str
    department: str
    content: Optional[str] = None
    author: Optional[str] = None


class ConversationMessage(BaseModel):
    id: str
    role: str
    content: str
    sources: list[dict] = []
    citations: list[dict] = []
    follow_up_suggestions: list[str] = []
    timestamp: str


class ConversationRecord(BaseModel):
    id: str
    title: str
    created_at: str
    updated_at: str
    pinned: bool = False
    messages: list[ConversationMessage] = []


class FeedbackRequest(BaseModel):
    message_id: str
    question: Optional[str] = None
    rating: str  # helpful or not_helpful
    citation_accurate: Optional[bool] = None
    feedback_text: Optional[str] = None



# ═══════════════════════════════════════════════════════════════════════
# CLIENT SCHEMAS — Advisor Copilot
# ═══════════════════════════════════════════════════════════════════════

class ClientCreate(BaseModel):
    """Create a new client."""
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    date_of_birth: Optional[str] = None
    age: Optional[int] = None
    employment_status: Optional[str] = None
    dependents: Optional[int] = None
    annual_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    monthly_investable_surplus: Optional[float] = None
    total_assets: Optional[float] = None
    total_liabilities: Optional[float] = None
    emergency_fund_months: Optional[int] = None
    initial_investment: Optional[float] = None
    monthly_sip: Optional[float] = None
    investment_horizon_years: Optional[int] = None
    investment_objective: Optional[str] = None
    liquidity_requirement: Optional[str] = None
    investment_experience: Optional[str] = None
    notes: Optional[str] = None


class ClientUpdate(BaseModel):
    """Update an existing client."""
    full_name: Optional[str] = None
    email: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    employment_status: Optional[str] = None
    dependents: Optional[int] = None
    annual_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    monthly_investable_surplus: Optional[float] = None
    total_assets: Optional[float] = None
    total_liabilities: Optional[float] = None
    investment_horizon_years: Optional[int] = None
    investment_objective: Optional[str] = None
    liquidity_requirement: Optional[str] = None
    investment_experience: Optional[str] = None
    status: Optional[str] = None
    notes: Optional[str] = None


class ClientSummary(BaseModel):
    """Client row in the Client Book table."""
    id: str
    client_code: str
    full_name: str
    email: Optional[str] = None
    status: str
    kyc_status: str
    investment_objective: Optional[str] = None
    risk_profile: Optional[str] = None
    aum: Optional[float] = None
    last_review_date: Optional[str] = None
    pending_alerts: int = 0
    assigned_employee: Optional[str] = None

    class Config:
        from_attributes = True


class ClientDetailResponse(BaseModel):
    """Full Client 360° response."""
    id: str
    client_code: str
    full_name: str
    email: Optional[str] = None
    phone: Optional[str] = None
    age: Optional[int] = None
    employment_status: Optional[str] = None
    dependents: Optional[int] = None

    # Financial
    annual_income: Optional[float] = None
    monthly_expenses: Optional[float] = None
    monthly_investable_surplus: Optional[float] = None
    total_assets: Optional[float] = None
    total_liabilities: Optional[float] = None
    emergency_fund_months: Optional[int] = None

    # Investment profile
    initial_investment: Optional[float] = None
    monthly_sip: Optional[float] = None
    investment_horizon_years: Optional[int] = None
    investment_objective: Optional[str] = None
    liquidity_requirement: Optional[str] = None
    investment_experience: Optional[str] = None

    # Status
    status: str = "ACTIVE"
    kyc_status: str = "PENDING"
    last_review_date: Optional[str] = None
    notes: Optional[str] = None

    # Related data
    risk_profile: Optional[dict] = None
    goals: list[dict] = []
    portfolio_summary: Optional[dict] = None
    alerts: list[dict] = []
    suitability_findings: list[dict] = []

    class Config:
        from_attributes = True


class ClientRiskAssessmentRequest(BaseModel):
    """Run a risk assessment for a client."""
    responses: dict  # Questionnaire answers


class ClientRiskAssessmentResponse(BaseModel):
    """Risk assessment result."""
    risk_tolerance_score: float
    risk_capacity_score: float
    suitability_profile: str
    max_equity_allocation: float
    max_single_security_weight: float
    max_sector_weight: float


class ClientGoalCreate(BaseModel):
    """Create a goal for a client."""
    name: str
    goal_type: str
    target_amount: float
    target_date: str
    current_savings: float = 0
    monthly_contribution: float = 0
    priority: int = 1


class ClientGoalResponse(BaseModel):
    """Goal with progress tracking."""
    id: str
    name: str
    goal_type: str
    target_amount: float
    target_date: str
    current_savings: float
    monthly_contribution: float
    progress_pct: float
    time_remaining_months: int
    required_return_estimate: Optional[float] = None
    is_active: bool

    class Config:
        from_attributes = True


# ═══════════════════════════════════════════════════════════════════════
# PROPOSAL SCHEMAS
# ═══════════════════════════════════════════════════════════════════════

class ProposalCreate(BaseModel):
    """Create a portfolio proposal for a client."""
    client_id: str
    name: str
    proposal_type: str = "BALANCED"
    optimization_objective: str = "max_sharpe"
    constraints: Optional[dict] = None
    notes: Optional[str] = None


class ProposalHoldingResponse(BaseModel):
    """A single holding within a proposal."""
    symbol: str
    exchange: str = "NSE"
    sector: Optional[str] = None
    target_weight: float
    current_weight: Optional[float] = None
    weight_change: Optional[float] = None
    investment_score: Optional[float] = None
    expected_return: Optional[float] = None
    risk_contribution: Optional[float] = None
    rationale: Optional[str] = None
    action: Optional[str] = None


class ProposalResponse(BaseModel):
    """Portfolio proposal summary."""
    id: str
    client_id: str
    client_name: Optional[str] = None
    name: str
    proposal_type: str
    status: str
    version: int
    expected_return: Optional[float] = None
    expected_volatility: Optional[float] = None
    sharpe_ratio: Optional[float] = None
    max_drawdown: Optional[float] = None
    total_value: Optional[float] = None
    holdings: list[ProposalHoldingResponse] = []
    sector_allocation: Optional[dict] = None
    notes: Optional[str] = None
    created_at: Optional[str] = None
    data_status: str = "DEMO"


class ProposalCompareResponse(BaseModel):
    """Compare multiple proposals side by side."""
    proposals: list[ProposalResponse] = []
    comparison_metrics: Optional[dict] = None


class WhatIfRequest(BaseModel):
    """What-if scenario analysis request."""
    scenario_type: str  # MARKET_CRASH, RATE_HIKE, ALLOCATION_CHANGE, etc.
    name: str
    parameters: dict  # e.g., {"market_drop_pct": -20} or {"remove_symbol": "TCS"}


class WhatIfResponse(BaseModel):
    """What-if scenario result."""
    scenario_name: str
    scenario_type: str
    portfolio_impact_pct: Optional[float] = None
    portfolio_impact_value: Optional[float] = None
    affected_holdings: list[dict] = []
    revised_metrics: Optional[dict] = None


# ═══════════════════════════════════════════════════════════════════════
# INVESTMENT INTELLIGENCE SCHEMAS
# ═══════════════════════════════════════════════════════════════════════

class InvestmentScoreResponse(BaseModel):
    """Transparent investment research score."""
    symbol: str
    company_name: Optional[str] = None
    sector: Optional[str] = None
    fundamental_quality: Optional[float] = None
    growth_score: Optional[float] = None
    valuation_score: Optional[float] = None
    momentum_score: Optional[float] = None
    technical_score: Optional[float] = None
    ml_signal_score: Optional[float] = None
    risk_score: Optional[float] = None
    liquidity_score: Optional[float] = None
    overall_score: Optional[float] = None
    scoring_version: str = "v1"
    data_status: str = "DEMO"


class InvestmentCandidateResponse(BaseModel):
    """Investment candidate with score and context."""
    symbol: str
    company_name: str
    sector: str
    market_cap: Optional[float] = None
    last_price: Optional[float] = None
    change_pct: Optional[float] = None
    overall_score: Optional[float] = None
    signal: Optional[str] = None
    key_strengths: list[str] = []
    key_risks: list[str] = []
    data_status: str = "DEMO"


# ═══════════════════════════════════════════════════════════════════════
# EMPLOYEE DASHBOARD SCHEMAS
# ═══════════════════════════════════════════════════════════════════════

class DashboardSummary(BaseModel):
    """Employee dashboard aggregated data."""
    total_clients: int = 0
    clients_requiring_review: int = 0
    high_risk_alerts: int = 0
    concentration_alerts: int = 0
    goal_mismatch_alerts: int = 0
    pending_proposals: int = 0
    recent_proposals: list[dict] = []
    market_overview: Optional[dict] = None
    data_status: str = "DEMO"

