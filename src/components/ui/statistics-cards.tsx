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
    <div className="bg-gray-50 p-3 rounded-lg animate-pulse flex-shrink-0 min-w-[140px]">
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <div className="h-3 bg-gray-200 rounded w-16 mb-2"></div>
          <div className="h-6 bg-gray-200 rounded w-12"></div>
        </div>
        <div className="h-6 w-6 bg-gray-200 rounded ml-2"></div>
      </div>
    </div>
  );
}

function StatisticCardComponent({ card }: { card: StatisticCard }) {
  const colors = getColorClasses(card.color);
  const IconComponent = card.icon;

  return (
    <div
      className={cn("p-3 rounded-lg flex-shrink-0 min-w-[140px]", colors.bg)}>
      <div className="flex items-center justify-between">
        <div className="flex-1 min-w-0">
          <p className={cn("text-xs font-medium truncate", colors.text)}>
            {card.label}
          </p>
          <div className="flex items-baseline gap-1 mt-1">
            <p
              className={cn(
                "text-xl font-bold",
                colors.text.replace("600", "900")
              )}>
              {card.value >= 1000
                ? `${(card.value / 1000).toFixed(1)}k`
                : card.value.toLocaleString()}
            </p>
            {card.trend && (
              <span
                className={cn(
                  "text-xs font-medium",
                  card.trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                {card.trend.isPositive ? "↗" : "↘"}
                {card.trend.value}%
              </span>
            )}
          </div>
          {card.description && (
            <p className="text-xs text-gray-500 mt-1 truncate">
              {card.description}
            </p>
          )}
        </div>
        <IconComponent
          className={cn("h-6 w-6 flex-shrink-0 ml-2", colors.icon)}
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
      <div className={cn("flex gap-3 overflow-x-auto pb-2", className)}>
        {Array.from({ length: columns }).map((_, index) => (
          <StatisticCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div className={cn("flex gap-3 overflow-x-auto pb-2", className)}>
      {cards.map((card) => (
        <StatisticCardComponent key={card.key} card={card} />
      ))}
    </div>
  );
}

export type { StatisticCard };
export default StatisticsCards;
