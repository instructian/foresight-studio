import { useEffect } from "react";
import { Switch, Route, Router as WouterRouter, useLocation } from "wouter";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/not-found";
import { useGetMe } from "@workspace/api-client-react";
import WelcomePage from "@/pages/welcome";
import HomePage from "@/pages/home";
import SignalsIndex from "@/pages/signals-index";
import SignalNew from "@/pages/signals-new";
import SignalDetail from "@/pages/signals-detail";
import SignalEdit from "@/pages/signals-edit";
import TrendsIndex from "@/pages/trends-index";
import TrendNew from "@/pages/trends-new";
import TrendDetail from "@/pages/trends-detail";
import CollectionsIndex from "@/pages/collections-index";
import CollectionsNew from "@/pages/collections-new";
import CollectionDetail from "@/pages/collections-detail";
import ScenariosIndex from "@/pages/scenarios-index";
import ScenarioNew from "@/pages/scenarios-new";
import ScenariosDetail from "@/pages/scenarios-detail";
import InstructorDashboard from "@/pages/instructor-dashboard";
import InstructorStudentProfile from "@/pages/instructor-student-profile";
import InstructorSettings from "@/pages/instructor-settings";
import AppLayout from "@/components/app-layout";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: false,
      refetchOnWindowFocus: false,
    },
  },
});

type ProtectedRouteProps = {
  component: React.ComponentType;
  instructorOnly?: boolean;
};

function ProtectedRoute({
  component: Component,
  instructorOnly = false,
}: ProtectedRouteProps) {
  const { data: user, isLoading } = useGetMe();
  const [, setLocation] = useLocation();

  const needsSignIn = !isLoading && !user?.signedIn;
  const wrongRole =
    !isLoading && user?.signedIn && instructorOnly && user.role !== "instructor";

  useEffect(() => {
    if (needsSignIn) setLocation("/");
    else if (wrongRole) setLocation("/home");
  }, [needsSignIn, wrongRole, setLocation]);

  if (isLoading || needsSignIn || wrongRole) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        Loading...
      </div>
    );
  }

  return <Component />;
}

function Router() {
  return (
    <Switch>
      <Route path="/" component={WelcomePage} />
      
      <Route path="/home">
        <AppLayout><ProtectedRoute component={HomePage} /></AppLayout>
      </Route>
      <Route path="/signals">
        <AppLayout><ProtectedRoute component={SignalsIndex} /></AppLayout>
      </Route>
      <Route path="/signals/new">
        <AppLayout><ProtectedRoute component={SignalNew} /></AppLayout>
      </Route>
      <Route path="/signals/:id">
        <AppLayout><ProtectedRoute component={SignalDetail} /></AppLayout>
      </Route>
      <Route path="/signals/:id/edit">
        <AppLayout><ProtectedRoute component={SignalEdit} /></AppLayout>
      </Route>

      <Route path="/trends">
        <AppLayout><ProtectedRoute component={TrendsIndex} /></AppLayout>
      </Route>
      <Route path="/trends/new">
        <AppLayout><ProtectedRoute component={TrendNew} /></AppLayout>
      </Route>
      <Route path="/trends/:id">
        <AppLayout><ProtectedRoute component={TrendDetail} /></AppLayout>
      </Route>

      <Route path="/collections">
        <AppLayout><ProtectedRoute component={CollectionsIndex} /></AppLayout>
      </Route>
      <Route path="/collections/new">
        <AppLayout><ProtectedRoute component={CollectionsNew} /></AppLayout>
      </Route>
      <Route path="/collections/:id">
        <AppLayout><ProtectedRoute component={CollectionDetail} /></AppLayout>
      </Route>

      <Route path="/scenarios">
        <AppLayout><ProtectedRoute component={ScenariosIndex} /></AppLayout>
      </Route>
      <Route path="/scenarios/new">
        <AppLayout><ProtectedRoute component={ScenarioNew} /></AppLayout>
      </Route>
      <Route path="/scenarios/:id">
        <AppLayout><ProtectedRoute component={ScenariosDetail} /></AppLayout>
      </Route>

      <Route path="/instructor">
        <AppLayout><ProtectedRoute component={InstructorDashboard} instructorOnly /></AppLayout>
      </Route>
      <Route path="/instructor/students/:id">
        <AppLayout><ProtectedRoute component={InstructorStudentProfile} instructorOnly /></AppLayout>
      </Route>
      <Route path="/instructor/settings">
        <AppLayout><ProtectedRoute component={InstructorSettings} instructorOnly /></AppLayout>
      </Route>
      
      <Route>
        <AppLayout><NotFound /></AppLayout>
      </Route>
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <TooltipProvider>
        <WouterRouter base={import.meta.env.BASE_URL.replace(/\/$/, "")}>
          <Router />
        </WouterRouter>
        <Toaster />
      </TooltipProvider>
    </QueryClientProvider>
  );
}

export default App;
