import { forwardRef, useCallback, useState } from 'react';

interface CurrencyInputProps {
  value: string;
  onChange: (value: string) => void;
  currency?: string;
  placeholder?: string;
  disabled?: boolean;
  className?: string;
  hasError?: boolean;
  allowNegative?: boolean;
}

/**
 * Formats a numeric string with thousands separators for display.
 * e.g. "1234567.89" → "1,234,567.89"
 */
function formatWithThousands(raw: string): string {
  if (!raw) return '';
  const isNegative = raw.startsWith('-');
  const abs = isNegative ? raw.slice(1) : raw;
  if (!abs) return isNegative ? '-' : '';
  const [intPart, decPart] = abs.split('.');
  const formattedInt = intPart.replace(/\B(?=(\d{3})+(?!\d))/g, ',');
  const formatted = decPart !== undefined ? `${formattedInt}.${decPart}` : formattedInt;
  return isNegative ? `-${formatted}` : formatted;
}

/**
 * Strips thousands separators, returning the raw numeric string.
 * e.g. "1,234,567.89" → "1234567.89"
 */
function stripFormatting(display: string): string {
  return display.replace(/,/g, '');
}

export const CurrencyInput = forwardRef<HTMLInputElement, CurrencyInputProps>(
  (
    {
      value,
      onChange,
      currency = 'MXN',
      placeholder = '0.00',
      disabled,
      className = '',
      hasError,
      allowNegative = false,
    },
    ref
  ) => {
    // displayValue is what the user sees (with commas)
    // value (prop) is the raw clean number string stored in the form
    const [displayValue, setDisplayValue] = useState(() => formatWithThousands(value));

    const handleChange = useCallback(
      (e: React.ChangeEvent<HTMLInputElement>) => {
        // Strip commas to get the raw input
        const stripped = stripFormatting(e.target.value);
        const isNegative = allowNegative && stripped.startsWith('-');
        const raw = (isNegative ? stripped.slice(1) : stripped).replace(/[^0-9.]/g, '');

        // Allow only one decimal point
        const parts = raw.split('.');
        if (parts.length > 2) return;

        // Max 2 decimal places
        if (parts[1]?.length > 2) return;

        const finalRaw = isNegative ? `-${raw}` : raw;

        // Update display with formatted value
        setDisplayValue(formatWithThousands(finalRaw));

        // Emit clean value to form
        onChange(finalRaw);
      },
      [onChange, allowNegative]
    );

    // Sync display when value changes externally (e.g. form reset)
    const handleFocus = useCallback(() => {
      setDisplayValue(formatWithThousands(value));
    }, [value]);

    return (
      <div
        className={`flex items-center bg-[#1E2A3A] border rounded-xl overflow-hidden transition-colors ${
          hasError
            ? 'border-[#FF5B5B]/60'
            : 'border-white/10 focus-within:border-[#3D8BFF]/50 focus-within:ring-1 focus-within:ring-[#3D8BFF]/30'
        } ${className}`}
      >
        <span className="pl-3 pr-1.5 text-sm text-[#8899AA] select-none flex-shrink-0">
          {currency}
        </span>
        <input
          ref={ref}
          type="text"
          inputMode="decimal"
          value={displayValue}
          onChange={handleChange}
          onFocus={handleFocus}
          placeholder={placeholder}
          disabled={disabled}
          className="flex-1 bg-transparent py-2.5 pr-3 text-sm text-[#F0F4F8] placeholder-[#8899AA] focus:outline-none disabled:opacity-50"
        />
      </div>
    );
  }
);

CurrencyInput.displayName = 'CurrencyInput';