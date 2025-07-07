export const VEHICLE_TIERS = {
  resident: { label: "ลูกบ้าน", color: "bg-blue-100 text-blue-800" },
  staff: { label: "เจ้าหน้าที่", color: "bg-green-100 text-green-800" },
  "invited visitor": { label: "แขก", color: "bg-yellow-100 text-yellow-800" },
  "unknown visitor": { label: "ไม่ทราบ", color: "bg-gray-100 text-gray-800" },
  blacklisted: { label: "บัญชีดำ", color: "bg-red-100 text-red-800" },
} as const;

export const isValidTier = (tier: string): boolean => {
  return Object.keys(VEHICLE_TIERS).includes(tier);
};

// เพิ่มฟังก์ชันสำหรับ normalize tier
export const normalizeTier = (tier: string): string => {
  if (isValidTier(tier)) {
    return tier;
  }

  // Map common invalid values
  const tierMappings: { [key: string]: string } = {
    validation_required: "unknown",
    invalid: "unknown",
    "": "unknown",
    null: "unknown",
    undefined: "unknown",
  };

  return tierMappings[tier.toLowerCase()] || "unknown";
};

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

// ตรวจสอบว่ามีฟังก์ชันเหล่านี้ครบหรือไม่
export const getTierInfo = (tier: string) => {
  const normalizedTier = normalizeTier(tier);
  return VEHICLE_TIERS[normalizedTier as keyof typeof VEHICLE_TIERS];
};

export const getProvinceName = (areaCode: string) => {
  return THAI_PROVINCES[areaCode as keyof typeof THAI_PROVINCES] || areaCode;
};

export const isVehicleExpired = (expireTime: string) => {
  if (!expireTime) return false;
  return new Date(expireTime) < new Date();
};

export const validateLicensePlate = (licensePlate: string) => {
  if (!licensePlate) return false;

  // Clean the input - remove spaces and convert to uppercase
  const cleaned = licensePlate.replace(/\s/g, "").toUpperCase();

  const patterns = [
    /^[ก-ฮ]{2}\d{4}$/, // Old format: กข1234 (no space)
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

// Additional utility functions
export const formatLicensePlate = (licensePlate: string) => {
  if (!licensePlate) return "";

  const cleaned = licensePlate.replace(/\s/g, "").toUpperCase();

  // Old format: add space between letters and numbers
  if (/^[ก-ฮ]{2}\d{4}$/.test(cleaned)) {
    return `${cleaned.substring(0, 2)} ${cleaned.substring(2)}`;
  }

  // New format: no space needed
  if (/^\d[ก-ฮ]{2}\d{3}$/.test(cleaned)) {
    return cleaned;
  }

  return licensePlate; // Return as-is if doesn't match patterns
};

export const getVehicleDisplayStatus = (vehicle: {
  tier: string;
  expire_time?: string;
  start_time?: string;
}) => {
  const now = new Date();
  const normalizedTier = normalizeTier(vehicle.tier);

  // Check if blacklisted
  if (normalizedTier === "blacklisted") {
    return {
      status: "blocked",
      label: "ถูกระงับ",
      color: "bg-red-100 text-red-800",
      priority: 1,
    };
  }

  // Check if expired
  if (vehicle.expire_time && new Date(vehicle.expire_time) < now) {
    return {
      status: "expired",
      label: "หมดอายุ",
      color: "bg-red-100 text-red-800",
      priority: 2,
    };
  }

  // Check if not yet active
  if (vehicle.start_time && new Date(vehicle.start_time) > now) {
    return {
      status: "pending",
      label: "รอเริ่มใช้",
      color: "bg-yellow-100 text-yellow-800",
      priority: 3,
    };
  }

  // Check if expiring soon (within 7 days)
  if (vehicle.expire_time) {
    const expireDate = new Date(vehicle.expire_time);
    const daysUntilExpiry = Math.ceil(
      (expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
    );

    if (daysUntilExpiry <= 7 && daysUntilExpiry > 0) {
      return {
        status: "expiring",
        label: `เหลือ ${daysUntilExpiry} วัน`,
        color: "bg-orange-100 text-orange-800",
        priority: 4,
      };
    }
  }

  // Active status
  return {
    status: "active",
    label: "ใช้งานได้",
    color: "bg-green-100 text-green-800",
    priority: 5,
  };
};
// Search helper function
export const searchVehicles = (
  vehicles: any[],
  filters: {
    licensePlate?: string;
    tier?: string;
    areaCode?: string;
    status?: string;
  }
) => {
  return vehicles.filter((vehicle) => {
    // License plate search
    if (filters.licensePlate) {
      const searchTerm = filters.licensePlate.toLowerCase();
      const vehiclePlate = vehicle.license_plate.toLowerCase();
      if (!vehiclePlate.includes(searchTerm)) {
        return false;
      }
    }

    // Tier filter
    if (filters.tier && vehicle.tier !== filters.tier) {
      return false;
    }

    // Area code filter
    if (filters.areaCode && vehicle.area_code !== filters.areaCode) {
      return false;
    }

    // Status filter
    if (filters.status) {
      const vehicleStatus = getVehicleDisplayStatus(vehicle);
      if (vehicleStatus.status !== filters.status) {
        return false;
      }
    }

    return true;
  });
};
