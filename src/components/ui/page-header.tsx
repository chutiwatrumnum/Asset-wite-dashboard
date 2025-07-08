// src/components/ui/page-header.tsx
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActionButton {
  key: string;
  label: string;
  icon?: React.ComponentType<{ className?: string }>;
  onClick: () => void;
  variant?:
    | "default"
    | "destructive"
    | "outline"
    | "secondary"
    | "ghost"
    | "link";
  disabled?: boolean;
  loading?: boolean;
}

interface AlertBanner {
  message: string;
  description: string;
  type: "warning" | "error" | "info" | "success";
  count?: number;
}

interface PageHeaderProps {
  title: string;
  description?: string;
  actions?: ActionButton[];
  alerts?: AlertBanner[];
  children?: React.ReactNode;
  statistics?: React.ReactNode;
  className?: string;
}

const getAlertClasses = (type: AlertBanner["type"]) => {
  const alertMap = {
    warning: {
      bg: "bg-orange-50",
      border: "border-orange-200",
      text: "text-orange-800",
      icon: "text-orange-600",
      desc: "text-orange-600",
    },
    error: {
      bg: "bg-red-50",
      border: "border-red-200",
      text: "text-red-800",
      icon: "text-red-600",
      desc: "text-red-600",
    },
    info: {
      bg: "bg-blue-50",
      border: "border-blue-200",
      text: "text-blue-800",
      icon: "text-blue-600",
      desc: "text-blue-600",
    },
    success: {
      bg: "bg-green-50",
      border: "border-green-200",
      text: "text-green-800",
      icon: "text-green-600",
      desc: "text-green-600",
    },
  };

  return alertMap[type];
};

function AlertBannerComponent({ alert }: { alert: AlertBanner }) {
  const classes = getAlertClasses(alert.type);

  return (
    <div
      className={cn(
        "rounded-lg p-3 flex items-center gap-2",
        classes.bg,
        classes.border,
        "border"
      )}>
      <AlertTriangle className={cn("h-5 w-5", classes.icon)} />
      <div>
        <p className={cn("text-sm font-medium", classes.text)}>
          {alert.message}
          {alert.count && ` (${alert.count.toLocaleString()})`}
        </p>
        <p className={cn("text-xs", classes.desc)}>{alert.description}</p>
      </div>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions = [],
  alerts = [],
  children,
  statistics,
  className,
}: PageHeaderProps) {
  return (
    <Card className={cn("mb-6", className)}>
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <div className="flex-1">
          <div className="flex items-center gap-4">
            <div>
              <h1 className="font-anuphan font-light text-2xl tracking-wider">
                {title}
              </h1>
              {description && (
                <p className="text-muted-foreground mt-1">{description}</p>
              )}
            </div>

            {/* Alert Banners */}
            {alerts.length > 0 && (
              <div className="flex flex-col gap-2">
                {alerts.map((alert, index) => (
                  <AlertBannerComponent key={index} alert={alert} />
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Action Buttons */}
        {actions.length > 0 && (
          <div className="flex gap-2">
            {actions.map((action) => {
              const IconComponent = action.icon;
              return (
                <Button
                  key={action.key}
                  onClick={action.onClick}
                  variant={action.variant || "default"}
                  size="sm"
                  disabled={action.disabled || action.loading}
                  className="gap-2">
                  {IconComponent && (
                    <IconComponent
                      className={cn(
                        "h-4 w-4",
                        action.loading && "animate-spin"
                      )}
                    />
                  )}
                  {action.loading ? "กำลังโหลด..." : action.label}
                </Button>
              );
            })}
          </div>
        )}
      </CardHeader>

      {/* Statistics Section */}
      {statistics && <CardContent className="pt-0">{statistics}</CardContent>}

      {/* Custom Children */}
      {children && (
        <CardContent className={statistics ? "pt-0" : "pt-0"}>
          {children}
        </CardContent>
      )}
    </Card>
  );
}

export type { ActionButton, AlertBanner };
export default PageHeader;
