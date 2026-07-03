import { useState } from "react";

export function AmountInput({
  value,
  onChange,
  min = 0,
  className = "inp",
}: {
  value: number;
  onChange: (v: number) => void;
  min?: number;
  className?: string;
}) {
  const [focused, setFocused] = useState(false);
  const shown = focused && value === 0 ? "" : String(value);

  return (
    <input
      type="number"
      min={min}
      className={className}
      value={shown}
      onFocus={() => setFocused(true)}
      onBlur={() => setFocused(false)}
      onChange={(e) => {
        const raw = e.target.value;
        if (raw === "") {
          onChange(0);
          return;
        }
        const n = Number(raw);
        onChange(Number.isFinite(n) ? n : 0);
      }}
    />
  );
}
