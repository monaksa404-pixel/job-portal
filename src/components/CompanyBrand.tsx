import type { Job } from "@/lib/types";
import { getJobCompanyInfo as resolveCompanyInfo } from "@/lib/job-salary";
import blueTick from "@/images/blue-tick.png";

export type CompanyInfo = {
  name: string;
  logoUrl: string | null;
  website: string | null;
  verified: boolean;
};

export function getJobCompanyInfo(job: Job): CompanyInfo {
  return resolveCompanyInfo(job);
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
      <div className={`${box} shrink-0 overflow-hidden rounded-lg bg-white`}>
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
    <img
      src={blueTick}
      alt=""
      aria-hidden
      className={`inline-block shrink-0 object-contain ${className}`}
    />
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
    <div className="min-w-0 flex-1 overflow-visible">
      <div className="flex items-center gap-1.5 min-w-0 overflow-visible">
        <span className={`truncate min-w-0 ${nameClassName}`}>{name}</span>
        {verified && <VerifiedBadge className="w-[18px] h-[18px] shrink-0" />}
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
  logoSize?: "xs" | "sm" | "md";
  nameClassName?: string;
  websiteClassName?: string;
}) {
  return (
    <div className="flex items-start gap-2.5 min-w-0 overflow-visible">
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
