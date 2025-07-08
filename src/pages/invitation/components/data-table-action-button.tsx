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
  Eye,
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
  const queryClient = useQueryClient();

  const invitationData = info.row.original as InvitationItem;
  const status = getInvitationDisplayStatus(invitationData);

  const handleViewClick = () => {
    try {
      setDropdownOpen(false);
      // TODO: Implement view invitation detail
      toast.info("ฟีเจอร์ดูรายละเอียดจะพัฒนาต่อไป");
    } catch (error) {
      console.error("Error opening view:", error);
      toast.error("เกิดข้อผิดพลาดในการเปิดหน้าดูรายละเอียด");
    }
  };

  const handleEditClick = () => {
    try {
      setDropdownOpen(false);
      // TODO: Implement edit invitation
      toast.info("ฟีเจอร์แก้ไขจะพัฒนาต่อไป");
    } catch (error) {
      console.error("Error opening edit:", error);
      toast.error("เกิดข้อผิดพลาดในการเปิดหน้าแก้ไข");
    }
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
    if (!showDeleteDialog && !showActivateDialog && !showDeactivateDialog) {
      setDropdownOpen(open);
    } else if (!open) {
      setDropdownOpen(false);
    }
  };

  const canEdit = true; // TODO: Implement permission check
  const canDelete = true; // TODO: Implement permission check
  const canActivate = !invitationData.active;
  const canDeactivate = invitationData.active;

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

        <DropdownMenuContent align="end" className="w-[180px]">
          <DropdownMenuItem
            className="w-[170px] font-anuphan cursor-pointer"
            onSelect={(event) => {
              event.preventDefault();
              handleViewClick();
            }}
            disabled={isLoading}>
            <Eye className="w-4 h-4 mr-2" />
            ดูรายละเอียด
          </DropdownMenuItem>

          {canEdit && (
            <DropdownMenuItem
              className="w-[170px] font-anuphan cursor-pointer"
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
              className="w-[170px] font-anuphan cursor-pointer"
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
              className="w-[170px] font-anuphan cursor-pointer"
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
              className="w-[170px] font-anuphan cursor-pointer"
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
