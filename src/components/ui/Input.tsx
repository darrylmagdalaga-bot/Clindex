import { forwardRef, type InputHTMLAttributes, type ReactNode } from "react";
import { cn } from "@/lib/utils";

interface InputProps extends Omit<InputHTMLAttributes<HTMLInputElement>, 'prefix'> {
  label?: string;
  error?: string;
  hint?: string;
  prefix?: ReactNode;
  suffix?: ReactNode;
  wrapperClassName?: string;
}

export const Input = forwardRef<HTMLInputElement, InputProps>(
  ({ label, error, hint, prefix, suffix, wrapperClassName, className, id, ...props }, ref) => {
    const inputId = id ?? label?.toLowerCase().replace(/\s+/g, "-");
    return (
      <div className={cn("flex flex-col gap-1.5", wrapperClassName)}>
        {label && (
          <label htmlFor={inputId} className="text-sm font-medium text-gray-700">
            {label}
            {props.required && <span className="text-red-500 ml-0.5">*</span>}
          </label>
        )}
        <div className="relative flex items-center">
          {prefix && (
            <span className="absolute left-3 text-gray-400 flex items-center pointer-events-none">{prefix}</span>
          )}
          <input
            ref={ref}
            id={inputId}
            className={cn(
              "w-full rounded-[12px] border border-gray-200 bg-white text-sm text-gray-900 placeholder-gray-400",
              "transition-all duration-150",
              "focus:outline-none focus:ring-2 focus:ring-[#3B82F6] focus:border-transparent",
              "disabled:bg-gray-50 disabled:text-gray-500 disabled:cursor-not-allowed",
              prefix ? "pl-9" : "pl-3",
              suffix ? "pr-9" : "pr-3",
              "py-2.5",
              error && "border-red-300 focus:ring-red-500",
              className
            )}
            {...props}
          />
          {suffix && (
            <span className="absolute right-3 text-gray-400 flex items-center">{suffix}</span>
          )}
        </div>
        {error && <p className="text-xs text-red-500">{error}</p>}
        {hint && !error && <p className="text-xs text-gray-400">{hint}</p>}
      </div>
    );
  }
);
Input.displayName = "Input";