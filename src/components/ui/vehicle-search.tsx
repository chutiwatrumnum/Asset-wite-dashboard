// src/components/ui/vehicle-search.tsx - Component สำหรับค้นหายานพาหนะ (ลบ tier ออก)
import { useState } from "react";
import { Search, Filter, X } from "lucide-react";
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
import { THAI_PROVINCES } from "@/utils/vehicleUtils";

interface VehicleSearchProps {
  onSearch: (filters: {
    licensePlate?: string;
    areaCode?: string;
    status?: string;
  }) => void;
}

const statusOptions = [
  { value: "active", label: "ใช้งานได้" },
  { value: "expired", label: "หมดอายุ" },
  { value: "expiring", label: "ใกล้หมดอายุ" },
];

export function VehicleSearch({ onSearch }: VehicleSearchProps) {
  const [licensePlate, setLicensePlate] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [status, setStatus] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleSearch = () => {
    onSearch({
      licensePlate: licensePlate || undefined,
      areaCode: areaCode || undefined,
      status: status || undefined,
    });
  };

  const handleReset = () => {
    setLicensePlate("");
    setAreaCode("");
    setStatus("");
    onSearch({});
  };

  const hasActiveFilters = licensePlate || areaCode || status;
  const activeFilterCount = [licensePlate, areaCode, status].filter(
    Boolean
  ).length;

  return (
    <div className="space-y-3">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="ค้นหาป้ายทะเบียน..."
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value.toUpperCase())}
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

              {/* Area Code Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">จังหวัด</label>
                <Select value={areaCode} onValueChange={setAreaCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกจังหวัด" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {Object.entries(THAI_PROVINCES).map(([value, label]) => (
                      <SelectItem key={value} value={value}>
                        {label}
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

          {licensePlate && (
            <Badge variant="secondary" className="gap-1">
              ป้ายทะเบียน: {licensePlate}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setLicensePlate("");
                  handleSearch();
                }}
              />
            </Badge>
          )}

          {areaCode && (
            <Badge variant="secondary" className="gap-1">
              จังหวัด: {THAI_PROVINCES[areaCode] || areaCode}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setAreaCode("");
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
