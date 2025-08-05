// src/components/ui/visitor-search.tsx
import { useState } from "react";
import { Search, Filter, X, Calendar, User } from "lucide-react";
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
import { VISITOR_GENDERS, THAI_PROVINCES } from "@/utils/visitorUtils";

interface VisitorSearchProps {
  onSearch: (filters: {
    firstName?: string;
    lastName?: string;
    licensePlate?: string;
    gender?: string;
    idCard?: string;
    areaCode?: string;
    dateRange?: {
      start?: string;
      end?: string;
    };
  }) => void;
}

export function VisitorSearch({ onSearch }: VisitorSearchProps) {
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [licensePlate, setLicensePlate] = useState("");
  const [gender, setGender] = useState("");
  const [idCard, setIdCard] = useState("");
  const [areaCode, setAreaCode] = useState("");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [isAdvancedOpen, setIsAdvancedOpen] = useState(false);

  const handleSearch = () => {
    onSearch({
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      licensePlate: licensePlate || undefined,
      gender: gender || undefined,
      idCard: idCard || undefined,
      areaCode: areaCode || undefined,
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
    setFirstName("");
    setLastName("");
    setLicensePlate("");
    setGender("");
    setIdCard("");
    setAreaCode("");
    setStartDate("");
    setEndDate("");
    onSearch({});
  };

  const hasActiveFilters =
    firstName ||
    lastName ||
    licensePlate ||
    gender ||
    idCard ||
    areaCode ||
    startDate ||
    endDate;

  const activeFilterCount = [
    firstName,
    lastName,
    licensePlate,
    gender,
    idCard,
    areaCode,
    startDate,
    endDate,
  ].filter(Boolean).length;

  const genderOptions = Object.entries(VISITOR_GENDERS).map(([key, value]) => ({
    value: key,
    label: value.label,
  }));

  const areaCodeOptions = Object.entries(THAI_PROVINCES).map(
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
            placeholder="ค้นหาชื่อ นามสกุล หรือป้ายทะเบียน..."
            value={firstName}
            onChange={(e) => setFirstName(e.target.value)}
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

              {/* Name Fields */}
              <div className="grid grid-cols-2 gap-2">
                <div className="space-y-2">
                  <label className="text-sm font-medium">ชื่อ</label>
                  <Input
                    placeholder="ชื่อ"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">นามสกุล</label>
                  <Input
                    placeholder="นามสกุล"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                  />
                </div>
              </div>

              {/* License Plate */}
              <div className="space-y-2">
                <label className="text-sm font-medium">ป้ายทะเบียน</label>
                <Input
                  placeholder="เช่น กข 1234, 1กค234"
                  value={licensePlate}
                  onChange={(e) =>
                    setLicensePlate(e.target.value.toUpperCase())
                  }
                />
              </div>

              {/* Gender Filter */}
              <div className="space-y-2">
                <label className="text-sm font-medium">เพศ</label>
                <Select value={gender} onValueChange={setGender}>
                  <SelectTrigger>
                    <SelectValue placeholder="เลือกเพศ" />
                  </SelectTrigger>
                  <SelectContent>
                    {genderOptions.map((option) => (
                      <SelectItem key={option.value} value={option.value}>
                        {option.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* ID Card */}
              <div className="space-y-2">
                <label className="text-sm font-medium">เลขบัตรประชาชน</label>
                <Input
                  placeholder="1-3xxx-xxxxx-xx-x"
                  value={idCard}
                  onChange={(e) => setIdCard(e.target.value)}
                />
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

          {firstName && (
            <Badge variant="secondary" className="gap-1">
              <User className="h-3 w-3" />
              ชื่อ: {firstName}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setFirstName("");
                  handleSearch();
                }}
              />
            </Badge>
          )}

          {lastName && (
            <Badge variant="secondary" className="gap-1">
              นามสกุล: {lastName}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setLastName("");
                  handleSearch();
                }}
              />
            </Badge>
          )}

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

          {gender && (
            <Badge variant="secondary" className="gap-1">
              เพศ:{" "}
              {VISITOR_GENDERS[gender as keyof typeof VISITOR_GENDERS]?.label}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setGender("");
                  handleSearch();
                }}
              />
            </Badge>
          )}

          {idCard && (
            <Badge variant="secondary" className="gap-1">
              บัตรประชาชน: {idCard}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setIdCard("");
                  handleSearch();
                }}
              />
            </Badge>
          )}

          {areaCode && (
            <Badge variant="secondary" className="gap-1">
              จังหวัด: {THAI_PROVINCES[areaCode as keyof typeof THAI_PROVINCES]}
              <X
                className="h-3 w-3 cursor-pointer hover:text-red-500"
                onClick={() => {
                  setAreaCode("");
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
