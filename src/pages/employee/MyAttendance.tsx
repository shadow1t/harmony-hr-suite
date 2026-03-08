import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Clock, LogIn, LogOut } from "lucide-react";

export default function MyAttendance() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { companyId } = useCompany();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [todayRecord, setTodayRecord] = useState<any>(null);
  const [records, setRecords] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const today = new Date().toISOString().split("T")[0];
  const monthStart = `${today.slice(0, 7)}-01`;

  const fetchEmployee = async () => {
    if (!user || !companyId) return null;
    const { data } = await supabase
      .from("employees")
      .select("id")
      .eq("user_id", user.id)
      .eq("company_id", companyId)
      .single();
    return data?.id || null;
  };

  const fetchData = async () => {
    setLoading(true);
    const empId = await fetchEmployee();
    if (!empId) { setLoading(false); return; }
    setEmployeeId(empId);

    const [todayRes, monthRes] = await Promise.all([
      supabase.from("attendance").select("*").eq("employee_id", empId).eq("date", today).maybeSingle(),
      supabase.from("attendance").select("*").eq("employee_id", empId).gte("date", monthStart).lte("date", today).order("date", { ascending: false }),
    ]);

    setTodayRecord(todayRes.data);
    if (monthRes.data) setRecords(monthRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, companyId]);

  const handleCheckIn = async () => {
    if (!employeeId || !companyId) return;
    const now = new Date().toISOString();
    const { error } = await supabase.from("attendance").insert({
      employee_id: employeeId,
      company_id: companyId,
      date: today,
      check_in: now,
      status: "present",
    });
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم تسجيل الحضور" : "Checked in"); fetchData(); }
  };

  const handleCheckOut = async () => {
    if (!todayRecord) return;
    const now = new Date().toISOString();
    const { error } = await supabase.from("attendance").update({ check_out: now }).eq("id", todayRecord.id);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم تسجيل الانصراف" : "Checked out"); fetchData(); }
  };

  const hasCheckedIn = !!todayRecord?.check_in;
  const hasCheckedOut = !!todayRecord?.check_out;

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Clock className="h-6 w-6" />
        {language === "ar" ? "حضوري" : "My Attendance"}
      </h1>

      {!employeeId && !loading ? (
        <Card>
          <CardContent className="py-8 text-center text-muted-foreground">
            {language === "ar" ? "لم يتم ربط حسابك بسجل موظف." : "Account not linked to employee record."}
          </CardContent>
        </Card>
      ) : (
        <>
          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "تسجيل اليوم" : "Today's Check"}</CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col items-center gap-4 py-6">
              <p className="text-lg text-muted-foreground">{today}</p>
              {!hasCheckedIn ? (
                <Button size="lg" className="h-16 w-48 text-lg" onClick={handleCheckIn}>
                  <LogIn className="h-6 w-6 me-2" />
                  {language === "ar" ? "تسجيل حضور" : "Check In"}
                </Button>
              ) : !hasCheckedOut ? (
                <div className="text-center space-y-3">
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? "وقت الحضور:" : "Checked in at:"}{" "}
                    <span className="font-mono font-bold">{new Date(todayRecord.check_in).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}</span>
                  </p>
                  <Button size="lg" variant="destructive" className="h-16 w-48 text-lg" onClick={handleCheckOut}>
                    <LogOut className="h-6 w-6 me-2" />
                    {language === "ar" ? "تسجيل انصراف" : "Check Out"}
                  </Button>
                </div>
              ) : (
                <div className="text-center space-y-1">
                  <Badge variant="default" className="text-sm px-4 py-1">
                    {language === "ar" ? "✅ تم تسجيل الحضور والانصراف" : "✅ Attendance recorded"}
                  </Badge>
                  <p className="text-sm text-muted-foreground">
                    {new Date(todayRecord.check_in).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                    {" → "}
                    {new Date(todayRecord.check_out).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" })}
                  </p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{language === "ar" ? "سجل الشهر الحالي" : "This Month's Record"}</CardTitle>
            </CardHeader>
            <CardContent>
              {loading ? (
                <p className="text-center py-4 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
              ) : records.length === 0 ? (
                <p className="text-center py-4 text-muted-foreground">{language === "ar" ? "لا توجد سجلات" : "No records"}</p>
              ) : (
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "ar" ? "التاريخ" : "Date"}</TableHead>
                      <TableHead>{language === "ar" ? "الحضور" : "Check In"}</TableHead>
                      <TableHead>{language === "ar" ? "الانصراف" : "Check Out"}</TableHead>
                      <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {records.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.date}</TableCell>
                        <TableCell>{r.check_in ? new Date(r.check_in).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : "-"}</TableCell>
                        <TableCell>{r.check_out ? new Date(r.check_out).toLocaleTimeString("en", { hour: "2-digit", minute: "2-digit" }) : "-"}</TableCell>
                        <TableCell><Badge variant={r.status === "present" ? "default" : "secondary"}>{r.status}</Badge></TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
