import { useState } from "react";
import { useCreateCollection, getListCollectionsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function CollectionsNew() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const createCollection = useCreateCollection();

  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [visibility, setVisibility] = useState<"private" | "class">("private");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await createCollection.mutateAsync({
      data: {
        title,
        description,
        visibility
      }
    });
    queryClient.invalidateQueries({ queryKey: getListCollectionsQueryKey() });
    setLocation("/collections");
  };

  return (
    <div className="p-8 max-w-3xl mx-auto space-y-8">
      <header className="border-b border-border pb-6">
        <h1 className="text-4xl font-serif font-bold text-foreground">New Collection</h1>
        <p className="text-lg text-muted-foreground mt-2">Create a new space to organize signals and trends</p>
      </header>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif">Collection Details</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="title">Title</Label>
              <Input id="title" value={title} onChange={e => setTitle(e.target.value)} required placeholder="e.g. Future of Mobility" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="description">Description</Label>
              <Textarea 
                id="description" 
                value={description} 
                onChange={e => setDescription(e.target.value)} 
                placeholder="What is this collection about?"
                className="h-24"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="visibility">Visibility</Label>
              <select 
                id="visibility" 
                value={visibility}
                onChange={e => setVisibility(e.target.value as any)}
                className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background"
              >
                <option value="private">Private (Only me)</option>
                <option value="class">Class (Shared with everyone)</option>
              </select>
            </div>
          </CardContent>
          <CardFooter className="flex justify-between border-t border-border pt-6">
            <Button variant="outline" type="button" onClick={() => setLocation("/collections")}>Cancel</Button>
            <Button type="submit" disabled={createCollection.isPending}>
              {createCollection.isPending ? "Creating..." : "Create Collection"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
