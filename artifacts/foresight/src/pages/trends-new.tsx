import { useState } from "react";
import { useCreateTrend, getListTrendsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function TrendNew() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createTrend = useCreateTrend();

  const [title, setTitle] = useState("");
  const [claim, setClaim] = useState("");
  const [category, setCategory] = useState("Technological");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createTrend.mutateAsync({
      data: {
        title,
        claim,
        category,
        supportingSignalIds: []
      }
    });
    queryClient.invalidateQueries({ queryKey: getListTrendsQueryKey() });
    setLocation("/trends");
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <header className="border-b border-border pb-6">
        <h1 className="text-4xl font-serif font-bold text-foreground">Synthesize Trend</h1>
        <p className="text-lg text-muted-foreground mt-2">Connect multiple signals into a broader pattern</p>
      </header>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif">Trend Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. The Automation of Governance" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="category">Primary Category</Label>
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
              <Label htmlFor="claim">Core Claim</Label>
              <Textarea 
                id="claim" 
                value={claim} 
                onChange={e => setClaim(e.target.value)} 
                required
                placeholder="What is the directional shift happening here?"
                className="h-24"
              />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border pt-6">
            <Button variant="outline" type="button" onClick={() => setLocation("/trends")}>Cancel</Button>
            <Button type="submit" disabled={createTrend.isPending}>
              {createTrend.isPending ? "Synthesizing..." : "Create Trend"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
