// src/utils/vehicleAccessUtils.tsx
import type { PassageLogItem } from "@/api/vehicle_access/vehicle_access";

// Vehicle tiers สำหรับ passage log (ใช้จาก vehicleUtils)
export const VEHICLE_TIERS = {
  resident: {
    label: "ลูกบ้าน",
    color: "bg-blue-100 text-blue-800",
    priority: 1,
  },
  staff: {
    label: "เจ้าหน้าที่",
    color: "bg-green-100 text-green-800",
    priority: 2,
  },
  "invited visitor": {
    label: "แขก",
    color: "bg-yellow-100 text-yellow-800",
    priority: 3,
  },
  "unknown visitor": {
    label: "ไม่ทราบ",
    color: "bg-gray-100 text-gray-800",
    priority: 4,
  },
  blacklisted: {
    label: "บัญชีดำ",
    color: "bg-red-100 text-red-800",
    priority: 5,
  },
} as const;

// Gate states
export const GATE_STATES = {
  enabled: {
    label: "เปิดใช้งาน",
    color: "bg-green-100 text-green-800",
  },
  disabled: {
    label: "ปิดใช้งาน",
    color: "bg-red-100 text-red-800",
  },
  maintenance: {
    label: "ปรับปรุง",
    color: "bg-yellow-100 text-yellow-800",
  },
} as const;

// Thai area codes (same as vehicleUtils)
export const THAI_AREA_CODES = {
  "th-10": "กรุงเทพมหานคร",
  "th-11": "สมุทรปราการ",
  "th-12": "นนทบุรี",
  "th-13": "ปทุมธานี",
  "th-14": "พระนครศรีอยุธยา",
  "th-15": "อ่างทอง",
  "th-16": "ลพบุรี",
  "th-17": "สิงห์บุรี",
  "th-18": "ชัยนาท",
  "th-19": "สระบุรี",
  "th-20": "นครนายก",
  "th-21": "สระแก้ว",
  "th-22": "ปราจีนบุรี",
  "th-23": "ฉะเชิงเทรา",
  "th-24": "ชลบุรี",
  "th-25": "ระยอง",
  "th-26": "จันทบุรี",
  "th-27": "ตราด",
  "th-30": "นครราชสีมา",
  "th-31": "บุรีรัมย์",
  "th-32": "สุรินทร์",
  "th-33": "ศิวะนครคร",
  "th-34": "อุบลราชธานี",
  "th-35": "ยโสธร",
  "th-36": "ชัยภูมิ",
  "th-37": "อำนาจเจริญ",
  "th-38": "หนองบัวลำภู",
  "th-39": "ขอนแก่น",
  "th-40": "อุดรธานี",
  "th-41": "เลย",
  "th-42": "หนองคาย",
  "th-43": "มหาสารคาม",
  "th-44": "ร้อยเอ็ด",
  "th-45": "กาฬสินธุ์",
  "th-46": "สกลนคร",
  "th-47": "นครพนม",
  "th-48": "มุกดาหาร",
  "th-49": "เชียงใหม่",
  "th-50": "ลำพูน",
  "th-51": "ลำปาง",
  "th-52": "อุตรดิตถ์",
  "th-53": "แพร่",
  "th-54": "น่าน",
  "th-55": "พะเยา",
  "th-56": "เชียงราย",
  "th-57": "แม่ฮ่องสอน",
  "th-58": "นครสวรรค์",
  "th-60": "กำแพงเพชร",
  "th-61": "ตาก",
  "th-62": "สุโขทัย",
  "th-63": "พิษณุโลก",
  "th-64": "พิจิตร",
  "th-65": "เพชรบูรณ์",
  "th-66": "ราชบุรี",
  "th-67": "กาญจนบุรี",
  "th-70": "เพชรบุรี",
  "th-71": "ประจวบคีรีขันธ์",
  "th-72": "นครศรีธรรมราช",
  "th-73": "กระบี่",
  "th-74": "พังงา",
  "th-75": "ภูเก็ต",
  "th-76": "สุราษฎร์ธานี",
  "th-77": "ระนอง",
  "th-80": "ชุมพร",
  "th-81": "สงขลา",
  "th-82": "สตูล",
  "th-83": "ตรัง",
  "th-84": "พัทลุง",
  "th-85": "ปัตตานี",
  "th-86": "ยะลา",
  "th-90": "นราธิวาส",
  "th-91": "บึงกาฬ",
} as const;

// Helper functions
export const getTierInfo = (tier: string) => {
  return (
    VEHICLE_TIERS[tier as keyof typeof VEHICLE_TIERS] ||
    VEHICLE_TIERS["unknown visitor"]
  );
};

export const getGateStateInfo = (gateState: string) => {
  return (
    GATE_STATES[gateState as keyof typeof GATE_STATES] || GATE_STATES.disabled
  );
};

export const getAreaName = (areaCode: string): string => {
  return THAI_AREA_CODES[areaCode as keyof typeof THAI_AREA_CODES] || areaCode;
};

// Thai date time formatting
export const formatThaiDateTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleString("th-TH", {
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Bangkok",
    });
  } catch (error) {
    return dateString;
  }
};

export const formatThaiDate = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      timeZone: "Asia/Bangkok",
    });
  } catch (error) {
    return dateString;
  }
};

export const formatThaiTime = (dateString: string): string => {
  try {
    const date = new Date(dateString);
    return date.toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      second: "2-digit",
      timeZone: "Asia/Bangkok",
    });
  } catch (error) {
    return dateString;
  }
};

// Search helper functions
export const searchPassageLogData = (
  logs: PassageLogItem[],
  filters: {
    licensePlate?: string;
    tier?: string;
    areaCode?: string;
    gateState?: string;
    isSuccess?: boolean;
    dateRange?: {
      start?: string;
      end?: string;
    };
  }
) => {
  return logs.filter((log) => {
    // License plate search
    if (filters.licensePlate) {
      const searchTerm = filters.licensePlate.toLowerCase().replace(/\s/g, "");
      const logPlate = log.license_plate.toLowerCase().replace(/\s/g, "");
      if (!logPlate.includes(searchTerm)) {
        return false;
      }
    }

    // Tier filter
    if (filters.tier && log.tier !== filters.tier) {
      return false;
    }

    // Area code filter
    if (filters.areaCode && log.area_code !== filters.areaCode) {
      return false;
    }

    // Gate state filter
    if (filters.gateState && log.gate_state !== filters.gateState) {
      return false;
    }

    // Success filter
    if (
      filters.isSuccess !== undefined &&
      log.isSuccess !== filters.isSuccess
    ) {
      return false;
    }

    // Date range filter
    if (filters.dateRange) {
      const logDate = new Date(log.created);

      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        if (logDate < startDate) {
          return false;
        }
      }

      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        endDate.setHours(23, 59, 59, 999); // Set to end of day
        if (logDate > endDate) {
          return false;
        }
      }
    }

    return true;
  });
};

// Statistics helper functions
export const getVehicleAccessStatistics = (logs: PassageLogItem[]) => {
  const stats = {
    total: logs.length,
    successful: 0,
    failed: 0,
    byTier: {} as Record<string, number>,
    byGateState: {} as Record<string, number>,
    byArea: {} as Record<string, number>,
    hourlyDistribution: {} as Record<string, number>,
  };

  logs.forEach((log) => {
    // Count by success
    if (log.isSuccess) {
      stats.successful++;
    } else {
      stats.failed++;
    }

    // Count by tier
    const tierLabel = getTierInfo(log.tier).label;
    stats.byTier[tierLabel] = (stats.byTier[tierLabel] || 0) + 1;

    // Count by gate state
    const gateStateLabel = getGateStateInfo(log.gate_state).label;
    stats.byGateState[gateStateLabel] =
      (stats.byGateState[gateStateLabel] || 0) + 1;

    // Count by area
    const areaName = getAreaName(log.area_code);
    stats.byArea[areaName] = (stats.byArea[areaName] || 0) + 1;

    // Hourly distribution
    try {
      const hour = new Date(log.created).getHours();
      const hourKey = `${hour.toString().padStart(2, "0")}:00`;
      stats.hourlyDistribution[hourKey] =
        (stats.hourlyDistribution[hourKey] || 0) + 1;
    } catch (error) {
      // Skip if date parsing fails
    }
  });

  return stats;
};

// Export utilities for CSV/Excel
export const preparePassageLogDataForExport = (logs: PassageLogItem[]) => {
  return logs.map((log) => {
    const tierInfo = getTierInfo(log.tier);
    const gateStateInfo = getGateStateInfo(log.gate_state);
    const areaName = getAreaName(log.area_code);

    return {
      ป้ายทะเบียน: log.license_plate,
      ผลการเข้าออก: log.isSuccess ? "สำเร็จ" : "ล้มเหลว",
      ระดับยานพาหนะ: tierInfo.label,
      สถานะประตู: gateStateInfo.label,
      จังหวัด: areaName,
      ภูมิภาค: log.region || "",
      บ้าน: log.house_id || "",
      รีดเดอร์: log.reader || "",
      ประตู: log.gate || "",
      รูปภาพเต็ม: log.full_snapshot || "",
      รูปป้ายทะเบียน: log.lp_snapshot || "",
      ข้อมูลรูปภาพ: log.snapshot_info || "",
      หมายเหตุ: log.note || "",
      วันที่เวลา: formatThaiDateTime(log.created),
      อัปเดตล่าสุด: formatThaiDateTime(log.updated),
    };
  });
};

// Sorting helper functions
export const sortPassageLogs = (
  logs: PassageLogItem[],
  sortBy: string,
  sortOrder: "asc" | "desc" = "desc"
) => {
  return [...logs].sort((a, b) => {
    let valueA: any;
    let valueB: any;

    switch (sortBy) {
      case "license_plate":
        valueA = a.license_plate.replace(/\s/g, "").toLowerCase();
        valueB = b.license_plate.replace(/\s/g, "").toLowerCase();
        break;
      case "tier":
        valueA = getTierInfo(a.tier).priority;
        valueB = getTierInfo(b.tier).priority;
        break;
      case "isSuccess":
        valueA = a.isSuccess ? 1 : 0;
        valueB = b.isSuccess ? 1 : 0;
        break;
      case "area_code":
        valueA = getAreaName(a.area_code);
        valueB = getAreaName(b.area_code);
        break;
      case "gate_state":
        valueA = a.gate_state;
        valueB = b.gate_state;
        break;
      case "created":
        valueA = new Date(a.created).getTime();
        valueB = new Date(b.created).getTime();
        break;
      default:
        valueA = a[sortBy as keyof PassageLogItem];
        valueB = b[sortBy as keyof PassageLogItem];
    }

    if (valueA < valueB) {
      return sortOrder === "asc" ? -1 : 1;
    }
    if (valueA > valueB) {
      return sortOrder === "asc" ? 1 : -1;
    }
    return 0;
  });
};
