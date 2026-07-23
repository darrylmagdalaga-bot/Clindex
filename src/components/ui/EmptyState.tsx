import type { ReactNode } from "react";
import { FileSearch } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon?: ReactNode;
  title: string;
  description?: string;
  action?: ReactNode;
  className?: string;
}

export function EmptyState({ icon, title, description, action, className }: EmptyStateProps) {
  return (
    <div className={cn("flex flex-col items-center justify-center py-16 px-6 text-center", className)}>
      <div className="w-14 h-14 rounded-2xl bg-gray-50 flex items-center justify-center mb-4 text-gray-400">
        {icon ?? <FileSearch className="w-7 h-7" />}
      </div>
      <h3 className="text-base font-semibold text-gray-900 mb-1.5">{title}</h3>
      {description && <p className="text-sm text-gray-500 max-w-xs leading-relaxed">{description}</p>}
      {action && <div className="mt-5">{action}</div>}
    </div>
  );
}