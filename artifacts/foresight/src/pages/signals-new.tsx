import { useEffect, useMemo, useState } from "react";
import {
  useCreateSignal,
  useGetConfig,
  getListSignalsQueryKey,
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardFooter,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import {
  ChevronDown,
  ChevronUp,
  HelpCircle,
  Plus,
  Trash2,
  AlertCircle,
} from "lucide-react";

type SectionKey = "evidence" | "context" | "judgment";

interface SourceDraft {
  title: string;
  url: string;
  publication: string;
  publishedDate: string;
}

const HELP: Record<string, string> = {
  title: "A short, evocative headline (8–120 chars).",
  summary: "Plain-language description of what's actually happening.",
  category: "PESTLE / STEEP bucket. Use whichever fits best.",
  timeHorizon: "When this signal will likely be felt at scale.",
  novelty: "How established this signal already is in the discourse.",
  keywords: "Comma-separated tags that help others find this signal.",
  context:
    "Where, when, and to whom this is happening — anchor it in real life.",
  implications:
    "If this trend continues, what changes? Who wins, who loses, what becomes possible or impossible?",
  ethicsEquity:
    "Who is centered, who is sidelined, and what equity questions arise?",
  assumptions: "What you have to take on faith for this to matter.",
  unknowns: "What you still don't know — be honest.",
  leadingIndicators: "What you'd watch for to know this is accelerating.",
  strategicResponse: "How a thoughtful actor might respond now.",
};

function HelpDot({ id }: { id: string }) {
  const text = HELP[id] ?? "";
  const tipId = `help-${id}`;
  return (
    <span className="group relative inline-flex">
      <button
        type="button"
        aria-label="Field help"
        aria-describedby={tipId}
        className="inline-flex items-center justify-center rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-1"
      >
        <HelpCircle className="w-3.5 h-3.5 text-muted-foreground cursor-help" />
      </button>
      <span
        id={tipId}
        role="tooltip"
        className="invisible group-hover:visible group-focus-within:visible absolute left-5 top-0 z-20 w-64 p-2 text-xs bg-foreground text-background rounded-md shadow-lg leading-snug"
      >
        {text}
      </span>
    </span>
  );
}

export default function SignalNew() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createSignal = useCreateSignal();
  const { data: config } = useGetConfig();

  const categories = config?.categories ?? [
    "Political",
    "Economic",
    "Social",
    "Technological",
    "Legal",
    "Environmental",
  ];
  const horizons = config?.timeHorizons ?? ["0-2y", "2-5y", "5-10y", "10-25y"];
  const novelties = config?.novelties ?? [
    "weak",
    "emerging",
    "accelerating",
    "plateauing",
    "declining",
  ];

  const [open, setOpen] = useState<Record<SectionKey, boolean>>({
    evidence: true,
    context: true,
    judgment: false,
  });

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState(categories[0] ?? "Social");
  const [timeHorizon, setTimeHorizon] = useState(horizons[1] ?? "2-5y");
  const [novelty, setNovelty] = useState(novelties[1] ?? "emerging");
  const [keywords, setKeywords] = useState("");
  const [context, setContext] = useState("");
  const [implications, setImplications] = useState("");
  const [ethicsEquity, setEthicsEquity] = useState("");
  const [assumptions, setAssumptions] = useState("");
  const [unknowns, setUnknowns] = useState("");
  const [leadingIndicators, setLeadingIndicators] = useState("");
  const [strategicResponse, setStrategicResponse] = useState("");
  const [impactRating, setImpactRating] = useState(3);
  const [uncertaintyRating, setUncertaintyRating] = useState(3);
  const [plausibilityRating, setPlausibilityRating] = useState(3);
  const [sources, setSources] = useState<SourceDraft[]>([
    { title: "", url: "", publication: "", publishedDate: "" },
  ]);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [sourcePanelOpen, setSourcePanelOpen] = useState(false);
  const [errorList, setErrorList] = useState<{ id: string; msg: string }[]>([]);

  useEffect(() => {
    if (config?.categories?.length && !categories.includes(category)) {
      setCategory(config.categories[0]!);
    }
  }, [config, categories, category]);

  const validSourceCount = sources.filter(
    (s) => s.url.trim().length > 0 && s.title.trim().length > 0,
  ).length;

  const fieldErrors = useMemo(() => {
    const e: Record<string, string> = {};
    if (touched.title && (title.trim().length < 8 || title.length > 120))
      e.title = "Title should be 8–120 characters.";
    if (touched.summary && summary.trim().length < 20)
      e.summary = "Summary should be at least 20 characters.";
    if (touched.context && context.trim().length < 1 && open.context)
      e.context = "Context helps others trust the signal.";
    return e;
  }, [touched, title, summary, context, open.context]);

  const totalFields = 8;
  const filledFields = [
    title.trim().length >= 8,
    summary.trim().length >= 20,
    !!category,
    !!timeHorizon,
    !!novelty,
    keywords.trim().length > 0,
    context.trim().length > 0,
    validSourceCount >= 1,
  ].filter(Boolean).length;
  const completion = Math.round((filledFields / totalFields) * 100);

  const submit = async (status: "draft" | "submitted") => {
    setSubmitError(null);
    setErrorList([]);
    setTouched({ title: true, summary: true, context: true });
    if (status === "submitted") {
      const errs: { id: string; msg: string }[] = [];
      if (title.trim().length < 8)
        errs.push({ id: "title", msg: "Title needs at least 8 characters." });
      if (summary.trim().length < 20)
        errs.push({
          id: "summary",
          msg: "Summary needs at least 20 characters.",
        });
      if (validSourceCount < 1)
        errs.push({
          id: "sources-heading",
          msg: "Add at least one source with title and URL.",
        });
      if (errs.length) {
        setErrorList(errs);
        setSubmitError("Please fix the items below before submitting.");
        setOpen((s) => ({ ...s, evidence: true }));
        if (validSourceCount < 1) setSourcePanelOpen(true);
        return;
      }
    }
    try {
      const created = await createSignal.mutateAsync({
        data: {
          title: title.trim(),
          summary: summary.trim(),
          category,
          timeHorizon,
          novelty,
          keywords: keywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
          context: context.trim(),
          implications: implications.trim(),
          ethicsEquity: ethicsEquity.trim(),
          assumptions: assumptions.trim(),
          unknowns: unknowns.trim(),
          leadingIndicators: leadingIndicators.trim(),
          strategicResponse: strategicResponse.trim(),
          impactRating,
          uncertaintyRating,
          plausibilityRating,
          status,
          sources: sources
            .filter((s) => s.url.trim() && s.title.trim())
            .map((s) => ({
              title: s.title.trim(),
              url: s.url.trim(),
              publication: s.publication.trim() || null,
              publishedDate: s.publishedDate || null,
              type: "news" as const,
            })),
        },
      });
      queryClient.invalidateQueries({ queryKey: getListSignalsQueryKey() });
      setLocation(`/signals/${created.id}`);
    } catch (err: unknown) {
      const msg =
        (err as { response?: { data?: { error?: string } } })?.response?.data
          ?.error ?? "Could not save signal.";
      setSubmitError(msg);
    }
  };

  const Section = ({
    k,
    title: t,
    subtitle,
    children,
  }: {
    k: SectionKey;
    title: string;
    subtitle: string;
    children: React.ReactNode;
  }) => (
    <Card className="shadow-sm">
      <button
        type="button"
        onClick={() => setOpen((s) => ({ ...s, [k]: !s[k] }))}
        className="w-full"
        aria-expanded={open[k]}
      >
        <CardHeader className="flex flex-row items-center justify-between cursor-pointer hover:bg-muted/30 transition-colors">
          <div className="text-left">
            <CardTitle className="font-serif text-xl">{t}</CardTitle>
            <p className="text-sm text-muted-foreground mt-1">{subtitle}</p>
          </div>
          {open[k] ? (
            <ChevronUp className="w-5 h-5 text-muted-foreground" />
          ) : (
            <ChevronDown className="w-5 h-5 text-muted-foreground" />
          )}
        </CardHeader>
      </button>
      {open[k] && <CardContent className="space-y-5 pt-2">{children}</CardContent>}
    </Card>
  );

  const errorClass = (id: string) =>
    fieldErrors[id]
      ? "border-destructive focus-visible:ring-destructive"
      : "";

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-6">
      <header className="border-b border-border pb-6 space-y-3">
        <h1 className="text-4xl font-serif font-bold text-foreground">
          Log a Signal
        </h1>
        <p className="text-lg text-muted-foreground">
          Capture an early indicator of change. Every signal must trace back to
          a source.
        </p>
        <div className="space-y-1.5">
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Completion</span>
            <span>
              {completion}% · {validSourceCount} source
              {validSourceCount === 1 ? "" : "s"}
            </span>
          </div>
          <div className="h-1.5 bg-muted rounded-full overflow-hidden">
            <div
              className="h-full bg-primary transition-[width] duration-300"
              style={{ width: `${completion}%` }}
            />
          </div>
        </div>
      </header>

      {submitError && (
        <div
          role="alert"
          aria-live="assertive"
          className="p-4 border border-destructive/40 bg-destructive/5 rounded-md text-destructive text-sm space-y-2"
        >
          <div className="flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 mt-0.5 flex-none" />
            <span className="font-medium">{submitError}</span>
          </div>
          {errorList.length > 0 && (
            <ul className="list-disc list-inside ml-6 space-y-0.5">
              {errorList.map((er) => (
                <li key={er.id}>
                  <a
                    href={`#${er.id}`}
                    className="underline underline-offset-2 hover:text-destructive/80"
                    onClick={(e) => {
                      e.preventDefault();
                      const el = document.getElementById(er.id);
                      if (el) {
                        el.scrollIntoView({ behavior: "smooth", block: "center" });
                        if (er.id === "sources-heading") setSourcePanelOpen(true);
                        else (el as HTMLElement).focus?.();
                      }
                    }}
                  >
                    {er.msg}
                  </a>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}

      <Section
        k="evidence"
        title="1 · Evidence"
        subtitle="Title, summary, and where you saw this."
      >
        <div className="space-y-2">
          <Label htmlFor="title" className="flex items-center gap-1.5">
            Title <HelpDot id="title" />
          </Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, title: true }))}
            placeholder="e.g. Community colleges pilot AI tutors at scale"
            className={errorClass("title")}
          />
          {fieldErrors.title && (
            <p className="text-xs text-destructive" aria-live="polite">
              {fieldErrors.title}
            </p>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="summary" className="flex items-center gap-1.5">
            Summary <HelpDot id="summary" />
          </Label>
          <Textarea
            id="summary"
            value={summary}
            onChange={(e) => setSummary(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, summary: true }))}
            placeholder="In a paragraph: what is happening, where, and why it caught your attention?"
            className={`h-28 ${errorClass("summary")}`}
          />
          {fieldErrors.summary && (
            <p className="text-xs text-destructive" aria-live="polite">
              {fieldErrors.summary}
            </p>
          )}
        </div>

        <div className="space-y-3" id="sources-heading" tabIndex={-1}>
          <div className="flex items-center justify-between">
            <Label className="text-base">
              Sources{" "}
              <span className="text-muted-foreground font-normal">
                ({validSourceCount} added)
              </span>
            </Label>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={() => setSourcePanelOpen(true)}
              aria-haspopup="dialog"
              aria-expanded={sourcePanelOpen}
            >
              Manage sources
            </Button>
          </div>
          <p className="text-xs text-muted-foreground">
            At least one source with title and URL is required to submit.
          </p>
          {sources.map((s, i) => (
            <div
              key={i}
              className="grid grid-cols-1 md:grid-cols-2 gap-2 p-3 border border-border rounded-lg bg-muted/20"
            >
              <Input
                placeholder="Source title *"
                value={s.title}
                onChange={(e) => {
                  const next = [...sources];
                  next[i] = { ...next[i]!, title: e.target.value };
                  setSources(next);
                }}
              />
              <Input
                placeholder="https://… *"
                value={s.url}
                onChange={(e) => {
                  const next = [...sources];
                  next[i] = { ...next[i]!, url: e.target.value };
                  setSources(next);
                }}
              />
              <Input
                placeholder="Publication"
                value={s.publication}
                onChange={(e) => {
                  const next = [...sources];
                  next[i] = { ...next[i]!, publication: e.target.value };
                  setSources(next);
                }}
              />
              <div className="flex gap-2">
                <Input
                  type="date"
                  value={s.publishedDate}
                  onChange={(e) => {
                    const next = [...sources];
                    next[i] = { ...next[i]!, publishedDate: e.target.value };
                    setSources(next);
                  }}
                />
                {sources.length > 1 && (
                  <Button
                    type="button"
                    variant="ghost"
                    size="icon"
                    onClick={() =>
                      setSources(sources.filter((_, j) => j !== i))
                    }
                    aria-label="Remove source"
                  >
                    <Trash2 className="w-4 h-4 text-muted-foreground" />
                  </Button>
                )}
              </div>
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            size="sm"
            onClick={() =>
              setSources([
                ...sources,
                { title: "", url: "", publication: "", publishedDate: "" },
              ])
            }
            className="gap-1.5"
          >
            <Plus className="w-3.5 h-3.5" /> Add another source
          </Button>
        </div>
      </Section>

      <Section
        k="context"
        title="2 · Context"
        subtitle="Categorisation and the world this signal lives in."
      >
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="space-y-2">
            <Label htmlFor="category" className="flex items-center gap-1.5">
              Category <HelpDot id="category" />
            </Label>
            <select
              id="category"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {categories.map((c) => (
                <option key={c}>{c}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="horizon" className="flex items-center gap-1.5">
              Time horizon <HelpDot id="timeHorizon" />
            </Label>
            <select
              id="horizon"
              value={timeHorizon}
              onChange={(e) => setTimeHorizon(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              {horizons.map((h) => (
                <option key={h}>{h}</option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="novelty" className="flex items-center gap-1.5">
              Novelty <HelpDot id="novelty" />
            </Label>
            <select
              id="novelty"
              value={novelty}
              onChange={(e) => setNovelty(e.target.value)}
              className="flex h-10 w-full rounded-md border border-input bg-background px-3 text-sm capitalize"
            >
              {novelties.map((n) => (
                <option key={n} className="capitalize">
                  {n}
                </option>
              ))}
            </select>
          </div>
        </div>
        <div className="space-y-2">
          <Label htmlFor="keywords" className="flex items-center gap-1.5">
            Keywords <HelpDot id="keywords" />
          </Label>
          <Input
            id="keywords"
            value={keywords}
            onChange={(e) => setKeywords(e.target.value)}
            placeholder="comma, separated, tags"
          />
          {keywords && (
            <div className="flex flex-wrap gap-1.5 pt-1">
              {keywords
                .split(",")
                .map((k) => k.trim())
                .filter(Boolean)
                .map((k) => (
                  <Badge key={k} variant="secondary" className="font-normal">
                    {k}
                  </Badge>
                ))}
            </div>
          )}
        </div>
        <div className="space-y-2">
          <Label htmlFor="context" className="flex items-center gap-1.5">
            Context <HelpDot id="context" />
          </Label>
          <Textarea
            id="context"
            value={context}
            onChange={(e) => setContext(e.target.value)}
            onBlur={() => setTouched((t) => ({ ...t, context: true }))}
            placeholder="Where, when, and to whom this is happening."
            className={`h-24 ${errorClass("context")}`}
          />
          {fieldErrors.context && (
            <p className="text-xs text-destructive" aria-live="polite">
              {fieldErrors.context}
            </p>
          )}
        </div>
      </Section>

      <Section
        k="judgment"
        title="3 · Judgment"
        subtitle="Your interpretation, ratings, and implications."
      >
        <div className="space-y-2">
          <Label htmlFor="implications" className="flex items-center gap-1.5">
            Implications <HelpDot id="implications" />
          </Label>
          <Textarea
            id="implications"
            value={implications}
            onChange={(e) => setImplications(e.target.value)}
            placeholder="If this continues — what changes?"
            className="h-24"
          />
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label htmlFor="ethics" className="flex items-center gap-1.5">
              Ethics & equity <HelpDot id="ethicsEquity" />
            </Label>
            <Textarea
              id="ethics"
              value={ethicsEquity}
              onChange={(e) => setEthicsEquity(e.target.value)}
              className="h-20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="assumptions" className="flex items-center gap-1.5">
              Assumptions <HelpDot id="assumptions" />
            </Label>
            <Textarea
              id="assumptions"
              value={assumptions}
              onChange={(e) => setAssumptions(e.target.value)}
              className="h-20"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="unknowns" className="flex items-center gap-1.5">
              Unknowns <HelpDot id="unknowns" />
            </Label>
            <Textarea
              id="unknowns"
              value={unknowns}
              onChange={(e) => setUnknowns(e.target.value)}
              className="h-20"
            />
          </div>
          <div className="space-y-2">
            <Label
              htmlFor="leading"
              className="flex items-center gap-1.5"
            >
              Leading indicators <HelpDot id="leadingIndicators" />
            </Label>
            <Textarea
              id="leading"
              value={leadingIndicators}
              onChange={(e) => setLeadingIndicators(e.target.value)}
              className="h-20"
            />
          </div>
        </div>
        <div className="space-y-2">
          <Label
            htmlFor="strategy"
            className="flex items-center gap-1.5"
          >
            Strategic response <HelpDot id="strategicResponse" />
          </Label>
          <Textarea
            id="strategy"
            value={strategicResponse}
            onChange={(e) => setStrategicResponse(e.target.value)}
            className="h-20"
          />
        </div>
        <div className="grid grid-cols-3 gap-4 pt-2">
          {[
            { label: "Impact", v: impactRating, set: setImpactRating },
            {
              label: "Uncertainty",
              v: uncertaintyRating,
              set: setUncertaintyRating,
            },
            {
              label: "Plausibility",
              v: plausibilityRating,
              set: setPlausibilityRating,
            },
          ].map(({ label, v, set }) => (
            <div key={label} className="space-y-2">
              <Label className="text-sm">
                {label}: <span className="text-primary">{v}</span> / 5
              </Label>
              <input
                type="range"
                min={1}
                max={5}
                value={v}
                onChange={(e) => set(parseInt(e.target.value, 10))}
                className="w-full accent-primary"
              />
            </div>
          ))}
        </div>
      </Section>

      <CardFooter className="flex justify-between border-t border-border pt-6 sticky bottom-0 bg-background/95 backdrop-blur z-10">
        <Button
          variant="outline"
          type="button"
          onClick={() => setLocation("/signals")}
        >
          Cancel
        </Button>
        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            disabled={createSignal.isPending}
            onClick={() => submit("draft")}
          >
            {createSignal.isPending ? "Saving…" : "Save Draft"}
          </Button>
          <Button
            type="button"
            disabled={createSignal.isPending}
            onClick={() => submit("submitted")}
          >
            {createSignal.isPending ? "Submitting…" : "Submit Signal"}
          </Button>
        </div>
      </CardFooter>

      {sourcePanelOpen && (
        <>
          <button
            type="button"
            aria-label="Close sources panel"
            className="fixed inset-0 z-40 bg-foreground/40"
            onClick={() => setSourcePanelOpen(false)}
          />
          <aside
            role="dialog"
            aria-modal="true"
            aria-labelledby="sources-panel-title"
            className="fixed top-0 right-0 z-50 h-full w-full sm:w-[28rem] bg-background border-l border-border shadow-xl flex flex-col animate-in slide-in-from-right duration-200"
          >
            <div className="p-4 border-b border-border flex items-center justify-between">
              <div>
                <h2
                  id="sources-panel-title"
                  className="font-serif text-xl font-semibold"
                >
                  Sources
                </h2>
                <p className="text-xs text-muted-foreground mt-0.5">
                  At least one source with title + URL is required.
                </p>
              </div>
              <Button
                type="button"
                variant="ghost"
                size="icon"
                onClick={() => setSourcePanelOpen(false)}
                aria-label="Close"
              >
                <Trash2 className="w-4 h-4 sr-only" />
                ✕
              </Button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-3">
              {sources.map((s, i) => (
                <div
                  key={i}
                  className="space-y-2 p-3 border border-border rounded-lg bg-muted/10"
                >
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-medium text-muted-foreground">
                      Source {i + 1}
                    </span>
                    {sources.length > 1 && (
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() =>
                          setSources(sources.filter((_, j) => j !== i))
                        }
                        aria-label={`Remove source ${i + 1}`}
                      >
                        <Trash2 className="w-4 h-4 text-muted-foreground" />
                      </Button>
                    )}
                  </div>
                  <Input
                    placeholder="Title *"
                    value={s.title}
                    onChange={(e) => {
                      const next = [...sources];
                      next[i] = { ...next[i]!, title: e.target.value };
                      setSources(next);
                    }}
                  />
                  <Input
                    placeholder="https://… *"
                    value={s.url}
                    onChange={(e) => {
                      const next = [...sources];
                      next[i] = { ...next[i]!, url: e.target.value };
                      setSources(next);
                    }}
                  />
                  <Input
                    placeholder="Publication"
                    value={s.publication}
                    onChange={(e) => {
                      const next = [...sources];
                      next[i] = { ...next[i]!, publication: e.target.value };
                      setSources(next);
                    }}
                  />
                  <Input
                    type="date"
                    value={s.publishedDate}
                    onChange={(e) => {
                      const next = [...sources];
                      next[i] = { ...next[i]!, publishedDate: e.target.value };
                      setSources(next);
                    }}
                  />
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                className="w-full"
                onClick={() =>
                  setSources([
                    ...sources,
                    { title: "", url: "", publication: "", publishedDate: "" },
                  ])
                }
              >
                <Plus className="w-4 h-4 mr-1" /> Add another source
              </Button>
            </div>
            <div className="p-4 border-t border-border flex justify-end">
              <Button type="button" onClick={() => setSourcePanelOpen(false)}>
                Done
              </Button>
            </div>
          </aside>
        </>
      )}
    </div>
  );
}
