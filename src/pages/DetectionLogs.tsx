import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ArrowLeft, AlertTriangle, MapPin, Clock, User, Ruler, Weight, Shield } from "lucide-react";
import { toast } from "sonner";

interface Detection {
  id: string;
  detection_type: string;
  confidence_score: number | null;
  snapshot_url: string | null;
  location: string | null;
  notes: string | null;
  created_at: string;
  criminal_id: string | null;
  criminals?: {
    name: string;
    threat_level: string;
    age_range: string | null;
    height: string | null;
    weight: string | null;
    gender: string | null;
    ethnicity: string | null;
    build: string | null;
    distinguishing_marks: string | null;
    known_offenses: string[] | null;
  };
}

export default function DetectionLogs() {
  const navigate = useNavigate();
  const [detections, setDetections] = useState<Detection[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDetections();
  }, []);

  const fetchDetections = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('detections')
        .select(`
          *,
          criminals (
            name,
            threat_level,
            age_range,
            height,
            weight,
            gender,
            ethnicity,
            build,
            distinguishing_marks,
            known_offenses
          )
        `)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setDetections(data || []);
    } catch (error) {
      console.error('Error fetching detections:', error);
      toast.error('Failed to load detection logs');
    } finally {
      setLoading(false);
    }
  };

  const getThreatColor = (level?: string) => {
    switch (level) {
      case 'critical':
        return 'destructive';
      case 'high':
        return 'destructive';
      case 'medium':
        return 'default';
      default:
        return 'secondary';
    }
  };

  const formatTimestamp = (timestamp: string) => {
    return new Date(timestamp).toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4">
          <Button 
            variant="ghost" 
            onClick={() => navigate(-1)}
            className="mb-2"
          >
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back
          </Button>
          <h1 className="text-3xl font-bold">Detection Logs</h1>
          <p className="text-muted-foreground">
            All criminal detection alerts and evidence matches
          </p>
        </div>
      </header>

      <div className="container mx-auto px-4 py-8">
        {loading ? (
          <div className="text-center py-12">Loading detection logs...</div>
        ) : detections.length === 0 ? (
          <Card className="p-12 text-center">
            <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">No detections yet</h3>
            <p className="text-muted-foreground mb-4">
              Detection alerts will appear here when criminals are identified
            </p>
          </Card>
        ) : (
          <div className="space-y-4">
            {detections.map((detection) => (
              <Card key={detection.id} className="overflow-hidden">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <CardTitle className="flex items-center gap-2 text-lg">
                        {detection.detection_type === 'criminal' ? (
                          <>
                            <AlertTriangle className="h-5 w-5 text-destructive" />
                            Criminal Detected: {detection.criminals?.name}
                          </>
                        ) : (
                          <>
                            <Shield className="h-5 w-5 text-primary" />
                            Evidence Match Detected
                          </>
                        )}
                      </CardTitle>
                      <div className="flex items-center gap-3 mt-2 text-sm text-muted-foreground">
                        <div className="flex items-center gap-1">
                          <Clock className="h-3 w-3" />
                          {formatTimestamp(detection.created_at)}
                        </div>
                        {detection.location && (
                          <>
                            <span>•</span>
                            <div className="flex items-center gap-1">
                              <MapPin className="h-3 w-3" />
                              {detection.location}
                            </div>
                          </>
                        )}
                      </div>
                    </div>
                    <div className="flex flex-col gap-2 items-end">
                      {detection.confidence_score && (
                        <Badge variant="secondary" className="text-xs">
                          {Math.round(detection.confidence_score)}% Match
                        </Badge>
                      )}
                      {detection.criminals?.threat_level && (
                        <Badge variant={getThreatColor(detection.criminals.threat_level) as any}>
                          {detection.criminals.threat_level.toUpperCase()}
                        </Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="pt-0">
                  <div className="grid md:grid-cols-[200px,1fr] gap-4">
                    {detection.snapshot_url && (
                      <div className="relative aspect-square bg-muted rounded-lg overflow-hidden">
                        <img 
                          src={detection.snapshot_url} 
                          alt="Detection snapshot"
                          className="w-full h-full object-cover"
                        />
                      </div>
                    )}

                    <div className="space-y-3">
                      {detection.criminals && (
                        <>
                          <div className="grid grid-cols-2 gap-3 text-sm">
                            {detection.criminals.age_range && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>Age: {detection.criminals.age_range}</span>
                              </div>
                            )}
                            {detection.criminals.height && (
                              <div className="flex items-center gap-2">
                                <Ruler className="h-4 w-4 text-muted-foreground" />
                                <span>{detection.criminals.height}</span>
                              </div>
                            )}
                            {detection.criminals.weight && (
                              <div className="flex items-center gap-2">
                                <Weight className="h-4 w-4 text-muted-foreground" />
                                <span>{detection.criminals.weight}</span>
                              </div>
                            )}
                            {detection.criminals.gender && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{detection.criminals.gender}</span>
                              </div>
                            )}
                            {detection.criminals.ethnicity && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{detection.criminals.ethnicity}</span>
                              </div>
                            )}
                            {detection.criminals.build && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span>{detection.criminals.build}</span>
                              </div>
                            )}
                          </div>

                          {detection.criminals.distinguishing_marks && (
                            <div className="text-sm">
                              <span className="font-medium">Distinguishing Marks:</span>
                              <p className="text-muted-foreground mt-1">
                                {detection.criminals.distinguishing_marks}
                              </p>
                            </div>
                          )}

                          {detection.criminals.known_offenses && detection.criminals.known_offenses.length > 0 && (
                            <div className="text-sm">
                              <span className="font-medium">Known Offenses:</span>
                              <div className="flex flex-wrap gap-2 mt-2">
                                {detection.criminals.known_offenses.map((offense, idx) => (
                                  <Badge key={idx} variant="outline" className="text-xs">
                                    {offense}
                                  </Badge>
                                ))}
                              </div>
                            </div>
                          )}
                        </>
                      )}

                      {detection.notes && (
                        <div className="text-sm">
                          <span className="font-medium">Notes:</span>
                          <p className="text-muted-foreground mt-1">{detection.notes}</p>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}