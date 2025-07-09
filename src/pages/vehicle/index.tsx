// src/pages/vehicle/index.tsx - ปรับปรุงให้ใช้ shared UI components
"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  RefreshCw,
  Plus,
  TrendingUp,
  AlertTriangle,
  Clock,
  Car,
  Search,
} from "lucide-react";

// ใช้ Shared UI Components แทน
import { PageHeader } from "@/components/ui/page-header";
import {
  StatisticsCards,
  StatisticCard,
} from "@/components/ui/statistics-cards";
import { BulkActionBar } from "@/components/ui/bulk-action-bar";
import {
  SearchResultsSummary,
  ActiveFilter,
} from "@/components/ui/search-results-summary";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { VehicleSearch } from "@/components/ui/vehicle-search";

// เฉพาะ Vehicle components ที่จำเป็น
import DataTableBody from "./components/data-table-body";
import DataTablePagination from "./components/data-table-pagination";
import VehicleActionButton from "./components/data-table-action-button";
import DataTableColumnHeader from "./components/data-table-column-header";
import { CreateVehicleDrawer } from "./components/create-vehicle-dialog";

// React Table และอื่นๆ
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
import { columns } from "./components/columns";
import {
  useVehicleAllListQuery,
  useBulkDeleteVehicleMutation,
  useExpiringVehiclesQuery,
} from "@/react-query/manage/vehicle";
import { Checkbox } from "@/components/ui/checkbox";

// Vehicle utilities
import {
  searchVehicles as searchVehicleData,
  getVehicleStatistics,
  prepareVehicleDataForExport,
  sortVehicles,
} from "@/utils/vehicleUtils";

interface VehicleSearchFilters {
  licensePlate?: string;
  tier?: string;
  areaCode?: string;
  status?: string;
}

export default function Vehicles() {
  // State declarations
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "created", desc: true },
  ]);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchFilters, setSearchFilters] = useState<VehicleSearchFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
    if (
      !allVehicles ||
      !Array.isArray(allVehicles) ||
      allVehicles.length === 0
    ) {
      return [];
    }

    try {
      let filtered = [...allVehicles];

      if (searchTerm && searchTerm.trim()) {
        filtered = searchVehicleData(filtered, {
          licensePlate: searchTerm.trim(),
        });
      }

      if (searchFilters && Object.keys(searchFilters).length > 0) {
        filtered = searchVehicleData(filtered, searchFilters);
      }

      if (sorting && sorting.length > 0) {
        const sort = sorting[0];
        filtered = sortVehicles(filtered, sort.id, sort.desc ? "desc" : "asc");
      }

      return filtered || [];
    } catch (error) {
      console.error("Error processing vehicle data:", error);
      return allVehicles || [];
    }
  }, [allVehicles, searchFilters, searchTerm, sorting]);

  // Calculate statistics for StatisticsCards
  const statisticsCards: StatisticCard[] = useMemo(() => {
    const defaultStats = [
      {
        key: "total",
        label: "ทั้งหมด",
        value: 0,
        icon: TrendingUp,
        color: "blue" as const,
      },
      {
        key: "resident",
        label: "ลูกบ้าน",
        value: 0,
        icon: Car,
        color: "green" as const,
      },
      {
        key: "staff",
        label: "เจ้าหน้าที่",
        value: 0,
        icon: Car,
        color: "blue" as const,
      },
      {
        key: "guest",
        label: "แขก",
        value: 0,
        icon: Car,
        color: "yellow" as const,
      },
      {
        key: "expiring",
        label: "ใกล้หมดอายุ",
        value: 0,
        icon: AlertTriangle,
        color: "orange" as const,
      },
      {
        key: "expired",
        label: "หมดอายุ",
        value: 0,
        icon: Clock,
        color: "red" as const,
      },
    ];

    if (
      !allVehicles ||
      !Array.isArray(allVehicles) ||
      allVehicles.length === 0
    ) {
      return defaultStats;
    }

    try {
      const stats = getVehicleStatistics(allVehicles);
      return [
        {
          key: "total",
          label: "ทั้งหมด",
          value: stats.total || 0,
          icon: TrendingUp,
          color: "blue" as const,
        },
        {
          key: "resident",
          label: "ลูกบ้าน",
          value: stats.byTier["ลูกบ้าน"] || 0,
          icon: Car,
          color: "green" as const,
        },
        {
          key: "staff",
          label: "เจ้าหน้าที่",
          value: stats.byTier["เจ้าหน้าที่"] || 0,
          icon: Car,
          color: "blue" as const,
        },
        {
          key: "guest",
          label: "แขก",
          value: stats.byTier["แขก"] || 0,
          icon: Car,
          color: "yellow" as const,
        },
        {
          key: "expiring",
          label: "ใกล้หมดอายุ",
          value: stats.expiring || 0,
          icon: AlertTriangle,
          color: "orange" as const,
        },
        {
          key: "expired",
          label: "หมดอายุ",
          value: stats.expired || 0,
          icon: Clock,
          color: "red" as const,
        },
      ];
    } catch (error) {
      console.error("Error calculating statistics:", error);
      return defaultStats.map((stat, index) =>
        index === 0 ? { ...stat, value: allVehicles.length } : stat
      );
    }
  }, [allVehicles]);

  // Handle functions
  const handleRefresh = async () => {
    try {
      await refetch();
      toast.success("รีเฟรชข้อมูลสำเร็จ");
    } catch (error) {
      console.error("Refresh error:", error);
      toast.error("ไม่สามารถรีเฟรชข้อมูลได้ กรุณาลองใหม่อีกครั้ง");
    }
  };

  const handleCreateVehicle = () => {
    setCreateDialogOpen(true);
  };

  const handleVehicleCreated = () => {
    refetch();
    setCreateDialogOpen(false);
  };

  const handleBulkDelete = async () => {
    try {
      const selectedIds = Object.keys(rowSelection);
      await bulkDeleteVehicle(selectedIds);
      setRowSelection({});
      await refetch();
    } catch (error) {
      console.error("Bulk delete failed:", error);
    }
  };

  const handleExportCSV = async () => {
    if (!processedData || !processedData.length) {
      toast.warning("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }

    try {
      const exportData = prepareVehicleDataForExport(processedData);
      if (!exportData || !exportData.length) {
        toast.warning("ไม่สามารถเตรียมข้อมูลส่งออกได้");
        return;
      }

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
      link.download = `vehicles_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      toast.success(`ส่งออกข้อมูล ${exportData.length} รายการสำเร็จ`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    }
  };

  const handleExportSelected = async () => {
    const selectedIds = Object.keys(rowSelection);
    if (!processedData || selectedIds.length === 0) {
      toast.warning("กรุณาเลือกรายการที่ต้องการส่งออก");
      return;
    }

    const selectedData = processedData.filter((item) =>
      selectedIds.includes(item.id)
    );

    if (!selectedData.length) {
      toast.warning("ไม่พบข้อมูลที่เลือก");
      return;
    }

    try {
      const exportData = prepareVehicleDataForExport(selectedData);
      if (!exportData || !exportData.length) {
        toast.warning("ไม่สามารถเตรียมข้อมูลส่งออกได้");
        return;
      }

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
    }
  };

  // Active filters for SearchResultsSummary
  const activeFilters: ActiveFilter[] = useMemo(() => {
    const filters: ActiveFilter[] = [];

    if (searchTerm.trim()) {
      filters.push({
        key: "search",
        label: "ค้นหา",
        value: searchTerm,
        onRemove: () => setSearchTerm(""),
      });
    }

    Object.entries(searchFilters).forEach(([key, value]) => {
      if (value && value !== "") {
        filters.push({
          key,
          label:
            key === "licensePlate"
              ? "ป้ายทะเบียน"
              : key === "tier"
                ? "ระดับ"
                : key === "areaCode"
                  ? "จังหวัด"
                  : key === "status"
                    ? "สถานะ"
                    : key,
          value: value as string,
          onRemove: () =>
            setSearchFilters((prev) => ({ ...prev, [key]: undefined })),
        });
      }
    });

    return filters;
  }, [searchTerm, searchFilters]);

  const hasActiveFilters = activeFilters.length > 0;

  // Table configuration
  const table = useReactTable({
    initialState: { columnVisibility: { id: false } },
    data: processedData || [],
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
              onCheckedChange={(value) => table.toggleAllRowsSelected(!!value)}
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
            <DataTableColumnHeader title="การดำเนินการ" />
          </div>
        ),
        cell: (info) => (
          <div className="flex justify-center items-center">
            <VehicleActionButton info={info.cell} />
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
    autoResetPageIndex: false,
    state: { pagination, sorting, rowSelection },
  });

  // Show error state
  if (isError || error) {
    return (
      <div className="w-full pl-10 pr-10">
        <ErrorState
          title="เกิดข้อผิดพลาด"
          message={error?.message || "ไม่สามารถโหลดข้อมูลยานพาหนะได้"}
          onRetry={handleRefresh}
          onHome={() => window.location.reload()}
          isLoading={isFetching}
          showHome
        />
      </div>
    );
  }

  return (
    <div className="w-full pl-10 pr-10">
      {/* Page Header with Statistics */}
      <PageHeader
        title="จัดการยานพาหนะ"
        description="จัดการยานพาหนะทั้งหมดในระบบ เพิ่ม แก้ไข หรือลบข้อมูลยานพาหนะ"
        actions={[
          {
            key: "refresh",
            label: "รีเฟรช",
            icon: RefreshCw,
            onClick: handleRefresh,
            variant: "outline",
            loading: isFetching,
          },
          {
            key: "create",
            label: "เพิ่มยานพาหนะ",
            icon: Plus,
            onClick: handleCreateVehicle,
            variant: "default",
          },
        ]}
        alerts={
          !isLoadingExpiring &&
          !expiringError &&
          expiringVehicles &&
          expiringVehicles.length > 0
            ? [
                {
                  type: "warning",
                  message: "มียานพาหนะใกล้หมดอายุ",
                  description: "ภายใน 7 วัน",
                  count: expiringVehicles.length,
                },
              ]
            : []
        }
        statistics={
          <StatisticsCards cards={statisticsCards} loading={isLoading} />
        }
      />

      {/* Search Component */}
      <VehicleSearch onSearch={setSearchFilters} />

      {/* Search Results Summary */}
      <SearchResultsSummary
        isVisible={hasActiveFilters}
        resultCount={processedData?.length || 0}
        totalCount={allVehicles?.length || 0}
        activeFilters={activeFilters}
        onClearAll={() => {
          setSearchFilters({});
          setSearchTerm("");
        }}
      />

      {/* Data Table Toolbar */}
      <DataTableToolbar
        table={table}
        totalRows={processedData?.length || 0}
        selectedCount={Object.keys(rowSelection).length}
        isLoading={isFetching}
        showColumnToggle={true}
        showExport={true}
        showRefresh={true}
        showCreate={true}
        onRefresh={handleRefresh}
        onExportAll={handleExportCSV}
        onExportSelected={handleExportSelected}
        onCreate={handleCreateVehicle}
      />

      <div className="rounded-md border">
        {/* Data Table Body or Empty States */}
        {isLoading ? (
          <div className="p-4 space-y-4">
            {Array.from({ length: 5 }).map((_, index) => (
              <div
                key={index}
                className="h-12 w-full bg-gray-100 animate-pulse rounded"
              />
            ))}
          </div>
        ) : (!processedData || processedData.length === 0) &&
          !hasActiveFilters ? (
          <EmptyState
            icon={Search}
            title="ไม่มีข้อมูลยานพาหนะ"
            description="เริ่มต้นด้วยการเพิ่มยานพาหนะใหม่"
            actions={[
              {
                key: "create",
                label: "เพิ่มยานพาหนะ",
                onClick: handleCreateVehicle,
                icon: Plus,
              },
            ]}
          />
        ) : (!processedData || processedData.length === 0) &&
          hasActiveFilters ? (
          <EmptyState
            icon={Search}
            title="ไม่พบข้อมูลตามที่ค้นหา"
            description="ลองปรับเปลี่ยนเงื่อนไขการค้นหา"
            actions={[
              {
                key: "clear",
                label: "ล้างตัวกรอง",
                onClick: () => {
                  setSearchFilters({});
                  setSearchTerm("");
                },
                variant: "outline",
              },
            ]}
          />
        ) : (
          <DataTableBody table={table} />
        )}

        <DataTablePagination
          table={table}
          totalRows={processedData?.length || 0}
          pgState={pagination}
        />
      </div>

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={Object.keys(rowSelection).length}
        isVisible={Object.keys(rowSelection).length > 0}
        isLoading={isDeleting}
        onReset={() => setRowSelection({})}
        onExport={handleExportSelected}
        onDelete={handleBulkDelete}
      />

      {/* Create Vehicle Dialog */}
      <CreateVehicleDrawer
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onVehicleCreated={handleVehicleCreated}
        showTriggerButton={false}
      />

      <Toaster />
    </div>
  );
}
