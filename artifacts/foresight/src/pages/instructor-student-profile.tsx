import { useGetStudentProfile } from "@workspace/api-client-react";
import { useRoute, Link } from "wouter";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowLeft, Clock, Activity } from "lucide-react";

export default function InstructorStudentProfile() {
  const [, params] = useRoute("/instructor/students/:id");
  const studentId = params?.id || "";

  const { data: profile, isLoading } = useGetStudentProfile(studentId);

  if (isLoading) return <div className="p-8 text-center">Loading profile...</div>;
  if (!profile) return <div className="p-8 text-center text-muted-foreground">Student not found.</div>;

  return (
    <div className="p-8 max-w-5xl mx-auto space-y-8">
      <Link href="/instructor" className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="w-4 h-4 mr-1" /> Back to Dashboard
      </Link>
      
      <header className="space-y-2 border-b border-border pb-6">
        <h1 className="text-4xl font-serif font-bold text-foreground">{profile.student.name}</h1>
        <p className="text-muted-foreground">Joined {new Date(profile.student.createdAt).toLocaleDateString()}</p>
      </header>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Signals</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold">{profile.participation.signalsSubmitted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Trends</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold">{profile.participation.trendsCount}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Scenarios</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold">{profile.participation.scenariosSubmitted}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">Comments</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-serif font-bold">{profile.participation.commentsCount}</div>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <h2 className="text-2xl font-serif font-semibold border-b border-border pb-2">Recent Work</h2>
          <div className="space-y-4">
            {profile.signals.slice(0, 5).map(signal => (
              <Card key={signal.id} className="bg-card shadow-sm">
                <CardContent className="p-4">
                  <div className="flex justify-between items-start">
                    <div>
                      <span className="text-xs font-medium text-primary bg-primary/10 px-2 py-1 rounded">Signal</span>
                      <h3 className="font-serif text-lg font-medium mt-2">{signal.title}</h3>
                    </div>
                    <span className="text-xs text-muted-foreground">{new Date(signal.createdAt).toLocaleDateString()}</span>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>

        <div className="space-y-6">
          <h2 className="text-2xl font-serif font-semibold border-b border-border pb-2 flex items-center gap-2">
            <Activity className="w-5 h-5" /> Activity Timeline
          </h2>
          <div className="space-y-4 relative before:absolute before:inset-0 before:ml-2 before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-border before:to-transparent">
            {profile.timeline.map((event) => (
              <div key={event.id} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                <div className="flex items-center justify-center w-5 h-5 rounded-full border border-background bg-muted-foreground text-background shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2 z-10" />
                <div className="w-[calc(100%-2rem)] md:w-[calc(50%-1.5rem)] p-3 rounded bg-muted/20 border border-border">
                  <div className="flex items-center justify-between mb-1">
                    <span className="font-medium text-sm capitalize">{event.type} {event.entityKind}</span>
                  </div>
                  <div className="text-xs text-muted-foreground">{new Date(event.createdAt).toLocaleDateString()}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
