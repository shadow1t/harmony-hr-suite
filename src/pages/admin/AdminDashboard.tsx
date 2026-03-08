import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, Users, CheckCircle, XCircle } from "lucide-react";
import { PieChart, Pie, Cell, ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip } from "recharts";

const COLORS = ["hsl(215, 80%, 48%)", "hsl(170, 60%, 42%)", "hsl(38, 92%, 50%)"];

export default function AdminDashboard() {
  const { language } = useLanguage();
  const [stats, setStats] = useState({ total: 0, active: 0, suspended: 0, totalEmployees: 0 });
  const [planData, setPlanData] = useState<{ name: string; value: number }[]>([]);

  useEffect(() => {
    const fetch = async () => {
      const { data: companies } = await supabase.from("companies").select("id, status, subscription_plan");
      const { count: empCount } = await supabase.from("employees").select("id", { count: "exact", head: true });

      if (companies) {
        const active = companies.filter(c => c.status === "active").length;
        setStats({
          total: companies.length,
          active,
          suspended: companies.length - active,
          totalEmployees: empCount || 0,
        });

        const plans: Record<string, number> = {};
        companies.forEach(c => {
          plans[c.subscription_plan] = (plans[c.subscription_plan] || 0) + 1;
        });
        setPlanData(Object.entries(plans).map(([name, value]) => ({ name, value })));
      }
    };
    fetch();
  }, []);

  const statCards = [
    { title: language === "ar" ? "إجمالي الشركات" : "Total Companies", value: stats.total, icon: Building2 },
    { title: language === "ar" ? "إجمالي الموظفين" : "Total Employees", value: stats.totalEmployees, icon: Users },
    { title: language === "ar" ? "شركات نشطة" : "Active", value: stats.active, icon: CheckCircle },
    { title: language === "ar" ? "شركات موقوفة" : "Suspended", value: stats.suspended, icon: XCircle },
  ];

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold">{language === "ar" ? "لوحة تحكم المنصة" : "Platform Dashboard"}</h1>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map((s) => (
          <Card key={s.title}>
            <CardContent className="p-6">
              <div className="flex items-center justify-between">
                <div className="space-y-1">
                  <p className="text-sm text-muted-foreground">{s.title}</p>
                  <p className="text-2xl font-bold">{s.value}</p>
                </div>
                <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/10">
                  <s.icon className="h-6 w-6 text-primary" />
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{language === "ar" ? "توزيع الباقات" : "Plan Distribution"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <PieChart>
                <Pie data={planData} cx="50%" cy="50%" outerRadius={100} dataKey="value" label={({ name, value }) => `${name}: ${value}`}>
                  {planData.map((_, i) => (
                    <Cell key={i} fill={COLORS[i % COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="text-lg">{language === "ar" ? "الشركات حسب الحالة" : "Companies by Status"}</CardTitle>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={[
                { name: language === "ar" ? "نشطة" : "Active", value: stats.active },
                { name: language === "ar" ? "موقوفة" : "Suspended", value: stats.suspended },
              ]}>
                <CartesianGrid strokeDasharray="3 3" className="opacity-30" />
                <XAxis dataKey="name" />
                <YAxis />
                <Tooltip />
                <Bar dataKey="value" fill="hsl(215, 80%, 48%)" radius={[6, 6, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
