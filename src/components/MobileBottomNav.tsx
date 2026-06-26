import { Link, useRouterState } from "@tanstack/react-router";
import { Home, Briefcase, Heart, FileText, User } from "lucide-react";

const items = [
  { to: "/", label: "Home", icon: Home },
  { to: "/jobs", label: "Jobs", icon: Briefcase },
  { to: "/saved-jobs", label: "Saved", icon: Heart },
  { to: "/my-applications", label: "Applications", icon: FileText },
  { to: "/profile", label: "Profile", icon: User },
] as const;

export function MobileBottomNav() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  return (
    <nav className="lg:hidden fixed bottom-0 inset-x-0 z-30 bg-white border-t border-border">
      <ul className="grid grid-cols-5">
        {items.map((it) => {
          const Icon = it.icon;
          const active = pathname === it.to || (it.to !== "/" && pathname.startsWith(it.to));
          return (
            <li key={it.to}>
              <Link
                to={it.to}
                className={`flex flex-col items-center gap-1 py-2.5 text-[10px] font-medium ${
                  active ? "text-brand-blue" : "text-muted-foreground"
                }`}
              >
                <Icon className="w-5 h-5" />
                {it.label}
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}