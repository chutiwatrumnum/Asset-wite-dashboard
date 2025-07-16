// src/pages/dashboard/components/vehicle-access-summary.tsx (แก้ไขแล้ว)
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Car,
  CheckCircle,
  XCircle,
  Clock,
  TrendingUp,
  Eye,
  Camera,
} from "lucide-react";
import { useRecentPassageLogQuery } from "@/react-query/manage/vehicle_access/vehicle_access"; // ✅ แก้ชื่อ
import {
  getVehicleAccessStatistics,
  formatThaiDateTime,
  getTierInfo,
} from "@/utils/vehicleAccessUtils";
import { Link } from "@tanstack/react-router";

interface VehicleAccessSummaryProps {
  className?: string;
}

export function VehicleAccessSummary({ className }: VehicleAccessSummaryProps) {
  const { data: recentAccess, isLoading } = useRecentPassageLogQuery(24); // ✅ แก้ชื่อ

  if (isLoading) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>ระบบเข้าออกยานพาหนะ (24 ชั่วโมงล่าสุด)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="animate-pulse space-y-2">
            <div className="h-4 bg-gray-200 rounded w-3/4"></div>
            <div className="h-4 bg-gray-200 rounded w-1/2"></div>
            <div className="h-4 bg-gray-200 rounded w-2/3"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  const stats = recentAccess ? getVehicleAccessStatistics(recentAccess) : null;
  const successRate = stats ? (stats.successful / stats.total) * 100 : 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Camera className="h-5 w-5" />
          ระบบเข้าออกยานพาหนะ (24 ชั่วโมงล่าสุด)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-2">
              <Car className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">
              {stats?.total || 0}
            </div>
            <div className="text-xs text-gray-500">ทั้งหมด</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-2">
              <CheckCircle className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">
              {stats?.successful || 0}
            </div>
            <div className="text-xs text-gray-500">สำเร็จ</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-red-100 rounded-full mx-auto mb-2">
              <XCircle className="h-4 w-4 text-red-600" />
            </div>
            <div className="text-2xl font-bold text-red-600">
              {stats?.failed || 0}
            </div>
            <div className="text-xs text-gray-500">ล้มเหลว</div>
          </div>

          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-purple-100 rounded-full mx-auto mb-2">
              <TrendingUp className="h-4 w-4 text-purple-600" />
            </div>
            <div className="text-2xl font-bold text-purple-600">
              {successRate.toFixed(1)}%
            </div>
            <div className="text-xs text-gray-500">อัตราสำเร็จ</div>
          </div>
        </div>

        {/* Success Rate Bar */}
        {stats && stats.total > 0 && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm">
              <span>อัตราความสำเร็จ</span>
              <span className="font-medium">{successRate.toFixed(1)}%</span>
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div
                className="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-300"
                style={{ width: `${successRate}%` }}></div>
            </div>
          </div>
        )}

        {/* Recent Activity */}
        {recentAccess && recentAccess.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">กิจกรรมล่าสุด</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recentAccess.slice(0, 5).map((access) => {
                const tierInfo = getTierInfo(access.tier);
                return (
                  <div
                    key={access.id}
                    className="flex items-center justify-between text-sm">
                    <div className="flex items-center gap-2">
                      {access.isSuccess ? (
                        <CheckCircle className="h-3 w-3 text-green-500" />
                      ) : (
                        <XCircle className="h-3 w-3 text-red-500" />
                      )}
                      <span className="font-medium">
                        {access.license_plate}
                      </span>
                      <Badge
                        variant="outline"
                        className={`text-xs ${tierInfo.color}`}>
                        {tierInfo.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-gray-500">
                      {formatThaiDateTime(access.created).split(" ")[1]}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Quick Actions */}
        <div className="pt-2 border-t">
          <Link to="/vehicle-access" className="w-full">
            <Button variant="outline" size="sm" className="w-full gap-2">
              <Eye className="h-4 w-4" />
              ดูรายละเอียดทั้งหมด
            </Button>
          </Link>
        </div>
      </CardContent>
    </Card>
  );
}

// Real-time status monitor component
export function VehicleAccessStatusMonitor({
  className,
}: {
  className?: string;
}) {
  const {
    data: recentAccess,
    refetch,
    isLoading,
  } = useRecentPassageLogQuery(1); // ✅ แก้ชื่อ

  const latestAccess = recentAccess?.[0];
  const recentFailures =
    recentAccess?.filter((access) => !access.isSuccess) || [];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            สถานะระบบ AI
          </CardTitle>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="h-6 w-6 p-0">
            <Clock className={`h-3 w-3 ${isLoading ? "animate-spin" : ""}`} />
          </Button>
        </div>
      </CardHeader>
      <CardContent className="space-y-3">
        {/* System Status */}
        <div className="flex items-center justify-between">
          <span className="text-sm">สถานะระบบ:</span>
          <Badge variant="outline" className="bg-green-50 text-green-700">
            ออนไลน์
          </Badge>
        </div>

        {/* Latest Detection */}
        {latestAccess && (
          <div>
            <span className="text-sm font-medium">ตรวจจับล่าสุด:</span>
            <div className="mt-1 p-2 bg-gray-50 rounded text-xs">
              <div className="flex items-center justify-between">
                <span className="font-medium">
                  {latestAccess.license_plate}
                </span>
                <Badge
                  variant={latestAccess.isSuccess ? "default" : "destructive"}
                  className="text-xs">
                  {latestAccess.isSuccess ? "สำเร็จ" : "ล้มเหลว"}
                </Badge>
              </div>
              <div className="text-gray-500 mt-1">
                {formatThaiDateTime(latestAccess.created)}
              </div>
            </div>
          </div>
        )}

        {/* Alerts */}
        {recentFailures.length > 0 && (
          <div>
            <span className="text-sm font-medium text-red-600">
              เตือน: มีการตรวจจับล้มเหลว {recentFailures.length} ครั้ง
            </span>
            <div className="text-xs text-gray-500 mt-1">
              ในช่วง 1 ชั่วโมงที่ผ่านมา
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
