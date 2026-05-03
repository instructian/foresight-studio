import { useState, useMemo } from "react";
import {
  useGetCollection,
  useAddCollectionItem,
  useRemoveCollectionItem,
  useListSignals,
  useListTrends,
  useGetMe,
  getGetCollectionQueryKey,
} from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { useQueryClient } from "@tanstack/react-query";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import { ArrowLeft, Folder, Plus, Trash2, Search } from "lucide-react";

export default function CollectionDetail() {
  const [, params] = useRoute("/collections/:id");
  const collectionId = params?.id || "";
  const qc = useQueryClient();
  const me = useGetMe();

  const { data: collection, isLoading } = useGetCollection(collectionId);
  const signalsQ = useListSignals();
  const trendsQ = useListTrends();

  const allSignals = signalsQ.data ?? [];
  const allTrends = trendsQ.data ?? [];

  const signalById = useMemo(() => {
    const m = new Map<string, (typeof allSignals)[number]>();
    for (const s of allSignals) m.set(s.id, s);
    return m;
  }, [allSignals]);
  const trendById = useMemo(() => {
    const m = new Map<string, (typeof allTrends)[number]>();
    for (const t of allTrends) m.set(t.id, t);
    return m;
  }, [allTrends]);

  const [open, setOpen] = useState(false);
  const [pickKind, setPickKind] = useState<"signal" | "trend">("signal");
  const [pickedId, setPickedId] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [search, setSearch] = useState("");

  const addItem = useAddCollectionItem({
    mutation: {
      onSuccess: () => {
        qc.invalidateQueries({
          queryKey: getGetCollectionQueryKey(collectionId),
        });
        setOpen(false);
        setPickedId(null);
        setNote("");
        setSearch("");
      },
    },
  });
  const removeItem = useRemoveCollectionItem({
    mutation: {
      onSuccess: () =>
        qc.invalidateQueries({
          queryKey: getGetCollectionQueryKey(collectionId),
        }),
    },
  });

  if (isLoading) {
    return <div className="p-8 text-center">Loading collection...</div>;
  }
  if (!collection) {
    return (
      <div className="p-8 text-center text-muted-foreground">
        Collection not found.
      </div>
    );
  }

  const canEdit =
    me.data?.id === collection.ownerId || me.data?.role === "instructor";

  const existingIds = new Set(
    collection.items.filter((i) => i.kind === pickKind).map((i) => i.refId),
  );
  const candidates = (pickKind === "signal" ? allSignals : allTrends)
    .filter((x) => !existingIds.has(x.id))
    .filter((x) =>
      search
        ? x.title.toLowerCase().includes(search.toLowerCase())
        : true,
    );

  const handleAdd = () => {
    if (!pickedId) return;
    addItem.mutate({
      id: collectionId,
      data: { kind: pickKind, refId: pickedId, note: note.trim() },
    });
  };

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <Link
        href="/collections"
        className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
      >
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Collections
      </Link>

      <header className="space-y-4">
        <div className="flex justify-between items-start gap-4">
          <div className="space-y-2">
            <div className="flex gap-2 items-center text-sm text-muted-foreground">
              <Badge variant="outline" className="capitalize">
                {collection.visibility}
              </Badge>
              <span>•</span>
              <span>By {collection.ownerName}</span>
            </div>
            <h1 className="text-4xl font-serif font-bold text-foreground flex items-center gap-3">
              <Folder className="w-8 h-8 text-primary" />
              {collection.title}
            </h1>
            <p className="text-lg text-muted-foreground max-w-3xl leading-relaxed">
              {collection.description || "No description provided."}
            </p>
          </div>
          {canEdit && (
            <Dialog open={open} onOpenChange={setOpen}>
              <DialogTrigger asChild>
                <Button className="gap-2">
                  <Plus className="w-4 h-4" /> Add Item
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-2xl">
                <DialogHeader>
                  <DialogTitle className="font-serif text-2xl">
                    Add to {collection.title}
                  </DialogTitle>
                </DialogHeader>
                <Tabs
                  value={pickKind}
                  onValueChange={(v) => {
                    setPickKind(v as "signal" | "trend");
                    setPickedId(null);
                  }}
                >
                  <TabsList className="grid grid-cols-2 w-full">
                    <TabsTrigger value="signal">Signals</TabsTrigger>
                    <TabsTrigger value="trend">Trends</TabsTrigger>
                  </TabsList>
                  <TabsContent value="signal" className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search signals..."
                        className="pl-9"
                      />
                    </div>
                    <div className="max-h-72 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                      {candidates.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          No signals available.
                        </div>
                      ) : (
                        candidates.map((s) => (
                          <button
                            key={s.id}
                            type="button"
                            onClick={() => setPickedId(s.id)}
                            className={`w-full text-left p-3 cursor-pointer transition-colors ${
                              pickedId === s.id
                                ? "bg-primary/10"
                                : "hover:bg-muted/40"
                            }`}
                          >
                            <div className="font-medium">{s.title}</div>
                            <div className="text-xs text-muted-foreground mt-1 flex gap-2">
                              <Badge variant="outline" className="text-[10px]">
                                {"category" in s ? s.category : ""}
                              </Badge>
                              <span>By {s.authorName}</span>
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </TabsContent>
                  <TabsContent value="trend" className="space-y-3">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Search trends..."
                        className="pl-9"
                      />
                    </div>
                    <div className="max-h-72 overflow-y-auto border border-border rounded-lg divide-y divide-border">
                      {candidates.length === 0 ? (
                        <div className="p-6 text-center text-sm text-muted-foreground">
                          No trends available.
                        </div>
                      ) : (
                        candidates.map((t) => (
                          <button
                            key={t.id}
                            type="button"
                            onClick={() => setPickedId(t.id)}
                            className={`w-full text-left p-3 cursor-pointer transition-colors ${
                              pickedId === t.id
                                ? "bg-primary/10"
                                : "hover:bg-muted/40"
                            }`}
                          >
                            <div className="font-medium">{t.title}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              By {t.authorName}
                            </div>
                          </button>
                        ))
                      )}
                    </div>
                  </TabsContent>
                </Tabs>
                <Textarea
                  placeholder="Optional note about why this belongs here…"
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={2}
                />
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => setOpen(false)}
                    type="button"
                  >
                    Cancel
                  </Button>
                  <Button
                    onClick={handleAdd}
                    disabled={!pickedId || addItem.isPending}
                  >
                    {addItem.isPending ? "Adding…" : "Add to collection"}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
        </div>
      </header>

      <section className="space-y-4">
        <h2 className="text-2xl font-serif font-semibold border-b border-border pb-2">
          Contents ({collection.items.length})
        </h2>

        {collection.items.length === 0 ? (
          <div className="text-center py-12 bg-muted/20 rounded-xl border border-dashed border-border">
            <p className="text-muted-foreground">This collection is empty.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {collection.items.map((item) => {
              const ref =
                item.kind === "signal"
                  ? signalById.get(item.refId)
                  : trendById.get(item.refId);
              const title = ref?.title ?? `Deleted ${item.kind}`;
              const category =
                ref && "category" in ref ? (ref as { category: string }).category : null;
              const author = ref ? (ref as { authorName: string }).authorName : null;
              const subtitle = ref
                ? category
                  ? `${category} • By ${author}`
                  : `By ${author}`
                : "";
              return (
                <Card key={item.id} className="bg-card">
                  <CardHeader className="pb-2">
                    <div className="flex justify-between">
                      <Badge variant="secondary" className="capitalize">
                        {item.kind}
                      </Badge>
                      {canEdit && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                          onClick={() =>
                            removeItem.mutate({
                              id: collectionId,
                              itemId: item.id,
                            })
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                    <CardTitle className="font-serif text-lg mt-2">
                      <Link
                        href={`/${item.kind}s/${item.refId}`}
                        className="hover:text-primary transition-colors"
                      >
                        {title}
                      </Link>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="text-sm text-muted-foreground">
                    {subtitle && <p className="mb-2 text-xs">{subtitle}</p>}
                    {item.note && (
                      <p className="mb-2 italic border-l-2 border-primary/30 pl-2">
                        {item.note}
                      </p>
                    )}
                    <p className="text-xs">
                      Added by {item.addedByName} on{" "}
                      {new Date(item.addedAt).toLocaleDateString()}
                    </p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </section>
    </div>
  );
}
