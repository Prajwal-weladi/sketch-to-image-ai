import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Trash2, User, AlertTriangle } from "lucide-react";

interface Suspect {
  id: string;
  name: string | null;
  age_range: string | null;
  gender: string | null;
  ethnicity: string | null;
  height: string | null;
  build: string | null;
  distinguishing_marks: string | null;
  is_wanted: boolean;
  created_at: string;
}

interface SuspectsListProps {
  caseId: string;
  refreshTrigger?: number;
}

export const SuspectsList = ({ caseId, refreshTrigger }: SuspectsListProps) => {
  const [suspects, setSuspects] = useState<Suspect[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    fetchSuspects();
  }, [caseId, refreshTrigger]);

  const fetchSuspects = async () => {
    try {
      const { data, error } = await supabase
        .from("suspects")
        .select("*")
        .eq("case_id", caseId)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setSuspects(data || []);
    } catch (error: any) {
      toast.error("Failed to load suspects");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (suspectId: string) => {
    if (!confirm("Are you sure you want to delete this suspect?")) return;

    try {
      const { error } = await supabase
        .from("suspects")
        .delete()
        .eq("id", suspectId);

      if (error) throw error;
      toast.success("Suspect deleted");
      fetchSuspects();
    } catch (error: any) {
      toast.error("Failed to delete suspect");
      console.error(error);
    }
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading suspects...</div>;
  }

  if (suspects.length === 0) {
    return (
      <div className="text-center py-8 text-muted-foreground">
        No suspects added yet
      </div>
    );
  }

  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
      {suspects.map((suspect) => (
        <Card key={suspect.id} className="relative">
          <CardContent className="pt-6">
            <div className="flex items-start justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="w-10 h-10 rounded-full bg-muted flex items-center justify-center">
                  <User className="w-5 h-5 text-muted-foreground" />
                </div>
                <div>
                  <h3 className="font-semibold">{suspect.name || "Unknown"}</h3>
                  {suspect.is_wanted && (
                    <Badge variant="destructive" className="text-xs">
                      <AlertTriangle className="w-3 h-3 mr-1" />
                      Wanted
                    </Badge>
                  )}
                </div>
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={() => handleDelete(suspect.id)}
                className="text-destructive hover:text-destructive"
              >
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>

            <div className="space-y-2 text-sm">
              {suspect.age_range && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Age Range:</span>
                  <span>{suspect.age_range}</span>
                </div>
              )}
              {suspect.gender && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Gender:</span>
                  <span>{suspect.gender}</span>
                </div>
              )}
              {suspect.ethnicity && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Ethnicity:</span>
                  <span>{suspect.ethnicity}</span>
                </div>
              )}
              {suspect.height && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Height:</span>
                  <span>{suspect.height}</span>
                </div>
              )}
              {suspect.build && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Build:</span>
                  <span>{suspect.build}</span>
                </div>
              )}
              {suspect.distinguishing_marks && (
                <div className="mt-2">
                  <span className="text-muted-foreground">Distinguishing Marks:</span>
                  <p className="mt-1">{suspect.distinguishing_marks}</p>
                </div>
              )}
            </div>

            <p className="text-xs text-muted-foreground mt-4">
              Added: {new Date(suspect.created_at).toLocaleDateString()}
            </p>
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
