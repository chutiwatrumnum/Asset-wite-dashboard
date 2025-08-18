// src/components/ui/vehicle-status-badge.tsx - Badge สำหรับแสดงสถานะยานพาหนะ
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Clock, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";
import { isVehicleExpired, isVehicleExpiringSoon } from "@/utils/vehicleUtils";

interface VehicleStatusBadgeProps {
  tier: string;
  expireTime?: string;
  className?: string;
}

// แมปสถานะยานพาหนะ (ลบระดับออก เหลือแค่สถานะเวลา)
const getVehicleStatus = (expireTime?: string) => {
  if (!expireTime) {
    return {
      label: "ไม่มีกำหนด",
      color: "bg-gray-100 text-gray-700 border-gray-200",
      icon: CheckCircle,
    };
  }

  if (isVehicleExpired(expireTime)) {
    return {
      label: "หมดอายุ",
      color: "bg-red-100 text-red-700 border-red-200",
      icon: XCircle,
    };
  }

  if (isVehicleExpiringSoon(expireTime, 7)) {
    return {
      label: "ใกล้หมดอายุ",
      color: "bg-orange-100 text-orange-700 border-orange-200",
      icon: AlertTriangle,
    };
  }

  return {
    label: "ใช้งานได้",
    color: "bg-green-100 text-green-700 border-green-200",
    icon: CheckCircle,
  };
};

export function VehicleStatusBadge({
  tier,
  expireTime,
  className,
}: VehicleStatusBadgeProps) {
  const status = getVehicleStatus(expireTime);
  const IconComponent = status.icon;

  return (
    <Badge
      variant="outline"
      className={cn(
        "inline-flex items-center gap-1 font-medium",
        status.color,
        className
      )}>
      <IconComponent className="h-3 w-3" />
      {status.label}
    </Badge>
  );
}
