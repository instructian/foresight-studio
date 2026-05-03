import { useState, useEffect } from "react";
import { useGetConfig, useUpdateConfig, getGetConfigQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useLocation } from "wouter";
import { Card, CardContent, CardHeader, CardTitle, CardFooter, CardDescription } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";

export default function InstructorSettings() {
  const queryClient = useQueryClient();
  const { data: config, isLoading } = useGetConfig();
  const updateConfig = useUpdateConfig();

  const [courseTitle, setCourseTitle] = useState("");
  const [assignmentTitle, setAssignmentTitle] = useState("");
  const [assignmentDesc, setAssignmentDesc] = useState("");
  const [targetSignals, setTargetSignals] = useState(5);

  useEffect(() => {
    if (config) {
      setCourseTitle(config.courseTitle);
      setAssignmentTitle(config.assignmentTitle);
      setAssignmentDesc(config.assignmentDescription);
      setTargetSignals(config.signalTargetPerStudent);
    }
  }, [config]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await updateConfig.mutateAsync({
      data: {
        courseTitle,
        assignmentTitle,
        assignmentDescription: assignmentDesc,
        signalTargetPerStudent: targetSignals
      }
    });
    queryClient.invalidateQueries({ queryKey: getGetConfigQueryKey() });
  };

  if (isLoading) return <div className="p-8 text-center">Loading settings...</div>;

  return (
    <div className="p-8 max-w-4xl mx-auto space-y-8">
      <header className="border-b border-border pb-6">
        <h1 className="text-4xl font-serif font-bold text-foreground">Course Settings</h1>
        <p className="text-lg text-muted-foreground mt-2">Configure studio parameters and assignments</p>
      </header>

      <form onSubmit={handleSubmit}>
        <Card className="shadow-sm">
          <CardHeader>
            <CardTitle className="font-serif">General Configuration</CardTitle>
            <CardDescription>Update course details visible to all students.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="courseTitle">Course Title</Label>
              <Input id="courseTitle" value={courseTitle} onChange={e => setCourseTitle(e.target.value)} required />
            </div>
            
            <div className="pt-4 border-t border-border space-y-4">
              <h3 className="font-medium">Current Assignment</h3>
              <div className="space-y-2">
                <Label htmlFor="assignmentTitle">Assignment Title</Label>
                <Input id="assignmentTitle" value={assignmentTitle} onChange={e => setAssignmentTitle(e.target.value)} required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="assignmentDesc">Assignment Brief</Label>
                <Textarea 
                  id="assignmentDesc" 
                  value={assignmentDesc} 
                  onChange={e => setAssignmentDesc(e.target.value)} 
                  className="h-32"
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="targetSignals">Target Signals per Student</Label>
                <Input 
                  id="targetSignals" 
                  type="number" 
                  min={1} 
                  value={targetSignals} 
                  onChange={e => setTargetSignals(parseInt(e.target.value))} 
                  required 
                />
              </div>
            </div>
          </CardContent>
          <CardFooter className="flex justify-end border-t border-border pt-6">
            <Button type="submit" disabled={updateConfig.isPending}>
              {updateConfig.isPending ? "Saving..." : "Save Settings"}
            </Button>
          </CardFooter>
        </Card>
      </form>
    </div>
  );
}
