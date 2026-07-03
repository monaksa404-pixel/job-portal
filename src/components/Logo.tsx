import { Link } from "@tanstack/react-router";
import logoImage from "@/images/logo.png";

type LogoProps = {
  className?: string;
  imgClassName?: string;
};

export function Logo({ className, imgClassName }: LogoProps) {
  return (
    <Link to="/" className={`flex items-center shrink-0 ${className ?? ""}`}>
      <img
        src={logoImage}
        alt="Job Expert"
        className={imgClassName ?? "h-32 w-auto object-contain sm:h-40 md:h-56 lg:h-64"}
      />
    </Link>
  );
}
