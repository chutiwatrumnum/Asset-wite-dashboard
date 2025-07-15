// src/components/dashboard/passage-log-summary.tsx
import { useRecentPassageLogsQuery, useActiveEntriesQuery } from "@/react-query/manage/passage_log";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  LogIn, 
  LogOut, 
  UserCheck, 
  Clock,
  AlertTriangle 
} from "lucide-react";
import { getPassageLogStatistics, formatThaiDateTime } from "@/utils/passageLogUtils";

interface PassageLogSummaryProps {
  className?: string;
}

export function PassageLogSummary({ className }: PassageLogSummaryProps) {
  const { data: recentLogs, isLoading: isLoadingRecent } = useRecentPassageLogsQuery(24);
  const { data: activeEntries, isLoading: isLoadingActive } = useActiveEntriesQuery();

  if (isLoadingRecent || isLoadingActive) {
    return (
      <Card className={className}>
        <CardHeader>
          <CardTitle>ประวัติการเข้าออก (24 ชั่วโมงล่าสุด)</CardTitle>
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

  const stats = recentLogs ? getPassageLogStatistics(recentLogs) : null;
  const stillInsideCount = activeEntries?.length || 0;

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Clock className="h-5 w-5" />
          ประวัติการเข้าออก (24 ชั่วโมงล่าสุด)
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Statistics Grid */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-green-100 rounded-full mx-auto mb-2">
              <LogIn className="h-4 w-4 text-green-600" />
            </div>
            <div className="text-2xl font-bold text-green-600">{stats?.entries || 0}</div>
            <div className="text-xs text-gray-500">เข้า</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-orange-100 rounded-full mx-auto mb-2">
              <LogOut className="h-4 w-4 text-orange-600" />
            </div>
            <div className="text-2xl font-bold text-orange-600">{stats?.exits || 0}</div>
            <div className="text-xs text-gray-500">ออก</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-blue-100 rounded-full mx-auto mb-2">
              <UserCheck className="h-4 w-4 text-blue-600" />
            </div>
            <div className="text-2xl font-bold text-blue-600">{stillInsideCount}</div>
            <div className="text-xs text-gray-500">อยู่ในพื้นที่</div>
          </div>
          
          <div className="text-center">
            <div className="flex items-center justify-center w-8 h-8 bg-gray-100 rounded-full mx-auto mb-2">
              <AlertTriangle className="h-4 w-4 text-gray-600" />
            </div>
            <div className="text-2xl font-bold text-gray-600">{stats?.total || 0}</div>
            <div className="text-xs text-gray-500">ทั้งหมด</div>
          </div>
        </div>

        {/* Recent Activity */}
        {recentLogs && recentLogs.length > 0 && (
          <div>
            <h4 className="font-medium mb-2">กิจกรรมล่าสุด</h4>
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {recentLogs.slice(0, 5).map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2">
                    {log.passage_type === 'entry' ? (
                      <LogIn className="h-3 w-3 text-green-500" />
                    ) : (
                      <LogOut className="h-3 w-3 text-orange-500" />
                    )}
                    <span className="font-medium">{log.visitor_name}</span>
                    <Badge variant="outline" className="text-xs">
                      {log.passage_type === 'entry' ? 'เข้า' : 'ออก'}
                    </Badge>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatThaiDateTime(log.created).split(' ')[1]}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// src/components/dashboard/real-time-passage-monitor.tsx
import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { RefreshCw, Eye } from "lucide-react";
import { usePassageLogAllListQuery } from "@/react-query/manage/passage_log";
import { isStillInside, formatThaiDateTime } from "@/utils/passageLogUtils";

interface RealTimePassageMonitorProps {
  className?: string;
  onViewDetails?: (logId: string) => void;
}

export function RealTimePassageMonitor({ 
  className,
  onViewDetails 
}: RealTimePassageMonitorProps) {
  const { data: allLogs, refetch, isLoading } = usePassageLogAllListQuery();
  const [lastUpdate, setLastUpdate] = useState(new Date());

  // Auto-refresh every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetch();
      setLastUpdate(new Date());
    }, 30000);

    return () => clearInterval(interval);
  }, [refetch]);

  const activeEntries = allLogs?.filter(log => isStillInside(log)) || [];
  const recentActivity = allLogs?.slice(0, 10) || [];

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
            ติดตามการเข้าออกแบบเรียลไทม์
          </CardTitle>
          <Button
            variant="outline"
            size="sm"
            onClick={() => refetch()}
            disabled={isLoading}
            className="gap-2"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
            รีเฟรช
          </Button>
        </div>
        <div className="text-xs text-gray-500">
          อัปเดตล่าสุด: {lastUpdate.toLocaleTimeString('th-TH')}
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Currently Inside */}
        <div>
          <h4 className="font-medium mb-2 text-green-600">
            กำลังอยู่ในพื้นที่ ({activeEntries.length})
          </h4>
          {activeEntries.length > 0 ? (
            <div className="space-y-2 max-h-32 overflow-y-auto">
              {activeEntries.map((log) => (
                <div key={log.id} className="flex items-center justify-between p-2 bg-green-50 rounded">
                  <div>
                    <div className="font-medium text-sm">{log.visitor_name}</div>
                    <div className="text-xs text-gray-500">
                      เข้ามาเมื่อ: {formatThaiDateTime(log.entry_time)}
                    </div>
                  </div>
                  {onViewDetails && (
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => onViewDetails(log.id)}
                    >
                      <Eye className="h-3 w-3" />
                    </Button>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded">
              ไม่มีผู้เยี่ยมในพื้นที่ในขณะนี้
            </div>
          )}
        </div>

        {/* Recent Activity */}
        <div>
          <h4 className="font-medium mb-2">กิจกรรมล่าสุด</h4>
          {recentActivity.length > 0 ? (
            <div className="space-y-2 max-h-40 overflow-y-auto">
              {recentActivity.map((log) => (
                <div key={log.id} className="flex items-center justify-between text-sm border-b pb-2 last:border-0">
                  <div className="flex items-center gap-2">
                    <Badge 
                      variant={log.passage_type === 'entry' ? 'default' : 'secondary'}
                      className="text-xs"
                    >
                      {log.passage_type === 'entry' ? 'เข้า' : 'ออก'}
                    </Badge>
                    <span className="font-medium">{log.visitor_name}</span>
                  </div>
                  <span className="text-xs text-gray-500">
                    {formatThaiDateTime(log.created).split(' ')[1]}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-sm text-gray-500 p-2 bg-gray-50 rounded">
              ยังไม่มีกิจกรรม
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}