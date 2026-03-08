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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Plus, GraduationCap, Calendar, Pencil, Trash2 } from "lucide-react";

export default function Training() {
  const { language } = useLanguage();
  const { companyId } = useCompany();
  const [courses, setCourses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ title_ar: "", title_en: "", description: "", trainer: "", start_date: "", end_date: "", max_participants: "" });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("training_courses").select("*").order("created_at", { ascending: false });
    if (data) setCourses(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditingId(null); setForm({ title_ar: "", title_en: "", description: "", trainer: "", start_date: "", end_date: "", max_participants: "" }); setDialogOpen(true); };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({
      title_ar: c.title_ar || "", title_en: c.title_en || "", description: c.description || "",
      trainer: c.trainer || "", start_date: c.start_date || "", end_date: c.end_date || "",
      max_participants: c.max_participants?.toString() || "",
    });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.title_ar) { toast.error(language === "ar" ? "يرجى إدخال العنوان" : "Title required"); return; }
    const payload = {
      ...form, company_id: companyId,
      max_participants: form.max_participants ? parseInt(form.max_participants) : null,
      start_date: form.start_date || null, end_date: form.end_date || null,
    };

    if (editingId) {
      const { error } = await supabase.from("training_courses").update(payload).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success(language === "ar" ? "تم التحديث" : "Updated");
    } else {
      const { error } = await supabase.from("training_courses").insert(payload);
      if (error) { toast.error(error.message); return; }
      toast.success(language === "ar" ? "تم إضافة الدورة" : "Course added");
    }
    setDialogOpen(false); setEditingId(null); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("training_courses").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم الحذف" : "Deleted"); fetchData(); }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><GraduationCap className="h-5 w-5 sm:h-6 sm:w-6" /> {language === "ar" ? "التدريب" : "Training"}</h1>
        <Button onClick={openAdd}><Plus className="h-4 w-4 me-2" />{language === "ar" ? "دورة جديدة" : "New Course"}</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? (language === "ar" ? "تعديل الدورة" : "Edit Course") : (language === "ar" ? "إضافة دورة تدريبية" : "Add Training Course")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{language === "ar" ? "العنوان بالعربي *" : "Title (AR) *"}</Label><Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "العنوان بالإنجليزي" : "Title (EN)"}</Label><Input value={form.title_en} onChange={(e) => setForm({ ...form, title_en: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "المدرب" : "Trainer"}</Label><Input value={form.trainer} onChange={(e) => setForm({ ...form, trainer: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "الوصف" : "Description"}</Label><Textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{language === "ar" ? "تاريخ البدء" : "Start"}</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>{language === "ar" ? "تاريخ الانتهاء" : "End"}</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <div><Label>{language === "ar" ? "الحد الأقصى" : "Max Participants"}</Label><Input type="number" value={form.max_participants} onChange={(e) => setForm({ ...form, max_participants: e.target.value })} /></div>
            <Button onClick={handleSave} className="w-full">{language === "ar" ? "حفظ" : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        description={language === "ar" ? "هل أنت متأكد من حذف هذه الدورة؟" : "Are you sure you want to delete this course?"}
        confirmLabel={language === "ar" ? "حذف" : "Delete"}
        cancelLabel={language === "ar" ? "إلغاء" : "Cancel"}
        onConfirm={handleDelete}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p className="col-span-full text-center py-8 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p> : courses.length === 0 ? (
          <p className="col-span-full text-center py-8 text-muted-foreground">{language === "ar" ? "لا توجد دورات" : "No courses"}</p>
        ) : courses.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <CardTitle className="text-base">{language === "ar" ? c.title_ar : (c.title_en || c.title_ar)}</CardTitle>
                <Badge variant={c.status === "scheduled" ? "default" : "secondary"}>{c.status === "scheduled" ? (language === "ar" ? "مجدول" : "Scheduled") : c.status}</Badge>
              </div>
            </CardHeader>
            <CardContent className="space-y-2">
              {c.trainer && <p className="text-sm"><span className="text-muted-foreground">{language === "ar" ? "المدرب:" : "Trainer:"}</span> {c.trainer}</p>}
              {c.start_date && <p className="text-sm flex items-center gap-1"><Calendar className="h-3 w-3" /> {c.start_date} → {c.end_date}</p>}
              {c.description && <p className="text-sm text-muted-foreground line-clamp-2">{c.description}</p>}
              <div className="flex gap-1 border-t pt-3 mt-3">
                <Button variant="ghost" size="sm" onClick={() => openEdit(c)}><Pencil className="h-4 w-4 me-1" />{language === "ar" ? "تعديل" : "Edit"}</Button>
                <Button variant="ghost" size="sm" onClick={() => setDeleteId(c.id)} className="text-destructive hover:text-destructive"><Trash2 className="h-4 w-4 me-1" />{language === "ar" ? "حذف" : "Delete"}</Button>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
