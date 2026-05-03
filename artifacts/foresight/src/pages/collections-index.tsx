import { useState } from "react";
import { useListCollections } from "@workspace/api-client-react";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Search, Plus, Filter, Folder, Globe, Lock } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function CollectionsIndex() {
  const [search, setSearch] = useState("");
  const { data: collections, isLoading } = useListCollections(); 

  const filteredCollections = collections?.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.description.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="p-8 max-w-7xl mx-auto space-y-8">
      <header className="flex items-end justify-between border-b border-border pb-6">
        <div className="space-y-2">
          <h1 className="text-4xl font-serif font-bold text-foreground">Collections</h1>
          <p className="text-lg text-muted-foreground">Curated sets of signals and trends</p>
        </div>
        <Link href="/collections/new" className="inline-flex items-center justify-center whitespace-nowrap rounded-md text-sm font-medium ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 bg-primary text-primary-foreground hover:bg-primary/90 h-10 px-4 py-2 gap-2 shadow-sm">
          <Plus className="w-4 h-4" />
          New Collection
        </Link>
      </header>

      <div className="flex flex-col sm:flex-row gap-4 items-center">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input 
            placeholder="Search collections..." 
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
            <div key={i} className="h-48 rounded-xl bg-muted/50 animate-pulse" />
          ))}
        </div>
      ) : filteredCollections?.length === 0 ? (
        <div className="text-center py-20 bg-card rounded-xl border border-dashed border-border">
          <div className="w-16 h-16 rounded-full bg-muted flex items-center justify-center mx-auto mb-4 text-muted-foreground">
            <Folder className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-medium text-foreground mb-1">No collections found</h3>
          <p className="text-muted-foreground">Try adjusting your search or create a new collection.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredCollections?.map((collection) => (
            <Link key={collection.id} href={`/collections/${collection.id}`}>
              <Card className="h-full hover:border-primary/40 hover:shadow-md transition-all cursor-pointer flex flex-col group">
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start gap-2 mb-2">
                    <Badge variant="secondary" className="bg-muted text-muted-foreground font-medium flex items-center gap-1">
                      <Folder className="w-3 h-3" />
                      {collection.items.length} items
                    </Badge>
                    <div className="text-xs text-muted-foreground flex items-center gap-1">
                      {collection.visibility === "class" ? <Globe className="w-3 h-3" /> : <Lock className="w-3 h-3" />}
                      <span className="capitalize">{collection.visibility}</span>
                    </div>
                  </div>
                  <CardTitle className="font-serif text-xl leading-tight group-hover:text-primary transition-colors line-clamp-1">
                    {collection.title}
                  </CardTitle>
                </CardHeader>
                <CardContent className="flex-1">
                  <p className="text-sm text-muted-foreground line-clamp-2 leading-relaxed">
                    {collection.description || "No description provided."}
                  </p>
                </CardContent>
                <CardFooter className="pt-4 border-t border-border/50 text-xs text-muted-foreground justify-between">
                  <span>By {collection.ownerName}</span>
                </CardFooter>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
