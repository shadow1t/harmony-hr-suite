import { useLanguage } from "@/i18n/LanguageContext";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Settings as SettingsIcon, Globe, User, Shield, Building2 } from "lucide-react";
import { useNavigate } from "react-router-dom";

export default function Settings() {
  const { language, setLanguage } = useLanguage();
  const { user } = useAuth();
  const navigate = useNavigate();

  return (
    <div className="space-y-6">
      <h1 className="text-xl sm:text-2xl font-bold flex items-center gap-2"><SettingsIcon className="h-5 w-5 sm:h-6 sm:w-6" /> {language === "ar" ? "الإعدادات" : "Settings"}</h1>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><User className="h-5 w-5" /> {language === "ar" ? "الملف الشخصي" : "Profile"}</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div>
              <Label className="text-muted-foreground">{language === "ar" ? "البريد الإلكتروني" : "Email"}</Label>
              <p className="font-medium">{user?.email}</p>
            </div>
            <div>
              <Label className="text-muted-foreground">{language === "ar" ? "الاسم" : "Name"}</Label>
              <p className="font-medium">{user?.user_metadata?.full_name || "-"}</p>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Globe className="h-5 w-5" /> {language === "ar" ? "اللغة" : "Language"}</CardTitle>
          </CardHeader>
          <CardContent>
            <Select value={language} onValueChange={(v: any) => setLanguage(v)}>
              <SelectTrigger><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="ar">العربية</SelectItem>
                <SelectItem value="en">English</SelectItem>
              </SelectContent>
            </Select>
          </CardContent>
        </Card>

        <Card className="cursor-pointer hover:border-primary/50 transition-colors" onClick={() => navigate("/settings/company")}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Building2 className="h-5 w-5" /> {language === "ar" ? "إعدادات الشركة" : "Company Settings"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground">{language === "ar" ? "تعديل اسم الشركة، الشعار، والإعدادات الأخرى" : "Edit company name, logo, and other settings"}</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2"><Shield className="h-5 w-5" /> {language === "ar" ? "الأمان" : "Security"}</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-sm text-muted-foreground mb-3">{language === "ar" ? "تغيير كلمة المرور عبر إعادة تعيين كلمة المرور بالبريد الإلكتروني" : "Change password via email reset"}</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
