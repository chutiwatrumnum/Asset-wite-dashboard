// 1. สร้างไฟล์ src/components/ui/vehicle-search.tsx
import { useState } from "react";
import { Search } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { VEHICLE_TIERS, THAI_PROVINCES } from "@/utils/vehicleUtils";

interface VehicleSearchProps {
  onSearch: (filters: {
    licensePlate?: string;
    tier?: string;
    areaCode?: string;
  }) => void;
}

export function VehicleSearch({ onSearch }: VehicleSearchProps) {
  const [licensePlate, setLicensePlate] = useState("");
  const [tier, setTier] = useState("");
  const [areaCode, setAreaCode] = useState("");

  const handleSearch = () => {
    onSearch({
      licensePlate: licensePlate || undefined,
      tier: tier || undefined,
      areaCode: areaCode || undefined,
    });
  };

  const handleReset = () => {
    setLicensePlate("");
    setTier("");
    setAreaCode("");
    onSearch({});
  };

  return (
    <div className="flex flex-wrap gap-2 p-4 bg-gray-50 rounded-lg">
      <div className="flex-1 min-w-[200px]">
        <Input
          placeholder="ค้นหาป้ายทะเบียน..."
          value={licensePlate}
          onChange={(e) => setLicensePlate(e.target.value)}
          className="w-full"
        />
      </div>

      <Select value={tier} onValueChange={setTier}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="ระดับ" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(VEHICLE_TIERS).map(([value, info]) => (
            <SelectItem key={value} value={value}>
              {info.label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Select value={areaCode} onValueChange={setAreaCode}>
        <SelectTrigger className="w-[150px]">
          <SelectValue placeholder="จังหวัด" />
        </SelectTrigger>
        <SelectContent>
          {Object.entries(THAI_PROVINCES).map(([value, label]) => (
            <SelectItem key={value} value={value}>
              {label}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>

      <Button onClick={handleSearch} className="gap-2">
        <Search className="h-4 w-4" />
        ค้นหา
      </Button>

      <Button variant="outline" onClick={handleReset}>
        รีเซ็ต
      </Button>
    </div>
  );
}
