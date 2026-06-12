'use client';

import { useEffect, type ReactNode } from 'react';

// Lightweight modal: backdrop + card. Closes on Escape and backdrop click.
export function Modal({
  title,
  onClose,
  children,
  footer,
}: {
  title: string;
  onClose: () => void;
  children: ReactNode;
  footer?: ReactNode;
}) {
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  return (
    <div className="modal-back" onMouseDown={onClose}>
      <div className="modal" onMouseDown={(e) => e.stopPropagation()} role="dialog" aria-modal="true">
        <div className="hd">
          <h2>{title}</h2>
          <div className="spacer" />
          <button className="iconbtn" aria-label="Close" onClick={onClose}>
            <svg className="ico" viewBox="0 0 24 24">
              <path d="M18 6 6 18M6 6l12 12" />
            </svg>
          </button>
        </div>
        <div className="bd">{children}</div>
        {footer && <div className="ft">{footer}</div>}
      </div>
    </div>
  );
}
