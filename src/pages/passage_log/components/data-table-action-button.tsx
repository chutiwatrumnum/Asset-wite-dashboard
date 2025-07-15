// src/pages/passage-log/components/data-table-action-button.tsx
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
  Eye,
  LogOut,
  LogIn,
} from "lucide-react";
import type { Cell } from "@tanstack/react-table";
import type { PassageLogItem } from "@/api/passage_log/passage_log";
import { useDeletePassageLogMutation } from "@/react-query/manage/passage_log";
import { MessageDialog } from "@/components/modal";
import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import {
  getPassageDisplayStatus,
  isStillInside,
} from "@/utils/passageLogUtils";
import { EditPassageLogDialog } from "./edit-passage-log-dialog";
import { ViewPassageLogDialog } from "./view-passage-log-dialog";

// ใช้ ConfirmationDialog component
import { ConfirmationDialog } from "@/components/ui/confirmation-dialog";

function PassageLogActionButton({ info }: { info: Cell<PassageLogItem, any> }) {
  const { mutateAsync: deletePassageLog } = useDeletePassageLogMutation();

  const [MessageDialogState, setMessageDialogState] = useState<{
    title: string;
    description: string;
  }>({
    title: "",
    description: "",
  });

  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // State สำหรับ dialogs
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);

  const queryClient = useQueryClient();

  const passageLogData = info.row.original as PassageLogItem;
  const status = getPassageDisplayStatus(passageLogData);
  const stillInside = isStillInside(passageLogData);

  const handleViewClick = () => {
    try {
      setDropdownOpen(false);
      setShowViewDialog(true);
    } catch (error) {
      console.error("Error opening view:", error);
      toast.error("เกิดข้อผิดพลาดในการเปิดหน้าดูรายละเอียด");
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

  const handleDeleteClick = () => {
    try {
      setDropdownOpen(false);
      setShowDeleteDialog(true);
    } catch (error) {
      console.error("Error opening delete dialog:", error);
    }
  };

  const handleEditDialogClose = () => {
    setShowEditDialog(false);
  };

  const handleEditDialogUpdate = () => {
    setShowEditDialog(false);
    queryClient.invalidateQueries({ queryKey: ["passageLogList"] });
    toast.success("อัปเดตประวัติการเข้าออกสำเร็จ");
  };

  const handleDelete = async () => {
    if (isLoading) return;

    setIsLoading(true);
    try {
      const rowId = info.row.getValue("id");
      console.log("Deleting passage log with ID:", rowId);

      await deletePassageLog(rowId as string);

      toast.success("ลบประวัติการเข้าออกสำเร็จ", {
        description: `ลบประวัติการ${passageLogData.passage_type === "entry" ? "เข้า" : "ออก"}ของ ${passageLogData.visitor_name} แล้ว`,
      });

      queryClient.invalidateQueries({ queryKey: ["passageLogList"] });

      setMessageDialogState({
        title: "Delete Success",
        description: "Delete Success",
      });
    } catch (error) {
      console.error("Error deleting passage log:", error);
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูล", {
        description: "กรุณาลองใหม่อีกครั้ง",
      });
      setMessageDialogState({
        title: "Delete Failed",
        description: "Failed to delete passage log.",
      });
    } finally {
      setIsLoading(false);
      setShowDeleteDialog(false);
      setDropdownOpen(false);
    }
  };

  const handleDropdownOpenChange = (open: boolean) => {
    if (!showDeleteDialog && !showEditDialog && !showViewDialog) {
      setDropdownOpen(open);
    } else if (!open) {
      setDropdownOpen(false);
    }
  };

  const canView = true;
  const canEdit = true; // อาจจะต้องเช็คสิทธิ์เพิ่มเติม
  const canDelete = true; // อาจจะต้องเช็คสิทธิ์เพิ่มเติม

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
          {/* View Details */}
          {canView && (
            <DropdownMenuItem
              className="w-[190px] font-anuphan cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                handleViewClick();
              }}
              disabled={isLoading}>
              <Eye className="w-4 h-4 mr-2" />
              ดูรายละเอียด
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

          {/* Quick Actions based on current state */}
          {stillInside && (
            <DropdownMenuItem
              className="w-[190px] font-anuphan cursor-pointer text-orange-600"
              onSelect={(event) => {
                event.preventDefault();
                // TODO: Implement quick exit functionality
                toast.info("ฟังก์ชันออกด่วนจะเปิดให้ใช้งานในเร็วๆ นี้");
              }}
              disabled={isLoading}>
              <LogOut className="w-4 h-4 mr-2" />
              บันทึกออกด่วน
            </DropdownMenuItem>
          )}

          {passageLogData.passage_type === "exit" && (
            <DropdownMenuItem
              className="w-[190px] font-anuphan cursor-pointer text-green-600"
              onSelect={(event) => {
                event.preventDefault();
                // TODO: Implement re-entry functionality
                toast.info("ฟังก์ชันเข้าใหม่จะเปิดให้ใช้งานในเร็วๆ นี้");
              }}
              disabled={isLoading}>
              <LogIn className="w-4 h-4 mr-2" />
              บันทึกเข้าใหม่
            </DropdownMenuItem>
          )}

          {(canEdit || canView) && canDelete && <DropdownMenuSeparator />}

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

      {/* View Dialog */}
      <ViewPassageLogDialog
        passageLogData={passageLogData}
        open={showViewDialog}
        onOpenChange={setShowViewDialog}
      />

      {/* Edit Dialog */}
      <EditPassageLogDialog
        passageLogData={passageLogData}
        open={showEditDialog}
        onOpenChange={setShowEditDialog}
        onPassageLogUpdated={handleEditDialogUpdate}
      />

      {/* Delete Confirmation Dialog */}
      <ConfirmationDialog
        open={showDeleteDialog}
        onOpenChange={setShowDeleteDialog}
        title="ยืนยันการลบ"
        description={`คุณแน่ใจหรือไม่ที่จะลบประวัติการ${passageLogData.passage_type === "entry" ? "เข้า" : "ออก"}ของ "${passageLogData.visitor_name}"? การดำเนินการนี้ไม่สามารถยกเลิกได้`}
        confirmLabel={isLoading ? "กำลังลบ..." : "ลบ"}
        cancelLabel="ยกเลิก"
        onConfirm={handleDelete}
        onCancel={() => setShowDeleteDialog(false)}
        isLoading={isLoading}
        variant="destructive"
        showIcon={true}
        disabled={isLoading}
      />
    </>
  );
}

export default PassageLogActionButton;
