"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  RefreshCw,
  TrendingUp,
  LogIn,
  LogOut,
  UserCheck,
  Clock,
  Search,
  FileText,
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
import {
  SearchResultsSummary,
  ActiveFilter,
} from "@/components/ui/search-results-summary";
import { EmptyState } from "@/components/ui/empty-state";
import { ErrorState } from "@/components/ui/error-state";

// Existing components
import DataTableBody from "./components/data-table-body";
import DataTablePagination from "./components/data-table-pagination";
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

// ✅ ใช้ real API calls แต่เพิ่ม fallback
import {
  usePassageLogAllListQuery,
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
import type { PassageLogItem } from "@/api/passage_log/passage_log";

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

// ✅ Mock data เป็น fallback
const FALLBACK_DATA: PassageLogItem[] = [
  {
    id: "mock-1",
    collectionId: "mock",
    collectionName: "passage_log",
    visitor_name: "ทดสอบ ระบบ",
    entry_time: new Date().toISOString(),
    exit_time: null,
    passage_type: "entry",
    location_area: "พื้นที่ทดสอบ",
    verification_method: "manual",
    verification_data: "",
    staff_verified_by: "",
    invitation_id: "",
    vehicle_id: "",
    house_id: "",
    notes: "ข้อมูลทดสอบ",
    status: "success",
    created: new Date().toISOString(),
    updated: new Date().toISOString(),
  },
];

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
  const [useFallbackData, setUseFallbackData] = useState(false);

  // ✅ React Query hooks with better error handling
  const {
    data: allPassageLogs,
    refetch,
    isLoading,
    error,
    isFetching,
    isError,
  } = usePassageLogAllListQuery();

  const { data: recentPassageLogs } = useRecentPassageLogsQuery(24);
  const { data: activeEntries } = useActiveEntriesQuery();

  // ✅ Enhanced debug logging
  useEffect(() => {
    console.log("🔍 Passage Log Debug Info:", {
      allPassageLogs,
      isLoading,
      isError,
      error: error?.message,
      dataLength: allPassageLogs?.length || 0,
      dataType: typeof allPassageLogs,
      isArray: Array.isArray(allPassageLogs),
      firstItem: allPassageLogs?.[0],
      useFallbackData,
    });

    // ✅ Auto-switch to fallback data if API fails
    if (isError && !useFallbackData) {
      console.warn("⚠️ API Error detected, switching to fallback data");
      setUseFallbackData(true);
      toast.warning("เกิดข้อผิดพลาดในการโหลดข้อมูล กำลังใช้ข้อมูลทดสอบ", {
        description: "กรุณาตรวจสอบการเชื่อมต่อเซิร์ฟเวอร์",
        duration: 5000,
      });
    }
  }, [allPassageLogs, isLoading, isError, error, useFallbackData]);

  // ✅ Safe data processing with fallback
  const processedData = useMemo(() => {
    let sourceData: PassageLogItem[] = [];

    // Determine data source
    if (useFallbackData) {
      sourceData = FALLBACK_DATA;
    } else if (Array.isArray(allPassageLogs) && allPassageLogs.length > 0) {
      sourceData = allPassageLogs;
    } else {
      sourceData = [];
    }

    console.log("📊 Processing data:", {
      sourceLength: sourceData.length,
      source: useFallbackData ? "fallback" : "api",
      firstItem: sourceData[0],
    });

    if (sourceData.length === 0) {
      return [];
    }

    try {
      let filtered = [...sourceData];

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
      console.error("❌ Error processing passage log data:", error);
      return sourceData; // Return unprocessed data as fallback
    }
  }, [allPassageLogs, searchFilters, searchTerm, sorting, useFallbackData]);

  // ✅ Safe statistics calculation
  const statisticsCards: StatisticCard[] = useMemo(() => {
    const defaultCards = [
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

    const sourceData = useFallbackData ? FALLBACK_DATA : allPassageLogs;

    if (!sourceData || sourceData.length === 0) {
      return defaultCards;
    }

    try {
      const stats = getPassageLogStatistics(sourceData);
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
      console.error("❌ Error calculating statistics:", error);
      return defaultCards.map((card) => ({
        ...card,
        value: card.key === "total" ? sourceData.length : 0,
      }));
    }
  }, [allPassageLogs, useFallbackData]);

  // ✅ Safe table setup with better error handling
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
      // Action column with safe rendering
      {
        id: "action",
        header: () => (
          <div className="flex justify-center items-center">
            <DataTableColumnHeader title="ดูรายละเอียด" />
          </div>
        ),
        cell: ({ row }: any) => {
          // ✅ Safe check before rendering
          if (!row?.original) {
            console.warn("⚠️ Row original is undefined:", row);
            return (
              <div className="flex justify-center items-center">
                <Button variant="ghost" size="sm" disabled>
                  <FileText className="h-4 w-4" />
                  ดู
                </Button>
              </div>
            );
          }

          return (
            <div className="flex justify-center items-center">
              <PassageLogActionButton info={row} />
            </div>
          );
        },
        enableHiding: false,
        enableSorting: false,
      },
    ],
    []
  );

  const table = useReactTable({
    data: processedData || [], // ✅ Ensure data is never undefined
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

  // Export functions
  const selectedRows = table.getFilteredSelectedRowModel().rows;
  const selectedCount = selectedRows.length;
  const hasSelection = selectedCount > 0;

  const handleExportSelected = () => {
    try {
      const selectedData = selectedRows
        .map((row) => row.original)
        .filter(Boolean);
      if (selectedData.length === 0) {
        toast.warning("ไม่มีข้อมูลที่เลือกสำหรับส่งออก");
        return;
      }

      const exportData = preparePassageLogDataForExport(selectedData);
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers.map((header) => `"${row[header] || ""}"`).join(",")
        ),
      ].join("\n");

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
      if (processedData.length === 0) {
        toast.warning("ไม่มีข้อมูลสำหรับส่งออก");
        return;
      }

      const exportData = preparePassageLogDataForExport(processedData);
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(","),
        ...exportData.map((row) =>
          headers.map((header) => `"${row[header] || ""}"`).join(",")
        ),
      ].join("\n");

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

  // ✅ Loading state with better UX
  if (isLoading && !useFallbackData) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="ประวัติการเข้าออก"
          description="กำลังโหลดข้อมูล..."
        />
        <div className="flex justify-center items-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-2"></div>
            <span className="text-sm text-muted-foreground">
              กำลังโหลดข้อมูล...
            </span>
          </div>
        </div>
      </div>
    );
  }

  // ✅ Error state with retry option
  if (isError && !isFetching && !useFallbackData) {
    return (
      <div className="p-6">
        <ErrorState
          title="ไม่สามารถโหลดข้อมูลประวัติการเข้าออกได้"
          message={error?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล"}
          onRetry={() => {
            setUseFallbackData(false);
            refetch();
          }}
          isLoading={isFetching}
          showRetry={true}
          actions={[
            {
              key: "fallback",
              label: "ใช้ข้อมูลทดสอบ",
              onClick: () => setUseFallbackData(true),
              variant: "outline",
            },
          ]}
        />
      </div>
    );
  }

  const dataSource = useFallbackData ? FALLBACK_DATA : allPassageLogs;
  const totalCount = dataSource?.length || 0;

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" />

      {/* Page Header */}
      <PageHeader
        title="ประวัติการเข้าออก"
        description={
          useFallbackData
            ? "ดูและติดตามประวัติการเข้าออกของผู้เยี่ยม (ข้อมูลทดสอบ)"
            : "ดูและติดตามประวัติการเข้าออกของผู้เยี่ยม (อ่านอย่างเดียว)"
        }
        actions={[
          {
            key: "refresh",
            label: isFetching ? "กำลังโหลด..." : "รีเฟรช",
            icon: RefreshCw,
            onClick: () => {
              setUseFallbackData(false);
              refetch();
            },
            disabled: isFetching,
            variant: "outline",
          },
        ]}
        alerts={
          useFallbackData
            ? [
                {
                  type: "warning",
                  message: "กำลังใช้ข้อมูลทดสอบ",
                  description:
                    "ไม่สามารถเชื่อมต่อกับเซิร์ฟเวอร์ได้ กำลังแสดงข้อมูลตัวอย่าง",
                },
              ]
            : []
        }
      />

      {/* Statistics Cards */}
      <StatisticsCards
        cards={statisticsCards}
        columns={6}
        loading={isLoading && !useFallbackData}
      />

      {/* Search and Filters */}
      <PassageLogSearch onSearch={setSearchFilters} />

      {/* Search Results Summary */}
      <SearchResultsSummary
        isVisible={activeFilters.length > 0}
        resultCount={processedData.length}
        totalCount={totalCount}
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
          {totalCount.toLocaleString()} รายการ
          {hasSelection && (
            <span className="ml-2 text-blue-600">
              (เลือก {selectedCount.toLocaleString()} รายการสำหรับส่งออก)
            </span>
          )}
        </div>

        <div className="flex gap-2">
          {hasSelection && (
            <Button
              variant="outline"
              size="sm"
              onClick={handleExportSelected}
              className="gap-2">
              <FileText className="h-4 w-4" />
              ส่งออกที่เลือก ({selectedCount})
            </Button>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={handleExportAll}
            className="gap-2"
            disabled={processedData.length === 0}>
            <FileText className="h-4 w-4" />
            ส่งออกทั้งหมด
          </Button>

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
                .map((column) => (
                  <DropdownMenuCheckboxItem
                    key={column.id}
                    className="capitalize"
                    checked={column.getIsVisible()}
                    onCheckedChange={(value) => column.toggleVisibility(value)}>
                    {column.id}
                  </DropdownMenuCheckboxItem>
                ))}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </div>

      {/* Data Table */}
      {processedData.length === 0 ? (
        <EmptyState
          icon={Search}
          title="ไม่พบประวัติการเข้าออก"
          description={
            activeFilters.length > 0
              ? "ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา ลองปรับเปลี่ยนตัวกรองหรือล้างตัวกรอง"
              : useFallbackData
                ? "กำลังใช้ข้อมูลทดสอบ แต่ไม่มีข้อมูลที่จะแสดง"
                : "ยังไม่มีประวัติการเข้าออกในระบบ"
          }
          actions={
            activeFilters.length > 0
              ? [
                  {
                    key: "clear",
                    label: "ล้างตัวกรอง",
                    onClick: () => {
                      setSearchTerm("");
                      setSearchFilters({});
                    },
                    variant: "outline",
                  },
                ]
              : useFallbackData
                ? [
                    {
                      key: "retry",
                      label: "ลองเชื่อมต่อใหม่",
                      onClick: () => {
                        setUseFallbackData(false);
                        refetch();
                      },
                      variant: "default",
                    },
                  ]
                : []
          }
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

      {/* Selection Bar */}
      {hasSelection && (
        <div className="fixed bottom-6 left-1/2 transform -translate-x-1/2 z-50">
          <div className="bg-card border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4">
            <span className="text-sm font-medium">
              เลือกแล้ว {selectedCount.toLocaleString()} รายการ
            </span>
            <Button
              variant="outline"
              size="sm"
              onClick={() => setRowSelection({})}
              className="gap-2">
              ยกเลิกการเลือก
            </Button>
            <Button
              variant="default"
              size="sm"
              onClick={handleExportSelected}
              className="gap-2">
              <FileText className="h-4 w-4" />
              ส่งออกที่เลือก
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
