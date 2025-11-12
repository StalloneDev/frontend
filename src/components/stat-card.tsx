import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { LucideIcon } from "lucide-react";

interface StatCardProps {
  title: string;
  value: string | number;
  icon: LucideIcon;
  description?: string;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  tone?: "orange" | "brown" | "black" | "blue";
}

export function StatCard({ title, value, icon: Icon, description, trend, tone = "orange" }: StatCardProps) {
  const toneClasses: Record<Required<StatCardProps>["tone"], string> = {
    orange: "bg-orange-50 border-orange-200 dark:bg-orange-950/20 dark:border-orange-900/40",
    brown: "bg-amber-50 border-amber-200 dark:bg-amber-950/20 dark:border-amber-900/40",
    black: "bg-stone-100 border-stone-300 dark:bg-stone-900/40 dark:border-stone-700",
    blue: "bg-sky-50 border-sky-200 dark:bg-sky-950/20 dark:border-sky-900/40",
  };
  const iconTone: Record<Required<StatCardProps>["tone"], string> = {
    orange: "text-orange-600 dark:text-orange-400",
    brown: "text-amber-700 dark:text-amber-400",
    black: "text-stone-700 dark:text-stone-300",
    blue: "text-sky-700 dark:text-sky-400",
  };

  return (
    <Card className={`transition-all hover:shadow-md ${toneClasses[tone]}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{title}</CardTitle>
        <Icon className={`h-4 w-4 ${iconTone[tone]}`} />
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold" data-testid={`stat-${title.toLowerCase().replace(/\s+/g, "-")}`}>
          {value}
        </div>
        {description && (
          <p className="text-xs text-muted-foreground mt-1">{description}</p>
        )}
        {trend && (
          <p className={`text-xs mt-1 ${trend.isPositive ? "text-green-600" : "text-red-600"}`}>
            {trend.isPositive ? "+" : ""}{trend.value}% ce mois
          </p>
        )}
      </CardContent>
    </Card>
  );
}
