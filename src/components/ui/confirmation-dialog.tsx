// src/components/ui/confirmation-dialog.tsx - แก้ไข import
import { useState } from "react"; // เพิ่มบรรทัดนี้
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
import {
  Loader2,
  AlertTriangle,
  Trash2,
  CheckCircle,
} from "lucide-react";
import { cn } from "@/lib/utils";

interface ConfirmationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title: string;
  description?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel?: () => void;
  isLoading?: boolean;
  variant?: "default" | "destructive" | "warning" | "success";
  showIcon?: boolean;
  disabled?: boolean;
}

const variantConfig = {
  default: {
    icon: CheckCircle,
    iconColor: "text-blue-600",
    confirmClass: "bg-primary text-primary-foreground hover:bg-primary/90",
  },
  destructive: {
    icon: Trash2,
    iconColor: "text-red-600",
    confirmClass: "bg-destructive text-white hover:bg-destructive/90",
  },
  warning: {
    icon: AlertTriangle,
    iconColor: "text-orange-600",
    confirmClass: "bg-orange-600 text-white hover:bg-orange-700",
  },
  success: {
    icon: CheckCircle,
    iconColor: "text-green-600",
    confirmClass: "bg-green-600 text-white hover:bg-green-700",
  },
};

export function ConfirmationDialog({
  open,
  onOpenChange,
  title,
  description,
  confirmLabel = "ยืนยัน",
  cancelLabel = "ยกเลิก",
  onConfirm,
  onCancel,
  isLoading = false,
  variant = "default",
  showIcon = true,
  disabled = false,
}: ConfirmationDialogProps) {
  const config = variantConfig[variant];
  const IconComponent = config.icon;

  const handleConfirm = () => {
    if (isLoading || disabled) return;
    onConfirm();
  };

  const handleCancel = () => {
    if (isLoading) return;
    onOpenChange(false);
    onCancel?.();
  };

  return (
    <AlertDialog open={open} onOpenChange={onOpenChange}>
      <AlertDialogContent>
        <AlertDialogHeader>
          <div className="flex items-center gap-3">
            {showIcon && (
              <div className="flex-shrink-0">
                <IconComponent className={cn("h-6 w-6", config.iconColor)} />
              </div>
            )}
            <div className="flex-1">
              <AlertDialogTitle className="text-left">{title}</AlertDialogTitle>
            </div>
          </div>
          {description && (
            <AlertDialogDescription className="text-left">
              {description}
            </AlertDialogDescription>
          )}
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel onClick={handleCancel} disabled={isLoading}>
            {cancelLabel}
          </AlertDialogCancel>
          <AlertDialogAction
            onClick={handleConfirm}
            disabled={isLoading || disabled}
            className={config.confirmClass}>
            {isLoading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
            {isLoading ? "กำลังดำเนินการ..." : confirmLabel}
          </AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  );
}

// Hook for easier usage
export function useConfirmationDialog() {
  const [open, setOpen] = useState(false);
  const [config, setConfig] = useState<Partial<ConfirmationDialogProps>>({});

  const showConfirmation = (
    props: Omit<ConfirmationDialogProps, "open" | "onOpenChange">
  ) => {
    setConfig(props);
    setOpen(true);
  };

  const confirmationDialog = (
    <ConfirmationDialog
      open={open}
      onOpenChange={setOpen}
      {...(config as ConfirmationDialogProps)}
    />
  );

  return {
    showConfirmation,
    confirmationDialog,
    closeConfirmation: () => setOpen(false),
  };
}

export default ConfirmationDialog;
