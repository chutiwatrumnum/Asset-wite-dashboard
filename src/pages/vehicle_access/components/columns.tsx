// src/pages/vehicle_access/components/columns.tsx (Updated with Shadcn-native image viewer)
import { createColumnHelper } from "@tanstack/react-table";
import { formatInTimeZone } from "date-fns-tz";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle,
  XCircle,
  Eye,
  Camera,
  Image as ImageIcon,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import type { PassageLogItem } from "@/api/vehicle_access/vehicle_access";
import {
  getTierInfo,
  getGateStateInfo,
  getAreaName,
  formatThaiDateTime,
  getAllVehicleImageUrls,
  hasVehicleImages,
} from "@/utils/vehicleAccessUtils";
import {
  useImageViewer,
  ImageLightbox,
} from "@/components/ui/image-viewer-shadcn";
import { toast } from "sonner";

const TimeZone = "Asia/Bangkok";
const columnHelper = createColumnHelper<PassageLogItem>();

// Enhanced SnapshotViewer Component with Shadcn Image Viewer
const SnapshotViewer = ({ record }: { record: PassageLogItem }) => {
  const { showImage, showImages, ImageViewer } = useImageViewer();

  const images = getAllVehicleImageUrls(record);
  const hasImages = hasVehicleImages(record);

  const handleViewSingle = (imageType: "full" | "lp") => {
    const image = images.find((img) => img.type === imageType);
    if (image && image.url) {
      showImage(image.url, image.title, image.description);
    } else {
      toast.error("ไม่สามารถโหลดรูปภาพได้");
    }
  };

  const handleViewAll = () => {
    if (images.length > 0) {
      const imageData = images.map((img) => ({
        src: img.url,
        title: img.title,
        description: img.description,
        alt: img.title,
      }));
      showImages(imageData, 0);
    } else {
      toast.warning("ไม่มีรูปภาพสำหรับแสดง");
    }
  };

  if (!hasImages) {
    return (
      <div className="flex justify-center items-center text-gray-400">
        <span className="text-xs">ไม่มีรูป</span>
      </div>
    );
  }

  return (
    <>
      <div className="flex gap-1 justify-center">
        {/* Single image buttons */}
        {record.full_snapshot && (
          <ImageLightbox
            src={images.find((img) => img.type === "full")?.url}
            title="รูปภาพเต็ม"
            description="รูปภาพเต็มจากกล้อง CCTV">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="ดูรูปภาพเต็ม">
              <Camera className="h-3 w-3 text-blue-600" />
            </Button>
          </ImageLightbox>
        )}

        {record.lp_snapshot && (
          <ImageLightbox
            src={images.find((img) => img.type === "license_plate")?.url}
            title="รูปป้ายทะเบียน"
            description="รูปป้ายทะเบียนที่ตรวจจับได้">
            <Button
              variant="ghost"
              size="sm"
              className="h-6 w-6 p-0"
              title="ดูรูปป้ายทะเบียน">
              <Eye className="h-3 w-3 text-green-600" />
            </Button>
          </ImageLightbox>
        )}

        {/* View all images button (when there are multiple images) */}
        {images.length > 1 && (
          <Button
            variant="ghost"
            size="sm"
            className="h-6 w-6 p-0"
            onClick={handleViewAll}
            title="ดูรูปทั้งหมด">
            <ImageIcon className="h-3 w-3 text-purple-600" />
          </Button>
        )}

        {/* Image count badge */}
        <div className="flex items-center">
          <Badge variant="outline" className="h-4 px-1 text-[10px]">
            {images.length}
          </Badge>
        </div>
      </div>

      {/* Shadcn Image Viewer */}
      {ImageViewer}
    </>
  );
};

// Enhanced columns with Shadcn image support
export const columns = [
  columnHelper.accessor("id", {
    cell: (info) => info.getValue(),
    enableHiding: false,
  }),

  // วันที่เวลา
  columnHelper.accessor("created", {
    header: () => <div className="text-center">วันที่เวลา</div>,
    cell: (info) => {
      const createdTime = new Date(info.getValue());
      return (
        <div className="text-center min-w-[140px]">
          <div className="text-sm font-medium">
            {formatInTimeZone(createdTime, TimeZone, "dd MMM yyyy")}
          </div>
          <div className="text-xs text-gray-500">
            {formatInTimeZone(createdTime, TimeZone, "HH:mm:ss")}
          </div>
        </div>
      );
    },
    enableSorting: true,
  }),

  // ป้ายทะเบียน with image indicator
  columnHelper.accessor("license_plate", {
    header: () => <div className="text-center">ป้ายทะเบียน</div>,
    cell: (info) => {
      const record = info.row.original;
      const hasImages = hasVehicleImages(record);

      return (
        <div className="text-center min-w-[120px]">
          <div className="font-semibold flex items-center justify-center gap-1">
            {info.getValue()}
            {hasImages && (
              <Camera className="h-3 w-3 text-blue-500" title="มีรูปภาพ" />
            )}
          </div>
        </div>
      );
    },
    enableHiding: true,
  }),

  // ผลการเข้าออก
  columnHelper.accessor("isSuccess", {
    header: () => <div className="text-center">ผลการเข้าออก</div>,
    cell: (info) => {
      const isSuccess = info.getValue();
      return (
        <div className="flex justify-center items-center">
          <Badge
            variant={isSuccess ? "default" : "destructive"}
            className="gap-1">
            {isSuccess ? (
              <CheckCircle className="h-3 w-3" />
            ) : (
              <XCircle className="h-3 w-3" />
            )}
            {isSuccess ? "สำเร็จ" : "ล้มเหลว"}
          </Badge>
        </div>
      );
    },
    enableSorting: true,
  }),

  // ประเภทยานพาหนะ
  columnHelper.accessor("tier", {
    header: () => <div className="text-center">ประเภทยานพาหนะ</div>,
    cell: (info) => {
      const tier = info.getValue();
      const tierInfo = getTierInfo(tier);

      return (
        <div className="flex justify-center items-center">
          <Badge variant="outline" className={tierInfo.color}>
            {tierInfo.label}
          </Badge>
        </div>
      );
    },
    enableSorting: true,
  }),

  // จังหวัด
  columnHelper.accessor("area_code", {
    header: () => <div className="text-center">จังหวัด</div>,
    cell: (info) => {
      const areaCode = info.getValue();
      const areaName = getAreaName(areaCode);

      return (
        <div className="text-center min-w-[100px]">
          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
            {areaName}
          </span>
        </div>
      );
    },
  }),

  // สถานะประตู
  columnHelper.accessor("gate_state", {
    header: () => <div className="text-center">สถานะประตู</div>,
    cell: (info) => {
      const gateState = info.getValue();
      const gateStateInfo = getGateStateInfo(gateState);

      return (
        <div className="flex justify-center items-center">
          <Badge variant="outline" className={gateStateInfo.color}>
            {gateStateInfo.label}
          </Badge>
        </div>
      );
    },
    enableSorting: true,
  }),

  // บ้าน
  columnHelper.accessor("house_id", {
    header: () => <div className="text-center">บ้าน</div>,
    cell: (info) => {
      const houseId = info.getValue();
      const rowData = info.row.original;
      const houseData = rowData.expand?.house_id;

      if (!houseId) {
        return (
          <div className="text-center">
            <span className="text-xs text-gray-400">ไม่ระบุ</span>
          </div>
        );
      }

      return (
        <div className="text-center min-w-[100px]">
          {houseData ? (
            <div className="text-sm font-medium">
              {houseData.address || houseData.house_number || "บ้าน"}
            </div>
          ) : (
            <span className="text-sm text-gray-500">บ้าน</span>
          )}
        </div>
      );
    },
    enableSorting: true,
  }),

  // รีดเดอร์/ประตู
  columnHelper.accessor("reader", {
    header: () => <div className="text-center">รีดเดอร์/ประตู</div>,
    cell: (info) => {
      const rowData = info.row.original;
      const readerData = rowData.expand?.reader;
      const gateData = rowData.expand?.gate;

      return (
        <div className="text-center min-w-[100px]">
          <div className="text-xs space-y-1">
            {readerData && (
              <div className="text-gray-600">
                R: {readerData.name || rowData.reader}
              </div>
            )}
            {gateData && (
              <div className="text-gray-600">
                G: {gateData.name || rowData.gate}
              </div>
            )}
            {!readerData && !gateData && (
              <span className="text-gray-400">ไม่ระบุ</span>
            )}
          </div>
        </div>
      );
    },
  }),

  // รูปภาพ - Enhanced with Shadcn image viewer
  columnHelper.accessor("full_snapshot", {
    header: () => <div className="text-center">รูปภาพ</div>,
    cell: (info) => {
      const rowData = info.row.original;
      return (
        <div className="flex justify-center items-center min-w-[80px]">
          <SnapshotViewer record={rowData} />
        </div>
      );
    },
    enableSorting: false,
  }),

  // หมายเหตุ
  columnHelper.accessor("note", {
    header: () => <div className="text-center">หมายเหตุ</div>,
    cell: (info) => {
      const note = info.getValue();
      if (!note) {
        return (
          <div className="text-center">
            <span className="text-xs text-gray-400">-</span>
          </div>
        );
      }

      return (
        <div className="text-center min-w-[100px] max-w-[200px]">
          <span className="text-xs text-gray-600 truncate" title={note}>
            {note}
          </span>
        </div>
      );
    },
  }),
];
