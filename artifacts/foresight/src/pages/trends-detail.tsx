import { useGetTrend, useListComments, useAddComment } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ArrowLeft, MessageSquare, TrendingUp } from "lucide-react";
import { useState } from "react";
import { Textarea } from "@/components/ui/textarea";

export default function TrendDetail() {
  const [, params] = useRoute("/trends/:id");
  const trendId = params?.id || "";

  const { data: trend, isLoading } = useGetTrend(trendId);
  const { data: comments } = useListComments(trendId);
  const addComment = useAddComment();
  
  const [commentBody, setCommentBody] = useState("");

  if (isLoading) {
    return <div className="p-8 text-center">Loading trend...</div>;
  }

  if (!trend) {
    return <div className="p-8 text-center text-muted-foreground">Trend not found.</div>;
  }

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentBody.trim()) return;
    
    await addComment.mutateAsync({
      entityId: trendId,
      data: { body: commentBody }
    });
    setCommentBody("");
  };

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <Link href="/trends" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Trends
      </Link>
      
      <header className="space-y-4">
        <div className="flex gap-2 items-center text-sm">
          <Badge variant="secondary" className="bg-primary/10 text-primary font-medium">{trend.category}</Badge>
          <Badge variant="outline" className="capitalize">{trend.status}</Badge>
        </div>
        <h1 className="text-4xl font-serif font-bold text-foreground leading-tight">{trend.title}</h1>
        <div className="p-4 bg-primary/5 border border-primary/20 rounded-lg text-lg text-primary-foreground font-medium text-primary">
          <TrendingUp className="inline-block w-5 h-5 mr-2 -mt-1" />
          {trend.claim}
        </div>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div className="md:col-span-2 space-y-8">
          <section className="space-y-4">
            <h2 className="text-2xl font-serif font-semibold border-b border-border pb-2">Rationale</h2>
            <p className="text-muted-foreground leading-relaxed whitespace-pre-wrap">
              {trend.rationale || "No detailed rationale provided yet."}
            </p>
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
                  placeholder="Add your thoughts on this trend..." 
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
              <CardTitle className="text-base font-serif">Supporting Evidence</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="text-sm font-medium flex items-center justify-between">
                <span>Supporting Signals</span>
                <Badge variant="secondary">{trend.supportingSignalIds.length}</Badge>
              </div>
              <div className="text-sm font-medium flex items-center justify-between">
                <span>Contradicting Signals</span>
                <Badge variant="outline">{trend.contradictingSignalIds?.length || 0}</Badge>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
