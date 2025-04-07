import Pb from "@/api/pocketbase.tsx";
import { useState } from "react";

import DataTableBody from "@/pages/services/components/data-table-body.tsx";
import DataTableToolbar from "@/pages/services/components/data-table-toolbar.tsx";
import DataTablePagination from "@/pages/services/components/data-table-pagination.tsx";

import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  getSortedRowModel,
  PaginationState,
} from "@tanstack/react-table";
import DataTableColumnHeader from "@/pages/services/components/data-table-column-header.tsx";
import DataTableActionButton from "@/pages/services/components/data-table-action-button.tsx";
import { columns, TStaffInfo } from "@/pages/services/components/columns.tsx";

export default function DataTable() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  })

  const { data: totalRows } = useQuery({
    queryKey: ["admin", "total-rows"],
    queryFn: async () => {
      const result = await Pb.collection('admin').getList<TStaffInfo>(1, 1);
      return result.totalItems ?? 0;
    },
    placeholderData: keepPreviousData
  })

  const { data } = useQuery({
    queryKey: ["admin", pagination.pageIndex, pagination.pageSize],
    queryFn: async () => {
      const { pageIndex, pageSize } = pagination
      return await Pb.collection('admin').getList<TStaffInfo>(pageIndex + 1, pageSize, {
        sort: '+role',
        expand: 'house_id'
      });
    },
    placeholderData: keepPreviousData
  });

  const table = useReactTable({
    initialState: {
      columnVisibility: {
        id: false,
      },
    },
    data: data?.items ?? [],
    columns: [
      {
        id: "select",
        header: ({ table }) => (
          <div className="min-w-[40px]">
            <Checkbox
              className={"ml-4"}
              checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
              onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="min-w-[40px]">
            <Checkbox
              className={"ml-4"}
              checked={row.getIsSelected()}
              onCheckedChange={(value) => row.toggleSelected(!!value)}
              aria-label="Select row"
            />
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
      ...columns,
      {
        id: "action",
        header: () => (
          <div className="flex justify-center items-center">
            <DataTableColumnHeader title={"action"}/>
          </div>
        ),
        cell: (info) => (
          <div className="flex justify-center items-center">
            <DataTableActionButton info={info.cell}/>
          </div>
        ),
        enableSorting: false,
        enableHiding: false,
      },
    ],
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    debugTable: false,
    autoResetPageIndex: false,
    manualPagination: true,
    state: {
      pagination,
    },
  });

  return (
    <div className="w-full pl-10 pr-10">
      <div className="font-anuphan font-light text-2xl tracking-wider mt-4 mb-2">รายชื่อเจ้าหน้าที่</div>

      <DataTableToolbar table={table}/>
      <DataTableBody table={table} />
      <DataTablePagination
        table={table}
        totalRows={totalRows || 0}
        pgState={pagination}
      />
      <Toaster/>

    </div>
  );
}
