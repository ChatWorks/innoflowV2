import React, { useEffect, useMemo, useState } from "react";
import Layout from "@/components/Layout";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Table, TableBody, TableCaption, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";
import { CalendarIcon, Download, Info, Link as LinkIcon, RefreshCw } from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/integrations/supabase/client";
import { useSearchParams } from "react-router-dom";
import { ChartContainer, ChartLegend, ChartLegendContent, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart";
import { BarChart, Bar, Line, LineChart, XAxis, YAxis, CartesianGrid } from "recharts";
import { toast } from "sonner";
import { Input } from "@/components/ui/input";

// Types
type Basis = "cash" | "accrual";

type PeriodPreset =
  | "this_month"
  | "last_month"
  | "last_7_days"
  | "last_30_days"
  | "last_90_days"
  | "this_year"
  | "this_quarter"
  | "custom";

interface DateRange {
  from: Date;
  to: Date;
}

interface KPIData {
  revenueExcl: number;
  costsExcl: number;
  profitExcl: number;
  cashNet: number;
}

interface DetailRow {
  date: string;
  type: "Verkoop" | "Inkoop" | "Bon" | "Mutatie";
  description: string;
  counterparty?: string;
  ledger?: string;
  amountExcl: number;
  vat: number;
  amountIncl: number;
  status?: string;
  link?: string;
}

// Utils
const eur = new Intl.NumberFormat("nl-NL", { style: "currency", currency: "EUR" });
const fmtDate = (d: Date) => d.toLocaleDateString("nl-NL", { timeZone: "Europe/Amsterdam" });

function startOfMonth(d: Date) { const x = new Date(d); x.setDate(1); x.setHours(0,0,0,0); return x; }
function endOfMonth(d: Date) { const x = new Date(d); x.setMonth(x.getMonth()+1, 0); x.setHours(23,59,59,999); return x; }
function startOfYear(d: Date) { const x = new Date(d.getFullYear(), 0, 1); x.setHours(0,0,0,0); return x; }
function endOfYear(d: Date) { const x = new Date(d.getFullYear(), 11, 31, 23,59,59,999); return x; }
function startOfQuarter(d: Date) { const q = Math.floor(d.getMonth()/3); const x = new Date(d.getFullYear(), q*3, 1); x.setHours(0,0,0,0); return x; }
function endOfQuarter(d: Date) { const q = Math.floor(d.getMonth()/3); const x = new Date(d.getFullYear(), q*3+3, 0, 23,59,59,999); return x; }

function rangeFromPreset(preset: PeriodPreset, custom?: DateRange): DateRange {
  const now = new Date();
  let from = new Date();
  let to = new Date();
  switch (preset) {
    case "this_month":
      from = startOfMonth(now); to = endOfMonth(now); break;
    case "last_month": {
      const a = new Date(now.getFullYear(), now.getMonth()-1, 1);
      from = startOfMonth(a); to = endOfMonth(a); break;
    }
    case "last_7_days":
      to = new Date(now); from = new Date(now); from.setDate(now.getDate()-6); from.setHours(0,0,0,0); to.setHours(23,59,59,999); break;
    case "last_30_days":
      to = new Date(now); from = new Date(now); from.setDate(now.getDate()-29); from.setHours(0,0,0,0); to.setHours(23,59,59,999); break;
    case "last_90_days":
      to = new Date(now); from = new Date(now); from.setDate(now.getDate()-89); from.setHours(0,0,0,0); to.setHours(23,59,59,999); break;
    case "this_year":
      from = startOfYear(now); to = endOfYear(now); break;
    case "this_quarter":
      from = startOfQuarter(now); to = endOfQuarter(now); break;
    case "custom":
      if (custom) { from = custom.from; to = custom.to; }
      break;
  }
  return { from, to };
}

function daysBetween(from: Date, to: Date) {
  const ms = (new Date(to).getTime() - new Date(from).getTime());
  return Math.max(1, Math.ceil(ms / (1000*60*60*24)));
}

function bucketForRange(days: number): "day" | "week" | "month" {
  if (days <= 31) return "day";
  if (days <= 120) return "week";
  return "month";
}

function toCSV(rows: any[]): string {
  if (!rows.length) return "";
  const headers = Object.keys(rows[0]);
  const esc = (v: any) => `"${String(v ?? "").replace(/"/g, '""')}"`;
  return [headers.join(","), ...rows.map(r => headers.map(h => esc(r[h])).join(","))].join("\n");
}

// Mock data generator (deterministic-ish)
function mockData(range: DateRange) {
  const days = daysBetween(range.from, range.to);
  const points = Array.from({ length: days }).map((_, i) => {
    const date = new Date(range.from); date.setDate(range.from.getDate()+i);
    const revenue = 500 + ((i*73)%900);
    const costs = 300 + ((i*41)%500);
    const cashIn = revenue * (0.9 + ((i%3)/100));
    const cashOut = costs * (0.95 + ((i%5)/100));
    return {
      date: fmtDate(date),
      revenue, costs,
      cumRevenue: 0, cumCosts: 0,
      cashNet: cashIn - cashOut,
    };
  });
  let r=0,c=0; points.forEach(p => { r+=p.revenue; c+=p.costs; p.cumRevenue=r; p.cumCosts=c; });
  const kpis: KPIData = {
    revenueExcl: points.reduce((s,p)=>s+p.revenue,0),
    costsExcl: points.reduce((s,p)=>s+p.costs,0),
    profitExcl: points.reduce((s,p)=>s+p.revenue,0) - points.reduce((s,p)=>s+p.costs,0),
    cashNet: points.reduce((s,p)=>s+p.cashNet,0)
  };
  const details: DetailRow[] = points.slice(0, Math.min(20, points.length)).map((p,i) => ({
    date: p.date,
    type: (i%4===0?"Verkoop":i%4===1?"Inkoop":i%4===2?"Bon":"Mutatie"),
    description: `Transactie ${i+1}`,
    counterparty: i%2?"Klant BV":"Leverancier NV",
    ledger: i%3?"revenue":"expenses",
    amountExcl: i%2? p.revenue*0.2 : p.costs*0.25,
    vat: 0.21,
    amountIncl: (i%2? p.revenue*0.2 : p.costs*0.25) * 1.21,
    status: i%2?"paid":"open",
    link: "#"
  }));
  return { points, kpis, details };
}

const FINANCIEN_PREFS_KEY = "financien_prefs_v1";

export default function Financien() {
  const [searchParams, setSearchParams] = useSearchParams();

  const [preset, setPreset] = useState<PeriodPreset>(() => {
    const fromUrl = searchParams.get("preset") as PeriodPreset | null;
    if (fromUrl) return fromUrl;
    try {
      const raw = localStorage.getItem(FINANCIEN_PREFS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.preset) return s.preset as PeriodPreset;
      }
    } catch {}
    return "this_month";
  });

  const [basis, setBasis] = useState<Basis>(() => {
    const fromUrl = searchParams.get("basis") as Basis | null;
    if (fromUrl) return fromUrl;
    try {
      const raw = localStorage.getItem(FINANCIEN_PREFS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.basis) return s.basis as Basis;
      }
    } catch {}
    return "accrual";
  });

  const [grouping, setGrouping] = useState<string>(() => {
    const fromUrl = searchParams.get("grouping");
    if (fromUrl) return fromUrl;
    try {
      const raw = localStorage.getItem(FINANCIEN_PREFS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.grouping) return s.grouping as string;
      }
    } catch {}
    return "none";
  });

  const [customRange, setCustomRange] = useState<DateRange | undefined>(() => {
    try {
      const raw = localStorage.getItem(FINANCIEN_PREFS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (s.preset === "custom" && s.customFrom && s.customTo) {
          return { from: new Date(s.customFrom), to: new Date(s.customTo) } as DateRange;
        }
      }
    } catch {}
    return undefined;
  });

  const [mockMode, setMockMode] = useState<boolean>(() => {
    const fromUrl = searchParams.get("mock");
    if (fromUrl) return fromUrl === "1";
    try {
      const raw = localStorage.getItem(FINANCIEN_PREFS_KEY);
      if (raw) {
        const s = JSON.parse(raw);
        if (typeof s.mockMode === "boolean") return s.mockMode as boolean;
      }
    } catch {}
    return false;
  });

  const range = useMemo(() => rangeFromPreset(preset, customRange), [preset, customRange]);
  const bucket = useMemo(() => bucketForRange(daysBetween(range.from, range.to)), [range]);

  const [loading, setLoading] = useState(true);
  const [hasConnection, setHasConnection] = useState<boolean | null>(null);
  const [kpis, setKpis] = useState<KPIData>({ revenueExcl: 0, costsExcl: 0, profitExcl: 0, cashNet: 0 });
  const [chartData, setChartData] = useState<any[]>([]);
  const [details, setDetails] = useState<DetailRow[]>([]);
  const [showConnect, setShowConnect] = useState(false);
  const [connectToken, setConnectToken] = useState("");
  const [connectLabel, setConnectLabel] = useState("Moneybird");
  const [connecting, setConnecting] = useState(false);
  const [reloadTick, setReloadTick] = useState(0);

  useEffect(() => {
    document.title = "Financiën | Innoflow";
    const meta = document.querySelector('meta[name="description"]');
    if (meta) meta.setAttribute('content', 'Financiën dashboard met winst, omzet, kosten en cashflow.');
  }, []);

  useEffect(() => {
    const params: any = { preset, basis, grouping };
    if (mockMode) params.mock = "1";
    setSearchParams(params, { replace: true });
  }, [preset, basis, grouping, mockMode, setSearchParams]);

  // Bewaar voorkeuren lokaal zodat ze bij een volgend bezoek worden hersteld
  useEffect(() => {
    try {
      const toSave: any = { preset, basis, grouping, mockMode };
      if (preset === "custom" && customRange) {
        toSave.customFrom = customRange.from.toISOString();
        toSave.customTo = customRange.to.toISOString();
      }
      localStorage.setItem(FINANCIEN_PREFS_KEY, JSON.stringify(toSave));
    } catch {}
  }, [preset, basis, grouping, mockMode, customRange]);

  useEffect(() => {
    let active = true;
    async function load() {
      setLoading(true);
      try {
        // Live mode: call Edge Function; Mock mode: use local mock
        if (mockMode) {
          setHasConnection(null);
          const { points, kpis, details } = mockData(range);
          if (!active) return;
          setChartData(points);
          setKpis(kpis);
          setDetails(details);
          return;
        }

        const { data, error } = await supabase.functions.invoke('moneybird-aggregates', {
          body: {
            from: range.from.toISOString().slice(0, 10),
            to: range.to.toISOString().slice(0, 10),
            basis,
            grouping,
            bucket,
          },
        });
        if (error) throw error;

        if (!active) return;
        if (data && (data as any).kpis && (data as any).points) {
          setHasConnection(Boolean((data as any).connected ?? true));
          setKpis((data as any).kpis);
          setChartData((data as any).points);
          setDetails((data as any).details || []);
        } else {
          setHasConnection(false);
          const { points, kpis, details } = mockData(range);
          if (!active) return;
          setChartData(points);
          setKpis(kpis);
          setDetails(details);
        }
      } catch (e: any) {
        console.error(e);
        setHasConnection(false);
        toast.error("Kon financiële data niet laden. Probeer het opnieuw.");
        const { points, kpis, details } = mockData(range);
        if (!active) return;
        setChartData(points);
        setKpis(kpis);
        setDetails(details);
      } finally {
        if (active) setLoading(false);
      }
    }
    load();
    return () => { active = false; };
  }, [range.from, range.to, basis, grouping, bucket, mockMode, reloadTick]);

  const subtitle = `${fmtDate(range.from)} – ${fmtDate(range.to)}`;

  const exportCSV = () => {
    const csv = toCSV(details);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `financien_${new Date().toISOString().slice(0,10)}.csv`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("CSV geëxporteerd");
  };
  const exportJSON = () => {
    const blob = new Blob([JSON.stringify({ kpis, details }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url; a.download = `financien_${new Date().toISOString().slice(0,10)}.json`;
    a.click(); URL.revokeObjectURL(url);
    toast.success("JSON geëxporteerd");
  };
  const copyLink = async () => {
    await navigator.clipboard.writeText(window.location.href);
    toast.success("Link gekopieerd");
  };

  const connectMoneybird = async () => {
    if (!connectToken.trim()) return;
    setConnecting(true);
    try {
      const { error } = await supabase.functions.invoke('moneybird-connect', {
        body: { token: connectToken.trim(), label: (connectLabel || 'Moneybird').trim() }
      });
      if (error) throw error;
      toast.success('Moneybird verbonden');
      setHasConnection(true);
      setShowConnect(false);
      setReloadTick(t => t + 1);
    } catch (e: any) {
      console.error(e);
      toast.error('Verbinding mislukt. Controleer je token.');
    } finally {
      setConnecting(false);
    }
  };

  return (
    <Layout>
      <div className="min-h-screen bg-background">
        <div className="container mx-auto px-6 py-8">
          <header className="mb-6 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <h1 className="text-3xl font-bold tracking-tight">Financiën</h1>
              <p className="text-muted-foreground">Overzicht van winst, omzet, kosten en cashflow</p>
            </div>
            <div className="flex flex-wrap items-center gap-3">
              {/* Presets */}
              <Select value={preset} onValueChange={(v: PeriodPreset) => setPreset(v)}>
                <SelectTrigger className="w-[200px]"><SelectValue placeholder="Periode" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="this_month">Deze maand</SelectItem>
                  <SelectItem value="last_month">Vorige maand</SelectItem>
                  <SelectItem value="last_7_days">Laatste 7 dagen</SelectItem>
                  <SelectItem value="last_30_days">Laatste 30 dagen</SelectItem>
                  <SelectItem value="last_90_days">Laatste 90 dagen</SelectItem>
                  <SelectItem value="this_year">Huidig jaar</SelectItem>
                  <SelectItem value="this_quarter">Kwartaal</SelectItem>
                  <SelectItem value="custom">Aangepast bereik</SelectItem>
                </SelectContent>
              </Select>

              {/* Custom range */}
              <Popover>
                <PopoverTrigger asChild>
                  <Button variant="outline" className={cn("w-[240px] justify-start", preset !== "custom" && "text-muted-foreground")}> 
                    <CalendarIcon className="mr-2 h-4 w-4" />
                    {preset === "custom" && customRange ? `${fmtDate(customRange.from)} – ${fmtDate(customRange.to)}` : "Kies datumbereik"}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                  <Calendar
                    mode="range"
                    selected={customRange as any}
                    onSelect={(val: any) => { if (val?.from && val?.to) { setCustomRange({ from: val.from, to: val.to }); setPreset("custom"); } }}
                    numberOfMonths={2}
                  />
                </PopoverContent>
              </Popover>

              {/* Basis toggle */}
              <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                <span className="text-sm text-muted-foreground">Accrual</span>
                <Switch checked={basis === "cash"} onCheckedChange={(v) => setBasis(v?"cash":"accrual")} aria-label="Cash basis" />
                <span className="text-sm">Cash</span>
              </div>

              {/* Groepering */}
              <Select value={grouping} onValueChange={(v: string) => setGrouping(v)}>
                <SelectTrigger className="w-[180px]"><SelectValue placeholder="Groepering" /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">Geen</SelectItem>
                  <SelectItem value="ledger_account">Grootboek</SelectItem>
                  <SelectItem value="project">Project</SelectItem>
                </SelectContent>
              </Select>

              {/* Mock toggle */}
              <div className="flex items-center gap-2 border rounded-md px-3 py-2">
                <span className="text-sm text-muted-foreground">Mock</span>
                <Switch checked={mockMode} onCheckedChange={(v) => setMockMode(v)} aria-label="Mock data" />
              </div>

              <Button variant="outline" onClick={() => window.location.reload()} className="gap-2">
                <RefreshCw className="h-4 w-4" /> Vernieuwen
              </Button>
            </div>
          </header>

          {hasConnection === false && (
            <div className="mb-6 p-4 border rounded-md space-y-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="font-medium">Nog geen Moneybird-verbinding</p>
                  <p className="text-sm text-muted-foreground">Verbind Moneybird om live data te laden. Tot die tijd tonen we mock-data.</p>
                </div>
                {!showConnect && (
                  <Button onClick={() => setShowConnect(true)}>Verbind Moneybird</Button>
                )}
              </div>
              {showConnect && (
                <div className="grid gap-3 md:grid-cols-5 items-center">
                  <div className="md:col-span-3">
                    <Input
                      placeholder="Moneybird Personal Access Token"
                      value={connectToken}
                      onChange={(e) => setConnectToken(e.target.value)}
                    />
                  </div>
                  <div className="md:col-span-2">
                    <Input
                      placeholder="Label (optioneel)"
                      value={connectLabel}
                      onChange={(e) => setConnectLabel(e.target.value)}
                    />
                  </div>
                  <div className="flex gap-2 md:col-span-5">
                    <Button onClick={connectMoneybird} disabled={connecting || !connectToken.trim()}>
                      {connecting ? 'Verbinden...' : 'Verbinden'}
                    </Button>
                    <Button variant="outline" onClick={() => setShowConnect(false)} disabled={connecting}>Annuleren</Button>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* KPI Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <KpiCard title="Winst (excl. btw)" value={eur.format(kpis.profitExcl)} subtitle={subtitle} tooltip="Winst = Omzet excl. btw − Kosten excl. btw. Cash: betaald; Accrual: op factuurdatum, status ≠ draft." />
            <KpiCard title="Omzet (excl. btw)" value={eur.format(kpis.revenueExcl)} subtitle={subtitle} tooltip="Som van verkoopfacturen (total_price_excl_tax). Cash: alleen betaald; Accrual: factuurdatum, status ≠ draft." />
            <KpiCard title="Kosten (excl. btw)" value={eur.format(kpis.costsExcl)} subtitle={subtitle} tooltip="Inkoopfacturen + bonnen (total_price_excl_tax) binnen periode." />
            <KpiCard title="Cashflow netto" value={eur.format(kpis.cashNet)} subtitle={subtitle} tooltip="Som van financiële mutaties: credits − debits binnen periode." />
          </div>

          {/* Charts */}
          <Card className="mb-6">
            <CardHeader className="pb-2">
              <CardTitle>Grafieken</CardTitle>
              <CardDescription>{bucket === "day" ? "Dagelijks" : bucket === "week" ? "Wekelijks" : "Maandelijks"}</CardDescription>
            </CardHeader>
            <CardContent>
              <Tabs defaultValue="revenue">
                <TabsList>
                  <TabsTrigger value="revenue">Omzet & Kosten</TabsTrigger>
                  <TabsTrigger value="cashflow">Cashflow</TabsTrigger>
                </TabsList>
                <TabsContent value="revenue" className="mt-4">
                  <ChartContainer
                    className="h-[320px]"
                    config={{
                      revenue: { label: "Omzet", color: "hsl(var(--primary))" },
                      costs: { label: "Kosten", color: "hsl(var(--muted-foreground))" },
                      cumRevenue: { label: "Cumulatief omzet", color: "hsl(var(--primary))" },
                      cumCosts: { label: "Cumulatief kosten", color: "hsl(var(--muted-foreground))" },
                    }}
                  >
                    <BarChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date"/>
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Bar dataKey="revenue" name="Omzet" fill="hsl(var(--primary))" />
                      <Bar dataKey="costs" name="Kosten" fill="hsl(var(--muted-foreground))" />
                      <Line type="monotone" dataKey="cumRevenue" name="Cumulatief omzet" stroke="hsl(var(--primary))" strokeDasharray="4 4" />
                      <Line type="monotone" dataKey="cumCosts" name="Cumulatief kosten" stroke="hsl(var(--muted-foreground))" strokeDasharray="4 4" />
                    </BarChart>
                  </ChartContainer>
                </TabsContent>
                <TabsContent value="cashflow" className="mt-4">
                  <ChartContainer
                    className="h-[320px]"
                    config={{
                      cashNet: { label: "Cashflow netto", color: "hsl(var(--primary))" },
                    }}
                  >
                    <LineChart data={chartData}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="date"/>
                      <YAxis />
                      <ChartTooltip content={<ChartTooltipContent />} />
                      <ChartLegend content={<ChartLegendContent />} />
                      <Line type="monotone" dataKey="cashNet" name="Cashflow netto" stroke="hsl(var(--primary))" />
                    </LineChart>
                  </ChartContainer>
                </TabsContent>
              </Tabs>
            </CardContent>
          </Card>

          {/* Actions */}
          <div className="flex items-center gap-2 mb-3">
            <Button variant="secondary" className="gap-2" onClick={exportCSV}><Download className="h-4 w-4"/> Export CSV</Button>
            <Button variant="secondary" className="gap-2" onClick={exportJSON}><Download className="h-4 w-4"/> Export JSON</Button>
            <Button variant="outline" className="gap-2" onClick={copyLink}><LinkIcon className="h-4 w-4"/> Kopieer link</Button>
          </div>

          {/* Detail table */}
          <Card>
            <CardHeader className="pb-2">
              <CardTitle>Details</CardTitle>
              <CardDescription>{subtitle}</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="w-full overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Datum</TableHead>
                      <TableHead>Type</TableHead>
                      <TableHead>Omschrijving</TableHead>
                      <TableHead>Tegenpartij</TableHead>
                      <TableHead>Grootboek</TableHead>
                      <TableHead>Excl. btw</TableHead>
                      <TableHead>Btw</TableHead>
                      <TableHead>Incl.</TableHead>
                      <TableHead>Status</TableHead>
                      <TableHead>Link</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {details.map((r, i) => (
                      <TableRow key={i}>
                        <TableCell>{r.date}</TableCell>
                        <TableCell>{r.type}</TableCell>
                        <TableCell>{r.description}</TableCell>
                        <TableCell>{r.counterparty ?? "-"}</TableCell>
                        <TableCell>{r.ledger ?? "-"}</TableCell>
                        <TableCell>{eur.format(r.amountExcl)}</TableCell>
                        <TableCell>{(r.vat*100).toFixed(0)}%</TableCell>
                        <TableCell>{eur.format(r.amountIncl)}</TableCell>
                        <TableCell>{r.status ?? "-"}</TableCell>
                        <TableCell>{r.link ? <a href={r.link} className="underline" target="_blank" rel="noreferrer">Open</a> : "-"}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                  <TableCaption>{loading ? "Laden..." : details.length ? `${details.length} rijen` : "Geen data beschikbaar"}</TableCaption>
                </Table>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}

function KpiCard({ title, value, subtitle, tooltip }: { title: string; value: string; subtitle: string; tooltip: string }) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base">{title}</CardTitle>
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button size="icon" variant="ghost" className="h-6 w-6" aria-label={`Info ${title}`}>
                  <Info className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent className="max-w-xs text-xs leading-relaxed">
                {tooltip}
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <CardDescription>{subtitle}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-bold">{value}</div>
      </CardContent>
    </Card>
  );
}
