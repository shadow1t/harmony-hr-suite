import React, { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Users, Clock, CalendarDays, Wallet, UserPlus, TrendingUp, AlertTriangle, AlertOctagon, Plus, ArrowRight } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell, LineChart, Line } from "recharts";
import { Badge } from "@/components/ui/badge";
import { DashboardSkeleton } from "@/components/ui/page-skeleton";
import { EmptyState } from "@/components/ui/empty-state";
import { useNavigate } from "react-router-dom";

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
  trendUp?: boolean;
}

const StatCard = ({ title, value, icon: Icon, trend, trendUp }: StatCardProps) => (
  <Card className="hover:shadow-md transition-shadow duration-200">
    <CardContent className="p-3 sm:p-6">
      <div className="flex items-center justify-between gap-2">
        <div className="space-y-1 min-w-0">
          <p className="text-xs sm:text-sm text-muted-foreground truncate">{title}</p>
          <p className="text-lg sm:text-2xl font-bold">{value}</p>
          {trend && (
            <p className={`text-xs font-medium ${trendUp ? "text-green-600" : "text-destructive"}`}>
              {trend}
            </p>
          )}
        </div>
        <div className="flex h-9 w-9 sm:h-12 sm:w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
          <Icon className="h-4 w-4 sm:h-6 sm:w-6 text-primary" />
        </div>
      </div>
    </CardContent>
  </Card>
);

interface ExpiryAlert {
  name: string;
  type: "id" | "contract";
  date: string;
  expired: boolean;
}

export default function Dashboard() {
  const { t, language } = useLanguage();
  const { companyId } = useCompany();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({ employees: 0, present: 0, onLeave: 0, pending: 0 });
  const [alerts, setAlerts] = useState<ExpiryAlert[]>([]);
  const [deptData, setDeptData] = useState<{ name: string; value: number }[]>([]);
  const [weeklyData, setWeeklyData] = useState<any[]>([]);

  useEffect(() => {
    if (!companyId) return;

    const fetchDashboard = async () => {
      setLoading(true);
      const today = new Date().toISOString().split("T")[0];
      const future30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

      // Get last 7 days for weekly chart
      const last7Days = Array.from({ length: 7 }, (_, i) => {
        const d = new Date();
        d.setDate(d.getDate() - (6 - i));
        return d.toISOString().split("T")[0];
      });

      const [empRes, attRes, leaveRes, pendingRes, deptRes, weekAttRes] = await Promise.all([
        supabase.from("employees").select("id, first_name_ar, last_name_ar, first_name_en, last_name_en, id_expiry_date, contract_expiry_date, department_id, status").eq("status", "active"),
        supabase.from("attendance").select("id").eq("date", today),
        supabase.from("leave_requests").select("id").eq("status", "approved").lte("start_date", today).gte("end_date", today),
        supabase.from("leave_requests").select("id").eq("status", "pending"),
        supabase.from("departments").select("id, name_ar, name_en"),
        supabase.from("attendance").select("date, status").gte("date", last7Days[0]).lte("date", last7Days[6]),
      ]);

      const emps = empRes.data || [];
      setStats({
        employees: emps.length,
        present: attRes.data?.length || 0,
        onLeave: leaveRes.data?.length || 0,
        pending: pendingRes.data?.length || 0,
      });

      // Weekly attendance chart
      const weekAtt = weekAttRes.data || [];
      const dayNames = language === "ar" 
        ? ["أحد", "إثن", "ثلا", "أرب", "خمي", "جمع", "سبت"]
        : ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
      setWeeklyData(last7Days.map(date => {
        const dayRecords = weekAtt.filter(a => a.date === date);
        const dayOfWeek = new Date(date).getDay();
        return {
          day: dayNames[dayOfWeek],
          present: dayRecords.filter(a => a.status === "present").length,
          absent: dayRecords.filter(a => a.status === "absent").length,
          late: dayRecords.filter(a => a.status === "late").length,
        };
      }));

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
      setLoading(false);
    };

    fetchDashboard();
  }, [companyId, language]);

  if (loading) return <DashboardSkeleton />;

  const statCards: StatCardProps[] = [
    { title: t('dashboard.totalEmployees'), value: stats.employees, icon: Users },
    { title: t('dashboard.presentToday'), value: stats.present, icon: Clock },
    { title: t('dashboard.onLeave'), value: stats.onLeave, icon: CalendarDays },
    { title: t('dashboard.pendingRequests'), value: stats.pending, icon: TrendingUp },
  ];

  const quickActions = [
    { label: language === "ar" ? "تسجيل حضور" : "Record Attendance", icon: Clock, path: "/attendance" },
    { label: language === "ar" ? "طلب إجازة" : "Request Leave", icon: CalendarDays, path: "/leaves" },
    { label: language === "ar" ? "إضافة موظف" : "Add Employee", icon: UserPlus, path: "/employees" },
    { label: language === "ar" ? "عرض التقارير" : "View Reports", icon: TrendingUp, path: "/reports" },
  ];

  return (
    <div className="space-y-4 sm:space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl sm:text-2xl font-bold">{t('dashboard.title')}</h1>
          <p className="text-sm text-muted-foreground">{t('dashboard.welcome')}</p>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
        {quickActions.map((action) => (
          <Button
            key={action.path}
            variant="outline"
            className="h-auto py-3 flex flex-col items-center gap-2 hover:bg-primary/5 hover:border-primary/30 transition-all duration-200"
            onClick={() => navigate(action.path)}
          >
            <action.icon className="h-5 w-5 text-primary" />
            <span className="text-xs font-medium">{action.label}</span>
          </Button>
        ))}
      </div>

      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
        {statCards.map((stat, i) => (
          <div key={stat.title} className="animate-fade-in" style={{ animationDelay: `${i * 100}ms` }}>
            <StatCard {...stat} />
          </div>
        ))}
      </div>

      {/* Expiry Alerts */}
      {alerts.length > 0 && (
        <Card className="border-orange-300 dark:border-orange-700 animate-fade-in">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-orange-600">
              <AlertTriangle className="h-5 w-5" />
              {language === "ar" ? "تنبيهات هامة" : "Critical Alerts"}
              <Badge variant="destructive" className="ms-2">{alerts.length}</Badge>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-2 max-h-48 overflow-y-auto">
              {alerts.map((a, i) => (
                <div key={i} className={`flex items-center gap-3 p-3 rounded-lg transition-colors ${a.expired ? "bg-destructive/10 border border-destructive/20" : "bg-orange-50 dark:bg-orange-950/20 border border-orange-200 dark:border-orange-800"}`}>
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
        {/* Weekly Attendance Trend */}
        <Card className="animate-fade-in">
          <CardHeader>
            <CardTitle className="text-lg">{language === "ar" ? "حضور الأسبوع" : "Weekly Attendance"}</CardTitle>
          </CardHeader>
          <CardContent>
            {weeklyData.length > 0 ? (
              <ResponsiveContainer width="100%" height={280}>
                <BarChart data={weeklyData}>
                  <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                  <XAxis dataKey="day" fontSize={12} />
                  <YAxis fontSize={12} />
                  <Tooltip />
                  <Bar dataKey="present" fill="hsl(152, 60%, 40%)" name={language === "ar" ? "حاضر" : "Present"} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="late" fill="hsl(38, 92%, 50%)" name={language === "ar" ? "متأخر" : "Late"} radius={[4, 4, 0, 0]} />
                  <Bar dataKey="absent" fill="hsl(0, 72%, 51%)" name={language === "ar" ? "غائب" : "Absent"} radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <EmptyState icon={Clock} title={language === "ar" ? "لا توجد بيانات حضور" : "No attendance data"} />
            )}
          </CardContent>
        </Card>

        {/* Department Distribution */}
        <Card className="animate-fade-in">
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
              <EmptyState icon={Users} title={language === "ar" ? "لا توجد بيانات" : "No data"} />
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
