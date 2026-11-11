import React from 'react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface MarkdownRendererProps {
  content: string;
  className?: string;
}

/**
 * Premium Markdown Renderer for DSP KnowledgeHub AI
 * 
 * Safely parses and renders Markdown formatted text:
 * - Proper bold and italic emphasis (fixing exposed raw ** syntax)
 * - Clean numbered lists and bullet points with fintech styling
 * - Headings with proportional typographic hierarchy
 * - Tables with responsive horizontal overflow and bordered cells
 * - Code snippets and blockquotes with distinct styling
 */
export default function MarkdownRenderer({ content, className = '' }: MarkdownRendererProps) {
  return (
    <div className={`prose-knowledge-hub ${className}`}>
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        components={{
          h1: ({ children }) => (
            <h1 className="markdown-h1">{children}</h1>
          ),
          h2: ({ children }) => (
            <h2 className="markdown-h2">{children}</h2>
          ),
          h3: ({ children }) => (
            <h3 className="markdown-h3">{children}</h3>
          ),
          p: ({ children }) => (
            <p className="markdown-p">{children}</p>
          ),
          ul: ({ children }) => (
            <ul className="markdown-ul">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="markdown-ol">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="markdown-li">{children}</li>
          ),
          strong: ({ children }) => (
            <strong className="markdown-strong">{children}</strong>
          ),
          em: ({ children }) => (
            <em className="markdown-em">{children}</em>
          ),
          blockquote: ({ children }) => (
            <blockquote className="markdown-blockquote">{children}</blockquote>
          ),
          code: ({ children, className }) => {
            const isBlock = className?.includes('language-');
            if (isBlock) {
              return (
                <div className="markdown-code-block-wrapper">
                  <pre className="markdown-code-block">
                    <code>{children}</code>
                  </pre>
                </div>
              );
            }
            return <code className="markdown-inline-code">{children}</code>;
          },
          table: ({ children }) => (
            <div className="markdown-table-wrapper">
              <table className="markdown-table">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="markdown-th">{children}</th>
          ),
          td: ({ children }) => (
            <td className="markdown-td">{children}</td>
          ),
          a: ({ href, children }) => (
            <a
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="markdown-link"
            >
              {children}
            </a>
          ),
          hr: () => <hr className="markdown-hr" />
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
}
