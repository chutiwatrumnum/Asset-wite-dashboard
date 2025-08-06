// src/pages/external_vehicle/index.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  RefreshCw,
  Plus,
  TrendingUp,
  Users,
  Car,
  UserCheck,
  Search,
  MapPin,
} from "lucide-react";

// ใช้ Shared UI Components
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
import { VisitorSearch } from "@/components/ui/visitor-search";

// External Vehicle components
import DataTableBody from "./components/data-table-body";
import DataTablePagination from "./components/data-table-pagination";
import VisitorActionButton from "./components/data-table-action-button";
import DataTableColumnHeader from "./components/data-table-column-header";
import { CreateVisitorDialog } from "./components/create-visitor-dialog";

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
  useVisitorAllListQuery,
  useBulkDeleteVisitorsMutation,
} from "@/react-query/manage/external_vehicle/visitor";
import { Checkbox } from "@/components/ui/checkbox";

// Visitor utilities
import {
  searchVisitors as searchVisitorData,
  getVisitorStatistics,
  prepareVisitorDataForExport,
  sortVisitors,
} from "@/utils/visitorUtils";

interface VisitorSearchFilters {
  firstName?: string;
  lastName?: string;
  licensePlate?: string;
  gender?: string;
  idCard?: string;
  areaCode?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export default function ExternalVehicles() {
  // State declarations
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "created", desc: true },
  ]);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchFilters, setSearchFilters] = useState<VisitorSearchFilters>({});
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // React Query hooks
  const {
    data: allVisitors,
    refetch,
    isLoading,
    error,
    isFetching,
    isError,
  } = useVisitorAllListQuery();

  const { mutateAsync: bulkDeleteVisitor, isPending: isDeleting } =
    useBulkDeleteVisitorsMutation();

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
      !allVisitors ||
      !Array.isArray(allVisitors) ||
      allVisitors.length === 0
    ) {
      return [];
    }

    try {
      let filtered = [...allVisitors];

      if (searchTerm && searchTerm.trim()) {
        filtered = searchVisitorData(filtered, {
          firstName: searchTerm.trim(),
        });
      }

      if (searchFilters && Object.keys(searchFilters).length > 0) {
        filtered = searchVisitorData(filtered, searchFilters);
      }

      if (sorting && sorting.length > 0) {
        const sort = sorting[0];
        filtered = sortVisitors(filtered, sort.id, sort.desc ? "desc" : "asc");
      }

      return filtered || [];
    } catch (error) {
      console.error("Error processing visitor data:", error);
      return allVisitors || [];
    }
  }, [allVisitors, searchFilters, searchTerm, sorting]);

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
        key: "today",
        label: "วันนี้",
        value: 0,
        icon: Users,
        color: "green" as const,
      },
      {
        key: "recent",
        label: "24 ชม.",
        value: 0,
        icon: Car,
        color: "yellow" as const,
      },
      {
        key: "stamped",
        label: "อนุมัติแล้ว",
        value: 0,
        icon: UserCheck,
        color: "purple" as const,
      },
      {
        key: "male",
        label: "ชาย",
        value: 0,
        icon: Users,
        color: "indigo" as const,
      },
      {
        key: "female",
        label: "หญิง",
        value: 0,
        icon: Users,
        color: "red" as const,
      },
    ];

    if (
      !allVisitors ||
      !Array.isArray(allVisitors) ||
      allVisitors.length === 0
    ) {
      return defaultStats;
    }

    try {
      const stats = getVisitorStatistics(allVisitors);

      // Count stamped visitors
      const stampedCount = allVisitors.filter(
        (visitor) => visitor.stamper && visitor.stamped_time
      ).length;

      return [
        {
          key: "total",
          label: "ทั้งหมด",
          value: stats.total || 0,
          icon: TrendingUp,
          color: "blue" as const,
        },
        {
          key: "today",
          label: "วันนี้",
          value: stats.todayVisitors || 0,
          icon: Users,
          color: "green" as const,
        },
        {
          key: "recent",
          label: "24 ชม.",
          value: stats.recentVisitors || 0,
          icon: Car,
          color: "yellow" as const,
        },
        {
          key: "stamped",
          label: "อนุมัติแล้ว",
          value: stampedCount || 0,
          icon: UserCheck,
          color: "purple" as const,
        },
        {
          key: "male",
          label: "ชาย",
          value: stats.byGender["ชาย"] || 0,
          icon: Users,
          color: "indigo" as const,
        },
        {
          key: "female",
          label: "หญิง",
          value: stats.byGender["หญิง"] || 0,
          icon: Users,
          color: "red" as const,
        },
      ];
    } catch (error) {
      console.error("Error calculating statistics:", error);
      return defaultStats.map((stat, index) =>
        index === 0 ? { ...stat, value: allVisitors.length } : stat
      );
    }
  }, [allVisitors]);

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

  const handleCreateVisitor = () => {
    setCreateDialogOpen(true);
  };

  const handleVisitorCreated = () => {
    refetch();
    setCreateDialogOpen(false);
  };

  const handleBulkDelete = async () => {
    try {
      const selectedIds = Object.keys(rowSelection);
      await bulkDeleteVisitor(selectedIds);
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
      const exportData = prepareVisitorDataForExport(processedData);
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
      link.download = `external_visitors_${new Date().toISOString().split("T")[0]}.csv`;
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
      const exportData = prepareVisitorDataForExport(selectedData);
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
      link.download = `selected_external_visitors_${new Date().toISOString().split("T")[0]}.csv`;
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
        if (key === "dateRange" && typeof value === "object") {
          const dateRange = value as { start?: string; end?: string };
          if (dateRange.start || dateRange.end) {
            filters.push({
              key: "dateRange",
              label: "ช่วงวันที่",
              value: `${dateRange.start || ""} - ${dateRange.end || ""}`,
              onRemove: () =>
                setSearchFilters((prev) => ({ ...prev, dateRange: undefined })),
            });
          }
        } else {
          filters.push({
            key,
            label:
              key === "firstName"
                ? "ชื่อ"
                : key === "lastName"
                  ? "นามสกุล"
                  : key === "licensePlate"
                    ? "ป้ายทะเบียน"
                    : key === "gender"
                      ? "เพศ"
                      : key === "idCard"
                        ? "บัตรประชาชน"
                        : key === "areaCode"
                          ? "จังหวัด"
                          : key,
            value: value as string,
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
      {
        id: "action",
        header: () => (
          <div className="flex justify-center items-center">
            <DataTableColumnHeader title="การดำเนินการ" />
          </div>
        ),
        cell: (info) => (
          <div className="flex justify-center items-center">
            <VisitorActionButton info={info.cell} />
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
          message={error?.message || "ไม่สามารถโหลดข้อมูลผู้เยี่ยมภายนอกได้"}
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
        title="ยานพาหนะภายนอก"
        description="จัดการข้อมูลผู้เยี่ยมและยานพาหนะภายนอกที่เข้ามาในพื้นที่"
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
            label: "เพิ่มผู้เยี่ยมภายนอก",
            icon: Plus,
            onClick: handleCreateVisitor,
            variant: "default",
          },
        ]}
        statistics={
          <StatisticsCards cards={statisticsCards} loading={isLoading} />
        }
      />

      {/* Search Component */}
      <VisitorSearch onSearch={setSearchFilters} />

      {/* Search Results Summary */}
      <SearchResultsSummary
        isVisible={hasActiveFilters}
        resultCount={processedData?.length || 0}
        totalCount={allVisitors?.length || 0}
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
        onCreate={handleCreateVisitor}
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
            title="ไม่มีข้อมูลผู้เยี่ยมภายนอก"
            description="เริ่มต้นด้วยการเพิ่มข้อมูลผู้เยี่ยมภายนอกใหม่"
            actions={[
              {
                key: "create",
                label: "เพิ่มผู้เยี่ยมภายนอก",
                onClick: handleCreateVisitor,
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

      {/* Create Visitor Dialog */}
      <CreateVisitorDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onVisitorCreated={handleVisitorCreated}
        showTriggerButton={false}
      />

      <Toaster />
    </div>
  );
}
