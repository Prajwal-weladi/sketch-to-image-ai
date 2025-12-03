import { useState, useRef, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "sonner";
import { Camera, StopCircle, MapPin, AlertTriangle, User } from "lucide-react";

interface Detection {
  type: "criminal" | "evidence";
  name?: string;
  confidence: number;
  timestamp: string;
  location?: string;
}

export const RealtimeCCTVTool = () => {
  const [isStreaming, setIsStreaming] = useState(false);
  const [location, setLocation] = useState("");
  const [detections, setDetections] = useState<Detection[]>([]);
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

      // Start periodic frame analysis
      intervalRef.current = setInterval(captureAndAnalyze, 5000);
      toast.success("CCTV stream started");
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
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current || !streamRef.current) return;

    const canvas = document.createElement("canvas");
    canvas.width = videoRef.current.videoWidth;
    canvas.height = videoRef.current.videoHeight;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    ctx.drawImage(videoRef.current, 0, 0);
    const frameImage = canvas.toDataURL("image/jpeg", 0.8);

    try {
      const { data, error } = await supabase.functions.invoke("realtime-detection", {
        body: {
          frameImage,
          location: location || "AI Analysis Tool - CCTV",
        },
      });

      if (error) throw error;

      if (data?.detections && data.detections.length > 0) {
        const newDetections: Detection[] = data.detections.map((d: any) => ({
          type: d.type,
          name: d.criminalName || d.evidenceType,
          confidence: d.confidence,
          timestamp: new Date().toISOString(),
          location: location || "AI Analysis Tool",
        }));

        setDetections((prev) => [...newDetections, ...prev].slice(0, 20));

        // Show alert for criminal detections
        newDetections.forEach((detection) => {
          if (detection.type === "criminal") {
            toast.error(
              `⚠️ CRIMINAL DETECTED: ${detection.name} (${Math.round(detection.confidence * 100)}% confidence)`,
              { duration: 10000 }
            );
          }
        });
      }
    } catch (error) {
      console.error("Analysis error:", error);
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
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="flex items-center justify-between">
            Live Feed
            {isStreaming && (
              <Badge variant="destructive" className="animate-pulse">
                LIVE
              </Badge>
            )}
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
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-destructive" />
              Detection Alerts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3 max-h-80 overflow-y-auto">
              {detections.map((detection, index) => (
                <div
                  key={index}
                  className={`p-3 rounded-lg border ${
                    detection.type === "criminal"
                      ? "bg-destructive/10 border-destructive/20"
                      : "bg-yellow-500/10 border-yellow-500/20"
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    {detection.type === "criminal" ? (
                      <User className="w-4 h-4 text-destructive" />
                    ) : (
                      <AlertTriangle className="w-4 h-4 text-yellow-500" />
                    )}
                    <span className="font-semibold">
                      {detection.type === "criminal" ? "Criminal Match" : "Evidence Match"}
                    </span>
                    <Badge variant="outline">
                      {Math.round(detection.confidence * 100)}%
                    </Badge>
                  </div>
                  {detection.name && (
                    <p className="text-sm">{detection.name}</p>
                  )}
                  <div className="flex items-center gap-2 mt-2 text-xs text-muted-foreground">
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
