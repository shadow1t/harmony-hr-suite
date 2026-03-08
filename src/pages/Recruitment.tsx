import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, UserPlus, Briefcase } from "lucide-react";

export default function Recruitment() {
  const { language } = useLanguage();
  const [jobs, setJobs] = useState<any[]>([]);
  const [departments, setDepartments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
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

  const handleAdd = async () => {
    if (!form.title_ar) { toast.error(language === "ar" ? "يرجى إدخال العنوان" : "Title required"); return; }
    const { error } = await supabase.from("job_postings").insert({ ...form, department_id: form.department_id || null });
    if (error) toast.error(error.message);
    else { toast.success(language === "ar" ? "تم إضافة الوظيفة" : "Job posted"); setDialogOpen(false); fetchData(); }
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between flex-wrap gap-4">
        <h1 className="text-2xl font-bold flex items-center gap-2"><UserPlus className="h-6 w-6" /> {language === "ar" ? "التوظيف" : "Recruitment"}</h1>
        <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
          <DialogTrigger asChild><Button><Plus className="h-4 w-4 me-2" />{language === "ar" ? "وظيفة جديدة" : "New Job"}</Button></DialogTrigger>
          <DialogContent className="max-w-lg">
            <DialogHeader><DialogTitle>{language === "ar" ? "إضافة وظيفة شاغرة" : "Add Job Posting"}</DialogTitle></DialogHeader>
            <div className="space-y-3">
              <div><Label>{language === "ar" ? "العنوان بالعربي" : "Title (AR)"}</Label><Input value={form.title_ar} onChange={(e) => setForm({ ...form, title_ar: e.target.value })} /></div>
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
              <Button onClick={handleAdd} className="w-full">{language === "ar" ? "نشر الوظيفة" : "Post Job"}</Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {loading ? <p className="col-span-full text-center py-8 text-muted-foreground">{language === "ar" ? "جاري التحميل..." : "Loading..."}</p> : jobs.length === 0 ? (
          <p className="col-span-full text-center py-8 text-muted-foreground">{language === "ar" ? "لا توجد وظائف شاغرة" : "No job postings"}</p>
        ) : jobs.map((j) => (
          <Card key={j.id}>
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <Briefcase className="h-5 w-5 text-primary" />
                  <CardTitle className="text-base">{language === "ar" ? j.title_ar : (j.title_en || j.title_ar)}</CardTitle>
                </div>
                <Badge variant={j.status === "open" ? "default" : "secondary"}>{j.status === "open" ? (language === "ar" ? "مفتوح" : "Open") : (language === "ar" ? "مغلق" : "Closed")}</Badge>
              </div>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground mb-2">{j.departments ? (language === "ar" ? j.departments.name_ar : j.departments.name_en) : ""}</p>
              <p className="text-sm line-clamp-2">{language === "ar" ? j.description_ar : (j.description_en || j.description_ar)}</p>
              {j.closing_date && <p className="text-xs text-muted-foreground mt-2">{language === "ar" ? "يغلق:" : "Closes:"} {j.closing_date}</p>}
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}
