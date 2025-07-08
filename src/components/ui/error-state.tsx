// src/components/ui/error-state.tsx
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AlertTriangle, RefreshCw, Home } from "lucide-react";
import { cn } from "@/lib/utils";

interface ErrorStateAction {
  key: string;
  label: string;
  onClick: () => void;
  variant?: "default" | "outline" | "secondary" | "ghost";
  icon?: React.ComponentType<{ className?: string }>;
  loading?: boolean;
}

interface ErrorStateProps {
  title?: string;
  message?: string;
  error?: Error | string;
  actions?: ErrorStateAction[];
  showRetry?: boolean;
  showHome?: boolean;
  onRetry?: () => void;
  onHome?: () => void;
  isLoading?: boolean;
  className?: string;
  variant?: "card" | "inline";
}

export function ErrorState({
  title = "เกิดข้อผิดพลาด",
  message,
  error,
  actions = [],
  showRetry = true,
  showHome = false,
  onRetry,
  onHome,
  isLoading = false,
  className,
  variant = "card",
}: ErrorStateProps) {
  const errorMessage =
    message ||
    (error instanceof Error ? error.message : error) ||
    "ไม่สามารถโหลดข้อมูลได้";

  const defaultActions: ErrorStateAction[] = [];

  if (showRetry && onRetry) {
    defaultActions.push({
      key: "retry",
      label: isLoading ? "กำลังโหลด..." : "ลองใหม่",
      onClick: onRetry,
      variant: "outline",
      icon: RefreshCw,
      loading: isLoading,
    });
  }

  if (showHome && onHome) {
    defaultActions.push({
      key: "home",
      label: "กลับหน้าหลัก",
      onClick: onHome,
      variant: "default",
      icon: Home,
    });
  }

  const allActions = [...defaultActions, ...actions];

  const content = (
    <div className="text-center text-red-600">
      <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
      <h3 className="text-lg font-semibold mb-2">{title}</h3>
      <p className="text-sm text-gray-600 mb-4">{errorMessage}</p>

      {allActions.length > 0 && (
        <div className="flex flex-col sm:flex-row gap-2 justify-center">
          {allActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.key}
                onClick={action.onClick}
                variant={action.variant || "outline"}
                disabled={action.loading || isLoading}
                className="gap-2">
                {IconComponent && (
                  <IconComponent
                    className={cn(
                      "h-4 w-4",
                      (action.loading || isLoading) && "animate-spin"
                    )}
                  />
                )}
                {action.label}
              </Button>
            );
          })}
        </div>
      )}
    </div>
  );

  if (variant === "inline") {
    return <div className={cn("py-8", className)}>{content}</div>;
  }

  return (
    <Card className={cn("mb-6", className)}>
      <CardContent className="pt-6">{content}</CardContent>
    </Card>
  );
}

export type { ErrorStateAction };
export default ErrorState;
