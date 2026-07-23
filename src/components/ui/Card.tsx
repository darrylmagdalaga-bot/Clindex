import { cn } from "@/lib/utils";
import type { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  hover?: boolean;
  padding?: "none" | "sm" | "md" | "lg";
}

const paddings = { none: "", sm: "p-4", md: "p-5", lg: "p-6" };

export function Card({ children, hover, padding = "md", className, ...props }: CardProps) {
  return (
    <div
      className={cn(
        "bg-white rounded-[20px] shadow-[0_10px_40px_rgba(15,23,42,.06)] border border-transparent",
        hover && "transition-all duration-300 hover:shadow-[0_20px_60px_rgba(15,23,42,.12)] hover:-translate-y-1 cursor-pointer",
        paddings[padding],
        className
      )}
      {...props}
    >
      {children}
    </div>
  );
}

interface CardHeaderProps { title: string; description?: string; action?: ReactNode; className?: string; }
export function CardHeader({ title, description, action, className }: CardHeaderProps) {
  return (
    <div className={cn("flex items-start justify-between gap-4 mb-5", className)}>
      <div>
        <h3 className="text-base font-semibold text-gray-900">{title}</h3>
        {description && <p className="text-sm text-gray-500 mt-0.5">{description}</p>}
      </div>
      {action && <div className="flex-shrink-0">{action}</div>}
    </div>
  );
}