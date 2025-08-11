import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

async function mbFetch(path: string, token: string) {
  const url = `https://moneybird.com/api/v2/${path}`;
  const resp = await fetch(url, { headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" } });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Moneybird error ${resp.status}: ${text}`);
  }
  return resp.json();
}

async function getFirstAdministrationId(token: string): Promise<string | null> {
  try {
    const admins = await mbFetch("administrations.json", token);
    if (Array.isArray(admins) && admins.length) {
      const id = admins[0]?.id ?? admins[0]?.administration_id ?? admins[0]?.slug;
      return id ? String(id) : null;
    }
  } catch (e) {
    console.warn("Failed to list administrations", e);
  }
  return null;
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
    if (!supabaseUrl || !supabaseAnon) {
      return new Response(JSON.stringify({ error: "Supabase env not set" }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }
    const authHeader = req.headers.get("Authorization") || "";
    const sb = createClient(supabaseUrl, supabaseAnon, { global: { headers: { Authorization: authHeader } } });

    const { data: userData, error: userError } = await sb.auth.getUser();
    const user = userData?.user || null;
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), { status: 401, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    const body = await req.json().catch(() => ({}));
    const token = (body?.token || "").trim();
    const label = (body?.label || "Moneybird").toString();
    if (!token) {
      return new Response(JSON.stringify({ error: "Missing token" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Validate token by fetching administration
    const adminId = await getFirstAdministrationId(token);
    if (!adminId) {
      return new Response(JSON.stringify({ ok: false, message: "Ongeldige token of geen administratie gevonden" }), { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } });
    }

    // Upsert connection for current user using unique user_id index
    const { error: upsertErr } = await sb
      .from("moneybird_connections")
      .upsert(
        { user_id: user.id, access_token: token, administration_id: adminId, connection_label: label, auth_type: "pat" },
        { onConflict: "user_id" }
      );
    if (upsertErr) throw upsertErr;

    return new Response(JSON.stringify({ ok: true, administration_id: adminId }), { headers: { ...corsHeaders, "Content-Type": "application/json" } });
  } catch (error: any) {
    console.error("moneybird-connect error", error);
    return new Response(JSON.stringify({ error: error?.message ?? String(error) }), { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } });
  }
});