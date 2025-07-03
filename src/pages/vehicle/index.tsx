// src/pages/vehicle/index.tsx
"use client";

import { useEffect, useState } from "react";

import DataTableBody from "./components/data-table-body";
import DataTableToolbar from "./components/data-table-toolbar";
import DataTablePagination from "./components/data-table-pagination";
import { CreateVehicleDrawer } from "./components/create-vehicle-dialog";

import { Checkbox } from "@/components/ui/checkbox";
import { Toaster } from "@/components/ui/sonner";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  getSortedRowModel,
  type PaginationState,
  RowSelectionState,
} from "@tanstack/react-table";
import DataTableColumnHeader from "./components/data-table-column-header";
import DataTableActionButton from "./components/data-table-action-button";
import { columns } from "./components/columns";
import {
  useVehicleAllListQuery,
  useBulkDeleteVehicleMutation,
} from "@/react-query/manage/vehicle";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { vehicleItem } from "@/api/vehicle/vehicle";
import { Button } from "@/components/ui/button";
import React from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { toast } from "sonner";
import { Trash2 } from "lucide-react";

export default function Vehicles() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const { data, refetch, isLoading } = useVehicleAllListQuery();
  const { mutateAsync: bulkDeleteVehicle, isPending: isDeleting } =
    useBulkDeleteVehicleMutation();

  const handleDeleteById = async () => {
    console.log("handleDeleteById");
    await refetch();
  };

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Handle bulk delete with mutation
  const handleBulkDelete = async () => {
    if (!rowSelection || Object.keys(rowSelection).length === 0) {
      toast.error("กรุณาเลือกรายการที่ต้องการลบ");
      return;
    }

    setShowBulkDeleteDialog(false);

    try {
      const selectedIds = Object.keys(rowSelection);
      console.log("Deleting vehicles with IDs:", selectedIds);

      await bulkDeleteVehicle(selectedIds);

      // Clear selection and refresh data
      setRowSelection({});
      await refetch();
    } catch (error) {
      // Error handling is done in the mutation
      console.error("Bulk delete failed:", error);
    }
  };

  const handleBulkDeleteClick = () => {
    const selectedCount = Object.keys(rowSelection).length;
    if (selectedCount === 0) {
      toast.warning("กรุณาเลือกรายการที่ต้องการลบ");
      return;
    }
    setShowBulkDeleteDialog(true);
  };

  const table = useReactTable({
    initialState: {
      columnVisibility: {
        id: false,
      },
    },
    data: data ?? [],
    columns: [
      {
        id: "select",
        header: ({ table }) => (
          <div className="min-w-[40px]">
            <Checkbox
              className="ml-4"
              checked={
                table.getIsAllPageRowsSelected() ||
                (table.getIsSomePageRowsSelected() && "indeterminate")
              }
              onCheckedChange={(value) => {
                table.toggleAllRowsSelected(!!value);
              }}
              aria-label="Select all"
            />
          </div>
        ),
        cell: ({ row }) => (
          <div className="min-w-[40px]">
            <Checkbox
              className="ml-4"
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
            <DataTableColumnHeader title={"การดำเนินการ"} />
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
    getRowId: (row) => row.id,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    onPaginationChange: setPagination,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    debugTable: false,
    autoResetPageIndex: false,
    state: {
      pagination,
      rowSelection,
    },
  });

  return (
    <div className="w-full pl-10 pr-10">
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <CardTitle className="font-anuphan font-light text-2xl tracking-wider">
            จัดการข้อมูลยานพาหนะ
          </CardTitle>
          <CreateVehicleDrawer onVehicleCreated={refetch} />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            จัดการข้อมูลยานพาหนะทั้งหมดในระบบ เพิ่ม แก้ไข หรือลบข้อมูลยานพาหนะ
          </p>
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

        <DataTablePagination
          table={table}
          totalRows={data?.length || 0}
          pgState={pagination}
        />
      </div>

      {/* Floating Selection Bar */}
      {Object.keys(rowSelection).length > 0 && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-card border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
            <span className="text-sm font-medium">
              เลือกแล้ว {Object.keys(rowSelection).length} รายการ
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRowSelection({})}
              className="h-8">
              รีเซ็ต
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleBulkDeleteClick}
              className="h-8">
              <Trash2 className="h-3 w-3 mr-1" />
              {isDeleting ? "กำลังลบ..." : "ลบที่เลือก"}
            </Button>
          </div>
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog
        open={showBulkDeleteDialog}
        onOpenChange={setShowBulkDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบหลายรายการ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบยานพาหนะ {Object.keys(rowSelection).length}{" "}
              คัน?
              <br />
              การดำเนินการนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowBulkDeleteDialog(false)}
              disabled={isDeleting}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              disabled={isDeleting}
              className="bg-destructive text-white hover:bg-destructive/90">
              {isDeleting
                ? "กำลังลบ..."
                : `ลบ ${Object.keys(rowSelection).length} รายการ`}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      <Toaster />
    </div>
  );
}