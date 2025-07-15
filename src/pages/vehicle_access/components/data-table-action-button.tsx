// src/pages/vehicle_access/components/data-table-action-button.tsx
import { useState } from "react";
import { Eye, Download, Trash2, MoreHorizontal } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  getTierInfo,
  getGateStateInfo,
  getRegionName,
  parseSnapshotInfo,
  formatThaiDateTime,
} from "@/utils/vehicleAccessUtils";
import { VehicleAccessItem } from "@/api/vehicle_access/vehicle_access";
import { useDeleteVehicleAccessMutation } from "@/react-query/manage/vehicle_access/vehicle_access";
import { useConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Car,
  MapPin,
  Camera,
  Shield,
  Home,
  Calendar,
  FileText,
} from "lucide-react";

interface VehicleAccessActionButtonProps {
  info: {
    original: VehicleAccessItem;
  };
}

export default function VehicleAccessActionButton({
  info,
}: VehicleAccessActionButtonProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const vehicleAccess = info.original;
  const { showConfirmation, confirmationDialog } = useConfirmationDialog();
  const deleteVehicleAccessMutation = useDeleteVehicleAccessMutation();

  const tierInfo = getTierInfo(vehicleAccess.tier);
  const gateStateInfo = getGateStateInfo(vehicleAccess.gate_state);
  const regionName = getRegionName(vehicleAccess.area_code);
  const snapshotInfo = parseSnapshotInfo(vehicleAccess.snapshot_info);

  const handleDelete = () => {
    showConfirmation({
      title: "ยืนยันการลบข้อมูล",
      description: `คุณต้องการลบข้อมูลการเข้าออกของ ${vehicleAccess.license_plate} หรือไม่?`,
      confirmLabel: "ลบ",
      cancelLabel: "ยกเลิก",
      variant: "destructive",
      onConfirm: () => {
        deleteVehicleAccessMutation.mutate(vehicleAccess.id);
      },
      isLoading: deleteVehicleAccessMutation.isPending,
    });
  };

  const handleDownloadData = () => {
    try {
      const exportData = {
        รหัสบันทึก: vehicleAccess.id,
        ป้ายทะเบียน: vehicleAccess.license_plate,
        ประเภทยานพาหนะ: tierInfo.label,
        จังหวัด: regionName,
        ประตู: vehicleAccess.gate,
        เครื่องอ่าน: vehicleAccess.reader,
        สถานะประตู: gateStateInfo.label,
        สถานะการผ่าน: vehicleAccess.isSuccess ? "สำเร็จ" : "ล้มเหลว",
        บ้านเกี่ยวข้อง: vehicleAccess.house_id || "-",
        ความมั่นใจ_AI: snapshotInfo
          ? `${(snapshotInfo.confidence * 100).toFixed(1)}%`
          : "-",
        เวลาประมวลผล_AI: snapshotInfo
          ? `${snapshotInfo.processing_time}s`
          : "-",
        กล้อง: snapshotInfo?.camera_id || "-",
        หมายเหตุ: vehicleAccess.note || "",
        วันที่บันทึก: formatThaiDateTime(vehicleAccess.created),
      };

      const jsonString = JSON.stringify(exportData, null, 2);
      const blob = new Blob([jsonString], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `vehicle-access-${vehicleAccess.license_plate}-${vehicleAccess.id}.json`;
      link.click();
      URL.revokeObjectURL(url);

      toast.success("ดาวน์โหลดข้อมูลสำเร็จ");
    } catch (error) {
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลด");
    }
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" className="h-8 w-8 p-0">
            <span className="sr-only">เปิดเมนู</span>
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuLabel>การดำเนินการ</DropdownMenuLabel>
          <DropdownMenuSeparator />
          <DropdownMenuItem onClick={() => setDetailsOpen(true)}>
            <Eye className="mr-2 h-4 w-4" />
            ดูรายละเอียด
          </DropdownMenuItem>
          <DropdownMenuItem onClick={handleDownloadData}>
            <Download className="mr-2 h-4 w-4" />
            ดาวน์โหลดข้อมูล
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          <DropdownMenuItem
            onClick={handleDelete}
            className="text-red-600 focus:text-red-600">
            <Trash2 className="mr-2 h-4 w-4" />
            ลบข้อมูล
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Car className="h-5 w-5" />
              รายละเอียดการเข้าออกยานพาหนะ
            </DialogTitle>
            <DialogDescription>
              ข้อมูลการเข้าออกของยานพาหนะ {vehicleAccess.license_plate}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {/* Vehicle Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Car className="h-5 w-5" />
                  ข้อมูลยานพาหนะ
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      ป้ายทะเบียน
                    </label>
                    <div className="text-lg font-semibold">
                      {vehicleAccess.license_plate}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      จังหวัด
                    </label>
                    <div className="flex items-center gap-2">
                      <MapPin className="h-4 w-4 text-gray-400" />
                      {regionName}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      ประเภทยานพาหนะ
                    </label>
                    <Badge
                      variant="outline"
                      className={`${tierInfo.color} mt-1`}>
                      {tierInfo.label}
                    </Badge>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      สถานะการผ่าน
                    </label>
                    <Badge
                      variant={
                        vehicleAccess.isSuccess ? "default" : "destructive"
                      }
                      className="mt-1 gap-1">
                      {vehicleAccess.isSuccess ? (
                        <CheckCircle className="h-3 w-3" />
                      ) : (
                        <XCircle className="h-3 w-3" />
                      )}
                      {vehicleAccess.isSuccess ? "สำเร็จ" : "ล้มเหลว"}
                    </Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Gate Info Card */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Shield className="h-5 w-5" />
                  ข้อมูลประตูและเครื่องอ่าน
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      ประตู
                    </label>
                    <div className="font-medium">{vehicleAccess.gate}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      เครื่องอ่าน
                    </label>
                    <div className="font-medium">{vehicleAccess.reader}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      สถานะประตู
                    </label>
                    <Badge
                      variant="outline"
                      className={`${gateStateInfo.color} mt-1`}>
                      {gateStateInfo.label}
                    </Badge>
                  </div>
                  {vehicleAccess.house_id && (
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        บ้านเกี่ยวข้อง
                      </label>
                      <div className="flex items-center gap-2">
                        <Home className="h-4 w-4 text-gray-400" />
                        {vehicleAccess.expand?.house_id?.address ||
                          vehicleAccess.house_id}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            {/* AI Processing Info */}
            {snapshotInfo && (
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg flex items-center gap-2">
                    <Camera className="h-5 w-5" />
                    ข้อมูล AI Processing
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        ความมั่นใจ
                      </label>
                      <div className="font-medium">
                        {(snapshotInfo.confidence * 100).toFixed(1)}%
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        เวลาประมวลผล
                      </label>
                      <div className="font-medium">
                        {snapshotInfo.processing_time}s
                      </div>
                    </div>
                    <div>
                      <label className="text-sm font-medium text-gray-500">
                        กล้อง
                      </label>
                      <div className="font-medium">
                        {snapshotInfo.camera_id}
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Additional Info */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  ข้อมูลเพิ่มเติม
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {vehicleAccess.note && (
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      หมายเหตุ
                    </label>
                    <div className="text-sm bg-gray-50 p-2 rounded">
                      {vehicleAccess.note}
                    </div>
                  </div>
                )}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      วันที่บันทึก
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatThaiDateTime(vehicleAccess.created)}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-500">
                      อัปเดตล่าสุด
                    </label>
                    <div className="flex items-center gap-2">
                      <Calendar className="h-4 w-4 text-gray-400" />
                      {formatThaiDateTime(vehicleAccess.updated)}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Images Section */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  รูปภาพที่บันทึก
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4">
                  {vehicleAccess.full_snapshot && (
                    <div className="text-center">
                      <Badge
                        variant="outline"
                        className="bg-purple-50 text-purple-700 mb-2">
                        รูปภาพเต็ม
                      </Badge>
                      <div className="text-sm text-gray-500">
                        มีรูปภาพเต็มในระบบ
                      </div>
                    </div>
                  )}
                  {vehicleAccess.lp_snapshot && (
                    <div className="text-center">
                      <Badge
                        variant="outline"
                        className="bg-blue-50 text-blue-700 mb-2">
                        รูปป้ายทะเบียน
                      </Badge>
                      <div className="text-sm text-gray-500">
                        มีรูปป้ายทะเบียนในระบบ
                      </div>
                    </div>
                  )}
                  {!vehicleAccess.full_snapshot &&
                    !vehicleAccess.lp_snapshot && (
                      <div className="col-span-2 text-center text-gray-500">
                        ไม่มีรูปภาพที่บันทึก
                      </div>
                    )}
                </div>
              </CardContent>
            </Card>
          </div>
        </DialogContent>
      </Dialog>

      {confirmationDialog}
    </>
  );
}
