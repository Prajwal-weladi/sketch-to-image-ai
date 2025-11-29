import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Upload, Video, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface VideoDetectionProps {
  caseId: string;
}

export function VideoDetection({ caseId }: VideoDetectionProps) {
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [videoUrl, setVideoUrl] = useState<string>("");
  const [detections, setDetections] = useState<any[]>([]);

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.type.startsWith('video/') || file.type.startsWith('image/')) {
        setSelectedFile(file);
        setVideoUrl("");
        setDetections([]);
      } else {
        toast.error("Please select a video or image file");
      }
    }
  };

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error("Please select a file");
      return;
    }

    try {
      setUploading(true);

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) throw new Error("Not authenticated");

      const fileExt = selectedFile.name.split('.').pop();
      const fileName = `${user.id}/${caseId}/${Date.now()}.${fileExt}`;
      
      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('detection-videos')
        .upload(fileName, selectedFile);

      if (uploadError) throw uploadError;

      const { data: urlData } = supabase.storage
        .from('detection-videos')
        .getPublicUrl(uploadData.path);

      setVideoUrl(urlData.publicUrl);
      toast.success("File uploaded successfully");
    } catch (error) {
      console.error('Error uploading file:', error);
      toast.error("Failed to upload file");
    } finally {
      setUploading(false);
    }
  };

  const handleAnalyze = async () => {
    if (!videoUrl) {
      toast.error("Please upload a file first");
      return;
    }

    try {
      setAnalyzing(true);
      toast.info("Analyzing video for criminals...");

      const { data, error } = await supabase.functions.invoke('video-analysis', {
        body: { videoUrl, caseId }
      });

      if (error) throw error;

      if (data.detections && data.detections.length > 0) {
        setDetections(data.detections);
        toast.success(`Found ${data.detections.length} potential match(es)!`, {
          description: "Check the results below"
        });
      } else {
        toast.info(`No criminals detected. Analyzed ${data.facesDetected} face(s).`);
        setDetections([]);
      }
    } catch (error: any) {
      console.error('Error analyzing video:', error);
      toast.error(error.message || "Failed to analyze video");
    } finally {
      setAnalyzing(false);
    }
  };

  return (
    <div className="space-y-6">
      <Card className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-2 mb-4">
            <Video className="h-5 w-5" />
            <h3 className="text-lg font-semibold">Video/Image Analysis</h3>
          </div>

          <div className="space-y-2">
            <Label htmlFor="video-file">Upload Video or Image</Label>
            <Input
              id="video-file"
              type="file"
              accept="video/*,image/*"
              onChange={handleFileSelect}
              disabled={uploading || analyzing}
            />
            {selectedFile && (
              <p className="text-sm text-muted-foreground">
                Selected: {selectedFile.name}
              </p>
            )}
          </div>

          <div className="flex gap-2">
            <Button
              onClick={handleUpload}
              disabled={!selectedFile || uploading || analyzing}
            >
              {uploading ? "Uploading..." : "Upload"}
              <Upload className="ml-2 h-4 w-4" />
            </Button>

            <Button
              onClick={handleAnalyze}
              disabled={!videoUrl || analyzing}
              variant="default"
            >
              {analyzing ? "Analyzing..." : "Analyze for Criminals"}
            </Button>
          </div>

          {videoUrl && (
            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">Uploaded file:</p>
              {selectedFile?.type.startsWith('video/') ? (
                <video src={videoUrl} controls className="w-full max-w-md rounded" />
              ) : (
                <img src={videoUrl} alt="Uploaded" className="w-full max-w-md rounded" />
              )}
            </div>
          )}
        </div>
      </Card>

      {detections.length > 0 && (
        <Card className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="h-5 w-5 text-destructive" />
            <h3 className="text-lg font-semibold">Detections Found</h3>
          </div>

          <div className="space-y-4">
            {detections.map((detection, index) => (
              <Card key={index} className="p-4 border-destructive/50">
                <div className="flex items-start gap-4">
                  <img
                    src={detection.type === 'evidence' ? detection.evidence.image_url : detection.criminal.photo_url}
                    alt={detection.type === 'evidence' ? 'Evidence match' : detection.criminal.name}
                    className="w-20 h-20 rounded object-cover"
                  />
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      {detection.type === 'evidence' ? (
                        <>
                          <h4 className="font-semibold">Evidence Match</h4>
                          <Badge variant="secondary">
                            {detection.confidence}% Match
                          </Badge>
                        </>
                      ) : (
                        <>
                          <h4 className="font-semibold">{detection.criminal.name}</h4>
                          <Badge variant="destructive">
                            {detection.confidence}% Match
                          </Badge>
                        </>
                      )}
                    </div>
                    {detection.type === 'evidence' ? (
                      <p className="text-sm text-muted-foreground">
                        {detection.message}
                        {detection.evidence.notes && (
                          <span className="block mt-1">Note: {detection.evidence.notes}</span>
                        )}
                      </p>
                    ) : (
                      <>
                        <p className="text-sm text-muted-foreground">
                          Threat Level: <span className="font-medium text-destructive">
                            {detection.criminal.threat_level.toUpperCase()}
                          </span>
                        </p>
                        {detection.criminal.warrant_status && (
                          <p className="text-sm text-muted-foreground">
                            {detection.criminal.warrant_status}
                          </p>
                        )}
                      </>
                    )}
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
