import { Link, useRouterState } from "@tanstack/react-router";
import { Bell, Menu, X } from "lucide-react";
import { useState } from "react";
import { Logo } from "./Logo";

const navItems = [
  { to: "/", label: "Home" },
  { to: "/categories", label: "Categories" },
  { to: "/jobs", label: "Jobs" },
  { to: "/my-applications", label: "My Applications" },
  { to: "/notifications", label: "Notifications" },
] as const;

export function Header() {
  const [open, setOpen] = useState(false);
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <header className="sticky top-0 z-40 bg-white border-b border-border">
      <div className="container mx-auto max-w-7xl px-4 lg:px-6 h-16 lg:h-20 flex items-center justify-between">
        <Logo />

        <nav className="hidden lg:flex items-center gap-8">
          {navItems.map((item) => {
            const active = pathname === item.to || (item.to !== "/" && pathname.startsWith(item.to));
            return (
              <Link
                key={item.to}
                to={item.to}
                className={`relative text-sm font-medium transition-colors ${
                  active ? "text-brand-blue" : "text-foreground/80 hover:text-brand-blue"
                }`}
              >
                <span className="flex items-center gap-1.5">
                  {item.label}
                  {item.label === "Notifications" && (
                    <span className="relative">
                      <Bell className="w-4 h-4" />
                      <span className="absolute -top-1.5 -right-2 w-4 h-4 rounded-full bg-brand-yellow text-[10px] text-brand-navy font-bold flex items-center justify-center">
                        3
                      </span>
                    </span>
                  )}
                </span>
                {active && (
                  <span className="absolute -bottom-[22px] left-0 right-0 h-0.5 bg-brand-blue rounded-full" />
                )}
              </Link>
            );
          })}
        </nav>

        <div className="hidden lg:flex items-center gap-3">
          <Link
            to="/auth"
            className="px-5 py-2 text-sm font-semibold text-brand-blue border-2 border-brand-blue rounded-lg hover:bg-brand-blue hover:text-white transition"
          >
            Login
          </Link>
          <Link
            to="/auth"
            className="px-5 py-2 text-sm font-semibold text-white bg-brand-blue rounded-lg hover:opacity-90 transition"
          >
            Register
          </Link>
        </div>

        <button
          className="lg:hidden p-2"
          onClick={() => setOpen((v) => !v)}
          aria-label="Toggle menu"
        >
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6 text-brand-navy" />}
        </button>
      </div>

      {open && (
        <div className="lg:hidden border-t border-border bg-white">
          <nav className="container mx-auto px-4 py-3 flex flex-col gap-1">
            {navItems.map((item) => (
              <Link
                key={item.to}
                to={item.to}
                onClick={() => setOpen(false)}
                className="px-3 py-2.5 rounded-lg text-sm font-medium hover:bg-secondary"
              >
                {item.label}
              </Link>
            ))}
            <Link
              to="/auth"
              onClick={() => setOpen(false)}
              className="mt-2 px-3 py-2.5 rounded-lg text-sm font-semibold text-white bg-brand-blue text-center"
            >
              Login / Register
            </Link>
          </nav>
        </div>
      )}
    </header>
  );
}