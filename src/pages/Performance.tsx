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
import { ConfirmDialog } from "@/components/ui/confirm-dialog";
import { toast } from "sonner";
import { Plus, TrendingUp, Target, Pencil, Trash2 } from "lucide-react";

export default function Performance() {
  const { language } = useLanguage();
  const { companyId } = useCompany();
  const [cycles, setCycles] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [deleteId, setDeleteId] = useState<string | null>(null);
  const [form, setForm] = useState({ name_ar: "", name_en: "", start_date: "", end_date: "" });

  const fetchData = async () => {
    setLoading(true);
    const { data } = await supabase.from("evaluation_cycles").select("*").order("created_at", { ascending: false });
    if (data) setCycles(data);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const openAdd = () => { setEditingId(null); setForm({ name_ar: "", name_en: "", start_date: "", end_date: "" }); setDialogOpen(true); };

  const openEdit = (c: any) => {
    setEditingId(c.id);
    setForm({ name_ar: c.name_ar || "", name_en: c.name_en || "", start_date: c.start_date || "", end_date: c.end_date || "" });
    setDialogOpen(true);
  };

  const handleSave = async () => {
    if (!form.name_ar || !form.start_date || !form.end_date) { toast.error(language === "ar" ? "يرجى تعبئة الحقول" : "Fill all fields"); return; }

    if (editingId) {
      const { error } = await supabase.from("evaluation_cycles").update(form).eq("id", editingId);
      if (error) { toast.error(error.message); return; }
      toast.success(language === "ar" ? "تم التحديث" : "Updated");
    } else {
      const { error } = await supabase.from("evaluation_cycles").insert({ ...form, company_id: companyId });
      if (error) { toast.error(error.message); return; }
      toast.success(language === "ar" ? "تم إنشاء الدورة" : "Cycle created");
    }
    setDialogOpen(false); setEditingId(null); fetchData();
  };

  const handleDelete = async () => {
    if (!deleteId) return;
    const { error } = await supabase.from("evaluation_cycles").delete().eq("id", deleteId);
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم الحذف" : "Deleted"); fetchData(); }
    setDeleteId(null);
  };

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><TrendingUp className="h-5 w-5 sm:h-6 sm:w-6" /> {language === "ar" ? "تقييم الأداء" : "Performance"}</h1>
        <Button onClick={openAdd}><Plus className="h-4 w-4 me-2" />{language === "ar" ? "دورة تقييم جديدة" : "New Cycle"}</Button>
      </div>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader><DialogTitle>{editingId ? (language === "ar" ? "تعديل دورة التقييم" : "Edit Cycle") : (language === "ar" ? "دورة تقييم جديدة" : "New Evaluation Cycle")}</DialogTitle></DialogHeader>
          <div className="space-y-3">
            <div><Label>{language === "ar" ? "الاسم بالعربي *" : "Name (AR) *"}</Label><Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} /></div>
            <div><Label>{language === "ar" ? "الاسم بالإنجليزي" : "Name (EN)"}</Label><Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} /></div>
            <div className="grid grid-cols-2 gap-3">
              <div><Label>{language === "ar" ? "تاريخ البدء *" : "Start *"}</Label><Input type="date" value={form.start_date} onChange={(e) => setForm({ ...form, start_date: e.target.value })} /></div>
              <div><Label>{language === "ar" ? "تاريخ الانتهاء *" : "End *"}</Label><Input type="date" value={form.end_date} onChange={(e) => setForm({ ...form, end_date: e.target.value })} /></div>
            </div>
            <Button onClick={handleSave} className="w-full">{language === "ar" ? "حفظ" : "Save"}</Button>
          </div>
        </DialogContent>
      </Dialog>

      <ConfirmDialog
        open={!!deleteId}
        onOpenChange={(open) => !open && setDeleteId(null)}
        title={language === "ar" ? "تأكيد الحذف" : "Confirm Delete"}
        description={language === "ar" ? "هل أنت متأكد من حذف دورة التقييم؟" : "Are you sure you want to delete this evaluation cycle?"}
        confirmLabel={language === "ar" ? "حذف" : "Delete"}
        cancelLabel={language === "ar" ? "إلغاء" : "Cancel"}
        onConfirm={handleDelete}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {loading ? <p className="col-span-full text-center py-8 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p> : cycles.length === 0 ? (
          <p className="col-span-full text-center py-8 text-muted-foreground">{language === "ar" ? "لا توجد دورات تقييم" : "No evaluation cycles"}</p>
        ) : cycles.map((c) => (
          <Card key={c.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Target className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{language === "ar" ? c.name_ar : (c.name_en || c.name_ar)}</CardTitle>
                </div>
                <Badge variant={c.status === "active" ? "default" : "secondary"}>{c.status === "active" ? (language === "ar" ? "نشط" : "Active") : c.status}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">{c.start_date} → {c.end_date}</p>
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
