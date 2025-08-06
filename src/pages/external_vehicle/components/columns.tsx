// src/pages/external_vehicle/components/columns.tsx - แก้ไข column ที่มีปัญหา
import { createColumnHelper } from "@tanstack/react-table";
import { formatInTimeZone } from "date-fns-tz";
import DataTableColumnHeader from "./data-table-column-header";
import { VisitorItem } from "@/api/external_vehicle/visitor";
import { Badge } from "@/components/ui/badge";
import {
  getProvinceName,
  getGenderInfo,
  formatThaiIdCard,
} from "@/utils/visitorUtils";
import { CheckCircle, MapPin, User, Car } from "lucide-react";

const TimeZone = "Asia/Bangkok";
const columnHelper = createColumnHelper<VisitorItem>();

export const columns = [
  columnHelper.accessor("id", {
    cell: (info) => info.getValue(),
    enableHiding: false,
  }),

  // ชื่อ-นามสกุล
  columnHelper.display({
    id: "full_name",
    header: () => <DataTableColumnHeader title="ชื่อ-นามสกุล" />,
    cell: (info) => {
      const visitor = info.row.original;
      const genderInfo = getGenderInfo(visitor.gender || "other");

      return (
        <div className="min-w-[150px]">
          <div className="flex items-center gap-2">
            <span className="text-base">{genderInfo.icon}</span>
            <div>
              <div className="font-semibold">
                {visitor.first_name || ""} {visitor.last_name || ""}
              </div>
              <div className="text-xs text-gray-500">{genderInfo.label}</div>
            </div>
          </div>
        </div>
      );
    },
    enableSorting: true,
  }),

  // ป้ายทะเบียน - แก้ไขให้ safe
  columnHelper.accessor("vehicle", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="ยานพาหนะ" />
      </div>
    ),
    cell: (info) => {
      const vehicle = info.getValue();

      // เช็คว่า vehicle มีข้อมูลหรือไม่
      if (!vehicle) {
        return (
          <div className="flex justify-center items-center">
            <div className="text-center text-gray-400">
              <Car className="h-4 w-4 mx-auto mb-1" />
              <span className="text-xs">ไม่มีข้อมูล</span>
            </div>
          </div>
        );
      }

      const licensePlate = vehicle.license_plate || "ไม่ระบุ";
      const areaCode = vehicle.area_code || "";
      const provinceName = areaCode ? getProvinceName(areaCode) : "ไม่ระบุ";

      return (
        <div className="flex justify-center items-center">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <Car className="h-4 w-4 text-blue-600" />
              <span className="font-semibold">{licensePlate}</span>
            </div>
            <div className="text-xs text-gray-500 mt-1">{provinceName}</div>
          </div>
        </div>
      );
    },
    enableSorting: true,
  }),

  // เลขบัตรประชาชน
  columnHelper.accessor("id_card", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="บัตรประชาชน" />
      </div>
    ),
    cell: (info) => {
      const idCard = info.getValue() || "";

      if (!idCard || idCard.trim() === "") {
        return (
          <div className="flex justify-center items-center">
            <span className="text-xs text-gray-400">ไม่ระบุ</span>
          </div>
        );
      }

      return (
        <div className="flex justify-center items-center">
          <code className="text-xs bg-gray-100 px-2 py-1 rounded">
            {formatThaiIdCard(idCard)}
          </code>
        </div>
      );
    },
    enableSorting: true,
  }),

  // บ้าน
  columnHelper.accessor("house_id", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="บ้าน" />
      </div>
    ),
    cell: (info) => {
      const houseId = info.getValue();
      const rowData = info.row.original;
      const houseData = rowData.expand?.house_id;

      if (!houseId) {
        return (
          <div className="flex justify-center items-center">
            <span className="text-xs text-gray-400">ไม่ระบุ</span>
          </div>
        );
      }

      return (
        <div className="flex justify-center items-center min-w-[120px]">
          {houseData ? (
            <div className="text-center">
              <div className="text-sm font-medium">
                {houseData.address || houseData.house_number || "บ้าน"}
              </div>
            </div>
          ) : (
            <span className="text-sm text-gray-500">บ้าน</span>
          )}
        </div>
      );
    },
    enableSorting: true,
  }),

  // พื้นที่ที่ได้รับอนุญาต
  columnHelper.accessor("authorized_area", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="พื้นที่อนุญาต" />
      </div>
    ),
    cell: (info) => {
      const authorizedAreas = info.getValue() || [];
      const rowData = info.row.original;
      const areaData = rowData.expand?.authorized_area;

      if (
        !authorizedAreas ||
        !Array.isArray(authorizedAreas) ||
        authorizedAreas.length === 0
      ) {
        return (
          <div className="flex justify-center items-center">
            <span className="text-xs text-gray-400">ไม่ระบุ</span>
          </div>
        );
      }

      return (
        <div className="flex justify-center items-center min-w-[120px]">
          <div className="text-center">
            <Badge variant="outline" className="gap-1 mb-1">
              <MapPin className="h-3 w-3" />
              {authorizedAreas.length} พื้นที่
            </Badge>
            {areaData && Array.isArray(areaData) && areaData.length > 0 && (
              <div className="text-xs text-gray-500 max-w-[100px] truncate">
                {areaData
                  .slice(0, 2)
                  .map((area: any) => area?.name || "ไม่ระบุ")
                  .join(", ")}
                {areaData.length > 2 && ` +${areaData.length - 2}`}
              </div>
            )}
          </div>
        </div>
      );
    },
    enableSorting: true,
  }),

  // ผู้สร้าง
  columnHelper.accessor("issuer", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="ผู้สร้าง" />
      </div>
    ),
    cell: (info) => {
      const issuerId = info.getValue();
      const issuerData = info.row.original.expand?.issuer;

      if (!issuerId) {
        return (
          <div className="flex justify-center items-center">
            <span className="text-xs text-gray-400">ระบบ</span>
          </div>
        );
      }

      return (
        <div className="flex justify-center items-center min-w-[100px]">
          <div className="text-center">
            <div className="flex items-center gap-1 justify-center">
              <User className="h-3 w-3 text-blue-600" />
              {issuerData ? (
                <span className="text-sm">
                  {issuerData.first_name || ""} {issuerData.last_name || ""}
                </span>
              ) : (
                <span className="text-xs text-gray-500">เจ้าหน้าที่</span>
              )}
            </div>
          </div>
        </div>
      );
    },
    enableSorting: true,
  }),

  // การอนุมัติ
  columnHelper.accessor("stamper", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="การอนุมัติ" />
      </div>
    ),
    cell: (info) => {
      const stamperId = info.getValue();
      const stamperData = info.row.original.expand?.stamper;
      const stampedTime = info.row.original.stamped_time;

      if (!stamperId) {
        return (
          <div className="flex justify-center items-center">
            <Badge variant="outline" className="bg-gray-50 text-gray-500">
              รออนุมัติ
            </Badge>
          </div>
        );
      }

      return (
        <div className="flex flex-col items-center gap-1 min-w-[100px]">
          <Badge variant="outline" className="bg-green-50 text-green-700">
            <CheckCircle className="h-3 w-3 mr-1" />
            อนุมัติแล้ว
          </Badge>

          {stamperData && (
            <div className="text-xs text-gray-500 text-center">
              {stamperData.first_name || ""} {stamperData.last_name || ""}
            </div>
          )}

          {stampedTime && (
            <div className="text-xs text-gray-400">
              {formatInTimeZone(new Date(stampedTime), TimeZone, "dd/MM/yy")}
            </div>
          )}
        </div>
      );
    },
    enableSorting: true,
  }),

  // หมายเหตุ
  columnHelper.accessor("note", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="หมายเหตุ" />
      </div>
    ),
    cell: (info) => {
      const note = info.getValue() || "";

      if (!note || note.trim() === "") {
        return (
          <div className="flex justify-center items-center">
            <span className="text-xs text-gray-400">-</span>
          </div>
        );
      }

      return (
        <div className="flex justify-center items-center max-w-[150px]">
          <div className="text-xs text-gray-600 truncate" title={note}>
            {note}
          </div>
        </div>
      );
    },
    enableSorting: false,
  }),

  // วันที่สร้าง
  columnHelper.accessor("created", {
    header: () => (
      <div className="flex justify-center items-center">
        <DataTableColumnHeader title="วันที่สร้าง" />
      </div>
    ),
    cell: (info) => {
      const createdTime = new Date(info.getValue());
      return (
        <div className="flex justify-center items-center">
          <div className="text-center">
            <div className="text-sm">
              {formatInTimeZone(createdTime, TimeZone, "dd MMM yyyy")}
            </div>
            <div className="text-xs text-gray-500">
              {formatInTimeZone(createdTime, TimeZone, "HH:mm")}
            </div>
          </div>
        </div>
      );
    },
  }),
];
