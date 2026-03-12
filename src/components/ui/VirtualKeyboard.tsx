'use client';

import { useEffect, useRef, useState, useCallback, createContext, useContext } from 'react';
import Keyboard from 'react-simple-keyboard';
// @ts-ignore
import 'react-simple-keyboard/build/css/index.css';
import { motion, AnimatePresence } from 'framer-motion';

// ── Context ──────────────────────────────────────────────────────────

interface VKContext {
  /** Call when an input receives focus */
  attachInput: (el: HTMLInputElement | HTMLTextAreaElement) => void;
  /** Call when an input loses focus (optional – keyboard auto-dismisses) */
  detachInput: () => void;
}

const VirtualKeyboardContext = createContext<VKContext>({
  attachInput: () => {},
  detachInput: () => {},
});

export const useVirtualKeyboard = () => useContext(VirtualKeyboardContext);

// ── Provider (wrap your app) ─────────────────────────────────────────

export function VirtualKeyboardProvider({ children }: { children: React.ReactNode }) {
  const [activeInput, setActiveInput] = useState<HTMLInputElement | HTMLTextAreaElement | null>(null);
  const [isLargeScreen, setIsLargeScreen] = useState(false);

  // Detect wall breakpoint
  useEffect(() => {
    const mq = window.matchMedia('(min-width: 2560px)');
    const handle = (e: MediaQueryListEvent | MediaQueryList) => setIsLargeScreen(e.matches);
    handle(mq);
    mq.addEventListener('change', handle as (e: MediaQueryListEvent) => void);
    return () => mq.removeEventListener('change', handle as (e: MediaQueryListEvent) => void);
  }, []);

  const attachInput = useCallback((el: HTMLInputElement | HTMLTextAreaElement) => {
    setActiveInput(el);
  }, []);

  const detachInput = useCallback(() => {
    setActiveInput(null);
  }, []);

  // Auto-attach on any text input/textarea focus
  useEffect(() => {
    if (!isLargeScreen) return;

    const TEXT_TYPES = new Set(['text', 'search', 'email', 'url', 'tel', 'password', '']);

    const handleFocusIn = (e: FocusEvent) => {
      const el = e.target as HTMLElement;
      if (
        (el instanceof HTMLInputElement && TEXT_TYPES.has(el.type)) ||
        el instanceof HTMLTextAreaElement
      ) {
        setActiveInput(el as HTMLInputElement | HTMLTextAreaElement);
      }
    };

    const handleFocusOut = (e: FocusEvent) => {
      // Don't dismiss if clicking inside the keyboard itself
      const related = e.relatedTarget as HTMLElement | null;
      if (related?.closest('.vk-container')) return;
      // Small delay to allow keyboard button clicks to register
      setTimeout(() => {
        if (!document.activeElement || document.activeElement === document.body) {
          setActiveInput(null);
        }
      }, 100);
    };

    document.addEventListener('focusin', handleFocusIn);
    document.addEventListener('focusout', handleFocusOut);
    return () => {
      document.removeEventListener('focusin', handleFocusIn);
      document.removeEventListener('focusout', handleFocusOut);
    };
  }, [isLargeScreen]);

  const showKeyboard = isLargeScreen && activeInput !== null;

  return (
    <VirtualKeyboardContext.Provider value={{ attachInput, detachInput }}>
      {children}
      {isLargeScreen && (
        <KeyboardPanel
          visible={showKeyboard}
          activeInput={activeInput}
          onClose={detachInput}
        />
      )}
    </VirtualKeyboardContext.Provider>
  );
}

// ── Keyboard Panel ───────────────────────────────────────────────────

function KeyboardPanel({
  visible,
  activeInput,
  onClose,
}: {
  visible: boolean;
  activeInput: HTMLInputElement | HTMLTextAreaElement | null;
  onClose: () => void;
}) {
  const keyboardRef = useRef<any>(null);
  const [layoutName, setLayoutName] = useState('default');

  // Sync keyboard display with input value
  useEffect(() => {
    if (activeInput && keyboardRef.current) {
      keyboardRef.current.setInput(activeInput.value);
    }
  }, [activeInput]);

  const onKeyPress = useCallback(
    (button: string) => {
      if (!activeInput) return;

      if (button === '{shift}' || button === '{lock}') {
        setLayoutName((prev) => (prev === 'default' ? 'shift' : 'default'));
        return;
      }

      if (button === '{enter}') {
        // Submit the closest form or blur
        const form = activeInput.closest('form');
        if (form) {
          form.requestSubmit();
        }
        onClose();
        return;
      }

      // For other special buttons, let react-simple-keyboard handle via onChange
    },
    [activeInput, onClose],
  );

  const onChange = useCallback(
    (input: string) => {
      if (!activeInput) return;

      // Use native setter so React picks up the change
      const nativeInputValueSetter =
        activeInput instanceof HTMLTextAreaElement
          ? Object.getOwnPropertyDescriptor(window.HTMLTextAreaElement.prototype, 'value')?.set
          : Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')?.set;

      nativeInputValueSetter?.call(activeInput, input);
      activeInput.dispatchEvent(new Event('input', { bubbles: true }));

      // Reset to lowercase after typing with shift (not caps lock)
      if (layoutName === 'shift') {
        setLayoutName('default');
      }
    },
    [activeInput, layoutName],
  );

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ y: '100%' }}
          animate={{ y: 0 }}
          exit={{ y: '100%' }}
          transition={{ type: 'spring', damping: 30, stiffness: 350 }}
          className="fixed bottom-0 left-0 right-0 z-[9999]"
          onPointerDown={(e) => e.preventDefault()} // prevent blur on input
        >
          {/* Dismiss bar */}
          <div className="flex justify-end px-6 py-2 bg-[#E8E4DE]/95 backdrop-blur-md border-t border-border rounded-t-2xl">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-sm font-body font-semibold text-accent-primary hover:text-accent-primary/80 transition-colors"
            >
              Done
            </button>
          </div>

          {/* Keyboard */}
          <div className="vk-container bg-[#E8E4DE]/95 backdrop-blur-md pb-4 px-2">
            <Keyboard
              keyboardRef={(r: any) => (keyboardRef.current = r)}
              layoutName={layoutName}
              onChange={onChange}
              onKeyPress={onKeyPress}
              mergeDisplay
              display={{
                '{bksp}': '⌫',
                '{enter}': 'return',
                '{shift}': '⇧',
                '{lock}': '⇪',
                '{tab}': '⇥',
                '{space}': ' ',
              }}
              theme="hg-theme-default vk-theme"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
