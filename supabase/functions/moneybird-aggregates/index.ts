import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2";

// CORS for browser calls
const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

// Helpers
const toEUDate = (d: Date) => d.toLocaleDateString("nl-NL", { timeZone: "Europe/Amsterdam" });
const pad = (n: number) => (n < 10 ? `0${n}` : `${n}`);
const isoDate = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`;
const safeNumber = (v: any): number => {
  if (typeof v === "number") return v;
  if (typeof v === "string") return parseFloat(v.replace(",", ".")) || 0;
  return 0;
};

function daysBetween(from: Date, to: Date) {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

// Moneybird API client (PAT only)
async function mbFetch(path: string, token: string) {
  const url = `https://moneybird.com/api/v2/${path}`;
  const resp = await fetch(url, {
    headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
  });
  if (!resp.ok) {
    const text = await resp.text().catch(() => "");
    throw new Error(`Moneybird error ${resp.status} for ${path}: ${text}`);
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

async function getSalesInvoices(adminId: string, token: string, from: string, to: string) {
  // Try filtering by invoice_date; fallback to period if needed
  const filter = `invoice_date:${from}..${to},state:all`;
  const path = `${adminId}/sales_invoices.json?filter=${encodeURIComponent(filter)}`;
  try {
    const list = await mbFetch(path, token);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn("sales_invoices fetch failed, retrying with period filter", e);
    const filter2 = `period:${from}..${to},state:all`;
    const path2 = `${adminId}/sales_invoices.json?filter=${encodeURIComponent(filter2)}`;
    try {
      const list2 = await mbFetch(path2, token);
      return Array.isArray(list2) ? list2 : [];
    } catch (e2) {
      console.warn("sales_invoices period fetch failed", e2);
      return [];
    }
  }
}

async function getPurchaseInvoices(adminId: string, token: string, from: string, to: string) {
  const filter = `invoice_date:${from}..${to},state:all`;
  const path = `${adminId}/documents/purchase_invoices.json?filter=${encodeURIComponent(filter)}`;
  try {
    const list = await mbFetch(path, token);
    return Array.isArray(list) ? list : [];
  } catch (e) {
    console.warn("purchase_invoices fetch failed", e);
    return [];
  }
}

async function getReceipts(adminId: string, token: string, from: string, to: string) {
  // Some APIs use date, others receipt_date – try both
  const tryOnce = async (field: string) => {
    const filter = `${field}:${from}..${to}`;
    const path = `${adminId}/documents/receipts.json?filter=${encodeURIComponent(filter)}`;
    try {
      const list = await mbFetch(path, token);
      return Array.isArray(list) ? list : [];
    } catch {
      return [] as any[];
    }
  };
  const byDate = await tryOnce("date");
  if (byDate.length) return byDate;
  return await tryOnce("receipt_date");
}

function aggregateData(opts: {
  sales: any[];
  purchases: any[];
  receipts: any[];
  from: Date;
  to: Date;
  basis: "cash" | "accrual";
}) {
  const { sales, purchases, receipts, from, to, basis } = opts;
  const totalDays = daysBetween(from, to);
  const points = Array.from({ length: totalDays }).map((_, i) => {
    const d = new Date(from);
    d.setDate(from.getDate() + i);
    return {
      date: toEUDate(d),
      revenue: 0,
      costs: 0,
      cumRevenue: 0,
      cumCosts: 0,
      cashNet: 0,
    } as any;
  });
  const indexByDate = new Map<string, number>();
  points.forEach((p, idx) => indexByDate.set(p.date, idx));

  const addToDay = (dateStr: string, field: "revenue" | "costs" | "cashNet", value: number) => {
    const idx = indexByDate.get(dateStr);
    if (idx === undefined) return;
    (points[idx] as any)[field] += value;
  };

  let revenueExcl = 0;
  let costsExcl = 0;
  let cashNet = 0;

  // Sales invoices
  for (const inv of sales) {
    const invoiceDate = inv?.invoice_date ? new Date(inv.invoice_date) : null;
    const totalExcl = safeNumber(inv?.total_price_excl_tax ?? inv?.total_price_excl_tax_base);
    const payments: any[] = Array.isArray(inv?.payments) ? inv.payments : [];

    if (basis === "accrual") {
      if (invoiceDate && invoiceDate >= from && invoiceDate <= to) {
        revenueExcl += totalExcl;
        addToDay(toEUDate(invoiceDate), "revenue", totalExcl);
      }
    } else {
      // cash basis: sum payments in range
      for (const p of payments) {
        const pd = p?.payment_date ? new Date(p.payment_date) : null;
        const amount = safeNumber(p?.price) || safeNumber(p?.amount);
        if (pd && pd >= from && pd <= to) {
          revenueExcl += amount; // using paid amount as revenue on cash basis
          addToDay(toEUDate(pd), "revenue", amount);
          cashNet += amount;
          addToDay(toEUDate(pd), "cashNet", amount);
        }
      }
    }
  }

  // Purchases
  for (const doc of purchases) {
    const d = doc?.invoice_date ? new Date(doc.invoice_date) : null;
    const totalExcl = safeNumber(doc?.total_price_excl_tax ?? doc?.total_price_excl_tax_base);
    const payments: any[] = Array.isArray(doc?.payments) ? doc.payments : [];

    if (basis === "accrual") {
      if (d && d >= from && d <= to) {
        costsExcl += totalExcl;
        addToDay(toEUDate(d), "costs", totalExcl);
      }
    } else {
      for (const p of payments) {
        const pd = p?.payment_date ? new Date(p.payment_date) : null;
        const amount = safeNumber(p?.price) || safeNumber(p?.amount);
        if (pd && pd >= from && pd <= to) {
          costsExcl += amount;
          addToDay(toEUDate(pd), "costs", amount);
          cashNet -= amount;
          addToDay(toEUDate(pd), "cashNet", -amount);
        }
      }
    }
  }

  // Receipts (treated like purchases)
  for (const r of receipts) {
    const d = r?.date ? new Date(r.date) : r?.receipt_date ? new Date(r.receipt_date) : null;
    const totalExcl = safeNumber(r?.total_price_excl_tax ?? r?.total_price_excl_tax_base ?? r?.amount);
    if (basis === "accrual") {
      if (d && d >= from && d <= to) {
        costsExcl += totalExcl;
        addToDay(toEUDate(d), "costs", totalExcl);
      }
    } else {
      // receipts often don't expose payments; assume paid on date when on cash basis
      if (d && d >= from && d <= to) {
        costsExcl += totalExcl;
        addToDay(toEUDate(d), "costs", totalExcl);
        cashNet -= totalExcl;
        addToDay(toEUDate(d), "cashNet", -totalExcl);
      }
    }
  }

  // Cumulate
  let cr = 0,
    cc = 0;
  for (const p of points) {
    cr += p.revenue;
    cc += p.costs;
    p.cumRevenue = cr;
    p.cumCosts = cc;
  }

  const kpis = {
    revenueExcl,
    costsExcl,
    profitExcl: revenueExcl - costsExcl,
    cashNet,
  };

  // Basic details (limit 50)
  const details = [
    ...sales.map((inv: any) => ({
      date: toEUDate(inv?.invoice_date ? new Date(inv.invoice_date) : new Date()),
      type: "Verkoop",
      description: inv?.reference || inv?.invoice_id || inv?.id || "Verkoopfactuur",
      counterparty: inv?.contact?.company_name || inv?.contact?.name || inv?.contact?.customer_id || "-",
      ledger: "revenue",
      amountExcl: safeNumber(inv?.total_price_excl_tax ?? inv?.total_price_excl_tax_base),
      vat: 0.21,
      amountIncl: safeNumber(inv?.total_price) || safeNumber(inv?.total_price_incl_tax),
      status: inv?.state || "",
      link: inv?.url || inv?.web_url || undefined,
    })),
    ...purchases.map((doc: any) => ({
      date: toEUDate(doc?.invoice_date ? new Date(doc.invoice_date) : new Date()),
      type: "Inkoop",
      description: doc?.reference || doc?.id || "Inkoopfactuur",
      counterparty: doc?.contact?.company_name || doc?.contact?.name || "-",
      ledger: "expenses",
      amountExcl: safeNumber(doc?.total_price_excl_tax ?? doc?.total_price_excl_tax_base),
      vat: 0.21,
      amountIncl: safeNumber(doc?.total_price) || safeNumber(doc?.total_price_incl_tax),
      status: doc?.state || "",
      link: undefined,
    })),
    ...receipts.map((r: any) => ({
      date: toEUDate(r?.date ? new Date(r.date) : new Date()),
      type: "Bon",
      description: r?.reference || r?.id || "Bon",
      counterparty: r?.contact?.company_name || r?.contact?.name || "-",
      ledger: "expenses",
      amountExcl: safeNumber(r?.total_price_excl_tax ?? r?.total_price_excl_tax_base ?? r?.amount),
      vat: 0.21,
      amountIncl: safeNumber(r?.total_price) || safeNumber(r?.total_price_incl_tax) || safeNumber(r?.amount),
      status: r?.state || "",
      link: undefined,
    })),
  ].slice(0, 50);

  return { kpis, points, details };
}

serve(async (req) => {
  // Handle CORS preflight
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { from, to, basis = "accrual", grouping = "none", bucket = "day" } = await req
      .json()
      .catch(() => ({}) as any);

    if (!from || !to) {
      return new Response(JSON.stringify({ error: "Missing 'from' or 'to'" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Setup Supabase clients (user for auth, service for secure token read)
    const supabaseUrl = Deno.env.get("SUPABASE_URL");
    const supabaseAnon = Deno.env.get("SUPABASE_ANON_KEY");
    const supabaseService = Deno.env.get("SUPABASE_SERVICE_ROLE_KEY");
    if (!supabaseUrl || !supabaseAnon || !supabaseService) {
      return new Response(JSON.stringify({ error: "Supabase env not set" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const authHeader = req.headers.get("Authorization") || "";
    const sbUser = createClient(supabaseUrl, supabaseAnon, {
      global: { headers: { Authorization: authHeader } },
    });
    const sbService = createClient(supabaseUrl, supabaseService);

    // Require authenticated user
    const { data: userData, error: userError } = await sbUser.auth.getUser();
    const user = userData?.user || null;
    if (userError || !user) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve per-user Moneybird token (fallback to global only for owner)
    let token: string | null = null;
    let adminId: string | null = null;

    const { data: conn, error: connErr } = await sbService
      .from("moneybird_connections")
      .select("access_token, administration_id")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false })
      .limit(1)
      .maybeSingle();

    if (conn?.access_token) {
      token = conn.access_token as string;
      adminId = (conn.administration_id as string | null) ?? null;
    }

    if (!token) {
      const ownerEmail = "info@innoworks.ai";
      const globalToken = Deno.env.get("MONEYBIRD_PAT") || "";
      if (user.email === ownerEmail && globalToken) {
        token = globalToken;
      }
    }

    if (!token) {
      return new Response(JSON.stringify({ connected: false, message: "No Moneybird connection for this account" }), {
        status: 403,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Resolve administration
    if (!adminId) {
      adminId = await getFirstAdministrationId(token);
    }
    if (!adminId) {
      return new Response(JSON.stringify({ connected: false, message: "No administration found for token" }), {
        status: 200,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    // Fetch entities (best-effort)
    const [sales, purchases, receipts] = await Promise.all([
      getSalesInvoices(adminId, token, from, to),
      getPurchaseInvoices(adminId, token, from, to),
      getReceipts(adminId, token, from, to),
    ]);

    const fromDate = new Date(from);
    const toDate = new Date(to);

    const { kpis, points, details } = aggregateData({
      sales,
      purchases,
      receipts,
      from: fromDate,
      to: toDate,
      basis: basis === "cash" ? "cash" : "accrual",
    });

    const payload = {
      connected: true,
      administrationId: adminId,
      basis,
      grouping,
      bucket,
      kpis,
      points,
      details,
      source: "moneybird-live",
    };

    return new Response(JSON.stringify(payload), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (error: any) {
    console.error("moneybird-aggregates error", error);
    return new Response(JSON.stringify({ error: error?.message ?? String(error) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
