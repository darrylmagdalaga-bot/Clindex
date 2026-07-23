import { forwardRef, type ButtonHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary" | "ghost" | "outline" | "danger" | "success";
  size?: "xs" | "sm" | "md" | "lg";
  loading?: boolean;
  icon?: ReactNode;
  iconPosition?: "left" | "right";
}

const variants = {
  primary: "bg-gradient-to-b from-[#3B82F6] to-[#2563EB] text-white shadow-[0_1px_3px_rgba(0,0,0,0.1),0_1px_2px_rgba(0,0,0,0.06)] hover:brightness-110 active:brightness-95 border border-[#2563EB]/50",
  secondary: "bg-[#0F172A] text-white hover:bg-slate-800 shadow-sm",
  ghost: "text-[#6B7280] hover:bg-gray-100 hover:text-[#111827]",
  outline: "border border-[#E5E7EB] text-[#111827] bg-white hover:bg-gray-50 shadow-[0_1px_2px_rgba(0,0,0,0.05)]",
  danger: "bg-[#EF4444] text-white hover:bg-red-600 shadow-sm",
  success: "bg-[#22C55E] text-white hover:bg-green-600 shadow-sm",
};

const sizes = {
  xs: "px-2.5 py-1.5 text-xs gap-1",
  sm: "px-3 py-2 text-sm gap-1.5",
  md: "px-4 py-2.5 text-sm gap-2",
  lg: "px-5 py-3 text-base gap-2",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", loading, icon, iconPosition = "left", className, children, disabled, ...props }, ref) => {
    return (
      <button
        ref={ref}
        disabled={disabled || loading}
        className={cn(
          "inline-flex items-center justify-center font-medium rounded-[12px] transition-all duration-150",
          "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[#3B82F6] focus-visible:ring-offset-2",
          "disabled:opacity-50 disabled:cursor-not-allowed",
          "cursor-pointer select-none",
          variants[variant],
          sizes[size],
          className
        )}
        {...props}
      >
        {loading ? (
          <svg className="animate-spin h-4 w-4 flex-shrink-0" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
        ) : (
          icon && iconPosition === "left" && <span className="flex-shrink-0">{icon}</span>
        )}
        {children}
        {!loading && icon && iconPosition === "right" && <span className="flex-shrink-0">{icon}</span>}
      </button>
    );
  }
);
Button.displayName = "Button";