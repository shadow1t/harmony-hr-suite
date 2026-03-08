import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Plus, CalendarDays, Check, X, Pencil, Trash2 } from "lucide-react";
import { useAuth } from "@/hooks/useAuth";

const leaveTypes = ["annual", "sick", "emergency", "unpaid", "maternity", "paternity"];

export default function Leaves() {
  const { language } = useLanguage();
  const { user } = useAuth();
  const { companyId } = useCompany();
  const [requests, setRequests] = useState<any[]>([]);
  const [employees, setEmployees] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ employee_id: "", leave_type: "annual", start_date: "", end_date: "", reason: "" });

  const fetchData = async () => {
    setLoading(true);
    const [lRes, eRes] = await Promise.all([
      supabase.from("leave_requests").select("*, employees(first_name_ar, last_name_ar, first_name_en, last_name_en, employee_number)").order("created_at", { ascending: false }),
      supabase.from("employees").select("id, first_name_ar, last_name_ar, first_name_en, last_name_en, employee_number").eq("status", "active"),
    ]);
    if (lRes.data) setRequests(lRes.data);
    if (eRes.data) setEmployees(eRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const calcDays = (s: string, e: string) => (!s || !e) ? 0 : Math.ceil((new Date(e).getTime() - new Date(s).getTime()) / 86400000) + 1;

  const openAdd = () => { setEditingId(null); setForm({ employee_id: "", leave_type: "annual", start_date: "", end_date: "", reason: "" }); setDialogOpen(true); };

  const openEdit = (r: any) => {
    setEditingId(r.id);
    setForm({ employee_id: r.employee_id, leave_type: r.leave_type, start_date: r.start_date, end_date: r.end_date, reason: r.reason || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.employee_id || !form.start_date || !form.end_date) { toast.error(language === "ar" ? "يرجى تعبئة جميع الحقول" : "Fill all fields"); return; }
    const days = calcDays(form.start_date, form.end_date);

    if (editingId) {
      const { error } = await supabase.from("leave_requests").update({ ...form, days_count: days }).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success(language === "ar" ? "تم التحديث" : "Updated");
    } else {
      const { error } = await supabase.from("leave_requests").insert({ ...form, days_count: days, company_id: companyId });
      if (error) { toast.error(error.message); return; }
      toast.success(language === "ar" ? "تم تقديم الطلب" : "Request submitted");
    }
    setDialogOpen(false); setEditingId(null); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("leave_requests").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم الحذف" : "Deleted"); fetchData(); }
    setDeleteId(null);
  };

  const updateStatus = async (id: string, newStatus: "approved" | "rejected") => {
    const { error } = await supabase.from("leave_requests").update({ status: newStatus, approved_by: user?.id, approved_at: new Date().toISOString() }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم التحديث" : "Updated"); fetchData(); }
  };

  const empName = (emp: any) => language === "ar" ? `${emp.first_name_ar} ${emp.last_name_ar}` : `${emp.first_name_en || emp.first_name_ar} ${emp.last_name_en || emp.last_name_ar}`;

  const leaveTypeLabel = (t: string) => {
    const map: Record<string, { ar: string; en: string }> = {
      annual: { ar: "سنوية", en: "Annual" }, sick: { ar: "مرضية", en: "Sick" }, emergency: { ar: "طوارئ", en: "Emergency" },
      unpaid: { ar: "بدون راتب", en: "Unpaid" }, maternity: { ar: "أمومة", en: "Maternity" }, paternity: { ar: "أبوة", en: "Paternity" },
    };
    return language === "ar" ? map[t]?.ar || t : map[t]?.en || t;
  };

  const statusBadge = (s: string) => {
    const map: Record<string, { ar: string; en: string; v: string }> = {
      pending: { ar: "معلق", en: "Pending", v: "secondary" },
      approved: { ar: "مقبول", en: "Approved", v: "default" },
      rejected: { ar: "مرفوض", en: "Rejected", v: "destructive" },
    };
    const item = map[s] || { ar: s, en: s, v: "outline" };
    return <Badge variant={item.v as any}>{language === "ar" ? item.ar : item.en}</Badge>;
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><CalendarDays className="h-5 w-5 sm:h-6 sm:w-6" /> {language === "ar" ? "إدارة الإجازات" : "Leave Management"}</h1>
        <div className="flex items-center gap-2 flex-wrap">
          <Button size="sm" onClick={openAdd}><Plus className="h-4 w-4 me-2" />{language === "ar" ? "طلب إجازة" : "Request Leave"}</Button>
        </div>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? (language === "ar" ? "تعديل طلب الإجازة" : "Edit Leave Request") : (language === "ar" ? "طلب إجازة جديد" : "New Leave Request")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div>
              <Label>{language === "ar" ? "الموظف" : "Employee"}</Label>
              <Select value={form.employee_id} onValueChange={(v) => setForm({ ...form, employee_id: v })} disabled={!!editingId}>
                <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر" : "Select"} /></SelectTrigger>
                <SelectContent>{employees.map((e) => <SelectItem key={e.id} value={e.id}>{e.employee_number} - {empName(e)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div>
              <Label>{language === "ar" ? "نوع الإجازة" : "Leave Type"}</Label>
              <Select value={form.leave_type} onValueChange={(v) => setForm({ ...form, leave_type: v })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>{leaveTypes.map((t) => <SelectItem key={t} value={t}>{leaveTypeLabel(t)}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{language === "ar" ? "من" : "From"}</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>{language === "ar" ? "إلى" : "To"}</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            {form.start_date && form.end_date && <p className="text-sm text-muted-foreground">{language === "ar" ? "عدد الأيام:" : "Days:"} {calcDays(form.start_date, form.end_date)}</p>}
            <div><Label>{language === "ar" ? "السبب" : "Reason"}</Label><Textarea value={form.reason} onChange={(e) => setForm({ ...form, reason: e.target.value })} /></div>
            <Button onClick={handleSave} className="w-full">{language === "ar" ? "حفظ" : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        description={language === "ar" ? "هل أنت متأكد من حذف طلب الإجازة؟" : "Are you sure you want to delete this leave request?"}
        confirmLabel={language === "ar" ? "حذف" : "Delete"}
        cancelLabel={language === "ar" ? "إلغاء" : "Cancel"}
        onConfirm={handleDelete}
      />

      <Card>
        <CardContent className="pt-6">
          {loading ? <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p> : requests.length === 0 ? (
            <p className="text-center py-8 text-muted-foreground">{language === "ar" ? "لا توجد طلبات" : "No requests"}</p>
          ) : (
            <div className="overflow-x-auto -mx-6 px-6">
              <div className="min-w-[800px]">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>{language === "ar" ? "الموظف" : "Employee"}</TableHead>
                      <TableHead>{language === "ar" ? "النوع" : "Type"}</TableHead>
                      <TableHead>{language === "ar" ? "من" : "From"}</TableHead>
                      <TableHead>{language === "ar" ? "إلى" : "To"}</TableHead>
                      <TableHead>{language === "ar" ? "الأيام" : "Days"}</TableHead>
                      <TableHead>{language === "ar" ? "الحالة" : "Status"}</TableHead>
                      <TableHead className="w-28">{language === "ar" ? "إجراءات" : "Actions"}</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {requests.map((r) => (
                      <TableRow key={r.id}>
                        <TableCell>{r.employees ? empName(r.employees) : "-"}</TableCell>
                        <TableCell>{leaveTypeLabel(r.leave_type)}</TableCell>
                        <TableCell>{r.start_date}</TableCell>
                        <TableCell>{r.end_date}</TableCell>
                        <TableCell>{r.days_count}</TableCell>
                        <TableCell>{statusBadge(r.status)}</TableCell>
                        <TableCell>
                          <div className="flex gap-1">
                            {r.status === "pending" && (
                              <>
                                <Button size="icon" variant="ghost" onClick={() => updateStatus(r.id, "approved")}><Check className="h-4 w-4 text-green-600" /></Button>
                                <Button size="icon" variant="ghost" onClick={() => updateStatus(r.id, "rejected")}><X className="h-4 w-4 text-destructive" /></Button>
                              </>
                            )}
                            <Button variant="ghost" size="icon" onClick={() => openEdit(r)}><Pencil className="h-4 w-4" /></Button>
                            <Button variant="ghost" size="icon" onClick={() => setDeleteId(r.id)}><Trash2 className="h-4 w-4 text-destructive" /></Button>
                          </div>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
