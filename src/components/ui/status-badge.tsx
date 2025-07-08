// src/components/ui/status-badge.tsx
import { Badge } from "@/components/ui/badge";
import { LucideIcon } from "lucide-react";
import {
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle,
  Pause,
  Play,
  Ban,
  Zap,
  Info,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface StatusConfig {
  label: string;
  color: string;
  bgColor: string;
  icon?: LucideIcon;
  variant?: "default" | "secondary" | "destructive" | "outline";
}

// Predefined status configurations
const statusConfigs: Record<string, StatusConfig> = {
  // Common statuses
  active: {
    label: "ใช้งานได้",
    color: "text-green-700",
    bgColor: "bg-green-100 border-green-200",
    icon: CheckCircle,
    variant: "outline",
  },
  inactive: {
    label: "ปิดใช้งาน",
    color: "text-gray-700",
    bgColor: "bg-gray-100 border-gray-200",
    icon: Pause,
    variant: "outline",
  },
  pending: {
    label: "รอดำเนินการ",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100 border-yellow-200",
    icon: Clock,
    variant: "outline",
  },
  expired: {
    label: "หมดอายุ",
    color: "text-red-700",
    bgColor: "bg-red-100 border-red-200",
    icon: XCircle,
    variant: "outline",
  },
  expiring: {
    label: "ใกล้หมดอายุ",
    color: "text-orange-700",
    bgColor: "bg-orange-100 border-orange-200",
    icon: AlertTriangle,
    variant: "outline",
  },
  blocked: {
    label: "ถูกระงับ",
    color: "text-red-700",
    bgColor: "bg-red-100 border-red-200",
    icon: Ban,
    variant: "outline",
  },
  processing: {
    label: "กำลังดำเนินการ",
    color: "text-blue-700",
    bgColor: "bg-blue-100 border-blue-200",
    icon: Zap,
    variant: "outline",
  },
  completed: {
    label: "เสร็จสิ้น",
    color: "text-green-700",
    bgColor: "bg-green-100 border-green-200",
    icon: CheckCircle,
    variant: "outline",
  },
  failed: {
    label: "ล้มเหลว",
    color: "text-red-700",
    bgColor: "bg-red-100 border-red-200",
    icon: XCircle,
    variant: "outline",
  },

  // Invitation specific
  "invitation-active": {
    label: "ใช้งานได้",
    color: "text-green-700",
    bgColor: "bg-green-100 border-green-200",
    icon: CheckCircle,
  },
  "invitation-pending": {
    label: "รอเริ่มใช้",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100 border-yellow-200",
    icon: Clock,
  },
  "invitation-expired": {
    label: "หมดอายุ",
    color: "text-red-700",
    bgColor: "bg-red-100 border-red-200",
    icon: XCircle,
  },
  "invitation-expiring": {
    label: "ใกล้หมดอายุ",
    color: "text-orange-700",
    bgColor: "bg-orange-100 border-orange-200",
    icon: AlertTriangle,
  },

  // Vehicle specific
  "vehicle-resident": {
    label: "ลูกบ้าน",
    color: "text-blue-700",
    bgColor: "bg-blue-100 border-blue-200",
    icon: CheckCircle,
  },
  "vehicle-staff": {
    label: "เจ้าหน้าที่",
    color: "text-green-700",
    bgColor: "bg-green-100 border-green-200",
    icon: CheckCircle,
  },
  "vehicle-guest": {
    label: "แขก",
    color: "text-yellow-700",
    bgColor: "bg-yellow-100 border-yellow-200",
    icon: Info,
  },
  "vehicle-unknown": {
    label: "ไม่ทราบ",
    color: "text-gray-700",
    bgColor: "bg-gray-100 border-gray-200",
    icon: AlertTriangle,
  },
  "vehicle-blacklisted": {
    label: "บัญชีดำ",
    color: "text-red-700",
    bgColor: "bg-red-100 border-red-200",
    icon: Ban,
  },
};

interface StatusBadgeProps {
  status: string;
  label?: string;
  showIcon?: boolean;
  size?: "sm" | "md" | "lg";
  variant?: "default" | "secondary" | "destructive" | "outline";
  customConfig?: Partial<StatusConfig>;
  className?: string;
  onClick?: () => void;
}

export function StatusBadge({
  status,
  label,
  showIcon = true,
  size = "md",
  variant,
  customConfig,
  className,
  onClick,
}: StatusBadgeProps) {
  // Get configuration for the status
  const config = {
    ...statusConfigs[status],
    ...customConfig,
  };

  // Fallback for unknown status
  if (!config.label && !label) {
    config.label = status;
    config.color = "text-gray-700";
    config.bgColor = "bg-gray-100 border-gray-200";
    config.icon = Info;
  }

  const IconComponent = config.icon;
  const displayLabel = label || config.label;
  const badgeVariant = variant || config.variant || "outline";

  const sizeClasses = {
    sm: "text-xs gap-1 px-2 py-0.5 [&>svg]:h-3 [&>svg]:w-3",
    md: "text-xs gap-1 px-2 py-1 [&>svg]:h-3 [&>svg]:w-3",
    lg: "text-sm gap-1.5 px-3 py-1.5 [&>svg]:h-4 [&>svg]:w-4",
  };

  return (
    <Badge
      variant={badgeVariant}
      className={cn(
        "inline-flex items-center font-medium",
        sizeClasses[size],
        config.color,
        config.bgColor,
        onClick && "cursor-pointer hover:opacity-80",
        className
      )}
      onClick={onClick}>
      {showIcon && IconComponent && <IconComponent className="shrink-0" />}
      {displayLabel}
    </Badge>
  );
}

// Multi-status badge for showing multiple statuses
interface MultiStatusBadgeProps {
  statuses: Array<{
    status: string;
    label?: string;
    showIcon?: boolean;
  }>;
  size?: "sm" | "md" | "lg";
  direction?: "horizontal" | "vertical";
  className?: string;
}

export function MultiStatusBadge({
  statuses,
  size = "md",
  direction = "vertical",
  className,
}: MultiStatusBadgeProps) {
  const containerClasses = cn(
    "flex gap-1",
    direction === "horizontal" ? "flex-row" : "flex-col",
    className
  );

  return (
    <div className={containerClasses}>
      {statuses.map((statusItem, index) => (
        <StatusBadge
          key={`${statusItem.status}-${index}`}
          status={statusItem.status}
          label={statusItem.label}
          showIcon={statusItem.showIcon}
          size={size}
        />
      ))}
    </div>
  );
}

// Predefined status badge components for common use cases
export function InvitationStatusBadge({
  status,
  ...props
}: Omit<StatusBadgeProps, "status"> & {
  status: "active" | "pending" | "expired" | "expiring" | "inactive";
}) {
  return <StatusBadge status={`invitation-${status}`} {...props} />;
}

export function VehicleStatusBadge({
  status,
  ...props
}: Omit<StatusBadgeProps, "status"> & {
  status: "resident" | "staff" | "guest" | "unknown" | "blacklisted";
}) {
  return <StatusBadge status={`vehicle-${status}`} {...props} />;
}

export { statusConfigs };
export default StatusBadge;
