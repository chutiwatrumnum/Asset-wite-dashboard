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
import type { saffItem } from "@/api/auth/auth";
import { useDeleteSaffMutation } from "@/react-query/manage/auth/auth";
import { MessageDialog } from "@/components/modal";
import { useState } from "react";
import { EditStaffDrawer } from "./edit-staff-drawer";
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

function DataTableActionButton({ info }: { info: Cell<saffItem, any> }) {
  const { mutateAsync } = useDeleteSaffMutation();
  const [MessageLoginFaild, setMessageLoginFaild] = useState<{
    title: string;
    description: string;
  }>({
    title: "",
    description: "",
  });

  const [isEditDrawerOpen, setIsEditDrawerOpen] = useState(false);
  const [selectedStaff, setSelectedStaff] = useState<saffItem | null>(null);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleEditClick = () => {
    try {
      // Close dropdown first
      setDropdownOpen(false);

      // Get the full row data
      const staffData = info.row.original as saffItem;
      setSelectedStaff(staffData);
      setIsEditDrawerOpen(true);
    } catch (error) {
      console.error("Error opening edit drawer:", error);
      toast.error("เกิดข้อผิดพลาดในการเปิดหน้าแก้ไข");
    }
  };

  const handleStaffUpdated = () => {
    try {
      console.log("Staff updated successfully");
      queryClient.invalidateQueries({ queryKey: ["saffList"] });

      // Reset states
      setIsEditDrawerOpen(false);
      setSelectedStaff(null);
      setDropdownOpen(false);

      toast.success("อัปเดตข้อมูลสำเร็จ");
    } catch (error) {
      console.error("Error updating staff list:", error);
    }
  };

  const handleDeleteClick = () => {
    try {
      // Close dropdown first
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
      console.log("Deleting staff with ID:", rowId);

      await mutateAsync(rowId as string);

      // Show success message
      toast.success("ลบข้อมูลสำเร็จ", {
        description: "ข้อมูลพนักงานถูกลบแล้ว",
      });

      // Refresh the data
      queryClient.invalidateQueries({ queryKey: ["saffList"] });

      setMessageLoginFaild({
        title: "Delete Success",
        description: "Delete Success",
      });
    } catch (error) {
      console.error("Error deleting staff:", error);
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูล", {
        description: "กรุณาลองใหม่อีกครั้ง",
      });
      setMessageLoginFaild({
        title: "Delete Failed",
        description: "Failed to delete staff.",
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

  const handleEditDrawerClose = (open: boolean) => {
    setIsEditDrawerOpen(open);
    if (!open) {
      setSelectedStaff(null);
      setDropdownOpen(false);
    }
  };

  // Reset dropdown state when any dialog opens
  const handleDropdownOpenChange = (open: boolean) => {
    if (!isEditDrawerOpen && !showDeleteDialog) {
      setDropdownOpen(open);
    } else if (!open) {
      setDropdownOpen(false);
    }
  };

  // Placeholder for permission check
  const hasEditPermission = true;
  const hasDeletePermission = true;

  return (
    <>
      <DropdownMenu open={dropdownOpen} onOpenChange={handleDropdownOpenChange}>
        <DropdownMenuTrigger asChild>
          <Button
            variant="ghost"
            className="flex h-8 w-8 p-0 data-[state=open]:bg-muted"
            disabled={isDeleting || isEditDrawerOpen || showDeleteDialog}>
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
              disabled={isDeleting || isEditDrawerOpen}>
              <SquarePen className="w-4 h-4 mr-2" />
              Edit
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
              {isDeleting ? "กำลังลบ..." : "Delete"}
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {selectedStaff && (
        <EditStaffDrawer
          staffData={selectedStaff}
          open={isEditDrawerOpen}
          onOpenChange={handleEditDrawerClose}
          onStaffUpdated={handleStaffUpdated}
        />
      )}

      <MessageDialog Message={MessageLoginFaild} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบพนักงานคนนี้?
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