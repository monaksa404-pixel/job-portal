import { useState, useRef, useEffect } from "react";
import { ChevronDown } from "lucide-react";

export const PHONE_COUNTRIES = [
  { code: "OM", flag: "🇴🇲", dial: "+968", label: "Oman" },
  { code: "AE", flag: "🇦🇪", dial: "+971", label: "UAE" },
  { code: "SA", flag: "🇸🇦", dial: "+966", label: "Saudi Arabia" },
  { code: "KW", flag: "🇰🇼", dial: "+965", label: "Kuwait" },
  { code: "BH", flag: "🇧🇭", dial: "+973", label: "Bahrain" },
  { code: "QA", flag: "🇶🇦", dial: "+974", label: "Qatar" },
] as const;

export type PhoneCountry = (typeof PHONE_COUNTRIES)[number];

export function PhoneInput({
  dial,
  number,
  onDialChange,
  onNumberChange,
  inputClassName = "w-full bg-white border border-border rounded-lg px-3 py-2.5 text-sm outline-none focus:border-brand-blue focus:ring-2 focus:ring-brand-blue/20",
}: {
  dial: string;
  number: string;
  onDialChange: (dial: string) => void;
  onNumberChange: (number: string) => void;
  inputClassName?: string;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  const selected = PHONE_COUNTRIES.find((c) => c.dial === dial) ?? PHONE_COUNTRIES[2];

  useEffect(() => {
    const close = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false);
    };
    document.addEventListener("mousedown", close);
    return () => document.removeEventListener("mousedown", close);
  }, []);

  return (
    <div className="flex gap-2">
      <div className="relative shrink-0" ref={ref}>
        <button
          type="button"
          onClick={() => setOpen((v) => !v)}
          className="flex items-center gap-1.5 px-3 py-2.5 rounded-lg border border-border bg-secondary text-sm min-w-[108px] hover:bg-secondary/80"
        >
          <span className="text-base leading-none">{selected.flag}</span>
          <span className="font-medium text-brand-navy">{selected.dial}</span>
          <ChevronDown className="w-3.5 h-3.5 text-muted-foreground ml-auto" />
        </button>
        {open && (
          <div className="absolute left-0 top-full mt-1 z-50 w-52 bg-white border border-border rounded-xl shadow-lg py-1 max-h-56 overflow-y-auto">
            {PHONE_COUNTRIES.map((c) => (
              <button
                key={c.code}
                type="button"
                onClick={() => { onDialChange(c.dial); setOpen(false); }}
                className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm hover:bg-secondary text-left ${c.dial === dial ? "bg-brand-blue/5 text-brand-blue font-semibold" : "text-brand-navy"}`}
              >
                <span className="text-base">{c.flag}</span>
                <span className="flex-1">{c.label}</span>
                <span className="text-muted-foreground text-xs">{c.dial}</span>
              </button>
            ))}
          </div>
        )}
      </div>
      <input
        type="tel"
        className={inputClassName}
        placeholder="5X XXX XXXX"
        value={number}
        onChange={(e) => onNumberChange(e.target.value.replace(/[^\d\s-]/g, ""))}
      />
    </div>
  );
}

export function buildFullPhone(dial: string, number: string): string {
  const digits = number.replace(/\D/g, "");
  if (!digits) return "";
  return `${dial}${digits.startsWith("0") ? digits.slice(1) : digits}`;
}
