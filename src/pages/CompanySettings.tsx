import { useState, useEffect } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/hooks/useCompany";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Building2, Image, Save } from "lucide-react";

export default function CompanySettings() {
  const { language } = useLanguage();
  const { company, companyId, refetch } = useCompany();
  const [form, setForm] = useState({ name_ar: "", name_en: "", logo_url: "" });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (company) {
      setForm({
        name_ar: company.name_ar || "",
        name_en: company.name_en || "",
        logo_url: company.logo_url || "",
      });
    }
  }, [company]);

  const handleSave = async () => {
    if (!companyId) return;
    setSaving(true);
    const { error } = await supabase
      .from("companies")
      .update({
        name_ar: form.name_ar,
        name_en: form.name_en,
        logo_url: form.logo_url || null,
      })
      .eq("id", companyId);

    if (error) {
      toast.error(error.message);
    } else {
      toast.success(language === "ar" ? "تم حفظ الإعدادات بنجاح" : "Settings saved successfully");
      await refetch();
    }
    setSaving(false);
  };

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-bold flex items-center gap-2">
        <Building2 className="h-6 w-6" />
        {language === "ar" ? "إعدادات الشركة" : "Company Settings"}
      </h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? "البيانات الأساسية" : "Basic Information"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{language === "ar" ? "اسم الشركة (عربي)" : "Company Name (Arabic)"}</Label>
              <Input value={form.name_ar} onChange={(e) => setForm({ ...form, name_ar: e.target.value })} />
            </div>
            <div>
              <Label>{language === "ar" ? "اسم الشركة (إنجليزي)" : "Company Name (English)"}</Label>
              <Input value={form.name_en} onChange={(e) => setForm({ ...form, name_en: e.target.value })} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Image className="h-5 w-5" />
              {language === "ar" ? "الهوية البصرية" : "Visual Identity"}
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div>
              <Label>{language === "ar" ? "رابط شعار الشركة (Logo URL)" : "Company Logo URL"}</Label>
              <Input
                value={form.logo_url}
                onChange={(e) => setForm({ ...form, logo_url: e.target.value })}
                placeholder="https://example.com/logo.png"
                dir="ltr"
              />
            </div>
            {form.logo_url && (
              <div className="border border-border rounded-lg p-4 flex items-center justify-center bg-muted/30">
                <img
                  src={form.logo_url}
                  alt="Company Logo Preview"
                  className="max-h-20 max-w-full object-contain"
                  onError={(e) => { (e.target as HTMLImageElement).style.display = "none"; }}
                />
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          <Save className="h-4 w-4 me-2" />
          {saving
            ? (language === "ar" ? "جاري الحفظ..." : "Saving...")
            : (language === "ar" ? "حفظ الإعدادات" : "Save Settings")}
        </Button>
      </div>
    </div>
  );
}
