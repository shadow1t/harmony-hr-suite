import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Users, Clock, CalendarDays, Wallet, Building2, TrendingUp } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(215, 80%, 48%)", "hsl(170, 60%, 42%)", "hsl(38, 92%, 50%)", "hsl(280, 60%, 55%)", "hsl(0, 72%, 51%)"];

export default function Reports() {
  const { language } = useLanguage();
  const [stats, setStats] = useState({ employees: 0, departments: 0, activeLeaves: 0, totalPayroll: 0 });
  const [deptData, setDeptData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const [empRes, deptRes, leaveRes, payRes] = await Promise.all([
        supabase.from("employees").select("id, status, department_id, departments(name_ar, name_en)"),
        supabase.from("departments").select("id"),
        supabase.from("leave_requests").select("id").eq("status", "approved"),
        supabase.from("payroll").select("net_salary"),
      ]);

      const emps = empRes.data || [];
      setStats({
        employees: emps.length,
        departments: deptRes.data?.length || 0,
        activeLeaves: leaveRes.data?.length || 0,
        totalPayroll: (payRes.data || []).reduce((s, p) => s + (Number(p.net_salary) || 0), 0),
      });

      // Department distribution
      const deptMap: Record<string, number> = {};
      emps.forEach((e: any) => {
        const name = e.departments ? (language === "ar" ? e.departments.name_ar : e.departments.name_en) : (language === "ar" ? "غير محدد" : "Unassigned");
        deptMap[name] = (deptMap[name] || 0) + 1;
      });
      setDeptData(Object.entries(deptMap).map(([name, value]) => ({ name, value })));

      // Status distribution
      const statusMap: Record<string, number> = {};
      emps.forEach((e: any) => { statusMap[e.status] = (statusMap[e.status] || 0) + 1; });
      const statusLabels: Record<string, string> = language === "ar" ? { active: "نشط", on_leave: "في إجازة", terminated: "منتهي" } : { active: "Active", on_leave: "On Leave", terminated: "Terminated" };
      setStatusData(Object.entries(statusMap).map(([key, value]) => ({ name: statusLabels[key] || key, value })));
    };
    fetch();
  }, [language]);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{language === "ar" ? "التقارير" : "Reports"}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card><CardContent className="p-6 flex items-center gap-3"><Users className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">{language === "ar" ? "الموظفون" : "Employees"}</p><p className="text-2xl font-bold">{stats.employees}</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-3"><Building2 className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">{language === "ar" ? "الأقسام" : "Departments"}</p><p className="text-2xl font-bold">{stats.departments}</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-3"><CalendarDays className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">{language === "ar" ? "إجازات مقبولة" : "Approved Leaves"}</p><p className="text-2xl font-bold">{stats.activeLeaves}</p></div></CardContent></Card>
        <Card><CardContent className="p-6 flex items-center gap-3"><Wallet className="h-8 w-8 text-primary" /><div><p className="text-sm text-muted-foreground">{language === "ar" ? "إجمالي الرواتب" : "Total Payroll"}</p><p className="text-2xl font-bold">{stats.totalPayroll.toLocaleString()}</p></div></CardContent></Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader><CardTitle>{language === "ar" ? "توزيع الأقسام" : "Department Distribution"}</CardTitle></CardHeader>
          <CardContent>
            {deptData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={deptData}><CartesianGrid strokeDasharray="3 3" className="opacity-30" /><XAxis dataKey="name" /><YAxis /><Tooltip /><Bar dataKey="value" fill="hsl(215, 80%, 48%)" radius={[6, 6, 0, 0]} /></BarChart>
              </ResponsiveContainer>
            ) : <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "لا توجد بيانات" : "No data"}</p>}
          </CardContent>
        </Card>

        <Card>
          <CardHeader><CardTitle>{language === "ar" ? "حالة الموظفين" : "Employee Status"}</CardTitle></CardHeader>
          <CardContent>
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie data={statusData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                    {statusData.map((_, i) => <Cell key={i} fill={COLORS[i % COLORS.length]} />)}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "لا توجد بيانات" : "No data"}</p>}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
