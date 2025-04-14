import { useEffect, useState } from "react";

import DataTableBody from "@/pages/saff/components/data-table-body.tsx";
import DataTableToolbar from "@/pages/saff/components/data-table-toolbar.tsx";
import DataTablePagination from "@/pages/saff/components/data-table-pagination.tsx";

import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import { getCoreRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable, getSortedRowModel, PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/pages/saff/components/data-table-column-header.tsx";
import DataTableActionButton from "@/pages/saff/components/data-table-action-button.tsx";
import { columns } from "@/pages/saff/components/columns.tsx";
import { useSaffListQuery } from "@/react-query/manage/auth";
import { Button } from "@/components/ui/button";
import { UserRoundPlus } from "lucide-react";

export default function Saff() {
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const { data, refetch } = useSaffListQuery({ page: pagination.pageIndex + 1, perPage: pagination.pageSize });

    // Somewhere in useEffect or a button click
    useEffect(() => {
        refetch();
    },[]);

    const table = useReactTable({
        initialState: {
            columnVisibility: {
                id: false,
                house_id: false,
            },
        },
        data: data?.items ?? [],
        columns: [
            {
                id: "select",
                header: ({ table }) => (
                    <div className="min-w-[40px]">
                        <Checkbox className={"ml-4"} checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")} onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)} aria-label="Select all" />
                    </div>
                ),
                cell: ({ row }) => (
                    <div className="min-w-[40px]">
                        <Checkbox className={"ml-4"} checked={row.getIsSelected()} onCheckedChange={(value) => row.toggleSelected(!!value)} aria-label="Select row" />
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
                        <DataTableColumnHeader title={"action"} />
                    </div>
                ),
                cell: (info) => (
                    <div className="flex justify-center items-center">
                        <DataTableActionButton info={info.cell} />
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
            <div className="font-anuphan font-light text-2xl tracking-wider mt-4 mb-2">saff</div>
            <div className="font-anuphan font-light text-2xl tracking-wider mt-4 mb-2">
                {" "}
                <Button variant="outline" size="icon">
                    <UserRoundPlus />
                </Button>
            </div>
            <DataTableToolbar table={table} />
            <DataTableBody table={table} />
            <DataTablePagination table={table} totalRows={data?.totalItems || 0} pgState={pagination} />
            <Toaster />
        </div>
    );
}
