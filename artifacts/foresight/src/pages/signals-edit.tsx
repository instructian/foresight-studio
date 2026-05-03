import { useState, useEffect } from "react";
import { useGetSignal, useUpdateSignal, getGetSignalQueryKey, getListSignalsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation, useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function SignalEdit() {
  const [, params] = useRoute("/signals/:id/edit");
  const signalId = params?.id || "";
  
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  
  const { data: signal, isLoading } = useGetSignal(signalId);
  const updateSignal = useUpdateSignal();

  const [title, setTitle] = useState("");
  const [summary, setSummary] = useState("");
  const [category, setCategory] = useState("Technological");
  const [context, setContext] = useState("");
  
  useEffect(() => {
    if (signal) {
      setTitle(signal.title);
      setSummary(signal.summary);
      setCategory(signal.category);
      setContext(signal.context || "");
    }
  }, [signal]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateSignal.mutateAsync({
      id: signalId,
      data: { title, summary, category, context }
    });
    queryClient.invalidateQueries({ queryKey: getGetSignalQueryKey(signalId) });
    queryClient.invalidateQueries({ queryKey: getListSignalsQueryKey() });
    setLocation(`/signals/${signalId}`);
  };

  if (isLoading) return <div className="p-8 text-center">Loading...</div>;

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <header className="border-b border-border pb-6">
        <h1 className="text-4xl font-serif font-bold text-foreground">Edit Signal</h1>
      </header>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif">Signal Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <select 
                id="category" 
                value={category}
                onChange={e => setCategory(e.target.value)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="Social">Social</option>
                <option value="Technological">Technological</option>
                <option value="Economic">Economic</option>
                <option value="Environmental">Environmental</option>
                <option value="Political">Political</option>
                <option value="Legal">Legal</option>
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="summary">Summary</Label>
              <Textarea 
                id="summary" 
                value={summary} 
                onChange={e => setSummary(e.target.value)} 
                className="h-24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="context">Context & Evidence</Label>
              <Textarea 
                id="context" 
                value={context} 
                onChange={e => setContext(e.target.value)} 
                className="h-48"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border pt-6">
            <Button variant="outline" type="button" onClick={() => setLocation(`/signals/${signalId}`)}>Cancel</Button>
            <Button type="submit" disabled={updateSignal.isPending}>
              {updateSignal.isPending ? "Saving..." : "Save Changes"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
