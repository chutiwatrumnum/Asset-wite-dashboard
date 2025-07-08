// src/components/ui/qr-code-generator.tsx
import { toast } from "sonner";
import type { InvitationItem } from "@/api/invitation/invitation";

interface QRCodeData {
  code: string;
  visitor: string;
  house: string;
  areas: string;
  startTime: string;
  endTime: string;
  active: boolean;
  note: string;
  issuer: string;
}

// Function to generate detailed QR Code data
const generateQRData = (invitationData: InvitationItem): QRCodeData => {
  // Format dates for display
  const formatDateTime = (dateString: string) => {
    try {
      return new Date(dateString).toLocaleString("th-TH", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
        timeZone: "Asia/Bangkok",
      });
    } catch {
      return dateString;
    }
  };

  // Get house name from expand data or fallback
  const getHouseName = () => {
    if (invitationData.expand?.house_id?.address) {
      return invitationData.expand.house_id.address;
    }
    if (invitationData.expand?.house_id?.name) {
      return invitationData.expand.house_id.name;
    }
    // Fallback for known house IDs
    const houseMap: { [key: string]: string } = {
      st393sf218f361f: "Office",
      x2ya432jpgeluxl: "James home",
      "3r0sy967yth90f6": "103/99",
    };
    return houseMap[invitationData.house_id] || "บ้าน";
  };

  // Get area names from expand data
  const getAreaNames = () => {
    if (
      invitationData.expand?.authorized_area &&
      invitationData.expand.authorized_area.length > 0
    ) {
      return invitationData.expand.authorized_area
        .map((area: any) => area.name)
        .join(", ");
    }
    return `${invitationData.authorized_area.length} พื้นที่`;
  };

  return {
    code: invitationData.code,
    visitor: invitationData.visitor_name,
    house: getHouseName(),
    areas: getAreaNames(),
    startTime: formatDateTime(invitationData.start_time),
    endTime: formatDateTime(invitationData.expire_time),
    active: invitationData.active,
    note: invitationData.note || "",
    issuer: invitationData.expand?.issuer
      ? `${invitationData.expand.issuer.first_name || ""} ${invitationData.expand.issuer.last_name || ""}`.trim()
      : "ระบบ",
  };
};

// Function to create and configure canvas for QR code with text
const createQRCanvas = (
  qrImage: HTMLImageElement,
  invitationData: InvitationItem,
  qrData: QRCodeData
): HTMLCanvasElement => {
  const canvas = document.createElement("canvas");
  const ctx = canvas.getContext("2d")!;

  // Calculate required height based on area count
  const areaCount =
    invitationData.expand?.authorized_area?.length ||
    invitationData.authorized_area.length;
  const maxAreasPerLine = 2;
  const areaLines = Math.ceil(areaCount / maxAreasPerLine);
  const extraHeight = Math.max(0, (areaLines - 1) * 16);

  // Set canvas size (QR code + text area + dynamic height)
  canvas.width = 450;
  canvas.height = 580 + extraHeight;

  // Fill white background
  ctx.fillStyle = "#FFFFFF";
  ctx.fillRect(0, 0, canvas.width, canvas.height);

  // Draw QR code centered
  const qrSize = 380;
  const qrX = (canvas.width - qrSize) / 2;
  ctx.drawImage(qrImage, qrX, 10, qrSize, qrSize);

  return canvas;
};

// Function to add text information below QR code
const addTextToCanvas = (
  canvas: HTMLCanvasElement,
  invitationData: InvitationItem,
  qrData: QRCodeData
): void => {
  const ctx = canvas.getContext("2d")!;

  // Add text information below QR code
  ctx.fillStyle = "#000000";
  ctx.font = "bold 16px Arial";
  ctx.textAlign = "center";

  let currentY = 400; // Start after QR code (380 + margin)
  const lineHeight = 20;

  // Add invitation details with better formatting
  ctx.fillText(`ผู้เยี่ยม: ${qrData.visitor}`, canvas.width / 2, currentY);
  currentY += lineHeight;

  // House information
  ctx.fillText(`บ้าน: ${qrData.house}`, canvas.width / 2, currentY);
  currentY += lineHeight;

  // Area information - handle multiple areas properly
  ctx.font = "14px Arial";
  if (
    invitationData.expand?.authorized_area &&
    invitationData.expand.authorized_area.length > 0
  ) {
    const areas = invitationData.expand.authorized_area;
    ctx.fillText(`พื้นที่ที่อนุญาต:`, canvas.width / 2, currentY);
    currentY += lineHeight - 2;

    // Display areas in multiple lines if needed
    const maxAreasPerLine = 2;
    for (let i = 0; i < areas.length; i += maxAreasPerLine) {
      const areaChunk = areas.slice(i, i + maxAreasPerLine);
      const areaText = areaChunk.map((area: any) => area.name).join(", ");
      ctx.fillText(areaText, canvas.width / 2, currentY);
      currentY += 16; // Smaller line height for areas
    }
  } else {
    ctx.fillText(
      `พื้นที่: ${invitationData.authorized_area.length} พื้นที่`,
      canvas.width / 2,
      currentY
    );
    currentY += lineHeight;
  }

  // Time information
  currentY += 5; // Extra space before time
  ctx.font = "13px Arial";
  ctx.fillText(`เริ่ม: ${qrData.startTime}`, canvas.width / 2, currentY);
  currentY += lineHeight - 2;
  ctx.fillText(`สิ้นสุด: ${qrData.endTime}`, canvas.width / 2, currentY);
};

// Function to download canvas as image
const downloadCanvasAsImage = (
  canvas: HTMLCanvasElement,
  fileName: string
): void => {
  canvas.toBlob((blob) => {
    if (blob) {
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;

      // Trigger download
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      // Clean up
      URL.revokeObjectURL(url);
    }
  }, "image/png");
};

// Main QR Code generation and download function
export const generateAndDownloadQRCode = async (
  invitationData: InvitationItem
): Promise<void> => {
  try {
    // Check if QR code exists
    if (!invitationData.code) {
      toast.warning("ไม่พบรหัส QR Code สำหรับบัตรเชิญนี้");
      return;
    }

    // Import QR code library dynamically
    const QRCode = await import("qrcode");

    // Generate comprehensive QR data
    const qrData = generateQRData(invitationData);
    const qrJsonString = JSON.stringify(qrData, null, 2);

    console.log("QR Data:", qrJsonString); // For debugging

    // Generate QR code as data URL with higher resolution
    const qrDataURL = await QRCode.toDataURL(qrJsonString, {
      width: 400,
      margin: 3,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M", // Medium error correction for better readability
    });

    // Create canvas and load QR image
    const qrImage = new Image();

    qrImage.onload = () => {
      // Create canvas with QR code
      const canvas = createQRCanvas(qrImage, invitationData, qrData);

      // Add text information
      addTextToCanvas(canvas, invitationData, qrData);

      // Generate filename
      const fileName = `invitation-qr-${invitationData.visitor_name}-${new Date().toISOString().split("T")[0]}.png`;

      // Download the image
      downloadCanvasAsImage(canvas, fileName);

      // Show success message
      toast.success("ดาวน์โหลด QR Code สำเร็จ", {
        description: `QR Code พร้อมข้อมูลสำหรับ ${invitationData.visitor_name} ถูกดาวน์โหลดแล้ว`,
      });
    };

    qrImage.onerror = () => {
      throw new Error("ไม่สามารถโหลด QR Code ได้");
    };

    qrImage.src = qrDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    toast.error("เกิดข้อผิดพลาดในการสร้าง QR Code", {
      description:
        error instanceof Error ? error.message : "กรุณาลองใหม่อีกครั้ง",
    });
  }
};

// Alternative function to generate QR data as JSON string for other uses
export const generateQRCodeDataString = (
  invitationData: InvitationItem
): string => {
  const qrData = generateQRData(invitationData);
  return JSON.stringify(qrData, null, 2);
};

// Function to check if invitation has valid QR code
export const hasValidQRCode = (invitationData: InvitationItem): boolean => {
  return !!(invitationData.code && invitationData.code.trim().length > 0);
};
