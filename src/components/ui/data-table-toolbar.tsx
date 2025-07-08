
// src/components/ui/data-table-toolbar.tsx
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuTrigger,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
} from "@/components/ui/dropdown-menu";
import { 
  LucideSettings2, 
  Download, 
  FileSpreadsheet, 
  RefreshCw,
  Plus,
  Filter
} from "lucide-react";
import { Table } from "@tanstack/react-table";
import { cn } from "@/lib/utils";

interface DataTableToolbarProps<T> {
  table: Table<T>;
  totalRows: number;
  selectedCount: number;
  isLoading?: boolean;
  showColumnToggle?: boolean;
  showExport?: boolean;
  showRefresh?: boolean;
  showCreate?: boolean;
  onRefresh?: () => void;
  onExportAll?: () => void;
  onExportSelected?: () => void;
  onCreate?: () => void;
  customActions?: Array<{
    key: string;
    label: string;
    icon?: React.ComponentType<{ className?: string }>;
    onClick: () => void;
    disabled?: boolean;
    variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  }>;
  searchComponent?: React.ReactNode;
  filterComponent?: React.ReactNode;
  className?: string;
}

export function DataTableToolbar<T>({
  table,
  totalRows,
  selectedCount,
  isLoading = false,
  showColumnToggle = true,
  showExport = true,
  showRefresh = true,
  showCreate = false,
  onRefresh,
  onExportAll,
  onExportSelected,
  onCreate,
  customActions = [],
  searchComponent,
  filterComponent,
  className,
}: DataTableToolbarProps<T>) {
  return (
    <div className={cn("space-y-4", className)}>
      {/* Search and Filter Row */}
      {(searchComponent || filterComponent) && (
        <div className="flex gap-2 items-center">
          {searchComponent}
          {filterComponent}
        </div>
      )}

      {/* Main Toolbar */}
      <div className="flex items-center justify-between py-4 mb-2">
        {/* Left Side - Info */}
        <div className="flex items-center gap-4">
          <div className="text-sm text-muted-foreground">
            แสดง {totalRows.toLocaleString()} รายการ
            {selectedCount > 0 && (
              <span className="ml-2 text-blue-600">
                (เลือก {selectedCount.toLocaleString()} รายการ)
              </span>
            )}
          </div>
        </div>

        {/* Right Side - Actions */}
        <div className="flex items-center gap-2">
          {/* Custom Actions */}
          {customActions.map((action) => {
            const IconComponent = action.icon;
            return (
              <Button
                key={action.key}
                variant={action.variant || "outline"}
                size="sm"
                onClick={action.onClick}
                disabled={action.disabled || isLoading}
                className="gap-2">
                {IconComponent && <IconComponent className="h-4 w-4" />}
                {action.label}
              </Button>
            );
          })}

          {/* Refresh Button */}
          {showRefresh && onRefresh && (
            <Button
              variant="outline"
              size="sm"
              onClick={onRefresh}
              disabled={isLoading}
              className="gap-2">
              <RefreshCw className={cn("h-4 w-4", isLoading && "animate-spin")} />
              รีเฟรช
            </Button>
          )}

          {/* Create Button */}
          {showCreate && onCreate && (
            <Button
              variant="default"
              size="sm"
              onClick={onCreate}
              disabled={isLoading}
              className="gap-2">
              <Plus className="h-4 w-4" />
              สร้างใหม่
            </Button>
          )}

          {/* Export Dropdown */}
          {showExport && (onExportAll || onExportSelected) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={totalRows === 0 || isLoading}
                  className="gap-2">
                  <FileSpreadsheet className="h-4 w-4" />
                  ส่งออกข้อมูล
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>ส่งออกข้อมูล</DropdownMenuLabel>
                <DropdownMenuSeparator />
                
                {onExportAll && (
                  <DropdownMenuItem
                    onClick={onExportAll}
                    disabled={isLoading || totalRows === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    ส่งออกทั้งหมด ({totalRows.toLocaleString()} รายการ)
                  </DropdownMenuItem>
                )}
                
                {onExportSelected && (
                  <DropdownMenuItem
                    onClick={onExportSelected}
                    disabled={isLoading || selectedCount === 0}>
                    <Download className="h-4 w-4 mr-2" />
                    ส่งออกที่เลือก ({selectedCount.toLocaleString()} รายการ)
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}

          {/* Column Toggle */}
          {showColumnToggle && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="gap-2">
                  <LucideSettings2 className="h-4 w-4" />
                  จัดการคอลัมน์
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>แสดง/ซ่อนคอลัมน์</DropdownMenuLabel>
                <DropdownMenuSeparator />
                {table
                  .getAllColumns()
                  .filter((column) => column.getCanHide())
                  .map((column) => {
                    return (
                      <DropdownMenuCheckboxItem
                        key={column.id}
                        className="capitalize"
                        checked={column.getIsVisible()}
                        onCheckedChange={(value) => column.toggleVisibility(value)}>
                        {/* Convert column id to readable Thai text */}
                        {getColumnDisplayName(column.id)}
                      </DropdownMenuCheckboxItem>
                    );
                  })}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </div>
  );
}

// Helper function to convert column IDs to Thai display names
function getColumnDisplayName(columnId: string): string {
  const columnNames: Record<string, string> = {
    // Common columns
    id: "รหัส",
    created: "วันที่สร้าง",
    updated: "อัปเดตล่าสุด",
    
    // Invitation columns
    visitor_name: "ชื่อผู้เยี่ยม",
    house_id: "บ้าน",
    authorized_area: "พื้นที่อนุญาต",
    start_time: "เวลาเริ่มต้น",
    expire_time: "เวลาสิ้นสุด",
    duration: "ระยะเวลา",
    combined_status: "สถานะการใช้งาน",
    issuer: "ผู้สร้าง",
    note: "หมายเหตุ",
    
    // Vehicle columns
    license_plate: "ป้ายทะเบียน",
    tier: "ระดับ",
    area_code: "จังหวัด",
    status: "สถานะ",
    
    // User columns  
    first_name: "ชื่อ",
    last_name: "นามสกุล",
    email: "อีเมล",
    role: "บทบาท",
    
    // Actions
    action: "การดำเนินการ",
    select: "เลือก",
  };

  return columnNames[columnId] || columnId.replace(/_/g, " ");
}

export default DataTableToolbar;