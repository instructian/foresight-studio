import { useLocation } from "wouter";
import { useGetMe, useListRoster, usePickName, useInstructorLogin, getGetMeQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { BookOpen } from "lucide-react";
import React from "react";

export default function WelcomePage() {
  const [, setLocation] = useLocation();
  const queryClient = useQueryClient();
  const { data: user, isLoading: isUserLoading } = useGetMe();
  const { data: roster, isLoading: isRosterLoading } = useListRoster();
  
  const pickName = usePickName();
  const instructorLogin = useInstructorLogin();
  
  const [view, setView] = React.useState<"select" | "add" | "instructor">("select");
  const [newName, setNewName] = React.useState("");
  const [passcode, setPasscode] = React.useState("");
  const [selectedRosterId, setSelectedRosterId] = React.useState("");
  
  React.useEffect(() => {
    if (user?.signedIn) {
      setLocation(user.role === "instructor" ? "/instructor" : "/home");
    }
  }, [user, setLocation]);

  if (isUserLoading || isRosterLoading) {
    return <div className="min-h-screen flex items-center justify-center bg-background"><div className="animate-pulse">Loading...</div></div>;
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (view === "select" && selectedRosterId) {
      await pickName.mutateAsync({ data: { rosterId: selectedRosterId } });
    } else if (view === "add" && newName.trim()) {
      await pickName.mutateAsync({ data: { newName: newName.trim() } });
    } else if (view === "instructor" && passcode) {
      await instructorLogin.mutateAsync({ data: { passcode } });
    }
    
    queryClient.invalidateQueries({ queryKey: getGetMeQueryKey() });
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-muted/30 p-4 font-sans">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center space-y-2">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-full bg-primary text-primary-foreground mb-4 shadow-lg shadow-primary/20">
            <BookOpen className="w-8 h-8" />
          </div>
          <h1 className="text-4xl font-serif font-bold tracking-tight text-foreground">Foresight Studio</h1>
          <p className="text-lg text-muted-foreground font-serif italic">Collaborative Speculative Design</p>
        </div>

        <Card className="border-border shadow-xl">
          <form onSubmit={handleJoin}>
            <CardHeader>
              <CardTitle className="text-2xl font-serif font-semibold">Join Session</CardTitle>
              <CardDescription>
                {view === "select" && "Select your name from the roster to begin."}
                {view === "add" && "Enter your name to join the class."}
                {view === "instructor" && "Enter the instructor passcode."}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {view === "select" && (
                <div className="space-y-2">
                  <Label htmlFor="roster">Your Name</Label>
                  <select 
                    id="roster" 
                    className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                    value={selectedRosterId}
                    onChange={(e) => setSelectedRosterId(e.target.value)}
                    required
                  >
                    <option value="" disabled>Select your name...</option>
                    {roster?.filter(r => r.role === 'student').map((member) => (
                      <option key={member.id} value={member.id}>{member.name}</option>
                    ))}
                  </select>
                </div>
              )}

              {view === "add" && (
                <div className="space-y-2">
                  <Label htmlFor="name">Full Name</Label>
                  <Input 
                    id="name" 
                    placeholder="Jane Doe" 
                    value={newName} 
                    onChange={(e) => setNewName(e.target.value)} 
                    required 
                    autoFocus
                  />
                </div>
              )}

              {view === "instructor" && (
                <div className="space-y-2">
                  <Label htmlFor="passcode">Passcode</Label>
                  <Input 
                    id="passcode" 
                    type="password" 
                    placeholder="••••••••" 
                    value={passcode} 
                    onChange={(e) => setPasscode(e.target.value)} 
                    required 
                    autoFocus
                  />
                </div>
              )}
            </CardContent>
            <CardFooter className="flex flex-col space-y-4">
              <Button 
                type="submit" 
                className="w-full font-serif text-lg py-6 shadow-md"
                disabled={pickName.isPending || instructorLogin.isPending}
              >
                {(pickName.isPending || instructorLogin.isPending) ? "Joining..." : "Enter Studio"}
              </Button>
              
              <div className="flex gap-4 text-sm text-muted-foreground justify-center">
                {view !== "select" && (
                  <button type="button" onClick={() => setView("select")} className="hover:text-primary hover:underline underline-offset-4 transition-colors">
                    Back to roster
                  </button>
                )}
                {view !== "add" && (
                  <button type="button" onClick={() => setView("add")} className="hover:text-primary hover:underline underline-offset-4 transition-colors">
                    Not on list? Add name
                  </button>
                )}
                {view !== "instructor" && (
                  <button type="button" onClick={() => setView("instructor")} className="hover:text-primary hover:underline underline-offset-4 transition-colors">
                    Instructor login
                  </button>
                )}
              </div>
            </CardFooter>
          </form>
        </Card>
      </div>
    </div>
  );
}
