// src/pages/vehicle-access/components/columns.tsx
import { createColumnHelper } from "@tanstack/react-table";
import { formatInTimeZone } from "date-fns-tz";
import { Badge } from "@/components/ui/badge";
import { CheckCircle, XCircle, Eye, Camera } from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PassageLogItem } from "@/api/vehicle_access/vehicle_access";
import {
  getTierInfo,
  getGateStateInfo,
  getAreaName,
  formatThaiDateTime,
} from "@/utils/vehicleAccessUtils";

const TimeZone = "Asia/Bangkok";
const columnHelper = createColumnHelper<PassageLogItem>();

// Helper component for viewing snapshots
const SnapshotViewer = ({
  fullSnapshot,
  lpSnapshot,
}: {
  fullSnapshot?: string;
  lpSnapshot?: string;
}) => {
  const handleViewSnapshot = (type: "full" | "lp") => {
    const snapshot = type === "full" ? fullSnapshot : lpSnapshot;
    if (snapshot) {
      // ในที่นี้อาจจะต้องสร้าง URL สำหรับดูรูปภาพ
      // หรือเปิด modal แสดงรูปภาพ
      console.log(`View ${type} snapshot:`, snapshot);
      // TODO: Implement image viewer modal
    }
  };

  return (
    <div className="flex gap-1">
      {fullSnapshot && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => handleViewSnapshot("full")}
          title="ดูรูปภาพเต็ม">
          <Camera className="h-3 w-3" />
        </Button>
      )}
      {lpSnapshot && (
        <Button
          variant="ghost"
          size="sm"
          className="h-6 w-6 p-0"
          onClick={() => handleViewSnapshot("lp")}
          title="ดูรูปป้ายทะเบียน">
          <Eye className="h-3 w-3" />
        </Button>
      )}
    </div>
  );
};

export const columns = [
  columnHelper.accessor("id", {
    cell: (info) => info.getValue(),
    enableHiding: false,
  }),

  // วันที่เวลา
  columnHelper.accessor("created", {
    header: () => <div className="text-center">วันที่เวลา</div>,
    cell: (info) => {
      const createdTime = new Date(info.getValue());
      return (
        <div className="text-center min-w-[140px]">
          <div className="text-sm font-medium">
            {formatInTimeZone(createdTime, TimeZone, "dd MMM yyyy")}
          </div>
          <div className="text-xs text-gray-500">
            {formatInTimeZone(createdTime, TimeZone, "HH:mm:ss")}
          </div>
        </div>
      );
    },
    enableSorting: true,
  }),

  // ป้ายทะเบียน
  columnHelper.accessor("license_plate", {
    header: () => <div className="text-center">ป้ายทะเบียน</div>,
    cell: (info) => {
      return (
        <div className="text-center min-w-[120px] font-semibold">
          {info.getValue()}
        </div>
      );
    },
    enableHiding: true,
  }),

  // ผลการเข้าออก
  columnHelper.accessor("isSuccess", {
    header: () => <div className="text-center">ผลการเข้าออก</div>,
    cell: (info) => {
      const isSuccess = info.getValue();
      return (
        <div className="flex justify-center items-center">
          <Badge
            variant={isSuccess ? "default" : "destructive"}
            className="gap-1">
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

  // ประเภทยานพาหนะ
  columnHelper.accessor("tier", {
    header: () => <div className="text-center">ประเภทยานพาหนะ</div>,
    cell: (info) => {
      const tier = info.getValue();
      const tierInfo = getTierInfo(tier);

      return (
        <div className="flex justify-center items-center">
          <Badge variant="outline" className={tierInfo.color}>
            {tierInfo.label}
          </Badge>
        </div>
      );
    },
    enableSorting: true,
  }),

  // จังหวัด
  columnHelper.accessor("area_code", {
    header: () => <div className="text-center">จังหวัด</div>,
    cell: (info) => {
      const areaCode = info.getValue();
      const areaName = getAreaName(areaCode);

      return (
        <div className="text-center min-w-[100px]">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {areaName}
          </span>
        </div>
      );
    },
  }),

  // สถานะประตู
  columnHelper.accessor("gate_state", {
    header: () => <div className="text-center">สถานะประตู</div>,
    cell: (info) => {
      const gateState = info.getValue();
      const gateStateInfo = getGateStateInfo(gateState);

      return (
        <div className="flex justify-center items-center">
          <Badge variant="outline" className={gateStateInfo.color}>
            {gateStateInfo.label}
          </Badge>
        </div>
      );
    },
    enableSorting: true,
  }),

  // บ้าน
  columnHelper.accessor("house_id", {
    header: () => <div className="text-center">บ้าน</div>,
    cell: (info) => {
      const houseId = info.getValue();
      const rowData = info.row.original;
      const houseData = rowData.expand?.house_id;

      if (!houseId) {
        return (
          <div className="text-center">
            <span className="text-xs text-gray-400">ไม่ระบุ</span>
          </div>
        );
      }

      return (
        <div className="text-center min-w-[100px]">
          {houseData ? (
            <div className="text-sm font-medium">
              {houseData.address || houseData.house_number || "บ้าน"}
            </div>
          ) : (
            <span className="text-sm text-gray-500">บ้าน</span>
          )}
        </div>
      );
    },
    enableSorting: true,
  }),

  // รีดเดอร์/ประตู
  columnHelper.accessor("reader", {
    header: () => <div className="text-center">รีดเดอร์/ประตู</div>,
    cell: (info) => {
      const rowData = info.row.original;
      const readerData = rowData.expand?.reader;
      const gateData = rowData.expand?.gate;

      return (
        <div className="text-center min-w-[100px]">
          <div className="text-xs space-y-1">
            {readerData && (
              <div className="text-gray-600">
                R: {readerData.name || rowData.reader}
              </div>
            )}
            {gateData && (
              <div className="text-gray-600">
                G: {gateData.name || rowData.gate}
              </div>
            )}
            {!readerData && !gateData && (
              <span className="text-gray-400">ไม่ระบุ</span>
            )}
          </div>
        </div>
      );
    },
  }),

  // รูปภาพ
  columnHelper.accessor("full_snapshot", {
    header: () => <div className="text-center">รูปภาพ</div>,
    cell: (info) => {
      const rowData = info.row.original;
      return (
        <div className="flex justify-center items-center">
          <SnapshotViewer
            fullSnapshot={rowData.full_snapshot}
            lpSnapshot={rowData.lp_snapshot}
          />
        </div>
      );
    },
    enableSorting: false,
  }),

  // หมายเหตุ
  columnHelper.accessor("note", {
    header: () => <div className="text-center">หมายเหตุ</div>,
    cell: (info) => {
      const note = info.getValue();
      if (!note) {
        return (
          <div className="text-center">
            <span className="text-xs text-gray-400">-</span>
          </div>
        );
      }

      return (
        <div className="text-center min-w-[100px] max-w-[200px]">
          <span className="text-xs text-gray-600 truncate" title={note}>
            {note}
          </span>
        </div>
      );
    },
  }),
];
