import { useEffect, useRef } from 'react';

export function useDialog(onClose: () => void, canClose = true) {
  const ref = useRef<HTMLDivElement>(null);
  const close = useRef(onClose);
  const allowed = useRef(canClose);
  close.current = onClose;
  allowed.current = canClose;

  useEffect(() => {
    const previous = document.activeElement as HTMLElement | null;
    const overflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    ref.current?.focus();
    const handleKey = (event: KeyboardEvent) => {
      if (event.key === 'Escape' && allowed.current) {
        event.preventDefault();
        close.current();
      }
      if (event.key !== 'Tab') return;
      const focusable = [...(ref.current?.querySelectorAll<HTMLElement>('button:not(:disabled), a[href], input:not(:disabled), textarea:not(:disabled), select:not(:disabled), summary, [tabindex="0"]') || [])]
        .filter(element => element.getClientRects().length > 0 && !element.closest('[inert]'));
      const first = focusable[0];
      const last = focusable.at(-1);
      if (!first) { event.preventDefault(); return; }
      if (event.shiftKey && (document.activeElement === first || document.activeElement === ref.current)) {
        event.preventDefault(); last?.focus();
      } else if (!event.shiftKey && (document.activeElement === last || document.activeElement === ref.current)) {
        event.preventDefault(); first.focus();
      }
    };
    document.addEventListener('keydown', handleKey);
    return () => {
      document.body.style.overflow = overflow;
      document.removeEventListener('keydown', handleKey);
      previous?.focus();
    };
  }, []);
  return ref;
}
