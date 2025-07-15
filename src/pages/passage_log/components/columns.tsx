// src/pages/passage-log/components/columns.tsx
import { createColumnHelper } from "@tanstack/react-table";
import { formatInTimeZone } from "date-fns-tz";
import DataTableColumnHeader from "../../vehicle/components/data-table-column-header";
import { PassageLogItem } from "@/api/passage_log/passage_log";
import { Badge } from "@/components/ui/badge";
import {
  getPassageDisplayStatus,
  getVerificationMethodDisplay,
  getPassageTypeDisplay,
  calculateDuration,
  isStillInside,
} from "@/utils/passageLogUtils";
import {
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Home,
  Shield,
  Calendar,
} from "lucide-react";

const TimeZone = "Asia/Bangkok";
const columnHelper = createColumnHelper<PassageLogItem>();

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

  // 2. ประเภทการผ่าน (เข้า/ออก)
  columnHelper.accessor("passage_type", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="ประเภท" />
      </div>
    ),
    cell: (info) => {
      const rowData = info.row.original;
      const passageType = getPassageTypeDisplay(rowData);
      const stillInside = isStillInside(rowData);

      return (
        <div className="flex justify-center items-center min-w-[80px]">
          <div className="text-center">
            <Badge
              variant="outline"
              className={`text-xs ${passageType.color} gap-1`}>
              <span>{passageType.icon}</span>
              {passageType.label}
            </Badge>
            {stillInside && (
              <div className="mt-1">
                <Badge
                  variant="outline"
                  className="text-xs bg-blue-50 text-blue-700 border-blue-200">
                  อยู่ในพื้นที่
                </Badge>
              </div>
            )}
          </div>
        </div>
      );
    },
    enableSorting: true,
  }),

  // 3. เวลาเข้า
  columnHelper.accessor("entry_time", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="เวลาเข้า" />
      </div>
    ),
    cell: (info) => {
      const entryTime = info.getValue();
      if (!entryTime) return <div className="text-center text-gray-400">-</div>;

      return (
        <div className="flex justify-center items-center">
          <div className="text-center">
            <div className="text-sm">
              {formatInTimeZone(new Date(entryTime), TimeZone, "dd MMM yyyy")}
            </div>
            <div className="text-xs text-gray-500">
              {formatInTimeZone(new Date(entryTime), TimeZone, "HH:mm")}
            </div>
          </div>
        </div>
      );
    },
  }),

  // 4. เวลาออก
  columnHelper.accessor("exit_time", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="เวลาออก" />
      </div>
    ),
    cell: (info) => {
      const exitTime = info.getValue();
      if (!exitTime) {
        return (
          <div className="flex justify-center items-center">
            <Badge
              variant="outline"
              className="text-xs bg-yellow-50 text-yellow-700 border-yellow-200">
              ยังไม่ออก
            </Badge>
          </div>
        );
      }

      return (
        <div className="flex justify-center items-center">
          <div className="text-center">
            <div className="text-sm">
              {formatInTimeZone(new Date(exitTime), TimeZone, "dd MMM yyyy")}
            </div>
            <div className="text-xs text-gray-500">
              {formatInTimeZone(new Date(exitTime), TimeZone, "HH:mm")}
            </div>
          </div>
        </div>
      );
    },
  }),

  // 5. ระยะเวลา
  columnHelper.display({
    id: "duration",
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="ระยะเวลา" />
      </div>
    ),
    cell: (info) => {
      const rowData = info.row.original;
      const duration = calculateDuration(rowData.entry_time, rowData.exit_time);

      return (
        <div className="flex justify-center items-center">
          <div className="text-center">
            <div className="text-sm flex items-center gap-1">
              <Clock className="h-3 w-3 text-gray-500" />
              {duration}
            </div>
          </div>
        </div>
      );
    },
  }),

  // 6. พื้นที่
  columnHelper.accessor("location_area", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="พื้นที่" />
      </div>
    ),
    cell: (info) => {
      const locationArea = info.getValue();
      const rowData = info.row.original;
      const areaName = rowData.expand?.location_area?.name || locationArea;

      return (
        <div className="flex justify-center items-center min-w-[120px]">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <MapPin className="h-3 w-3 text-gray-500" />
              <span className="text-sm">{areaName}</span>
            </div>
          </div>
        </div>
      );
    },
    enableSorting: true,
  }),

  // 7. วิธีการยืนยัน
  columnHelper.accessor("verification_method", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="วิธียืนยัน" />
      </div>
    ),
    cell: (info) => {
      const rowData = info.row.original;
      const verificationMethod = getVerificationMethodDisplay(rowData);

      return (
        <div className="flex justify-center items-center min-w-[120px]">
          <div className="text-center">
            <Badge
              variant="outline"
              className={`text-xs ${verificationMethod.color} gap-1`}>
              <span>{verificationMethod.icon}</span>
              {verificationMethod.label}
            </Badge>
            {rowData.verification_data && (
              <div className="text-xs text-gray-500 mt-1 max-w-[100px] truncate">
                {rowData.verification_data}
              </div>
            )}
          </div>
        </div>
      );
    },
    enableSorting: true,
  }),

  // 8. สถานะ
  columnHelper.accessor("status", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="สถานะ" />
      </div>
    ),
    cell: (info) => {
      const rowData = info.row.original;
      const status = getPassageDisplayStatus(rowData);

      return (
        <div className="flex justify-center items-center">
          <div className="text-center">
            <Badge
              variant="outline"
              className={`text-xs ${status.color} gap-1`}>
              {status.label === "สำเร็จ" ? (
                <CheckCircle className="h-3 w-3" />
              ) : status.label === "ล้มเหลว" ? (
                <XCircle className="h-3 w-3" />
              ) : (
                <Clock className="h-3 w-3" />
              )}
              {status.label}
            </Badge>
          </div>
        </div>
      );
    },
    enableSorting: true,
  }),

  // 9. บ้านเกี่ยวข้อง
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

  // 10. เจ้าหน้าที่ยืนยัน
  columnHelper.accessor("staff_verified_by", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="เจ้าหน้าที่" />
      </div>
    ),
    cell: (info) => {
      const staffId = info.getValue();
      const rowData = info.row.original;
      const staffData = rowData.expand?.staff_verified_by;

      if (!staffId) {
        return (
          <div className="flex justify-center items-center">
            <span className="text-xs text-gray-400">ระบบอัตโนมัติ</span>
          </div>
        );
      }

      const staffName = staffData
        ? `${staffData.first_name || ""} ${staffData.last_name || ""}`.trim()
        : staffId;

      return (
        <div className="flex justify-center items-center min-w-[100px]">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Shield className="h-3 w-3 text-gray-500" />
              <span className="text-sm">{staffName}</span>
            </div>
          </div>
        </div>
      );
    },
    enableSorting: true,
    enableHiding: true,
  }),

  // 11. วันที่บันทึก
  columnHelper.accessor("created", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="วันที่บันทึก" />
      </div>
    ),
    cell: (info) => {
      const createdTime = new Date(info.getValue());
      return (
        <div className="flex justify-center items-center">
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
    enableHiding: true,
  }),
];
