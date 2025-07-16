// src/pages/vehicle-access/index.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  RefreshCw,
  TrendingUp,
  CheckCircle,
  XCircle,
  Car,
  Search,
  Activity,
  Camera,
} from "lucide-react";

// ใช้ Shared UI Components
import { PageHeader } from "@/components/ui/page-header";
import {
  StatisticsCards,
  StatisticCard,
} from "@/components/ui/statistics-cards";
import {
  SearchResultsSummary,
  ActiveFilter,
} from "@/components/ui/search-results-summary";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";
import { DataTableToolbar } from "@/components/ui/data-table-toolbar";
import { VehicleAccessSearch } from "@/components/ui/vehicle-access-search";

// Vehicle Access specific components
import DataTableBody from "../vehicle/components/data-table-body"; // ใช้จาก vehicle
import DataTablePagination from "../vehicle/components/data-table-pagination"; // ใช้จาก vehicle
import { Checkbox } from "@/components/ui/checkbox";

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
  usePassageLogAllListQuery,
  useRecentPassageLogQuery,
} from "@/react-query/manage/vehicle_access/vehicle_access";

// Vehicle Access utilities
import {
  searchPassageLogData,
  getVehicleAccessStatistics,
  preparePassageLogDataForExport,
  sortPassageLogs,
} from "@/utils/vehicleAccessUtils";

interface VehicleAccessSearchFilters {
  licensePlate?: string;
  tier?: string;
  areaCode?: string;
  gateState?: string;
  isSuccess?: boolean;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export default function VehicleAccess() {
  // State declarations
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "created", desc: true },
  ]);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchFilters, setSearchFilters] =
    useState<VehicleAccessSearchFilters>({});
  const [searchTerm, setSearchTerm] = useState("");

  // React Query hooks
  const {
    data: allPassageLogs,
    refetch,
    isLoading,
    error,
    isFetching,
    isError,
  } = usePassageLogAllListQuery();

  const { data: recentLogs, isLoading: isLoadingRecent } =
    useRecentPassageLogQuery(1); // ล่าสุด 1 ชั่วโมง

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
      !allPassageLogs ||
      !Array.isArray(allPassageLogs) ||
      allPassageLogs.length === 0
    ) {
      return [];
    }

    try {
      let filtered = [...allPassageLogs];

      if (searchTerm && searchTerm.trim()) {
        filtered = searchPassageLogData(filtered, {
          licensePlate: searchTerm.trim(),
        });
      }

      if (searchFilters && Object.keys(searchFilters).length > 0) {
        filtered = searchPassageLogData(filtered, searchFilters);
      }

      if (sorting && sorting.length > 0) {
        const sort = sorting[0];
        filtered = sortPassageLogs(
          filtered,
          sort.id,
          sort.desc ? "desc" : "asc"
        );
      }

      return filtered || [];
    } catch (error) {
      console.error("Error processing passage log data:", error);
      return allPassageLogs || [];
    }
  }, [allPassageLogs, searchFilters, searchTerm, sorting]);

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
        key: "successful",
        label: "สำเร็จ",
        value: 0,
        icon: CheckCircle,
        color: "green" as const,
      },
      {
        key: "failed",
        label: "ล้มเหลว",
        value: 0,
        icon: XCircle,
        color: "red" as const,
      },
      {
        key: "resident",
        label: "ลูกบ้าน",
        value: 0,
        icon: Car,
        color: "blue" as const,
      },
      {
        key: "staff",
        label: "เจ้าหน้าที่",
        value: 0,
        icon: Car,
        color: "green" as const,
      },
      {
        key: "guest",
        label: "แขก",
        value: 0,
        icon: Car,
        color: "yellow" as const,
      },
    ];

    if (
      !allPassageLogs ||
      !Array.isArray(allPassageLogs) ||
      allPassageLogs.length === 0
    ) {
      return defaultStats;
    }

    try {
      const stats = getVehicleAccessStatistics(allPassageLogs);
      return [
        {
          key: "total",
          label: "ทั้งหมด",
          value: stats.total || 0,
          icon: TrendingUp,
          color: "blue" as const,
        },
        {
          key: "successful",
          label: "สำเร็จ",
          value: stats.successful || 0,
          icon: CheckCircle,
          color: "green" as const,
        },
        {
          key: "failed",
          label: "ล้มเหลว",
          value: stats.failed || 0,
          icon: XCircle,
          color: "red" as const,
        },
        {
          key: "resident",
          label: "ลูกบ้าน",
          value: stats.byTier["ลูกบ้าน"] || 0,
          icon: Car,
          color: "blue" as const,
        },
        {
          key: "staff",
          label: "เจ้าหน้าที่",
          value: stats.byTier["เจ้าหน้าที่"] || 0,
          icon: Car,
          color: "green" as const,
        },
        {
          key: "guest",
          label: "แขก",
          value: stats.byTier["แขก"] || 0,
          icon: Car,
          color: "yellow" as const,
        },
      ];
    } catch (error) {
      console.error("Error calculating statistics:", error);
      return defaultStats.map((stat, index) =>
        index === 0 ? { ...stat, value: allPassageLogs.length } : stat
      );
    }
  }, [allPassageLogs]);

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

  const handleExportCSV = async () => {
    if (!processedData || !processedData.length) {
      toast.warning("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }

    try {
      const exportData = preparePassageLogDataForExport(processedData);
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
      link.download = `vehicle_access_logs_${new Date().toISOString().split("T")[0]}.csv`;
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
      const exportData = preparePassageLogDataForExport(selectedData);
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
      link.download = `selected_vehicle_access_logs_${new Date().toISOString().split("T")[0]}.csv`;
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
      if (value !== undefined && value !== "" && value !== null) {
        let displayValue = "";
        let displayLabel = "";

        switch (key) {
          case "licensePlate":
            displayLabel = "ป้ายทะเบียน";
            displayValue = value as string;
            break;
          case "tier":
            displayLabel = "ประเภท";
            displayValue = value as string;
            break;
          case "areaCode":
            displayLabel = "จังหวัด";
            displayValue = value as string;
            break;
          case "gateState":
            displayLabel = "สถานะประตู";
            displayValue = value as string;
            break;
          case "isSuccess":
            displayLabel = "ผลการเข้าออก";
            displayValue = value ? "สำเร็จ" : "ล้มเหลว";
            break;
          case "dateRange":
            const dateRange = value as { start?: string; end?: string };
            if (dateRange.start || dateRange.end) {
              displayLabel = "วันที่";
              displayValue = `${dateRange.start || ""} - ${dateRange.end || ""}`;
            }
            break;
          default:
            displayLabel = key;
            displayValue = String(value);
        }

        if (displayValue) {
          filters.push({
            key,
            label: displayLabel,
            value: displayValue,
            onRemove: () =>
              setSearchFilters((prev) => ({ ...prev, [key]: undefined })),
          });
        }
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
          message={error?.message || "ไม่สามารถโหลดข้อมูลประวัติการเข้าออกได้"}
          onRetry={handleRefresh}
          onHome={() => window.location.reload()}
          isLoading={isFetching}
          showHome
        />
      </div>
    );
  }

  // Calculate recent activity stats
  const recentStats = recentLogs
    ? getVehicleAccessStatistics(recentLogs)
    : null;

  return (
    <div className="w-full pl-10 pr-10">
      {/* Page Header with Statistics */}
      <PageHeader
        title="ประวัติการเข้าออกยานพาหนะ"
        description="ดูประวัติการเข้าออกของยานพาหนะทั้งหมดในระบบ AI รู้จำป้าย"
        actions={[
          {
            key: "refresh",
            label: "รีเฟรช",
            icon: RefreshCw,
            onClick: handleRefresh,
            variant: "outline",
            loading: isFetching,
          },
        ]}
        alerts={
          recentStats && recentStats.failed > 0
            ? [
                {
                  type: "warning",
                  message: "มีการตรวจจับล้มเหลว",
                  description: "ในช่วง 1 ชั่วโมงที่ผ่านมา",
                  count: recentStats.failed,
                },
              ]
            : []
        }
        statistics={
          <StatisticsCards cards={statisticsCards} loading={isLoading} />
        }
      />

      {/* Search Component */}
      <VehicleAccessSearch onSearch={setSearchFilters} />

      {/* Search Results Summary */}
      <SearchResultsSummary
        isVisible={hasActiveFilters}
        resultCount={processedData?.length || 0}
        totalCount={allPassageLogs?.length || 0}
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
        showCreate={false} // ไม่มีการสร้างใหม่
        onRefresh={handleRefresh}
        onExportAll={handleExportCSV}
        onExportSelected={handleExportSelected}
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
            icon={Camera}
            title="ไม่มีข้อมูลประวัติการเข้าออก"
            description="ยังไม่มีข้อมูลการตรวจจับยานพาหนะในระบบ"
            actions={[
              {
                key: "refresh",
                label: "รีเฟรชข้อมูล",
                onClick: handleRefresh,
                icon: RefreshCw,
                variant: "outline",
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

      <Toaster />
    </div>
  );
}
