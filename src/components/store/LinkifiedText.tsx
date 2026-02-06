import React from 'react';

interface LinkifiedTextProps {
  text: string;
  className?: string;
}

/**
 * Renders text with clickable links.
 * Detects URLs in text and converts them to clickable anchor tags.
 */
export function LinkifiedText({ text, className = '' }: LinkifiedTextProps) {
  // Regex to match URLs (http, https, or www)
  const urlRegex = /(https?:\/\/[^\s<]+|www\.[^\s<]+)/gi;

  const parts = text.split(urlRegex);
  
  return (
    <span className={className}>
      {parts.map((part, index) => {
        if (urlRegex.test(part)) {
          // Reset regex lastIndex after test
          urlRegex.lastIndex = 0;
          
          const href = part.startsWith('www.') ? `https://${part}` : part;
          return (
            <a
              key={index}
              href={href}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:underline break-all"
              onClick={(e) => e.stopPropagation()}
            >
              {part}
            </a>
          );
        }
        return <React.Fragment key={index}>{part}</React.Fragment>;
      })}
    </span>
  );
}
