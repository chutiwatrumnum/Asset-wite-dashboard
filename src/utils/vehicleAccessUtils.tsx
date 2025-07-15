// src/utils/vehicleAccessUtils.tsx
import {
  VehicleAccessItem,
  SnapshotInfo,
} from "@/api/vehicle_access/vehicle_access";

// Vehicle tier definitions
export const VEHICLE_TIERS = {
  resident: {
    label: "ลูกบ้าน",
    color: "bg-blue-100 text-blue-800 border-blue-200",
    description: "ยานพาหนะของลูกบ้าน",
    priority: 1,
  },
  staff: {
    label: "เจ้าหน้าที่",
    color: "bg-green-100 text-green-800 border-green-200",
    description: "ยานพาหนะของเจ้าหน้าที่",
    priority: 2,
  },
  guest: {
    label: "แขก",
    color: "bg-yellow-100 text-yellow-800 border-yellow-200",
    description: "ยานพาหนะของแขก",
    priority: 3,
  },
  unknown: {
    label: "ไม่ทราบ",
    color: "bg-gray-100 text-gray-800 border-gray-200",
    description: "ยานพาหนะที่ไม่ทราบประเภท",
    priority: 4,
  },
} as const;

// Gate state definitions
export const GATE_STATES = {
  enabled: {
    label: "ใช้งานได้",
    color: "bg-green-100 text-green-800",
    description: "ประตูพร้อมใช้งาน",
  },
  disabled: {
    label: "ปิดใช้งาน",
    color: "bg-red-100 text-red-800",
    description: "ประตูไม่พร้อมใช้งาน",
  },
} as const;

// Thai area codes (จังหวัด)
export const THAI_AREA_CODES = {
  "th-BT": "กรุงเทพมหานคร",
  "th-NT": "นนทบุรี",
  "th-PL": "ปทุมธานี",
  "th-SP": "สมุทรปราการ",
  "th-SN": "สมุทรสงคราม",
  "th-AC": "อ่างทอง",
  "th-LB": "ลพบุรี",
  "th-PB": "เพชรบุรี",
  "th-HH": "หัวหิน",
  "th-CK": "ฉะเชิงเทรา",
  "th-CB": "ชลบุรี",
  "th-RY": "ระยอง",
  "th-TT": "ตราด",
  "th-KK": "ขอนแก่น",
  "th-UD": "อุดรธานี",
  "th-NP": "นครพนม",
  "th-BK": "บึงกาฬ",
  "th-SK": "สกลนคร",
  "th-NW": "หนองคาย",
  "th-LE": "เลย",
  "th-PH": "พิษณุโลก",
  "th-SL": "สุโขทัย",
  "th-UK": "อุตรดิตถ์",
  "th-NAN": "น่าน",
  "th-PE": "แพร่",
  "th-CM": "เชียงใหม่",
  "th-CR": "เชียงราย",
  "th-LG": "ลำปาง",
  "th-LP": "ลำพูน",
  "th-MS": "แม่ฮ่องสอน",
  "th-TK": "ตาก",
  "th-KP": "กำแพงเพชร",
  "th-NST": "นครสวรรค์",
  "th-UTH": "อุทัยธานี",
  "th-CPH": "จันทบุรี",
  "th-PC": "ประจวบคีรีขันธ์",
  "th-RO": "ราชบุรี",
  "th-KN": "กาญจนบุรี",
  "th-SPK": "สุพรรณบุรี",
  "th-NSK": "นครปฐม",
  "th-STH": "สมุทรสาคร",
} as const;

// Utility functions
export const getTierInfo = (tier: string) => {
  return (
    VEHICLE_TIERS[tier as keyof typeof VEHICLE_TIERS] || VEHICLE_TIERS.unknown
  );
};

export const getGateStateInfo = (gateState: string) => {
  return (
    GATE_STATES[gateState as keyof typeof GATE_STATES] || GATE_STATES.disabled
  );
};

export const getRegionName = (areaCode: string): string => {
  return THAI_AREA_CODES[areaCode as keyof typeof THAI_AREA_CODES] || areaCode;
};

// Snapshot info parsing
export const parseSnapshotInfo = (
  snapshotInfoString: string
): SnapshotInfo | null => {
  if (!snapshotInfoString || snapshotInfoString.trim() === "") {
    return null;
  }

  try {
    const parsed = JSON.parse(snapshotInfoString);
    return {
      confidence: parsed.confidence || 0,
      processing_time: parsed.processing_time || 0,
      camera_id: parsed.camera_id || "UNKNOWN",
      ...parsed,
    };
  } catch (error) {
    console.error("Error parsing snapshot info:", error);
    return null;
  }
};

// Image handling
export const getImageUrl = (imagePath: string, baseUrl?: string): string => {
  if (!imagePath) return "";

  // If it's already a full URL, return as is
  if (imagePath.startsWith("http://") || imagePath.startsWith("https://")) {
    return imagePath;
  }

  // If it's a PocketBase file reference, construct the URL
  if (baseUrl) {
    return `${baseUrl}/${imagePath}`;
  }

  return imagePath;
};

// Search and filter functions
export const searchVehicleAccessLogs = (
  logs: VehicleAccessItem[],
  filters: {
    licensePlate?: string;
    tier?: string;
    areaCode?: string;
    gateState?: string;
    gate?: string;
    reader?: string;
    region?: string;
    isSuccess?: boolean;
    dateRange?: {
      start?: string;
      end?: string;
    };
  }
) => {
  return logs.filter((log) => {
    // License plate search (fuzzy matching)
    if (filters.licensePlate) {
      const searchTerm = filters.licensePlate.toLowerCase().replace(/\s+/g, "");
      const licensePlate = log.license_plate.toLowerCase().replace(/\s+/g, "");
      if (!licensePlate.includes(searchTerm)) {
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

    // Gate filter
    if (filters.gate && log.gate !== filters.gate) {
      return false;
    }

    // Reader filter
    if (filters.reader && log.reader !== filters.reader) {
      return false;
    }

    // Region filter
    if (filters.region) {
      const regionName = getRegionName(log.area_code);
      if (!regionName.toLowerCase().includes(filters.region.toLowerCase())) {
        return false;
      }
    }

    // Success status filter
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
        if (logDate > endDate) {
          return false;
        }
      }
    }

    return true;
  });
};

// Statistics calculation
export const getVehicleAccessStatistics = (logs: VehicleAccessItem[]) => {
  const stats = {
    total: logs.length,
    successful: 0,
    failed: 0,
    byTier: {} as Record<string, number>,
    byGateState: {} as Record<string, number>,
    byAreaCode: {} as Record<string, number>,
    byGate: {} as Record<string, number>,
    byReader: {} as Record<string, number>,
    recentActivity: [] as VehicleAccessItem[],
    topRegions: [] as Array<{ region: string; count: number }>,
  };

  logs.forEach((log) => {
    // Count by success status
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

    // Count by area code
    const regionName = getRegionName(log.area_code);
    stats.byAreaCode[regionName] = (stats.byAreaCode[regionName] || 0) + 1;

    // Count by gate
    stats.byGate[log.gate] = (stats.byGate[log.gate] || 0) + 1;

    // Count by reader
    stats.byReader[log.reader] = (stats.byReader[log.reader] || 0) + 1;
  });

  // Get recent activity (last 10 records)
  stats.recentActivity = logs
    .sort(
      (a, b) => new Date(b.created).getTime() - new Date(a.created).getTime()
    )
    .slice(0, 10);

  // Get top regions
  stats.topRegions = Object.entries(stats.byAreaCode)
    .map(([region, count]) => ({ region, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 5);

  return stats;
};

// Export data preparation
export const prepareVehicleAccessDataForExport = (
  logs: VehicleAccessItem[]
) => {
  return logs.map((log) => {
    const tierInfo = getTierInfo(log.tier);
    const gateStateInfo = getGateStateInfo(log.gate_state);
    const regionName = getRegionName(log.area_code);
    const snapshotInfo = parseSnapshotInfo(log.snapshot_info);

    return {
      รหัสบันทึก: log.id,
      ป้ายทะเบียน: log.license_plate,
      ประเภทยานพาหนะ: tierInfo.label,
      จังหวัด: regionName,
      รหัสพื้นที่: log.area_code,
      ภูมิภาค: log.region || "-",
      ประตู: log.gate,
      เครื่องอ่าน: log.reader,
      สถานะประตู: gateStateInfo.label,
      สถานะการผ่าน: log.isSuccess ? "สำเร็จ" : "ล้มเหลว",
      บ้านเกี่ยวข้อง: log.house_id || "-",
      ความมั่นใจ_AI: snapshotInfo
        ? `${(snapshotInfo.confidence * 100).toFixed(1)}%`
        : "-",
      เวลาประมวลผล_AI: snapshotInfo ? `${snapshotInfo.processing_time}s` : "-",
      กล้อง: snapshotInfo?.camera_id || "-",
      หมายเหตุ: log.note || "",
      วันที่บันทึก: new Date(log.created).toLocaleDateString("th-TH"),
      เวลาบันทึก: new Date(log.created).toLocaleTimeString("th-TH"),
      อัปเดตล่าสุด: new Date(log.updated).toLocaleDateString("th-TH"),
    };
  });
};

// Date formatting utilities
export const formatThaiDateTime = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    });
  } catch {
    return dateString;
  }
};

export const formatThaiDate = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleDateString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "Asia/Bangkok",
    });
  } catch {
    return dateString;
  }
};

export const formatTime = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleTimeString("th-TH", {
      hour: "2-digit",
      minute: "2-digit",
      timeZone: "Asia/Bangkok",
    });
  } catch {
    return dateString;
  }
};

// Sorting utilities
export const sortVehicleAccessLogs = (
  logs: VehicleAccessItem[],
  sortBy: string,
  sortOrder: "asc" | "desc" = "asc"
) => {
  return [...logs].sort((a, b) => {
    let valueA: any;
    let valueB: any;

    switch (sortBy) {
      case "license_plate":
        valueA = a.license_plate.toLowerCase();
        valueB = b.license_plate.toLowerCase();
        break;
      case "tier":
        valueA = getTierInfo(a.tier).priority;
        valueB = getTierInfo(b.tier).priority;
        break;
      case "created":
        valueA = new Date(a.created).getTime();
        valueB = new Date(b.created).getTime();
        break;
      case "region":
        valueA = getRegionName(a.area_code).toLowerCase();
        valueB = getRegionName(b.area_code).toLowerCase();
        break;
      case "gate":
        valueA = a.gate.toLowerCase();
        valueB = b.gate.toLowerCase();
        break;
      case "isSuccess":
        valueA = a.isSuccess ? 1 : 0;
        valueB = b.isSuccess ? 1 : 0;
        break;
      default:
        valueA = a[sortBy as keyof VehicleAccessItem] || "";
        valueB = b[sortBy as keyof VehicleAccessItem] || "";
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

// Validation functions
export const validateLicensePlate = (licensePlate: string): string | null => {
  if (!licensePlate || licensePlate.trim().length === 0) {
    return "กรุณากรอกป้ายทะเบียน";
  }

  const trimmed = licensePlate.trim();
  if (trimmed.length < 2) {
    return "ป้ายทะเบียนต้องมีอย่างน้อย 2 ตัวอักษร";
  }

  if (trimmed.length > 20) {
    return "ป้ายทะเบียนต้องไม่เกิน 20 ตัวอักษร";
  }

  return null;
};

export const validateAreaCode = (areaCode: string): string | null => {
  if (!areaCode || areaCode.trim().length === 0) {
    return "กรุณาเลือกรหัสจังหวัด";
  }

  if (!THAI_AREA_CODES[areaCode as keyof typeof THAI_AREA_CODES]) {
    return "รหัสจังหวัดไม่ถูกต้อง";
  }

  return null;
};
