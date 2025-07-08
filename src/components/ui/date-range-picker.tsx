// src/components/ui/date-range-picker.tsx - แก้ไข import
import { useState } from "react"; // เพิ่มบรรทัดนี้
import { Calendar, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface DateRange {
  start?: string;
  end?: string;
}

interface DateRangePickerProps {
  value?: DateRange;
  onChange: (dateRange: DateRange | undefined) => void;
  placeholder?: string;
  label?: string;
  className?: string;
  disabled?: boolean;
  required?: boolean;
  clearable?: boolean;
  format?: "date" | "datetime-local";
  presets?: Array<{
    label: string;
    value: DateRange;
  }>;
}

// Default presets for common date ranges
const defaultPresets = [
  {
    label: "วันนี้",
    value: {
      start: new Date().toISOString().split("T")[0],
      end: new Date().toISOString().split("T")[0],
    },
  },
  {
    label: "7 วันที่ผ่านมา",
    value: {
      start: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      end: new Date().toISOString().split("T")[0],
    },
  },
  {
    label: "30 วันที่ผ่านมา",
    value: {
      start: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString()
        .split("T")[0],
      end: new Date().toISOString().split("T")[0],
    },
  },
  {
    label: "เดือนนี้",
    value: {
      start: new Date(new Date().getFullYear(), new Date().getMonth(), 1)
        .toISOString()
        .split("T")[0],
      end: new Date().toISOString().split("T")[0],
    },
  },
  {
    label: "เดือนที่แล้ว",
    value: (() => {
      const lastMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth() - 1,
        1
      );
      const lastDayOfLastMonth = new Date(
        new Date().getFullYear(),
        new Date().getMonth(),
        0
      );
      return {
        start: lastMonth.toISOString().split("T")[0],
        end: lastDayOfLastMonth.toISOString().split("T")[0],
      };
    })(),
  },
];

export function DateRangePicker({
  value,
  onChange,
  placeholder = "เลือกช่วงวันที่",
  label,
  className,
  disabled = false,
  required = false,
  clearable = true,
  format = "date",
  presets = defaultPresets,
}: DateRangePickerProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [localStart, setLocalStart] = useState(value?.start || "");
  const [localEnd, setLocalEnd] = useState(value?.end || "");

  const formatDate = (dateString: string) => {
    if (!dateString) return "";
    try {
      return new Date(dateString).toLocaleDateString("th-TH", {
        year: "numeric",
        month: "short",
        day: "numeric",
      });
    } catch {
      return dateString;
    }
  };

  const getDisplayValue = () => {
    if (!value?.start && !value?.end) return "";

    if (value.start && value.end) {
      return `${formatDate(value.start)} - ${formatDate(value.end)}`;
    }

    if (value.start) {
      return `จาก ${formatDate(value.start)}`;
    }

    if (value.end) {
      return `ถึง ${formatDate(value.end)}`;
    }

    return "";
  };

  const handleApply = () => {
    const newRange: DateRange = {};

    if (localStart) newRange.start = localStart;
    if (localEnd) newRange.end = localEnd;

    // Validate date range
    if (newRange.start && newRange.end && newRange.start > newRange.end) {
      // Swap dates if start is after end
      const temp = newRange.start;
      newRange.start = newRange.end;
      newRange.end = temp;
    }

    onChange(Object.keys(newRange).length > 0 ? newRange : undefined);
    setIsOpen(false);
  };

  const handleClear = () => {
    setLocalStart("");
    setLocalEnd("");
    onChange(undefined);
    setIsOpen(false);
  };

  const handlePresetSelect = (preset: DateRange) => {
    setLocalStart(preset.start || "");
    setLocalEnd(preset.end || "");
    onChange(preset);
    setIsOpen(false);
  };

  const handleCancel = () => {
    setLocalStart(value?.start || "");
    setLocalEnd(value?.end || "");
    setIsOpen(false);
  };

  return (
    <div className={cn("space-y-2", className)}>
      {label && (
        <Label>
          {label}
          {required && <span className="text-red-500 ml-1">*</span>}
        </Label>
      )}

      <Popover open={isOpen} onOpenChange={setIsOpen}>
        <PopoverTrigger asChild>
          <Button
            variant="outline"
            className={cn(
              "w-full justify-start text-left font-normal",
              !getDisplayValue() && "text-muted-foreground"
            )}
            disabled={disabled}>
            <Calendar className="mr-2 h-4 w-4" />
            {getDisplayValue() || placeholder}
          </Button>
        </PopoverTrigger>

        <PopoverContent className="w-auto p-4" align="start">
          <div className="space-y-4">
            <div className="space-y-2">
              <h4 className="font-medium text-sm">เลือกช่วงวันที่</h4>

              {/* Manual Date Input */}
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <Label htmlFor="start-date" className="text-xs">
                    วันที่เริ่ม
                  </Label>
                  <Input
                    id="start-date"
                    type={format}
                    value={localStart}
                    onChange={(e) => setLocalStart(e.target.value)}
                    className="mt-1"
                  />
                </div>
                <div>
                  <Label htmlFor="end-date" className="text-xs">
                    วันที่สิ้นสุด
                  </Label>
                  <Input
                    id="end-date"
                    type={format}
                    value={localEnd}
                    onChange={(e) => setLocalEnd(e.target.value)}
                    className="mt-1"
                  />
                </div>
              </div>
            </div>

            {/* Presets */}
            {presets.length > 0 && (
              <div className="space-y-2">
                <Label className="text-xs">ตัวเลือกด่วน</Label>
                <div className="flex flex-wrap gap-1">
                  {presets.map((preset, index) => (
                    <Badge
                      key={index}
                      variant="outline"
                      className="cursor-pointer hover:bg-accent text-xs"
                      onClick={() => handlePresetSelect(preset.value)}>
                      {preset.label}
                    </Badge>
                  ))}
                </div>
              </div>
            )}

            {/* Actions */}
            <div className="flex items-center justify-between pt-2">
              <div>
                {clearable && getDisplayValue() && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleClear}
                    className="h-8 px-2 text-red-600 hover:text-red-700">
                    <X className="h-3 w-3 mr-1" />
                    ล้าง
                  </Button>
                )}
              </div>

              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={handleCancel}>
                  ยกเลิก
                </Button>
                <Button size="sm" onClick={handleApply}>
                  ตกลง
                </Button>
              </div>
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}

// Hook for easier state management
export function useDateRange(initialValue?: DateRange) {
  const [dateRange, setDateRange] = useState<DateRange | undefined>(
    initialValue
  );

  const clearDateRange = () => setDateRange(undefined);

  const isDateRangeSet = dateRange && (dateRange.start || dateRange.end);

  return {
    dateRange,
    setDateRange,
    clearDateRange,
    isDateRangeSet: !!isDateRangeSet,
  };
}

export type { DateRange };
export default DateRangePicker;
