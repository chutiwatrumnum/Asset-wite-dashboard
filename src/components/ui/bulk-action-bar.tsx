// src/components/ui/bulk-action-bar.tsx
import { Button } from "@/components/ui/button";
import { Download, Trash2, X } from "lucide-react";
import { cn } from "@/lib/utils";

interface BulkActionBarProps {
  selectedCount: number;
  isVisible: boolean;
  isLoading?: boolean;
  onReset: () => void;
  onExport?: () => void;
  onDelete?: () => void;
  onCustomAction?: (action: string) => void;
  customActions?: Array<{
    key: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    variant?:
      | "default"
      | "destructive"
      | "outline"
      | "secondary"
      | "ghost"
      | "link";
    disabled?: boolean;
  }>;
  className?: string;
  position?: "fixed" | "relative";
}

export function BulkActionBar({
  selectedCount,
  isVisible,
  isLoading = false,
  onReset,
  onExport,
  onDelete,
  onCustomAction,
  customActions = [],
  className,
  position = "fixed",
}: BulkActionBarProps) {
  if (!isVisible || selectedCount === 0) {
    return null;
  }

  const containerClasses = cn(
    "bg-card border border-border rounded-lg shadow-lg px-4 py-3 flex items-center gap-4 z-50",
    position === "fixed" &&
      "fixed bottom-6 left-1/2 transform -translate-x-1/2",
    position === "relative" && "relative",
    className
  );

  return (
    <div className={containerClasses}>
      <span className="text-sm font-medium">
        เลือกแล้ว {selectedCount.toLocaleString()} รายการ
      </span>

      {/* Reset Button */}
      <Button
        variant="outline"
        size="sm"
        onClick={onReset}
        disabled={isLoading}
        className="h-8">
        <X className="h-3 w-3 mr-1" />
        รีเซ็ต
      </Button>

      {/* Export Button */}
      {onExport && (
        <Button
          variant="outline"
          size="sm"
          onClick={onExport}
          disabled={isLoading}
          className="h-8">
          <Download className="h-3 w-3 mr-1" />
          ส่งออก
        </Button>
      )}

      {/* Custom Actions */}
      {customActions.map((action) => {
        const IconComponent = action.icon;
        return (
          <Button
            key={action.key}
            variant={action.variant || "outline"}
            size="sm"
            onClick={() => onCustomAction?.(action.key)}
            disabled={isLoading || action.disabled}
            className="h-8">
            {IconComponent && <IconComponent className="h-3 w-3 mr-1" />}
            {action.label}
          </Button>
        );
      })}

      {/* Delete Button */}
      {onDelete && (
        <Button
          variant="destructive"
          size="sm"
          onClick={onDelete}
          disabled={isLoading}
          className="h-8">
          <Trash2 className="h-3 w-3 mr-1" />
          {isLoading ? "กำลังลบ..." : `ลบที่เลือก`}
        </Button>
      )}
    </div>
  );
}

export default BulkActionBar;