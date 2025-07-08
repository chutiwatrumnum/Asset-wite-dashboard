// src/pages/invitation/components/columns.tsx
import { createColumnHelper } from "@tanstack/react-table";
import { formatInTimeZone } from "date-fns-tz";
import DataTableColumnHeader from "../../vehicle/components/data-table-column-header";
import { InvitationItem } from "@/api/invitation/invitation";
import { Badge } from "@/components/ui/badge";
import {
  getInvitationDisplayStatus,
  getInvitationDuration,
  isInvitationActive,
} from "@/utils/invitationUtils";
import { CheckCircle, XCircle, MapPin, User, Home } from "lucide-react";

const TimeZone = "Asia/Bangkok";
const columnHelper = createColumnHelper<InvitationItem>();

export const columns = [
  columnHelper.accessor("id", {
    cell: (info) => info.getValue(),
    enableHiding: false,
  }),

  // 1. ชื่อผู้เยี่ยม
  columnHelper.accessor("visitor_name", {
    header: () => <DataTableColumnHeader title="ชื่อผู้เยี่ยม" />,
    cell: (info) => {
      return (
        <div className="min-w-[150px]">
          <div className="flex items-center gap-2">
            <User className="h-4 w-4 text-gray-500" />
            <span className="font-semibold">{info.getValue()}</span>
          </div>
        </div>
      );
    },
    enableHiding: true,
  }),

  // 2. คอลัมน์บ้าน - แสดงแค่ชื่อ ไม่แสดง ID
  columnHelper.accessor("house_id", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="บ้าน" />
      </div>
    ),
    cell: (info) => {
      const houseId = info.getValue();
      const rowData = info.row.original;
      const houseData = rowData.expand?.house_id;

      if (!houseId) {
        return (
          <div className="flex justify-center items-center">
            <span className="text-xs text-gray-400">ไม่ระบุ</span>
          </div>
        );
      }

      return (
        <div className="flex justify-center items-center min-w-[120px]">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Home className="h-3 w-3 text-gray-500" />
              <span className="text-sm font-medium">
                {/* แสดงแค่ชื่อบ้าน ไม่แสดง ID */}
                {houseData?.address ||
                  houseData?.name ||
                  (houseId === "st393sf218f361f" && "Office") ||
                  (houseId === "x2ya432jpgeluxl" && "James home") ||
                  (houseId === "3r0sy967yth90f6" && "103/99") ||
                  "บ้าน"}
              </span>
            </div>
          </div>
        </div>
      );
    },
    enableSorting: true,
  }),

  // 3. พื้นที่อนุญาต
  columnHelper.accessor("authorized_area", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="พื้นที่อนุญาต" />
      </div>
    ),
    cell: (info) => {
      const authorizedAreas = info.getValue();
      const rowData = info.row.original;
      const areaData = rowData.expand?.authorized_area;

      if (!authorizedAreas || authorizedAreas.length === 0) {
        return (
          <div className="flex justify-center items-center">
            <span className="text-xs text-gray-400">ไม่ระบุ</span>
          </div>
        );
      }

      return (
        <div className="flex justify-center items-center min-w-[120px]">
          <div className="text-center">
            <Badge variant="outline" className="gap-1 mb-1">
              <MapPin className="h-3 w-3" />
              {authorizedAreas.length} พื้นที่
            </Badge>
            {areaData && areaData.length > 0 && (
              <div className="text-xs text-gray-500 max-w-[100px] truncate">
                {areaData
                  .slice(0, 2)
                  .map((area: any) => area.name)
                  .join(", ")}
                {areaData.length > 2 && ` +${areaData.length - 2}`}
              </div>
            )}
          </div>
        </div>
      );
    },
    enableSorting: true,
  }),

  // 4. เวลาเริ่มต้น
  columnHelper.accessor("start_time", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="เวลาเริ่มต้น" />
      </div>
    ),
    cell: (info) => {
      const startTime = info.getValue();
      if (!startTime) return <div className="text-center text-gray-400">-</div>;

      const isPending = new Date(startTime) > new Date();

      return (
        <div className="flex justify-center items-center">
          <div className="text-center">
            <div
              className={`text-sm ${isPending ? "text-yellow-600 font-medium" : ""}`}>
              {formatInTimeZone(new Date(startTime), TimeZone, "dd MMM yyyy")}
            </div>
            <div className="text-xs text-gray-500">
              {formatInTimeZone(new Date(startTime), TimeZone, "HH:mm")}
            </div>
          </div>
        </div>
      );
    },
  }),

  // 5. เวลาสิ้นสุด
  columnHelper.accessor("expire_time", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="เวลาสิ้นสุด" />
      </div>
    ),
    cell: (info) => {
      const expireTime = info.getValue();
      if (!expireTime)
        return <div className="text-center text-gray-400">-</div>;

      const isExpired = new Date(expireTime) < new Date();
      const isExpiringSoon =
        !isExpired &&
        new Date(expireTime).getTime() - new Date().getTime() <
          24 * 60 * 60 * 1000;

      return (
        <div className="flex justify-center items-center">
          <div className="text-center">
            <div
              className={`text-sm ${isExpired ? "text-red-600 font-medium" : isExpiringSoon ? "text-orange-600 font-medium" : ""}`}>
              {formatInTimeZone(new Date(expireTime), TimeZone, "dd MMM yyyy")}
            </div>
            <div className="text-xs text-gray-500">
              {formatInTimeZone(new Date(expireTime), TimeZone, "HH:mm")}
            </div>
          </div>
        </div>
      );
    },
  }),

  // 6. ระยะเวลา
  columnHelper.display({
    id: "duration",
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="ระยะเวลา" />
      </div>
    ),
    cell: (info) => {
      const rowData = info.row.original;
      const duration = getInvitationDuration(
        rowData.start_time,
        rowData.expire_time
      );

      return (
        <div className="flex justify-center items-center">
          <div className="text-center">
            <div className="text-sm">{duration}</div>
          </div>
        </div>
      );
    },
  }),

  // 7. สถานะการใช้งาน (รวมสถานะทั้งหมด)
  columnHelper.display({
    id: "combined_status",
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="สถานะการใช้งาน" />
      </div>
    ),
    cell: (info) => {
      const rowData = info.row.original;
      const status = getInvitationDisplayStatus(rowData);
      const canUse = isInvitationActive(rowData);
      const isActive = rowData.active;

      return (
        <div className="flex justify-center items-center">
          <div className="text-center space-y-1">
            {/* สถานะหลัก */}
            <Badge variant="outline" className={`text-xs ${status.color}`}>
              {status.label}
            </Badge>

            {/* สถานะการใช้งาน */}
            <div>
              <Badge
                variant="outline"
                className={`gap-1 text-xs ${
                  isActive && canUse
                    ? "bg-green-50 text-green-700 border-green-200"
                    : "bg-gray-50 text-gray-700 border-gray-200"
                }`}>
                {isActive && canUse ? (
                  <CheckCircle className="h-3 w-3" />
                ) : (
                  <XCircle className="h-3 w-3" />
                )}
                {isActive && canUse ? "ใช้งานได้" : "ไม่สามารถใช้"}
              </Badge>
            </div>
          </div>
        </div>
      );
    },
    enableSorting: true,
  }),

  // 8. วันที่สร้าง
  columnHelper.accessor("created", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="วันที่สร้าง" />
      </div>
    ),
    cell: (info) => {
      const createdTime = new Date(info.getValue());
      return (
        <div className="flex justify-center items-center">
          <div className="text-center">
            <div className="text-sm">
              {formatInTimeZone(createdTime, TimeZone, "dd MMM yyyy")}
            </div>
            <div className="text-xs text-gray-500">
              {formatInTimeZone(createdTime, TimeZone, "HH:mm")}
            </div>
          </div>
        </div>
      );
    },
  }),

  // ลบคอลัมน์ "ผู้สร้าง" และ "หมายเหตุ" ออก
];
