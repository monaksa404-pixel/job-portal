import { Facebook, Link2 } from "lucide-react";
import { useState } from "react";

function WhatsAppIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.435 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
    </svg>
  );
}

function XIcon({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 24 24" fill="currentColor" aria-hidden>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
    </svg>
  );
}

export function ShareJobButtons({ title }: { title: string }) {
  const [copied, setCopied] = useState(false);

  const share = () => {
    const url = window.location.href;
    const text = `Check out this job: ${title}`;
    return { url, text };
  };

  const open = (href: string) => {
    window.open(href, "_blank", "noopener,noreferrer,width=600,height=500");
  };

  const onWhatsApp = () => {
    const { url, text } = share();
    open(`https://wa.me/?text=${encodeURIComponent(`${text}\n${url}`)}`);
  };

  const onFacebook = () => {
    const { url } = share();
    open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(url)}`);
  };

  const onX = () => {
    const { url, text } = share();
    open(`https://twitter.com/intent/tweet?text=${encodeURIComponent(text)}&url=${encodeURIComponent(url)}`);
  };

  const onCopy = async () => {
    const { url } = share();
    try {
      await navigator.clipboard.writeText(url);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      window.prompt("Copy this link:", url);
    }
  };

  return (
    <div className="mt-3 flex gap-2">
      <button type="button" onClick={onWhatsApp} title="Share on WhatsApp" className="w-9 h-9 rounded-full flex items-center justify-center bg-emerald-500 text-white hover:opacity-90 active:scale-95 transition">
        <WhatsAppIcon />
      </button>
      <button type="button" onClick={onFacebook} title="Share on Facebook" className="w-9 h-9 rounded-full flex items-center justify-center bg-blue-600 text-white hover:opacity-90 active:scale-95 transition">
        <Facebook className="w-4 h-4" />
      </button>
      <button type="button" onClick={onX} title="Share on X" className="w-9 h-9 rounded-full flex items-center justify-center bg-black text-white hover:opacity-90 active:scale-95 transition">
        <XIcon />
      </button>
      <button type="button" onClick={onCopy} title="Copy link" className="w-9 h-9 rounded-full flex items-center justify-center bg-slate-200 text-slate-600 hover:bg-slate-300 active:scale-95 transition">
        <Link2 className="w-4 h-4" />
      </button>
      {copied && <span className="text-xs text-emerald-600 self-center font-semibold">Copied!</span>}
    </div>
  );
}
