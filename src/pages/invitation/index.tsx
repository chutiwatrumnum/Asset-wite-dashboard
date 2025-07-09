// src/pages/invitation/index.tsx - โค้ดสมบูรณ์
"use client";

import { useEffect, useState, useMemo } from "react";
import { toast } from "sonner";
import { Toaster } from "@/components/ui/sonner";
import {
  RefreshCw,
  UserPlus,
  TrendingUp,
  AlertTriangle,
  Clock,
  UserCheck,
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
import DataTableBody from "../vehicle/components/data-table-body";
import DataTablePagination from "../vehicle/components/data-table-pagination";
import { CreateInvitationDrawer } from "./components/create-invitation-dialog";
import { InvitationSearch } from "@/components/ui/invitation-search";

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
  useInvitationAllListQuery,
  useBulkDeleteInvitationMutation,
  useExpiringInvitationsQuery,
} from "@/react-query/manage/invitation";
import { Checkbox } from "@/components/ui/checkbox";
import DataTableColumnHeader from "../vehicle/components/data-table-column-header";
import InvitationActionButton from "./components/data-table-action-button";
import {
  searchInvitations,
  getInvitationStatistics,
  prepareInvitationDataForExport,
  sortInvitations,
} from "@/utils/invitationUtils";

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
  // State declarations
  const [pagination, setPagination] = useState<PaginationState>({
    pageIndex: 0,
    pageSize: 10,
  });

  const [sorting, setSorting] = useState<SortingState>([
    { id: "created", desc: true },
  ]);

  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});
  const [searchFilters, setSearchFilters] = useState<InvitationSearchFilters>(
    {}
  );
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);

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
  } = useExpiringInvitationsQuery(24);

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

      if (searchTerm.trim()) {
        filtered = searchInvitations(filtered, {
          visitorName: searchTerm.trim(),
        });
      }

      if (Object.keys(searchFilters).length > 0) {
        filtered = searchInvitations(filtered, searchFilters);
      }

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

  // Calculate statistics for StatisticsCards
  const statisticsCards: StatisticCard[] = useMemo(() => {
    if (!allInvitations || allInvitations.length === 0) {
      return [
        {
          key: "total",
          label: "ทั้งหมด",
          value: 0,
          icon: TrendingUp,
          color: "blue",
        },
        {
          key: "active",
          label: "ใช้งานได้",
          value: 0,
          icon: UserCheck,
          color: "green",
        },
        {
          key: "pending",
          label: "รอเริ่มใช้",
          value: 0,
          icon: Clock,
          color: "yellow",
        },
        {
          key: "expiring",
          label: "ใกล้หมดอายุ",
          value: 0,
          icon: AlertTriangle,
          color: "orange",
        },
        {
          key: "expired",
          label: "หมดอายุ",
          value: 0,
          icon: TrendingUp,
          color: "red",
        },
        {
          key: "inactive",
          label: "ปิดใช้งาน",
          value: 0,
          icon: TrendingUp,
          color: "gray",
        },
      ];
    }

    try {
      const stats = getInvitationStatistics(allInvitations);
      return [
        {
          key: "total",
          label: "ทั้งหมด",
          value: stats.total,
          icon: TrendingUp,
          color: "blue",
        },
        {
          key: "active",
          label: "ใช้งานได้",
          value: stats.active,
          icon: UserCheck,
          color: "green",
        },
        {
          key: "pending",
          label: "รอเริ่มใช้",
          value: stats.pending,
          icon: Clock,
          color: "yellow",
        },
        {
          key: "expiring",
          label: "ใกล้หมดอายุ",
          value: stats.expiring,
          icon: AlertTriangle,
          color: "orange",
        },
        {
          key: "expired",
          label: "หมดอายุ",
          value: stats.expired,
          icon: TrendingUp,
          color: "red",
        },
        {
          key: "inactive",
          label: "ปิดใช้งาน",
          value: stats.inactive,
          icon: TrendingUp,
          color: "gray",
        },
      ];
    } catch (error) {
      console.error("Error calculating statistics:", error);
      return [
        {
          key: "total",
          label: "ทั้งหมด",
          value: allInvitations.length,
          icon: TrendingUp,
          color: "blue",
        },
        {
          key: "active",
          label: "ใช้งานได้",
          value: 0,
          icon: UserCheck,
          color: "green",
        },
        {
          key: "pending",
          label: "รอเริ่มใช้",
          value: 0,
          icon: Clock,
          color: "yellow",
        },
        {
          key: "expiring",
          label: "ใกล้หมดอายุ",
          value: 0,
          icon: AlertTriangle,
          color: "orange",
        },
        {
          key: "expired",
          label: "หมดอายุ",
          value: 0,
          icon: TrendingUp,
          color: "red",
        },
        {
          key: "inactive",
          label: "ปิดใช้งาน",
          value: 0,
          icon: TrendingUp,
          color: "gray",
        },
      ];
    }
  }, [allInvitations]);

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

  const handleCreateInvitation = () => {
    console.log("handleCreateInvitation called");
    console.log("Current createDialogOpen:", createDialogOpen);
    setCreateDialogOpen(true);
    console.log("setCreateDialogOpen(true) called");
  };

  const handleInvitationCreated = () => {
    refetch();
    setCreateDialogOpen(false);
  };

  const handleBulkDelete = async () => {
    try {
      const selectedIds = Object.keys(rowSelection);
      await bulkDeleteInvitation(selectedIds);
      setRowSelection({});
      await refetch();
    } catch (error) {
      console.error("Bulk delete failed:", error);
    }
  };

  const handleExportCSV = async () => {
    if (!processedData.length) {
      toast.warning("ไม่มีข้อมูลสำหรับส่งออก");
      return;
    }

    try {
      const exportData = prepareInvitationDataForExport(processedData);
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
      link.download = `invitations_${new Date().toISOString().split("T")[0]}.csv`;
      link.click();

      toast.success(`ส่งออกข้อมูล ${exportData.length} รายการสำเร็จ`);
    } catch (error) {
      console.error("Export error:", error);
      toast.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    }
  };

  const handleExportSelected = async () => {
    const selectedIds = Object.keys(rowSelection);
    const selectedData = processedData.filter((item) =>
      selectedIds.includes(item.id)
    );

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
            label: key === "status" ? "สถานะ" : key,
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

  // Debug log for createDialogOpen state
  useEffect(() => {
    console.log("createDialogOpen changed to:", createDialogOpen);
  }, [createDialogOpen]);

  // Table configuration
  const table = useReactTable({
    initialState: { columnVisibility: { id: false } },
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
    autoResetPageIndex: false,
    state: { pagination, sorting, rowSelection },
  });

  // Show error state
  if (isError || error) {
    return (
      <div className="w-full pl-10 pr-10">
        <ErrorState
          title="เกิดข้อผิดพลาด"
          message={error?.message || "ไม่สามารถโหลดข้อมูลบัตรเชิญได้"}
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
        title="จัดการบัตรเชิญ (E-invitation)"
        description="จัดการบัตรเชิญสำหรับผู้เยี่ยมทั้งหมดในระบบ สร้าง แก้ไข หรือลบบัตรเชิญ"
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
            label: "สร้างบัตรเชิญ",
            icon: UserPlus,
            onClick: handleCreateInvitation,
            variant: "default",
          },
        ]}
        alerts={
          !isLoadingExpiring &&
          !expiringError &&
          expiringInvitations &&
          expiringInvitations.length > 0
            ? [
                {
                  type: "warning",
                  message: "มีบัตรเชิญใกล้หมดอายุ",
                  description: "ภายใน 24 ชั่วโมง",
                  count: expiringInvitations.length,
                },
              ]
            : []
        }
        statistics={
          <StatisticsCards cards={statisticsCards} loading={isLoading} />
        }
      />

      {/* Search Component */}
      <InvitationSearch onSearch={setSearchFilters} />

      {/* Search Results Summary */}
      <SearchResultsSummary
        isVisible={hasActiveFilters}
        resultCount={processedData.length}
        totalCount={allInvitations?.length || 0}
        activeFilters={activeFilters}
        onClearAll={() => {
          setSearchFilters({});
          setSearchTerm("");
        }}
      />

      <div className="rounded-md border">
        {/* แสดงข้อมูลสรุปและการจัดการคอลัมน์ */}
        <div className="flex items-center justify-between py-4 px-4 border-b">
          <div className="text-sm text-muted-foreground">
            แสดง {processedData.length.toLocaleString()} รายการ
            {Object.keys(rowSelection).length > 0 && (
              <span className="ml-2 text-blue-600">
                (เลือก {Object.keys(rowSelection).length.toLocaleString()}{" "}
                รายการ)
              </span>
            )}
          </div>

          {/* การจัดการคอลัมน์ */}
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
                      onCheckedChange={(value) =>
                        column.toggleVisibility(value)
                      }>
                      {getColumnDisplayName(column.id)}
                    </DropdownMenuCheckboxItem>
                  );
                })}
            </DropdownMenuContent>
          </DropdownMenu>
        </div>

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
        ) : processedData.length === 0 && !hasActiveFilters ? (
          <EmptyState
            icon={Search}
            title="ไม่มีข้อมูลบัตรเชิญ"
            description="เริ่มต้นด้วยการสร้างบัตรเชิญใหม่"
            actions={[
              {
                key: "create",
                label: "สร้างบัตรเชิญ",
                onClick: handleCreateInvitation,
                icon: UserPlus,
              },
            ]}
          />
        ) : processedData.length === 0 && hasActiveFilters ? (
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
          totalRows={processedData.length}
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

      {/* CreateInvitationDrawer */}
      <CreateInvitationDrawer
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
        onInvitationCreated={handleInvitationCreated}
        showTriggerButton={false}
      />

      <Toaster />
    </div>
  );
}

// Helper function to convert column IDs to Thai display names
function getColumnDisplayName(columnId: string): string {
  const columnNames: Record<string, string> = {
    // Common columns
    id: "รหัส",
    created: "วันที่สร้าง",
    updated: "อัปเดตล่าสุด",

    // Invitation columns
    visitor_name: "ชื่อผู้เยี่ยม",
    house_id: "บ้าน",
    authorized_area: "พื้นที่อนุญาต",
    start_time: "เวลาเริ่มต้น",
    expire_time: "เวลาสิ้นสุด",
    duration: "ระยะเวลา",
    combined_status: "สถานะการใช้งาน",
    issuer: "ผู้สร้าง",
    note: "หมายเหตุ",

    // Actions
    action: "การดำเนินการ",
    select: "เลือก",
  };

  return columnNames[columnId] || columnId.replace(/_/g, " ");
}
