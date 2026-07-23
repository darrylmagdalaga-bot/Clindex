import { cn } from "@/lib/utils";
import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "default" | "success" | "warning" | "danger" | "info" | "outline";
  size?: "sm" | "md";
  dot?: boolean;
  className?: string;
}

const variantMap = {
  default: "bg-gray-100 text-gray-700",
  success: "bg-green-50 text-green-700",
  warning: "bg-amber-50 text-amber-700",
  danger: "bg-red-50 text-red-700",
  info: "bg-blue-50 text-blue-700",
  outline: "border border-gray-200 text-gray-600 bg-transparent",
};

const dotMap = {
  default: "bg-gray-400",
  success: "bg-green-500",
  warning: "bg-amber-400",
  danger: "bg-red-500",
  info: "bg-blue-500",
  outline: "bg-gray-400",
};

export function Badge({ children, variant = "default", size = "md", dot, className }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1.5 rounded-full font-medium",
        size === "sm" ? "px-2 py-0.5 text-xs" : "px-2.5 py-1 text-xs",
        variantMap[variant],
        className
      )}
    >
      {dot && <span className={cn("w-1.5 h-1.5 rounded-full flex-shrink-0", dotMap[variant])} />}
      {children}
    </span>
  );
}