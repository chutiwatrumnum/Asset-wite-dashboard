// src/components/ui/search-results-summary.tsx
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { X, Search } from "lucide-react";
import { cn } from "@/lib/utils";

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface SearchResultsSummaryProps {
  isVisible: boolean;
  resultCount: number;
  totalCount: number;
  activeFilters?: ActiveFilter[];
  onClearAll?: () => void;
  onClearFilters?: () => void;
  className?: string;
  variant?: "default" | "compact";
}

export function SearchResultsSummary({
  isVisible,
  resultCount,
  totalCount,
  activeFilters = [],
  onClearAll,
  onClearFilters,
  className,
  variant = "default",
}: SearchResultsSummaryProps) {
  if (!isVisible) {
    return null;
  }

  const hasActiveFilters = activeFilters.length > 0;

  if (variant === "compact") {
    return (
      <div
        className={cn("flex items-center justify-between text-sm", className)}>
        <div className="text-muted-foreground">
          {hasActiveFilters ? (
            <>
              <Search className="inline h-4 w-4 mr-1" />
              พบ {resultCount.toLocaleString()} จาก{" "}
              {totalCount.toLocaleString()} รายการ
            </>
          ) : (
            `แสดง ${totalCount.toLocaleString()} รายการ`
          )}
        </div>

        {hasActiveFilters && onClearAll && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onClearAll}
            className="h-6 px-2 text-xs text-blue-600 hover:text-blue-700">
            ล้างตัวกรอง
          </Button>
        )}
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Summary */}
      <div className="p-3 bg-blue-50 rounded-lg border border-blue-200">
        <div className="text-sm text-blue-800">
          <span className="font-medium">ผลการค้นหา:</span>
          <span className="ml-2">
            พบ {resultCount.toLocaleString()} รายการ จากทั้งหมด{" "}
            {totalCount.toLocaleString()} รายการ
          </span>
        </div>
      </div>

      {/* Active Filters */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">ตัวกรองที่เลือก:</span>

          {activeFilters.map((filter) => (
            <Badge key={filter.key} variant="secondary" className="gap-1">
              {filter.label}: {filter.value}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={filter.onRemove}
              />
            </Badge>
          ))}

          {/* Clear All Filters */}
          {(onClearAll || onClearFilters) && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onClearAll || onClearFilters}
              className="h-6 px-2 text-xs text-red-500 hover:text-red-700">
              ล้างทั้งหมด
            </Button>
          )}
        </div>
      )}
    </div>
  );
}

export type { ActiveFilter };
export default SearchResultsSummary;
