/**
 * KnowledgeLibraryModal — Enterprise DSPAMC Document & Policy Catalog
 * 
 * Allows employees to browse, search, and inspect authorized institutional documentation.
 * Includes an administrator document upload and ingestion simulator.
 */

import React, { useState, useEffect } from 'react';
import {
  X,
  Search,
  BookOpen,
  FileText,
  Upload,
  CheckCircle,
  Clock,
  ShieldCheck,
  Building,
  User,
  ChevronRight,
  Filter,
  Sparkles,
  ArrowRight,
  Loader2,
  FileCheck
} from 'lucide-react';
import { researchAPI } from '../services/api';
import type { DocumentItem } from '../services/api';

interface KnowledgeLibraryModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSelectDocument?: (doc: DocumentItem) => void;
  onSelectPrompt?: (promptText: string) => void;
}

const CATEGORIES = ['ALL', 'HR', 'IT', 'COMPLIANCE', 'FINANCE', 'OPERATIONS'];

export default function KnowledgeLibraryModal({
  isOpen,
  onClose,
  onSelectDocument,
  onSelectPrompt,
}: KnowledgeLibraryModalProps) {
  const [activeTab, setActiveTab] = useState<'catalog' | 'upload'>('catalog');
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const [searchQuery, setSearchQuery] = useState<string>('');
  const [documents, setDocuments] = useState<DocumentItem[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [selectedDoc, setSelectedDoc] = useState<DocumentItem | null>(null);

  // Upload state
  const [uploadTitle, setUploadTitle] = useState('');
  const [uploadCategory, setUploadCategory] = useState('HR');
  const [uploadDept, setUploadDept] = useState('');
  const [uploadAuthor, setUploadAuthor] = useState('');
  const [uploadContent, setUploadContent] = useState('');
  const [uploading, setUploading] = useState(false);
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null);

  useEffect(() => {
    if (isOpen) {
      loadDocuments();
    }
  }, [isOpen, selectedCategory]);

  async function loadDocuments() {
    setLoading(true);
    try {
      const categoryParam = selectedCategory === 'ALL' ? undefined : selectedCategory;
      const res = await researchAPI.getDocuments(categoryParam, searchQuery || undefined);
      if (res.data.success) {
        setDocuments(res.data.data);
      }
    } catch (err) {
      console.error('Failed to load documents:', err);
    } finally {
      setLoading(false);
    }
  }

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    loadDocuments();
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!uploadTitle.trim() || !uploadDept.trim()) return;

    setUploading(true);
    setUploadSuccess(null);

    try {
      const res = await researchAPI.uploadDocument({
        title: uploadTitle.trim(),
        category: uploadCategory,
        department: uploadDept.trim(),
        content: uploadContent.trim(),
        author: uploadAuthor.trim() || 'Internal Compliance Officer',
      });

      if (res.data.success) {
        setUploadSuccess(res.data.data.message);
        setUploadTitle('');
        setUploadDept('');
        setUploadAuthor('');
        setUploadContent('');
        // Reload documents
        loadDocuments();
      }
    } catch (err: any) {
      console.error('Upload failed:', err);
    } finally {
      setUploading(false);
    }
  }

  if (!isOpen) return null;

  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 9999,
        background: 'rgba(7, 13, 24, 0.75)',
        backdropFilter: 'blur(8px)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
        animation: 'fadeIn 0.2s ease-out',
      }}
      onClick={onClose}
    >
      <div
        style={{
          width: '100%',
          maxWidth: '920px',
          maxHeight: '90vh',
          background: 'var(--color-surface, #ffffff)',
          borderRadius: '1rem',
          boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.25), 0 0 0 1px rgba(15, 23, 42, 0.08)',
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div
          style={{
            padding: '1.25rem 1.5rem',
            borderBottom: '1px solid var(--color-border-light, #e2e8f0)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            background: 'linear-gradient(to right, #f8fafc, #ffffff)',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div
              style={{
                width: 38,
                height: 38,
                borderRadius: '0.5rem',
                background: 'linear-gradient(135deg, #0ea5e9, #0284c7)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: 'white',
              }}
            >
              <BookOpen style={{ width: 20, height: 20 }} />
            </div>
            <div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <h2 style={{ fontSize: '1.125rem', fontWeight: 700, margin: 0, color: 'var(--color-navy-900, #0f172a)' }}>
                  DSPAMC Knowledge Library
                </h2>
                <span
                  style={{
                    fontSize: '0.6875rem',
                    fontWeight: 700,
                    padding: '0.125rem 0.5rem',
                    borderRadius: '1rem',
                    background: '#e0f2fe',
                    color: '#0369a1',
                  }}
                >
                  AUTHORIZED REPOSITORY
                </span>
              </div>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.75rem', color: '#64748b' }}>
                Verified policies, standard operating procedures, and compliance guidelines
              </p>
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <div
              style={{
                display: 'flex',
                background: '#f1f5f9',
                padding: '0.25rem',
                borderRadius: '0.5rem',
                fontSize: '0.75rem',
                fontWeight: 600,
              }}
            >
              <button
                type="button"
                onClick={() => setActiveTab('catalog')}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  background: activeTab === 'catalog' ? 'white' : 'transparent',
                  color: activeTab === 'catalog' ? '#0f172a' : '#64748b',
                  boxShadow: activeTab === 'catalog' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                }}
              >
                Browse Catalog
              </button>
              <button
                type="button"
                onClick={() => setActiveTab('upload')}
                style={{
                  padding: '0.375rem 0.75rem',
                  borderRadius: '0.375rem',
                  border: 'none',
                  background: activeTab === 'upload' ? 'white' : 'transparent',
                  color: activeTab === 'upload' ? '#0f172a' : '#64748b',
                  boxShadow: activeTab === 'upload' ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                }}
              >
                <Upload style={{ width: 12, height: 12 }} /> Ingest Document
              </button>
            </div>

            <button
              onClick={onClose}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                border: '1px solid #e2e8f0',
                background: 'transparent',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                color: '#64748b',
              }}
              aria-label="Close dialog"
            >
              <X style={{ width: 16, height: 16 }} />
            </button>
          </div>
        </div>

        {/* Content Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '1.25rem 1.5rem' }}>
          {activeTab === 'catalog' ? (
            <>
              {/* Search & Categories Bar */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginBottom: '1.25rem' }}>
                <form onSubmit={handleSearch} style={{ display: 'flex', gap: '0.5rem' }}>
                  <div style={{ position: 'relative', flex: 1 }}>
                    <Search
                      style={{
                        position: 'absolute',
                        left: '0.85rem',
                        top: '50%',
                        transform: 'translateY(-50%)',
                        width: 16,
                        height: 16,
                        color: '#94a3b8',
                      }}
                    />
                    <input
                      type="text"
                      placeholder="Search policy titles, sections, keywords (e.g. Leave, Concur, IAM, SEBI)..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.625rem 1rem 0.625rem 2.4rem',
                        borderRadius: '0.5rem',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8125rem',
                        outline: 'none',
                      }}
                    />
                  </div>
                  <button
                    type="submit"
                    className="btn btn-primary"
                    style={{ fontSize: '0.8125rem', padding: '0.625rem 1.25rem' }}
                  >
                    Search
                  </button>
                </form>

                {/* Category Pills */}
                <div style={{ display: 'flex', gap: '0.375rem', flexWrap: 'wrap' }}>
                  {CATEGORIES.map((cat) => (
                    <button
                      key={cat}
                      type="button"
                      onClick={() => setSelectedCategory(cat)}
                      style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '1rem',
                        border: selectedCategory === cat ? '1px solid #0284c7' : '1px solid #e2e8f0',
                        background: selectedCategory === cat ? '#eff6ff' : '#ffffff',
                        color: selectedCategory === cat ? '#0284c7' : '#64748b',
                        fontSize: '0.6875rem',
                        fontWeight: 600,
                        cursor: 'pointer',
                        transition: 'all 0.15s ease',
                      }}
                    >
                      {cat}
                    </button>
                  ))}
                </div>
              </div>

              {/* Document List */}
              {loading ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <Loader2 style={{ width: 28, height: 28, animation: 'spin 1s linear infinite', margin: '0 auto 0.75rem' }} />
                  <div>Loading verified knowledge documents...</div>
                </div>
              ) : documents.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '3rem', color: '#64748b' }}>
                  <BookOpen style={{ width: 36, height: 36, opacity: 0.3, margin: '0 auto 0.75rem' }} />
                  <p>No documents found matching "{searchQuery}" in category {selectedCategory}.</p>
                </div>
              ) : (
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1rem' }}>
                  {documents.map((doc) => (
                    <div
                      key={doc.id}
                      style={{
                        padding: '1rem',
                        borderRadius: '0.75rem',
                        border: '1px solid #e2e8f0',
                        background: '#ffffff',
                        display: 'flex',
                        flexDirection: 'column',
                        justifyContent: 'space-between',
                        transition: 'box-shadow 0.2s, transform 0.2s',
                        cursor: 'pointer',
                      }}
                      onClick={() => {
                        setSelectedDoc(doc);
                        if (onSelectDocument) onSelectDocument(doc);
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.boxShadow = '0 10px 15px -3px rgba(0,0,0,0.08)';
                        e.currentTarget.style.borderColor = '#93c5fd';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.boxShadow = 'none';
                        e.currentTarget.style.borderColor = '#e2e8f0';
                      }}
                    >
                      <div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 700,
                              padding: '0.125rem 0.375rem',
                              borderRadius: '0.25rem',
                              background: '#eff6ff',
                              color: '#1d4ed8',
                            }}
                          >
                            {doc.id}
                          </span>
                          <span
                            style={{
                              fontSize: '0.625rem',
                              fontWeight: 600,
                              color: '#059669',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.25rem',
                            }}
                          >
                            <ShieldCheck style={{ width: 12, height: 12 }} /> {doc.status}
                          </span>
                        </div>

                        <h3 style={{ fontSize: '0.875rem', fontWeight: 700, margin: '0 0 0.375rem 0', color: '#0f172a', lineHeight: 1.3 }}>
                          {doc.title}
                        </h3>

                        <p style={{ fontSize: '0.75rem', color: '#64748b', margin: '0 0 0.75rem 0', lineHeight: 1.4, display: '-webkit-box', WebkitLineClamp: 3, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                          {doc.summary}
                        </p>
                      </div>

                      <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '0.625rem', marginTop: '0.5rem' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6875rem', color: '#94a3b8' }}>
                          <span>{doc.department}</span>
                          <span>{doc.version}</span>
                        </div>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.5rem' }}>
                          <span style={{ fontSize: '0.6875rem', color: '#64748b' }}>
                            {doc.chunk_count} verified passages
                          </span>
                          <button
                            type="button"
                            style={{
                              border: 'none',
                              background: 'none',
                              color: '#0284c7',
                              fontSize: '0.6875rem',
                              fontWeight: 600,
                              cursor: 'pointer',
                              display: 'flex',
                              alignItems: 'center',
                              gap: '0.2rem',
                            }}
                            onClick={(e) => {
                              e.stopPropagation();
                              if (onSelectPrompt) {
                                onSelectPrompt(`What does the document ${doc.title} say?`);
                                onClose();
                              }
                            }}
                          >
                            Ask Assistant <ArrowRight style={{ width: 12, height: 12 }} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </>
          ) : (
            /* Upload & Ingestion Tab */
            <div style={{ maxWidth: 640, margin: '0 auto' }}>
              <div
                style={{
                  padding: '1rem',
                  borderRadius: '0.5rem',
                  background: '#f8fafc',
                  border: '1px solid #e2e8f0',
                  marginBottom: '1.25rem',
                  fontSize: '0.8125rem',
                  color: '#475569',
                }}
              >
                <div style={{ fontWeight: 600, color: '#0f172a', marginBottom: '0.25rem', display: 'flex', alignItems: 'center', gap: '0.375rem' }}>
                  <Sparkles style={{ width: 16, height: 16, color: '#0284c7' }} />
                  Automated DSP RAG Ingestion Pipeline
                </div>
                Uploading a document parses the policy, creates semantic chunks, generates vector embeddings, and registers the source into Qdrant vector database.
              </div>

              {uploadSuccess && (
                <div
                  style={{
                    padding: '0.875rem',
                    borderRadius: '0.5rem',
                    background: '#ecfdf5',
                    border: '1px solid #a7f3d0',
                    color: '#065f46',
                    fontSize: '0.8125rem',
                    marginBottom: '1.25rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <CheckCircle style={{ width: 18, height: 18, color: '#10b981' }} />
                  {uploadSuccess}
                </div>
              )}

              <form onSubmit={handleUpload} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Document Title *
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DSPAMC Digital Signature Policy 2026"
                    value={uploadTitle}
                    onChange={(e) => setUploadTitle(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8125rem',
                    }}
                  />
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                      Category *
                    </label>
                    <select
                      value={uploadCategory}
                      onChange={(e) => setUploadCategory(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8125rem',
                        background: 'white',
                      }}
                    >
                      <option value="HR">Human Resources (HR)</option>
                      <option value="IT">Enterprise IT & Cyber</option>
                      <option value="COMPLIANCE">Legal & Compliance</option>
                      <option value="FINANCE">Finance & Accounts</option>
                      <option value="OPERATIONS">Operations & Settlements</option>
                    </select>
                  </div>

                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                      Department *
                    </label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Information Security"
                      value={uploadDept}
                      onChange={(e) => setUploadDept(e.target.value)}
                      style={{
                        width: '100%',
                        padding: '0.625rem 0.875rem',
                        borderRadius: '0.375rem',
                        border: '1px solid #cbd5e1',
                        fontSize: '0.8125rem',
                      }}
                    />
                  </div>
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Author / Approver Name
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Amitava Mukherjee, Compliance Officer"
                    value={uploadAuthor}
                    onChange={(e) => setUploadAuthor(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8125rem',
                    }}
                  />
                </div>

                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 600, color: '#334155', marginBottom: '0.25rem' }}>
                    Policy Content / Text *
                  </label>
                  <textarea
                    rows={6}
                    required
                    placeholder="Paste policy sections, procedures, and rules for chunking..."
                    value={uploadContent}
                    onChange={(e) => setUploadContent(e.target.value)}
                    style={{
                      width: '100%',
                      padding: '0.625rem 0.875rem',
                      borderRadius: '0.375rem',
                      border: '1px solid #cbd5e1',
                      fontSize: '0.8125rem',
                      fontFamily: 'inherit',
                    }}
                  />
                </div>

                <button
                  type="submit"
                  disabled={uploading}
                  className="btn btn-primary"
                  style={{
                    padding: '0.75rem 1.5rem',
                    fontSize: '0.875rem',
                    fontWeight: 700,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {uploading ? (
                    <>
                      <Loader2 style={{ width: 16, height: 16, animation: 'spin 1s linear infinite' }} />
                      Chunking & Vectorizing into Qdrant...
                    </>
                  ) : (
                    <>
                      <Upload style={{ width: 16, height: 16 }} />
                      Ingest & Index Document
                    </>
                  )}
                </button>
              </form>
            </div>
          )}
        </div>

        {/* Footer */}
        <div
          style={{
            padding: '0.875rem 1.5rem',
            borderTop: '1px solid #e2e8f0',
            background: '#f8fafc',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            fontSize: '0.6875rem',
            color: '#64748b',
          }}
        >
          <div>
            Connected to <strong>Qdrant Vector Store</strong> • Collection: <code>dsp_documents</code>
          </div>
          <div>All documents classified per DSPAMC Information Security Framework</div>
        </div>
      </div>
    </div>
  );
}
