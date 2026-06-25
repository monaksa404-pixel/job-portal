import { Link } from "@tanstack/react-router";
import { Briefcase, Search } from "lucide-react";

export function Logo({ light = false }: { light?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2.5 group">
      <div className="relative">
        <div className="w-10 h-10 rounded-xl bg-brand-yellow flex items-center justify-center shadow-sm">
          <Briefcase className="w-5 h-5 text-brand-navy" strokeWidth={2.5} />
        </div>
        <div className="absolute -bottom-1 -right-1 w-5 h-5 rounded-full bg-white border-2 border-brand-navy flex items-center justify-center">
          <Search className="w-2.5 h-2.5 text-brand-navy" strokeWidth={3} />
        </div>
      </div>
      <div className="leading-tight">
        <div className={`font-extrabold text-lg tracking-tight ${light ? "text-white" : "text-brand-navy"}`}>
          JOB <span className="text-brand-yellow">EXPERT</span>
        </div>
        <div className={`text-[10px] font-medium ${light ? "text-white/70" : "text-muted-foreground"}`}>
          Find Your Dream Career
        </div>
      </div>
    </Link>
  );
}