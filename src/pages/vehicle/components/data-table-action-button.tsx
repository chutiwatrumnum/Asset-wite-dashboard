// src/pages/vehicle/components/data-table-action-button.tsx
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
import type { vehicleItem } from "@/api/vehicle/vehicle";
import { useDeleteVehicleMutation } from "@/react-query/manage/vehicle";
import { MessageDialog } from "@/components/modal";
import { useState } from "react";
import EditVehicleDialog from "./edit-vehicle-dialog";
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

function DataTableActionButton({ info }: { info: Cell<vehicleItem, any> }) {
  const { mutateAsync } = useDeleteVehicleMutation();
  const [MessageLoginFaild, setMessageLoginFaild] = useState<{
    title: string;
    description: string;
  }>({
    title: "",
    description: "",
  });

  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedVehicle, setSelectedVehicle] = useState<vehicleItem | null>(
    null
  );
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const queryClient = useQueryClient();

  const handleEditClick = () => {
    try {
      setDropdownOpen(false);
      const vehicleData = info.row.original as vehicleItem;
      console.log("Opening edit for vehicle:", vehicleData);
      setSelectedVehicle(vehicleData);
      setIsEditDialogOpen(true);
    } catch (error) {
      console.error("Error opening edit drawer:", error);
      toast.error("เกิดข้อผิดพลาดในการเปิดหน้าแก้ไข");
    }
  };

  const handleVehicleUpdated = () => {
    try {
      console.log("Vehicle updated successfully");
      queryClient.invalidateQueries({ queryKey: ["vehicleList"] });

      setIsEditDialogOpen(false);
      setSelectedVehicle(null);
      setDropdownOpen(false);

      toast.success("อัปเดตข้อมูลสำเร็จ");
    } catch (error) {
      console.error("Error updating vehicle list:", error);
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
      console.log("Deleting vehicle with ID:", rowId);

      await mutateAsync(rowId as string);

      toast.success("ลบข้อมูลสำเร็จ", {
        description: "ข้อมูลยานพาหนะถูกลบแล้ว",
      });

      queryClient.invalidateQueries({ queryKey: ["vehicleList"] });

      setMessageLoginFaild({
        title: "Delete Success",
        description: "Delete Success",
      });
    } catch (error) {
      console.error("Error deleting vehicle:", error);
      toast.error("เกิดข้อผิดพลาดในการลบข้อมูล", {
        description: "กรุณาลองใหม่อีกครั้ง",
      });
      setMessageLoginFaild({
        title: "Delete Failed",
        description: "Failed to delete vehicle.",
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
      setSelectedVehicle(null);
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

      {selectedVehicle && (
        <EditVehicleDialog
          vehicleData={selectedVehicle}
          open={isEditDialogOpen}
          onOpenChange={handleEditDialogClose}
          onVehicleUpdated={handleVehicleUpdated}
        />
      )}

      <MessageDialog Message={MessageLoginFaild} />

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={showDeleteDialog} onOpenChange={setShowDeleteDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>ยืนยันการลบ</AlertDialogTitle>
            <AlertDialogDescription>
              คุณแน่ใจหรือไม่ที่จะลบยานพาหนะคันนี้?
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
