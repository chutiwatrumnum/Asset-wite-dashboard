"use client";

import { useEffect, useState } from "react";

import DataTableBody from "@/pages/saff/components/data-table-body.tsx";
import DataTableToolbar from "@/pages/saff/components/data-table-toolbar.tsx";
import DataTablePagination from "@/pages/saff/components/data-table-pagination.tsx";
import { CreateSaffDrawer } from "@/pages/saff/components/create-saff-dialog.tsx";

import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import { getCoreRowModel, getFilteredRowModel, getPaginationRowModel, useReactTable, getSortedRowModel, type PaginationState } from "@tanstack/react-table";
import DataTableColumnHeader from "@/pages/saff/components/data-table-column-header.tsx";
import DataTableActionButton from "@/pages/saff/components/data-table-action-button.tsx";
import { columns } from "@/pages/saff/components/columns.tsx";
import { useSaffListQuery } from "@/react-query/manage/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { saffItem } from "@/api/auth/auth";
import { Button } from "@/components/ui/button";
import Pb from "@/api/pocketbase";

export default function Saff() {
    const [pagination, setPagination] = useState<PaginationState>({
        pageIndex: 0,
        pageSize: 10,
    });
    const { data, refetch, isLoading } = useSaffListQuery({
        page: pagination.pageIndex + 1,
        perPage: pagination.pageSize,
    });
    // const [handlerDelete, sethandlerDelete] = useState<boolean>(false)
    const handleDeleteById = async () => {
        console.log("handleDeleteById");
        await refetch();
    };

    useEffect(() => {
        refetch();
    }, [refetch]);

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
                        <Checkbox
                            className={"ml-4"}
                            checked={table.getIsAllPageRowsSelected() || (table.getIsSomePageRowsSelected() && "indeterminate")}
                            onCheckedChange={(value) => {
                                table.toggleAllPageRowsSelected(!!value);
                            }}
                            aria-label="Select all"
                        />
                        <Button
                            onClick={async () => {
                                console.log("table.getIsAllRowsSelected():", table.getIsAllRowsSelected());
                                if (table.getIsAllRowsSelected()) {
                                    const batch = Pb.createBatch();
                                    try {
                                        const dataAdmin = await Pb.collection("admin").getFullList<saffItem>({
                                            filter: `id!="${Pb.authStore.record?.id}"`,
                                        });
                                        await Promise.all(dataAdmin.map((data) => Pb.collection("admin").delete(data.id)));
                                        batch.collection("admin").delete("RECORD_ID");
                                        console.log("dataAdmin:", dataAdmin);
                                        const result = await batch.send()
                                        console.log("result:", result);
                                        alert("delete all item success.")
                                    } catch (err) {
                                        console.error("Error deleting records:", err);
                                        alert("delete all item failed.")
                                    }
                                }
                            }}
                        >
                            delete
                        </Button>
                    </div>
                ),
                cell: ({ row, table }) => (
                    <div className="min-w-[40px]">
                        <Checkbox
                            className={"ml-4"}
                            checked={row.getIsSelected()}
                            onCheckedChange={(value) => {
                                console.log("value:", value, table.getIsAllRowsSelected(), row.original.id);

                                row.toggleSelected(!!value);
                                //  row.getIsAllSubRowsSelected()
                            }}
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
            <Card className="mb-6">
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                    <CardTitle className="font-anuphan font-light text-2xl tracking-wider">จัดการข้อมูลพนักงาน</CardTitle>
                    <CreateSaffDrawer onSaffCreated={refetch} />
                </CardHeader>
                <CardContent>
                    <p className="text-muted-foreground">จัดการข้อมูลพนักงานทั้งหมดในระบบ เพิ่ม แก้ไข หรือลบข้อมูลพนักงาน</p>
                </CardContent>
            </Card>

            <div className="rounded-md border">
                <DataTableToolbar table={table} />

                {isLoading ? (
                    <div className="p-4 space-y-4">
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                        <Skeleton className="h-10 w-full" />
                    </div>
                ) : (
                    <DataTableBody table={table} />
                )}

                <DataTablePagination table={table} totalRows={data?.totalItems || 0} pgState={pagination} />
            </div>

            <Toaster />
        </div>
    );
}
