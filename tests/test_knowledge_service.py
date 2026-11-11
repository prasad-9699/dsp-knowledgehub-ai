"""
Test suite for DSPAMC KnowledgeHub RAG and internal documents.
"""

import os
import sys
import pytest

sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "backend")))

from app.services.knowledge_service import KnowledgeService


class TestKnowledgeHubRAG:
    """Validate DSPAMC document retrieval, citations, and workflows."""

    def test_leave_policy_query(self):
        res = KnowledgeService.query_knowledge_base("How do I apply for leave?")
        assert res["document_found"] is True
        assert "PeoplePulse" in res["answer"]
        assert len(res["citations"]) > 0
        assert res["citations"][0]["document_id"] == "DSP-HR-001"
        assert res["citations"][0]["verified"] is True
        assert len(res["follow_up_suggestions"]) > 0

    def test_onboarding_guide_query(self):
        res = KnowledgeService.query_knowledge_base("Where can I find the onboarding guide?")
        assert res["document_found"] is True
        assert "One BKC" in res["answer"]
        assert "NISM" in res["answer"]
        assert res["citations"][0]["document_id"] == "DSP-HR-002"

    def test_it_access_query(self):
        res = KnowledgeService.query_knowledge_base("How do I request IT access?")
        assert res["document_found"] is True
        assert "ServiceHub" in res["answer"]
        assert res["citations"][0]["document_id"] == "DSP-IT-001"

    def test_expense_claim_query(self):
        res = KnowledgeService.query_knowledge_base("What is the process for submitting an expense claim?")
        assert res["document_found"] is True
        assert "SAP Concur" in res["answer"]
        assert "30 calendar days" in res["answer"]
        assert res["citations"][0]["document_id"] == "DSP-FIN-001"

    def test_compliance_query(self):
        res = KnowledgeService.query_knowledge_base("Where can I find the relevant compliance procedure?")
        assert res["document_found"] is True
        assert "Pre-Clearance" in res["answer"]
        assert "30" in res["answer"]  # 30-day holding period
        assert res["citations"][0]["document_id"] == "DSP-COMP-001"

    def test_document_listing_and_detail(self):
        docs = KnowledgeService.get_all_documents()
        assert len(docs) >= 6
        hr_doc = KnowledgeService.get_document_by_id("DSP-HR-001")
        assert hr_doc is not None
        assert hr_doc["category"] == "HR"

    def test_search_documents(self):
        results = KnowledgeService.search_documents("expense per diem concur", category="Finance")
        assert len(results) > 0
        assert results[0]["document_id"] == "DSP-FIN-001"

    def test_conversation_persistence(self):
        conv_id = "test_conv_lifecycle"
        test_payload = {
            "id": conv_id,
            "title": "Test HR Session",
            "pinned": False,
            "messages": [
                {
                    "id": "m1",
                    "role": "user",
                    "content": "Can I encash leaves?",
                    "sources": [],
                    "citations": [],
                    "follow_up_suggestions": [],
                    "timestamp": "2026-10-13T10:00:00Z"
                }
            ]
        }
        saved = KnowledgeService.save_conversation(test_payload)
        assert saved["id"] == conv_id

        loaded = KnowledgeService.get_conversation(conv_id)
        assert loaded is not None
        assert loaded["title"] == "Test HR Session"

        # Cleanup
        KnowledgeService.delete_conversation(conv_id)
        assert KnowledgeService.get_conversation(conv_id) is None
