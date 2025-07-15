// src/components/ui/passage-log-search.tsx
import { useState } from "react";
import { Search, Filter, X, Calendar } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Badge } from "@/components/ui/badge";
import {
  PASSAGE_STATUS,
  VERIFICATION_METHODS,
  PASSAGE_TYPES,
} from "@/utils/passageLogUtils";

interface PassageLogSearchProps {
  onSearch: (filters: {
    visitorName?: string;
    passageType?: "entry" | "exit";
    locationArea?: string;
    verificationMethod?: string;
    status?: string;
    dateRange?: {
      start?: string;
      end?: string;
    };
  }) => void;
}

const statusOptions = Object.entries(PASSAGE_STATUS).map(([key, value]) => ({
  value: key,
  label: value.label,
}));

const verificationMethodOptions = Object.entries(VERIFICATION_METHODS).map(
  ([key, value]) => ({
    value: key,
    label: value.label,
  })
);

const passageTypeOptions = Object.entries(PASSAGE_TYPES).map(
  ([key, value]) => ({
    value: key,
    label: value.label,
  })
);

export function PassageLogSearch({ onSearch }: PassageLogSearchProps) {
  const [visitorName, setVisitorName] = useState("");
  const [passageType, setPassageType] = useState("");
  const [locationArea, setLocationArea] = useState("");
  const [verificationMethod, setVerificationMethod] = useState("");
  const [status, setStatus] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleSearch = () => {
    onSearch({
      visitorName: visitorName || undefined,
      passageType: (passageType as "entry" | "exit") || undefined,
      locationArea: locationArea || undefined,
      verificationMethod: verificationMethod || undefined,
      status: status || undefined,
      dateRange:
        startDate || endDate
          ? {
              start: startDate || undefined,
              end: endDate || undefined,
            }
          : undefined,
    });
  };

  const handleReset = () => {
    setVisitorName("");
    setPassageType("");
    setLocationArea("");
    setVerificationMethod("");
    setStatus("");
    setStartDate("");
    setEndDate("");
    onSearch({});
  };

  const hasActiveFilters =
    visitorName ||
    passageType ||
    locationArea ||
    verificationMethod ||
    status ||
    startDate ||
    endDate;
  const activeFilterCount = [
    visitorName,
    passageType,
    locationArea,
    verificationMethod,
    status,
    startDate,
    endDate,
  ].filter(Boolean).length;

  return (
    <div className="space-y-3">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="ค้นหาชื่อผู้เยี่ยม..."
            value={visitorName}
            onChange={(e) => setVisitorName(e.target.value)}
            className="pl-10"
            onKeyDown={(e) => e.key === "Enter" && handleSearch()}
          />
        </div>

        {/* Advanced Filter Button */}
        <Popover open={isAdvancedOpen} onOpenChange={setIsAdvancedOpen}>
          <PopoverTrigger asChild>
            <Button
              variant="outline"
              className={`gap-2 relative ${hasActiveFilters ? "border-blue-500" : ""}`}>
              <Filter className="h-4 w-4" />
              ตัวกรอง
              {activeFilterCount > 0 && (
                <Badge
                  variant="secondary"
                  className="absolute -top-2 -right-2 h-5 w-5 p-0 flex items-center justify-center text-xs bg-blue-500 text-white">
                  {activeFilterCount}
                </Badge>
              )}
            </Button>
          </PopoverTrigger>
          <PopoverContent className="w-80 p-4" align="end">
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <h4 className="font-medium">ตัวกรองขั้นสูง</h4>
                {hasActiveFilters && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={handleReset}
                    className="h-auto p-1 text-red-500 hover:text-red-700">
                    <X className="h-4 w-4" />
                  </Button>
                )}
              </div>

              {/* Passage Type Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">ประเภทการผ่าน</label>
                <Select value={passageType} onValueChange={setPassageType}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    {passageTypeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Verification Method Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">วิธีการยืนยัน</label>
                <Select
                  value={verificationMethod}
                  onValueChange={setVerificationMethod}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกวิธียืนยัน" />
                  </SelectTrigger>
                  <SelectContent>
                    {verificationMethodOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">สถานะ</label>
                <Select value={status} onValueChange={setStatus}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    {statusOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Date Range Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">ช่วงวันที่</label>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <Input
                      type="date"
                      value={startDate}
                      onChange={(e) => setStartDate(e.target.value)}
                      placeholder="วันที่เริ่ม"
                    />
                  </div>
                  <div>
                    <Input
                      type="date"
                      value={endDate}
                      onChange={(e) => setEndDate(e.target.value)}
                      placeholder="วันที่สิ้นสุด"
                    />
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex gap-2 pt-2">
                <Button onClick={handleSearch} size="sm" className="flex-1">
                  ค้นหา
                </Button>
                <Button
                  variant="outline"
                  onClick={handleReset}
                  size="sm"
                  disabled={!hasActiveFilters}>
                  รีเซ็ต
                </Button>
              </div>
            </div>
          </PopoverContent>
        </Popover>

        <Button onClick={handleSearch} className="gap-2">
          <Search className="h-4 w-4" />
          ค้นหา
        </Button>
      </div>

      {/* Active Filters Display */}
      {hasActiveFilters && (
        <div className="flex flex-wrap gap-2 items-center">
          <span className="text-sm text-gray-600">ตัวกรองที่เลือก:</span>

          {visitorName && (
            <Badge variant="secondary" className="gap-1">
              ชื่อผู้เยี่ยม: {visitorName}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setVisitorName("");
                  handleSearch();
                }}
              />
            </Badge>
          )}

          {passageType && (
            <Badge variant="secondary" className="gap-1">
              ประเภท:{" "}
              {passageTypeOptions.find((s) => s.value === passageType)?.label}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setPassageType("");
                  handleSearch();
                }}
              />
            </Badge>
          )}

          {verificationMethod && (
            <Badge variant="secondary" className="gap-1">
              วิธียืนยัน:{" "}
              {
                verificationMethodOptions.find(
                  (s) => s.value === verificationMethod
                )?.label
              }
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setVerificationMethod("");
                  handleSearch();
                }}
              />
            </Badge>
          )}

          {status && (
            <Badge variant="secondary" className="gap-1">
              สถานะ: {statusOptions.find((s) => s.value === status)?.label}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setStatus("");
                  handleSearch();
                }}
              />
            </Badge>
          )}

          {(startDate || endDate) && (
            <Badge variant="secondary" className="gap-1">
              <Calendar className="h-3 w-3" />
              {startDate && endDate
                ? `${startDate} - ${endDate}`
                : startDate
                  ? `จาก ${startDate}`
                  : `ถึง ${endDate}`}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setStartDate("");
                  setEndDate("");
                  handleSearch();
                }}
              />
            </Badge>
          )}

          <Button
            variant="ghost"
            size="sm"
            onClick={handleReset}
            className="h-6 px-2 text-xs text-red-500 hover:text-red-700">
            ล้างทั้งหมด
          </Button>
        </div>
      )}
    </div>
  );
}
