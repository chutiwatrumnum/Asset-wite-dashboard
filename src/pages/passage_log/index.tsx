// src/pages/passage-log/index.tsx
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
import DataTableBody from "../vehicle/components/data-table-body";
import DataTablePagination from "../vehicle/components/data-table-pagination";
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
import DataTableColumnHeader from "../vehicle/components/data-table-column-header";
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