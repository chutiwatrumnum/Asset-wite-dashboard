// src/pages/dashboard/index.tsx (แก้ไขแล้ว - เอา passage-log ออก)
import { ChartAreaInteractive } from "@/pages/dashboard/components/chart-area-interactive";
import { SectionCards } from "@/pages/dashboard/components/section-cards";
import {
  VehicleAccessSummary,
  VehicleAccessStatusMonitor,
} from "@/pages/dashboard/components/vehicle-access-summary";

export default function DashboardPage() {
  return (
    <div className="flex flex-1 flex-col">
      <div className="@container/main flex flex-1 flex-col gap-2">
        <div className="flex flex-col gap-4 py-4 md:gap-6 md:py-6">
          {/* Section Cards */}
          <SectionCards />

          {/* Vehicle Access & Monitoring Grid */}
          <div className="px-4 lg:px-6">
            <div className="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4 mb-6">
              {/* Vehicle Access Summary */}
              <VehicleAccessSummary className="lg:col-span-2" />

              {/* System Status Monitor */}
              <VehicleAccessStatusMonitor />
            </div>
          </div>

          {/* Chart */}
          <div className="px-4 lg:px-6">
            <ChartAreaInteractive />
          </div>
        </div>
      </div>
    </div>
  );
}
