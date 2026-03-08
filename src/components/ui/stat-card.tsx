import { LucideIcon } from "lucide-react";
import { Card, CardContent } from "@/components/ui/card";

interface StatCardProps {
  icon: LucideIcon;
  label: string;
  value: string | number;
  color?: string;
}

export function StatCard({ icon: Icon, label, value, color }: StatCardProps) {
  return (
    <Card>
      <CardContent className="p-3 sm:p-4 flex items-center gap-3">
        <Icon className={`h-6 w-6 sm:h-8 sm:w-8 shrink-0 ${color || "text-primary"}`} />
        <div className="min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{label}</p>
          <p className="text-lg sm:text-2xl font-bold">{value}</p>
        </div>
      </CardContent>
    </Card>
  );
}
