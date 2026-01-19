'use client';

import { useState } from 'react';

type Props = {
  title: string;
  defaultOpen?: boolean;
  children: React.ReactNode;
};

export function CollapsibleSection({ title, defaultOpen = true, children }: Props) {
  const [isOpen, setIsOpen] = useState(defaultOpen);

  return (
    <>
      <div
        className={`lj-section-header ${!isOpen ? 'collapsed' : ''}`}
        onClick={() => setIsOpen(!isOpen)}
        role="button"
        tabIndex={0}
        onKeyDown={(e) => {
          if (e.key === 'Enter' || e.key === ' ') {
            e.preventDefault();
            setIsOpen(!isOpen);
          }
        }}
      >
        {title}
      </div>
      <div className={`lj-section-content ${!isOpen ? 'collapsed' : ''}`}>
        {children}
      </div>
    </>
  );
}
