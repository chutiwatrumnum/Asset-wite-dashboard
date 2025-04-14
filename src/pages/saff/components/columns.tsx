import { createColumnHelper } from "@tanstack/react-table";
import { formatInTimeZone } from "date-fns-tz";
import DataTableColumnHeader from "@/pages/saff/components/data-table-column-header.tsx";
import { saffItem } from "@/api/auth/auth";

export type THouse = {
  house_id: {
    address: string;
    area_id: string;
  }
}

export type TStaffInfo = {
  id: number;
  first_name: string;
  last_name: string;
  email: string;
  role: string;
  house_id: string;
  expand: THouse;
  created: string;
}

const TimeZone = 'Asia/Bangkok';
const columnHelper = createColumnHelper<saffItem>();

export const columns = [
  columnHelper.accessor("id", {
    cell: (info) => info.getValue(),
  }),
  columnHelper.accessor('email', {
    header: () => (
      <DataTableColumnHeader title="email"/>
    ),
    cell: (info) => {
      return (
        <div className={"min-w-[160px]"}>
          {info.getValue()}
        </div>
      )
    },
  }),
  columnHelper.accessor('first_name', {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="first name"/>
      </div>
    ),
    cell: (info) => (
      <div className="flex justify-center items-center">
        <span>{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor('last_name', {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="last name"/>
      </div>
    ),
    cell: (info) => (
      <div className="flex justify-center items-center">
        <span>{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor('role', {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="role"/>
      </div>
    ),
    cell: (info) => (
      <div className="flex justify-center items-center">
        <span>{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor('house_id', {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="house"/>
      </div>
    ),
    cell: (info) => (
      <div className="flex justify-center items-center">
        <span>{info.getValue()}</span>
      </div>
    ),
  }),
  columnHelper.accessor('created', {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="created"/>
      </div>
    ),
    cell: (info) => {
      const createdTime = new Date(info.getValue())
      return (
        <div className="flex justify-center items-center">
          {formatInTimeZone(createdTime, TimeZone, 'dd MMM yyyy')}
        </div>
      )
    },
  }),
];
