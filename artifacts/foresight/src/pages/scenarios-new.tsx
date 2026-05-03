import { useState } from "react";
import { useCreateScenario, getListScenariosQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function ScenarioNew() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createScenario = useCreateScenario();

  const [title, setTitle] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const result = await createScenario.mutateAsync({
      data: {
        title
      }
    });
    queryClient.invalidateQueries({ queryKey: getListScenariosQueryKey() });
    setLocation(`/scenarios/${result.id}`);
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <header className="border-b border-border pb-6">
        <h1 className="text-4xl font-serif font-bold text-foreground">Build Scenario</h1>
        <p className="text-lg text-muted-foreground mt-2">Start a new evidence-grounded future narrative</p>
      </header>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif">Scenario Setup</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Working Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. The Post-Work Society" />
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border pt-6">
            <Button variant="outline" type="button" onClick={() => setLocation("/scenarios")}>Cancel</Button>
            <Button type="submit" disabled={createScenario.isPending}>
              {createScenario.isPending ? "Initializing..." : "Start Building"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
