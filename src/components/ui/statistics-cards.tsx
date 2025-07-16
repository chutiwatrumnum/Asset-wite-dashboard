// src/components/ui/statistics-cards.tsx
import { Card, CardContent } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface StatisticCard {
  key: string;
  label: string;
  value: number;
  icon: LucideIcon;
  color: string;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
    label: string;
  };
}

interface StatisticsCardsProps {
  cards: StatisticCard[];
  className?: string;
  columns?: number;
  loading?: boolean;
}

const getColorClasses = (color: string) => {
  const colorMap: Record<string, { bg: string; text: string; icon: string }> = {
    blue: {
      bg: "bg-blue-50",
      text: "text-blue-600",
      icon: "text-blue-500",
    },
    green: {
      bg: "bg-green-50",
      text: "text-green-600",
      icon: "text-green-500",
    },
    yellow: {
      bg: "bg-yellow-50",
      text: "text-yellow-600",
      icon: "text-yellow-500",
    },
    orange: {
      bg: "bg-orange-50",
      text: "text-orange-600",
      icon: "text-orange-500",
    },
    red: {
      bg: "bg-red-50",
      text: "text-red-600",
      icon: "text-red-500",
    },
    gray: {
      bg: "bg-gray-50",
      text: "text-gray-600",
      icon: "text-gray-500",
    },
    purple: {
      bg: "bg-purple-50",
      text: "text-purple-600",
      icon: "text-purple-500",
    },
    indigo: {
      bg: "bg-indigo-50",
      text: "text-indigo-600",
      icon: "text-indigo-500",
    },
  };

  return colorMap[color] || colorMap.gray;
};

function StatisticCardSkeleton() {
  return (
    <div className="bg-gray-50 p-3 sm:p-4 rounded-lg animate-pulse w-full">
      <div className="flex items-center justify-between">
        <div className="flex-1 pr-2 sm:pr-3">
          <div className="h-3 sm:h-4 bg-gray-200 rounded w-16 sm:w-20 mb-2"></div>
          <div className="h-5 sm:h-6 xl:h-8 bg-gray-200 rounded w-12 sm:w-16"></div>
        </div>
        <div className="h-6 w-6 sm:h-7 sm:w-7 xl:h-8 xl:w-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

function StatisticCardComponent({ card }: { card: StatisticCard }) {
  const colors = getColorClasses(card.color);
  const IconComponent = card.icon;

  return (
    <div className={cn("p-3 sm:p-4 rounded-lg w-full", colors.bg)}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0 pr-2 sm:pr-3">
          <p
            className={cn(
              "text-xs sm:text-sm font-medium truncate",
              colors.text
            )}>
            {card.label}
          </p>
          <div className="flex items-baseline gap-1 sm:gap-2 mt-1 sm:mt-2">
            <p
              className={cn(
                "text-lg sm:text-xl xl:text-2xl font-bold",
                colors.text.replace("600", "900")
              )}>
              {card.value >= 1000
                ? `${(card.value / 1000).toFixed(1)}k`
                : card.value.toLocaleString()}
            </p>
            {card.trend && (
              <span
                className={cn(
                  "text-xs font-medium hidden sm:inline",
                  card.trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                {card.trend.isPositive ? "↗" : "↘"}
                {card.trend.value}%
              </span>
            )}
          </div>
          {card.description && (
            <p className="text-xs text-gray-500 mt-1 truncate hidden lg:block">
              {card.description}
            </p>
          )}
        </div>
        <IconComponent
          className={cn(
            "h-6 w-6 sm:h-7 sm:w-7 xl:h-8 xl:w-8 flex-shrink-0",
            colors.icon
          )}
        />
      </div>
    </div>
  );
}

export function StatisticsCards({
  cards,
  className,
  columns = 6,
  loading = false,
}: StatisticsCardsProps) {
  if (loading) {
    return (
      <div
        className={cn(
          "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 w-full",
          className
        )}>
        {Array.from({ length: Math.min(columns, 6) }).map((_, index) => (
          <StatisticCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn(
        "grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 sm:gap-4 w-full",
        className
      )}>
      {cards.map((card) => (
        <StatisticCardComponent key={card.key} card={card} />
      ))}
    </div>
  );
}

export type { StatisticCard };
export default StatisticsCards;
