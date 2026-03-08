import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { toast } from "sonner";
import { CalendarDays, Plus } from "lucide-react";

const leaveTypes = [
  { value: "annual", ar: "سنوية", en: "Annual" },
  { value: "sick", ar: "مرضية", en: "Sick" },
  { value: "emergency", ar: "طوارئ", en: "Emergency" },
  { value: "unpaid", ar: "بدون راتب", en: "Unpaid" },
];

export default function MyLeaves() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { companyId } = useCompany();
  const [employeeId, setEmployeeId] = useState<string | null>(null);
  const [requests, setRequests] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [form, setForm] = useState({ leave_type: "annual", start_date: "", end_date: "", reason: "" });

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

    const { data } = await supabase
      .from("leave_requests")
      .select("*")
      .eq("employee_id", empId)
      .order("created_at", { ascending: false });

    if (data) setRequests(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, [user, companyId]);

  const calcDays = (s: string, e: string) => {
    if (!s || !e) return 0;
    return Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1;
  };

  const handleSubmit = async () => {
    if (!employeeId || !companyId || !form.start_date || !form.end_date) {
      toast.error(language === "ar" ? "يرجى تعبئة جميع الحقول" : "Please fill all fields");
      return;
    }
    const days = calcDays(form.start_date, form.end_date);
    const { error } = await supabase.from("leave_requests").insert({
      employee_id: employeeId,
      company_id: companyId,
      leave_type: form.leave_type as "annual" | "sick" | "emergency" | "unpaid" | "maternity" | "paternity",
      start_date: form.start_date,
      end_date: form.end_date,
      days_count: days,
      reason: form.reason || null,
    });
    if (error) toast.error(error.message);
    else {
      toast.success(language === "ar" ? "تم تقديم الطلب بنجاح" : "Request submitted");
      setDialogOpen(false);
      setForm({ leave_type: "annual", start_date: "", end_date: "", reason: "" });
      fetchData();
    }
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { ar: string; en: string; v: "default" | "secondary" | "destructive" | "outline" }> = {
      pending: { ar: "معلق", en: "Pending", v: "secondary" },
      approved: { ar: "مقبول", en: "Approved", v: "default" },
      rejected: { ar: "مرفوض", en: "Rejected", v: "destructive" },
      cancelled: { ar: "ملغي", en: "Cancelled", v: "outline" },
    };
    const item = map[s] || { ar: s, en: s, v: "outline" as const };
    return <Badge variant={item.v}>{language === "ar" ? item.ar : item.en}</Badge>;
  };

  const typeLabel = (t: string) => {
    const found = leaveTypes.find((l) => l.value === t);
    return found ? (language === "ar" ? found.ar : found.en) : t;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <CalendarDays className="h-6 w-6" />
          {language === "ar" ? "إجازاتي" : "My Leaves"}
        </h1>
        {employeeId && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button><Plus className="h-4 w-4 me-2" />{language === "ar" ? "طلب إجازة" : "Request Leave"}</Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>{language === "ar" ? "طلب إجازة جديد" : "New Leave Request"}</DialogTitle>
              </DialogHeader>
              <div className="space-y-3">
                <div>
                  <Label>{language === "ar" ? "نوع الإجازة" : "Leave Type"}</Label>
                  <Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}>
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      {leaveTypes.map((t) => (
                        <SelectItem key={t.value} value={t.value}>
                          {language === "ar" ? t.ar : t.en}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <Label>{language === "ar" ? "من" : "From"}</Label>
                    <Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} />
                  </div>
                  <div>
                    <Label>{language === "ar" ? "إلى" : "To"}</Label>
                    <Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} />
                  </div>
                </div>
                {form.start_date && form.end_date && (
                  <p className="text-sm text-muted-foreground">
                    {language === "ar" ? "عدد الأيام:" : "Days:"} {calcDays(form.start_date, form.end_date)}
                  </p>
                )}
                <div>
                  <Label>{language === "ar" ? "السبب" : "Reason"}</Label>
                  <Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} />
                </div>
                <Button onClick={handleSubmit} className="w-full">
                  {language === "ar" ? "تقديم الطلب" : "Submit Request"}
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        )}
      </div>

      <Card>
        <CardContent className="pt-6">
          {loading ? (
            <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p>
          ) : !employeeId ? (
            <p className="text-center py-8 text-muted-foreground">
              {language === "ar" ? "لم يتم ربط حسابك بسجل موظف." : "Account not linked to employee record."}
            </p>
          ) : requests.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">
              {language === "ar" ? "لا توجد طلبات" : "No requests yet"}
            </p>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                  <TableHead>{language === "ar" ? "من" : "From"}</TableHead>
                  <TableHead>{language === "ar" ? "إلى" : "To"}</TableHead>
                  <TableHead>{language === "ar" ? "الأيام" : "Days"}</TableHead>
                  <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {requests.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell>{typeLabel(r.leave_type)}</TableCell>
                    <TableCell>{r.start_date}</TableCell>
                    <TableCell>{r.end_date}</TableCell>
                    <TableCell>{r.days_count}</TableCell>
                    <TableCell>{statusBadge(r.status)}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
