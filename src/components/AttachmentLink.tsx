import { useEffect, useState } from "react";
import { FileText, Loader2 } from "lucide-react";
import { getDocumentSignedUrl } from "@/lib/storage-url";

export function AttachmentLink({ path, name }: { path: string; name?: string | null }) {
  const [href, setHref] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    getDocumentSignedUrl(path).then((url) => {
      if (!cancelled) {
        setHref(url);
        setLoading(false);
      }
    });
    return () => { cancelled = true; };
  }, [path]);

  if (loading) {
    return (
      <span className="inline-flex items-center gap-1 text-xs text-muted-foreground mt-2">
        <Loader2 className="w-3.5 h-3.5 animate-spin" /> Loading attachment…
      </span>
    );
  }
  if (!href) return null;

  return (
    <a
      href={href}
      target="_blank"
      rel="noreferrer"
      className="inline-flex items-center gap-1.5 mt-2 text-xs font-semibold text-brand-blue hover:underline"
    >
      <FileText className="w-3.5 h-3.5" />
      {name ?? "View attachment"}
    </a>
  );
}
