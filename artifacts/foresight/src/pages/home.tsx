import { useGetMe, useGetConfig, useGetParticipation, useGetRecentActivity } from "@workspace/api-client-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Link } from "wouter";
import { Button } from "@/components/ui/button";
import { Radio, TrendingUp, Folder, PlusCircle } from "lucide-react";

export default function HomePage() {
  const { data: user } = useGetMe();
  const { data: config } = useGetConfig();
  const { data: participation } = useGetParticipation();
  const { data: recentActivity } = useGetRecentActivity({ limit: 10 });
  
  // Find current user's participation stats
  const myStats = participation?.find(p => p.studentId === user?.id);

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-10">
      <header className="space-y-4">
        <h1 className="text-4xl font-serif font-bold text-foreground">Welcome, {user?.name}</h1>
        <p className="text-xl text-muted-foreground max-w-3xl leading-relaxed">
          {config?.courseTitle || "Speculative Design Studio"}
        </p>
      </header>

      <section className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="col-span-1 md:col-span-2 bg-primary/5 border-primary/20 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-2xl text-primary">Assignment Brief</CardTitle>
            <CardDescription>{config?.assignmentTitle || "Current Assignment"}</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-foreground leading-relaxed whitespace-pre-wrap">
              {config?.assignmentDescription || "Identify emerging signals of change, cluster them into trends, and synthesize plausible future scenarios. Consider the PESTLE dimensions carefully."}
            </p>
            {config?.dueDate && (
              <div className="mt-6 pt-4 border-t border-primary/10 font-medium text-primary">
                Due Date: {new Date(config.dueDate).toLocaleDateString()}
              </div>
            )}
          </CardContent>
        </Card>

        <Card className="col-span-1 shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif text-xl">Your Progress</CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span className="font-medium text-foreground">Signals</span>
                <span className="text-muted-foreground">{myStats?.signalsSubmitted || 0} / {config?.signalTargetPerStudent || 5}</span>
              </div>
              <div className="h-2 bg-muted rounded-full overflow-hidden">
                <div 
                  className="h-full bg-accent transition-all duration-500 ease-out" 
                  style={{ width: `${Math.min(100, ((myStats?.signalsSubmitted || 0) / (config?.signalTargetPerStudent || 5)) * 100)}%` }}
                />
              </div>
            </div>
            
            <div className="grid grid-cols-2 gap-4 pt-4 border-t border-border">
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-serif font-semibold text-foreground">{myStats?.trendsCount || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Trends</div>
              </div>
              <div className="text-center p-3 bg-muted/50 rounded-lg">
                <div className="text-2xl font-serif font-semibold text-foreground">{myStats?.scenariosCount || 0}</div>
                <div className="text-xs text-muted-foreground mt-1">Scenarios</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </section>

      <section className="space-y-6">
        <h2 className="text-2xl font-serif font-semibold border-b border-border pb-2">Quick Actions</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
          <Link href="/signals/new" className="group">
            <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Radio className="w-6 h-6" />
                </div>
                <div className="font-medium">Log a Signal</div>
                <p className="text-xs text-muted-foreground">Capture an indicator of change</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/trends/new" className="group">
            <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <TrendingUp className="w-6 h-6" />
                </div>
                <div className="font-medium">Synthesize Trend</div>
                <p className="text-xs text-muted-foreground">Cluster signals into a pattern</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/collections" className="group">
            <Card className="h-full hover:border-primary/50 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-primary/10 text-primary flex items-center justify-center group-hover:bg-primary group-hover:text-primary-foreground transition-colors">
                  <Folder className="w-6 h-6" />
                </div>
                <div className="font-medium">My Collections</div>
                <p className="text-xs text-muted-foreground">Organize your research</p>
              </CardContent>
            </Card>
          </Link>
          
          <Link href="/scenarios/new" className="group">
            <Card className="h-full hover:border-accent/50 hover:shadow-md transition-all cursor-pointer">
              <CardContent className="p-6 flex flex-col items-center text-center space-y-3">
                <div className="w-12 h-12 rounded-full bg-accent/10 text-accent flex items-center justify-center group-hover:bg-accent group-hover:text-accent-foreground transition-colors">
                  <PlusCircle className="w-6 h-6" />
                </div>
                <div className="font-medium text-accent">Build Scenario</div>
                <p className="text-xs text-muted-foreground">Compose a future narrative</p>
              </CardContent>
            </Card>
          </Link>
        </div>
      </section>

      <section className="space-y-6 pb-20">
        <h2 className="text-2xl font-serif font-semibold border-b border-border pb-2">Recent Studio Activity</h2>
        <div className="space-y-4">
          {recentActivity?.length ? (
            recentActivity.map((activity) => (
              <div key={activity.id} className="flex items-start gap-4 p-4 rounded-lg bg-card border border-border shadow-sm">
                <div className="w-2 h-2 mt-2 rounded-full bg-primary/50 shrink-0" />
                <div>
                  <p className="text-sm">
                    <span className="font-medium text-foreground">{activity.actorName}</span>{' '}
                    <span className="text-muted-foreground">{activity.type}</span>{' '}
                    <span className="font-medium capitalize text-foreground">{activity.entityKind}</span>
                    {activity.entityTitle && (
                      <span className="text-muted-foreground"> "{activity.entityTitle}"</span>
                    )}
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {new Date(activity.createdAt).toLocaleString()}
                  </p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground italic p-4 bg-muted/30 rounded-lg text-center">No recent activity to display.</p>
          )}
        </div>
      </section>
    </div>
  );
}
