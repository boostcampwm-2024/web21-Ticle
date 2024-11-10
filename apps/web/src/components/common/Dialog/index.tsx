import { ReactNode } from '@tanstack/react-router';
import { useRef } from 'react';

import useOutsideClick from '@/hooks/useOutsideClick';
import cn from '@/utils/cn';

import Portal from '../Portal';

interface DialogRootProps {
  isOpen: boolean;
  onClose: () => void;
  children: ReactNode;
  className?: string;
}

function DialogRoot({ isOpen, onClose, children, className }: DialogRootProps) {
  const dialogRef = useRef<HTMLDivElement>(null);
  useOutsideClick(dialogRef, onClose);

  if (!isOpen) return null;

  return (
    <Portal portalId="dialog">
      <div className="fixed top-0 flex h-full w-full items-center justify-center bg-overlay">
        <div
          ref={dialogRef}
          role="dialog"
          aria-modal="true"
          className={cn('relative rounded-lg bg-white px-6 py-8 shadow-normal', className)}
        >
          {children}
        </div>
      </div>
    </Portal>
  );
}

export const Dialog = {
  Root: DialogRoot,
};
