// src/utils/invitationUtils.tsx
import { InvitationItem } from "@/api/invitation/invitation";

// Invitation status definitions
export const INVITATION_STATUS = {
  pending: {
    label: "รอเริ่มใช้",
    color: "bg-yellow-100 text-yellow-800",
    priority: 1,
    description: "บัตรเชิญที่ยังไม่ถึงเวลาเริ่มใช้งาน",
  },
  active: {
    label: "ใช้งานได้",
    color: "bg-green-100 text-green-800",
    priority: 2,
    description: "บัตรเชิญที่สามารถใช้งานได้ปกติ",
  },
  expiring: {
    label: "ใกล้หมดอายุ",
    color: "bg-orange-100 text-orange-800",
    priority: 3,
    description: "บัตรเชิญที่ใกล้หมดอายุภายใน 24 ชั่วโมง",
  },
  expired: {
    label: "หมดอายุ",
    color: "bg-red-100 text-red-800",
    priority: 4,
    description: "บัตรเชิญที่หมดอายุแล้ว",
  },
  inactive: {
    label: "ปิดใช้งาน",
    color: "bg-gray-100 text-gray-800",
    priority: 5,
    description: "บัตรเชิญที่ถูกปิดใช้งาน",
  },
} as const;

// Validation functions
export const isValidInvitationStatus = (
  status: string
): status is keyof typeof INVITATION_STATUS => {
  return Object.keys(INVITATION_STATUS).includes(status);
};

// Date and time utilities for invitations
export const isInvitationExpired = (expireTime: string): boolean => {
  if (!expireTime) return false;
  try {
    return new Date(expireTime) < new Date();
  } catch {
    return false;
  }
};

export const isInvitationPending = (startTime: string): boolean => {
  if (!startTime) return false;
  try {
    return new Date(startTime) > new Date();
  } catch {
    return false;
  }
};

export const isInvitationActive = (invitation: InvitationItem): boolean => {
  if (!invitation.active) return false;

  const now = new Date();
  const startTime = new Date(invitation.start_time);
  const expireTime = new Date(invitation.expire_time);

  return now >= startTime && now <= expireTime;
};

export const getInvitationExpiryHours = (expireTime: string): number => {
  if (!expireTime) return Infinity;
  try {
    const expireDate = new Date(expireTime);
    const now = new Date();
    const diffTime = expireDate.getTime() - now.getTime();
    return Math.ceil(diffTime / (1000 * 60 * 60)); // Convert to hours
  } catch {
    return 0;
  }
};

export const isInvitationExpiringSoon = (
  expireTime: string,
  withinHours: number = 24
): boolean => {
  const hoursUntilExpiry = getInvitationExpiryHours(expireTime);
  return hoursUntilExpiry > 0 && hoursUntilExpiry <= withinHours;
};

export const getInvitationDuration = (
  startTime: string,
  expireTime: string
): string => {
  try {
    const start = new Date(startTime);
    const expire = new Date(expireTime);
    const diffMs = expire.getTime() - start.getTime();

    const days = Math.floor(diffMs / (1000 * 60 * 60 * 24));
    const hours = Math.floor(
      (diffMs % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)
    );
    const minutes = Math.floor((diffMs % (1000 * 60 * 60)) / (1000 * 60));

    if (days > 0) {
      return `${days} วัน ${hours} ชั่วโมง`;
    } else if (hours > 0) {
      return `${hours} ชั่วโมง ${minutes} นาที`;
    } else {
      return `${minutes} นาที`;
    }
  } catch {
    return "ไม่ทราบ";
  }
};

// Status determination
export const getInvitationDisplayStatus = (invitation: InvitationItem) => {
  // Check if inactive
  if (!invitation.active) {
    return INVITATION_STATUS.inactive;
  }

  const now = new Date();
  const startTime = new Date(invitation.start_time);
  const expireTime = new Date(invitation.expire_time);

  // Check if expired
  if (now > expireTime) {
    return INVITATION_STATUS.expired;
  }

  // Check if not yet active (pending)
  if (now < startTime) {
    return INVITATION_STATUS.pending;
  }

  // Check if expiring soon (within 24 hours)
  if (isInvitationExpiringSoon(invitation.expire_time)) {
    const hoursLeft = getInvitationExpiryHours(invitation.expire_time);
    return {
      ...INVITATION_STATUS.expiring,
      label: `เหลือ ${hoursLeft} ชั่วโมง`,
    };
  }

  // Active status
  return INVITATION_STATUS.active;
};

// Search helper function
export const searchInvitations = (
  invitations: InvitationItem[],
  filters: {
    visitorName?: string;
    houseId?: string;
    status?: string;
    issuerId?: string;
    dateRange?: {
      start?: string;
      end?: string;
    };
  }
) => {
  return invitations.filter((invitation) => {
    // Visitor name search (fuzzy matching)
    if (filters.visitorName) {
      const searchTerm = filters.visitorName.toLowerCase();
      const visitorName = invitation.visitor_name.toLowerCase();
      if (!visitorName.includes(searchTerm)) {
        return false;
      }
    }

    // House filter
    if (filters.houseId && invitation.house_id !== filters.houseId) {
      return false;
    }

    // Issuer filter
    if (filters.issuerId && invitation.issuer !== filters.issuerId) {
      return false;
    }

    // Status filter
    if (filters.status) {
      const invitationStatus = getInvitationDisplayStatus(invitation);
      if (
        invitationStatus.priority !==
        INVITATION_STATUS[filters.status as keyof typeof INVITATION_STATUS]
          ?.priority
      ) {
        return false;
      }
    }

    // Date range filter
    if (filters.dateRange) {
      const invitationDate = new Date(invitation.created);

      if (filters.dateRange.start) {
        const startDate = new Date(filters.dateRange.start);
        if (invitationDate < startDate) {
          return false;
        }
      }

      if (filters.dateRange.end) {
        const endDate = new Date(filters.dateRange.end);
        if (invitationDate > endDate) {
          return false;
        }
      }
    }

    return true;
  });
};

// Statistics helper functions
export const getInvitationStatistics = (invitations: InvitationItem[]) => {
  const stats = {
    total: invitations.length,
    active: 0,
    pending: 0,
    expiring: 0,
    expired: 0,
    inactive: 0,
    byHouse: {} as Record<string, number>,
    byIssuer: {} as Record<string, number>,
  };

  invitations.forEach((invitation) => {
    const status = getInvitationDisplayStatus(invitation);

    // Count by status
    switch (status.priority) {
      case INVITATION_STATUS.pending.priority:
        stats.pending++;
        break;
      case INVITATION_STATUS.active.priority:
        stats.active++;
        break;
      case INVITATION_STATUS.expiring.priority:
        stats.expiring++;
        break;
      case INVITATION_STATUS.expired.priority:
        stats.expired++;
        break;
      case INVITATION_STATUS.inactive.priority:
        stats.inactive++;
        break;
    }

    // Count by house (using expand data if available)
    const houseLabel =
      invitation.expand?.house_id?.address || invitation.house_id || "ไม่ระบุ";
    stats.byHouse[houseLabel] = (stats.byHouse[houseLabel] || 0) + 1;

    // Count by issuer (using expand data if available)
    const issuerLabel = invitation.expand?.issuer
      ? `${invitation.expand.issuer.first_name} ${invitation.expand.issuer.last_name}`.trim()
      : invitation.issuer || "ไม่ระบุ";
    stats.byIssuer[issuerLabel] = (stats.byIssuer[issuerLabel] || 0) + 1;
  });

  return stats;
};

// Export utilities for CSV/Excel
export const prepareInvitationDataForExport = (
  invitations: InvitationItem[]
) => {
  return invitations.map((invitation) => {
    const status = getInvitationDisplayStatus(invitation);
    const duration = getInvitationDuration(
      invitation.start_time,
      invitation.expire_time
    );

    return {
      ชื่อผู้เยี่ยม: invitation.visitor_name,
      บ้าน: invitation.expand?.house_id?.address || invitation.house_id || "",
      เวลาเริ่มต้น: new Date(invitation.start_time).toLocaleString("th-TH"),
      เวลาสิ้นสุด: new Date(invitation.expire_time).toLocaleString("th-TH"),
      ระยะเวลา: duration,
      สถานะ: status.label,
      ใช้งาน: invitation.active ? "เปิด" : "ปิด",
      พื้นที่อนุญาต: invitation.authorized_area.length,
      ผู้สร้าง: invitation.expand?.issuer
        ? `${invitation.expand.issuer.first_name} ${invitation.expand.issuer.last_name}`.trim()
        : invitation.issuer,
      หมายเหตุ: invitation.note || "",
      วันที่สร้าง: new Date(invitation.created).toLocaleDateString("th-TH"),
      อัปเดตล่าสุด: new Date(invitation.updated).toLocaleDateString("th-TH"),
    };
  });
};

// Sorting helper functions
export const sortInvitations = (
  invitations: InvitationItem[],
  sortBy: string,
  sortOrder: "asc" | "desc" = "asc"
) => {
  return [...invitations].sort((a, b) => {
    let valueA: any;
    let valueB: any;

    switch (sortBy) {
      case "visitor_name":
        valueA = a.visitor_name.toLowerCase();
        valueB = b.visitor_name.toLowerCase();
        break;
      case "status":
        valueA = getInvitationDisplayStatus(a).priority;
        valueB = getInvitationDisplayStatus(b).priority;
        break;
      case "start_time":
        valueA = new Date(a.start_time).getTime();
        valueB = new Date(b.start_time).getTime();
        break;
      case "expire_time":
        valueA = new Date(a.expire_time).getTime();
        valueB = new Date(b.expire_time).getTime();
        break;
      case "created":
        valueA = new Date(a.created).getTime();
        valueB = new Date(b.created).getTime();
        break;
      case "house":
        valueA = (
          a.expand?.house_id?.address ||
          a.house_id ||
          ""
        ).toLowerCase();
        valueB = (
          b.expand?.house_id?.address ||
          b.house_id ||
          ""
        ).toLowerCase();
        break;
      case "issuer":
        valueA = a.expand?.issuer
          ? `${a.expand.issuer.first_name} ${a.expand.issuer.last_name}`.toLowerCase()
          : (a.issuer || "").toLowerCase();
        valueB = b.expand?.issuer
          ? `${b.expand.issuer.first_name} ${b.expand.issuer.last_name}`.toLowerCase()
          : (b.issuer || "").toLowerCase();
        break;
      default:
        valueA = a[sortBy as keyof InvitationItem];
        valueB = b[sortBy as keyof InvitationItem];
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

// Validation helpers
export const validateInvitationTimeRange = (
  startTime: string,
  expireTime: string
): string | null => {
  try {
    const start = new Date(startTime);
    const expire = new Date(expireTime);
    const now = new Date();

    if (isNaN(start.getTime()) || isNaN(expire.getTime())) {
      return "รูปแบบเวลาไม่ถูกต้อง";
    }

    if (start >= expire) {
      return "เวลาเริ่มต้นต้องน้อยกว่าเวลาสิ้นสุด";
    }

    if (expire <= now) {
      return "เวลาสิ้นสุดต้องอยู่ในอนาคต";
    }

    // Check if duration is too short (less than 5 minutes)
    const durationMs = expire.getTime() - start.getTime();
    const minDurationMs = 5 * 60 * 1000; // 5 minutes
    if (durationMs < minDurationMs) {
      return "ระยะเวลาการเชิญต้องไม่น้อยกว่า 5 นาที";
    }

    // Check if duration is too long (more than 30 days)
    const maxDurationMs = 30 * 24 * 60 * 60 * 1000; // 30 days
    if (durationMs > maxDurationMs) {
      return "ระยะเวลาการเชิญต้องไม่เกิน 30 วัน";
    }

    return null; // Valid
  } catch {
    return "เกิดข้อผิดพลาดในการตรวจสอบเวลา";
  }
};
