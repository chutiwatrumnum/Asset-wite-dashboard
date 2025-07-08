// src/components/ui/empty-state.tsx
import { Button } from "@/components/ui/button";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateAction {
  key: string;
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
  icon?: LucideIcon;
}

interface EmptyStateProps {
  icon?: LucideIcon;
  title: string;
  description?: string;
  actions?: EmptyStateAction[];
  children?: React.ReactNode;
  className?: string;
  size?: "sm" | "md" | "lg";
}

export function EmptyState({
  icon: IconComponent,
  title,
  description,
  actions = [],
  children,
  className,
  size = "md",
}: EmptyStateProps) {
  const sizeClasses = {
    sm: {
      container: "py-6",
      icon: "h-12 w-12",
      title: "text-lg",
      description: "text-sm",
      spacing: "space-y-2",
    },
    md: {
      container: "py-8",
      icon: "h-16 w-16",
      title: "text-xl",
      description: "text-base",
      spacing: "space-y-4",
    },
    lg: {
      container: "py-12",
      icon: "h-20 w-20",
      title: "text-2xl",
      description: "text-lg",
      spacing: "space-y-6",
    },
  };

  const classes = sizeClasses[size];

  return (
    <div className={cn("text-center", classes.container, className)}>
      <div className={cn("text-gray-500", classes.spacing)}>
        {/* Icon */}
        {IconComponent && (
          <div className="flex justify-center">
            <IconComponent className={cn("text-gray-400", classes.icon)} />
          </div>
        )}

        {/* Title */}
        <div className={cn("font-medium mb-2", classes.title)}>{title}</div>

        {/* Description */}
        {description && (
          <p className={cn("text-gray-600 mb-4", classes.description)}>
            {description}
          </p>
        )}

        {/* Custom Children */}
        {children}

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="flex flex-col sm:flex-row gap-2 justify-center items-center mt-4">
            {actions.map((action) => {
              const ActionIcon = action.icon;
              return (
                <Button
                  key={action.key}
                  onClick={action.onClick}
                  variant={action.variant || "default"}
                  className="gap-2">
                  {ActionIcon && <ActionIcon className="h-4 w-4" />}
                  {action.label}
                </Button>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

export type { EmptyStateAction };
export default EmptyState;
