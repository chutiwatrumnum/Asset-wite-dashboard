// src/pages/vehicle/index.tsx
"use client";

import { useEffect, useState } from "react";

import DataTableBody from "./components/data-table-body";
import DataTablePagination from "./components/data-table-pagination";
import { CreateVehicleDrawer } from "./components/create-vehicle-dialog";
import { VehicleSearch } from "@/components/ui/vehicle-search";

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
import { Trash2, LucideSettings2, Download, TrendingUp } from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { searchVehicles, getVehicleDisplayStatus } from "@/utils/vehicleUtils";

export default function Vehicles() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // state สำหรับการกรองข้อมูล
  const [searchFilters, setSearchFilters] = useState<{
    licensePlate?: string;
    tier?: string;
    areaCode?: string;
    status?: string;
  }>({});

  const { data, refetch, isLoading } = useVehicleAllListQuery();
  const { mutateAsync: bulkDeleteVehicle, isPending: isDeleting } =
    useBulkDeleteVehicleMutation();

  // ฟังก์ชันกรองข้อมูลตาม filters โดยใช้ utility function
  const filteredData = React.useMemo(() => {
    if (!data) return [];
    return searchVehicles(data, searchFilters);
  }, [data, searchFilters]);

  // Calculate statistics
  const stats = React.useMemo(() => {
    if (!data) return { total: 0, active: 0, expired: 0, expiring: 0 };

    const result = { total: data.length, active: 0, expired: 0, expiring: 0 };

    data.forEach((vehicle) => {
      const status = getVehicleDisplayStatus(vehicle);
      switch (status.status) {
        case "active":
          result.active++;
          break;
        case "expired":
        case "blocked":
          result.expired++;
          break;
        case "expiring":
          result.expiring++;
          break;
      }
    });

    return result;
  }, [data]);

  const handleDeleteById = async () => {
    console.log("handleDeleteById");
    await refetch();
  };

  useEffect(() => {
    refetch();
  }, [refetch]);

  // Handle search filters
  const handleSearch = (filters: {
    licensePlate?: string;
    tier?: string;
    areaCode?: string;
    status?: string;
  }) => {
    setSearchFilters(filters);
    // รีเซ็ตไปหน้าแรกเมื่อค้นหา
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    // Clear row selection when search changes
    setRowSelection({});
  };

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

  // Export function
  const handleExport = () => {
    const dataToExport = filteredData;
    const csvContent = [
      [
        "ป้ายทะเบียน",
        "จังหวัด",
        "ระดับ",
        "วันที่เริ่ม",
        "วันหมดอายุ",
        "บ้าน",
        "สถานะ",
        "หมายเหตุ",
      ],
      ...dataToExport.map((vehicle) => [
        vehicle.license_plate,
        vehicle.area_code,
        vehicle.tier,
        vehicle.start_time || "",
        vehicle.expire_time || "",
        vehicle.house_id || "",
        getVehicleDisplayStatus(vehicle).label,
        vehicle.note || "",
      ]),
    ]
      .map((row) => row.map((cell) => `"${cell}"`).join(","))
      .join("\n");

    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `vehicles_${new Date().toISOString().split("T")[0]}.csv`;
    link.click();
  };

  const table = useReactTable({
    initialState: {
      columnVisibility: {
        id: false,
      },
    },
    data: filteredData ?? [],
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

  const hasActiveFilters = Object.keys(searchFilters).some(
    (key) => searchFilters[key as keyof typeof searchFilters]
  );

  return (
    <div className="w-full pl-10 pr-10">
      {/* Header Card */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div>
            <CardTitle className="font-anuphan font-light text-2xl tracking-wider">
              จัดการข้อมูลยานพาหนะ
            </CardTitle>
            <p className="text-muted-foreground mt-1">
              จัดการข้อมูลยานพาหนะทั้งหมดในระบบ เพิ่ม แก้ไข หรือลบข้อมูลยานพาหนะ
            </p>
          </div>
          <CreateVehicleDrawer onVehicleCreated={refetch} />
        </CardHeader>

        {/* Statistics */}
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">ทั้งหมด</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.total}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-blue-500" />
              </div>
            </div>

            <div className="bg-green-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-green-600 text-sm font-medium">
                    ใช้งานได้
                  </p>
                  <p className="text-2xl font-bold text-green-900">
                    {stats.active}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">
                    ใกล้หมดอายุ
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {stats.expiring}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">
                    หมดอายุ/ระงับ
                  </p>
                  <p className="text-2xl font-bold text-red-900">
                    {stats.expired}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Component */}
      <div className="mb-6">
        <VehicleSearch onSearch={handleSearch} />
      </div>

      {/* Search Results Summary */}
      {hasActiveFilters && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            <span className="font-medium">ผลการค้นหา:</span>
            <span className="ml-2">
              พบ {filteredData.length} รายการ จากทั้งหมด {data?.length || 0}{" "}
              รายการ
            </span>
            {searchFilters.licensePlate && (
              <span className="ml-2">
                • ป้ายทะเบียน: {searchFilters.licensePlate}
              </span>
            )}
            {searchFilters.tier && (
              <span className="ml-2">• ระดับ: {searchFilters.tier}</span>
            )}
            {searchFilters.areaCode && (
              <span className="ml-2">• จังหวัด: {searchFilters.areaCode}</span>
            )}
            {searchFilters.status && (
              <span className="ml-2">• สถานะ: {searchFilters.status}</span>
            )}
          </div>
        </div>
      )}

      <div className="rounded-md border">
        {/* Enhanced Toolbar */}
        <div className="flex items-center justify-between py-4 mb-2 px-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              แสดง {filteredData.length} รายการ
              {Object.keys(rowSelection).length > 0 && (
                <span className="ml-2 text-blue-600">
                  (เลือก {Object.keys(rowSelection).length} รายการ)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Button */}
            <Button
              variant="outline"
              size="sm"
              onClick={handleExport}
              disabled={filteredData.length === 0}
              className="gap-2">
              <Download className="h-4 w-4" />
              ส่งออก CSV
            </Button>

            {/* Column Management */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <LucideSettings2 className="h-4 w-4" />
                  จัดการคอลัมน์
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) =>
                          column.toggleVisibility(value)
                        }>
                        {column.id.replace("_", " ")}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>

        {/* Data Table */}
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
          totalRows={filteredData?.length || 0}
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
