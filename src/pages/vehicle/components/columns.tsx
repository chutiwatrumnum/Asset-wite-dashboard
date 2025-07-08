// src/pages/vehicle/components/columns.tsx
import { createColumnHelper } from "@tanstack/react-table";
import { formatInTimeZone } from "date-fns-tz";
import DataTableColumnHeader from "./data-table-column-header";
import { vehicleItem } from "@/api/vehicle/vehicle";
import { VehicleStatusBadge } from "@/components/ui/vehicle-status-badge";
import { Badge } from "@/components/ui/badge";
import { getProvinceName, isVehicleExpired } from "@/utils/vehicleUtils";
import { CheckCircle, MapPin } from "lucide-react";

const TimeZone = "Asia/Bangkok";
const columnHelper = createColumnHelper<vehicleItem>();

export const columns = [
  columnHelper.accessor("id", {
    cell: (info) => info.getValue(),
    enableHiding: false,
  }),

  columnHelper.accessor("license_plate", {
    header: () => <DataTableColumnHeader title="ป้ายทะเบียน" />,
    cell: (info) => {
      return (
        <div className={"min-w-[120px] font-semibold"}>{info.getValue()}</div>
      );
    },
    enableHiding: true,
  }),

  columnHelper.accessor("area_code", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="รหัสพื้นที่" />
      </div>
    ),
    cell: (info) => {
      const areaCode = info.getValue();
      const provinceName = getProvinceName(areaCode);

      return (
        <div className="flex justify-center items-center">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {provinceName}
          </span>
        </div>
      );
    },
  }),

  columnHelper.accessor("tier", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="สถานะ" />
      </div>
    ),
    cell: (info) => {
      const rowData = info.row.original;

      return (
        <div className="flex justify-center items-center">
          <VehicleStatusBadge
            tier={rowData.tier}
            expireTime={rowData.expire_time}
          />
        </div>
      );
    },
  }),

  // บ้าน - แสดงชื่อแทนรหัส
  columnHelper.accessor("house_id", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="บ้าน" />
      </div>
    ),
    cell: (info) => {
      const houseId = info.getValue();
      const rowData = info.row.original;

      // ใช้ข้อมูลจาก expand หากมี
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
          {houseData ? (
            <div className="text-center">
              <div className="text-sm font-medium">
                {houseData.address || houseData.house_number || "บ้านไม่ระบุ"}
              </div>
              {houseData.area && (
                <div className="text-xs text-gray-500">{houseData.area}</div>
              )}
            </div>
          ) : (
            <span className="text-xs text-gray-500">
              รหัส: {houseId.substring(0, 8)}...
            </span>
          )}
        </div>
      );
    },
    enableSorting: true,
  }),

  // พื้นที่ที่ได้รับอนุญาต - เพิ่มใหม่
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

  columnHelper.accessor("start_time", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="วันที่เริ่ม" />
      </div>
    ),
    cell: (info) => {
      const startTime = info.getValue();
      if (!startTime) return <div className="text-center text-gray-400">-</div>;

      return (
        <div className="flex justify-center items-center">
          {formatInTimeZone(new Date(startTime), TimeZone, "dd MMM yyyy")}
        </div>
      );
    },
  }),

  columnHelper.accessor("expire_time", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="วันหมดอายุ" />
      </div>
    ),
    cell: (info) => {
      const expireTime = info.getValue();
      if (!expireTime)
        return <div className="text-center text-gray-400">-</div>;

      const expired = isVehicleExpired(expireTime);

      return (
        <div className="flex justify-center items-center">
          <span className={expired ? "text-red-600 font-medium" : ""}>
            {formatInTimeZone(new Date(expireTime), TimeZone, "dd MMM yyyy")}
          </span>
        </div>
      );
    },
  }),

  // การอนุมัติ - เพิ่มใหม่
  columnHelper.accessor("stamper", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="การอนุมัติ" />
      </div>
    ),
    cell: (info) => {
      const stamperId = info.getValue();
      const stamperData = info.row.original.expand?.stamper;
      const stampedTime = info.row.original.stamped_time;

      if (!stamperId) {
        return (
          <div className="flex justify-center items-center">
            <Badge variant="outline" className="bg-gray-50 text-gray-500">
              รออนุมัติ
            </Badge>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center gap-1 min-w-[100px]">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            อนุมัติแล้ว
          </Badge>

          {stamperData && (
            <div className="text-xs text-gray-500 text-center">
              {stamperData.first_name} {stamperData.last_name}
            </div>
          )}

          {stampedTime && (
            <div className="text-xs text-gray-400">
              {formatInTimeZone(new Date(stampedTime), TimeZone, "dd/MM/yy")}
            </div>
          )}
        </div>
      );
    },
    enableSorting: true,
  }),

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
          {formatInTimeZone(createdTime, TimeZone, "dd MMM yyyy")}
        </div>
      );
    },
  }),
];
