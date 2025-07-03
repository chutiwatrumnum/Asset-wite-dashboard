import { createColumnHelper } from "@tanstack/react-table";
import { formatInTimeZone } from "date-fns-tz";
import DataTableColumnHeader from "./data-table-column-header";
import { vehicleItem } from "@/api/vehicle/vehicle";

const TimeZone = "Asia/Bangkok";
const columnHelper = createColumnHelper<vehicleItem>();

export const columns = [
  columnHelper.accessor("id", {
    cell: (info) => info.getValue(),
    enableHiding: false, // ป้องกันการซ่อน id
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
        <DataTableColumnHeader title="จังหวัด" />
      </div>
    ),
    cell: (info) => (
      <div className="flex justify-center items-center">
        <span className="text-xs bg-gray-100 px-2 py-1 rounded">
          {info.getValue()}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor("group", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="กลุ่ม" />
      </div>
    ),
    cell: (info) => {
      const group = info.getValue();
      const colorMap = {
        resident: "bg-blue-100 text-blue-800",
        staff: "bg-green-100 text-green-800",
        invited: "bg-yellow-100 text-yellow-800",
        unknown: "bg-gray-100 text-gray-800",
        blacklisted: "bg-red-100 text-red-800",
      };

      return (
        <div className="flex justify-center items-center">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${colorMap[group as keyof typeof colorMap] || colorMap.unknown}`}>
            {group}
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
