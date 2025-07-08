// src/components/ui/advanced-search-panel.tsx
import { useState } from "react";
import { Search, Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { DateRangePicker, DateRange } from "./date-range-picker";
import { cn } from "@/lib/utils";

interface SearchField {
  key: string;
  label: string;
  type: "text" | "select" | "dateRange" | "multiSelect";
  placeholder?: string;
  options?: Array<{
    value: string;
    label: string;
    disabled?: boolean;
  }>;
  required?: boolean;
  disabled?: boolean;
  validation?: (value: any) => string | null;
}

interface SearchFilters {
  [key: string]: any;
}

interface ActiveFilter {
  key: string;
  label: string;
  value: string;
  onRemove: () => void;
}

interface AdvancedSearchPanelProps {
  fields: SearchField[];
  onSearch: (filters: SearchFilters) => void;
  onClear?: () => void;
  initialFilters?: SearchFilters;
  className?: string;
  collapsible?: boolean;
  defaultExpanded?: boolean;
  showQuickSearch?: boolean;
  quickSearchPlaceholder?: string;
  showFilterCount?: boolean;
  layout?: "vertical" | "horizontal" | "grid";
  columns?: number;
}

export function AdvancedSearchPanel({
  fields,
  onSearch,
  onClear,
  initialFilters = {},
  className,
  collapsible = true,
  defaultExpanded = false,
  showQuickSearch = true,
  quickSearchPlaceholder = "ค้นหา...",
  showFilterCount = true,
  layout = "grid",
  columns = 2,
}: AdvancedSearchPanelProps) {
  const [isExpanded, setIsExpanded] = useState(defaultExpanded);
  const [filters, setFilters] = useState<SearchFilters>(initialFilters);
  const [quickSearch, setQuickSearch] = useState("");

  // Get active filters for display
  const getActiveFilters = (): ActiveFilter[] => {
    const activeFilters: ActiveFilter[] = [];

    // Quick search
    if (quickSearch.trim()) {
      activeFilters.push({
        key: "quickSearch",
        label: "ค้นหา",
        value: quickSearch,
        onRemove: () => {
          setQuickSearch("");
          handleSearch({ ...filters }, "");
        },
      });
    }

    // Field filters
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== "" && value !== null) {
        const field = fields.find((f) => f.key === key);
        if (!field) return;

        let displayValue = "";

        if (field.type === "dateRange" && typeof value === "object") {
          const dateRange = value as DateRange;
          if (dateRange.start || dateRange.end) {
            displayValue = `${dateRange.start || ""} - ${dateRange.end || ""}`;
          }
        } else if (field.type === "select") {
          const option = field.options?.find((opt) => opt.value === value);
          displayValue = option?.label || value;
        } else if (field.type === "multiSelect" && Array.isArray(value)) {
          displayValue = `${value.length} รายการ`;
        } else {
          displayValue = String(value);
        }

        if (displayValue) {
          activeFilters.push({
            key,
            label: field.label,
            value: displayValue,
            onRemove: () => {
              const newFilters = { ...filters };
              delete newFilters[key];
              setFilters(newFilters);
              handleSearch(newFilters, quickSearch);
            },
          });
        }
      }
    });

    return activeFilters;
  };

  const activeFilters = getActiveFilters();
  const hasActiveFilters = activeFilters.length > 0;

  const handleFieldChange = (key: string, value: any) => {
    const newFilters = { ...filters, [key]: value };
    setFilters(newFilters);
  };

  const handleSearch = (
    searchFilters: SearchFilters = filters,
    search: string = quickSearch
  ) => {
    const allFilters: SearchFilters = { ...searchFilters };

    if (search.trim()) {
      allFilters.quickSearch = search.trim();
    }

    onSearch(allFilters);
  };

  const handleClear = () => {
    setFilters({});
    setQuickSearch("");
    onClear?.();
    onSearch({});
  };

  const handleQuickSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    handleSearch();
  };

  const renderField = (field: SearchField) => {
    const value = filters[field.key];

    switch (field.type) {
      case "text":
        return (
          <Input
            placeholder={field.placeholder}
            value={value || ""}
            onChange={(e) => handleFieldChange(field.key, e.target.value)}
            disabled={field.disabled}
          />
        );

      case "select":
        return (
          <Select
            value={value || ""}
            onValueChange={(val) => handleFieldChange(field.key, val)}
            disabled={field.disabled}>
            <SelectTrigger>
              <SelectValue placeholder={field.placeholder} />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      case "dateRange":
        return (
          <DateRangePicker
            value={value}
            onChange={(dateRange) => handleFieldChange(field.key, dateRange)}
            disabled={field.disabled}
            placeholder={field.placeholder}
          />
        );

      case "multiSelect":
        // Simple multi-select implementation
        return (
          <Select
            value=""
            onValueChange={(val) => {
              const currentValues = Array.isArray(value) ? value : [];
              if (!currentValues.includes(val)) {
                handleFieldChange(field.key, [...currentValues, val]);
              }
            }}
            disabled={field.disabled}>
            <SelectTrigger>
              <SelectValue
                placeholder={
                  Array.isArray(value) && value.length > 0
                    ? `เลือกแล้ว ${value.length} รายการ`
                    : field.placeholder
                }
              />
            </SelectTrigger>
            <SelectContent>
              {field.options?.map((option) => (
                <SelectItem
                  key={option.value}
                  value={option.value}
                  disabled={option.disabled}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        );

      default:
        return null;
    }
  };

  const getLayoutClasses = () => {
    switch (layout) {
      case "vertical":
        return "space-y-4";
      case "horizontal":
        return "flex flex-wrap gap-4 items-end";
      case "grid":
        return `grid gap-4 grid-cols-1 md:grid-cols-${columns}`;
      default:
        return `grid gap-4 grid-cols-1 md:grid-cols-${columns}`;
    }
  };

  const searchPanel = (
    <Card className={className}>
      {collapsible && (
        <CardHeader className="pb-3">
          <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
            <CollapsibleTrigger asChild>
              <div className="flex items-center justify-between cursor-pointer">
                <CardTitle className="flex items-center gap-2 text-base">
                  <Filter className="h-4 w-4" />
                  ค้นหาขั้นสูง
                  {showFilterCount && hasActiveFilters && (
                    <Badge variant="secondary" className="ml-2">
                      {activeFilters.length}
                    </Badge>
                  )}
                </CardTitle>
                {isExpanded ? (
                  <ChevronUp className="h-4 w-4" />
                ) : (
                  <ChevronDown className="h-4 w-4" />
                )}
              </div>
            </CollapsibleTrigger>
          </Collapsible>
        </CardHeader>
      )}

      {(!collapsible || isExpanded) && (
        <CardContent className={collapsible ? "pt-0" : "pt-6"}>
          <div className="space-y-4">
            {/* Quick Search */}
            {showQuickSearch && (
              <form onSubmit={handleQuickSearchSubmit} className="flex gap-2">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder={quickSearchPlaceholder}
                    value={quickSearch}
                    onChange={(e) => setQuickSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Button type="submit" className="gap-2">
                  <Search className="h-4 w-4" />
                  ค้นหา
                </Button>
              </form>
            )}

            {/* Advanced Fields */}
            {fields.length > 0 && (
              <div className={getLayoutClasses()}>
                {fields.map((field) => (
                  <div key={field.key} className="space-y-2">
                    <Label>
                      {field.label}
                      {field.required && (
                        <span className="text-red-500 ml-1">*</span>
                      )}
                    </Label>
                    {renderField(field)}
                  </div>
                ))}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex gap-2 pt-2">
              <Button onClick={() => handleSearch()} className="gap-2">
                <Search className="h-4 w-4" />
                ค้นหา
              </Button>
              <Button
                variant="outline"
                onClick={handleClear}
                disabled={!hasActiveFilters}
                className="gap-2">
                <X className="h-4 w-4" />
                ล้างตัวกรอง
              </Button>
            </div>
          </div>
        </CardContent>
      )}

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <CardContent className="pt-0">
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
            <Button
              variant="ghost"
              size="sm"
              onClick={handleClear}
              className="h-6 px-2 text-xs text-red-500 hover:text-red-700">
              ล้างทั้งหมด
            </Button>
          </div>
        </CardContent>
      )}
    </Card>
  );

  if (collapsible) {
    return (
      <Collapsible open={isExpanded} onOpenChange={setIsExpanded}>
        {searchPanel}
      </Collapsible>
    );
  }

  return searchPanel;
}

export type { SearchField, SearchFilters, ActiveFilter };
export default AdvancedSearchPanel;
