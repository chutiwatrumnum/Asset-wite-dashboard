// src/utils/vehicleUtils.tsx
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

export const THAI_PROVINCES = {
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

// Vehicle status definitions
export const VEHICLE_STATUS = {
  active: {
    label: "ใช้งานได้",
    color: "bg-green-100 text-green-800",
    priority: 1,
    description: "ยานพาหนะที่สามารถใช้งานได้ปกติ",
  },
  pending: {
    label: "รอเริ่มใช้",
    color: "bg-yellow-100 text-yellow-800",
    priority: 2,
    description: "ยานพาหนะที่ยังไม่ถึงวันที่เริ่มใช้งาน",
  },
  expiring: {
    label: "ใกล้หมดอายุ",
    color: "bg-orange-100 text-orange-800",
    priority: 3,
    description: "ยานพาหนะที่ใกล้หมดอายุภายใน 7 วัน",
  },
  expired: {
    label: "หมดอายุ",
    color: "bg-red-100 text-red-800",
    priority: 4,
    description: "ยานพาหนะที่หมดอายุแล้ว",
  },
  blocked: {
    label: "ถูกระงับ",
    color: "bg-red-100 text-red-800",
    priority: 5,
    description: "ยานพาหนะที่ถูกระงับการใช้งาน",
  },
} as const;

// Validation functions
export const isValidTier = (
  tier: string
): tier is keyof typeof VEHICLE_TIERS => {
  return Object.keys(VEHICLE_TIERS).includes(tier);
};

export const isValidProvinceCode = (
  code: string
): code is keyof typeof THAI_PROVINCES => {
  return Object.keys(THAI_PROVINCES).includes(code);
};

export const isValidVehicleStatus = (
  status: string
): status is keyof typeof VEHICLE_STATUS => {
  return Object.keys(VEHICLE_STATUS).includes(status);
};

// Normalize and mapping functions
export const normalizeTier = (tier: string): keyof typeof VEHICLE_TIERS => {
  if (isValidTier(tier)) {
    return tier;
  }

  // Map common invalid values
  const tierMappings: { [key: string]: keyof typeof VEHICLE_TIERS } = {
    validation_required: "unknown visitor",
    invalid: "unknown visitor",
    unknown: "unknown visitor",
    visitor: "unknown visitor",
    guest: "invited visitor",
    "": "unknown visitor",
    null: "unknown visitor",
    undefined: "unknown visitor",
  };

  return tierMappings[tier.toLowerCase()] || "unknown visitor";
};

// Info getter functions
export const getTierInfo = (tier: string) => {
  const normalizedTier = normalizeTier(tier);
  return VEHICLE_TIERS[normalizedTier];
};

export const getProvinceName = (areaCode: string): string => {
  if (isValidProvinceCode(areaCode)) {
    return THAI_PROVINCES[areaCode];
  }
  return areaCode; // Return original if not found
};

export const getVehicleStatusInfo = (status: string) => {
  if (isValidVehicleStatus(status)) {
    return VEHICLE_STATUS[status];
  }
  return VEHICLE_STATUS.active; // Default fallback
};

// Date and time utilities
export const isVehicleExpired = (expireTime: string): boolean => {
  if (!expireTime) return false;
  try {
    return new Date(expireTime) < new Date();
  } catch {
    return false;
  }
};

export const isVehiclePending = (startTime: string): boolean => {
  if (!startTime) return false;
  try {
    return new Date(startTime) > new Date();
  } catch {
    return false;
  }
};

export const getVehicleExpiryDays = (expireTime: string): number => {
  if (!expireTime) return Infinity;
  try {
    const expireDate = new Date(expireTime);
    const now = new Date();
    const diffTime = expireDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  } catch {
    return 0;
  }
};

export const isVehicleExpiringSoon = (
  expireTime: string,
  withinDays: number = 7
): boolean => {
  const daysUntilExpiry = getVehicleExpiryDays(expireTime);
  return daysUntilExpiry > 0 && daysUntilExpiry <= withinDays;
};

// License plate validation and formatting
export const validateLicensePlate = (licensePlate: string): boolean => {
  if (!licensePlate) return false;

  // Clean the input - remove spaces and convert to uppercase
  const cleaned = licensePlate.replace(/\s/g, "").toUpperCase();

  const patterns = [
    /^[ก-ฮ]{2}\d{4}$/, // Old format: กข1234
    /^\d[ก-ฮ]{2}\d{3}$/, // New format: 1กข234
    /^[ก-ฮ]{1,2}\d{1,4}$/, // Flexible format for partial input
  ];

  // Also check with original input for spaced format
  const spacedPatterns = [
    /^[ก-ฮ]{2}\s\d{4}$/, // Old format with space: กข 1234
    /^[ก-ฮ]{1,2}\s\d{1,4}$/, // Flexible spaced format
  ];

  return (
    patterns.some((pattern) => pattern.test(cleaned)) ||
    spacedPatterns.some((pattern) => pattern.test(licensePlate))
  );
};

export const formatLicensePlate = (licensePlate: string): string => {
  if (!licensePlate) return "";

  const cleaned = licensePlate.replace(/\s/g, "").toUpperCase();

  // Old format: add space between letters and numbers
  if (/^[ก-ฮ]{2}\d{4}$/.test(cleaned)) {
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2)}`;
  }

  // New format: no space needed typically, but can add if desired
  if (/^\d[ก-ฮ]{2}\d{3}$/.test(cleaned)) {
    return cleaned;
  }

  return licensePlate; // Return as-is if doesn't match patterns
};

export const normalizeLicensePlate = (licensePlate: string): string => {
  if (!licensePlate) return "";

  // Remove spaces and convert to uppercase for consistent storage
  return licensePlate.replace(/\s/g, "").toUpperCase();
};

// Vehicle status determination
export const getVehicleDisplayStatus = (vehicle: {
  tier: string;
  expire_time?: string;
  start_time?: string;
}) => {
  const now = new Date();
  const normalizedTier = normalizeTier(vehicle.tier);

  // Check if blacklisted
  if (normalizedTier === "blacklisted") {
    return VEHICLE_STATUS.blocked;
  }

  // Check if expired
  if (vehicle.expire_time && isVehicleExpired(vehicle.expire_time)) {
    return VEHICLE_STATUS.expired;
  }

  // Check if not yet active
  if (vehicle.start_time && isVehiclePending(vehicle.start_time)) {
    return VEHICLE_STATUS.pending;
  }

  // Check if expiring soon (within 7 days)
  if (vehicle.expire_time && isVehicleExpiringSoon(vehicle.expire_time)) {
    const daysLeft = getVehicleExpiryDays(vehicle.expire_time);
    return {
      ...VEHICLE_STATUS.expiring,
      label: `เหลือ ${daysLeft} วัน`,
    };
  }

  // Active status
  return VEHICLE_STATUS.active;
};

// Advanced search helper function
export const searchVehicles = (
  vehicles: any[],
  filters: {
    licensePlate?: string;
    tier?: string;
    areaCode?: string;
    status?: string;
    houseId?: string;
    issuer?: string;
    dateRange?: {
      start?: string;
      end?: string;
    };
  }
) => {
  return vehicles.filter((vehicle) => {
    // License plate search (fuzzy matching)
    if (filters.licensePlate) {
      const searchTerm = normalizeLicensePlate(filters.licensePlate);
      const vehiclePlate = normalizeLicensePlate(vehicle.license_plate);
      if (!vehiclePlate.includes(searchTerm)) {
        return false;
      }
    }

    // Tier filter
    if (filters.tier) {
      const normalizedVehicleTier = normalizeTier(vehicle.tier);
      const normalizedFilterTier = normalizeTier(filters.tier);
      if (normalizedVehicleTier !== normalizedFilterTier) {
        return false;
      }
    }

    // Area code filter
    if (filters.areaCode && vehicle.area_code !== filters.areaCode) {
      return false;
    }

    // House filter
    if (filters.houseId && vehicle.house_id !== filters.houseId) {
      return false;
    }

    // Issuer filter
    if (filters.issuer && vehicle.issuer !== filters.issuer) {
      return false;
    }

    // Status filter
    if (filters.status) {
      const vehicleStatus = getVehicleDisplayStatus(vehicle);
      if (
        vehicleStatus.priority !==
        VEHICLE_STATUS[filters.status as keyof typeof VEHICLE_STATUS]?.priority
      ) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const vehicleDate = new Date(vehicle.created);

      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        if (vehicleDate < startDate) {
          return false;
        }
      }

      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        if (vehicleDate > endDate) {
          return false;
        }
      }
    }

    return true;
  });
};

// Statistics helper functions
export const getVehicleStatistics = (vehicles: any[]) => {
  const stats = {
    total: vehicles.length,
    active: 0,
    pending: 0,
    expiring: 0,
    expired: 0,
    blocked: 0,
    byTier: {} as Record<string, number>,
    byProvince: {} as Record<string, number>,
  };

  vehicles.forEach((vehicle) => {
    const status = getVehicleDisplayStatus(vehicle);
    const tier = normalizeTier(vehicle.tier);
    const provinceName = getProvinceName(vehicle.area_code);

    // Count by status
    switch (status.priority) {
      case VEHICLE_STATUS.active.priority:
        stats.active++;
        break;
      case VEHICLE_STATUS.pending.priority:
        stats.pending++;
        break;
      case VEHICLE_STATUS.expiring.priority:
        stats.expiring++;
        break;
      case VEHICLE_STATUS.expired.priority:
        stats.expired++;
        break;
      case VEHICLE_STATUS.blocked.priority:
        stats.blocked++;
        break;
    }

    // Count by tier
    const tierLabel = getTierInfo(tier).label;
    stats.byTier[tierLabel] = (stats.byTier[tierLabel] || 0) + 1;

    // Count by province
    stats.byProvince[provinceName] = (stats.byProvince[provinceName] || 0) + 1;
  });

  return stats;
};

// Export utilities for CSV/Excel
export const prepareVehicleDataForExport = (vehicles: any[]) => {
  return vehicles.map((vehicle) => {
    const status = getVehicleDisplayStatus(vehicle);
    const tierInfo = getTierInfo(vehicle.tier);
    const provinceName = getProvinceName(vehicle.area_code);

    return {
      ป้ายทะเบียน: vehicle.license_plate,
      จังหวัด: provinceName,
      ระดับ: tierInfo.label,
      สถานะ: status.label,
      วันที่เริ่ม: vehicle.start_time
        ? new Date(vehicle.start_time).toLocaleDateString("th-TH")
        : "",
      วันหมดอายุ: vehicle.expire_time
        ? new Date(vehicle.expire_time).toLocaleDateString("th-TH")
        : "",
      บ้าน: vehicle.house_id || "",
      ผู้สร้าง: vehicle.issuer || "",
      หมายเหตุ: vehicle.note || "",
      วันที่สร้าง: new Date(vehicle.created).toLocaleDateString("th-TH"),
      อัปเดตล่าสุด: new Date(vehicle.updated).toLocaleDateString("th-TH"),
    };
  });
};

// Sorting helper functions
export const sortVehicles = (
  vehicles: any[],
  sortBy: string,
  sortOrder: "asc" | "desc" = "asc"
) => {
  return [...vehicles].sort((a, b) => {
    let valueA: any;
    let valueB: any;

    switch (sortBy) {
      case "license_plate":
        valueA = normalizeLicensePlate(a.license_plate);
        valueB = normalizeLicensePlate(b.license_plate);
        break;
      case "tier":
        valueA = getTierInfo(a.tier).priority;
        valueB = getTierInfo(b.tier).priority;
        break;
      case "status":
        valueA = getVehicleDisplayStatus(a).priority;
        valueB = getVehicleDisplayStatus(b).priority;
        break;
      case "province":
        valueA = getProvinceName(a.area_code);
        valueB = getProvinceName(b.area_code);
        break;
      case "expire_time":
        valueA = a.expire_time ? new Date(a.expire_time).getTime() : Infinity;
        valueB = b.expire_time ? new Date(b.expire_time).getTime() : Infinity;
        break;
      case "created":
        valueA = new Date(a.created).getTime();
        valueB = new Date(b.created).getTime();
        break;
      default:
        valueA = a[sortBy];
        valueB = b[sortBy];
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
