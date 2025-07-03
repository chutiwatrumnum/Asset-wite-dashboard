// src/pages/residents/components/data-table-action-button.tsx
"use client";

import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuItem,
} from "@/components/ui/dropdown-menu";
import { EllipsisIcon, LucideTrash, SquarePen } from "lucide-react";
import type { Cell } from "@tanstack/react-table";
import type { residentItem } from "@/api/resident/resident";
import { useDeleteResidentMutation } from "@/react-query/manage/resident";
import { MessageDialog } from "@/components/modal";
import { useState } from "react";
import EditResidentDialog from "./edit-vehicle-dialog";
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

function DataTableActionButton({ info }: { info: Cell<residentItem, any> }) {
  const { mutateAsync } = useDeleteResidentMutation();
  const [MessageLoginFaild, setMessageLoginFaild] = useState<{
    title: string;
    description: string;
  }>({
    title: "",
    description: "",
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedResident, setSelectedResident] = useState<residentItem | null>(
    null
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleEditClick = () => {
    try {
      setDropdownOpen(false);
      const residentData = info.row.original as residentItem;
      console.log("Opening edit for resident:", residentData);
      setSelectedResident(residentData);
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Error opening edit drawer:", error);
      toast.error("เกิดข้อผิดพลาดในการเปิดหน้าแก้ไข");
    }
  };

  const handleResidentUpdated = () => {
    try {
      console.log("Resident updated successfully");
      queryClient.invalidateQueries({ queryKey: ["residentList"] });

      setIsEditDialogOpen(false);
      setSelectedResident(null);
      setDropdownOpen(false);

      toast.success("อัปเดตข้อมูลสำเร็จ");
    } catch (error) {
      console.error("Error updating resident list:", error);
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

  const handleDelete = async () => {
    if (isDeleting) return;

    setIsDeleting(true);
    try {
      const rowId = info.row.getValue("id");
      console.log("Deleting resident with ID:", rowId);

      await mutateAsync(rowId as string);

      toast.success("ลบข้อมูลสำเร็จ", {
        description: "ข้อมูลลูกบ้านถูกลบแล้ว",
      });

      queryClient.invalidateQueries({ queryKey: ["residentList"] });

      setMessageLoginFaild({
        title: "Delete Success",
        description: "Delete Success",
      });
    } catch (error) {
      console.error("Error deleting resident:", error);
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูล", {
        description: "กรุณาลองใหม่อีกครั้ง",
      });
      setMessageLoginFaild({
        title: "Delete Failed",
        description: "Failed to delete resident.",
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
      setSelectedResident(null);
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

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            disabled={isDeleting || isEditDialogOpen || showDeleteDialog}>
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
              disabled={isDeleting || isEditDialogOpen}>
              <SquarePen className="w-4 h-4 mr-2" />
              แก้ไข
            </DropdownMenuItem>
          )}

          {hasEditPermission && hasDeletePermission && (
            <DropdownMenuSeparator />
          )}

          {hasDeletePermission && (
            <DropdownMenuItem
              className="w-[150px] font-anuphan cursor-pointer"
              onSelect={(event) => {
                event.preventDefault();
                handleDeleteClick();
              }}
              disabled={isDeleting || showDeleteDialog}>
              <LucideTrash className="w-4 h-4 mr-2" />
              {isDeleting ? "กำลังลบ..." : "ลบ"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedResident && (
        <EditResidentDialog
          residentData={selectedResident}
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogClose}
          onResidentUpdated={handleResidentUpdated}
        />
      )}

      <MessageDialog Message={MessageLoginFaild} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบลูกบ้านคนนี้?
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
