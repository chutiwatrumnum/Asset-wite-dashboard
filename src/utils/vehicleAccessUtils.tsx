// src/utils/vehicleAccessUtils.tsx (เพิ่มฟังก์ชันสำหรับ image handling)
import type { PassageLogItem } from "@/api/vehicle_access/vehicle_access";
import Pb from "@/api/pocketbase";

// เพิ่มฟังก์ชันใหม่สำหรับการจัดการรูปภาพ

/**
 * สร้าง URL สำหรับดูรูปภาพจาก PocketBase
 */
export const getVehicleImageUrl = (
  record: PassageLogItem,
  filename: string,
  thumb?: string
): string => {
  if (!filename || !record) return "";

  try {
    return Pb.files.getURL(record, filename, thumb);
  } catch (error) {
    console.error("Error generating image URL:", error);
    return "";
  }
};

/**
 * ตรวจสอบว่ามีรูปภาพหรือไม่
 */
export const hasVehicleImages = (record: PassageLogItem): boolean => {
  return !!(record.full_snapshot || record.lp_snapshot);
};

/**
 * ได้รับ URL รูปภาพทั้งหมดของ record
 */
export const getAllVehicleImageUrls = (record: PassageLogItem) => {
  const images = [];

  if (record.full_snapshot) {
    images.push({
      type: "full",
      title: "รูปภาพเต็ม",
      description: "รูปภาพเต็มจากกล้อง CCTV",
      filename: record.full_snapshot,
      url: getVehicleImageUrl(record, record.full_snapshot),
      thumbnail: getVehicleImageUrl(record, record.full_snapshot, "100x100"),
    });
  }

  if (record.lp_snapshot) {
    images.push({
      type: "license_plate",
      title: "รูปป้ายทะเบียน",
      description: "รูปป้ายทะเบียนที่ตรวจจับได้",
      filename: record.lp_snapshot,
      url: getVehicleImageUrl(record, record.lp_snapshot),
      thumbnail: getVehicleImageUrl(record, record.lp_snapshot, "100x100"),
    });
  }

  return images;
};

/**
 * ดาวน์โหลดรูปภาพ
 */
export const downloadVehicleImage = async (
  record: PassageLogItem,
  filename: string,
  customName?: string
): Promise<void> => {
  if (!filename) {
    throw new Error("ไม่พบไฟล์รูปภาพ");
  }

  try {
    const imageUrl = getVehicleImageUrl(record, filename);
    const response = await fetch(imageUrl);

    if (!response.ok) {
      throw new Error("ไม่สามารถดาวน์โหลดรูปภาพได้");
    }

    const blob = await response.blob();
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");

    link.href = url;
    link.download = customName || `vehicle-${record.license_plate}-${filename}`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    URL.revokeObjectURL(url);
  } catch (error) {
    console.error("Download error:", error);
    throw error;
  }
};

/**
 * ดาวน์โหลดรูปภาพทั้งหมดเป็น ZIP
 */
export const downloadAllVehicleImages = async (
  record: PassageLogItem
): Promise<void> => {
  const images = getAllVehicleImageUrls(record);

  if (images.length === 0) {
    throw new Error("ไม่มีรูปภาพสำหรับดาวน์โหลด");
  }

  // ถ้ามีรูปเดียว ให้ดาวน์โหลดตรงๆ
  if (images.length === 1) {
    await downloadVehicleImage(record, images[0].filename, images[0].title);
    return;
  }

  // ถ้ามีหลายรูป ให้ดาวน์โหลดทีละรูป (อาจจะใช้ JSZip library ในอนาคต)
  try {
    for (const image of images) {
      await downloadVehicleImage(
        record,
        image.filename,
        `${record.license_plate}-${image.type}-${image.filename}`
      );
      // เพิ่ม delay เล็กน้อยเพื่อไม่ให้ browser block
      await new Promise((resolve) => setTimeout(resolve, 500));
    }
  } catch (error) {
    console.error("Batch download error:", error);
    throw error;
  }
};

/**
 * Parse snapshot info JSON
 */
export const parseSnapshotInfo = (snapshotInfo: string) => {
  if (!snapshotInfo) return null;

  try {
    const parsed = JSON.parse(snapshotInfo);
    return {
      confidence: parsed.confidence || 0,
      processing_time: parsed.processing_time || 0,
      camera_id: parsed.camera_id || "unknown",
      detection_method: parsed.detection_method || "AI",
      timestamp: parsed.timestamp || "",
      ...parsed,
    };
  } catch (error) {
    console.error("Error parsing snapshot info:", error);
    return null;
  }
};

/**
 * สร้าง metadata สำหรับการส่งออกรูปภาพ
 */
export const generateImageExportMetadata = (record: PassageLogItem) => {
  const snapshotInfo = parseSnapshotInfo(record.snapshot_info);
  const tierInfo = getTierInfo(record.tier);
  const gateStateInfo = getGateStateInfo(record.gate_state);

  return {
    vehicle_info: {
      license_plate: record.license_plate,
      region: getAreaName(record.area_code),
      tier: tierInfo.label,
    },
    detection_info: {
      timestamp: formatThaiDateTime(record.created),
      is_success: record.isSuccess,
      gate_state: gateStateInfo.label,
      reader: record.reader,
      gate: record.gate,
    },
    ai_info: snapshotInfo
      ? {
          confidence: `${(snapshotInfo.confidence * 100).toFixed(1)}%`,
          processing_time: `${snapshotInfo.processing_time}s`,
          camera_id: snapshotInfo.camera_id,
          detection_method: snapshotInfo.detection_method,
        }
      : null,
    house_info: record.expand?.house_id
      ? {
          address: record.expand.house_id.address,
          id: record.house_id,
        }
      : null,
    note: record.note || "",
  };
};

/**
 * สร้าง JSON file สำหรับ export พร้อมกับรูปภาพ
 */
export const exportVehicleRecordWithImages = async (
  record: PassageLogItem
): Promise<void> => {
  try {
    const metadata = generateImageExportMetadata(record);
    const images = getAllVehicleImageUrls(record);

    // สร้าง JSON metadata
    const jsonData = {
      record_id: record.id,
      export_timestamp: new Date().toISOString(),
      metadata,
      images: images.map((img) => ({
        type: img.type,
        title: img.title,
        filename: img.filename,
        description: img.description,
      })),
    };

    // ดาวน์โหลด JSON metadata
    const jsonBlob = new Blob([JSON.stringify(jsonData, null, 2)], {
      type: "application/json",
    });
    const jsonUrl = URL.createObjectURL(jsonBlob);
    const jsonLink = document.createElement("a");
    jsonLink.href = jsonUrl;
    jsonLink.download = `vehicle-record-${record.license_plate}-${record.id}.json`;
    jsonLink.click();
    URL.revokeObjectURL(jsonUrl);

    // ดาวน์โหลดรูปภาพทั้งหมด
    if (images.length > 0) {
      await downloadAllVehicleImages(record);
    }
  } catch (error) {
    console.error("Export error:", error);
    throw error;
  }
};

// เพิ่มฟังก์ชันเดิมที่มีอยู่แล้ว...
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

export const THAI_AREA_CODES = {
  "th-10": "กรุงเทพมหานคร",
  "th-11": "สมุทรปราการ",
  "th-12": "นนทบุรี",
  "th-13": "ปทุมธานี",
  // ... เหมือนเดิม
} as const;

// ฟังก์ชันเดิมทั้งหมด...
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

export const getRegionName = getAreaName; // Alias

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

// ฟังก์ชันอื่นๆ ที่มีอยู่แล้ว...
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
    if (filters.licensePlate) {
      const searchTerm = filters.licensePlate.toLowerCase().replace(/\s/g, "");
      const logPlate = log.license_plate.toLowerCase().replace(/\s/g, "");
      if (!logPlate.includes(searchTerm)) {
        return false;
      }
    }

    if (filters.tier && log.tier !== filters.tier) {
      return false;
    }

    if (filters.areaCode && log.area_code !== filters.areaCode) {
      return false;
    }

    if (filters.gateState && log.gate_state !== filters.gateState) {
      return false;
    }

    if (
      filters.isSuccess !== undefined &&
      log.isSuccess !== filters.isSuccess
    ) {
      return false;
    }

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
        endDate.setHours(23, 59, 59, 999);
        if (logDate > endDate) {
          return false;
        }
      }
    }

    return true;
  });
};

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
    if (log.isSuccess) {
      stats.successful++;
    } else {
      stats.failed++;
    }

    const tierLabel = getTierInfo(log.tier).label;
    stats.byTier[tierLabel] = (stats.byTier[tierLabel] || 0) + 1;

    const gateStateLabel = getGateStateInfo(log.gate_state).label;
    stats.byGateState[gateStateLabel] =
      (stats.byGateState[gateStateLabel] || 0) + 1;

    const areaName = getAreaName(log.area_code);
    stats.byArea[areaName] = (stats.byArea[areaName] || 0) + 1;

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
