import React, { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CalendarDays, Wallet, UserPlus, TrendingUp, AlertTriangle, AlertOctagon } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";
import { Badge } from "@/components/ui/badge";

const CHART_COLORS = [
  "hsl(215, 80%, 48%)",
  "hsl(170, 60%, 42%)",
  "hsl(38, 92%, 50%)",
  "hsl(280, 60%, 55%)",
  "hsl(0, 72%, 51%)",
];

interface StatCardProps {
  title: string;
  value: string | number;
  icon: React.ComponentType<{ className?: string }>;
  trend?: string;
}

const StatCard = React.forwardRef<HTMLDivElement, StatCardProps>(({ title, value, icon: Icon, trend }, ref) => {
  return (
    <Card>
      <CardContent className="p-3 sm:p-6">
        <div className="flex items-center justify-between gap-2">
          <div className="space-y-1 min-w-0">
            <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
            <p className="text-lg sm:text-2xl font-bold">{value}</p>
            {trend && <p className="text-xs text-accent">{trend}</p>}
          </div>
          <div className="flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
            <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
          </div>
        </div>
      </CardContent>
    </Card>
  );
});
StatCard.displayName = "StatCard";

interface ExpiryAlert {
  name: string;
  type: "id" | "contract";
  date: string;
  expired: boolean;
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { companyId } = useCompany();
  const [stats, setStats] = useState({ employees: 0, present: 0, onLeave: 0, pending: 0 });
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [deptData, setDeptData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    if (!companyId) return;

    const fetchDashboard = async () => {
      const today = new Date().toISOString().split("T")[0];
      const future30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

      const [empRes, attRes, leaveRes, pendingRes, deptRes] = await Promise.all([
        supabase.from("employees").select("id, first_name_ar, last_name_ar, first_name_en, last_name_en, id_expiry_date, contract_expiry_date, department_id, status").eq("status", "active"),
        supabase.from("attendance").select("id").eq("date", today),
        supabase.from("leave_requests").select("id").eq("status", "approved").lte("start_date", today).gte("end_date", today),
        supabase.from("leave_requests").select("id").eq("status", "pending"),
        supabase.from("departments").select("id, name_ar, name_en"),
      ]);

      const emps = empRes.data || [];
      setStats({
        employees: emps.length,
        present: attRes.data?.length || 0,
        onLeave: leaveRes.data?.length || 0,
        pending: pendingRes.data?.length || 0,
      });

      // Expiry alerts
      const expiryAlerts: ExpiryAlert[] = [];
      emps.forEach((e) => {
        const name = language === "ar" ? `${e.first_name_ar} ${e.last_name_ar}` : `${e.first_name_en || e.first_name_ar} ${e.last_name_en || e.last_name_ar}`;
        if (e.id_expiry_date && e.id_expiry_date <= future30) {
          expiryAlerts.push({ name, type: "id", date: e.id_expiry_date, expired: e.id_expiry_date < today });
        }
        if (e.contract_expiry_date && e.contract_expiry_date <= future30) {
          expiryAlerts.push({ name, type: "contract", date: e.contract_expiry_date, expired: e.contract_expiry_date < today });
        }
      });
      setAlerts(expiryAlerts.sort((a, b) => a.date.localeCompare(b.date)));

      // Department distribution
      const depts = deptRes.data || [];
      const deptMap: Record<string, { name: string; count: number }> = {};
      depts.forEach((d) => { deptMap[d.id] = { name: language === "ar" ? d.name_ar : d.name_en, count: 0 }; });
      emps.forEach((e) => { if (e.department_id && deptMap[e.department_id]) deptMap[e.department_id].count++; });
      setDeptData(Object.values(deptMap).filter((d) => d.count > 0).map((d) => ({ name: d.name, value: d.count })));
    };

    fetchDashboard();
  }, [companyId, language]);

  const statCards: StatCardProps[] = [
    { title: t('dashboard.totalEmployees'), value: stats.employees, icon: Users },
    { title: t('dashboard.presentToday'), value: stats.present, icon: Clock },
    { title: t('dashboard.onLeave'), value: stats.onLeave, icon: CalendarDays },
    { title: t('dashboard.pendingRequests'), value: stats.pending, icon: TrendingUp },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div>
        <h1 className="text-xl sm:text-2xl font-bold">{t('dashboard.title')}</h1>
        <p className="text-sm text-muted-foreground">{t('dashboard.welcome')}</p>
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat) => <StatCard key={stat.title} {...stat} />)}
      </div>

      {/* Expiry Alerts */}
      {alerts.length > 0 && (
        <Card className="border-orange-300 dark:border-orange-700">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              {language === "ar" ? "تنبيهات هامة" : "Critical Alerts"}
              <Badge variant="destructive" className="ms-2">{alerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2">
              {alerts.map((a, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg ${a.expired ? "bg-destructive/10 border border-destructive/20" : "bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800"}`}>
                  {a.expired ? <AlertOctagon className="h-4 w-4 text-destructive shrink-0" /> : <AlertTriangle className="h-4 w-4 text-orange-500 shrink-0" />}
                  <div className="flex-1 text-sm">
                    <span className="font-medium">{a.name}</span>
                    {" — "}
                    <span className="text-muted-foreground">
                      {a.type === "id" ? (language === "ar" ? "الهوية" : "ID") : (language === "ar" ? "العقد" : "Contract")}
                    </span>
                    {" — "}
                    <span className={a.expired ? "text-destructive font-semibold" : "text-orange-600 font-semibold"}>
                      {a.expired ? (language === "ar" ? "منتهي" : "Expired") : (language === "ar" ? "ينتهي" : "Expires")} {a.date}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{t('dashboard.departmentDistribution')}</CardTitle>
          </CardHeader>
          <CardContent>
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <PieChart>
                  <Pie data={deptData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {deptData.map((_, index) => (
                      <Cell key={`cell-${index}`} fill={CHART_COLORS[index % CHART_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "لا توجد بيانات" : "No data"}</p>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
