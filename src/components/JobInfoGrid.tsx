import { Briefcase, Clock, CreditCard, Users, type LucideIcon } from "lucide-react";
import type { Job } from "@/lib/types";

function JobInfoTile({
  icon: Icon,
  label,
  value,
  compact,
}: {
  icon: LucideIcon;
  label: string;
  value: string;
  compact?: boolean;
}) {
  return (
    <div className="bg-secondary/60 rounded-xl p-2.5 sm:p-3 flex items-center gap-2 sm:gap-3 min-w-0">
      <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg bg-white flex items-center justify-center text-brand-blue shrink-0">
        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[9px] sm:text-[10px] uppercase tracking-wide text-muted-foreground">{label}</div>
        <div
          className={`font-semibold text-brand-navy ${
            compact ? "text-[11px] sm:text-xs leading-snug break-words" : "text-xs sm:text-sm truncate"
          }`}
        >
          {value}
        </div>
      </div>
    </div>
  );
}

export function JobInfoGrid({ job, compact }: { job: Job; compact?: boolean }) {
  return (
    <div className="grid grid-cols-2 gap-2 sm:gap-3 min-w-0 w-full">
      <JobInfoTile icon={Briefcase} label="Experience" value={job.experience_required} compact={compact} />
      <JobInfoTile icon={Clock} label="Duty Timing" value={job.duty_timing} compact={compact} />
      <JobInfoTile
        icon={Users}
        label="Vacancies"
        value={`M: ${job.male_required} · F: ${job.female_required}`}
        compact
      />
      <JobInfoTile icon={CreditCard} label="Application Fee" value={`${job.application_fee} SAR`} compact={compact} />
    </div>
  );
}
