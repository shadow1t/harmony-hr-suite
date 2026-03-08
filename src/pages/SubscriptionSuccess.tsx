import { useNavigate } from "react-router-dom";
import { useLanguage } from "@/i18n/LanguageContext";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { CheckCircle2 } from "lucide-react";

export default function SubscriptionSuccess() {
  const navigate = useNavigate();
  const { language } = useLanguage();
  const isAr = language === "ar";

  return (
    <div className="min-h-screen flex items-center justify-center bg-background p-4">
      <Card className="max-w-md w-full text-center">
        <CardContent className="pt-8 pb-8 space-y-4">
          <div className="mx-auto h-16 w-16 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
            <CheckCircle2 className="h-8 w-8 text-green-600" />
          </div>
          <h1 className="text-2xl font-bold">{isAr ? "تم الاشتراك بنجاح! 🎉" : "Subscription Successful! 🎉"}</h1>
          <p className="text-muted-foreground">
            {isAr
              ? "شكراً لاشتراكك. يمكنك الآن الاستمتاع بجميع مميزات النظام."
              : "Thank you for subscribing. You can now enjoy all platform features."}
          </p>
          <Button className="mt-4" onClick={() => navigate("/")}>
            {isAr ? "الذهاب للوحة التحكم" : "Go to Dashboard"}
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
