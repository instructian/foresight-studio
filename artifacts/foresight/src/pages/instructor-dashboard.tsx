import { useMemo, useState } from "react";
import {
  useGetDashboardSummary,
  useGetConfig,
  useGetParticipation,
  useGetCategoryCoverage,
} from "@workspace/api-client-react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Link } from "wouter";
import {
  Users,
  Radio,
  TrendingUp,
  AlertCircle,
  Settings,
  Map as MapIcon,
  Download,
  ArrowUp,
  ArrowDown,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  Legend,
  CartesianGrid,
} from "recharts";

type SortKey =
  | "studentName"
  | "signalsSubmitted"
  | "trendsCount"
  | "scenariosCount"
  | "commentsCount"
  | "lastActiveAt";

const PALETTE = [
  "#4f46e5",
  "#0ea5e9",
  "#10b981",
  "#f59e0b",
  "#ef4444",
  "#8b5cf6",
  "#ec4899",
];

export default function InstructorDashboard() {
  const { data: summary, isLoading: isLoadingSummary } =
    useGetDashboardSummary();
  const { data: config } = useGetConfig();
  const { data: participation } = useGetParticipation();
  const { data: coverage } = useGetCategoryCoverage();

  const [sortKey, setSortKey] = useState<SortKey>("signalsSubmitted");
  const [sortDir, setSortDir] = useState<"asc" | "desc">("desc");

  const sorted = useMemo(() => {
    const list = [...(participation ?? [])];
    list.sort((a, b) => {
      const av = (a as unknown as Record<string, unknown>)[sortKey];
      const bv = (b as unknown as Record<string, unknown>)[sortKey];
      if (av == null && bv == null) return 0;
      if (av == null) return 1;
      if (bv == null) return -1;
      const cmp =
        typeof av === "number" && typeof bv === "number"
          ? av - bv
          : String(av).localeCompare(String(bv));
      return sortDir === "asc" ? cmp : -cmp;
    });
    return list;
  }, [participation, sortKey, sortDir]);

  const headers: { key: SortKey; label: string; numeric?: boolean }[] = [
    { key: "studentName", label: "Student" },
    { key: "signalsSubmitted", label: "Signals", numeric: true },
    { key: "trendsCount", label: "Trends", numeric: true },
    { key: "scenariosCount", label: "Scenarios", numeric: true },
    { key: "commentsCount", label: "Comments", numeric: true },
    { key: "lastActiveAt", label: "Last active" },
  ];

  const onSort = (k: SortKey) => {
    if (k === sortKey) setSortDir(sortDir === "asc" ? "desc" : "asc");
    else {
      setSortKey(k);
      setSortDir(k === "studentName" ? "asc" : "desc");
    }
  };

  const chartData = useMemo(() => {
    if (!coverage) return [];
    return coverage.map((row) => ({
      name: row.studentName,
      ...row.counts,
    }));
  }, [coverage]);

  const categories = config?.categories ?? [];
  const studentsAtRisk = sorted.filter((p) => p.atRisk);

  if (isLoadingSummary) {
    return (
      <div className="p-8 max-w-7xl mx-auto space-y-4">
        <div className="h-10 w-64 bg-muted/40 rounded animate-pulse" />
        <div className="grid grid-cols-4 gap-4">
          {Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="h-28 bg-muted/30 rounded-lg animate-pulse" />
          ))}
        </div>
        <div className="h-72 bg-muted/30 rounded-lg animate-pulse" />
      </div>
    );
  }

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-end justify-between border-b border-border pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-serif font-bold text-foreground">
            Instructor Dashboard
          </h1>
          <p className="text-lg text-muted-foreground">
            {config?.courseTitle || "Speculative Design Studio"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" asChild>
            <a href="/api/export/participation.csv" download>
              <Download className="w-4 h-4 mr-2" /> Export participation CSV
            </a>
          </Button>
          <Button variant="outline" asChild>
            <a href="/api/export/signals.csv" download>
              <Download className="w-4 h-4 mr-2" /> Signals CSV
            </a>
          </Button>
          <Button asChild>
            <Link href="/instructor/settings">
              <Settings className="w-4 h-4 mr-2" /> Settings
            </Link>
          </Button>
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <SummaryCard
          icon={<Users className="h-4 w-4 text-muted-foreground" />}
          label="Active students"
          value={summary?.activeStudents ?? 0}
          hint={
            summary?.atRiskStudents
              ? `${summary.atRiskStudents} at risk`
              : "All on track"
          }
          hintTone={summary?.atRiskStudents ? "warn" : "ok"}
        />
        <SummaryCard
          icon={<Radio className="h-4 w-4 text-muted-foreground" />}
          label="Signals logged"
          value={summary?.totalSignals ?? 0}
          hint={`Avg ${summary?.averageSignalsPerStudent?.toFixed(1) ?? 0} per student`}
        />
        <SummaryCard
          icon={<TrendingUp className="h-4 w-4 text-muted-foreground" />}
          label="Trends synthesized"
          value={summary?.totalTrends ?? 0}
          hint="Classwide patterns"
        />
        <SummaryCard
          icon={<MapIcon className="h-4 w-4 text-muted-foreground" />}
          label="Scenarios built"
          value={summary?.totalScenarios ?? 0}
          hint={`${summary?.submittedScenarios ?? 0} submitted`}
        />
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-4">
          <h2 className="text-2xl font-serif font-semibold border-b border-border pb-2">
            Student participation
          </h2>
          <Card className="shadow-sm">
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-muted-foreground uppercase bg-muted/50 border-b border-border">
                  <tr>
                    {headers.map((h) => {
                      const active = sortKey === h.key;
                      const ariaSort = active
                        ? sortDir === "asc"
                          ? "ascending"
                          : "descending"
                        : "none";
                      return (
                        <th
                          key={h.key}
                          aria-sort={ariaSort}
                          className={`px-4 py-3 font-medium ${
                            h.numeric ? "text-right" : ""
                          }`}
                        >
                          <button
                            type="button"
                            onClick={() => onSort(h.key)}
                            className={`inline-flex items-center gap-1 hover:text-foreground transition-colors ${
                              active ? "text-foreground" : ""
                            }`}
                          >
                            {h.label}
                            {active &&
                              (sortDir === "asc" ? (
                                <ArrowUp className="w-3 h-3" />
                              ) : (
                                <ArrowDown className="w-3 h-3" />
                              ))}
                          </button>
                        </th>
                      );
                    })}
                    <th className="px-4 py-3 font-medium text-right">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((s) => (
                    <tr
                      key={s.studentId}
                      className={`border-b border-border last:border-b-0 hover:bg-muted/20 ${
                        s.atRisk
                          ? "border-l-2 border-l-amber-500 bg-amber-50/30"
                          : ""
                      }`}
                    >
                      <td className="px-4 py-3 font-medium text-foreground">
                        <Link
                          href={`/instructor/students/${s.studentId}`}
                          className="hover:text-primary hover:underline underline-offset-4"
                        >
                          {s.studentName}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        <span
                          className={
                            s.signalsSubmitted <
                            (config?.signalTargetPerStudent ?? 0) / 2
                              ? "text-destructive font-medium"
                              : "text-foreground"
                          }
                        >
                          {s.signalsSubmitted}
                        </span>
                        <span className="text-muted-foreground text-xs ml-1">
                          / {config?.signalTargetPerStudent ?? "—"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {s.trendsCount}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {s.scenariosCount}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {s.commentsCount}
                      </td>
                      <td className="px-4 py-3 text-muted-foreground text-xs">
                        {s.lastActiveAt
                          ? new Date(s.lastActiveAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-4 py-3 text-right">
                        {s.atRisk ? (
                          <Badge className="bg-amber-100 text-amber-900 border border-amber-300 hover:bg-amber-200">
                            At risk
                          </Badge>
                        ) : (
                          <Badge
                            variant="secondary"
                            className="bg-primary/10 text-primary border-none"
                          >
                            On track
                          </Badge>
                        )}
                      </td>
                    </tr>
                  ))}
                  {sorted.length === 0 && (
                    <tr>
                      <td
                        colSpan={headers.length + 1}
                        className="p-8 text-center text-muted-foreground"
                      >
                        No students yet — share the assignment link.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </Card>
        </div>

        <div className="space-y-4">
          <h2 className="text-2xl font-serif font-semibold border-b border-border pb-2">
            Attention needed
          </h2>
          {studentsAtRisk.length > 0 ? (
            studentsAtRisk.map((s) => (
              <Card
                key={s.studentId}
                className="border-amber-300 bg-amber-50/30 shadow-sm"
              >
                <CardHeader className="pb-2">
                  <CardTitle className="text-base flex justify-between items-center">
                    <Link
                      href={`/instructor/students/${s.studentId}`}
                      className="hover:underline"
                    >
                      {s.studentName}
                    </Link>
                    <AlertCircle className="w-4 h-4 text-amber-600" />
                  </CardTitle>
                </CardHeader>
                <CardContent className="text-sm space-y-1">
                  <p className="text-amber-900/80">
                    {s.signalsSubmitted} submitted signals
                  </p>
                  <p className="text-muted-foreground text-xs">
                    Last active{" "}
                    {s.lastActiveAt
                      ? new Date(s.lastActiveAt).toLocaleDateString()
                      : "never"}
                  </p>
                </CardContent>
              </Card>
            ))
          ) : (
            <Card className="bg-muted/20 border-dashed text-center p-6">
              <p className="text-sm text-muted-foreground">
                No students currently flagged.
              </p>
            </Card>
          )}
        </div>
      </div>

      <section className="space-y-3">
        <div className="flex justify-between items-end">
          <h2 className="text-2xl font-serif font-semibold border-b border-border pb-2 flex-1">
            PESTLE category coverage by student
          </h2>
        </div>
        <Card className="shadow-sm p-4">
          <div
            role="img"
            aria-label={`Stacked bar chart showing how each student's signals distribute across the ${categories.length} PESTLE categories`}
            className="w-full"
            style={{ height: 360 }}
          >
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-sm text-muted-foreground">
                No signals yet to chart.
              </div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={chartData}
                  layout="vertical"
                  margin={{ left: 24, right: 24, top: 8, bottom: 8 }}
                >
                  <CartesianGrid
                    strokeDasharray="2 4"
                    stroke="hsl(var(--border))"
                  />
                  <XAxis type="number" allowDecimals={false} />
                  <YAxis dataKey="name" type="category" width={140} />
                  <Tooltip />
                  <Legend />
                  {categories.map((c, i) => (
                    <Bar
                      key={c}
                      dataKey={c}
                      stackId="a"
                      fill={PALETTE[i % PALETTE.length]}
                    />
                  ))}
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
          <p className="sr-only">
            {coverage
              ?.map(
                (r) =>
                  `${r.studentName}: ${Object.entries(r.counts)
                    .map(([k, v]) => `${k} ${v}`)
                    .join(", ")}`,
              )
              .join("; ")}
          </p>
        </Card>
      </section>
    </div>
  );
}

function SummaryCard({
  icon,
  label,
  value,
  hint,
  hintTone,
}: {
  icon: React.ReactNode;
  label: string;
  value: number;
  hint: string;
  hintTone?: "warn" | "ok";
}) {
  return (
    <Card className="bg-card shadow-sm border-border">
      <CardHeader className="flex flex-row items-center justify-between pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        <div className="text-3xl font-serif font-bold text-foreground">
          {value}
        </div>
        <p
          className={`text-xs mt-1 ${
            hintTone === "warn"
              ? "text-amber-700 font-medium"
              : "text-muted-foreground"
          }`}
        >
          {hint}
        </p>
      </CardContent>
    </Card>
  );
}
