import type { Job } from "@/lib/types";

export type CompanyInfo = {
  name: string;
  logoUrl: string | null;
  website: string | null;
  verified: boolean;
};

export function getJobCompanyInfo(job: Job): CompanyInfo {
  const company = job.company ?? null;
  return {
    name: company?.name ?? job.company_name,
    logoUrl: job.company_logo_url ?? company?.logo_url ?? null,
    website: company?.website ?? null,
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
  const pad = size === "xs" ? "p-1" : "p-1.5";

  if (logoUrl) {
    return (
      <div className={`${box} bg-amber-400 shrink-0 overflow-hidden flex items-center justify-center ${pad}`}>
        <img src={logoUrl} alt={name} className="w-full h-full object-contain" />
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

export function VerifiedBadge({ className = "w-4 h-4" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" className={`shrink-0 ${className}`} aria-hidden>
      <path
        fill="#2563EB"
        d="M12 2.5l2.2 1.65 2.75-.15.95 2.45 2.35 1.45-.95 2.45.15 2.75-2.2 1.65-1.65 2.2-2.75-.15-.95-2.45-2.35-1.45.95-2.45-.15-2.75L12 2.5z"
      />
      <path
        fill="#fff"
        d="M10.4 12.4 9 11l-1 1 2.4 2.4 5.2-5.2-1-1-4.6 4.2z"
      />
    </svg>
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
    <div className="min-w-0">
      <div className="flex items-center gap-1 min-w-0">
        <span className={`truncate ${nameClassName}`}>{name}</span>
        {verified && <VerifiedBadge className="w-4 h-4" />}
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
    <div className="flex items-center gap-2.5 min-w-0">
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
