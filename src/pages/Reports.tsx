import { useState, useEffect, useRef } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Users, Clock, CalendarDays, Wallet, Building2, FileDown, Printer } from "lucide-react";
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, PieChart, Pie, Cell } from "recharts";

const COLORS = ["hsl(215, 80%, 48%)", "hsl(170, 60%, 42%)", "hsl(38, 92%, 50%)", "hsl(280, 60%, 55%)", "hsl(0, 72%, 51%)"];

const MONTHS_AR = ["يناير", "فبراير", "مارس", "أبريل", "مايو", "يونيو", "يوليو", "أغسطس", "سبتمبر", "أكتوبر", "نوفمبر", "ديسمبر"];
const MONTHS_EN = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"];

export default function Reports() {
  const { language } = useLanguage();
  const { company, companyId } = useCompany();
  const [stats, setStats] = useState({ employees: 0, departments: 0, activeLeaves: 0, totalPayroll: 0 });
  const [deptData, setDeptData] = useState<any[]>([]);
  const [statusData, setStatusData] = useState<any[]>([]);

  // Attendance report state
  const currentDate = new Date();
  const [attMonth, setAttMonth] = useState(String(currentDate.getMonth() + 1));
  const [attYear, setAttYear] = useState(String(currentDate.getFullYear()));
  const [attData, setAttData] = useState<any[]>([]);
  const [attLoading, setAttLoading] = useState(false);

  // Payroll report state
  const [payMonth, setPayMonth] = useState(String(currentDate.getMonth() + 1));
  const [payYear, setPayYear] = useState(String(currentDate.getFullYear()));
  const [payData, setPayData] = useState<any[]>([]);
  const [payLoading, setPayLoading] = useState(false);

  const printRef = useRef<HTMLDivElement>(null);

  // Overview data
  useEffect(() => {
    const fetchOverview = async () => {
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

      const deptMap: Record<string, number> = {};
      emps.forEach((e: any) => {
        const name = e.departments ? (language === "ar" ? e.departments.name_ar : e.departments.name_en) : (language === "ar" ? "غير محدد" : "Unassigned");
        deptMap[name] = (deptMap[name] || 0) + 1;
      });
      setDeptData(Object.entries(deptMap).map(([name, value]) => ({ name, value })));

      const statusMap: Record<string, number> = {};
      emps.forEach((e: any) => { statusMap[e.status] = (statusMap[e.status] || 0) + 1; });
      const statusLabels: Record<string, string> = language === "ar"
        ? { active: "نشط", on_leave: "في إجازة", terminated: "منتهي" }
        : { active: "Active", on_leave: "On Leave", terminated: "Terminated" };
      setStatusData(Object.entries(statusMap).map(([key, value]) => ({ name: statusLabels[key] || key, value })));
    };
    fetchOverview();
  }, [language]);

  // Attendance report
  useEffect(() => {
    const fetchAttendance = async () => {
      setAttLoading(true);
      const m = Number(attMonth);
      const y = Number(attYear);
      const startDate = `${y}-${String(m).padStart(2, "0")}-01`;
      const endDate = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;

      const [empRes, attRes] = await Promise.all([
        supabase.from("employees").select("id, first_name_ar, last_name_ar, first_name_en, last_name_en, employee_number").eq("status", "active"),
        supabase.from("attendance").select("*").gte("date", startDate).lt("date", endDate),
      ]);

      const emps = empRes.data || [];
      const records = attRes.data || [];

      const summary = emps.map((emp) => {
        const empRecords = records.filter((r) => r.employee_id === emp.id);
        const present = empRecords.filter((r) => r.status === "present").length;
        const absent = empRecords.filter((r) => r.status === "absent").length;
        const late = empRecords.filter((r) => r.status === "late").length;
        return {
          id: emp.id,
          name: language === "ar" ? `${emp.first_name_ar} ${emp.last_name_ar}` : `${emp.first_name_en || emp.first_name_ar} ${emp.last_name_en || emp.last_name_ar}`,
          number: emp.employee_number,
          present,
          absent,
          late,
          total: empRecords.length,
        };
      });

      setAttData(summary);
      setAttLoading(false);
    };
    fetchAttendance();
  }, [attMonth, attYear, language]);

  // Payroll report
  useEffect(() => {
    const fetchPayroll = async () => {
      setPayLoading(true);
      const { data } = await supabase
        .from("payroll")
        .select("*, employees(first_name_ar, last_name_ar, first_name_en, last_name_en, employee_number)")
        .eq("month", Number(payMonth))
        .eq("year", Number(payYear))
        .order("created_at");

      setPayData((data || []).map((p: any) => ({
        ...p,
        empName: p.employees
          ? (language === "ar" ? `${p.employees.first_name_ar} ${p.employees.last_name_ar}` : `${p.employees.first_name_en || p.employees.first_name_ar} ${p.employees.last_name_en || p.employees.last_name_ar}`)
          : "-",
        empNumber: p.employees?.employee_number || "-",
      })));
      setPayLoading(false);
    };
    fetchPayroll();
  }, [payMonth, payYear, language]);

  const currency = company?.currency || "SAR";
  const months = language === "ar" ? MONTHS_AR : MONTHS_EN;
  const years = Array.from({ length: 5 }, (_, i) => String(currentDate.getFullYear() - i));

  const handlePrintReport = (type: "attendance" | "payroll") => {
    const companyName = language === "ar" ? company?.name_ar : company?.name_en;
    const isAr = language === "ar";
    const dir = isAr ? "rtl" : "ltr";
    const align = isAr ? "right" : "left";

    let title = "";
    let tableHtml = "";

    if (type === "attendance") {
      title = isAr ? `تقرير الحضور — ${months[Number(attMonth) - 1]} ${attYear}` : `Attendance Report — ${months[Number(attMonth) - 1]} ${attYear}`;
      tableHtml = `
        <table>
          <thead><tr>
            <th>${isAr ? "الرقم" : "#"}</th>
            <th>${isAr ? "الموظف" : "Employee"}</th>
            <th>${isAr ? "حضور" : "Present"}</th>
            <th>${isAr ? "غياب" : "Absent"}</th>
            <th>${isAr ? "تأخير" : "Late"}</th>
            <th>${isAr ? "الإجمالي" : "Total"}</th>
          </tr></thead>
          <tbody>
            ${attData.map((r, i) => `<tr><td>${i + 1}</td><td>${r.name}</td><td>${r.present}</td><td>${r.absent}</td><td>${r.late}</td><td>${r.total}</td></tr>`).join("")}
          </tbody>
        </table>
        <p style="margin-top:16px;font-weight:bold;">${isAr ? "إجمالي الموظفين:" : "Total Employees:"} ${attData.length}</p>
      `;
    } else {
      title = isAr ? `تقرير الرواتب — ${months[Number(payMonth) - 1]} ${payYear}` : `Payroll Report — ${months[Number(payMonth) - 1]} ${payYear}`;
      const totalNet = payData.reduce((s, p) => s + (Number(p.net_salary) || 0), 0);
      const totalBasic = payData.reduce((s, p) => s + (Number(p.basic_salary) || 0), 0);
      tableHtml = `
        <table>
          <thead><tr>
            <th>${isAr ? "الرقم" : "#"}</th>
            <th>${isAr ? "الموظف" : "Employee"}</th>
            <th>${isAr ? "الأساسي" : "Basic"}</th>
            <th>${isAr ? "البدلات" : "Allowances"}</th>
            <th>${isAr ? "الخصومات" : "Deductions"}</th>
            <th>${isAr ? "الصافي" : "Net"}</th>
            <th>${isAr ? "الحالة" : "Status"}</th>
          </tr></thead>
          <tbody>
            ${payData.map((p, i) => {
              const allowances = (Number(p.housing_allowance) || 0) + (Number(p.transport_allowance) || 0) + (Number(p.other_allowances) || 0);
              const deductions = (Number(p.social_insurance) || 0) + (Number(p.deductions) || 0);
              const statusLabel = p.status === "paid" ? (isAr ? "مدفوع" : "Paid") : p.status === "draft" ? (isAr ? "مسودة" : "Draft") : p.status;
              return `<tr><td>${i + 1}</td><td>${p.empName}</td><td>${(Number(p.basic_salary) || 0).toLocaleString()}</td><td>${allowances.toLocaleString()}</td><td style="color:red">${deductions.toLocaleString()}</td><td style="font-weight:bold">${(Number(p.net_salary) || 0).toLocaleString()}</td><td>${statusLabel}</td></tr>`;
            }).join("")}
          </tbody>
          <tfoot>
            <tr style="font-weight:bold;background:#e8f5e9">
              <td colspan="2">${isAr ? "الإجمالي" : "Total"}</td>
              <td>${totalBasic.toLocaleString()}</td>
              <td>-</td><td>-</td>
              <td>${totalNet.toLocaleString()} ${currency}</td>
              <td></td>
            </tr>
          </tfoot>
        </table>
      `;
    }

    const win = window.open("", "_blank");
    if (!win) return;
    win.document.write(`
      <html dir="${dir}">
      <head><title>${title}</title>
      <style>
        body { font-family: Arial, sans-serif; padding: 40px; max-width: 900px; margin: 0 auto; direction: ${dir}; }
        .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
        .header img { max-height: 60px; margin-bottom: 10px; }
        .header h1 { margin: 5px 0; font-size: 20px; }
        .header p { margin: 2px 0; color: #666; font-size: 14px; }
        table { width: 100%; border-collapse: collapse; margin: 20px 0; }
        th, td { padding: 8px 12px; border: 1px solid #ddd; text-align: ${align}; font-size: 13px; }
        th { background: #f5f5f5; font-weight: bold; }
        tfoot td { background: #e8f5e9; }
        @media print { body { padding: 20px; } }
      </style>
      </head>
      <body>
        <div class="header">
          ${company?.logo_url ? `<img src="${company.logo_url}" alt="Logo" />` : ""}
          <h1>${companyName || ""}</h1>
          <p>${title}</p>
          <p>${isAr ? "تاريخ الطباعة:" : "Print Date:"} ${new Date().toLocaleDateString(isAr ? "ar-SA" : "en-US")}</p>
        </div>
        ${tableHtml}
      </body>
      </html>
    `);
    win.document.close();
    win.print();
  };

  const statusLabelsPayroll: Record<string, string> = language === "ar"
    ? { draft: "مسودة", processing: "معالجة", completed: "مكتمل", paid: "مدفوع" }
    : { draft: "Draft", processing: "Processing", completed: "Completed", paid: "Paid" };

  const MonthYearFilter = ({ month, setMonth, year, setYear }: { month: string; setMonth: (v: string) => void; year: string; setYear: (v: string) => void }) => (
    <div className="flex items-center gap-2 flex-wrap">
      <Select value={month} onValueChange={setMonth}>
        <SelectTrigger className="w-[140px]"><SelectValue /></SelectTrigger>
        <SelectContent>{months.map((m, i) => <SelectItem key={i} value={String(i + 1)}>{m}</SelectItem>)}</SelectContent>
      </Select>
      <Select value={year} onValueChange={setYear}>
        <SelectTrigger className="w-[100px]"><SelectValue /></SelectTrigger>
        <SelectContent>{years.map((y) => <SelectItem key={y} value={y}>{y}</SelectItem>)}</SelectContent>
      </Select>
    </div>
  );

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold">{language === "ar" ? "التقارير" : "Reports"}</h1>

      <Tabs defaultValue="overview" className="space-y-4">
        <TabsList className="flex-wrap h-auto gap-1">
          <TabsTrigger value="overview">{language === "ar" ? "نظرة عامة" : "Overview"}</TabsTrigger>
          <TabsTrigger value="attendance">{language === "ar" ? "تقرير الحضور" : "Attendance Report"}</TabsTrigger>
          <TabsTrigger value="payroll">{language === "ar" ? "تقرير الرواتب" : "Payroll Report"}</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-6">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <Card><CardContent className="p-3 sm:p-6 flex items-center gap-3"><Users className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" /><div className="min-w-0"><p className="text-xs sm:text-sm text-muted-foreground truncate">{language === "ar" ? "الموظفون" : "Employees"}</p><p className="text-lg sm:text-2xl font-bold">{stats.employees}</p></div></CardContent></Card>
            <Card><CardContent className="p-3 sm:p-6 flex items-center gap-3"><Building2 className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" /><div className="min-w-0"><p className="text-xs sm:text-sm text-muted-foreground truncate">{language === "ar" ? "الأقسام" : "Departments"}</p><p className="text-lg sm:text-2xl font-bold">{stats.departments}</p></div></CardContent></Card>
            <Card><CardContent className="p-3 sm:p-6 flex items-center gap-3"><CalendarDays className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" /><div className="min-w-0"><p className="text-xs sm:text-sm text-muted-foreground truncate">{language === "ar" ? "إجازات مقبولة" : "Approved Leaves"}</p><p className="text-lg sm:text-2xl font-bold">{stats.activeLeaves}</p></div></CardContent></Card>
            <Card><CardContent className="p-3 sm:p-6 flex items-center gap-3"><Wallet className="h-6 w-6 sm:h-8 sm:w-8 text-primary shrink-0" /><div className="min-w-0"><p className="text-xs sm:text-sm text-muted-foreground truncate">{language === "ar" ? "إجمالي الرواتب" : "Total Payroll"}</p><p className="text-lg sm:text-2xl font-bold">{stats.totalPayroll.toLocaleString()}</p></div></CardContent></Card>
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
        </TabsContent>

        {/* Attendance Report Tab */}
        <TabsContent value="attendance" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Clock className="h-5 w-5" />
                  {language === "ar" ? "تقرير الحضور الشهري" : "Monthly Attendance Report"}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <MonthYearFilter month={attMonth} setMonth={setAttMonth} year={attYear} setYear={setAttYear} />
                  <Button variant="outline" size="sm" onClick={() => handlePrintReport("attendance")}>
                    <Printer className="h-4 w-4 me-1" />
                    {language === "ar" ? "طباعة PDF" : "Print PDF"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {attLoading ? (
                <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
              ) : attData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "لا توجد بيانات" : "No data"}</p>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="rounded-lg border bg-card p-3 text-center">
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي الموظفين" : "Total Employees"}</p>
                      <p className="text-xl font-bold">{attData.length}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3 text-center">
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي الحضور" : "Total Present"}</p>
                      <p className="text-xl font-bold text-green-600">{attData.reduce((s, r) => s + r.present, 0)}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3 text-center">
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي الغياب" : "Total Absent"}</p>
                      <p className="text-xl font-bold text-destructive">{attData.reduce((s, r) => s + r.absent, 0)}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3 text-center">
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي التأخير" : "Total Late"}</p>
                      <p className="text-xl font-bold text-yellow-600">{attData.reduce((s, r) => s + r.late, 0)}</p>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>{language === "ar" ? "الموظف" : "Employee"}</TableHead>
                        <TableHead>{language === "ar" ? "الرقم الوظيفي" : "Emp #"}</TableHead>
                        <TableHead className="text-center">{language === "ar" ? "حضور" : "Present"}</TableHead>
                        <TableHead className="text-center">{language === "ar" ? "غياب" : "Absent"}</TableHead>
                        <TableHead className="text-center">{language === "ar" ? "تأخير" : "Late"}</TableHead>
                        <TableHead className="text-center">{language === "ar" ? "الإجمالي" : "Total"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {attData.map((r, i) => (
                        <TableRow key={r.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-medium">{r.name}</TableCell>
                          <TableCell>{r.number}</TableCell>
                          <TableCell className="text-center"><Badge variant="default">{r.present}</Badge></TableCell>
                          <TableCell className="text-center"><Badge variant="destructive">{r.absent}</Badge></TableCell>
                          <TableCell className="text-center"><Badge variant="secondary">{r.late}</Badge></TableCell>
                          <TableCell className="text-center font-bold">{r.total}</TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Payroll Report Tab */}
        <TabsContent value="payroll" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="h-5 w-5" />
                  {language === "ar" ? "تقرير الرواتب" : "Payroll Report"}
                </CardTitle>
                <div className="flex items-center gap-2 flex-wrap">
                  <MonthYearFilter month={payMonth} setMonth={setPayMonth} year={payYear} setYear={setPayYear} />
                  <Button variant="outline" size="sm" onClick={() => handlePrintReport("payroll")}>
                    <Printer className="h-4 w-4 me-1" />
                    {language === "ar" ? "طباعة PDF" : "Print PDF"}
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent>
              {payLoading ? (
                <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
              ) : payData.length === 0 ? (
                <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "لا توجد بيانات رواتب لهذا الشهر" : "No payroll data for this month"}</p>
              ) : (
                <>
                  {/* Summary cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                    <div className="rounded-lg border bg-card p-3 text-center">
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "عدد الموظفين" : "Employees"}</p>
                      <p className="text-xl font-bold">{payData.length}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3 text-center">
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي الأساسي" : "Total Basic"}</p>
                      <p className="text-xl font-bold">{payData.reduce((s, p) => s + (Number(p.basic_salary) || 0), 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3 text-center">
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "إجمالي الخصومات" : "Total Deductions"}</p>
                      <p className="text-xl font-bold text-destructive">{payData.reduce((s, p) => s + (Number(p.social_insurance) || 0) + (Number(p.deductions) || 0), 0).toLocaleString()}</p>
                    </div>
                    <div className="rounded-lg border bg-card p-3 text-center">
                      <p className="text-xs text-muted-foreground">{language === "ar" ? "صافي الرواتب" : "Net Payroll"}</p>
                      <p className="text-xl font-bold text-green-600">{payData.reduce((s, p) => s + (Number(p.net_salary) || 0), 0).toLocaleString()} {currency}</p>
                    </div>
                  </div>

                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>#</TableHead>
                        <TableHead>{language === "ar" ? "الموظف" : "Employee"}</TableHead>
                        <TableHead>{language === "ar" ? "الأساسي" : "Basic"}</TableHead>
                        <TableHead>{language === "ar" ? "السكن" : "Housing"}</TableHead>
                        <TableHead>{language === "ar" ? "النقل" : "Transport"}</TableHead>
                        <TableHead>{language === "ar" ? "بدلات أخرى" : "Other"}</TableHead>
                        <TableHead>{language === "ar" ? "تأمينات" : "Insurance"}</TableHead>
                        <TableHead>{language === "ar" ? "خصومات" : "Deductions"}</TableHead>
                        <TableHead>{language === "ar" ? "الصافي" : "Net"}</TableHead>
                        <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {payData.map((p, i) => (
                        <TableRow key={p.id}>
                          <TableCell>{i + 1}</TableCell>
                          <TableCell className="font-medium">{p.empName}</TableCell>
                          <TableCell>{(Number(p.basic_salary) || 0).toLocaleString()}</TableCell>
                          <TableCell>{(Number(p.housing_allowance) || 0).toLocaleString()}</TableCell>
                          <TableCell>{(Number(p.transport_allowance) || 0).toLocaleString()}</TableCell>
                          <TableCell>{(Number(p.other_allowances) || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-destructive">{(Number(p.social_insurance) || 0).toLocaleString()}</TableCell>
                          <TableCell className="text-destructive">{(Number(p.deductions) || 0).toLocaleString()}</TableCell>
                          <TableCell className="font-bold">{(Number(p.net_salary) || 0).toLocaleString()} {currency}</TableCell>
                          <TableCell>
                            <Badge variant={p.status === "paid" ? "default" : "secondary"}>
                              {statusLabelsPayroll[p.status] || p.status}
                            </Badge>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
