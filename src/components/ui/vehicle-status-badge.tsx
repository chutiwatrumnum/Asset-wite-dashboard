import { getTierInfo, getVehicleDisplayStatus } from "@/utils/vehicleUtils";
import { cn } from "@/lib/utils";
import { AlertTriangle, Clock, CheckCircle, XCircle } from "lucide-react";

interface VehicleStatusBadgeProps {
  tier: string;
  expireTime?: string;
  startTime?: string;
  className?: string;
  showIcon?: boolean;
}

const statusIcons = {
  active: CheckCircle,
  expired: XCircle,
  pending: Clock,
  expiring: AlertTriangle,
  blocked: XCircle,
};

export function VehicleStatusBadge({
  tier,
  expireTime,
  startTime,
  className,
  showIcon = false,
}: VehicleStatusBadgeProps) {
  const tierInfo = getTierInfo(tier);
  const statusInfo = getVehicleDisplayStatus({
    tier,
    expire_time: expireTime,
    start_time: startTime,
  });

  const StatusIcon = statusIcons[statusInfo.status as keyof typeof statusIcons];

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      {/* Tier Badge */}
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${tierInfo.color}`}>
        {showIcon && <StatusIcon className="inline w-3 h-3 mr-1" />}
        {tierInfo.label}
      </span>

      {/* Status Badge - only show if not active */}
      {statusInfo.status !== "active" && (
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${statusInfo.color}`}>
          {showIcon && <StatusIcon className="inline w-3 h-3 mr-1" />}
          {statusInfo.label}
        </span>
      )}
    </div>
  );
}

// Individual status component for more specific use cases
export function VehicleStatusIndicator({
  tier,
  expireTime,
  startTime,
  size = "sm",
}: {
  tier: string;
  expireTime?: string;
  startTime?: string;
  size?: "sm" | "md" | "lg";
}) {
  const statusInfo = getVehicleDisplayStatus({
    tier,
    expire_time: expireTime,
    start_time: startTime,
  });

  const StatusIcon = statusIcons[statusInfo.status as keyof typeof statusIcons];

  const sizeClasses = {
    sm: "w-3 h-3",
    md: "w-4 h-4",
    lg: "w-5 h-5",
  };

  const getStatusColor = () => {
    switch (statusInfo.status) {
      case "active":
        return "text-green-600";
      case "expired":
      case "blocked":
        return "text-red-600";
      case "pending":
        return "text-yellow-600";
      case "expiring":
        return "text-orange-600";
      default:
        return "text-gray-600";
    }
  };

  return (
    <div className="flex items-center gap-1">
      <StatusIcon className={`${sizeClasses[size]} ${getStatusColor()}`} />
      <span className={`text-xs ${getStatusColor()}`}>{statusInfo.label}</span>
    </div>
  );
}

export default VehicleStatusBadge;
