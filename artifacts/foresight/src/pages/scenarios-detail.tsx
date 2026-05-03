import { useEffect, useMemo, useState } from "react";
import {
  useGetScenario,
  useUpdateScenario,
  useListSignals,
  useGetConfig,
  getGetScenarioQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useRoute, Link } from "wouter";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Textarea } from "@/components/ui/textarea";
import {
  ArrowLeft,
  ChevronRight,
  Check,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";

const STEPS = [
  "Select signals",
  "Time horizon",
  "Archetype",
  "Environment",
  "Vignette",
  "Problem statements",
  "Personas",
  "Journeys",
  "Traceability & submit",
] as const;

export default function ScenariosDetail() {
  const [, params] = useRoute("/scenarios/:id");
  const scenarioId = params?.id || "";
  const qc = useQueryClient();

  const { data: scenario, isLoading } = useGetScenario(scenarioId);
  const { data: config } = useGetConfig();
  const { data: signals } = useListSignals();
  const update = useUpdateScenario();

  const [step, setStep] = useState(0);
  const [signalIds, setSignalIds] = useState<string[]>([]);
  const [annotations, setAnnotations] = useState<
    { signalId: string; role: "key_driver" | "uncertainty" | "wildcard" | "supporting" }[]
  >([]);
  const [timeHorizon, setTimeHorizon] = useState("5-10y");
  const [archetype, setArchetype] = useState("Continuation");
  const [environmentDescription, setEnv] = useState("");
  const [vignette, setVignette] = useState("");
  const [problems, setProblems] = useState<
    { id: string; text: string; signalIds: string[] }[]
  >([]);
  const [personas, setPersonas] = useState<
    {
      id: string;
      name: string;
      role: string;
      background: string;
      needs: string;
      problemStatementId: string;
    }[]
  >([]);
  const [journeys, setJourneys] = useState<
    {
      id: string;
      personaId: string;
      steps: { label: string; detail: string; signalIds: string[] }[];
    }[]
  >([]);
  const [search, setSearch] = useState("");
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!scenario) return;
    setStep(scenario.currentStep ?? 0);
    setSignalIds(scenario.signalIds ?? []);
    setAnnotations(scenario.signalAnnotations ?? []);
    setTimeHorizon(scenario.timeHorizon || "5-10y");
    setArchetype(scenario.archetype || "Continuation");
    setEnv(scenario.environmentDescription || "");
    setVignette(scenario.vignette || "");
    setProblems(scenario.problemStatements ?? []);
    setPersonas(scenario.personas ?? []);
    setJourneys(scenario.journeys ?? []);
  }, [scenario]);

  const horizons = config?.timeHorizons ?? ["0-2y", "2-5y", "5-10y", "10-25y"];
  const archetypes = config?.archetypes ?? [
    "Continuation",
    "New Equilibrium",
    "Collapse",
    "Transformation",
  ];
  const minSignals = config?.scenarioMinSignals ?? 5;

  const allSignals = signals ?? [];
  const signalById = useMemo(() => {
    const m = new Map<string, (typeof allSignals)[number]>();
    for (const s of allSignals) m.set(s.id, s);
    return m;
  }, [allSignals]);
  const selected = signalIds.map((id) => signalById.get(id)).filter(Boolean);
  const filtered = allSignals
    .filter((s) => !signalIds.includes(s.id))
    .filter((s) =>
      search ? s.title.toLowerCase().includes(search.toLowerCase()) : true,
    );

  const save = async (
    patch: Record<string, unknown>,
    nextStep?: number,
  ): Promise<boolean> => {
    setError(null);
    try {
      await update.mutateAsync({
        id: scenarioId,
        data: {
          ...patch,
          ...(nextStep !== undefined ? { currentStep: nextStep } : {}),
        },
      });
      qc.invalidateQueries({ queryKey: getGetScenarioQueryKey(scenarioId) });
      return true;
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Could not save.";
      setError(msg);
      return false;
    }
  };

  const collectStepPatch = () => ({
    signalIds,
    signalAnnotations: annotations.filter((a) => signalIds.includes(a.signalId)),
    timeHorizon,
    archetype,
    environmentDescription,
    vignette,
    problemStatements: problems,
    personas,
    journeys,
  });

  const roleFor = (id: string) =>
    annotations.find((a) => a.signalId === id)?.role ?? "supporting";
  const setRole = (
    id: string,
    role: "key_driver" | "uncertainty" | "wildcard" | "supporting",
  ) =>
    setAnnotations([
      ...annotations.filter((a) => a.signalId !== id),
      { signalId: id, role },
    ]);
  const ROLE_STYLE: Record<string, string> = {
    key_driver: "bg-primary/10 text-primary border-primary/30",
    uncertainty: "bg-amber-100 text-amber-900 border-amber-300",
    wildcard: "bg-purple-100 text-purple-900 border-purple-300",
    supporting: "bg-muted text-muted-foreground border-border",
  };
  const ROLE_LABEL: Record<string, string> = {
    key_driver: "Key driver",
    uncertainty: "Uncertainty",
    wildcard: "Wildcard",
    supporting: "Supporting",
  };
  const RoleBadge = ({ id }: { id: string }) => {
    const r = roleFor(id);
    return (
      <span
        className={`text-[10px] px-1.5 py-0.5 rounded border ${ROLE_STYLE[r]}`}
      >
        {ROLE_LABEL[r]}
      </span>
    );
  };

  const goNext = async () => {
    const next = Math.min(step + 1, STEPS.length - 1);
    const ok = await save(collectStepPatch(), next);
    if (ok) setStep(next);
  };
  const goPrev = async () => {
    const prev = Math.max(step - 1, 0);
    const ok = await save(collectStepPatch(), prev);
    if (ok) setStep(prev);
  };
  const submit = async () => {
    if (signalIds.length < minSignals) {
      setError(`Add at least ${minSignals} signals before submitting.`);
      setStep(0);
      return;
    }
    await save({ ...collectStepPatch(), status: "submitted" });
  };

  if (isLoading) return <div className="p-8 text-center">Loading scenario…</div>;
  if (!scenario)
    return (
      <div className="p-8 text-center text-muted-foreground">
        Scenario not found.
      </div>
    );

  const submitted = scenario.status === "submitted";
  const gateMet = signalIds.length >= minSignals;

  return (
    <div className="p-8 max-w-6xl mx-auto space-y-6">
      <Link
        href="/scenarios"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Scenarios
      </Link>

      <header className="flex justify-between items-end border-b border-border pb-4">
        <div>
          <h1 className="text-3xl font-serif font-bold text-foreground">
            {scenario.title}
          </h1>
          <p className="text-sm text-muted-foreground mt-1">
            {submitted ? (
              <Badge>Submitted</Badge>
            ) : (
              <span>
                {signalIds.length} / {minSignals} signals attached
                {gateMet ? "" : " — need more to submit"}
              </span>
            )}
          </p>
        </div>
        <div className="text-sm text-muted-foreground">
          Step {step + 1} of {STEPS.length}: <span className="text-primary font-medium">{STEPS[step]}</span>
        </div>
      </header>

      <ol
        aria-label="Scenario builder steps"
        className="flex flex-wrap gap-x-1 gap-y-2 text-xs"
      >
        {STEPS.map((label, i) => {
          const done = i < step;
          const current = i === step;
          return (
            <li key={label}>
              <button
                type="button"
                disabled={i > step}
                onClick={() => i <= step && setStep(i)}
                className={`px-2.5 py-1 rounded-full border transition-colors ${
                  current
                    ? "border-primary bg-primary/10 text-primary font-medium"
                    : done
                      ? "border-border text-foreground hover:bg-muted/40"
                      : "border-border/40 text-muted-foreground"
                }`}
              >
                <span className="inline-flex items-center gap-1">
                  {done && <Check className="w-3 h-3" />}
                  {i + 1}. {label}
                </span>
              </button>
            </li>
          );
        })}
      </ol>

      {error && (
        <div
          role="alert"
          className="flex gap-2 items-start p-3 border border-destructive/40 bg-destructive/5 rounded-md text-destructive text-sm"
        >
          <AlertCircle className="w-4 h-4 mt-0.5 flex-none" />
          <span>{error}</span>
        </div>
      )}

      <Card className="shadow-sm">
        <CardContent className="p-6 space-y-6">
          {step === 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-3">
                <div className="flex items-baseline justify-between">
                  <h2 className="text-lg font-serif font-semibold">
                    Evidence board
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    Drag or use the role chips to label each signal
                  </span>
                </div>
                <p className="text-xs text-muted-foreground">
                  {signalIds.length} / {minSignals} attached
                </p>
                {selected.length === 0 ? (
                  <p className="text-sm text-muted-foreground border border-dashed rounded-md p-4">
                    No signals on the board yet. Drag from the right or click Add.
                  </p>
                ) : (
                  <ul
                    className="space-y-2 max-h-[28rem] overflow-y-auto pr-1"
                    onDragOver={(e) => e.preventDefault()}
                    onDrop={(e) => {
                      const id = e.dataTransfer.getData("text/signal-id");
                      if (id && !signalIds.includes(id))
                        setSignalIds([...signalIds, id]);
                    }}
                  >
                    {selected.map((s) => (
                      <li
                        key={s!.id}
                        draggable
                        onDragStart={(e) =>
                          e.dataTransfer.setData("text/signal-id", s!.id)
                        }
                        className="p-3 border border-border rounded-md bg-card cursor-move shadow-sm space-y-2"
                      >
                        <div className="flex items-start gap-2">
                          <div className="flex-1 text-sm">
                            <div className="font-medium leading-tight">
                              {s!.title}
                            </div>
                            <div className="text-xs text-muted-foreground mt-1 flex gap-1.5 items-center">
                              <Badge variant="outline" className="text-[10px]">
                                {s!.category}
                              </Badge>
                              <span>By {s!.authorName}</span>
                            </div>
                          </div>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            onClick={() => {
                              setSignalIds(signalIds.filter((id) => id !== s!.id));
                              setAnnotations(
                                annotations.filter((a) => a.signalId !== s!.id),
                              );
                            }}
                            aria-label="Remove from board"
                          >
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </div>
                        <div className="flex flex-wrap gap-1">
                          {(
                            [
                              "key_driver",
                              "uncertainty",
                              "wildcard",
                              "supporting",
                            ] as const
                          ).map((r) => {
                            const active = roleFor(s!.id) === r;
                            return (
                              <button
                                type="button"
                                key={r}
                                onClick={() => setRole(s!.id, r)}
                                aria-pressed={active}
                                className={`text-[10px] px-1.5 py-0.5 rounded border transition ${
                                  active
                                    ? ROLE_STYLE[r]
                                    : "border-border text-muted-foreground hover:bg-muted/40"
                                }`}
                              >
                                {ROLE_LABEL[r]}
                              </button>
                            );
                          })}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="space-y-3">
                <h2 className="text-lg font-serif font-semibold">
                  Available signals
                </h2>
                <Input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search…"
                />
                <ul className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
                  {filtered.map((s) => (
                    <li
                      key={s.id}
                      draggable
                      onDragStart={(e) =>
                        e.dataTransfer.setData("text/signal-id", s.id)
                      }
                      className="flex items-start gap-2 p-2 border border-border rounded-md hover:bg-muted/40 cursor-move"
                    >
                      <div className="flex-1 text-sm">
                        <div className="font-medium">{s.title}</div>
                        <div className="text-xs text-muted-foreground mt-0.5">
                          {s.category} · {s.authorName}
                        </div>
                      </div>
                      <Button
                        type="button"
                        size="sm"
                        variant="outline"
                        onClick={() => setSignalIds([...signalIds, s.id])}
                      >
                        <Plus className="w-3 h-3 mr-1" /> Add
                      </Button>
                    </li>
                  ))}
                  {filtered.length === 0 && (
                    <li className="text-xs text-muted-foreground">
                      No more signals available.
                    </li>
                  )}
                </ul>
              </div>
            </div>
          )}

          {step === 1 && (
            <div className="space-y-3 max-w-md">
              <Label>Time horizon</Label>
              <select
                value={timeHorizon}
                onChange={(e) => setTimeHorizon(e.target.value)}
                className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
              >
                {horizons.map((h) => (
                  <option key={h}>{h}</option>
                ))}
              </select>
            </div>
          )}

          {step === 2 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {archetypes.map((a) => (
                <button
                  type="button"
                  key={a}
                  onClick={() => setArchetype(a)}
                  className={`text-left p-4 rounded-md border transition-colors ${
                    archetype === a
                      ? "border-primary bg-primary/10"
                      : "border-border hover:bg-muted/40"
                  }`}
                >
                  <div className="font-serif text-lg font-medium">{a}</div>
                </button>
              ))}
            </div>
          )}

          {step === 3 && (
            <div className="space-y-2">
              <Label htmlFor="env">Environment</Label>
              <Textarea
                id="env"
                value={environmentDescription}
                onChange={(e) => setEnv(e.target.value)}
                className="h-48 text-base"
                placeholder="What are the macro conditions? Political, economic, social, technological climate."
              />
            </div>
          )}

          {step === 4 && (
            <div className="space-y-2">
              <Label htmlFor="vig">Vignette</Label>
              <Textarea
                id="vig"
                value={vignette}
                onChange={(e) => setVignette(e.target.value)}
                className="h-64 text-base font-serif"
                placeholder="A short narrative bringing one moment of this future to life."
              />
            </div>
          )}

          {step === 5 && (
            <div className="space-y-3">
              {problems.map((p, i) => (
                <div
                  key={p.id}
                  className="p-3 border border-border rounded-md space-y-2 bg-muted/20"
                >
                  <Textarea
                    value={p.text}
                    onChange={(e) => {
                      const n = [...problems];
                      n[i] = { ...p, text: e.target.value };
                      setProblems(n);
                    }}
                    placeholder="Problem statement…"
                    className="h-20"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setProblems(problems.filter((x) => x.id !== p.id))
                    }
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setProblems([
                    ...problems,
                    {
                      id: crypto.randomUUID(),
                      text: "",
                      signalIds: [],
                    },
                  ])
                }
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add problem statement
              </Button>
            </div>
          )}

          {step === 6 && (
            <div className="space-y-3">
              {personas.map((p, i) => (
                <div
                  key={p.id}
                  className="p-3 border border-border rounded-md space-y-2 bg-muted/20"
                >
                  <div className="grid grid-cols-2 gap-2">
                    <Input
                      value={p.name}
                      onChange={(e) => {
                        const n = [...personas];
                        n[i] = { ...p, name: e.target.value };
                        setPersonas(n);
                      }}
                      placeholder="Name"
                    />
                    <Input
                      value={p.role}
                      onChange={(e) => {
                        const n = [...personas];
                        n[i] = { ...p, role: e.target.value };
                        setPersonas(n);
                      }}
                      placeholder="Role"
                    />
                  </div>
                  <Textarea
                    value={p.background}
                    onChange={(e) => {
                      const n = [...personas];
                      n[i] = { ...p, background: e.target.value };
                      setPersonas(n);
                    }}
                    placeholder="Background"
                    className="h-16"
                  />
                  <Textarea
                    value={p.needs}
                    onChange={(e) => {
                      const n = [...personas];
                      n[i] = { ...p, needs: e.target.value };
                      setPersonas(n);
                    }}
                    placeholder="Needs"
                    className="h-16"
                  />
                  <Button
                    size="sm"
                    variant="ghost"
                    onClick={() =>
                      setPersonas(personas.filter((x) => x.id !== p.id))
                    }
                  >
                    <Trash2 className="w-4 h-4 mr-1" /> Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() =>
                  setPersonas([
                    ...personas,
                    {
                      id: crypto.randomUUID(),
                      name: "",
                      role: "",
                      background: "",
                      needs: "",
                      problemStatementId: problems[0]?.id ?? "",
                    },
                  ])
                }
              >
                <Plus className="w-3.5 h-3.5 mr-1" /> Add persona
              </Button>
            </div>
          )}

          {step === 7 && (
            <div className="space-y-3">
              {personas.length === 0 && (
                <p className="text-sm text-muted-foreground">
                  Add personas first to map their journeys.
                </p>
              )}
              {personas.map((p) => {
                const j = journeys.find((x) => x.personaId === p.id);
                return (
                  <div
                    key={p.id}
                    className="p-3 border border-border rounded-md bg-muted/20 space-y-2"
                  >
                    <h3 className="font-medium">{p.name || "Unnamed persona"}</h3>
                    <Textarea
                      value={j?.steps[0]?.detail ?? ""}
                      onChange={(e) => {
                        const next = journeys.filter(
                          (x) => x.personaId !== p.id,
                        );
                        next.push({
                          id: j?.id ?? crypto.randomUUID(),
                          personaId: p.id,
                          steps: [
                            {
                              label: "Day in the life",
                              detail: e.target.value,
                              signalIds: [],
                            },
                          ],
                        });
                        setJourneys(next);
                      }}
                      placeholder="A day in their life in this future…"
                      className="h-24"
                    />
                  </div>
                );
              })}
            </div>
          )}

          {step === 8 && (
            <div className="space-y-6">
              <div className="flex items-baseline justify-between border-b border-border pb-2">
                <h2 className="text-lg font-serif font-semibold">
                  Traceability map
                </h2>
                <span className="text-xs text-muted-foreground">
                  Every claim should trace back to a signal
                </span>
              </div>

              <div className="grid grid-cols-2 md:grid-cols-4 gap-2 text-center text-xs">
                {[
                  { l: "Signals", v: signalIds.length },
                  { l: "Problems", v: problems.length },
                  { l: "Personas", v: personas.length },
                  { l: "Journeys", v: journeys.length },
                ].map((c) => (
                  <div
                    key={c.l}
                    className="p-2 border border-border rounded-md bg-muted/20"
                  >
                    <div className="text-2xl font-serif font-bold text-foreground">
                      {c.v}
                    </div>
                    <div className="text-muted-foreground">{c.l}</div>
                  </div>
                ))}
              </div>

              {problems.length === 0 && (
                <p className="text-sm text-muted-foreground italic">
                  No problem statements yet — go back to step 6 to add some.
                </p>
              )}

              <ol className="space-y-4">
                {problems.map((p, i) => {
                  const linkedPersonas = personas.filter(
                    (per) => per.problemStatementId === p.id,
                  );
                  return (
                    <li
                      key={p.id}
                      className="border border-border rounded-md overflow-hidden"
                    >
                      <div className="bg-primary/5 p-3 border-b border-border">
                        <div className="text-xs uppercase tracking-wider text-primary font-medium">
                          Problem {i + 1}
                        </div>
                        <p className="text-sm mt-1">
                          {p.text || (
                            <span className="italic text-muted-foreground">
                              (empty)
                            </span>
                          )}
                        </p>
                        {p.signalIds.length > 0 && (
                          <div className="flex flex-wrap gap-1 mt-2">
                            {p.signalIds
                              .map((id) => signalById.get(id))
                              .filter(Boolean)
                              .map((s) => (
                                <span
                                  key={s!.id}
                                  className="inline-flex items-center gap-1 text-[11px] px-1.5 py-0.5 rounded border border-border bg-background"
                                  title={s!.title}
                                >
                                  {s!.title.slice(0, 32)}
                                  {s!.title.length > 32 ? "…" : ""}
                                  <RoleBadge id={s!.id} />
                                </span>
                              ))}
                          </div>
                        )}
                      </div>

                      <div className="divide-y divide-border">
                        {linkedPersonas.length === 0 && (
                          <div className="p-3 text-xs text-muted-foreground italic">
                            No personas linked to this problem.
                          </div>
                        )}
                        {linkedPersonas.map((per) => {
                          const j = journeys.find(
                            (x) => x.personaId === per.id,
                          );
                          return (
                            <div key={per.id} className="p-3 space-y-2">
                              <div className="text-sm">
                                <span className="font-medium">
                                  {per.name || "Unnamed persona"}
                                </span>
                                {per.role && (
                                  <span className="text-muted-foreground">
                                    {" "}
                                    — {per.role}
                                  </span>
                                )}
                              </div>
                              {j?.steps.map((stp, si) => (
                                <div
                                  key={si}
                                  className="ml-3 pl-3 border-l-2 border-border text-sm"
                                >
                                  <div className="text-xs text-muted-foreground">
                                    {stp.label}
                                  </div>
                                  <div className="whitespace-pre-wrap">
                                    {stp.detail || (
                                      <span className="italic text-muted-foreground">
                                        (empty)
                                      </span>
                                    )}
                                  </div>
                                  {stp.signalIds.length > 0 && (
                                    <div className="flex flex-wrap gap-1 mt-1">
                                      {stp.signalIds
                                        .map((id) => signalById.get(id))
                                        .filter(Boolean)
                                        .map((s) => (
                                          <span
                                            key={s!.id}
                                            className="text-[10px] px-1.5 py-0.5 rounded border border-border bg-muted/40"
                                          >
                                            {s!.title.slice(0, 24)}
                                            {s!.title.length > 24 ? "…" : ""}
                                          </span>
                                        ))}
                                    </div>
                                  )}
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </li>
                  );
                })}
              </ol>

              <div>
                <h3 className="text-sm font-medium mb-2 text-muted-foreground uppercase tracking-wider">
                  All attached signals
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {selected.map((s) => (
                    <div
                      key={s!.id}
                      className="p-2 border border-border rounded-md bg-muted/10 text-sm flex items-start justify-between gap-2"
                    >
                      <div>
                        <div className="font-medium leading-tight">
                          {s!.title}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {s!.category} · {s!.timeHorizon} · {s!.authorName}
                        </div>
                      </div>
                      <RoleBadge id={s!.id} />
                    </div>
                  ))}
                </div>
              </div>

              {!gateMet && (
                <p
                  role="alert"
                  className="text-sm text-destructive flex items-center gap-1.5"
                >
                  <AlertCircle className="w-4 h-4" /> Need at least {minSignals}{" "}
                  signals to submit ({signalIds.length} so far).
                </p>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <div className="flex justify-between items-center pt-2">
        <Button
          type="button"
          variant="outline"
          disabled={step === 0 || update.isPending}
          onClick={goPrev}
        >
          <ArrowLeft className="w-4 h-4 mr-2" /> Previous
        </Button>
        {step < STEPS.length - 1 ? (
          <Button
            type="button"
            disabled={update.isPending}
            onClick={goNext}
          >
            Save & continue <ChevronRight className="w-4 h-4 ml-2" />
          </Button>
        ) : (
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              disabled={update.isPending}
              onClick={() => save(collectStepPatch())}
            >
              Save draft
            </Button>
            <Button
              type="button"
              disabled={update.isPending || !gateMet || submitted}
              title={
                gateMet
                  ? ""
                  : `Add at least ${minSignals} signals to submit`
              }
              onClick={submit}
            >
              <Check className="w-4 h-4 mr-2" />
              {submitted ? "Submitted" : "Finish & submit"}
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
