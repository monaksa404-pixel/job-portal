import type { Job } from "@/lib/types";

export type CompanyInfo = {
  name: string;
  logoUrl: string | null;
  website: string | null;
  verified: boolean;
};

export function getJobCompanyInfo(job: Job): CompanyInfo {
  const company = job.company ?? null;
  const added = job.added_companies ?? [];
  const byId = job.company_id ? added.find((c) => c.id === job.company_id) : null;
  const byName = added.find((c) => c.name.toLowerCase() === job.company_name.toLowerCase());

  return {
    name: company?.name ?? job.company_name,
    logoUrl: job.company_logo_url ?? company?.logo_url ?? byId?.logo_url ?? byName?.logo_url ?? null,
    website: company?.website ?? byId?.website ?? byName?.website ?? null,
    verified: company?.verified ?? job.verified,
  };
}

export function formatWebsiteDisplay(url: string | null | undefined): string | null {
  if (!url?.trim()) return null;
  return url.trim().replace(/^https?:\/\//i, "").replace(/\/$/, "");
}

export function CompanyLogoBox({
  name,
  logoUrl,
  size = "md",
}: {
  name: string;
  logoUrl: string | null;
  size?: "xs" | "sm" | "md" | "lg";
}) {
  const box =
    size === "lg"
      ? "w-20 h-20 rounded-xl"
      : size === "md"
        ? "w-16 h-16 rounded-xl"
        : size === "sm"
          ? "w-14 h-14 rounded-lg"
          : "w-11 h-11 rounded-lg";
  const text =
    size === "lg" ? "text-2xl" : size === "md" ? "text-lg" : size === "sm" ? "text-base" : "text-xs";

  if (logoUrl) {
    return (
      <div className={`${box} shrink-0 overflow-hidden border border-border/30 bg-white`}>
        <img src={logoUrl} alt={name} className="w-full h-full object-cover" />
      </div>
    );
  }

  const initials = name
    .split(" ")
    .map((w) => w[0])
    .filter(Boolean)
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <div className={`${box} bg-amber-400 shrink-0 flex items-center justify-center text-brand-navy font-extrabold ${text}`}>
      {initials || "?"}
    </div>
  );
}

export function VerifiedBadge({ className = "w-[18px] h-[18px]" }: { className?: string }) {
  return (
    <span className={`inline-flex shrink-0 items-center justify-center ${className}`} aria-label="Verified">
      <svg viewBox="0 0 24 24" className="w-full h-full block" aria-hidden>
        <circle cx="12" cy="12" r="12" fill="#2563EB" />
        <path
          fill="#fff"
          d="M10.2 12.2 8.5 10.5 7.1 11.9l3.1 3.1 6.6-6.6-1.4-1.4-5.2 5.2z"
        />
      </svg>
    </span>
  );
}

export function CompanyNameRow({
  name,
  verified,
  website,
  nameClassName = "text-sm font-bold text-brand-navy",
  websiteClassName = "text-xs text-muted-foreground",
}: {
  name: string;
  verified: boolean;
  website: string | null;
  nameClassName?: string;
  websiteClassName?: string;
}) {
  const site = formatWebsiteDisplay(website);
  return (
    <div className="min-w-0 flex-1">
      <div className="flex items-center gap-1.5 min-w-0">
        <span className={`truncate min-w-0 ${nameClassName}`}>{name}</span>
        {verified && <VerifiedBadge />}
      </div>
      {site && <div className={`truncate mt-0.5 ${websiteClassName}`}>{site}</div>}
    </div>
  );
}

export function CompanyBrandRow({
  name,
  logoUrl,
  verified,
  website,
  logoSize = "xs",
  nameClassName = "text-sm font-bold text-brand-navy",
  websiteClassName = "text-xs text-muted-foreground",
}: {
  name: string;
  logoUrl: string | null;
  verified: boolean;
  website: string | null;
  logoSize?: "xs" | "sm";
  nameClassName?: string;
  websiteClassName?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 min-w-0">
      <CompanyLogoBox name={name} logoUrl={logoUrl} size={logoSize} />
      <CompanyNameRow
        name={name}
        verified={verified}
        website={website}
        nameClassName={nameClassName}
        websiteClassName={websiteClassName}
      />
    </div>
  );
}
