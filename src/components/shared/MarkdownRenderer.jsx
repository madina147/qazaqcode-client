import React from 'react';
import ReactMarkdown from 'react-markdown';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { vscDarkPlus } from 'react-syntax-highlighter/dist/esm/styles/prism';

/**
 * MarkdownRenderer component for consistently rendering markdown with code highlighting
 * 
 * @param {Object} props - Component props
 * @param {string} props.content - Markdown content to render
 * @param {string} props.className - Additional class names to apply
 * @returns {React.ReactElement} Rendered markdown with syntax highlighting
 */
const MarkdownRenderer = ({ content, className = '' }) => {
  if (!content) return null;
  
  return (
    <div className={`markdown-content ${className}`} style={{color: 'black'}}>
      <ReactMarkdown  
        components={{
          code({node, inline, className, children, ...props}) {
            const match = /language-(\w+)/.exec(className || '');
            return !inline && match ? (
              <div className="syntax-highlighter-container" style={{color: 'black'}}>
                <SyntaxHighlighter
                  style={vscDarkPlus}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              </div>
            ) : (
              <code className={className} {...props}>
                {children}
              </code>
            );
          },
          p({node, children, ...props}) {
            return (
              <p style={{color: 'black'}} {...props}>
                {children}
              </p>
            );
          },
          h1({node, children, ...props}) {
            return (
              <h1 style={{color: 'black'}} {...props}>
                {children}
              </h1>
            );
          },
          h2({node, children, ...props}) {
            return (
              <h2 style={{color: 'black'}} {...props}>
                {children}
              </h2>
            );
          },
          h3({node, children, ...props}) {
            return (
              <h3 style={{color: 'black'}} {...props}>
                {children}
              </h3>
            );
          },
          h4({node, children, ...props}) {
            return (
              <h4 style={{color: 'black'}} {...props}>
                {children}
              </h4>
            );
          },
          h5({node, children, ...props}) {
            return (
              <h5 style={{color: 'black'}} {...props}>
                {children}
              </h5>
            );
          },
          span({node, children, ...props}) {
            return (
              <span style={{color: 'black'}} {...props}>
                {children}
              </span>
            );
          },
          li({node, children, ...props}) {
            return (
              <li style={{color: 'black'}} {...props}>
                {children}
              </li>
            );
          }
        }}
      >
        {content}
      </ReactMarkdown>
    </div>
  );
};

export default MarkdownRenderer; 