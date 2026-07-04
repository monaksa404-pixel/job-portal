import {
  Stethoscope, Truck, Zap, Wrench, HardHat, Building2, Utensils, Monitor,
  ShoppingCart, Shield, Factory, Sparkles, Grid3x3, Briefcase,
  type LucideIcon,
} from "lucide-react";

const ICONS: Record<string, LucideIcon> = {
  stethoscope: Stethoscope,
  truck: Truck,
  zap: Zap,
  wrench: Wrench,
  "hard-hat": HardHat,
  building: Building2,
  utensils: Utensils,
  monitor: Monitor,
  "shopping-cart": ShoppingCart,
  shield: Shield,
  factory: Factory,
  sparkles: Sparkles,
  grid: Grid3x3,
  briefcase: Briefcase,
};

export const COLOR_STYLES: Record<string, { bg: string; text: string }> = {
  teal:   { bg: "bg-teal-100",   text: "text-teal-600" },
  blue:   { bg: "bg-blue-100",   text: "text-blue-600" },
  yellow: { bg: "bg-amber-100",  text: "text-amber-500" },
  purple: { bg: "bg-violet-100", text: "text-violet-600" },
  orange: { bg: "bg-orange-100", text: "text-orange-500" },
  pink:   { bg: "bg-rose-100",   text: "text-rose-500" },
  green:  { bg: "bg-emerald-100",text: "text-emerald-600" },
  red:    { bg: "bg-red-100",    text: "text-red-500" },
  amber:  { bg: "bg-amber-100",  text: "text-amber-600" },
  gray:   { bg: "bg-slate-100",  text: "text-slate-500" },
};

export function CategoryIcon({
  name, color = "blue", size = 22, className = "", logoUrl,
}: { name: string; color?: string; size?: number; className?: string; logoUrl?: string | null }) {
  const c = COLOR_STYLES[color] ?? COLOR_STYLES.blue;
  if (logoUrl) {
    return (
      <div className={`rounded-xl overflow-hidden shrink-0 ${className}`}>
        <img src={logoUrl} alt="" className="w-full h-full object-cover" />
      </div>
    );
  }
  const key = name.toLowerCase();
  const Icon = ICONS[key] ?? Briefcase;
  return (
    <div className={`rounded-xl flex items-center justify-center ${c.bg} ${className}`}>
      <Icon size={size} className={c.text} strokeWidth={2.25} />
    </div>
  );
}