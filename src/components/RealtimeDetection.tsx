import { useState, useRef, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Camera, Video, AlertCircle, XCircle, MapPin, Clock, User, Ruler, Weight, AlertTriangle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

interface RealtimeDetectionProps {
  caseId: string;
}

export function RealtimeDetection({ caseId }: RealtimeDetectionProps) {
  const [isStreaming, setIsStreaming] = useState(false);
  const [location, setLocation] = useState("");
  const [detections, setDetections] = useState<any[]>([]);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const intervalRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      stopStream();
    };
  }, []);

  const startStream = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({
        video: {
          width: { ideal: 1280 },
          height: { ideal: 720 }
        }
      });

      if (videoRef.current) {
        videoRef.current.srcObject = stream;
        streamRef.current = stream;
      }

      setIsStreaming(true);
      toast.success("Camera started");

      // Start analyzing frames every 3 seconds
      intervalRef.current = window.setInterval(() => {
        captureAndAnalyze();
      }, 3000);

    } catch (error) {
      console.error('Error accessing camera:', error);
      toast.error("Failed to access camera");
    }
  };

  const stopStream = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
      streamRef.current = null;
    }

    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }

    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }

    setIsStreaming(false);
    toast.info("Camera stopped");
  };

  const captureAndAnalyze = async () => {
    if (!videoRef.current) return;

    try {
      // Capture frame from video
      const canvas = document.createElement('canvas');
      canvas.width = videoRef.current.videoWidth;
      canvas.height = videoRef.current.videoHeight;
      const ctx = canvas.getContext('2d');
      
      if (!ctx) return;

      ctx.drawImage(videoRef.current, 0, 0);
      const frameImage = canvas.toDataURL('image/jpeg', 0.8);

      // Send frame for analysis
      const { data, error } = await supabase.functions.invoke('realtime-detection', {
        body: { 
          frameImage, 
          caseId,
          location: location || "Unknown"
        }
      });

      if (error) {
        console.error('Detection error:', error);
        return;
      }

      if (data.detections && data.detections.length > 0) {
        // New detection found!
        const newDetections = data.detections;
        setDetections(prev => [...newDetections, ...prev].slice(0, 10)); // Keep last 10
        
        // Show detailed alert
        newDetections.forEach((detection: any) => {
          if (detection.type === 'evidence') {
            toast.info(`📸 EVIDENCE MATCH DETECTED`, {
              description: `${detection.confidence}% similarity at ${location || 'Unknown location'} - ${new Date(detection.timestamp).toLocaleString()}`,
              duration: 15000,
            });
          } else {
            const criminal = detection.criminal;
            toast.error(`🚨 CRIMINAL ALERT: ${criminal.name}`, {
              description: `${detection.confidence}% match | ${criminal.threat_level.toUpperCase()} THREAT | Location: ${location || 'Unknown'} | Time: ${new Date(detection.timestamp).toLocaleString()}`,
              duration: 15000,
            });
          }
        });
      }
    } catch (error) {
      console.error('Error capturing frame:', error);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Camera className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Real-time CCTV Detection</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="location">Location (Optional)</Label>
            <Input
              id="location"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="e.g., Main entrance, Parking lot"
              disabled={isStreaming}
            />
          </div>

          <div className="space-y-4">
            <div className="relative bg-black rounded-lg overflow-hidden">
              <video
                ref={videoRef}
                autoPlay
                playsInline
                muted
                className="w-full aspect-video object-cover"
              />
              {isStreaming && (
                <div className="absolute top-4 left-4">
                  <Badge variant="destructive" className="animate-pulse">
                    <Video className="h-3 w-3 mr-1" />
                    LIVE
                  </Badge>
                </div>
              )}
            </div>

            <div className="flex gap-2">
              {!isStreaming ? (
                <Button onClick={startStream}>
                  <Camera className="mr-2 h-4 w-4" />
                  Start Camera
                </Button>
              ) : (
                <Button onClick={stopStream} variant="destructive">
                  <XCircle className="mr-2 h-4 w-4" />
                  Stop Camera
                </Button>
              )}
            </div>

            {isStreaming && (
              <p className="text-sm text-muted-foreground">
                ✓ Camera active - Scanning for criminals every 3 seconds
              </p>
            )}
          </div>
        </div>
      </Card>

      {detections.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-destructive animate-pulse" />
            <h3 className="text-lg font-semibold">Crime Detection Notes - Recent Alerts</h3>
          </div>

          <div className="space-y-4">
            {detections.map((detection, index) => (
              <Card key={index} className="p-5 border-destructive/50 bg-destructive/5">
                <div className="flex items-start gap-4">
                  <img
                    src={detection.type === 'evidence' ? detection.evidence.image_url : (detection.snapshotUrl || detection.criminal.photo_url)}
                    alt={detection.type === 'evidence' ? 'Evidence match' : detection.criminal.name}
                    className="w-24 h-24 rounded-lg object-cover border-2 border-destructive"
                  />
                  <div className="flex-1 space-y-3">
                    {detection.type === 'evidence' ? (
                      <>
                        <div className="flex items-center gap-2">
                          <h4 className="font-bold text-lg">📸 Evidence Match Detected</h4>
                          <Badge variant="secondary" className="text-xs">
                            {detection.confidence}% Match
                          </Badge>
                        </div>
                        <p className="text-sm text-blue-600 font-medium">
                          {detection.message}
                        </p>
                      </>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 flex-wrap">
                          <h4 className="font-bold text-lg text-destructive">🚨 {detection.criminal.name}</h4>
                          <Badge variant="destructive" className="text-xs animate-pulse">
                            {detection.confidence}% Match
                          </Badge>
                          <Badge 
                            variant={
                              detection.criminal.threat_level === 'critical' ? 'destructive' : 
                              detection.criminal.threat_level === 'high' ? 'destructive' : 
                              'secondary'
                            }
                            className="text-xs"
                          >
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {detection.criminal.threat_level.toUpperCase()} THREAT
                          </Badge>
                        </div>
                        
                        <Separator />
                        
                        <div className="grid grid-cols-2 gap-3 text-sm">
                          <div className="space-y-2">
                            {detection.criminal.age_range && (
                              <div className="flex items-center gap-2">
                                <User className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Age:</span>
                                <span className="font-medium">{detection.criminal.age_range}</span>
                              </div>
                            )}
                            {detection.criminal.height && (
                              <div className="flex items-center gap-2">
                                <Ruler className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Height:</span>
                                <span className="font-medium">{detection.criminal.height}</span>
                              </div>
                            )}
                            {detection.criminal.weight && (
                              <div className="flex items-center gap-2">
                                <Weight className="h-4 w-4 text-muted-foreground" />
                                <span className="text-muted-foreground">Weight:</span>
                                <span className="font-medium">{detection.criminal.weight}</span>
                              </div>
                            )}
                          </div>
                          <div className="space-y-2">
                            {detection.criminal.gender && (
                              <div className="flex items-start gap-2">
                                <span className="text-muted-foreground">Gender:</span>
                                <span className="font-medium">{detection.criminal.gender}</span>
                              </div>
                            )}
                            {detection.criminal.ethnicity && (
                              <div className="flex items-start gap-2">
                                <span className="text-muted-foreground">Ethnicity:</span>
                                <span className="font-medium">{detection.criminal.ethnicity}</span>
                              </div>
                            )}
                            {detection.criminal.build && (
                              <div className="flex items-start gap-2">
                                <span className="text-muted-foreground">Build:</span>
                                <span className="font-medium">{detection.criminal.build}</span>
                              </div>
                            )}
                          </div>
                        </div>

                        {detection.criminal.distinguishing_marks && (
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground">Distinguishing Marks:</span>
                            <p className="text-sm font-medium">{detection.criminal.distinguishing_marks}</p>
                          </div>
                        )}

                        {detection.criminal.known_offenses && detection.criminal.known_offenses.length > 0 && (
                          <div className="space-y-1">
                            <span className="text-xs font-semibold text-muted-foreground">Known Offenses:</span>
                            <div className="flex flex-wrap gap-1">
                              {detection.criminal.known_offenses.map((offense: string, idx: number) => (
                                <Badge key={idx} variant="outline" className="text-xs">
                                  {offense}
                                </Badge>
                              ))}
                            </div>
                          </div>
                        )}
                      </>
                    )}
                    
                    <Separator />
                    
                    <div className="space-y-1 text-sm">
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <Clock className="h-4 w-4" />
                        <span className="font-semibold">Detected:</span>
                        <span className="font-medium">{new Date(detection.timestamp).toLocaleString('en-US', {
                          dateStyle: 'full',
                          timeStyle: 'long'
                        })}</span>
                      </div>
                      <div className="flex items-center gap-2 text-muted-foreground">
                        <MapPin className="h-4 w-4" />
                        <span className="font-semibold">Location:</span>
                        <span className="font-medium">{location || 'Unknown'}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
