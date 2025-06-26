"use client";

import { useEffect, useState } from "react";

import DataTableBody from "@/pages/saff/components/data-table-body.tsx";
import DataTableToolbar from "@/pages/saff/components/data-table-toolbar.tsx";
import DataTablePagination from "@/pages/saff/components/data-table-pagination.tsx";
import { CreateSaffDrawer } from "@/pages/saff/components/create-saff-dialog.tsx";

import { Checkbox } from "@/components/ui/checkbox.tsx";
import { Toaster } from "@/components/ui/sonner.tsx";
import {
  getCoreRowModel,
  getFilteredRowModel,
  getPaginationRowModel,
  useReactTable,
  getSortedRowModel,
  type PaginationState,
  RowSelectionState,
} from "@tanstack/react-table";
import DataTableColumnHeader from "@/pages/saff/components/data-table-column-header.tsx";
import DataTableActionButton from "@/pages/saff/components/data-table-action-button.tsx";
import { columns } from "@/pages/saff/components/columns.tsx";
import {
  useSaffAllListQuery,
  useBulkDeleteSaffMutation,
} from "@/react-query/manage/auth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { saffItem } from "@/api/auth/auth";
import { Button } from "@/components/ui/button";
import Pb from "@/api/pocketbase";
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

export default function Saff() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  const { data, refetch, isLoading } = useSaffAllListQuery();
  const { mutateAsync: bulkDeleteStaff, isPending: isDeleting } =
    useBulkDeleteSaffMutation();

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
      console.log("Deleting staff with IDs:", selectedIds);

      await bulkDeleteStaff(selectedIds);

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
        house_id: false,
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
            จัดการข้อมูลพนักงาน
          </CardTitle>
          <CreateSaffDrawer onSaffCreated={refetch} />
        </CardHeader>
        <CardContent>
          <p className="text-muted-foreground">
            จัดการข้อมูลพนักงานทั้งหมดในระบบ เพิ่ม แก้ไข หรือลบข้อมูลพนักงาน
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
              Selected {Object.keys(rowSelection).length} records
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRowSelection({})}
              className="h-8">
              Reset
            </Button>
            <Button
              variant="destructive"
              size="sm"
              disabled={isDeleting}
              onClick={handleBulkDeleteClick}
              className="h-8">
              <Trash2 className="h-3 w-3 mr-1" />
              {isDeleting ? "กำลังลบ..." : "Delete selected"}
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
              คุณแน่ใจหรือไม่ที่จะลบพนักงาน {Object.keys(rowSelection).length}{" "}
              คน?
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
