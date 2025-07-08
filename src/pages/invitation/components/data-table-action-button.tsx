// src/pages/invitation/components/data-table-action-button.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import {
  EllipsisIcon,
  LucideTrash,
  SquarePen,
  CheckCircle,
  XCircle,
  Download,
} from "lucide-react";
import type { Cell } from "@tanstack/react-table";
import type { InvitationItem } from "@/api/invitation/invitation";
import {
  useDeleteInvitationMutation,
  useActivateInvitationMutation,
  useDeactivateInvitationMutation,
} from "@/react-query/manage/invitation";
import { MessageDialog } from "@/components/modal";
import { useState } from "react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getInvitationDisplayStatus } from "@/utils/invitationUtils";
import { EditInvitationDialog } from "./edit-invitation-dialog";

// Function to generate detailed QR Code data
const generateQRData = (invitationData: InvitationItem) => {
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

  // Create comprehensive invitation data object
  const qrData = {
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

  // Convert to JSON string for QR code
  return JSON.stringify(qrData, null, 2);
};

// Function to generate QR Code with invitation details and download
const generateAndDownloadQR = async (invitationData: InvitationItem) => {
  try {
    // Import QR code library dynamically
    const QRCode = await import("qrcode");

    // Generate comprehensive QR data
    const qrData = generateQRData(invitationData);

    console.log("QR Data:", qrData); // For debugging

    // Generate QR code as data URL with higher resolution
    const qrDataURL = await QRCode.toDataURL(qrData, {
      width: 400,
      margin: 3,
      color: {
        dark: "#000000",
        light: "#FFFFFF",
      },
      errorCorrectionLevel: "M", // Medium error correction for better readability
    });

    // Create canvas to add text information below QR code
    const canvas = document.createElement("canvas");
    const ctx = canvas.getContext("2d")!;

    // Calculate required height based on area count
    const areaCount =
      invitationData.expand?.authorized_area?.length ||
      invitationData.authorized_area.length;
    const maxAreasPerLine = 2;
    const areaLines = Math.ceil(areaCount / maxAreasPerLine);
    const extraHeight = Math.max(0, (areaLines - 1) * 16); // Extra space for multiple area lines

    // Set canvas size (QR code + text area + dynamic height)
    canvas.width = 450;
    canvas.height = 580 + extraHeight; // Extra space for text + dynamic area space

    // Fill white background
    ctx.fillStyle = "#FFFFFF";
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Load and draw QR code
    const img = new Image();
    img.onload = () => {
      // Draw QR code centered
      const qrSize = 380;
      const qrX = (canvas.width - qrSize) / 2;
      ctx.drawImage(img, qrX, 10, qrSize, qrSize);

      // Add text information below QR code
      ctx.fillStyle = "#000000";
      ctx.font = "bold 16px Arial";
      ctx.textAlign = "center";

      let currentY = qrSize + 30;
      const lineHeight = 20;

      // Add invitation details with better formatting
      ctx.fillText(
        `ผู้เยี่ยม: ${invitationData.visitor_name}`,
        canvas.width / 2,
        currentY
      );
      currentY += lineHeight;

      // House information
      const houseName =
        invitationData.expand?.house_id?.address ||
        invitationData.expand?.house_id?.name ||
        (invitationData.house_id === "3r0sy967yth90f6" ? "103/99" : "บ้าน");
      ctx.fillText(`บ้าน: ${houseName}`, canvas.width / 2, currentY);
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
      const startTime = new Date(invitationData.start_time).toLocaleString(
        "th-TH",
        {
          timeZone: "Asia/Bangkok",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }
      );
      const endTime = new Date(invitationData.expire_time).toLocaleString(
        "th-TH",
        {
          timeZone: "Asia/Bangkok",
          year: "numeric",
          month: "2-digit",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
        }
      );

      ctx.font = "13px Arial";
      ctx.fillText(`เริ่ม: ${startTime}`, canvas.width / 2, currentY);
      currentY += lineHeight - 2;
      ctx.fillText(`สิ้นสุด: ${endTime}`, canvas.width / 2, currentY);

      // Convert canvas to blob and download
      canvas.toBlob((blob) => {
        if (blob) {
          const url = URL.createObjectURL(blob);
          const link = document.createElement("a");
          link.href = url;
          link.download = `invitation-qr-${invitationData.visitor_name}-${new Date().toISOString().split("T")[0]}.png`;

          // Trigger download
          document.body.appendChild(link);
          link.click();
          document.body.removeChild(link);

          // Clean up
          URL.revokeObjectURL(url);

          toast.success("ดาวน์โหลด QR Code สำเร็จ", {
            description: `QR Code พร้อมข้อมูลสำหรับ ${invitationData.visitor_name} ถูกดาวน์โหลดแล้ว`,
          });
        }
      }, "image/png");
    };

    img.src = qrDataURL;
  } catch (error) {
    console.error("Error generating QR code:", error);
    toast.error("เกิดข้อผิดพลาดในการสร้าง QR Code", {
      description: "กรุณาลองใหม่อีกครั้ง",
    });
  }
};

function InvitationActionButton({ info }: { info: Cell<InvitationItem, any> }) {
  const { mutateAsync: deleteInvitation } = useDeleteInvitationMutation();
  const { mutateAsync: activateInvitation } = useActivateInvitationMutation();
  const { mutateAsync: deactivateInvitation } =
    useDeactivateInvitationMutation();

  const [MessageDialogState, setMessageDialogState] = useState<{
    title: string;
    description: string;
  }>({
    title: "",
    description: "",
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [showActivateDialog, setShowActivateDialog] = useState(false);
  const [showDeactivateDialog, setShowDeactivateDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // เพิ่ม state สำหรับ edit dialog
  const [showEditDialog, setShowEditDialog] = useState(false);

  const queryClient = useQueryClient();

  const invitationData = info.row.original as InvitationItem;
  const status = getInvitationDisplayStatus(invitationData);

  // แก้ไข handleViewClick เป็น handleDownloadQR
  const handleDownloadQR = async () => {
    try {
      setDropdownOpen(false);

      // Check if required data exists
      if (!invitationData.code) {
        toast.warning("ไม่พบรหัส QR Code สำหรับบัตรเชิญนี้");
        return;
      }

      await generateAndDownloadQR(invitationData);
    } catch (error) {
      console.error("Error downloading QR code:", error);
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลด QR Code");
    }
  };

  const handleEditClick = () => {
    try {
      setDropdownOpen(false);
      setShowEditDialog(true);
    } catch (error) {
      console.error("Error opening edit:", error);
      toast.error("เกิดข้อผิดพลาดในการเปิดหน้าแก้ไข");
    }
  };

  const handleEditDialogClose = () => {
    setShowEditDialog(false);
  };

  const handleEditDialogUpdate = () => {
    setShowEditDialog(false);
    queryClient.invalidateQueries({ queryKey: ["invitationList"] });
    toast.success("อัปเดตบัตรเชิญสำเร็จ");
  };

  const handleDeleteClick = () => {
    try {
      setDropdownOpen(false);
      setShowDeleteDialog(true);
    } catch (error) {
      console.error("Error opening delete dialog:", error);
    }
  };

  const handleActivateClick = () => {
    try {
      setDropdownOpen(false);
      setShowActivateDialog(true);
    } catch (error) {
      console.error("Error opening activate dialog:", error);
    }
  };

  const handleDeactivateClick = () => {
    try {
      setDropdownOpen(false);
      setShowDeactivateDialog(true);
    } catch (error) {
      console.error("Error opening deactivate dialog:", error);
    }
  };

  const handleDelete = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const rowId = info.row.getValue("id");
      console.log("Deleting invitation with ID:", rowId);

      await deleteInvitation(rowId as string);

      toast.success("ลบบัตรเชิญสำเร็จ", {
        description: `ลบบัตรเชิญของ ${invitationData.visitor_name} แล้ว`,
      });

      queryClient.invalidateQueries({ queryKey: ["invitationList"] });

      setMessageDialogState({
        title: "Delete Success",
        description: "Delete Success",
      });
    } catch (error) {
      console.error("Error deleting invitation:", error);
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูล", {
        description: "กรุณาลองใหม่อีกครั้ง",
      });
      setMessageDialogState({
        title: "Delete Failed",
        description: "Failed to delete invitation.",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
      setDropdownOpen(false);
    }
  };

  const handleActivate = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const rowId = info.row.getValue("id");
      console.log("Activating invitation with ID:", rowId);

      await activateInvitation(rowId as string);

      queryClient.invalidateQueries({ queryKey: ["invitationList"] });
    } catch (error) {
      console.error("Error activating invitation:", error);
    } finally {
      setIsLoading(false);
      setShowActivateDialog(false);
      setDropdownOpen(false);
    }
  };

  const handleDeactivate = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const rowId = info.row.getValue("id");
      console.log("Deactivating invitation with ID:", rowId);

      await deactivateInvitation(rowId as string);

      queryClient.invalidateQueries({ queryKey: ["invitationList"] });
    } catch (error) {
      console.error("Error deactivating invitation:", error);
    } finally {
      setIsLoading(false);
      setShowDeactivateDialog(false);
      setDropdownOpen(false);
    }
  };

  const handleDropdownOpenChange = (open: boolean) => {
    if (
      !showDeleteDialog &&
      !showActivateDialog &&
      !showDeactivateDialog &&
      !showEditDialog
    ) {
      setDropdownOpen(open);
    } else if (!open) {
      setDropdownOpen(false);
    }
  };

  const canEdit = true;
  const canDelete = true;
  const canActivate = !invitationData.active;
  const canDeactivate = invitationData.active;
  const hasQRCode = !!invitationData.code; // Check if QR code exists

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            disabled={isLoading}>
            <EllipsisIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[200px]">
          {/* แทนที่ "ดูรายละเอียด" ด้วย "Download QR Code" */}
          {hasQRCode && (
            <DropdownMenuItem
              className="w-[190px] font-anuphan cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                handleDownloadQR();
              }}
              disabled={isLoading}>
              <Download className="w-4 h-4 mr-2" />
              ดาวน์โหลด QR Code
            </DropdownMenuItem>
          )}

          {canEdit && (
            <DropdownMenuItem
              className="w-[190px] font-anuphan cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                handleEditClick();
              }}
              disabled={isLoading}>
              <SquarePen className="w-4 h-4 mr-2" />
              แก้ไข
            </DropdownMenuItem>
          )}

          <DropdownMenuSeparator />

          {canActivate && (
            <DropdownMenuItem
              className="w-[190px] font-anuphan cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                handleActivateClick();
              }}
              disabled={isLoading}>
              <CheckCircle className="w-4 h-4 mr-2" />
              เปิดใช้งาน
            </DropdownMenuItem>
          )}

          {canDeactivate && (
            <DropdownMenuItem
              className="w-[190px] font-anuphan cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                handleDeactivateClick();
              }}
              disabled={isLoading}>
              <XCircle className="w-4 h-4 mr-2" />
              ปิดใช้งาน
            </DropdownMenuItem>
          )}

          {(canActivate || canDeactivate) && canDelete && (
            <DropdownMenuSeparator />
          )}

          {canDelete && (
            <DropdownMenuItem
              className="w-[190px] font-anuphan cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                handleDeleteClick();
              }}
              disabled={isLoading}>
              <LucideTrash className="w-4 h-4 mr-2" />
              {isLoading ? "กำลังลบ..." : "ลบ"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      <MessageDialog Message={MessageDialogState} />

      {/* Edit Dialog */}
      <EditInvitationDialog
        invitationData={invitationData}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onInvitationUpdated={handleEditDialogUpdate}
      />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบบัตรเชิญของ "{invitationData.visitor_name}"?
              การดำเนินการนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowDeleteDialog(false)}
              disabled={isLoading}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isLoading}>
              {isLoading ? "กำลังลบ..." : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Activate Confirmation Dialog */}
      <AlertDialog
        open={showActivateDialog}
        onOpenChange={setShowActivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการเปิดใช้งาน</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการเปิดใช้งานบัตรเชิญของ "{invitationData.visitor_name}"
              หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowActivateDialog(false)}
              disabled={isLoading}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleActivate} disabled={isLoading}>
              {isLoading ? "กำลังเปิดใช้งาน..." : "เปิดใช้งาน"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Deactivate Confirmation Dialog */}
      <AlertDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการปิดใช้งาน</AlertDialogTitle>
            <AlertDialogDescription>
              คุณต้องการปิดใช้งานบัตรเชิญของ "{invitationData.visitor_name}"
              หรือไม่?
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={() => setShowDeactivateDialog(false)}
              disabled={isLoading}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDeactivate} disabled={isLoading}>
              {isLoading ? "กำลังปิดใช้งาน..." : "ปิดใช้งาน"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default InvitationActionButton;
