import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL")!;
    const supabaseKey = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY")!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    const today = new Date().toISOString().split("T")[0];
    const future30 = new Date(Date.now() + 30 * 86400000).toISOString().split("T")[0];

    // Get all active employees with expiring IDs or contracts
    const { data: employees, error: empError } = await supabase
      .from("employees")
      .select("id, first_name_ar, last_name_ar, first_name_en, last_name_en, employee_number, id_expiry_date, contract_expiry_date, company_id")
      .eq("status", "active");

    if (empError) throw empError;

    let notificationsCreated = 0;

    for (const emp of employees || []) {
      const nameAr = `${emp.first_name_ar} ${emp.last_name_ar}`;
      const nameEn = `${emp.first_name_en || emp.first_name_ar} ${emp.last_name_en || emp.last_name_ar}`;

      // Check ID expiry
      if (emp.id_expiry_date && emp.id_expiry_date <= future30) {
        const expired = emp.id_expiry_date < today;
        const titleAr = expired ? `⚠️ هوية منتهية - ${nameAr}` : `⏰ هوية تنتهي قريباً - ${nameAr}`;
        const titleEn = expired ? `⚠️ Expired ID - ${nameEn}` : `⏰ ID Expiring Soon - ${nameEn}`;
        const messageAr = expired
          ? `هوية الموظف ${nameAr} (${emp.employee_number}) انتهت في ${emp.id_expiry_date}`
          : `هوية الموظف ${nameAr} (${emp.employee_number}) تنتهي في ${emp.id_expiry_date}`;
        const messageEn = expired
          ? `Employee ${nameEn} (${emp.employee_number}) ID expired on ${emp.id_expiry_date}`
          : `Employee ${nameEn} (${emp.employee_number}) ID expires on ${emp.id_expiry_date}`;

        // Check if notification already exists today
        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("company_id", emp.company_id)
          .like("title", `%${emp.employee_number}%`)
          .like("title", `%هوية%`)
          .gte("created_at", today + "T00:00:00")
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from("notifications").insert({
            company_id: emp.company_id,
            title: titleAr,
            message: messageAr + " | " + messageEn,
          });
          notificationsCreated++;
        }
      }

      // Check contract expiry
      if (emp.contract_expiry_date && emp.contract_expiry_date <= future30) {
        const expired = emp.contract_expiry_date < today;
        const titleAr = expired ? `⚠️ عقد منتهي - ${nameAr}` : `⏰ عقد ينتهي قريباً - ${nameAr}`;
        const messageAr = expired
          ? `عقد الموظف ${nameAr} (${emp.employee_number}) انتهى في ${emp.contract_expiry_date}`
          : `عقد الموظف ${nameAr} (${emp.employee_number}) ينتهي في ${emp.contract_expiry_date}`;
        const messageEn = expired
          ? `Employee ${nameEn} (${emp.employee_number}) contract expired on ${emp.contract_expiry_date}`
          : `Employee ${nameEn} (${emp.employee_number}) contract expires on ${emp.contract_expiry_date}`;

        const { data: existing } = await supabase
          .from("notifications")
          .select("id")
          .eq("company_id", emp.company_id)
          .like("title", `%${emp.employee_number}%`)
          .like("title", `%عقد%`)
          .gte("created_at", today + "T00:00:00")
          .limit(1);

        if (!existing || existing.length === 0) {
          await supabase.from("notifications").insert({
            company_id: emp.company_id,
            title: titleAr,
            message: messageAr + " | " + messageEn,
          });
          notificationsCreated++;
        }
      }
    }

    // Check leave balances running low (remaining <= 3 days for annual leave)
    const currentYear = new Date().getFullYear();
    const { data: lowBalances } = await supabase
      .from("leave_balances")
      .select("*, employees(first_name_ar, last_name_ar, first_name_en, last_name_en, employee_number, company_id)")
      .eq("leave_type", "annual")
      .eq("year", currentYear)
      .lte("remaining_days", 3)
      .gt("total_days", 0);

    for (const lb of lowBalances || []) {
      const emp = lb.employees as any;
      if (!emp) continue;
      const nameAr = `${emp.first_name_ar} ${emp.last_name_ar}`;

      const { data: existing } = await supabase
        .from("notifications")
        .select("id")
        .eq("company_id", emp.company_id)
        .like("title", `%${emp.employee_number}%`)
        .like("title", `%إجازات%`)
        .gte("created_at", today + "T00:00:00")
        .limit(1);

      if (!existing || existing.length === 0) {
        await supabase.from("notifications").insert({
          company_id: emp.company_id,
          title: `📋 رصيد إجازات منخفض - ${nameAr}`,
          message: `رصيد الإجازات السنوية للموظف ${nameAr} (${emp.employee_number}) منخفض: ${lb.remaining_days} أيام متبقية من ${lb.total_days}`,
        });
        notificationsCreated++;
      }
    }

    return new Response(
      JSON.stringify({ success: true, notifications_created: notificationsCreated }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
