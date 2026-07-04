import { CheckCircle2, XCircle } from "lucide-react";

export function AdminToast({ text, type = "success" }: { text: string; type?: "success" | "error" }) {
  return (
    <div
      className={`fixed bottom-6 right-6 z-50 flex items-center gap-2 px-4 py-3 rounded-xl shadow-lg text-sm font-semibold animate-in fade-in slide-in-from-bottom-2 ${
        type === "success" ? "bg-emerald-600 text-white" : "bg-rose-600 text-white"
      }`}
    >
      {type === "success" ? <CheckCircle2 className="w-4 h-4 shrink-0" /> : <XCircle className="w-4 h-4 shrink-0" />}
      {text}
    </div>
  );
}

export function AdminSpinner({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <span
      className={`inline-block rounded-full border-2 border-current border-t-transparent animate-spin ${className}`}
      aria-hidden
    />
  );
}
