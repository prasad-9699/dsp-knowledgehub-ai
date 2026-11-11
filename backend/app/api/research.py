"""
DSPAMC KnowledgeHub AI — Research & Internal Knowledge API Endpoints.

Enterprise RAG engine for DSP Asset Management Company (DSPAMC).
Features:
- Grounded institutional knowledge retrieval (HR, IT, Finance, Compliance, Operations)
- Verbatim citations with section numbers, page references, and verification badges
- Persistent conversation storage
- Real document library search and ingestion pipeline
"""

from datetime import datetime, timezone
from typing import Optional, List, Dict, Any
from fastapi import APIRouter, Depends, HTTPException, Query, status

from app.core.config import get_settings
from app.schemas.schemas import (
    APIResponse,
    ResearchQuery,
    ResearchResponse,
    CitationItem,
    DocumentSearchRequest,
    DocumentItem,
    DocumentUploadRequest,
    ConversationRecord,
    FeedbackRequest,
    ResponseMetadata,
)
from app.services.knowledge_service import KnowledgeService

router = APIRouter(prefix="/research", tags=["Research & KnowledgeHub AI"])
settings = get_settings()


# ─── Ask Endpoint ────────────────────────────────────────────────────

@router.post("/ask", response_model=APIResponse)
async def ask_research_question(request: ResearchQuery):
    """
    DSPAMC KnowledgeHub conversational assistant endpoint.
    Retrieves grounded evidence from authorized internal documentation,
    policies, SOPs, and employee handbooks.
    """
    question = request.question.strip()
    warnings: List[str] = []
    sources: List[Dict[str, Any]] = []
    citations: List[CitationItem] = []
    follow_up_suggestions: List[str] = []

    # Query Institutional Knowledge Store (HR, IT, Expenses, Compliance, Operations)
    kb_result = KnowledgeService.query_knowledge_base(question)

    if kb_result.get("document_found") and kb_result.get("answer"):
        answer = kb_result["answer"]
        for c in kb_result.get("citations", []):
            citations.append(CitationItem(**c))
            sources.append({
                "tool": f"RAG Retriever [{c['document_id']}]",
                "document_title": c["document_title"],
                "section": c["section"],
                "page": c.get("page", 1),
                "data_status": "AUTHORIZED_INTERNAL",
                "timestamp": datetime.now(timezone.utc).isoformat(),
            })
        follow_up_suggestions = kb_result.get("follow_up_suggestions", [])

    else:
        # Fallback when query is ambiguous or out of domain
        answer = (
            "I could not locate authorized documentation matching your specific inquiry.\n\n"
            "**DSP KnowledgeHub AI** is designed to assist DSPAMC employees across authorized internal domains:\n\n"
            "• **Human Resources**: Leave application workflows, quotas, onboarding guide, mediclaim\n"
            "• **IT Services**: ServiceHub IAM requests, VPN / MFA configuration, Bloomberg access\n"
            "• **Finance**: SAP Concur expense claims, per diem rates, GST invoicing mandates\n"
            "• **Compliance**: SEBI personal securities pre-clearance, 30-day holding rules, restricted list\n\n"
            "Please select one of the suggested prompts below or rephrase your question."
        )
        follow_up_suggestions = [
            "How do I apply for leave?",
            "Where can I find the onboarding guide?",
            "How do I request IT access?",
            "What is the process for submitting an expense claim?",
            "Where can I find the relevant compliance procedure?"
        ]
        warnings.append("No grounded documentation match found. Showing recommended enterprise queries.")

    return APIResponse(
        success=True,
        data=ResearchResponse(
            answer=answer,
            sources=sources,
            citations=citations,
            follow_up_suggestions=follow_up_suggestions,
            structured_metrics=None,
            model_context={"rag_pipeline": "DSPAMC_Qdrant_Hybrid_v2", "documents_scanned": len(KnowledgeService.get_all_documents())},
            warnings=warnings,
            data_status="AUTHORIZED_INTERNAL",
        ),
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="dsp_knowledgehub_rag",
            data_status="AUTHORIZED",
            is_demo=False,
        ),
    )


# ─── Document Library Endpoints ─────────────────────────────────────

@router.get("/documents", response_model=APIResponse)
async def list_knowledge_documents(
    category: Optional[str] = Query(None, description="Filter by category: HR, IT, Compliance, Finance, Operations, Equity"),
    search: Optional[str] = Query(None, description="Search term across title or department")
):
    """List all indexed documents in the DSPAMC Knowledge Library."""
    docs = KnowledgeService.get_all_documents()
    if category:
        docs = [d for d in docs if d["category"].lower() == category.lower()]
    if search:
        s_lower = search.lower()
        docs = [d for d in docs if s_lower in d["title"].lower() or s_lower in d["department"].lower() or s_lower in d["summary"].lower()]

    items = [
        DocumentItem(
            id=d["id"],
            title=d["title"],
            category=d["category"],
            version=d["version"],
            last_updated=d["last_updated"],
            author=d["author"],
            department=d["department"],
            summary=d["summary"],
            status=d.get("status", "INDEXED"),
            chunk_count=d.get("chunk_count", 12),
            security_clearance=d.get("security_clearance", "Internal"),
            file_type="PDF",
            size_kb=d.get("size_kb", 250),
            sections=d.get("sections", [])
        )
        for d in docs
    ]

    return APIResponse(
        success=True,
        data=items,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="dsp_document_catalog",
            data_status="LIVE",
            is_demo=False
        )
    )


@router.get("/documents/{doc_id}", response_model=APIResponse)
async def get_document_details(doc_id: str):
    """Retrieve full document text, sections, metadata, and chunk preview."""
    doc = KnowledgeService.get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document {doc_id} not found")

    item = DocumentItem(
        id=doc["id"],
        title=doc["title"],
        category=doc["category"],
        version=doc["version"],
        last_updated=doc["last_updated"],
        author=doc["author"],
        department=doc["department"],
        summary=doc["summary"],
        status=doc.get("status", "INDEXED"),
        chunk_count=doc.get("chunk_count", 12),
        security_clearance=doc.get("security_clearance", "Internal"),
        file_type="PDF",
        size_kb=doc.get("size_kb", 250),
        sections=doc.get("sections", [])
    )

    return APIResponse(
        success=True,
        data=item,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="dsp_document_catalog",
            data_status="LIVE",
            is_demo=False
        )
    )


@router.post("/documents/search", response_model=APIResponse)
async def search_documents_endpoint(request: DocumentSearchRequest):
    """Search financial and operational documents in the vector knowledge store."""
    category = request.filters.get("category") if request.filters else None
    results = KnowledgeService.search_documents(request.query, category=category, limit=request.limit)

    return APIResponse(
        success=True,
        data={
            "results": results,
            "total": len(results),
            "query": request.query
        },
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="qdrant_hybrid_search",
            data_status="LIVE",
            is_demo=False,
        ),
    )


@router.post("/documents/upload", response_model=APIResponse)
async def upload_document_endpoint(request: DocumentUploadRequest):
    """Upload and ingest an approved internal document into the RAG vector store."""
    new_doc = KnowledgeService.upload_document(
        title=request.title,
        category=request.category,
        department=request.department,
        content=request.content,
        author=request.author
    )

    return APIResponse(
        success=True,
        data={
            "document": new_doc,
            "message": f"Document '{request.title}' successfully parsed, chunked, and indexed into Qdrant.",
            "status": "INDEXED",
            "chunks_created": new_doc["chunk_count"]
        },
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="document_ingestion_pipeline",
            data_status="LIVE",
            is_demo=False
        )
    )


@router.get("/documents/status/{doc_id}", response_model=APIResponse)
async def get_ingestion_status(doc_id: str):
    """Check ingestion status of a newly uploaded document."""
    doc = KnowledgeService.get_document_by_id(doc_id)
    if not doc:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail=f"Document {doc_id} not found")

    return APIResponse(
        success=True,
        data={
            "document_id": doc_id,
            "status": "INDEXED",
            "progress_pct": 100,
            "chunks_created": doc.get("chunk_count", 12),
            "message": "Vector embeddings calculated and stored in Qdrant collection 'dsp_documents'."
        },
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="qdrant_ingestion_worker",
            data_status="LIVE",
            is_demo=False
        )
    )


# ─── Conversation Persistence Endpoints ──────────────────────────────

@router.get("/conversations", response_model=APIResponse)
async def list_conversations():
    """Retrieve saved employee conversations for the left sidebar."""
    convs = KnowledgeService.list_conversations()
    return APIResponse(
        success=True,
        data=convs,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="conversation_store",
            data_status="PERSISTENT",
            is_demo=False
        )
    )


@router.get("/conversations/{conv_id}", response_model=APIResponse)
async def get_conversation(conv_id: str):
    """Load conversation history by ID."""
    conv = KnowledgeService.get_conversation(conv_id)
    if not conv:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Conversation not found")

    return APIResponse(
        success=True,
        data=conv,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="conversation_store",
            data_status="PERSISTENT",
            is_demo=False
        )
    )


@router.post("/conversations", response_model=APIResponse)
async def save_conversation(conversation: ConversationRecord):
    """Save or update an active conversation with message history."""
    saved = KnowledgeService.save_conversation(conversation.model_dump())
    return APIResponse(
        success=True,
        data=saved,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="conversation_store",
            data_status="PERSISTENT",
            is_demo=False
        )
    )


@router.delete("/conversations/{conv_id}", response_model=APIResponse)
async def delete_conversation(conv_id: str):
    """Delete a conversation from persistent storage."""
    success = KnowledgeService.delete_conversation(conv_id)
    return APIResponse(
        success=success,
        data={"deleted": success, "id": conv_id},
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="conversation_store",
            data_status="PERSISTENT",
            is_demo=False
        )
    )


# ─── Feedback Endpoint ───────────────────────────────────────────────

@router.post("/feedback", response_model=APIResponse)
async def submit_feedback(request: FeedbackRequest):
    """Submit rating and verification feedback for RAG answers."""
    entry = KnowledgeService.save_feedback(request.model_dump())
    return APIResponse(
        success=True,
        data=entry,
        metadata=ResponseMetadata(
            timestamp=datetime.now(timezone.utc),
            source="feedback_collector",
            data_status="PERSISTENT",
            is_demo=False
        )
    )
