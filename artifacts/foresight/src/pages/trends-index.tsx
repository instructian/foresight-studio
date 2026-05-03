import { useState } from "react";
import { useListTrends } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Filter, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function TrendsIndex() {
  const [search, setSearch] = useState("");
  const { data: trends, isLoading } = useListTrends(); // the api currently doesn't support q in list trends but we can filter client side

  const filteredTrends = trends?.filter(t => 
    t.title.toLowerCase().includes(search.toLowerCase()) || 
    t.claim.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-end justify-between border-b border-border pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-serif font-bold text-foreground">Trends</h1>
          <p className="text-lg text-muted-foreground">Synthesized patterns across multiple signals</p>
        </div>
        <Link href="/trends/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Synthesize Trend
        </Link>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search trends by title or claim..." 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10 h-11 bg-card shadow-sm border-border"
          />
        </div>
        <Button variant="outline" className="h-11 px-4 gap-2 border-border text-muted-foreground hover:text-foreground">
          <Filter className="w-4 h-4" />
          Filters
        </Button>
      </div>

      {isLoading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {[1,2,3].map(i => (
            <div key={i} className="h-64 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : filteredTrends?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
            <TrendingUp className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No trends found</h3>
          <p className="text-muted-foreground">Try adjusting your search or synthesize a new trend.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredTrends?.map((trend) => (
            <Link key={trend.id} href={`/trends/${trend.id}`}>
              <Card className="h-full hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <Badge variant="secondary" className="bg-primary/10 text-primary hover:bg-primary/20 font-medium">
                      {trend.category}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize font-normal border-border text-muted-foreground">
                      {trend.status}
                    </Badge>
                  </div>
                  <CardTitle className="font-serif text-xl leading-tight group-hover:text-primary transition-colors line-clamp-2">
                    {trend.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-2">
                  <p className="text-sm font-medium text-foreground line-clamp-2">
                    Claim: {trend.claim}
                  </p>
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {trend.rationale}
                  </p>
                  <div className="flex gap-4 mt-4 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-accent/50" />
                      {trend.supportingSignalIds.length} Supporting
                    </div>
                    {trend.contradictingSignalIds?.length ? (
                      <div className="flex items-center gap-1">
                        <span className="w-2 h-2 rounded-full bg-destructive/50" />
                        {trend.contradictingSignalIds.length} Contradicting
                      </div>
                    ) : null}
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border/50 text-xs text-muted-foreground justify-between">
                  <span>By {trend.authorName}</span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
