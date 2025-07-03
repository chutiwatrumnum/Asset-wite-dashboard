import { getTierInfo, isVehicleExpired } from "@/utils/vehicleUtils";
import { cn } from "@/lib/utils";

interface VehicleStatusBadgeProps {
  tier: string;
  expireTime?: string;
  className?: string;
}

export function VehicleStatusBadge({
  tier,
  expireTime,
  className,
}: VehicleStatusBadgeProps) {
  const tierInfo = getTierInfo(tier);
  const isExpired = expireTime ? isVehicleExpired(expireTime) : false;

  return (
    <div className={cn("flex flex-col gap-1", className)}>
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium ${tierInfo.color}`}>
        {tierInfo.label}
      </span>
      {isExpired && (
        <span className="px-2 py-1 rounded-full text-xs font-medium bg-red-100 text-red-800">
          หมดอายุ
        </span>
      )}
    </div>
  );
}
