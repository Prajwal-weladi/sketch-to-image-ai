import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { ArrowLeft } from "lucide-react";
import { AgeProgressionTool } from "@/components/analysis/AgeProgressionTool";
import { AngleGenerationTool } from "@/components/analysis/AngleGenerationTool";
import { FeatureEnhancementTool } from "@/components/analysis/FeatureEnhancementTool";
import { FacialMatchingTool } from "@/components/analysis/FacialMatchingTool";
import { RealtimeCCTVTool } from "@/components/analysis/RealtimeCCTVTool";

const AnalysisTools = () => {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <h1 className="text-2xl font-display font-bold bg-gradient-primary bg-clip-text text-transparent mt-2">
            AI Analysis Tools
          </h1>
          <p className="text-sm text-muted-foreground">Advanced forensic image analysis</p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <Tabs defaultValue="age" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full max-w-3xl">
            <TabsTrigger value="age">Age Progression</TabsTrigger>
            <TabsTrigger value="angle">Angle Views</TabsTrigger>
            <TabsTrigger value="enhance">Enhancement</TabsTrigger>
            <TabsTrigger value="match">Facial Match</TabsTrigger>
            <TabsTrigger value="cctv">Live CCTV</TabsTrigger>
          </TabsList>

          <TabsContent value="age">
            <Card>
              <CardHeader>
                <CardTitle>Age Progression Analysis</CardTitle>
                <CardDescription>
                  Project how a person might look at different ages
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AgeProgressionTool />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="angle">
            <Card>
              <CardHeader>
                <CardTitle>Angle Generation</CardTitle>
                <CardDescription>
                  Generate different viewing angles from a single photo
                </CardDescription>
              </CardHeader>
              <CardContent>
                <AngleGenerationTool />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="enhance">
            <Card>
              <CardHeader>
                <CardTitle>Feature Enhancement</CardTitle>
                <CardDescription>
                  Enhance and clarify facial features for better identification
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FeatureEnhancementTool />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="match">
            <Card>
              <CardHeader>
                <CardTitle>Facial Matching</CardTitle>
                <CardDescription>
                  Compare two faces to determine if they match
                </CardDescription>
              </CardHeader>
              <CardContent>
                <FacialMatchingTool />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="cctv">
            <Card>
              <CardHeader>
                <CardTitle>Realtime CCTV Detection</CardTitle>
                <CardDescription>
                  Monitor live camera feed and detect known criminals in real-time
                </CardDescription>
              </CardHeader>
              <CardContent>
                <RealtimeCCTVTool />
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default AnalysisTools;
