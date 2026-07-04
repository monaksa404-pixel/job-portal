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
        className={imgClassName ?? "h-36 w-auto object-contain sm:h-44 md:h-60 lg:h-72"}
      />
    </Link>
  );
}
