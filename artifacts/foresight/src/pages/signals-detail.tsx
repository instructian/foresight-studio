import { useGetSignal, useGetRelatedSignals, useListComments, useAddComment } from "@workspace/api-client-react";
import { useRoute } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Clock, User, Link as LinkIcon, MessageSquare, ArrowLeft } from "lucide-react";
import { Link } from "wouter";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function SignalDetail() {
  const [, params] = useRoute("/signals/:id");
  const signalId = params?.id || "";

  const { data: signal, isLoading } = useGetSignal(signalId);
  const { data: related } = useGetRelatedSignals(signalId);
  const { data: comments } = useListComments(signalId);
  const addComment = useAddComment();
  
  const [commentBody, setCommentBody] = useState("");

  if (isLoading) {
    return <div className="p-8 text-center">Loading signal...</div>;
  }

  if (!signal) {
    return <div className="p-8 text-center text-muted-foreground">Signal not found.</div>;
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    
    await addComment.mutateAsync({
      entityId: signalId,
      data: { body: commentBody }
    });
    setCommentBody("");
    // TODO: Invalidate comments query
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <Link href="/signals" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Signals
      </Link>
      
      <header className="space-y-4">
        <div className="flex gap-2 items-center text-sm text-muted-foreground">
          <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">{signal.category}</Badge>
          <span>•</span>
          <span className="flex items-center gap-1"><Clock className="w-4 h-4" /> {signal.timeHorizon}</span>
          <span>•</span>
          <span className="flex items-center gap-1"><User className="w-4 h-4" /> {signal.authorName}</span>
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground leading-tight">{signal.title}</h1>
        <p className="text-xl text-muted-foreground leading-relaxed">{signal.summary}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-semibold border-b border-border pb-2">Analysis</h2>
            
            {signal.context && (
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Context</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{signal.context}</p>
              </div>
            )}
            
            {signal.implications && (
              <div className="space-y-2">
                <h3 className="font-medium text-foreground">Implications</h3>
                <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">{signal.implications}</p>
              </div>
            )}
            
            {/* Display other text fields similarly */}
          </section>

          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-semibold border-b border-border pb-2">Discussion</h2>
            
            <div className="space-y-4">
              {comments?.map(comment => (
                <div key={comment.id} className="p-4 bg-muted/30 rounded-lg border border-border">
                  <div className="flex justify-between items-center mb-2">
                    <span className="font-medium text-sm">{comment.authorName}</span>
                    <span className="text-xs text-muted-foreground">{new Date(comment.createdAt).toLocaleDateString()}</span>
                  </div>
                  <p className="text-sm text-foreground">{comment.body}</p>
                </div>
              ))}
              
              <form onSubmit={handleAddComment} className="mt-4 space-y-2">
                <Textarea 
                  placeholder="Add your perspective..." 
                  value={commentBody}
                  onChange={e => setCommentBody(e.target.value)}
                />
                <Button type="submit" disabled={addComment.isPending || !commentBody.trim()}>
                  <MessageSquare className="w-4 h-4 mr-2" /> Post Comment
                </Button>
              </form>
            </div>
          </section>
        </div>

        <div className="space-y-6">
          <Card className="bg-muted/10">
            <CardHeader>
              <CardTitle className="text-base font-serif">Signal Metadata</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4 text-sm">
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Novelty</span>
                <span className="font-medium capitalize">{signal.novelty || 'N/A'}</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Impact</span>
                <span className="font-medium">{signal.impactRating}/5</span>
              </div>
              <div className="flex justify-between border-b border-border pb-2">
                <span className="text-muted-foreground">Plausibility</span>
                <span className="font-medium">{signal.plausibilityRating}/5</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Status</span>
                <Badge variant="outline" className="capitalize">{signal.status}</Badge>
              </div>
              
              <Button variant="outline" className="w-full mt-4" asChild>
                <Link href={`/signals/${signal.id}/edit`}>Edit Signal</Link>
              </Button>
            </CardContent>
          </Card>

          <Card className="bg-muted/10">
            <CardHeader>
              <CardTitle className="text-base font-serif flex items-center gap-2">
                <LinkIcon className="w-4 h-4" /> Related Signals
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {related?.length ? related.map(rel => (
                <Link key={rel.id} href={`/signals/${rel.id}`} className="block group">
                  <div className="text-sm font-medium group-hover:text-primary transition-colors line-clamp-2">
                    {rel.title}
                  </div>
                  <div className="text-xs text-muted-foreground mt-1">
                    {rel.category}
                  </div>
                </Link>
              )) : (
                <div className="text-sm text-muted-foreground italic">None identified yet.</div>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
