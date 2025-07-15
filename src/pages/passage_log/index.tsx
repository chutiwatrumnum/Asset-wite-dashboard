// src/pages/passage_log/index.tsx
"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  RefreshCw,
  Plus,
  TrendingUp,
  LogIn,
  LogOut,
  UserCheck,
  Clock,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { LucideSettings2 } from "lucide-react";

// Import new reusable components
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

// Existing components
import DataTableBody from "./components/data-table-body";
import DataTablePagination from "./components/data-table-pagination";
import { CreatePassageLogDialog } from "./components/create-passage-log-dialog";
import { PassageLogSearch } from "@/components/ui/passage-log-search";

// React Table and other imports
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
  useBulkDeletePassageLogMutation,
  useRecentPassageLogsQuery,
  useActiveEntriesQuery,
} from "@/react-query/manage/passage_log";
import { Checkbox } from "@/components/ui/checkbox";
import DataTableColumnHeader from "./components/data-table-column-header";
import PassageLogActionButton from "./components/data-table-action-button";
import {
  searchPassageLogs,
  getPassageLogStatistics,
  preparePassageLogDataForExport,
  sortPassageLogs,
} from "@/utils/passageLogUtils";

interface PassageLogSearchFilters {
  visitorName?: string;
  passageType?: "entry" | "exit";
  locationArea?: string;
  verificationMethod?: string;
  status?: string;
  dateRange?: {
    start?: string;
    end?: string;
  };
}

export default function PassageLogs() {
  // State declarations
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "created", desc: true },
  ]);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchFilters, setSearchFilters] = useState<PassageLogSearchFilters>(
    {}
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

  // React Query hooks
  const {
    data: allPassageLogs,
    refetch,
    isLoading,
    error,
    isFetching,
    isError,
  } = usePassageLogAllListQuery();

  const {
    data: recentPassageLogs,
    isLoading: isLoadingRecent,
    error: recentError,
  } = useRecentPassageLogsQuery(24);

  const {
    data: activeEntries,
    isLoading: isLoadingActive,
    error: activeError,
  } = useActiveEntriesQuery();

  const { mutateAsync: bulkDeletePassageLog, isPending: isDeleting } =
    useBulkDeletePassageLogMutation();

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
    if (!allPassageLogs || allPassageLogs.length === 0) return [];

    try {
      let filtered = [...allPassageLogs];

      if (searchTerm.trim()) {
        filtered = searchPassageLogs(filtered, {
          visitorName: searchTerm.trim(),
        });
      }

      if (Object.keys(searchFilters).length > 0) {
        filtered = searchPassageLogs(filtered, searchFilters);
      }

      if (sorting.length > 0) {
        const sort = sorting[0];
        filtered = sortPassageLogs(
          filtered,
          sort.id,
          sort.desc ? "desc" : "asc"
        );
      }

      return filtered;
    } catch (error) {
      console.error("Error processing passage log data:", error);
      return allPassageLogs;
    }
  }, [allPassageLogs, searchFilters, searchTerm, sorting]);

  // Calculate statistics for StatisticsCards
  const statisticsCards: StatisticCard[] = useMemo(() => {
    if (!allPassageLogs || allPassageLogs.length === 0) {
      return [
        {
          key: "total",
          label: "ทั้งหมด",
          value: 0,
          icon: TrendingUp,
          color: "blue",
        },
        {
          key: "entries",
          label: "เข้า",
          value: 0,
          icon: LogIn,
          color: "green",
        },
        {
          key: "exits",
          label: "ออก",
          value: 0,
          icon: LogOut,
          color: "orange",
        },
        {
          key: "still_inside",
          label: "อยู่ในพื้นที่",
          value: 0,
          icon: UserCheck,
          color: "purple",
        },
        {
          key: "success",
          label: "สำเร็จ",
          value: 0,
          icon: UserCheck,
          color: "green",
        },
        {
          key: "pending",
          label: "รอดำเนินการ",
          value: 0,
          icon: Clock,
          color: "yellow",
        },
      ];
    }

    try {
      const stats = getPassageLogStatistics(allPassageLogs);
      return [
        {
          key: "total",
          label: "ทั้งหมด",
          value: stats.total,
          icon: TrendingUp,
          color: "blue",
        },
        {
          key: "entries",
          label: "เข้า",
          value: stats.entries,
          icon: LogIn,
          color: "green",
        },
        {
          key: "exits",
          label: "ออก",
          value: stats.exits,
          icon: LogOut,
          color: "orange",
        },
        {
          key: "still_inside",
          label: "อยู่ในพื้นที่",
          value: stats.stillInside,
          icon: UserCheck,
          color: "purple",
        },
        {
          key: "success",
          label: "สำเร็จ",
          value: stats.success,
          icon: UserCheck,
          color: "green",
        },
        {
          key: "pending",
          label: "รอดำเนินการ",
          value: stats.pending,
          icon: Clock,
          color: "yellow",
        },
      ];
    } catch (error) {
      console.error("Error calculating statistics:", error);
      return [
        {
          key: "total",
          label: "ทั้งหมด",
          value: allPassageLogs.length,
          icon: TrendingUp,
          color: "blue",
        },
        {
          key: "entries",
          label: "เข้า",
          value: 0,
          icon: LogIn,
          color: "green",
        },
        {
          key: "exits",
          label: "ออก",
          value: 0,
          icon: LogOut,
          color: "orange",
        },
        {
          key: "still_inside",
          label: "อยู่ในพื้นที่",
          value: 0,
          icon: UserCheck,
          color: "purple",
        },
        {
          key: "success",
          label: "สำเร็จ",
          value: 0,
          icon: UserCheck,
          color: "green",
        },
        {
          key: "pending",
          label: "รอดำเนินการ",
          value: 0,
          icon: Clock,
          color: "yellow",
        },
      ];
    }
  }, [allPassageLogs]);

  // Table setup with action column
  const columnsWithActions = useMemo(
    () => [
      // Selection column
      {
        id: "select",
        header: ({ table }: any) => (
          <Checkbox
            checked={
              table.getIsAllPageRowsSelected() ||
              (table.getIsSomePageRowsSelected() && "indeterminate")
            }
            onCheckedChange={(value) =>
              table.toggleAllPageRowsSelected(!!value)
            }
            aria-label="Select all"
          />
        ),
        cell: ({ row }: any) => (
          <Checkbox
            checked={row.getIsSelected()}
            onCheckedChange={(value) => row.toggleSelected(!!value)}
            aria-label="Select row"
          />
        ),
        enableSorting: false,
        enableHiding: false,
      },
      ...columns,
      // Action column
      {
        id: "action",
        header: () => (
          <div className="flex justify-center items-center">
            <DataTableColumnHeader title="การดำเนินการ" />
          </div>
        ),
        cell: ({ row }: any) => (
          <div className="flex justify-center items-center">
            <PassageLogActionButton info={row} />
          </div>
        ),
        enableHiding: false,
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: processedData,
    columns: columnsWithActions,
    onPaginationChange: setPagination,
    onSortingChange: setSorting,
    onRowSelectionChange: setRowSelection,
    getCoreRowModel: getCoreRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    state: {
      pagination,
      sorting,
      rowSelection,
    },
  });

  // Active filters for display
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
      if (value !== undefined && value !== "") {
        let label = "";
        let displayValue = "";

        switch (key) {
          case "visitorName":
            label = "ชื่อผู้เยี่ยม";
            displayValue = value as string;
            break;
          case "passageType":
            label = "ประเภท";
            displayValue = value === "entry" ? "เข้า" : "ออก";
            break;
          case "locationArea":
            label = "พื้นที่";
            displayValue = value as string;
            break;
          case "verificationMethod":
            label = "วิธียืนยัน";
            displayValue = value as string;
            break;
          case "status":
            label = "สถานะ";
            displayValue = value as string;
            break;
          case "dateRange":
            label = "ช่วงวันที่";
            const range = value as { start?: string; end?: string };
            displayValue = `${range.start || ""} - ${range.end || ""}`;
            break;
        }

        if (displayValue) {
          filters.push({
            key,
            label,
            value: displayValue,
            onRemove: () => {
              const newFilters = { ...searchFilters };
              delete newFilters[key as keyof PassageLogSearchFilters];
              setSearchFilters(newFilters);
            },
          });
        }
      }
    });

    return filters;
  }, [searchTerm, searchFilters]);

  // Bulk actions
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const hasSelection = selectedCount > 0;

  const handleBulkDelete = async () => {
    try {
      const selectedIds = selectedRows.map(
        (row) => row.getValue("id") as string
      );

      await bulkDeletePassageLog(selectedIds);

      // Reset selection
      setRowSelection({});

      toast.success(`ลบประวัติการเข้าออกสำเร็จ ${selectedCount} รายการ`);
    } catch (error) {
      console.error("Bulk delete error:", error);
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูล");
    }
  };

  const handleExportSelected = () => {
    try {
      const selectedData = selectedRows.map((row) => row.original);
      const exportData = preparePassageLogDataForExport(selectedData);

      // Convert to CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers.map((header) => `"${row[header] || ""}"`).join(",")
        ),
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `passage-logs-selected-${new Date().getTime()}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`ส่งออกข้อมูล ${selectedCount} รายการสำเร็จ`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    }
  };

  const handleExportAll = () => {
    try {
      const exportData = preparePassageLogDataForExport(processedData);

      // Convert to CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers.map((header) => `"${row[header] || ""}"`).join(",")
        ),
      ].join("\n");

      // Download
      const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
      const link = document.createElement("a");
      const url = URL.createObjectURL(blob);
      link.setAttribute("href", url);
      link.setAttribute(
        "download",
        `passage-logs-all-${new Date().getTime()}.csv`
      );
      link.style.visibility = "hidden";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      toast.success(`ส่งออกข้อมูล ${processedData.length} รายการสำเร็จ`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    }
  };

  // Error state
  if (isError && !isFetching) {
    return (
      <div className="p-6">
        <ErrorState
          title="ไม่สามารถโหลดข้อมูลประวัติการเข้าออกได้"
          message={error?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล"}
          onRetry={refetch}
          isLoading={isFetching}
          showRetry={true}
        />
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" />

      {/* Page Header */}
      <PageHeader
        title="ประวัติการเข้าออก"
        description="จัดการและติดตามประวัติการเข้าออกของผู้เยี่ยม"
        actions={[
          {
            key: "refresh",
            label: isFetching ? "กำลังโหลด..." : "รีเฟรช",
            icon: RefreshCw,
            onClick: refetch,
            disabled: isFetching,
            variant: "outline",
          },
          {
            key: "create",
            label: "บันทึกการเข้าออก",
            icon: Plus,
            onClick: () => setCreateDialogOpen(true),
            variant: "default",
          },
        ]}
      />

      {/* Statistics Cards */}
      <StatisticsCards
        cards={statisticsCards}
        columns={6}
        loading={isLoading}
      />

      {/* Search and Filters */}
      <PassageLogSearch onSearch={setSearchFilters} />

      {/* Search Results Summary */}
      <SearchResultsSummary
        isVisible={activeFilters.length > 0}
        resultCount={processedData.length}
        totalCount={allPassageLogs?.length || 0}
        activeFilters={activeFilters}
        onClearAll={() => {
          setSearchTerm("");
          setSearchFilters({});
        }}
        variant="compact"
      />

      {/* Table Toolbar */}
      <div className="flex items-center justify-between py-4">
        <div className="text-sm text-muted-foreground">
          แสดง {processedData.length.toLocaleString()} จาก{" "}
          {allPassageLogs?.length.toLocaleString() || 0} รายการ
          {hasSelection && (
            <span className="ml-2 text-blue-600">
              (เลือก {selectedCount.toLocaleString()} รายการ)
            </span>
          )}
        </div>

        {/* Column Visibility Toggle */}
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" size="sm" className="gap-2">
              <LucideSettings2 className="h-4 w-4" />
              จัดการคอลัมน์
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuLabel>แสดง/ซ่อนคอลัมน์</DropdownMenuLabel>
            <DropdownMenuSeparator />
            {table
              .getAllColumns()
              .filter((column) => column.getCanHide())
              .map((column) => {
                return (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(value)}>
                    {column.id}
                  </DropdownMenuCheckboxItem>
                );
              })}
          </DropdownMenuContent>
        </DropdownMenu>
      </div>

      {/* Data Table */}
      {isLoading ? (
        <div className="flex justify-center items-center h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
        </div>
      ) : processedData.length === 0 ? (
        <EmptyState
          icon={Search}
          title="ไม่พบประวัติการเข้าออก"
          description={
            activeFilters.length > 0
              ? "ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา ลองปรับเปลี่ยนตัวกรองหรือล้างตัวกรอง"
              : "ยังไม่มีประวัติการเข้าออกในระบบ เริ่มต้นโดยการบันทึกการเข้าออกใหม่"
          }
          actions={[
            {
              key: "create",
              label: "บันทึกการเข้าออกใหม่",
              onClick: () => setCreateDialogOpen(true),
              variant: "default",
              icon: Plus,
            },
            ...(activeFilters.length > 0
              ? [
                  {
                    key: "clear",
                    label: "ล้างตัวกรอง",
                    onClick: () => {
                      setSearchTerm("");
                      setSearchFilters({});
                    },
                    variant: "outline" as const,
                  },
                ]
              : []),
          ]}
        />
      ) : (
        <>
          <DataTableBody table={table} />
          <DataTablePagination
            table={table}
            totalRows={processedData.length}
            pgState={pagination}
          />
        </>
      )}

      {/* Bulk Action Bar */}
      <BulkActionBar
        selectedCount={selectedCount}
        isVisible={hasSelection}
        isLoading={isDeleting}
        onReset={() => setRowSelection({})}
        onExport={handleExportSelected}
        onDelete={handleBulkDelete}
        customActions={[
          {
            key: "export-all",
            label: "ส่งออกทั้งหมด",
            onClick: handleExportAll,
            variant: "outline",
          },
        ]}
      />

      {/* Create Dialog */}
      <CreatePassageLogDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onPassageLogCreated={() => {
          refetch();
          setCreateDialogOpen(false);
        }}
        showTriggerButton={false}
      />
    </div>
  );
}
