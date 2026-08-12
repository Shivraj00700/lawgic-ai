import logo from "@/assets/logo.png";
import { cn } from "@/lib/utils";

type LogoProps = {
  className?: string;
  size?: "sm" | "md" | "lg";
};

/**
 * Circular logo showing the gold weighing scale seal.
 * Used on the landing page hero and /app welcome state.
 */
export function Logo({ className, size = "md" }: LogoProps) {
  const sizeClasses = {
    sm: "size-16",
    md: "size-[104px]",
    lg: "size-[120px]",
  };

  return (
    <img
      src={logo}
      alt="Lawgic AI"
      width={512}
      height={512}
      className={cn("rounded-full object-cover", sizeClasses[size], className)}
    />
  );
}
