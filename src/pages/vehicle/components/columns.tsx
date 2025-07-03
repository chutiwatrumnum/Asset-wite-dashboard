// 1. src/pages/vehicle/components/columns.tsx
import { createColumnHelper } from "@tanstack/react-table";
import { formatInTimeZone } from "date-fns-tz";
import DataTableColumnHeader from "./data-table-column-header";
import { vehicleItem } from "@/api/vehicle/vehicle";

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
      const provinceMap: { [key: string]: string } = {
        "th-10": "กรุงเทพฯ",
        "th-11": "สมุทรปราการ",
        "th-12": "นนทบุรี",
        "th-13": "ปทุมธานี",
        "th-14": "พระนครศรีอยุธยา",
        "th-15": "อ่างทอง",
        "th-16": "ลพบุรี",
        "th-17": "สิงห์บุรี",
        "th-18": "ชัยนาท",
        "th-19": "สระบุรี",
        "th-20": "นครนายก",
        "th-21": "สระแก้ว",
        "th-22": "ปราจีนบุรี",
        "th-23": "ฉะเชิงเทรา",
        "th-24": "ชลบุรี",
        "th-25": "ระยอง",
        "th-26": "จันทบุรี",
        "th-27": "ตราด",
      };

      return (
        <div className="flex justify-center items-center">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {provinceMap[areaCode] || areaCode}
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor("tier", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="ระดับ" />
      </div>
    ),
    cell: (info) => {
      const tier = info.getValue();
      const tierMap: { [key: string]: { label: string; color: string } } = {
        resident: { label: "ลูกบ้าน", color: "bg-blue-100 text-blue-800" },
        staff: { label: "เจ้าหน้าที่", color: "bg-green-100 text-green-800" },
        invited: { label: "แขก", color: "bg-yellow-100 text-yellow-800" },
        unknown: { label: "ไม่ทราบ", color: "bg-gray-100 text-gray-800" },
        blacklisted: { label: "บัญชีดำ", color: "bg-red-100 text-red-800" },
      };

      const tierInfo = tierMap[tier] || tierMap.unknown;

      return (
        <div className="flex justify-center items-center">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${tierInfo.color}`}>
            {tierInfo.label}
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor("house_id", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="บ้าน" />
      </div>
    ),
    cell: (info) => (
      <div className="flex justify-center items-center">
        <span className="text-xs">{info.getValue() || "ไม่ระบุ"}</span>
      </div>
    ),
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

      const isExpired = new Date(expireTime) < new Date();

      return (
        <div className="flex justify-center items-center">
          <span className={isExpired ? "text-red-600 font-medium" : ""}>
            {formatInTimeZone(new Date(expireTime), TimeZone, "dd MMM yyyy")}
          </span>
        </div>
      );
    },
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
