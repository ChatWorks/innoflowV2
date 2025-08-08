import "https://deno.land/x/xhr@0.1.0/mod.ts";
import { serve } from "https://deno.land/std@0.168.0/http/server.ts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

function fmtDateNL(d: Date) {
  return d.toLocaleDateString("nl-NL", { timeZone: "Europe/Amsterdam" });
}

function daysBetween(from: Date, to: Date) {
  const ms = new Date(to).getTime() - new Date(from).getTime();
  return Math.max(1, Math.ceil(ms / (1000 * 60 * 60 * 24)));
}

function buildMock(range: { from: Date; to: Date }) {
  const days = daysBetween(range.from, range.to);
  const points = Array.from({ length: days }).map((_, i) => {
    const date = new Date(range.from);
    date.setDate(range.from.getDate() + i);
    const revenue = 500 + ((i * 73) % 900);
    const costs = 300 + ((i * 41) % 500);
    const cashIn = revenue * (0.9 + ((i % 3) / 100));
    const cashOut = costs * (0.95 + ((i % 5) / 100));
    return {
      date: fmtDateNL(date),
      revenue,
      costs,
      cumRevenue: 0,
      cumCosts: 0,
      cashNet: cashIn - cashOut,
    };
  });
  let r = 0,
    c = 0;
  points.forEach((p) => {
    r += p.revenue;
    c += p.costs;
    p.cumRevenue = r;
    p.cumCosts = c;
  });
  const kpis = {
    revenueExcl: points.reduce((s, p) => s + p.revenue, 0),
    costsExcl: points.reduce((s, p) => s + p.costs, 0),
    profitExcl:
      points.reduce((s, p) => s + p.revenue, 0) -
      points.reduce((s, p) => s + p.costs, 0),
    cashNet: points.reduce((s, p) => s + p.cashNet, 0),
  };
  const details = points.slice(0, Math.min(20, points.length)).map((p, i) => ({
    date: p.date,
    type: i % 4 === 0 ? "Verkoop" : i % 4 === 1 ? "Inkoop" : i % 4 === 2 ? "Bon" : "Mutatie",
    description: `Transactie ${i + 1}`,
    counterparty: i % 2 ? "Klant BV" : "Leverancier NV",
    ledger: i % 3 ? "revenue" : "expenses",
    amountExcl: i % 2 ? p.revenue * 0.2 : p.costs * 0.25,
    vat: 0.21,
    amountIncl: (i % 2 ? p.revenue * 0.2 : p.costs * 0.25) * 1.21,
    status: i % 2 ? "paid" : "open",
    link: "#",
  }));
  return { points, kpis, details };
}

serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const body = await req.json().catch(() => ({}));
    const fromStr: string = body?.from;
    const toStr: string = body?.to;
    const basis: string = body?.basis || "accrual";
    const grouping: string = body?.grouping || "none";
    const bucket: string = body?.bucket || "day";

    if (!fromStr || !toStr) {
      return new Response(
        JSON.stringify({ error: "Missing 'from' or 'to' date" }),
        { status: 400, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    const from = new Date(fromStr);
    const to = new Date(toStr);

    const token = Deno.env.get("MONEYBIRD_PAT");
    if (!token) {
      return new Response(
        JSON.stringify({ connected: false, error: "Moneybird PAT not configured" }),
        { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }

    // Try to fetch administrations to validate the PAT
    let administrationId: string | null = null;
    try {
      const resp = await fetch("https://moneybird.com/api/v2/administrations.json", {
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
      });
      if (resp.ok) {
        const admins = await resp.json();
        if (Array.isArray(admins) && admins.length) {
          administrationId = String(admins[0].id ?? admins[0].administration_id ?? admins[0].slug ?? "");
        }
      }
    } catch (e) {
      console.warn("Failed to read administrations from Moneybird", e);
    }

    // NOTE: For the first version we return mock aggregates but include connection proof
    const mock = buildMock({ from, to });

    return new Response(
      JSON.stringify({
        connected: Boolean(administrationId),
        administrationId,
        basis,
        grouping,
        bucket,
        ...mock,
        source: administrationId ? "moneybird-valid-pat-mock-aggregates" : "mock-only",
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (error: any) {
    console.error("moneybird-aggregates error", error);
    return new Response(JSON.stringify({ error: error?.message ?? "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
