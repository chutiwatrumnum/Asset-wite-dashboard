// src/components/ui/vehicle-access-search.tsx
import { useState } from "react";
import { Search, Filter, X, Calendar, Car } from "lucide-react";
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
  VEHICLE_TIERS,
  GATE_STATES,
  THAI_AREA_CODES,
} from "@/utils/vehicleAccessUtils";

interface VehicleAccessSearchProps {
  onSearch: (filters: {
    licensePlate?: string;
    tier?: string;
    areaCode?: string;
    gateState?: string;
    isSuccess?: boolean;
    dateRange?: {
      start?: string;
      end?: string;
    };
  }) => void;
}

export function VehicleAccessSearch({ onSearch }: VehicleAccessSearchProps) {
  const [licensePlate, setLicensePlate] = useState("");
  const [tier, setTier] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [gateState, setGateState] = useState("");
  const [isSuccess, setIsSuccess] = useState<boolean | undefined>(undefined);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleSearch = () => {
    onSearch({
      licensePlate: licensePlate || undefined,
      tier: tier || undefined,
      areaCode: areaCode || undefined,
      gateState: gateState || undefined,
      isSuccess: isSuccess,
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
    setLicensePlate("");
    setTier("");
    setAreaCode("");
    setGateState("");
    setIsSuccess(undefined);
    setStartDate("");
    setEndDate("");
    onSearch({});
  };

  const hasActiveFilters =
    licensePlate ||
    tier ||
    areaCode ||
    gateState ||
    isSuccess !== undefined ||
    startDate ||
    endDate;

  const activeFilterCount = [
    licensePlate,
    tier,
    areaCode,
    gateState,
    isSuccess !== undefined ? "status" : "",
    startDate,
    endDate,
  ].filter(Boolean).length;

  const tierOptions = Object.entries(VEHICLE_TIERS).map(([key, value]) => ({
    value: key,
    label: value.label,
  }));

  const gateStateOptions = Object.entries(GATE_STATES).map(([key, value]) => ({
    value: key,
    label: value.label,
  }));

  const statusOptions = [
    { value: "true", label: "สำเร็จ" },
    { value: "false", label: "ล้มเหลว" },
  ];

  const areaCodeOptions = Object.entries(THAI_AREA_CODES).map(
    ([key, value]) => ({
      value: key,
      label: value,
    })
  );

  return (
    <div className="space-y-3">
      {/* Main Search Bar */}
      <div className="flex gap-2">
        <div className="flex-1 relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
          <Input
            placeholder="ค้นหาป้ายทะเบียน... (เช่น กข 1234, 1กค234)"
            value={licensePlate}
            onChange={(e) => setLicensePlate(e.target.value)}
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

              {/* Vehicle Tier Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">ประเภทยานพาหนะ</label>
                <Select value={tier} onValueChange={setTier}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกประเภท" />
                  </SelectTrigger>
                  <SelectContent>
                    {tierOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Area Code Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">จังหวัด</label>
                <Select value={areaCode} onValueChange={setAreaCode}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกจังหวัด" />
                  </SelectTrigger>
                  <SelectContent className="max-h-60">
                    {areaCodeOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Gate State Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">สถานะประตู</label>
                <Select value={gateState} onValueChange={setGateState}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกสถานะ" />
                  </SelectTrigger>
                  <SelectContent>
                    {gateStateOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Success Status Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">สถานะการผ่าน</label>
                <Select
                  value={isSuccess === undefined ? "" : isSuccess.toString()}
                  onValueChange={(value) =>
                    setIsSuccess(value === "" ? undefined : value === "true")
                  }>
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

          {licensePlate && (
            <Badge variant="secondary" className="gap-1">
              <Car className="h-3 w-3" />
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

          {tier && (
            <Badge variant="secondary" className="gap-1">
              ประเภท: {VEHICLE_TIERS[tier as keyof typeof VEHICLE_TIERS]?.label}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setTier("");
                  handleSearch();
                }}
              />
            </Badge>
          )}

          {areaCode && (
            <Badge variant="secondary" className="gap-1">
              จังหวัด:{" "}
              {THAI_AREA_CODES[areaCode as keyof typeof THAI_AREA_CODES]}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setAreaCode("");
                  handleSearch();
                }}
              />
            </Badge>
          )}

          {gateState && (
            <Badge variant="secondary" className="gap-1">
              ประตู: {GATE_STATES[gateState as keyof typeof GATE_STATES]?.label}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setGateState("");
                  handleSearch();
                }}
              />
            </Badge>
          )}

          {isSuccess !== undefined && (
            <Badge variant="secondary" className="gap-1">
              สถานะ: {isSuccess ? "สำเร็จ" : "ล้มเหลว"}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setIsSuccess(undefined);
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
