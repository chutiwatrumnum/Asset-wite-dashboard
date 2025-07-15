// src/pages/vehicle_access/components/columns.tsx
import { createColumnHelper } from "@tanstack/react-table";
import { formatInTimeZone } from "date-fns-tz";
import DataTableColumnHeader from "./data-table-column-header";
import { VehicleAccessItem } from "@/api/vehicle_access/vehicle_access";
import { Badge } from "@/components/ui/badge";
import {
  getTierInfo,
  getGateStateInfo,
  getRegionName,
  parseSnapshotInfo,
  formatThaiDateTime,
} from "@/utils/vehicleAccessUtils";
import {
  Car,
  MapPin,
  Camera,
  CheckCircle,
  XCircle,
  Shield,
  Calendar,
  Zap,
  Eye,
  Home,
} from "lucide-react";

const TimeZone = "Asia/Bangkok";
const columnHelper = createColumnHelper<VehicleAccessItem>();

export const columns = [
  // Hidden ID column for selection
  columnHelper.accessor("id", {
    cell: (info) => info.getValue(),
    enableHiding: false,
  }),

  // 1. ป้ายทะเบียน
  columnHelper.accessor("license_plate", {
    header: () => <DataTableColumnHeader title="ป้ายทะเบียน" />,
    cell: (info) => {
      const rowData = info.row.original;
      const regionName = getRegionName(rowData.area_code);

      return (
        <div className="min-w-[120px]">
          <div className="flex items-center gap-2">
            <Car className="h-4 w-4 text-blue-500" />
            <div>
              <div className="font-semibold">{info.getValue()}</div>
              <div className="text-xs text-gray-500">{regionName}</div>
            </div>
          </div>
        </div>
      );
    },
    enableHiding: false,
  }),

  // 2. ประเภทยานพาหนะ
  columnHelper.accessor("tier", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="ประเภท" />
      </div>
    ),
    cell: (info) => {
      const tierInfo = getTierInfo(info.getValue());

      return (
        <div className="flex justify-center items-center min-w-[100px]">
          <Badge
            variant="outline"
            className={`text-xs ${tierInfo.color} gap-1`}>
            {tierInfo.label}
          </Badge>
        </div>
      );
    },
    enableSorting: true,
  }),

  // 3. สถานะการผ่าน
  columnHelper.accessor("isSuccess", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="สถานะ" />
      </div>
    ),
    cell: (info) => {
      const isSuccess = info.getValue();

      return (
        <div className="flex justify-center items-center">
          <Badge
            variant={isSuccess ? "default" : "destructive"}
            className="text-xs gap-1">
            {isSuccess ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {isSuccess ? "สำเร็จ" : "ล้มเหลว"}
          </Badge>
        </div>
      );
    },
    enableSorting: true,
  }),

  // 4. ประตูและเครื่องอ่าน
  columnHelper.accessor("gate", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="ประตู/เครื่องอ่าน" />
      </div>
    ),
    cell: (info) => {
      const rowData = info.row.original;
      const gateStateInfo = getGateStateInfo(rowData.gate_state);

      return (
        <div className="flex justify-center items-center min-w-[140px]">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Shield className="h-3 w-3 text-gray-500" />
              <span className="text-sm font-medium">{info.getValue()}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">
              Reader: {rowData.reader}
            </div>
            <Badge
              variant="outline"
              className={`text-xs mt-1 ${gateStateInfo.color}`}>
              {gateStateInfo.label}
            </Badge>
          </div>
        </div>
      );
    },
    enableSorting: true,
  }),

  // 5. รูปภาพ
  columnHelper.display({
    id: "snapshots",
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="รูปภาพ" />
      </div>
    ),
    cell: (info) => {
      const rowData = info.row.original;
      const hasFullSnapshot =
        rowData.full_snapshot && rowData.full_snapshot !== "";
      const hasLpSnapshot = rowData.lp_snapshot && rowData.lp_snapshot !== "";

      return (
        <div className="flex justify-center items-center min-w-[80px]">
          <div className="text-center">
            <div className="flex gap-1 justify-center">
              {hasFullSnapshot && (
                <Badge
                  variant="outline"
                  className="text-xs bg-purple-50 text-purple-700">
                  <Camera className="h-3 w-3 mr-1" />
                  Full
                </Badge>
              )}
              {hasLpSnapshot && (
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700">
                  <Car className="h-3 w-3 mr-1" />
                  LP
                </Badge>
              )}
            </div>
            {!hasFullSnapshot && !hasLpSnapshot && (
              <span className="text-xs text-gray-400">ไม่มีรูป</span>
            )}
          </div>
        </div>
      );
    },
  }),

  // 6. ข้อมูล AI Processing
  columnHelper.accessor("snapshot_info", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="AI Processing" />
      </div>
    ),
    cell: (info) => {
      const snapshotInfo = parseSnapshotInfo(info.getValue());

      if (!snapshotInfo) {
        return (
          <div className="flex justify-center items-center">
            <span className="text-xs text-gray-400">ไม่มีข้อมูล</span>
          </div>
        );
      }

      return (
        <div className="flex justify-center items-center min-w-[120px]">
          <div className="text-center">
            <div className="text-xs">
              <span className="font-medium">
                {(snapshotInfo.confidence * 100).toFixed(1)}%
              </span>
            </div>
            <div className="text-xs text-gray-500">
              {snapshotInfo.processing_time}s
            </div>
            <div className="text-xs text-gray-500">
              {snapshotInfo.camera_id}
            </div>
          </div>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: true,
  }),

  // 7. บ้านเกี่ยวข้อง
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
        <div className="flex justify-center items-center min-w-[100px]">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Home className="h-3 w-3 text-gray-500" />
              <span className="text-sm">
                {houseData?.address || houseData?.name || houseId}
              </span>
            </div>
          </div>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
  }),

  // 8. หมายเหตุ
  columnHelper.accessor("note", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="หมายเหตุ" />
      </div>
    ),
    cell: (info) => {
      const note = info.getValue();

      if (!note || note.trim() === "") {
        return (
          <div className="flex justify-center items-center">
            <span className="text-xs text-gray-400">-</span>
          </div>
        );
      }

      return (
        <div className="flex justify-center items-center min-w-[120px]">
          <div className="text-center">
            <span className="text-sm" title={note}>
              {note.length > 30 ? `${note.substring(0, 30)}...` : note}
            </span>
          </div>
        </div>
      );
    },
    enableSorting: false,
    enableHiding: true,
  }),

  // 9. วันที่บันทึก
  columnHelper.accessor("created", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="วันที่บันทึก" />
      </div>
    ),
    cell: (info) => {
      const createdTime = new Date(info.getValue());
      return (
        <div className="flex justify-center items-center min-w-[140px]">
          <div className="text-center">
            <div className="text-sm flex items-center gap-1 justify-center">
              <Calendar className="h-3 w-3 text-gray-500" />
              {formatInTimeZone(createdTime, TimeZone, "dd MMM yyyy")}
            </div>
            <div className="text-xs text-gray-500">
              {formatInTimeZone(createdTime, TimeZone, "HH:mm")}
            </div>
          </div>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
  }),
];
