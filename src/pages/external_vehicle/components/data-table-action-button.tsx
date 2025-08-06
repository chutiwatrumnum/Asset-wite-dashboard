// src/pages/external_vehicle/components/data-table-action-button.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { EllipsisIcon, LucideTrash, SquarePen, UserCheck } from "lucide-react";
import type { Cell } from "@tanstack/react-table";
import type { VisitorItem } from "@/api/external_vehicle/visitor";
import {
  useDeleteVisitorMutation,
  useStampVisitorMutation,
} from "@/react-query/manage/external_vehicle/visitor";
import { MessageDialog } from "@/components/modal";
import { useState } from "react";
import EditVisitorDialog from "./edit-visitor-dialog";
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

function DataTableActionButton({ info }: { info: Cell<VisitorItem, any> }) {
  const { mutateAsync: deleteVisitor } = useDeleteVisitorMutation();
  const { mutateAsync: stampVisitor } = useStampVisitorMutation();
  const [MessageLoginFaild, setMessageLoginFaild] = useState<{
    title: string;
    description: string;
  }>({
    title: "",
    description: "",
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVisitor, setSelectedVisitor] = useState<VisitorItem | null>(
    null
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isStamping, setIsStamping] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleEditClick = () => {
    try {
      setDropdownOpen(false);
      const visitorData = info.row.original as VisitorItem;
      console.log("Opening edit for visitor:", visitorData);
      setSelectedVisitor(visitorData);
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Error opening edit drawer:", error);
      toast.error("เกิดข้อผิดพลาดในการเปิดหน้าแก้ไข");
    }
  };

  const handleVisitorUpdated = () => {
    try {
      console.log("Visitor updated successfully");
      queryClient.invalidateQueries({ queryKey: ["visitorList"] });

      setIsEditDialogOpen(false);
      setSelectedVisitor(null);
      setDropdownOpen(false);

      toast.success("อัปเดตข้อมูลสำเร็จ");
    } catch (error) {
      console.error("Error updating visitor list:", error);
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

  const handleStampClick = async () => {
    if (isStamping) return;

    setIsStamping(true);
    setDropdownOpen(false);

    try {
      const rowId = info.row.getValue("id") as string;
      const visitorData = info.row.original as VisitorItem;

      console.log("Stamping visitor with ID:", rowId);

      await stampVisitor({
        id: rowId,
        stamperId: undefined, // Will use current user
        stampedTime: undefined, // Will use current time
      });

      toast.success("ประทับตราสำเร็จ", {
        description: `ประทับตรา ${visitorData.first_name} ${visitorData.last_name} เรียบร้อยแล้ว`,
      });

      queryClient.invalidateQueries({ queryKey: ["visitorList"] });
    } catch (error) {
      console.error("Error stamping visitor:", error);
      toast.error("เกิดข้อผิดพลาดในการประทับตรา", {
        description: "กรุณาลองใหม่อีกครั้ง",
      });
    } finally {
      setIsStamping(false);
    }
  };

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const rowId = info.row.getValue("id");
      console.log("Deleting visitor with ID:", rowId);

      await deleteVisitor(rowId as string);

      toast.success("ลบข้อมูลสำเร็จ", {
        description: "ข้อมูลผู้เยี่ยมภายนอกถูกลบแล้ว",
      });

      queryClient.invalidateQueries({ queryKey: ["visitorList"] });

      setMessageLoginFaild({
        title: "Delete Success",
        description: "Delete Success",
      });
    } catch (error) {
      console.error("Error deleting visitor:", error);
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูล", {
        description: "กรุณาลองใหม่อีกครั้ง",
      });
      setMessageLoginFaild({
        title: "Delete Failed",
        description: "Failed to delete visitor.",
      });
    } finally {
      setIsDeleting(false);
      setShowDeleteDialog(false);
      setDropdownOpen(false);
    }
  };

  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
    setDropdownOpen(false);
  };

  const handleEditDialogClose = (open: boolean) => {
    setIsEditDialogOpen(open);
    if (!open) {
      setSelectedVisitor(null);
      setDropdownOpen(false);
    }
  };

  const handleDropdownOpenChange = (open: boolean) => {
    if (!isEditDialogOpen && !showDeleteDialog) {
      setDropdownOpen(open);
    } else if (!open) {
      setDropdownOpen(false);
    }
  };

  const hasEditPermission = true;
  const hasDeletePermission = true;
  const hasStampPermission = true;
  const visitorData = info.row.original as VisitorItem;
  const isAlreadyStamped = visitorData.stamper && visitorData.stamped_time;

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            disabled={
              isDeleting || isEditDialogOpen || showDeleteDialog || isStamping
            }>
            <EllipsisIcon className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>

        <DropdownMenuContent align="end" className="w-[160px]">
          {hasEditPermission && (
            <DropdownMenuItem
              className="w-[150px] font-anuphan cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                handleEditClick();
              }}
              disabled={isDeleting || isEditDialogOpen || isStamping}>
              <SquarePen className="w-4 h-4 mr-2" />
              แก้ไข
            </DropdownMenuItem>
          )}

          {hasStampPermission && !isAlreadyStamped && (
            <DropdownMenuItem
              className="w-[150px] font-anuphan cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                handleStampClick();
              }}
              disabled={isDeleting || isStamping || isEditDialogOpen}>
              <UserCheck className="w-4 h-4 mr-2" />
              {isStamping ? "กำลังอนุมัติ..." : "อนุมัติ"}
            </DropdownMenuItem>
          )}

          {(hasEditPermission || hasStampPermission) && hasDeletePermission && (
            <DropdownMenuSeparator />
          )}

          {hasDeletePermission && (
            <DropdownMenuItem
              className="w-[150px] font-anuphan cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                handleDeleteClick();
              }}
              disabled={isDeleting || showDeleteDialog || isStamping}>
              <LucideTrash className="w-4 h-4 mr-2" />
              {isDeleting ? "กำลังลบ..." : "ลบ"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedVisitor && (
        <EditVisitorDialog
          visitorData={selectedVisitor}
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogClose}
          onVisitorUpdated={handleVisitorUpdated}
        />
      )}

      <MessageDialog Message={MessageLoginFaild} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบผู้เยี่ยมภายนอกคนนี้?
              การดำเนินการนี้ไม่สามารถยกเลิกได้
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel
              onClick={handleCancelDelete}
              disabled={isDeleting}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? "กำลังลบ..." : "ลบ"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default DataTableActionButton;
