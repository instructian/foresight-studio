import { useState } from "react";
import { useListScenarios } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Filter, Map as MapIcon, Clock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function ScenariosIndex() {
  const [search, setSearch] = useState("");
  const { data: scenarios, isLoading } = useListScenarios(); 

  const filteredScenarios = scenarios?.filter(s => 
    s.title.toLowerCase().includes(search.toLowerCase()) || 
    s.archetype.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-end justify-between border-b border-border pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-serif font-bold text-foreground">Scenarios</h1>
          <p className="text-lg text-muted-foreground">Evidence-grounded future narratives</p>
        </div>
        <Link href="/scenarios/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-accent text-accent-foreground hover:bg-accent/90 h-10 px-4 py-2 gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          Build Scenario
        </Link>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search scenarios..." 
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
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {[1,2].map(i => (
            <div key={i} className="h-64 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : filteredScenarios?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
            <MapIcon className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No scenarios found</h3>
          <p className="text-muted-foreground">Try adjusting your search or build a new scenario.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredScenarios?.map((scenario) => (
            <Link key={scenario.id} href={`/scenarios/${scenario.id}`}>
              <Card className="h-full hover:border-accent/40 hover:shadow-md transition-all cursor-pointer flex flex-col group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <Badge variant="secondary" className="bg-accent/10 text-accent hover:bg-accent/20 font-medium">
                      {scenario.archetype || "Draft Archetype"}
                    </Badge>
                    <Badge variant="outline" className="text-xs capitalize font-normal border-border text-muted-foreground">
                      {scenario.status}
                    </Badge>
                  </div>
                  <CardTitle className="font-serif text-xl leading-tight group-hover:text-accent transition-colors line-clamp-1">
                    {scenario.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1 space-y-4">
                  <p className="text-sm text-muted-foreground line-clamp-3 leading-relaxed">
                    {scenario.vignette || scenario.environmentDescription || "No description provided."}
                  </p>
                  
                  <div className="flex flex-wrap gap-x-4 gap-y-2 text-xs font-medium text-muted-foreground">
                    <div className="flex items-center gap-1">
                      <Clock className="w-3 h-3" />
                      Horizon: {scenario.timeHorizon || "N/A"}
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-primary/50" />
                      {scenario.signalIds.length} Signals
                    </div>
                    <div className="flex items-center gap-1">
                      <span className="w-2 h-2 rounded-full bg-secondary-foreground/50" />
                      {scenario.personas.length} Personas
                    </div>
                  </div>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border/50 text-xs text-muted-foreground justify-between">
                  <span>By {scenario.authorName}</span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
