// src/pages/vehicle/index.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { useSearch } from "@tanstack/react-router";

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
  SortingState,
} from "@tanstack/react-table";
import DataTableColumnHeader from "./components/data-table-column-header";
import DataTableActionButton from "./components/data-table-action-button";
import { columns } from "./components/columns";
import {
  useVehicleAllListQuery,
  useBulkDeleteVehicleMutation,
  useExpiringVehiclesQuery,
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
import {
  Trash2,
  LucideSettings2,
  Download,
  TrendingUp,
  AlertTriangle,
  RefreshCw,
  FileSpreadsheet,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import {
  searchVehicles,
  getVehicleStatistics,
  prepareVehicleDataForExport,
  sortVehicles,
  VEHICLE_TIERS,
} from "@/utils/vehicleUtils";

interface VehicleSearchFilters {
  licensePlate?: string;
  tier?: string;
  areaCode?: string;
  status?: string;
  houseId?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export default function Vehicles() {
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "created", desc: true },
  ]);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [showBulkDeleteDialog, setShowBulkDeleteDialog] = useState(false);

  // Search and filter state
  const [searchFilters, setSearchFilters] = useState<VehicleSearchFilters>({});
  const [isExporting, setIsExporting] = useState(false);

  // React Query hooks
  const {
    data: allVehicles,
    refetch,
    isLoading,
    error,
    isFetching,
    isError,
  } = useVehicleAllListQuery();

  const {
    data: expiringVehicles,
    isLoading: isLoadingExpiring,
    error: expiringError,
  } = useExpiringVehiclesQuery(7);

  const { mutateAsync: bulkDeleteVehicle, isPending: isDeleting } =
    useBulkDeleteVehicleMutation();

  // Parse URL search params for initial filters
  const searchParams = useSearch({
    from: "/_authenticated/vehicles",
  });

  // Initialize filters from URL params
  useEffect(() => {
    const tierParam = searchParams.tier;
    if (tierParam) {
      // Handle single tier or comma-separated tiers
      const tiers =
        typeof tierParam === "string"
          ? tierParam
              .split(",")
              .filter((tier) => Object.keys(VEHICLE_TIERS).includes(tier))
          : Array.isArray(tierParam)
            ? tierParam.filter((tier) =>
                Object.keys(VEHICLE_TIERS).includes(tier)
              )
            : [];

      if (tiers.length === 1) {
        setSearchFilters((prev) => ({ ...prev, tier: tiers[0] }));
      }
    }
  }, [searchParams]);

  // Auto-retry on mount หากมี error
  useEffect(() => {
    if (isError && !isLoading && !isFetching) {
      console.log("Auto-retrying failed query...");
      setTimeout(() => {
        refetch();
      }, 1000);
    }
  }, [isError, isLoading, isFetching, refetch]);

  // Memoized filtered and sorted data
  const processedData = useMemo(() => {
    // ตรวจสอบว่ามีข้อมูลหรือไม่
    if (!allVehicles || allVehicles.length === 0) return [];

    try {
      // Apply search filters
      let filtered = searchVehicles(allVehicles, searchFilters);

      // Apply sorting if needed (table handles most sorting)
      if (sorting.length > 0) {
        const sort = sorting[0];
        filtered = sortVehicles(filtered, sort.id, sort.desc ? "desc" : "asc");
      }

      return filtered;
    } catch (error) {
      console.error("Error processing vehicle data:", error);
      return allVehicles; // fallback ให้ข้อมูลดิบ
    }
  }, [allVehicles, searchFilters, sorting]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!allVehicles || allVehicles.length === 0) {
      return {
        total: 0,
        active: 0,
        pending: 0,
        expiring: 0,
        expired: 0,
        blocked: 0,
      };
    }

    try {
      return getVehicleStatistics(allVehicles);
    } catch (error) {
      console.error("Error calculating statistics:", error);
      return {
        total: allVehicles.length,
        active: 0,
        pending: 0,
        expiring: 0,
        expired: 0,
        blocked: 0,
      };
    }
  }, [allVehicles]);

  // Handle search filters
  const handleSearch = (filters: VehicleSearchFilters) => {
    setSearchFilters(filters);
    // Reset to first page when search changes
    setPagination((prev) => ({ ...prev, pageIndex: 0 }));
    // Clear row selection when search changes
    setRowSelection({});
  };

  // Handle refresh
  const handleRefresh = async () => {
    try {
      // รีเซ็ต error state ก่อน
      await refetch();
      toast.success("รีเฟรชข้อมูลสำเร็จ");
    } catch (error) {
      console.error("Refresh error:", error);
      toast.error("ไม่สามารถรีเฟรชข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  // Handle bulk delete
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

  // Export functions
  const handleExportCSV = async () => {
    if (!processedData.length) {
      toast.warning("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }

    setIsExporting(true);
    try {
      const exportData = prepareVehicleDataForExport(processedData);

      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers.map((header) => `"${row[header] || ""}"`).join(",")
        ),
      ].join("\n");

      // Create and download file
      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `vehicles_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      toast.success(`ส่งออกข้อมูล ${exportData.length} รายการสำเร็จ`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    } finally {
      setIsExporting(false);
    }
  };

  const handleExportSelected = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (selectedIds.length === 0) {
      toast.warning("กรุณาเลือกรายการที่ต้องการส่งออก");
      return;
    }

    const selectedData = processedData.filter((item) =>
      selectedIds.includes(item.id)
    );

    setIsExporting(true);
    try {
      const exportData = prepareVehicleDataForExport(selectedData);

      const headers = Object.keys(exportData[0]);
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers.map((header) => `"${row[header] || ""}"`).join(",")
        ),
      ].join("\n");

      const blob = new Blob(["\ufeff" + csvContent], {
        type: "text/csv;charset=utf-8;",
      });
      const link = document.createElement("a");
      link.href = URL.createObjectURL(blob);
      link.download = `selected_vehicles_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      toast.success(`ส่งออกข้อมูลที่เลือก ${selectedData.length} รายการสำเร็จ`);
    } catch (error) {
      console.error("Export selected error:", error);
      toast.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    } finally {
      setIsExporting(false);
    }
  };

  // Table configuration
  const table = useReactTable({
    initialState: {
      columnVisibility: {
        id: false,
      },
    },
    data: processedData,
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
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    enableRowSelection: true,
    enableSorting: true,
    debugTable: false,
    autoResetPageIndex: false,
    state: {
      pagination,
      sorting,
      rowSelection,
    },
  });

  const hasActiveFilters = Object.keys(searchFilters).some((key) => {
    const value = searchFilters[key as keyof typeof searchFilters];
    if (key === "dateRange") {
      const dateRange = value as { start?: string; end?: string } | undefined;
      return dateRange && (dateRange.start || dateRange.end);
    }
    return value !== undefined && value !== null && value !== "";
  });

  // Show error state
  if (isError || error) {
    return (
      <div className="w-full pl-10 pr-10">
        <Card className="mb-6">
          <CardContent className="pt-6">
            <div className="text-center text-red-600">
              <AlertTriangle className="h-12 w-12 mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">เกิดข้อผิดพลาด</h3>
              <p className="text-sm text-gray-600 mb-4">
                {error?.message || "ไม่สามารถโหลดข้อมูลยานพาหนะได้"}
              </p>
              <div className="flex gap-2 justify-center">
                <Button
                  onClick={handleRefresh}
                  variant="outline"
                  disabled={isFetching}>
                  <RefreshCw
                    className={`h-4 w-4 mr-2 ${isFetching ? "animate-spin" : ""}`}
                  />
                  {isFetching ? "กำลังโหลด..." : "ลองใหม่"}
                </Button>
                <Button
                  onClick={() => window.location.reload()}
                  variant="default">
                  รีเฟรชหน้า
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full pl-10 pr-10">
      {/* Header Card with Statistics */}
      <Card className="mb-6">
        <CardHeader className="flex flex-row items-center justify-between pb-2">
          <div className="flex-1">
            <div className="flex items-center gap-4">
              <div>
                <CardTitle className="font-anuphan font-light text-2xl tracking-wider">
                  จัดการข้อมูลยานพาหนะ
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  จัดการข้อมูลยานพาหนะทั้งหมดในระบบ เพิ่ม แก้ไข
                  หรือลบข้อมูลยานพาหนะ
                </p>
              </div>

              {/* Expiring vehicles warning */}
              {!isLoadingExpiring &&
                !expiringError &&
                expiringVehicles &&
                expiringVehicles.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">
                        มียานพาหนะใกล้หมดอายุ
                      </p>
                      <p className="text-xs text-orange-600">
                        {expiringVehicles.length} คัน ภายใน 7 วัน
                      </p>
                    </div>
                  </div>
                )}
            </div>
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleRefresh}
              variant="outline"
              size="sm"
              disabled={isFetching}
              className="gap-2">
              <RefreshCw
                className={`h-4 w-4 ${isFetching ? "animate-spin" : ""}`}
              />
              รีเฟรช
            </Button>
            <CreateVehicleDrawer onVehicleCreated={refetch} />
          </div>
        </CardHeader>

        {/* Statistics */}
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-blue-600 text-sm font-medium">ทั้งหมด</p>
                  <p className="text-2xl font-bold text-blue-900">
                    {stats.total.toLocaleString()}
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
                    {stats.active.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-green-500" />
              </div>
            </div>

            <div className="bg-yellow-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-yellow-600 text-sm font-medium">
                    รอเริ่มใช้
                  </p>
                  <p className="text-2xl font-bold text-yellow-900">
                    {stats.pending.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-yellow-500" />
              </div>
            </div>

            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-orange-600 text-sm font-medium">
                    ใกล้หมดอายุ
                  </p>
                  <p className="text-2xl font-bold text-orange-900">
                    {stats.expiring.toLocaleString()}
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
                    {(stats.expired + stats.blocked).toLocaleString()}
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
        <VehicleSearch onSearch={handleSearch} defaultFilters={searchFilters} />
      </div>

      {/* Search Results Summary */}
      {hasActiveFilters && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            <span className="font-medium">ผลการค้นหา:</span>
            <span className="ml-2">
              พบ {processedData.length.toLocaleString()} รายการ จากทั้งหมด{" "}
              {allVehicles?.length.toLocaleString() || 0} รายการ
            </span>
          </div>
        </div>
      )}

      <div className="rounded-md border">
        {/* Enhanced Toolbar */}
        <div className="flex items-center justify-between py-4 mb-2 px-4">
          <div className="flex items-center gap-4">
            <div className="text-sm text-muted-foreground">
              แสดง {processedData.length.toLocaleString()} รายการ
              {Object.keys(rowSelection).length > 0 && (
                <span className="ml-2 text-blue-600">
                  (เลือก {Object.keys(rowSelection).length} รายการ)
                </span>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2">
            {/* Export Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={processedData.length === 0 || isExporting}
                  className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  ส่งออกข้อมูล
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>ส่งออกข้อมูล</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem
                  onClick={handleExportCSV}
                  disabled={isExporting}>
                  <Download className="h-4 w-4 mr-2" />
                  ส่งออกทั้งหมด ({processedData.length} รายการ)
                </DropdownMenuItem>
                <DropdownMenuItem
                  onClick={handleExportSelected}
                  disabled={
                    isExporting || Object.keys(rowSelection).length === 0
                  }>
                  <Download className="h-4 w-4 mr-2" />
                  ส่งออกที่เลือก ({Object.keys(rowSelection).length} รายการ)
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>

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
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-12 w-full" />
            ))}
          </div>
        ) : processedData.length === 0 && !hasActiveFilters ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">
              <div className="text-lg font-medium mb-2">
                ไม่มีข้อมูลยานพาหนะ
              </div>
              <p className="text-sm mb-4">เริ่มต้นด้วยการเพิ่มยานพาหนะใหม่</p>
              <CreateVehicleDrawer onVehicleCreated={refetch} />
            </div>
          </div>
        ) : processedData.length === 0 && hasActiveFilters ? (
          <div className="p-8 text-center">
            <div className="text-gray-500">
              <div className="text-lg font-medium mb-2">
                ไม่พบข้อมูลตามที่ค้นหา
              </div>
              <p className="text-sm mb-4">ลองปรับเปลี่ยนเงื่อนไขการค้นหา</p>
              <Button
                onClick={() => setSearchFilters({})}
                variant="outline"
                size="sm">
                ล้างตัวกรอง
              </Button>
            </div>
          </div>
        ) : (
          <DataTableBody table={table} />
        )}

        <DataTablePagination
          table={table}
          totalRows={processedData.length}
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
              variant="outline"
              size="sm"
              onClick={handleExportSelected}
              disabled={isExporting}
              className="h-8">
              <Download className="h-3 w-3 mr-1" />
              ส่งออก
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
