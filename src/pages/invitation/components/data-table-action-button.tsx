// src/pages/invitation/components/data-table-action-button.tsx - ใช้ ConfirmationDialog component
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
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { getInvitationDisplayStatus } from "@/utils/invitationUtils";
import { EditInvitationDialog } from "./edit-invitation-dialog";
import {
  generateAndDownloadQRCode,
  hasValidQRCode,
} from "@/components/ui/qr-code-generator";

// ใช้ ConfirmationDialog component แทน AlertDialog
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

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

  // Handle QR Code download using the new component
  const handleDownloadQR = async () => {
    try {
      setDropdownOpen(false);
      await generateAndDownloadQRCode(invitationData);
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
      toast.success("เปิดใช้งานบัตรเชิญสำเร็จ");
    } catch (error) {
      console.error("Error activating invitation:", error);
      toast.error("เกิดข้อผิดพลาดในการเปิดใช้งาน");
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
      toast.success("ปิดใช้งานบัตรเชิญสำเร็จ");
    } catch (error) {
      console.error("Error deactivating invitation:", error);
      toast.error("เกิดข้อผิดพลาดในการปิดใช้งาน");
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
  const hasQRCode = hasValidQRCode(invitationData);

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
          {/* Download QR Code - now using the new component */}
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

      {/* Delete Confirmation Dialog - ใช้ ConfirmationDialog component */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="ยืนยันการลบ"
        description={`คุณแน่ใจหรือไม่ที่จะลบบัตรเชิญของ "${invitationData.visitor_name}"? การดำเนินการนี้ไม่สามารถยกเลิกได้`}
        confirmLabel={isLoading ? "กำลังลบ..." : "ลบ"}
        cancelLabel="ยกเลิก"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={isLoading}
        variant="destructive"
        showIcon={true}
        disabled={isLoading}
      />

      {/* Activate Confirmation Dialog - ใช้ ConfirmationDialog component */}
      <ConfirmationDialog
        open={showActivateDialog}
        onOpenChange={setShowActivateDialog}
        title="ยืนยันการเปิดใช้งาน"
        description={`คุณต้องการเปิดใช้งานบัตรเชิญของ "${invitationData.visitor_name}" หรือไม่?`}
        confirmLabel={isLoading ? "กำลังเปิดใช้งาน..." : "เปิดใช้งาน"}
        cancelLabel="ยกเลิก"
        onConfirm={handleActivate}
        onCancel={() => setShowActivateDialog(false)}
        isLoading={isLoading}
        variant="success"
        showIcon={true}
        disabled={isLoading}
      />

      {/* Deactivate Confirmation Dialog - ใช้ ConfirmationDialog component */}
      <ConfirmationDialog
        open={showDeactivateDialog}
        onOpenChange={setShowDeactivateDialog}
        title="ยืนยันการปิดใช้งาน"
        description={`คุณต้องการปิดใช้งานบัตรเชิญของ "${invitationData.visitor_name}" หรือไม่?`}
        confirmLabel={isLoading ? "กำลังปิดใช้งาน..." : "ปิดใช้งาน"}
        cancelLabel="ยกเลิก"
        onConfirm={handleDeactivate}
        onCancel={() => setShowDeactivateDialog(false)}
        isLoading={isLoading}
        variant="warning"
        showIcon={true}
        disabled={isLoading}
      />
    </>
  );
}

export default InvitationActionButton;