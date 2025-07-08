// src/components/ui/form-dialog.tsx
import { useState, useEffect } from "react";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetFooter,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
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
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Loader2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface FormDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  isLoading?: boolean;
  isDirty?: boolean;
  showConfirmClose?: boolean;
  children: React.ReactNode;
  onSubmit?: () => void;
  onCancel?: () => void;
  submitLabel?: string;
  cancelLabel?: string;
  submitDisabled?: boolean;
  size?: "sm" | "md" | "lg";
  className?: string;
  footerActions?: React.ReactNode;
}

export function FormDialog({
  open,
  onOpenChange,
  title,
  description,
  isLoading = false,
  isDirty = false,
  showConfirmClose = true,
  children,
  onSubmit,
  onCancel,
  submitLabel = "บันทึก",
  cancelLabel = "ยกเลิก",
  submitDisabled = false,
  size = "md",
  className,
  footerActions,
}: FormDialogProps) {
  const [confirmOpen, setConfirmOpen] = useState(false);

  // Reset confirmation dialog when main dialog closes
  useEffect(() => {
    if (!open) {
      setConfirmOpen(false);
    }
  }, [open]);

  const handleClose = () => {
    if (isDirty && !isLoading && showConfirmClose) {
      setConfirmOpen(true);
    } else {
      onOpenChange(false);
      onCancel?.();
    }
  };

  const handleConfirmClose = () => {
    setConfirmOpen(false);
    onOpenChange(false);
    onCancel?.();
  };

  const handleCancelClose = () => {
    setConfirmOpen(false);
  };

  const handleSheetOpenChange = (open: boolean) => {
    if (!open) {
      handleClose();
    } else {
      onOpenChange(open);
    }
  };

  const sizeClasses = {
    sm: "sm:max-w-[400px]",
    md: "sm:max-w-[500px]",
    lg: "sm:max-w-[700px]",
  };

  return (
    <>
      <Sheet open={open} onOpenChange={handleSheetOpenChange}>
        <SheetContent
          className={cn(sizeClasses[size], "overflow-y-auto", className)}>
          <SheetHeader>
            <SheetTitle>{title}</SheetTitle>
            {description && <SheetDescription>{description}</SheetDescription>}
          </SheetHeader>

          <Card className="mt-6">
            <CardContent className="pt-6">{children}</CardContent>
          </Card>

          <SheetFooter className="pt-4">
            {footerActions || (
              <>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleClose}
                  disabled={isLoading}>
                  {cancelLabel}
                </Button>
                {onSubmit && (
                  <Button
                    type="button"
                    onClick={onSubmit}
                    disabled={isLoading || submitDisabled}>
                    {isLoading && (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    )}
                    {isLoading ? "กำลังบันทึก..." : submitLabel}
                  </Button>
                )}
              </>
            )}
          </SheetFooter>
        </SheetContent>
      </Sheet>

      {/* Confirmation Dialog */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>คุณแน่ใจหรือไม่?</AlertDialogTitle>
            <AlertDialogDescription>
              คุณกำลังจะปิดแบบฟอร์มนี้ ข้อมูลที่คุณกรอกอาจไม่ถูกบันทึก
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={handleCancelClose}>
              ยกเลิก
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleConfirmClose}>
              ยืนยัน
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

export default FormDialog;
