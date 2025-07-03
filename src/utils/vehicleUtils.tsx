export const VEHICLE_TIERS = {
  resident: { label: "ลูกบ้าน", color: "bg-blue-100 text-blue-800" },
  staff: { label: "เจ้าหน้าที่", color: "bg-green-100 text-green-800" },
  invited: { label: "แขก", color: "bg-yellow-100 text-yellow-800" },
  unknown: { label: "ไม่ทราบ", color: "bg-gray-100 text-gray-800" },
  blacklisted: { label: "บัญชีดำ", color: "bg-red-100 text-red-800" },
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
} as const;

export type VehicleTier = keyof typeof VEHICLE_TIERS;
export type ProvinceCode = keyof typeof THAI_PROVINCES;

export const getTierInfo = (tier: string) => {
  return VEHICLE_TIERS[tier as VehicleTier] || VEHICLE_TIERS.unknown;
};

export const getProvinceName = (areaCode: string) => {
  return THAI_PROVINCES[areaCode as ProvinceCode] || areaCode;
};

export const isVehicleExpired = (expireTime: string) => {
  if (!expireTime) return false;
  return new Date(expireTime) < new Date();
};

export const formatVehicleDateTime = (dateString: string) => {
  if (!dateString) return "";

  try {
    const date = new Date(dateString);
    return date.toLocaleDateString("th-TH", {
      year: "numeric",
      month: "short",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return "";
  }
};

export const validateLicensePlate = (licensePlate: string) => {
  // Basic validation for Thai license plates
  const patterns = [
    /^[ก-ฮ]{2}\s?\d{4}$/, // Old format: กข 1234
    /^\d[ก-ฮ]{2}\d{3}$/, // New format: 1กข234
  ];

  return patterns.some((pattern) =>
    pattern.test(licensePlate.replace(/\s/g, ""))
  );
};
