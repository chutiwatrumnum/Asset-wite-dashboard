// src/pages/vehicle_access/index.tsx (แก้ไขแล้ว)
"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  RefreshCw,
  Car,
  CheckCircle,
  XCircle,
  Shield,
  Camera,
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

// Local components
import DataTableBody from "./components/data-table-body";
import DataTablePagination from "./components/data-table-pagination";
import { VehicleAccessSearch } from "@/components/ui/vehicle-access-search.tsx";

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

// API and utils
import {
  useVehicleAccessAllListQuery,
  useRecentVehicleAccessQuery,
} from "@/react-query/manage/vehicle_access/vehicle_access";

import { Checkbox } from "@/components/ui/checkbox";
import DataTableColumnHeader from "./components/data-table-column-header";
import VehicleAccessActionButton from "./components/data-table-action-button";
import {
  searchVehicleAccessLogs,
  getVehicleAccessStatistics,
  prepareVehicleAccessDataForExport,
  sortVehicleAccessLogs,
  VEHICLE_TIERS,
  THAI_AREA_CODES,
  GATE_STATES,
} from "@/utils/vehicleAccessUtils";
import type { VehicleAccessItem } from "@/api/vehicle_access/vehicle_access";

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

export default function VehicleAccessPage() {
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
    data: allVehicleAccess,
    refetch,
    isLoading,
    error,
    isFetching,
    isError,
  } = useVehicleAccessAllListQuery();

  const { data: recentVehicleAccess } = useRecentVehicleAccessQuery(24);

  // Enhanced debug logging
  useEffect(() => {
    console.log("🚗 Vehicle Access Debug Info:", {
      allVehicleAccess,
      isLoading,
      isError,
      error: error?.message,
      dataLength: allVehicleAccess?.length || 0,
      dataType: typeof allVehicleAccess,
      isArray: Array.isArray(allVehicleAccess),
      firstItem: allVehicleAccess?.[0],
    });
  }, [allVehicleAccess, isLoading, isError, error]);

  // Safe data processing
  const processedData = useMemo(() => {
    let sourceData: VehicleAccessItem[] = [];

    if (Array.isArray(allVehicleAccess) && allVehicleAccess.length > 0) {
      sourceData = allVehicleAccess;
    } else {
      sourceData = [];
    }

    console.log("📊 Processing vehicle access data:", {
      sourceLength: sourceData.length,
      firstItem: sourceData[0],
    });

    if (sourceData.length === 0) {
      return [];
    }

    try {
      let filtered = [...sourceData];

      if (searchTerm.trim()) {
        filtered = searchVehicleAccessLogs(filtered, {
          licensePlate: searchTerm.trim(),
        });
      }

      if (Object.keys(searchFilters).length > 0) {
        filtered = searchVehicleAccessLogs(filtered, searchFilters);
      }

      if (sorting.length > 0) {
        const sort = sorting[0];
        filtered = sortVehicleAccessLogs(
          filtered,
          sort.id,
          sort.desc ? "desc" : "asc"
        );
      }

      return filtered;
    } catch (error) {
      console.error("❌ Error processing vehicle access data:", error);
      return sourceData;
    }
  }, [allVehicleAccess, searchFilters, searchTerm, sorting]);

  // Safe statistics calculation
  const statisticsCards: StatisticCard[] = useMemo(() => {
    const defaultCards = [
      {
        key: "total",
        label: "ยานพาหนะทั้งหมด",
        value: 0,
        icon: Car,
        color: "blue",
      },
      {
        key: "successful",
        label: "ผ่านสำเร็จ",
        value: 0,
        icon: CheckCircle,
        color: "green",
      },
      {
        key: "failed",
        label: "ล้มเหลว",
        value: 0,
        icon: XCircle,
        color: "red",
      },
      {
        key: "enabled_gates",
        label: "ประตูใช้งานได้",
        value: 0,
        icon: Shield,
        color: "purple",
      },
      {
        key: "with_images",
        label: "มีรูปภาพ",
        value: 0,
        icon: Camera,
        color: "orange",
      },
    ];

    if (!allVehicleAccess || allVehicleAccess.length === 0) {
      return defaultCards;
    }

    try {
      const stats = getVehicleAccessStatistics(allVehicleAccess);
      return [
        {
          key: "total",
          label: "ยานพาหนะทั้งหมด",
          value: stats.total,
          icon: Car,
          color: "blue",
        },
        {
          key: "successful",
          label: "ผ่านสำเร็จ",
          value: stats.successful,
          icon: CheckCircle,
          color: "green",
        },
        {
          key: "failed",
          label: "ล้มเหลว",
          value: stats.failed,
          icon: XCircle,
          color: "red",
        },
        {
          key: "enabled_gates",
          label: "ประตูใช้งานได้",
          value: Object.values(stats.byGateState).reduce(
            (sum, count) => sum + count,
            0
          ),
          icon: Shield,
          color: "purple",
        },
        {
          key: "with_images",
          label: "มีรูปภาพ",
          value: allVehicleAccess.filter(
            (item) => item.full_snapshot || item.lp_snapshot
          ).length,
          icon: Camera,
          color: "orange",
        },
      ];
    } catch (error) {
      console.error("❌ Error calculating statistics:", error);
      return defaultCards.map((card) => ({
        ...card,
        value: card.key === "total" ? allVehicleAccess.length : 0,
      }));
    }
  }, [allVehicleAccess]);

  // Safe table setup
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
            <DataTableColumnHeader title="ดูรายละเอียด" />
          </div>
        ),
        cell: ({ row }: any) => {
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
              <VehicleAccessActionButton info={row} />
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
    data: processedData || [],
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
      if (value !== undefined && value !== "" && value !== null) {
        let label = "";
        let displayValue = "";

        switch (key) {
          case "licensePlate":
            label = "ป้ายทะเบียน";
            displayValue = value as string;
            break;
          case "tier":
            label = "ประเภท";
            displayValue =
              VEHICLE_TIERS[value as keyof typeof VEHICLE_TIERS]?.label ||
              (value as string);
            break;
          case "areaCode":
            label = "จังหวัด";
            displayValue =
              THAI_AREA_CODES[value as keyof typeof THAI_AREA_CODES] ||
              (value as string);
            break;
          case "gateState":
            label = "สถานะประตู";
            displayValue =
              GATE_STATES[value as keyof typeof GATE_STATES]?.label ||
              (value as string);
            break;
          case "isSuccess":
            label = "สถานะการผ่าน";
            displayValue = value ? "สำเร็จ" : "ล้มเหลว";
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
              delete newFilters[key as keyof VehicleAccessSearchFilters];
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

      const exportData = prepareVehicleAccessDataForExport(selectedData);
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
        `vehicle-access-selected-${new Date().getTime()}.csv`
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

      const exportData = prepareVehicleAccessDataForExport(processedData);
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
        `vehicle-access-all-${new Date().getTime()}.csv`
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

  // Loading state
  if (isLoading) {
    return (
      <div className="p-6 space-y-6">
        <PageHeader
          title="ระบบจัดการการเข้าออกยานพาหนะ"
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

  // Error state
  if (isError && !isFetching) {
    return (
      <div className="p-6">
        <ErrorState
          title="ไม่สามารถโหลดข้อมูลการเข้าออกยานพาหนะได้"
          message={error?.message || "เกิดข้อผิดพลาดในการโหลดข้อมูล"}
          onRetry={() => refetch()}
          isLoading={isFetching}
          showRetry={true}
        />
      </div>
    );
  }

  const totalCount = allVehicleAccess?.length || 0;

  return (
    <div className="p-6 space-y-6">
      <Toaster position="top-right" />

      {/* Page Header */}
      <PageHeader
        title="ระบบจัดการการเข้าออกยานพาหนะ"
        description="ติดตามและจัดการการเข้าออกของยานพาหนะด้วยระบบ AI รู้จำป้ายทะเบียน"
        actions={[
          {
            key: "refresh",
            label: isFetching ? "กำลังโหลด..." : "รีเฟรช",
            icon: RefreshCw,
            onClick: () => refetch(),
            disabled: isFetching,
            variant: "outline",
          },
        ]}
      />

      {/* Statistics Cards */}
      <StatisticsCards
        cards={statisticsCards}
        columns={5}
        loading={isLoading}
      />

      {/* Search and Filters */}
      <VehicleAccessSearch onSearch={setSearchFilters} />

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
          title="ไม่พบข้อมูลการเข้าออกยานพาหนะ"
          description={
            activeFilters.length > 0
              ? "ไม่พบข้อมูลที่ตรงกับเงื่อนไขการค้นหา ลองปรับเปลี่ยนตัวกรองหรือล้างตัวกรอง"
              : "ยังไม่มีประวัติการเข้าออกยานพาหนะในระบบ"
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
