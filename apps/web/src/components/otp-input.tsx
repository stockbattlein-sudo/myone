'use client';

import { useRef, useState, useCallback, type KeyboardEvent, type ClipboardEvent } from 'react';

interface OtpInputProps {
  length?: number;
  onComplete: (code: string) => void;
  disabled?: boolean;
}

/**
 * 6-digit OTP input — individual digit boxes with auto-advance,
 * backspace navigation, and paste support.
 */
export function OtpInput({ length = 6, onComplete, disabled = false }: OtpInputProps) {
  const [values, setValues] = useState<string[]>(Array(length).fill(''));
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);

  const focusInput = useCallback((index: number) => {
    if (index >= 0 && index < length) {
      inputRefs.current[index]?.focus();
    }
  }, [length]);

  const handleChange = useCallback(
    (index: number, value: string) => {
      // Only accept digits
      const digit = value.replace(/\D/g, '').slice(-1);

      const newValues = [...values];
      newValues[index] = digit;
      setValues(newValues);

      if (digit && index < length - 1) {
        focusInput(index + 1);
      }

      // Check if all digits are filled
      const code = newValues.join('');
      if (code.length === length && /^\d+$/.test(code)) {
        onComplete(code);
      }
    },
    [values, length, onComplete, focusInput],
  );

  const handleKeyDown = useCallback(
    (index: number, e: KeyboardEvent<HTMLInputElement>) => {
      if (e.key === 'Backspace') {
        if (!values[index] && index > 0) {
          // Empty box + backspace → go to previous
          focusInput(index - 1);
          const newValues = [...values];
          newValues[index - 1] = '';
          setValues(newValues);
        } else {
          const newValues = [...values];
          newValues[index] = '';
          setValues(newValues);
        }
      } else if (e.key === 'ArrowLeft') {
        focusInput(index - 1);
      } else if (e.key === 'ArrowRight') {
        focusInput(index + 1);
      }
    },
    [values, focusInput],
  );

  const handlePaste = useCallback(
    (e: ClipboardEvent<HTMLInputElement>) => {
      e.preventDefault();
      const pasted = e.clipboardData.getData('text').replace(/\D/g, '').slice(0, length);

      if (pasted.length > 0) {
        const newValues = Array(length).fill('');
        pasted.split('').forEach((char, i) => {
          newValues[i] = char;
        });
        setValues(newValues);

        // Focus the next empty box or the last one
        focusInput(Math.min(pasted.length, length - 1));

        if (pasted.length === length) {
          onComplete(pasted);
        }
      }
    },
    [length, onComplete, focusInput],
  );

  return (
    <div className="flex gap-3 justify-center">
      {values.map((value, index) => (
        <input
          key={index}
          ref={(el) => { inputRefs.current[index] = el; }}
          type="text"
          inputMode="numeric"
          autoComplete="one-time-code"
          maxLength={1}
          value={value}
          disabled={disabled}
          onChange={(e) => handleChange(index, e.target.value)}
          onKeyDown={(e) => handleKeyDown(index, e)}
          onPaste={handlePaste}
          className={`
            w-12 h-14 text-center text-xl font-bold
            bg-bg-input border border-border-default rounded-lg
            text-text-primary
            transition-all duration-200
            focus:border-accent-green focus:ring-2 focus:ring-accent-green/20
            disabled:opacity-50 disabled:cursor-not-allowed
          `}
        />
      ))}
    </div>
  );
}
