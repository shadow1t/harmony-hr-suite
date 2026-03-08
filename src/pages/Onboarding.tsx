import { useState } from "react";
import { useLanguage } from "@/i18n/LanguageContext";
import { useCompany } from "@/hooks/useCompany";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { toast } from "sonner";
import { Building2, Users, MapPin, Check, ArrowRight, ArrowLeft, Sparkles } from "lucide-react";
import { useNavigate } from "react-router-dom";

const steps = [
  { icon: Building2, ar: "معلومات الشركة", en: "Company Info" },
  { icon: MapPin, ar: "الفروع", en: "Branches" },
  { icon: Users, ar: "أول موظف", en: "First Employee" },
];

export default function Onboarding() {
  const { language } = useLanguage();
  const { companyId } = useCompany();
  const { user } = useAuth();
  const navigate = useNavigate();
  const [step, setStep] = useState(0);
  const [saving, setSaving] = useState(false);

  const [company, setCompany] = useState({ name_ar: "", name_en: "", currency: "SAR" });
  const [branch, setBranch] = useState({ name_ar: "", name_en: "", city: "" });
  const [employee, setEmployee] = useState({ employee_number: "EMP-001", first_name_ar: "", last_name_ar: "", first_name_en: "", last_name_en: "", email: "" });

  const handleCompanySave = async () => {
    if (!company.name_ar) { toast.error(language === "ar" ? "أدخل اسم الشركة" : "Enter company name"); return; }
    setSaving(true);
    const { error } = await supabase.from("companies").update({ name_ar: company.name_ar, name_en: company.name_en || company.name_ar, currency: company.currency }).eq("id", companyId);
    if (error) { toast.error(error.message); setSaving(false); return; }
    setSaving(false);
    setStep(1);
  };

  const handleBranchSave = async () => {
    setSaving(true);
    if (branch.name_ar) {
      const { error } = await supabase.from("branches").insert({ name_ar: branch.name_ar, name_en: branch.name_en || branch.name_ar, city: branch.city || null, company_id: companyId });
      if (error) { toast.error(error.message); setSaving(false); return; }
    }
    setSaving(false);
    setStep(2);
  };

  const handleEmployeeSave = async () => {
    setSaving(true);
    if (employee.first_name_ar && employee.last_name_ar) {
      const { error } = await supabase.from("employees").insert({
        employee_number: employee.employee_number, first_name_ar: employee.first_name_ar, last_name_ar: employee.last_name_ar,
        first_name_en: employee.first_name_en || null, last_name_en: employee.last_name_en || null,
        email: employee.email || null, company_id: companyId,
      });
      if (error) { toast.error(error.message); setSaving(false); return; }
    }
    setSaving(false);
    toast.success(language === "ar" ? "تم إعداد النظام بنجاح! 🎉" : "Setup complete! 🎉");
    navigate("/");
  };

  const Next = language === "ar" ? ArrowLeft : ArrowRight;
  const Prev = language === "ar" ? ArrowRight : ArrowLeft;

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="w-full max-w-lg space-y-6">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center gap-2 text-primary">
            <Sparkles className="h-6 w-6" />
            <h1 className="text-2xl font-bold">{language === "ar" ? "مرحباً بك!" : "Welcome!"}</h1>
          </div>
          <p className="text-muted-foreground">{language === "ar" ? "لنقم بإعداد نظامك في خطوات بسيطة" : "Let's set up your system in a few steps"}</p>
        </div>

        {/* Steps indicator */}
        <div className="flex items-center justify-center gap-2">
          {steps.map((s, i) => {
            const Icon = s.icon;
            const done = i < step;
            const active = i === step;
            return (
              <div key={i} className="flex items-center gap-2">
                <div className={`flex items-center justify-center h-9 w-9 rounded-full border-2 transition-all ${done ? "bg-primary border-primary text-primary-foreground" : active ? "border-primary text-primary" : "border-muted text-muted-foreground"}`}>
                  {done ? <Check className="h-4 w-4" /> : <Icon className="h-4 w-4" />}
                </div>
                {i < steps.length - 1 && <div className={`w-8 h-0.5 ${i < step ? "bg-primary" : "bg-muted"}`} />}
              </div>
            );
          })}
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{language === "ar" ? steps[step].ar : steps[step].en}</CardTitle>
            <CardDescription>
              {step === 0 && (language === "ar" ? "أدخل معلومات شركتك الأساسية" : "Enter your basic company information")}
              {step === 1 && (language === "ar" ? "أضف فرعك الأول (اختياري)" : "Add your first branch (optional)")}
              {step === 2 && (language === "ar" ? "أضف أول موظف في النظام (اختياري)" : "Add your first employee (optional)")}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {step === 0 && (
              <>
                <div><Label>{language === "ar" ? "اسم الشركة (عربي) *" : "Company Name (AR) *"}</Label><Input value={company.name_ar} onChange={(e) => setCompany({ ...company, name_ar: e.target.value })} /></div>
                <div><Label>{language === "ar" ? "اسم الشركة (إنجليزي)" : "Company Name (EN)"}</Label><Input value={company.name_en} onChange={(e) => setCompany({ ...company, name_en: e.target.value })} /></div>
                <div><Label>{language === "ar" ? "العملة" : "Currency"}</Label><Input value={company.currency} onChange={(e) => setCompany({ ...company, currency: e.target.value })} /></div>
                <Button onClick={handleCompanySave} disabled={saving} className="w-full">{saving ? "..." : <>{language === "ar" ? "التالي" : "Next"} <Next className="h-4 w-4 ms-2" /></>}</Button>
              </>
            )}
            {step === 1 && (
              <>
                <div><Label>{language === "ar" ? "اسم الفرع (عربي)" : "Branch Name (AR)"}</Label><Input value={branch.name_ar} onChange={(e) => setBranch({ ...branch, name_ar: e.target.value })} /></div>
                <div><Label>{language === "ar" ? "اسم الفرع (إنجليزي)" : "Branch Name (EN)"}</Label><Input value={branch.name_en} onChange={(e) => setBranch({ ...branch, name_en: e.target.value })} /></div>
                <div><Label>{language === "ar" ? "المدينة" : "City"}</Label><Input value={branch.city} onChange={(e) => setBranch({ ...branch, city: e.target.value })} /></div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(0)} className="flex-1"><Prev className="h-4 w-4 me-2" />{language === "ar" ? "السابق" : "Back"}</Button>
                  <Button onClick={handleBranchSave} disabled={saving} className="flex-1">{saving ? "..." : <>{language === "ar" ? "التالي" : "Next"} <Next className="h-4 w-4 ms-2" /></>}</Button>
                </div>
              </>
            )}
            {step === 2 && (
              <>
                <div><Label>{language === "ar" ? "الرقم الوظيفي" : "Employee Number"}</Label><Input value={employee.employee_number} onChange={(e) => setEmployee({ ...employee, employee_number: e.target.value })} /></div>
                <div className="grid grid-cols-2 gap-3">
                  <div><Label>{language === "ar" ? "الاسم الأول (عربي)" : "First Name (AR)"}</Label><Input value={employee.first_name_ar} onChange={(e) => setEmployee({ ...employee, first_name_ar: e.target.value })} /></div>
                  <div><Label>{language === "ar" ? "الاسم الأخير (عربي)" : "Last Name (AR)"}</Label><Input value={employee.last_name_ar} onChange={(e) => setEmployee({ ...employee, last_name_ar: e.target.value })} /></div>
                </div>
                <div><Label>{language === "ar" ? "البريد الإلكتروني" : "Email"}</Label><Input type="email" value={employee.email} onChange={(e) => setEmployee({ ...employee, email: e.target.value })} /></div>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => setStep(1)} className="flex-1"><Prev className="h-4 w-4 me-2" />{language === "ar" ? "السابق" : "Back"}</Button>
                  <Button onClick={handleEmployeeSave} disabled={saving} className="flex-1">{saving ? "..." : <>{language === "ar" ? "إنهاء الإعداد" : "Finish"} <Check className="h-4 w-4 ms-2" /></>}</Button>
                </div>
                <Button variant="ghost" onClick={() => navigate("/")} className="w-full text-muted-foreground">{language === "ar" ? "تخطي والذهاب للوحة التحكم" : "Skip to Dashboard"}</Button>
              </>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
