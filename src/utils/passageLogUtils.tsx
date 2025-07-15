// src/utils/passageLogUtils.tsx
import { PassageLogItem } from "@/api/passage_log/passage_log";

// Passage log status definitions
export const PASSAGE_STATUS = {
  success: {
    label: "สำเร็จ",
    color: "bg-green-100 text-green-800",
    priority: 1,
    description: "การเข้าออกสำเร็จ",
  },
  pending: {
    label: "รอดำเนินการ",
    color: "bg-yellow-100 text-yellow-800",
    priority: 2,
    description: "รอการยืนยันการเข้าออก",
  },
  failed: {
    label: "ล้มเหลว",
    color: "bg-red-100 text-red-800",
    priority: 3,
    description: "การเข้าออกล้มเหลว",
  },
} as const;

// Verification method definitions
export const VERIFICATION_METHODS = {
  qr_code: {
    label: "QR Code",
    color: "bg-blue-100 text-blue-800",
    icon: "📱",
    description: "ยืนยันผ่าน QR Code",
  },
  manual: {
    label: "ตรวจสอบด้วยตนเอง",
    color: "bg-purple-100 text-purple-800",
    icon: "👤",
    description: "เจ้าหน้าที่ตรวจสอบด้วยตนเอง",
  },
  vehicle_plate: {
    label: "ป้ายทะเบียน",
    color: "bg-indigo-100 text-indigo-800",
    icon: "🚗",
    description: "ตรวจสอบผ่านป้ายทะเบียนรถ",
  },
  facial_recognition: {
    label: "ใบหน้า",
    color: "bg-teal-100 text-teal-800",
    icon: "🎭",
    description: "ตรวจสอบผ่านใบหน้า",
  },
} as const;

// Passage type definitions
export const PASSAGE_TYPES = {
  entry: {
    label: "เข้า",
    color: "bg-green-100 text-green-800",
    icon: "→",
    description: "การเข้าสู่พื้นที่",
  },
  exit: {
    label: "ออก",
    color: "bg-orange-100 text-orange-800",
    icon: "←",
    description: "การออกจากพื้นที่",
  },
} as const;

// Validation functions
export const isValidPassageStatus = (
  status: string
): status is keyof typeof PASSAGE_STATUS => {
  return Object.keys(PASSAGE_STATUS).includes(status);
};

export const isValidVerificationMethod = (
  method: string
): method is keyof typeof VERIFICATION_METHODS => {
  return Object.keys(VERIFICATION_METHODS).includes(method);
};

export const isValidPassageType = (
  type: string
): type is keyof typeof PASSAGE_TYPES => {
  return Object.keys(PASSAGE_TYPES).includes(type);
};

// Time utilities for passage logs
export const calculateDuration = (
  entryTime: string,
  exitTime?: string
): string => {
  try {
    const entry = new Date(entryTime);
    const exit = exitTime ? new Date(exitTime) : new Date();

    const diffMs = exit.getTime() - entry.getTime();

    if (diffMs < 0) return "ไม่ถูกต้อง";

    const hours = Math.floor(diffMs / (1000 * 60 * 60));
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (hours > 0) {
      return `${hours} ชั่วโมง ${minutes} นาที`;
    } else {
      return `${minutes} นาที`;
    }
  } catch {
    return "ไม่ทราบ";
  }
};

export const isStillInside = (passageLog: PassageLogItem): boolean => {
  return passageLog.passage_type === "entry" && !passageLog.exit_time;
};

export const getTimeInLocation = (passageLog: PassageLogItem): string => {
  if (passageLog.passage_type === "exit" || !passageLog.entry_time) {
    return "-";
  }

  return calculateDuration(passageLog.entry_time, passageLog.exit_time);
};

// Status determination
export const getPassageDisplayStatus = (passageLog: PassageLogItem) => {
  return PASSAGE_STATUS[passageLog.status] || PASSAGE_STATUS.pending;
};

export const getVerificationMethodDisplay = (passageLog: PassageLogItem) => {
  return (
    VERIFICATION_METHODS[passageLog.verification_method] || {
      label: passageLog.verification_method,
      color: "bg-gray-100 text-gray-800",
      icon: "❓",
      description: "วิธีการยืนยันไม่ทราบ",
    }
  );
};

export const getPassageTypeDisplay = (passageLog: PassageLogItem) => {
  return (
    PASSAGE_TYPES[passageLog.passage_type] || {
      label: passageLog.passage_type,
      color: "bg-gray-100 text-gray-800",
      icon: "?",
      description: "ประเภทการผ่านไม่ทราบ",
    }
  );
};

// Search helper function
export const searchPassageLogs = (
  passageLogs: PassageLogItem[],
  filters: {
    visitorName?: string;
    passageType?: "entry" | "exit";
    locationArea?: string;
    verificationMethod?: string;
    status?: string;
    dateRange?: {
      start?: string;
      end?: string;
    };
  }
) => {
  return passageLogs.filter((passageLog) => {
    // Visitor name search (fuzzy matching)
    if (filters.visitorName) {
      const searchTerm = filters.visitorName.toLowerCase();
      const visitorName = passageLog.visitor_name.toLowerCase();
      if (!visitorName.includes(searchTerm)) {
        return false;
      }
    }

    // Passage type filter
    if (
      filters.passageType &&
      passageLog.passage_type !== filters.passageType
    ) {
      return false;
    }

    // Location area filter
    if (
      filters.locationArea &&
      passageLog.location_area !== filters.locationArea
    ) {
      return false;
    }

    // Verification method filter
    if (
      filters.verificationMethod &&
      passageLog.verification_method !== filters.verificationMethod
    ) {
      return false;
    }

    // Status filter
    if (filters.status && passageLog.status !== filters.status) {
      return false;
    }

    // Date range filter
    if (filters.dateRange) {
      const passageDate = new Date(passageLog.created);

      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        if (passageDate < startDate) {
          return false;
        }
      }

      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        if (passageDate > endDate) {
          return false;
        }
      }
    }

    return true;
  });
};

// Statistics helper functions
export const getPassageLogStatistics = (passageLogs: PassageLogItem[]) => {
  const stats = {
    total: passageLogs.length,
    entries: 0,
    exits: 0,
    stillInside: 0,
    success: 0,
    pending: 0,
    failed: 0,
    byVerificationMethod: {} as Record<string, number>,
    byLocation: {} as Record<string, number>,
    byHour: {} as Record<string, number>,
  };

  passageLogs.forEach((passageLog) => {
    // Count by passage type
    if (passageLog.passage_type === "entry") {
      stats.entries++;
      if (!passageLog.exit_time) {
        stats.stillInside++;
      }
    } else {
      stats.exits++;
    }

    // Count by status
    switch (passageLog.status) {
      case "success":
        stats.success++;
        break;
      case "pending":
        stats.pending++;
        break;
      case "failed":
        stats.failed++;
        break;
    }

    // Count by verification method
    const methodLabel =
      VERIFICATION_METHODS[passageLog.verification_method]?.label ||
      passageLog.verification_method;
    stats.byVerificationMethod[methodLabel] =
      (stats.byVerificationMethod[methodLabel] || 0) + 1;

    // Count by location (using expand data if available)
    const locationLabel =
      passageLog.expand?.location_area?.name ||
      passageLog.location_area ||
      "ไม่ระบุ";
    stats.byLocation[locationLabel] =
      (stats.byLocation[locationLabel] || 0) + 1;

    // Count by hour
    const hour = new Date(passageLog.created).getHours();
    const hourLabel = `${hour.toString().padStart(2, "0")}:00`;
    stats.byHour[hourLabel] = (stats.byHour[hourLabel] || 0) + 1;
  });

  return stats;
};

// Export utilities for CSV/Excel
export const preparePassageLogDataForExport = (
  passageLogs: PassageLogItem[]
) => {
  return passageLogs.map((passageLog) => {
    const status = getPassageDisplayStatus(passageLog);
    const verificationType = getVerificationMethodDisplay(passageLog);
    const passageType = getPassageTypeDisplay(passageLog);
    const duration = getTimeInLocation(passageLog);

    return {
      ชื่อผู้เยี่ยม: passageLog.visitor_name,
      ประเภท: passageType.label,
      เวลาเข้า: passageLog.entry_time
        ? new Date(passageLog.entry_time).toLocaleString("th-TH")
        : "-",
      เวลาออก: passageLog.exit_time
        ? new Date(passageLog.exit_time).toLocaleString("th-TH")
        : "-",
      ระยะเวลา: duration,
      พื้นที่:
        passageLog.expand?.location_area?.name ||
        passageLog.location_area ||
        "",
      วิธียืนยัน: verificationType.label,
      ข้อมูลยืนยัน: passageLog.verification_data || "-",
      เจ้าหน้าที่ยืนยัน:
        passageLog.expand?.staff_verified_by?.first_name || "-",
      สถานะ: status.label,
      บัตรเชิญเกี่ยวข้อง: passageLog.invitation_id || "-",
      ยานพาหนะเกี่ยวข้อง: passageLog.vehicle_id || "-",
      บ้านเกี่ยวข้อง:
        passageLog.expand?.house_id?.address || passageLog.house_id || "-",
      หมายเหตุ: passageLog.notes || "",
      วันที่บันทึก: new Date(passageLog.created).toLocaleDateString("th-TH"),
      อัปเดตล่าสุด: new Date(passageLog.updated).toLocaleDateString("th-TH"),
    };
  });
};

// Sorting helper functions
export const sortPassageLogs = (
  passageLogs: PassageLogItem[],
  sortBy: string,
  sortOrder: "asc" | "desc" = "asc"
) => {
  return [...passageLogs].sort((a, b) => {
    let valueA: any;
    let valueB: any;

    switch (sortBy) {
      case "visitor_name":
        valueA = a.visitor_name.toLowerCase();
        valueB = b.visitor_name.toLowerCase();
        break;
      case "passage_type":
        valueA = a.passage_type;
        valueB = b.passage_type;
        break;
      case "entry_time":
        valueA = new Date(a.entry_time).getTime();
        valueB = new Date(b.entry_time).getTime();
        break;
      case "exit_time":
        valueA = a.exit_time ? new Date(a.exit_time).getTime() : 0;
        valueB = b.exit_time ? new Date(b.exit_time).getTime() : 0;
        break;
      case "created":
        valueA = new Date(a.created).getTime();
        valueB = new Date(b.created).getTime();
        break;
      case "status":
        valueA = PASSAGE_STATUS[a.status]?.priority || 999;
        valueB = PASSAGE_STATUS[b.status]?.priority || 999;
        break;
      case "verification_method":
        valueA = a.verification_method;
        valueB = b.verification_method;
        break;
      case "location":
        valueA = (
          a.expand?.location_area?.name ||
          a.location_area ||
          ""
        ).toLowerCase();
        valueB = (
          b.expand?.location_area?.name ||
          b.location_area ||
          ""
        ).toLowerCase();
        break;
      case "duration":
        valueA = a.exit_time
          ? new Date(a.exit_time).getTime() - new Date(a.entry_time).getTime()
          : new Date().getTime() - new Date(a.entry_time).getTime();
        valueB = b.exit_time
          ? new Date(b.exit_time).getTime() - new Date(b.entry_time).getTime()
          : new Date().getTime() - new Date(b.entry_time).getTime();
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

// Date formatting utilities
export const formatThaiDateTime = (dateString: string): string => {
  try {
    return new Date(dateString).toLocaleString("th-TH", {
      year: "numeric",
      month: "long",
      day: "numeric",
      hour: "2-digit",
      minute: "2-digit",
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
    });
  } catch {
    return dateString;
  }
};

// Validation helpers
export const validatePassageLogTimeRange = (
  entryTime: string,
  exitTime?: string
): string | null => {
  try {
    const entry = new Date(entryTime);

    if (isNaN(entry.getTime())) {
      return "รูปแบบเวลาเข้าไม่ถูกต้อง";
    }

    if (exitTime) {
      const exit = new Date(exitTime);

      if (isNaN(exit.getTime())) {
        return "รูปแบบเวลาออกไม่ถูกต้อง";
      }

      if (exit <= entry) {
        return "เวลาออกต้องมากกว่าเวลาเข้า";
      }

      // Check if duration is too long (more than 30 days)
      const durationMs = exit.getTime() - entry.getTime();
      const maxDurationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
      if (durationMs > maxDurationMs) {
        return "ระยะเวลาการเข้าพักต้องไม่เกิน 30 วัน";
      }
    }

    return null; // Valid
  } catch {
    return "เกิดข้อผิดพลาดในการตรวจสอบเวลา";
  }
};
