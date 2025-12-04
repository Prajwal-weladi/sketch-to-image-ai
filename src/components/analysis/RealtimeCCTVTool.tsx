import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, StopCircle, MapPin, AlertTriangle, User, Loader2 } from "lucide-react";

interface Detection {
  type: "criminal" | "evidence";
  name?: string;
  criminalName?: string;
  threatLevel?: string;
  confidence: number;
  timestamp: string;
  location?: string;
}

export const RealtimeCCTVTool = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [location, setLocation] = useState("");
  const [detections, setDetections] = useState<Detection[]>([]);
  const [lastAnalysisTime, setLastAnalysisTime] = useState<string>("");
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: "environment" },
        audio: false,
      });

      streamRef.current = stream;
      if (videoRef.current) {
        videoRef.current.srcObject = stream;
      }
      setIsStreaming(true);

      // Start periodic frame analysis every 8 seconds to avoid rate limiting
      intervalRef.current = setInterval(captureAndAnalyze, 8000);
      
      // Run initial analysis after a short delay
      setTimeout(captureAndAnalyze, 1000);
      
      toast.success("CCTV stream started - analyzing every 8 seconds");
    } catch (error: any) {
      toast.error("Failed to access camera: " + error.message);
      console.error(error);
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((track) => track.stop());
      streamRef.current = null;
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsStreaming(false);
    setIsAnalyzing(false);
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !streamRef.current) return;

    setIsAnalyzing(true);
    setLastAnalysisTime(new Date().toLocaleTimeString());

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth || 640;
    canvas.height = videoRef.current.videoHeight || 480;
    const ctx = canvas.getContext("2d");
    if (!ctx) {
      setIsAnalyzing(false);
      return;
    }

    ctx.drawImage(videoRef.current, 0, 0);
    const frameImage = canvas.toDataURL("image/jpeg", 0.7);

    try {
      console.log("Sending frame for analysis...");
      
      const { data, error } = await supabase.functions.invoke("realtime-detection", {
        body: {
          frameImage,
          location: location || "AI Analysis Tool - CCTV",
        },
      });

      if (error) {
        console.error("Detection error:", error);
        if (error.message?.includes('429') || error.message?.includes('rate')) {
          toast.warning("Rate limited - will retry on next interval");
        }
        setIsAnalyzing(false);
        return;
      }

      console.log("Detection response:", data);

      if (data?.facesDetected > 0) {
        toast.info(`Detected ${data.facesDetected} face(s) in frame`);
      }

      if (data?.detections && data.detections.length > 0) {
        const newDetections: Detection[] = data.detections.map((d: any) => ({
          type: d.type,
          name: d.criminalName || d.evidenceType,
          criminalName: d.criminalName,
          threatLevel: d.threatLevel,
          confidence: d.confidence,
          timestamp: new Date().toISOString(),
          location: location || "AI Analysis Tool",
        }));

        setDetections((prev) => [...newDetections, ...prev].slice(0, 50));

        // Show prominent alerts for criminal detections
        newDetections.forEach((detection) => {
          if (detection.type === "criminal") {
            toast.error(
              `⚠️ CRIMINAL DETECTED: ${detection.criminalName} (${Math.round(detection.confidence * 100)}% confidence)`,
              { duration: 15000 }
            );
            
            // Play alert sound if available
            try {
              const audio = new Audio('/alert.mp3');
              audio.play().catch(() => {});
            } catch {}
          } else {
            toast.warning(
              `Evidence match found (${Math.round(detection.confidence * 100)}% confidence)`,
              { duration: 10000 }
            );
          }
        });
      }
    } catch (error) {
      console.error("Analysis error:", error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const getThreatBadge = (level?: string) => {
    switch (level) {
      case 'critical':
        return <Badge variant="destructive" className="animate-pulse">CRITICAL</Badge>;
      case 'high':
        return <Badge variant="destructive">HIGH</Badge>;
      case 'medium':
        return <Badge className="bg-orange-500">MEDIUM</Badge>;
      default:
        return <Badge variant="secondary">LOW</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Camera className="w-5 h-5" />
            CCTV Stream Controls
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="location">
              <MapPin className="w-4 h-4 inline mr-2" />
              Camera Location
            </Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Entrance Gate, Parking Lot"
              disabled={isStreaming}
            />
          </div>

          <div className="flex gap-2">
            {!isStreaming ? (
              <Button onClick={startStream} className="w-full">
                <Camera className="w-4 h-4 mr-2" />
                Start CCTV Stream
              </Button>
            ) : (
              <Button onClick={stopStream} variant="destructive" className="w-full">
                <StopCircle className="w-4 h-4 mr-2" />
                Stop Stream
              </Button>
            )}
          </div>

          {isStreaming && (
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              {isAnalyzing ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Analyzing frame...</span>
                </>
              ) : (
                <>
                  <span>Last analysis: {lastAnalysisTime || 'Pending...'}</span>
                </>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Live Feed
            <div className="flex items-center gap-2">
              {isAnalyzing && (
                <Badge variant="outline" className="animate-pulse">
                  <Loader2 className="w-3 h-3 mr-1 animate-spin" />
                  ANALYZING
                </Badge>
              )}
              {isStreaming && (
                <Badge variant="destructive" className="animate-pulse">
                  LIVE
                </Badge>
              )}
            </div>
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="relative aspect-video bg-muted rounded-lg overflow-hidden">
            <video
              ref={videoRef}
              autoPlay
              playsInline
              muted
              className="w-full h-full object-cover"
            />
            {!isStreaming && (
              <div className="absolute inset-0 flex items-center justify-center text-muted-foreground">
                <div className="text-center">
                  <Camera className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p>Camera feed will appear here</p>
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {detections.length > 0 && (
        <Card className="border-destructive">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="w-5 h-5" />
              Detection Alerts ({detections.length})
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-96 overflow-y-auto">
              {detections.map((detection, index) => (
                <div
                  key={`${detection.timestamp}-${index}`}
                  className={`p-4 rounded-lg border ${
                    detection.type === "criminal"
                      ? "bg-destructive/10 border-destructive/30"
                      : "bg-yellow-500/10 border-yellow-500/30"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      {detection.type === "criminal" ? (
                        <User className="w-5 h-5 text-destructive" />
                      ) : (
                        <AlertTriangle className="w-5 h-5 text-yellow-500" />
                      )}
                      <span className="font-bold text-lg">
                        {detection.type === "criminal" ? "CRIMINAL MATCH" : "Evidence Match"}
                      </span>
                    </div>
                    {detection.threatLevel && getThreatBadge(detection.threatLevel)}
                  </div>
                  
                  {detection.criminalName && (
                    <p className="text-lg font-semibold mb-1">{detection.criminalName}</p>
                  )}
                  
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant="outline" className="text-base">
                      {Math.round(detection.confidence * 100)}% confidence
                    </Badge>
                  </div>
                  
                  <div className="flex items-center gap-4 text-sm text-muted-foreground">
                    <span>{new Date(detection.timestamp).toLocaleTimeString()}</span>
                    {detection.location && (
                      <>
                        <span>•</span>
                        <span>{detection.location}</span>
                      </>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
};
