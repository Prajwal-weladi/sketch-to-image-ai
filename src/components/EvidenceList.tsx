import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";

interface Evidence {
  id: string;
  image_url: string;
  type: string;
  notes: string | null;
  created_at: string;
}

interface EvidenceListProps {
  caseId: string;
}

export const EvidenceList = ({ caseId }: EvidenceListProps) => {
  const [evidence, setEvidence] = useState<Evidence[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchEvidence();
  }, [caseId]);

  const fetchEvidence = async () => {
    try {
      const { data, error } = await supabase
        .from("evidence")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setEvidence(data || []);
    } catch (error: any) {
      toast.error("Failed to load evidence");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading evidence...</div>;
  }

  if (evidence.length === 0) {
    return (
      <div className="text-center py-12">
        <p className="text-muted-foreground">No evidence uploaded yet</p>
        <p className="text-sm text-muted-foreground mt-2">Upload images to start building your case</p>
      </div>
    );
  }

  const getTypeColor = (type: string) => {
    const colors = {
      sketch: "bg-purple-500/10 text-purple-500 border-purple-500/20",
      generated: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      age_progression: "bg-orange-500/10 text-orange-500 border-orange-500/20",
      angle_view: "bg-green-500/10 text-green-500 border-green-500/20",
      feature_extraction: "bg-pink-500/10 text-pink-500 border-pink-500/20",
    };
    return colors[type as keyof typeof colors] || colors.sketch;
  };

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {evidence.map((item) => (
        <Card key={item.id} className="overflow-hidden">
          <div className="aspect-square relative">
            <img 
              src={item.image_url} 
              alt="Evidence" 
              className="w-full h-full object-cover"
            />
          </div>
          <CardContent className="p-4 space-y-2">
            <div className="flex items-center justify-between">
              <Badge variant="outline" className={getTypeColor(item.type)}>
                {item.type.replace(/_/g, " ")}
              </Badge>
              <span className="text-xs text-muted-foreground">
                {new Date(item.created_at).toLocaleDateString()}
              </span>
            </div>
            {item.notes && (
              <p className="text-sm text-muted-foreground line-clamp-2">{item.notes}</p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
