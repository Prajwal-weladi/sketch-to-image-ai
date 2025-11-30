import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { LogOut, Plus, FolderOpen, Image, Users, Shield, Bell, PenTool } from "lucide-react";
import { CasesList } from "@/components/CasesList";
import { CreateCaseDialog } from "@/components/CreateCaseDialog";
import { SketchDrawingTool } from "@/components/SketchDrawingTool";

const Dashboard = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState<any>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [stats, setStats] = useState({ cases: 0, evidence: 0, suspects: 0 });

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      if (!session) {
        navigate("/auth");
      } else {
        setUser(session.user);
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    toast.success("Signed out successfully");
  };

  if (!user) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent">
              SketchMatch Forensic Investigation & Matching System
            </h1>
            <p className="text-sm text-muted-foreground">{user.email}</p>
          </div>
          <Button onClick={handleSignOut} variant="outline">
            <LogOut className="w-4 h-4 mr-2" />
            Sign Out
          </Button>
        </div>
      </header>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 mb-8 md:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Cases</CardTitle>
              <FolderOpen className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.cases}</div>
              <p className="text-xs text-muted-foreground">Cases in progress</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Evidence Items</CardTitle>
              <Image className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.evidence}</div>
              <p className="text-xs text-muted-foreground">Images analyzed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Suspects</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.suspects}</div>
              <p className="text-xs text-muted-foreground">Profiles created</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="cases" className="space-y-6">
          <div className="flex items-center justify-between">
            <TabsList>
              <TabsTrigger value="cases">Cases</TabsTrigger>
              <TabsTrigger value="sketch" className="gap-1">
                <PenTool className="w-4 h-4" />
                Sketch
              </TabsTrigger>
              <TabsTrigger value="analysis">AI Analysis</TabsTrigger>
              <TabsTrigger value="evidence">Evidence</TabsTrigger>
            </TabsList>
            <Button onClick={() => setIsCreateDialogOpen(true)} className="bg-gradient-hero">
              <Plus className="w-4 h-4 mr-2" />
              New Case
            </Button>
          </div>

          <TabsContent value="cases" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Investigation Cases</CardTitle>
                <CardDescription>
                  Manage and track your forensic investigation cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <CasesList onStatsChange={setStats} />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="sketch" className="space-y-4">
            <SketchDrawingTool />
          </TabsContent>

          <TabsContent value="analysis" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>AI-Powered Analysis Tools</CardTitle>
                <CardDescription>
                  Advanced image analysis and transformation features
                </CardDescription>
              </CardHeader>
              <CardContent className="grid gap-4 md:grid-cols-2">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2"
                  onClick={() => navigate("/")}
                >
                  <Image className="w-8 h-8" />
                  <span>Sketch to Photo</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2"
                  onClick={() => navigate("/analysis")}
                >
                  <span className="text-4xl">👴</span>
                  <span>Age Progression</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2"
                  onClick={() => navigate("/analysis")}
                >
                  <span className="text-4xl">🔄</span>
                  <span>Angle Generation</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2"
                  onClick={() => navigate("/analysis")}
                >
                  <span className="text-4xl">🔍</span>
                  <span>Feature Enhancement</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 bg-destructive/10 border-destructive/20 hover:bg-destructive/20"
                  onClick={() => navigate("/criminals")}
                >
                  <Shield className="w-8 h-8 text-destructive" />
                  <span className="text-destructive font-semibold">Criminals Database</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col gap-2 bg-primary/10 border-primary/20 hover:bg-primary/20"
                  onClick={() => navigate("/detection-logs")}
                >
                  <Bell className="w-8 h-8 text-primary" />
                  <span className="text-primary font-semibold">Detection Logs</span>
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="evidence" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Evidence Management</CardTitle>
                <CardDescription>
                  Upload and manage evidence for your cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                <p className="text-center text-muted-foreground py-8">
                  Select a case to view and manage evidence
                </p>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>

      <CreateCaseDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />
    </div>
  );
};

export default Dashboard;
