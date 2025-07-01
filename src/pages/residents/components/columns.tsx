// src/pages/residents/components/columns.tsx
import { createColumnHelper } from "@tanstack/react-table";
import { formatInTimeZone } from "date-fns-tz";
import DataTableColumnHeader from "./data-table-column-header";
import { residentItem } from "@/api/resident/resident";

export type THouse = {
  house_id: {
    address: string;
    area_id: string;
  };
};

export type TResidentInfo = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  house_id: string | string[];
  expand: THouse;
  created: string;
};

const TimeZone = "Asia/Bangkok";
const columnHelper = createColumnHelper<residentItem>();

export const columns = [
  columnHelper.accessor("id", {
    cell: (info) => info.getValue(),
    enableHiding: false, // ป้องกันการซ่อน id
  }),
  columnHelper.accessor("email", {
    header: () => <DataTableColumnHeader title="email" />,
    cell: (info) => {
      return <div className={"min-w-[160px]"}>{info.getValue()}</div>;
    },
    enableHiding: true, // อนุญาตให้ซ่อน/แสดงได้
  }),
  columnHelper.accessor("first_name", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="first name" />
      </div>
    ),
    cell: (info) => (
      <div className="flex justify-center items-center">
        <span>{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor("last_name", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="last name" />
      </div>
    ),
    cell: (info) => (
      <div className="flex justify-center items-center">
        <span>{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor("role", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="role" />
      </div>
    ),
    cell: (info) => (
      <div className="flex justify-center items-center">
        <span
          className={`px-2 py-1 rounded-full text-xs font-medium ${
            info.getValue() === "primary"
              ? "bg-blue-100 text-blue-800"
              : "bg-green-100 text-green-800"
          }`}>
          {info.getValue()}
        </span>
      </div>
    ),
  }),
  columnHelper.accessor("house_id", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="houses" />
      </div>
    ),
    cell: (info) => {
      const houseId = info.getValue();
      const displayValue = Array.isArray(houseId)
        ? `${houseId.length} houses`
        : houseId;

      return (
        <div className="flex justify-center items-center">
          <span>{displayValue}</span>
        </div>
      );
    },
  }),
  columnHelper.accessor("created", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="created" />
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
