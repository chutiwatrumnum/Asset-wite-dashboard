// src/utils/visitorUtils.tsx
import type { VisitorItem } from "@/api/external_vehicle/visitor";

// Gender definitions
export const VISITOR_GENDERS = {
  male: {
    label: "ชาย",
    color: "bg-blue-100 text-blue-800",
    icon: "👨",
  },
  female: {
    label: "หญิง",
    color: "bg-pink-100 text-pink-800",
    icon: "👩",
  },
  other: {
    label: "อื่นๆ",
    color: "bg-gray-100 text-gray-800",
    icon: "👤",
  },
} as const;

// Vehicle status for external visitors - simpler than vehicle tiers
export const EXTERNAL_VEHICLE_STATUS = {
  active: {
    label: "ใช้งานได้",
    color: "bg-green-100 text-green-800",
    priority: 1,
    description: "ยานพาหนะภายนอกที่สามารถใช้งานได้ปกติ",
  },
  blocked: {
    label: "ถูกระงับ",
    color: "bg-red-100 text-red-800",
    priority: 2,
    description: "ยานพาหนะภายนอกที่ถูกระงับการใช้งาน",
  },
  expired: {
    label: "หมดอายุ",
    color: "bg-gray-100 text-gray-800",
    priority: 3,
    description: "ยานพาหนะภายนอกที่หมดอายุแล้ว",
  },
} as const;

// Thai provinces (reuse from vehicleUtils)
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

// Validation functions
export const isValidGender = (
  gender: string
): gender is keyof typeof VISITOR_GENDERS => {
  return Object.keys(VISITOR_GENDERS).includes(gender);
};

export const isValidProvinceCode = (
  code: string
): code is keyof typeof THAI_PROVINCES => {
  return Object.keys(THAI_PROVINCES).includes(code);
};

export const isValidExternalVehicleStatus = (
  status: string
): status is keyof typeof EXTERNAL_VEHICLE_STATUS => {
  return Object.keys(EXTERNAL_VEHICLE_STATUS).includes(status);
};

// Info getter functions
export const getGenderInfo = (gender: string) => {
  if (isValidGender(gender)) {
    return VISITOR_GENDERS[gender];
  }
  return VISITOR_GENDERS.other; // Default fallback
};

export const getProvinceName = (areaCode: string): string => {
  if (isValidProvinceCode(areaCode)) {
    return THAI_PROVINCES[areaCode];
  }
  return areaCode; // Return original if not found
};

export const getExternalVehicleStatusInfo = (status: string) => {
  if (isValidExternalVehicleStatus(status)) {
    return EXTERNAL_VEHICLE_STATUS[status];
  }
  return EXTERNAL_VEHICLE_STATUS.active; // Default fallback
};

// License plate validation (reuse from vehicleUtils)
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

// Thai ID card validation
export const validateThaiIdCard = (idCard: string): boolean => {
  if (!idCard) return true; // Optional field

  // Remove all non-digits
  const cleaned = idCard.replace(/\D/g, "");

  // Must be exactly 13 digits
  if (cleaned.length !== 13) return false;

  // Validate checksum using Thai ID algorithm
  let sum = 0;
  for (let i = 0; i < 12; i++) {
    sum += parseInt(cleaned.charAt(i)) * (13 - i);
  }

  const checkDigit = (11 - (sum % 11)) % 10;
  return checkDigit === parseInt(cleaned.charAt(12));
};

export const formatThaiIdCard = (idCard: string): string => {
  if (!idCard) return "";

  const cleaned = idCard.replace(/\D/g, "");

  if (cleaned.length !== 13) return idCard;

  // Format as X-XXXX-XXXXX-XX-X
  return `${cleaned.substring(0, 1)}-${cleaned.substring(1, 5)}-${cleaned.substring(5, 10)}-${cleaned.substring(10, 12)}-${cleaned.substring(12, 13)}`;
};

// Name validation
export const validateThaiName = (name: string): boolean => {
  if (!name || !name.trim()) return false;

  // Allow Thai characters, English characters, spaces, and common name characters
  const namePattern = /^[ก-๙a-zA-Z\s\-\.]+$/;
  return namePattern.test(name.trim()) && name.trim().length >= 2;
};

// Visitor status determination (simpler than vehicle status)
export const getVisitorDisplayStatus = (visitor: VisitorItem) => {
  // External visitors are generally active unless specifically blocked
  // Can be extended with more logic if needed
  return EXTERNAL_VEHICLE_STATUS.active;
};

// Search helper function
export const searchVisitors = (
  visitors: VisitorItem[],
  filters: {
    firstName?: string;
    lastName?: string;
    licensePlate?: string;
    gender?: string;
    houseId?: string;
    idCard?: string;
    areaCode?: string;
    dateRange?: {
      start?: string;
      end?: string;
    };
  }
) => {
  return visitors.filter((visitor) => {
    // First name search
    if (filters.firstName) {
      const searchTerm = filters.firstName.toLowerCase();
      const visitorFirstName = visitor.first_name.toLowerCase();
      if (!visitorFirstName.includes(searchTerm)) {
        return false;
      }
    }

    // Last name search
    if (filters.lastName) {
      const searchTerm = filters.lastName.toLowerCase();
      const visitorLastName = visitor.last_name.toLowerCase();
      if (!visitorLastName.includes(searchTerm)) {
        return false;
      }
    }

    // License plate search (fuzzy matching)
    if (filters.licensePlate) {
      const searchTerm = normalizeLicensePlate(filters.licensePlate);
      const visitorPlate = normalizeLicensePlate(visitor.vehicle.license_plate);
      if (!visitorPlate.includes(searchTerm)) {
        return false;
      }
    }

    // Gender filter
    if (filters.gender && visitor.gender !== filters.gender) {
      return false;
    }

    // House filter
    if (filters.houseId && visitor.house_id !== filters.houseId) {
      return false;
    }

    // ID Card search
    if (filters.idCard) {
      const searchTerm = filters.idCard.replace(/\D/g, "");
      const visitorIdCard = visitor.id_card.replace(/\D/g, "");
      if (!visitorIdCard.includes(searchTerm)) {
        return false;
      }
    }

    // Area code filter
    if (filters.areaCode && visitor.vehicle.area_code !== filters.areaCode) {
      return false;
    }

    // Date range filter
    if (filters.dateRange) {
      const visitorDate = new Date(visitor.created);

      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        if (visitorDate < startDate) {
          return false;
        }
      }

      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        endDate.setHours(23, 59, 59, 999);
        if (visitorDate > endDate) {
          return false;
        }
      }
    }

    return true;
  });
};

// Statistics helper functions
export const getVisitorStatistics = (visitors: VisitorItem[]) => {
  const stats = {
    total: visitors.length,
    byGender: {} as Record<string, number>,
    byProvince: {} as Record<string, number>,
    byHouse: {} as Record<string, number>,
    recentVisitors: 0, // Visitors created in last 24 hours
    todayVisitors: 0, // Visitors created today
  };

  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const yesterday = new Date(today.getTime() - 24 * 60 * 60 * 1000);

  visitors.forEach((visitor) => {
    const genderLabel = getGenderInfo(visitor.gender).label;
    const provinceName = getProvinceName(visitor.vehicle.area_code);
    const createdDate = new Date(visitor.created);

    // Count by gender
    stats.byGender[genderLabel] = (stats.byGender[genderLabel] || 0) + 1;

    // Count by province
    stats.byProvince[provinceName] = (stats.byProvince[provinceName] || 0) + 1;

    // Count by house (if expand data is available)
    const houseLabel = visitor.expand?.house_id?.address || visitor.house_id;
    stats.byHouse[houseLabel] = (stats.byHouse[houseLabel] || 0) + 1;

    // Count recent visitors
    if (createdDate >= yesterday) {
      stats.recentVisitors++;
    }

    // Count today's visitors
    if (createdDate >= today) {
      stats.todayVisitors++;
    }
  });

  return stats;
};

// Export utilities for CSV/Excel
export const prepareVisitorDataForExport = (visitors: VisitorItem[]) => {
  return visitors.map((visitor) => {
    const genderInfo = getGenderInfo(visitor.gender);
    const provinceName = getProvinceName(visitor.vehicle.area_code);
    const status = getVisitorDisplayStatus(visitor);

    return {
      ชื่อ: visitor.first_name,
      นามสกุล: visitor.last_name,
      เพศ: genderInfo.label,
      เลขบัตรประชาชน: visitor.id_card || "",
      ป้ายทะเบียน: visitor.vehicle.license_plate,
      จังหวัด: provinceName,
      บ้าน: visitor.expand?.house_id?.address || visitor.house_id,
      พื้นที่อนุญาต: visitor.expand?.authorized_area
        ? visitor.expand.authorized_area
            .map((area: any) => area.name)
            .join(", ")
        : `${visitor.authorized_area.length} พื้นที่`,
      ผู้สร้าง: visitor.expand?.issuer
        ? `${visitor.expand.issuer.first_name || ""} ${visitor.expand.issuer.last_name || ""}`.trim()
        : visitor.issuer,
      ผู้อนุมัติ: visitor.expand?.stamper
        ? `${visitor.expand.stamper.first_name || ""} ${visitor.expand.stamper.last_name || ""}`.trim()
        : visitor.stamper || "",
      วันที่อนุมัติ: visitor.stamped_time
        ? new Date(visitor.stamped_time).toLocaleDateString("th-TH")
        : "",
      สถานะ: status.label,
      หมายเหตุ: visitor.note || "",
      วันที่สร้าง: new Date(visitor.created).toLocaleDateString("th-TH"),
      อัปเดตล่าสุด: new Date(visitor.updated).toLocaleDateString("th-TH"),
    };
  });
};

// Sorting helper functions
export const sortVisitors = (
  visitors: VisitorItem[],
  sortBy: string,
  sortOrder: "asc" | "desc" = "asc"
) => {
  return [...visitors].sort((a, b) => {
    let valueA: any;
    let valueB: any;

    switch (sortBy) {
      case "first_name":
        valueA = a.first_name.toLowerCase();
        valueB = b.first_name.toLowerCase();
        break;
      case "last_name":
        valueA = a.last_name.toLowerCase();
        valueB = b.last_name.toLowerCase();
        break;
      case "license_plate":
        valueA = normalizeLicensePlate(a.vehicle.license_plate);
        valueB = normalizeLicensePlate(b.vehicle.license_plate);
        break;
      case "gender":
        valueA = getGenderInfo(a.gender).label;
        valueB = getGenderInfo(b.gender).label;
        break;
      case "province":
        valueA = getProvinceName(a.vehicle.area_code);
        valueB = getProvinceName(b.vehicle.area_code);
        break;
      case "house":
        valueA = a.expand?.house_id?.address || a.house_id;
        valueB = b.expand?.house_id?.address || b.house_id;
        break;
      case "created":
        valueA = new Date(a.created).getTime();
        valueB = new Date(b.created).getTime();
        break;
      case "updated":
        valueA = new Date(a.updated).getTime();
        valueB = new Date(b.updated).getTime();
        break;
      default:
        valueA = a[sortBy as keyof VisitorItem];
        valueB = b[sortBy as keyof VisitorItem];
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

// Helper function to generate full name
export const getVisitorFullName = (visitor: VisitorItem): string => {
  return `${visitor.first_name} ${visitor.last_name}`.trim();
};

// Helper function to get display name for UI
export const getVisitorDisplayName = (visitor: VisitorItem): string => {
  const fullName = getVisitorFullName(visitor);
  const licensePlate = visitor.vehicle.license_plate;
  return `${fullName} (${licensePlate})`;
};

// Date formatting helper
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
      month: "long",
      day: "numeric",
      timeZone: "Asia/Bangkok",
    });
  } catch (error) {
    return dateString;
  }
};
