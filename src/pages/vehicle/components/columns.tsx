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
        <DataTableColumnHeader title="จังหวัด" />
      </div>
    ),
    cell: (info) => (
      <div className="flex justify-center items-center">
        <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
          {info.getValue().replace("th-", "")}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor("group", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="ประเภท" />
      </div>
    ),
    cell: (info) => {
      const group = info.getValue();
      const getGroupStyle = (group: string) => {
        switch (group) {
          case "resident":
            return "bg-green-100 text-green-800";
          case "staff":
            return "bg-blue-100 text-blue-800";
          case "invited":
            return "bg-yellow-100 text-yellow-800";
          case "unknown":
            return "bg-gray-100 text-gray-800";
          case "blacklisted":
            return "bg-red-100 text-red-800";
          default:
            return "bg-gray-100 text-gray-800";
        }
      };

      return (
        <div className="flex justify-center items-center">
          <span
            className={`px-2 py-1 rounded-full text-xs font-medium ${getGroupStyle(group)}`}>
            {group}
          </span>
        </div>
      );
    },
  }),
  columnHelper.accessor("start_time", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="เริ่มต้น" />
      </div>
    ),
    cell: (info) => {
      const startTime = new Date(info.getValue());
      return (
        <div className="flex justify-center items-center text-xs">
          {formatInTimeZone(startTime, TimeZone, "dd MMM yyyy HH:mm")}
        </div>
      );
    },
  }),
  columnHelper.accessor("expire_time", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="สิ้นสุด" />
      </div>
    ),
    cell: (info) => {
      const expireTime = new Date(info.getValue());
      const isExpired = expireTime < new Date();

      return (
        <div className="flex justify-center items-center text-xs">
          <span className={isExpired ? "text-red-600" : "text-green-600"}>
            {formatInTimeZone(expireTime, TimeZone, "dd MMM yyyy HH:mm")}
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
    cell: (info) => {
      const houseId = info.getValue();
      return (
        <div className="flex justify-center items-center">
          <span className="text-xs">{houseId ? houseId.slice(-8) : "-"}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("created", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="สร้างเมื่อ" />
      </div>
    ),
    cell: (info) => {
      const createdTime = new Date(info.getValue());
      return (
        <div className="flex justify-center items-center text-xs">
          {formatInTimeZone(createdTime, TimeZone, "dd MMM yyyy")}
        </div>
      );
    },
  }),
];
