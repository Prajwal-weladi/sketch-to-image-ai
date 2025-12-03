import { useEffect, useState } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { ArrowLeft, Image, Users, FileText, Video } from "lucide-react";
import { EvidenceUpload } from "@/components/EvidenceUpload";
import { EvidenceList } from "@/components/EvidenceList";
import { VideoDetection } from "@/components/VideoDetection";
import { RealtimeDetection } from "@/components/RealtimeDetection";
import { SuspectsList } from "@/components/SuspectsList";
import { AddSuspectDialog } from "@/components/AddSuspectDialog";
import { CaseNotes } from "@/components/CaseNotes";

const CaseDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [caseData, setCaseData] = useState<any>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [suspectRefresh, setSuspectRefresh] = useState(0);

  useEffect(() => {
    if (id) {
      fetchCase();
    }
  }, [id]);

  const fetchCase = async () => {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .eq("id", id)
        .single();

      if (error) throw error;
      setCaseData(data);
    } catch (error: any) {
      toast.error("Failed to load case details");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Loading...</div>;
  }

  if (!caseData) {
    return <div className="min-h-screen bg-background flex items-center justify-center">Case not found</div>;
  }

  const getStatusColor = (status: string) => {
    const colors = {
      active: "bg-green-500/10 text-green-500 border-green-500/20",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      solved: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="mb-2">
            <ArrowLeft className="w-4 h-4 mr-2" />
            Back to Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <h1 className="text-2xl font-display font-bold">{caseData.title}</h1>
                <Badge variant="outline" className={getStatusColor(caseData.status)}>
                  {caseData.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Case #{caseData.case_number}</p>
            </div>
          </div>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        <div className="grid gap-6 mb-8 md:grid-cols-3">
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Officer</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="font-semibold">{caseData.officer_name}</p>
              {caseData.officer_badge && (
                <p className="text-sm text-muted-foreground">Badge: {caseData.officer_badge}</p>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Location</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{caseData.location || "Not specified"}</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium">Created</CardTitle>
            </CardHeader>
            <CardContent>
              <p>{new Date(caseData.created_at).toLocaleDateString()}</p>
            </CardContent>
          </Card>
        </div>

        {caseData.description && (
          <Card className="mb-8">
            <CardHeader>
              <CardTitle>Description</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-muted-foreground">{caseData.description}</p>
            </CardContent>
          </Card>
        )}

        <Tabs defaultValue="evidence" className="space-y-6">
          <TabsList className="grid grid-cols-5 w-full">
            <TabsTrigger value="evidence">
              <Image className="w-4 h-4 mr-2" />
              Evidence
            </TabsTrigger>
            <TabsTrigger value="suspects">
              <Users className="w-4 h-4 mr-2" />
              Suspects
            </TabsTrigger>
            <TabsTrigger value="notes">
              <FileText className="w-4 h-4 mr-2" />
              Notes
            </TabsTrigger>
            <TabsTrigger value="video">
              <Video className="w-4 h-4 mr-2" />
              Video Analysis
            </TabsTrigger>
            <TabsTrigger value="realtime">
              <Video className="w-4 h-4 mr-2" />
              Live Detection
            </TabsTrigger>
          </TabsList>

          <TabsContent value="evidence" className="space-y-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-semibold">Case Evidence</h2>
              <EvidenceUpload caseId={id!} onUploadComplete={fetchCase} />
            </div>
            <EvidenceList caseId={id!} />
          </TabsContent>

          <TabsContent value="suspects" className="space-y-4">
            <div className="flex justify-between items-center">
              <h2 className="text-xl font-semibold">Case Suspects</h2>
              <AddSuspectDialog 
                caseId={id!} 
                onSuspectAdded={() => setSuspectRefresh(prev => prev + 1)} 
              />
            </div>
            <SuspectsList caseId={id!} refreshTrigger={suspectRefresh} />
          </TabsContent>

          <TabsContent value="notes">
            <CaseNotes caseId={id!} />
          </TabsContent>

          <TabsContent value="video">
            <VideoDetection caseId={id!} />
          </TabsContent>

          <TabsContent value="realtime">
            <RealtimeDetection caseId={id!} />
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
};

export default CaseDetail;
