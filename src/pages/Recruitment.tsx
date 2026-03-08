import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Plus, UserPlus, Briefcase, Pencil, Trash2, ToggleLeft, ToggleRight, DoorOpen, DoorClosed } from "lucide-react";
import { StatCard } from "@/components/ui/stat-card";

export default function Recruitment() {
  const { language } = useLanguage();
  const { companyId } = useCompany();
  const [jobs, setJobs] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ title_ar: "", title_en: "", description_ar: "", description_en: "", department_id: "", requirements: "", closing_date: "" });

  const fetchData = async () => {
    setLoading(true);
    const [jRes, dRes] = await Promise.all([
      supabase.from("job_postings").select("*, departments(name_ar, name_en)").order("created_at", { ascending: false }),
      supabase.from("departments").select("*"),
    ]);
    if (jRes.data) setJobs(jRes.data);
    if (dRes.data) setDepartments(dRes.data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditingId(null); setForm({ title_ar: "", title_en: "", description_ar: "", description_en: "", department_id: "", requirements: "", closing_date: "" }); setDialogOpen(true); };
  const openEdit = (j: any) => {
    setEditingId(j.id);
    setForm({ title_ar: j.title_ar || "", title_en: j.title_en || "", description_ar: j.description_ar || "", description_en: j.description_en || "", department_id: j.department_id || "", requirements: j.requirements || "", closing_date: j.closing_date || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title_ar) { toast.error(language === "ar" ? "يرجى إدخال العنوان" : "Title required"); return; }
    setSaving(true);
    const payload = { ...form, department_id: form.department_id || null, closing_date: form.closing_date || null, company_id: companyId };
    if (editingId) {
      const { error } = await supabase.from("job_postings").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success(language === "ar" ? "تم التحديث" : "Updated");
    } else {
      const { error } = await supabase.from("job_postings").insert(payload);
      if (error) { toast.error(error.message); setSaving(false); return; }
      toast.success(language === "ar" ? "تم إضافة الوظيفة" : "Job posted");
    }
    setSaving(false); setDialogOpen(false); setEditingId(null); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("job_postings").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم الحذف" : "Deleted"); fetchData(); }
    setDeleteId(null);
  };

  const toggleStatus = async (id: string, current: string) => {
    const newStatus = current === "open" ? "closed" : "open";
    const { error } = await supabase.from("job_postings").update({ status: newStatus }).eq("id", id);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم تحديث الحالة" : "Status updated"); fetchData(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><UserPlus className="h-5 w-5 sm:h-6 sm:w-6" /> {language === "ar" ? "التوظيف" : "Recruitment"}</h1>
        <Button onClick={openAdd}><Plus className="h-4 w-4 me-2" />{language === "ar" ? "وظيفة جديدة" : "New Job"}</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader><DialogTitle>{editingId ? (language === "ar" ? "تعديل الوظيفة" : "Edit Job") : (language === "ar" ? "إضافة وظيفة شاغرة" : "Add Job Posting")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{language === "ar" ? "العنوان بالعربي *" : "Title (AR) *"}</Label><Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "العنوان بالإنجليزي" : "Title (EN)"}</Label><Input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} /></div>
            <div>
              <Label>{language === "ar" ? "القسم" : "Department"}</Label>
              <Select value={form.department_id} onValueChange={(v) => setForm({ ...form, department_id: v })}>
                <SelectTrigger><SelectValue placeholder={language === "ar" ? "اختر" : "Select"} /></SelectTrigger>
                <SelectContent>{departments.map((d) => <SelectItem key={d.id} value={d.id}>{language === "ar" ? d.name_ar : d.name_en}</SelectItem>)}</SelectContent>
              </Select>
            </div>
            <div><Label>{language === "ar" ? "الوصف" : "Description"}</Label><Textarea value={form.description_ar} onChange={(e) => setForm({ ...form, description_ar: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "المتطلبات" : "Requirements"}</Label><Textarea value={form.requirements} onChange={(e) => setForm({ ...form, requirements: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "تاريخ الإغلاق" : "Closing Date"}</Label><Input type="date" value={form.closing_date} onChange={(e) => setForm({ ...form, closing_date: e.target.value })} /></div>
            <Button onClick={handleSave} disabled={saving} className="w-full">{saving ? (language === "ar" ? "جاري الحفظ..." : "Saving...") : (language === "ar" ? "حفظ" : "Save")}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog open={!!deleteId} onOpenChange={(o) => !o && setDeleteId(null)}
        title={language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        description={language === "ar" ? "هل أنت متأكد من حذف هذه الوظيفة؟" : "Are you sure you want to delete this job posting?"}
        confirmLabel={language === "ar" ? "حذف" : "Delete"} cancelLabel={language === "ar" ? "إلغاء" : "Cancel"}
        onConfirm={handleDelete} />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p className="col-span-full text-center py-8 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p> : jobs.length === 0 ? (
          <p className="col-span-full text-center py-8 text-muted-foreground">{language === "ar" ? "لا توجد وظائف شاغرة" : "No job postings"}</p>
        ) : jobs.map((j) => (
          <Card key={j.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary shrink-0" />
                  <CardTitle className="text-base">{language === "ar" ? j.title_ar : (j.title_en || j.title_ar)}</CardTitle>
                </div>
                <Badge variant={j.status === "open" ? "default" : "secondary"}>{j.status === "open" ? (language === "ar" ? "مفتوح" : "Open") : (language === "ar" ? "مغلق" : "Closed")}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{j.departments ? (language === "ar" ? j.departments.name_ar : j.departments.name_en) : ""}</p>
              <p className="text-sm line-clamp-2">{language === "ar" ? j.description_ar : (j.description_en || j.description_ar)}</p>
              {j.closing_date && <p className="text-xs text-muted-foreground mt-2">{language === "ar" ? "يغلق:" : "Closes:"} {j.closing_date}</p>}
              <div className="flex gap-1 mt-3 border-t pt-3 flex-wrap">
                <Button variant="ghost" size="sm" onClick={() => toggleStatus(j.id, j.status)}>
                  {j.status === "open" ? <><ToggleRight className="h-4 w-4 me-1" />{language === "ar" ? "إغلاق" : "Close"}</> : <><ToggleLeft className="h-4 w-4 me-1" />{language === "ar" ? "فتح" : "Reopen"}</>}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEdit(j)}><Pencil className="h-4 w-4 me-1" />{language === "ar" ? "تعديل" : "Edit"}</Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(j.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 me-1" />{language === "ar" ? "حذف" : "Delete"}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
