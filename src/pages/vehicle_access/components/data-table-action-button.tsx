// src/pages/vehicle_access/components/data-table-action-button.tsx (Updated with image viewer)
import { useState } from "react";
import {
  Eye,
  Download,
  Trash2,
  MoreHorizontal,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
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
  getAllVehicleImageUrls,
  hasVehicleImages,
  downloadAllVehicleImages,
  exportVehicleRecordWithImages,
} from "@/utils/vehicleAccessUtils";
import type { PassageLogItem } from "@/api/vehicle_access/vehicle_access";
import { useDeleteVehicleAccessMutation } from "@/react-query/manage/vehicle_access/vehicle_access";
import { useConfirmationDialog } from "@/components/ui/confirmation-dialog";
import { useImageViewer, MultiImageViewer } from "@/components/ui/image-viewer";
import { toast } from "sonner";
import {
  CheckCircle,
  XCircle,
  Car,
  MapPin,
  Shield,
  Home,
  Calendar,
  FileText,
} from "lucide-react";

interface VehicleAccessActionButtonProps {
  info: {
    original: PassageLogItem;
  };
}

export default function VehicleAccessActionButton({
  info,
}: VehicleAccessActionButtonProps) {
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [imagesViewerOpen, setImagesViewerOpen] = useState(false);
  const vehicleAccess = info.original;
  const { showConfirmation, confirmationDialog } = useConfirmationDialog();
  const { isOpen, showImage, closeImage, imageViewer } = useImageViewer();
  const deleteVehicleAccessMutation = useDeleteVehicleAccessMutation();

  const tierInfo = getTierInfo(vehicleAccess.tier);
  const gateStateInfo = getGateStateInfo(vehicleAccess.gate_state);
  const regionName = getRegionName(vehicleAccess.area_code);
  const snapshotInfo = parseSnapshotInfo(vehicleAccess.snapshot_info);
  const images = getAllVehicleImageUrls(vehicleAccess);
  const hasImages = hasVehicleImages(vehicleAccess);

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
        จำนวนรูปภาพ: images.length,
        รายชื่อไฟล์รูปภาพ: images.map((img) => img.filename).join(", "),
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

  const handleDownloadImages = async () => {
    if (!hasImages) {
      toast.warning("ไม่มีรูปภาพสำหรับดาวน์โหลด");
      return;
    }

    try {
      await downloadAllVehicleImages(vehicleAccess);
      toast.success("ดาวน์โหลดรูปภาพสำเร็จ");
    } catch (error) {
      console.error("Download images error:", error);
      toast.error("เกิดข้อผิดพลาดในการดาวน์โหลดรูปภาพ");
    }
  };

  const handleExportComplete = async () => {
    try {
      await exportVehicleRecordWithImages(vehicleAccess);
      toast.success("ส่งออกข้อมูลและรูปภาพสำเร็จ");
    } catch (error) {
      console.error("Export complete error:", error);
      toast.error("เกิดข้อผิดพลาดในการส่งออกข้อมูล");
    }
  };

  const handleViewImages = () => {
    if (images.length === 0) {
      toast.warning("ไม่มีรูปภาพสำหรับแสดง");
      return;
    }

    if (images.length === 1) {
      const image = images[0];
      showImage(image.url, image.title, image.description);
    } else {
      setImagesViewerOpen(true);
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

          {/* Image related actions */}
          {hasImages && (
            <>
              <DropdownMenuItem onClick={handleViewImages}>
                <Camera className="mr-2 h-4 w-4" />
                ดูรูปภาพ ({images.length})
              </DropdownMenuItem>

              <DropdownMenuItem onClick={handleDownloadImages}>
                <ImageIcon className="mr-2 h-4 w-4" />
                ดาวน์โหลดรูปภาพ
              </DropdownMenuItem>
            </>
          )}

          <DropdownMenuItem onClick={handleDownloadData}>
            <Download className="mr-2 h-4 w-4" />
            ดาวน์โหลดข้อมูล JSON
          </DropdownMenuItem>

          <DropdownMenuItem onClick={handleExportComplete}>
            <FileText className="mr-2 h-4 w-4" />
            ส่งออกครบถ้วน
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
                    <div className="text-lg font-semibold flex items-center gap-2">
                      {vehicleAccess.license_plate}
                      {hasImages && (
                        <Badge variant="outline" className="text-xs">
                          <Camera className="h-3 w-3 mr-1" />
                          {images.length} รูป
                        </Badge>
                      )}
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

            {/* Images Section - Enhanced */}
            <Card>
              <CardHeader>
                <CardTitle className="text-lg flex items-center gap-2">
                  <Camera className="h-5 w-5" />
                  รูปภาพที่บันทึก
                  {hasImages && (
                    <Badge variant="outline" className="ml-2">
                      {images.length} รูป
                    </Badge>
                  )}
                </CardTitle>
              </CardHeader>
              <CardContent>
                {hasImages ? (
                  <div className="space-y-4">
                    {/* Image thumbnails grid */}
                    <div className="grid grid-cols-2 gap-4">
                      {images.map((image, index) => (
                        <Card key={index} className="overflow-hidden">
                          <CardContent className="p-3">
                            <div className="aspect-video bg-gray-100 rounded mb-2 overflow-hidden">
                              {image.thumbnail ? (
                                <img
                                  src={image.thumbnail}
                                  alt={image.title}
                                  className="w-full h-full object-cover cursor-pointer hover:scale-105 transition-transform"
                                  onClick={() =>
                                    showImage(
                                      image.url,
                                      image.title,
                                      image.description
                                    )
                                  }
                                />
                              ) : (
                                <div
                                  className="w-full h-full flex items-center justify-center cursor-pointer hover:bg-gray-200 transition-colors"
                                  onClick={() =>
                                    showImage(
                                      image.url,
                                      image.title,
                                      image.description
                                    )
                                  }>
                                  <Camera className="h-8 w-8 text-gray-400" />
                                </div>
                              )}
                            </div>
                            <div className="text-center">
                              <Badge
                                variant="outline"
                                className={
                                  image.type === "full"
                                    ? "bg-purple-50 text-purple-700"
                                    : "bg-blue-50 text-blue-700"
                                }>
                                {image.title}
                              </Badge>
                              <div className="text-xs text-gray-500 mt-1">
                                {image.filename}
                              </div>
                            </div>
                          </CardContent>
                        </Card>
                      ))}
                    </div>

                    {/* Action buttons for images */}
                    <div className="flex gap-2 justify-center pt-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleViewImages}
                        className="gap-2">
                        <Eye className="h-4 w-4" />
                        ดูรูปภาพ
                      </Button>

                      <Button
                        variant="outline"
                        size="sm"
                        onClick={handleDownloadImages}
                        className="gap-2">
                        <Download className="h-4 w-4" />
                        ดาวน์โหลด
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="text-center text-gray-500 py-8">
                    <Camera className="h-12 w-12 mx-auto mb-2 text-gray-300" />
                    <p>ไม่มีรูปภาพที่บันทึก</p>
                  </div>
                )}
              </CardContent>
            </Card>

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
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Viewers */}
      {imageViewer}

      <MultiImageViewer
        open={imagesViewerOpen}
        onOpenChange={setImagesViewerOpen}
        images={images.map((img) => ({
          src: img.url,
          title: img.title,
          description: img.description,
        }))}
      />

      {confirmationDialog}
    </>
  );
}
