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
    <div className="bg-gray-50 p-4 rounded-lg animate-pulse">
      <div className="flex items-center justify-between">
        <div>
          <div className="h-4 bg-gray-200 rounded w-20 mb-2"></div>
          <div className="h-8 bg-gray-200 rounded w-16"></div>
        </div>
        <div className="h-8 w-8 bg-gray-200 rounded"></div>
      </div>
    </div>
  );
}

function StatisticCardComponent({ card }: { card: StatisticCard }) {
  const colors = getColorClasses(card.color);
  const IconComponent = card.icon;

  return (
    <div className={cn("p-4 rounded-lg", colors.bg)}>
      <div className="flex items-center justify-between">
        <div>
          <p className={cn("text-sm font-medium", colors.text)}>{card.label}</p>
          <div className="flex items-baseline gap-2">
            <p
              className={cn(
                "text-2xl font-bold",
                colors.text.replace("600", "900")
              )}>
              {card.value.toLocaleString()}
            </p>
            {card.trend && (
              <span
                className={cn(
                  "text-xs font-medium",
                  card.trend.isPositive ? "text-green-600" : "text-red-600"
                )}>
                {card.trend.isPositive ? "+" : ""}
                {card.trend.value}% {card.trend.label}
              </span>
            )}
          </div>
          {card.description && (
            <p className="text-xs text-gray-500 mt-1">{card.description}</p>
          )}
        </div>
        <IconComponent className={cn("h-8 w-8", colors.icon)} />
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
  const gridCols =
    {
      2: "grid-cols-2",
      3: "grid-cols-3",
      4: "grid-cols-4",
      5: "grid-cols-5",
      6: "grid-cols-6",
      7: "grid-cols-7",
      8: "grid-cols-8",
    }[columns] || "grid-cols-6";

  if (loading) {
    return (
      <div
        className={cn(
          "grid gap-4",
          `lg:${gridCols}`,
          "grid-cols-2",
          className
        )}>
        {Array.from({ length: columns }).map((_, index) => (
          <StatisticCardSkeleton key={index} />
        ))}
      </div>
    );
  }

  return (
    <div
      className={cn("grid gap-4", `lg:${gridCols}`, "grid-cols-2", className)}>
      {cards.map((card) => (
        <StatisticCardComponent key={card.key} card={card} />
      ))}
    </div>
  );
}

export type { StatisticCard };
export default StatisticsCards;
