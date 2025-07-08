// src/pages/invitation/index.tsx
"use client";

import { useEffect, useState, useMemo } from "react";

import DataTableBody from "../vehicle/components/data-table-body"; // Reuse from vehicle
import DataTablePagination from "../vehicle/components/data-table-pagination"; // Reuse from vehicle
import { CreateInvitationDrawer } from "./components/create-invitation-dialog";
import InvitationActionButton from "./components/data-table-action-button";

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
import DataTableColumnHeader from "../vehicle/components/data-table-column-header"; // Reuse from vehicle
import { columns } from "./components/columns";
import {
  useInvitationAllListQuery,
  useBulkDeleteInvitationMutation,
  useExpiringInvitationsQuery,
} from "@/react-query/manage/invitation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { InvitationItem } from "@/api/invitation/invitation";
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
  UserCheck,
  Clock,
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
  searchInvitations,
  getInvitationStatistics,
  prepareInvitationDataForExport,
  sortInvitations,
} from "@/utils/invitationUtils";
import { Input } from "@/components/ui/input";

interface InvitationSearchFilters {
  visitorName?: string;
  houseId?: string;
  status?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export default function Invitations() {
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
  const [searchFilters, setSearchFilters] = useState<InvitationSearchFilters>(
    {}
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  // React Query hooks
  const {
    data: allInvitations,
    refetch,
    isLoading,
    error,
    isFetching,
    isError,
  } = useInvitationAllListQuery();

  const {
    data: expiringInvitations,
    isLoading: isLoadingExpiring,
    error: expiringError,
  } = useExpiringInvitationsQuery(24); // Within 24 hours

  const { mutateAsync: bulkDeleteInvitation, isPending: isDeleting } =
    useBulkDeleteInvitationMutation();

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
    if (!allInvitations || allInvitations.length === 0) return [];

    try {
      let filtered = [...allInvitations];

      // Apply search term filter
      if (searchTerm.trim()) {
        filtered = searchInvitations(filtered, {
          visitorName: searchTerm.trim(),
        });
      }

      // Apply additional filters
      if (Object.keys(searchFilters).length > 0) {
        filtered = searchInvitations(filtered, searchFilters);
      }

      // Apply sorting
      if (sorting.length > 0) {
        const sort = sorting[0];
        filtered = sortInvitations(
          filtered,
          sort.id,
          sort.desc ? "desc" : "asc"
        );
      }

      return filtered;
    } catch (error) {
      console.error("Error processing invitation data:", error);
      return allInvitations;
    }
  }, [allInvitations, searchFilters, searchTerm, sorting]);

  // Calculate statistics
  const stats = useMemo(() => {
    if (!allInvitations || allInvitations.length === 0) {
      return {
        total: 0,
        active: 0,
        pending: 0,
        expiring: 0,
        expired: 0,
        inactive: 0,
      };
    }

    try {
      return getInvitationStatistics(allInvitations);
    } catch (error) {
      console.error("Error calculating statistics:", error);
      return {
        total: allInvitations.length,
        active: 0,
        pending: 0,
        expiring: 0,
        expired: 0,
        inactive: 0,
      };
    }
  }, [allInvitations]);

  // Handle refresh
  const handleRefresh = async () => {
    try {
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
      console.log("Deleting invitations with IDs:", selectedIds);

      await bulkDeleteInvitation(selectedIds);

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
      const exportData = prepareInvitationDataForExport(processedData);

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
      link.download = `invitations_${new Date().toISOString().split("T")[0]}.csv`;
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
      const exportData = prepareInvitationDataForExport(selectedData);

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
      link.download = `selected_invitations_${new Date().toISOString().split("T")[0]}.csv`;
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
            <InvitationActionButton info={info.cell} />
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

  const hasActiveFilters =
    searchTerm.trim() !== "" ||
    Object.keys(searchFilters).some((key) => {
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
                {error?.message || "ไม่สามารถโหลดข้อมูลบัตรเชิญได้"}
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
                  จัดการบัตรเชิญ (E-invitation)
                </CardTitle>
                <p className="text-muted-foreground mt-1">
                  จัดการบัตรเชิญสำหรับผู้เยี่ยมทั้งหมดในระบบ สร้าง แก้ไข
                  หรือลบบัตรเชิญ
                </p>
              </div>

              {/* Expiring invitations warning */}
              {!isLoadingExpiring &&
                !expiringError &&
                expiringInvitations &&
                expiringInvitations.length > 0 && (
                  <div className="bg-orange-50 border border-orange-200 rounded-lg p-3 flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5 text-orange-600" />
                    <div>
                      <p className="text-sm font-medium text-orange-800">
                        มีบัตรเชิญใกล้หมดอายุ
                      </p>
                      <p className="text-xs text-orange-600">
                        {expiringInvitations.length} ใบ ภายใน 24 ชั่วโมง
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
            <CreateInvitationDrawer onInvitationCreated={refetch} />
          </div>
        </CardHeader>

        {/* Statistics */}
        <CardContent className="pt-0">
          <div className="grid grid-cols-2 lg:grid-cols-6 gap-4">
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
                <UserCheck className="h-8 w-8 text-green-500" />
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
                <Clock className="h-8 w-8 text-yellow-500" />
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
                <AlertTriangle className="h-8 w-8 text-orange-500" />
              </div>
            </div>

            <div className="bg-red-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-red-600 text-sm font-medium">หมดอายุ</p>
                  <p className="text-2xl font-bold text-red-900">
                    {stats.expired.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-red-500" />
              </div>
            </div>

            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-gray-600 text-sm font-medium">ปิดใช้งาน</p>
                  <p className="text-2xl font-bold text-gray-900">
                    {stats.inactive.toLocaleString()}
                  </p>
                </div>
                <TrendingUp className="h-8 w-8 text-gray-500" />
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Search Component */}
      <div className="mb-6">
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              placeholder="ค้นหาชื่อผู้เยี่ยม..."
              value={searchTerm}
              onChange={(e) => {
                setSearchTerm(e.target.value);
                setPagination((prev) => ({ ...prev, pageIndex: 0 }));
                setRowSelection({});
              }}
              className="max-w-sm"
            />
          </div>
        </div>
      </div>

      {/* Search Results Summary */}
      {hasActiveFilters && (
        <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
          <div className="text-sm text-blue-800">
            <span className="font-medium">ผลการค้นหา:</span>
            <span className="ml-2">
              พบ {processedData.length.toLocaleString()} รายการ จากทั้งหมด{" "}
              {allInvitations?.length.toLocaleString() || 0} รายการ
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
                ไม่มีข้อมูลบัตรเชิญ
              </div>
              <p className="text-sm mb-4">เริ่มต้นด้วยการสร้างบัตรเชิญใหม่</p>
              <CreateInvitationDrawer onInvitationCreated={refetch} />
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
                onClick={() => {
                  setSearchFilters({});
                  setSearchTerm("");
                }}
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
              คุณแน่ใจหรือไม่ที่จะลบบัตรเชิญ {Object.keys(rowSelection).length}{" "}
              ใบ?
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
