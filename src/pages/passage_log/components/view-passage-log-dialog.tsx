// src/pages/passage-log/components/view-passage-log-dialog.tsx
"use client";

import type React from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  User,
  MapPin,
  Clock,
  CheckCircle,
  XCircle,
  Home,
  Shield,
  Calendar,
  FileText,
  Key,
  Car,
  CreditCard,
} from "lucide-react";
import type { PassageLogItem } from "@/api/passage_log/passage_log";
import {
  getPassageDisplayStatus,
  getVerificationMethodDisplay,
  getPassageTypeDisplay,
  calculateDuration,
  isStillInside,
  formatThaiDateTime,
} from "@/utils/passageLogUtils";

interface ViewPassageLogDialogProps {
  passageLogData: PassageLogItem | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export function ViewPassageLogDialog({
  passageLogData,
  open,
  onOpenChange,
}: ViewPassageLogDialogProps) {
  if (!passageLogData) return null;

  const status = getPassageDisplayStatus(passageLogData);
  const verificationMethod = getVerificationMethodDisplay(passageLogData);
  const passageType = getPassageTypeDisplay(passageLogData);
  const duration = calculateDuration(
    passageLogData.entry_time,
    passageLogData.exit_time
  );
  const stillInside = isStillInside(passageLogData);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            รายละเอียดประวัติการเข้าออก
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {/* Header Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <User className="h-5 w-5" />
                {passageLogData.visitor_name}
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <div className="flex items-center gap-2">
                  <Badge
                    variant="outline"
                    className={`${passageType.color} gap-1`}>
                    <span>{passageType.icon}</span>
                    {passageType.label}
                  </Badge>
                  {stillInside && (
                    <Badge
                      variant="outline"
                      className="bg-blue-50 text-blue-700 border-blue-200">
                      อยู่ในพื้นที่
                    </Badge>
                  )}
                </div>
                <div className="flex items-center gap-2">
                  <Badge variant="outline" className={`${status.color} gap-1`}>
                    {status.label === "สำเร็จ" ? (
                      <CheckCircle className="h-3 w-3" />
                    ) : status.label === "ล้มเหลว" ? (
                      <XCircle className="h-3 w-3" />
                    ) : (
                      <Clock className="h-3 w-3" />
                    )}
                    {status.label}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Time Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Clock className="h-4 w-4" />
                ข้อมูลเวลา
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    เวลาเข้า
                  </label>
                  <p className="text-sm mt-1">
                    {passageLogData.entry_time
                      ? formatThaiDateTime(passageLogData.entry_time)
                      : "-"}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    เวลาออก
                  </label>
                  <p className="text-sm mt-1">
                    {passageLogData.exit_time
                      ? formatThaiDateTime(passageLogData.exit_time)
                      : "ยังไม่ออก"}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  ระยะเวลา
                </label>
                <p className="text-sm mt-1 flex items-center gap-1">
                  <Clock className="h-3 w-3 text-gray-500" />
                  {duration}
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Location and Verification */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MapPin className="h-4 w-4" />
                พื้นที่และการยืนยัน
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <div>
                <label className="text-sm font-medium text-gray-600">
                  พื้นที่
                </label>
                <p className="text-sm mt-1 flex items-center gap-1">
                  <MapPin className="h-3 w-3 text-gray-500" />
                  {passageLogData.expand?.location_area?.name ||
                    passageLogData.location_area}
                </p>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  วิธีการยืนยัน
                </label>
                <div className="mt-1">
                  <Badge
                    variant="outline"
                    className={`${verificationMethod.color} gap-1`}>
                    <span>{verificationMethod.icon}</span>
                    {verificationMethod.label}
                  </Badge>
                </div>
              </div>
              {passageLogData.verification_data && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    ข้อมูลการยืนยัน
                  </label>
                  <p className="text-sm mt-1 bg-gray-50 p-2 rounded">
                    {passageLogData.verification_data}
                  </p>
                </div>
              )}
              {passageLogData.staff_verified_by && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    เจ้าหน้าที่ยืนยัน
                  </label>
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <Shield className="h-3 w-3 text-gray-500" />
                    {passageLogData.expand?.staff_verified_by
                      ? `${passageLogData.expand.staff_verified_by.first_name || ""} ${passageLogData.expand.staff_verified_by.last_name || ""}`.trim()
                      : passageLogData.staff_verified_by}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Related Information */}
          {(passageLogData.house_id ||
            passageLogData.invitation_id ||
            passageLogData.vehicle_id) && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Key className="h-4 w-4" />
                  ข้อมูลเกี่ยวข้อง
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                {passageLogData.house_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      บ้านเกี่ยวข้อง
                    </label>
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <Home className="h-3 w-3 text-gray-500" />
                      {passageLogData.expand?.house_id?.address ||
                        passageLogData.expand?.house_id?.name ||
                        passageLogData.house_id}
                    </p>
                  </div>
                )}
                {passageLogData.invitation_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      บัตรเชิญเกี่ยวข้อง
                    </label>
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <CreditCard className="h-3 w-3 text-gray-500" />
                      {passageLogData.invitation_id}
                    </p>
                  </div>
                )}
                {passageLogData.vehicle_id && (
                  <div>
                    <label className="text-sm font-medium text-gray-600">
                      ยานพาหนะเกี่ยวข้อง
                    </label>
                    <p className="text-sm mt-1 flex items-center gap-1">
                      <Car className="h-3 w-3 text-gray-500" />
                      {passageLogData.vehicle_id}
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          )}

          {/* Additional Information */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <FileText className="h-4 w-4" />
                ข้อมูลเพิ่มเติม
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {passageLogData.notes && (
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    หมายเหตุ
                  </label>
                  <p className="text-sm mt-1 bg-gray-50 p-3 rounded">
                    {passageLogData.notes}
                  </p>
                </div>
              )}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    วันที่บันทึก
                  </label>
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-500" />
                    {formatThaiDateTime(passageLogData.created)}
                  </p>
                </div>
                <div>
                  <label className="text-sm font-medium text-gray-600">
                    อัปเดตล่าสุด
                  </label>
                  <p className="text-sm mt-1 flex items-center gap-1">
                    <Calendar className="h-3 w-3 text-gray-500" />
                    {formatThaiDateTime(passageLogData.updated)}
                  </p>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium text-gray-600">
                  รหัสบันทึก
                </label>
                <p className="text-sm mt-1 font-mono text-xs bg-gray-50 p-2 rounded">
                  {passageLogData.id}
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </DialogContent>
    </Dialog>
  );
}

export default ViewPassageLogDialog;
