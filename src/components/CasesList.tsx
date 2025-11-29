import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText, Calendar, MapPin } from "lucide-react";
import { toast } from "sonner";

interface Case {
  id: string;
  case_number: string;
  title: string;
  description: string | null;
  status: string;
  officer_name: string;
  location: string | null;
  incident_date: string | null;
  created_at: string;
}

export const CasesList = () => {
  const [cases, setCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCases();
  }, []);

  const fetchCases = async () => {
    try {
      const { data, error } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (error) throw error;
      setCases(data || []);
    } catch (error: any) {
      toast.error("Failed to load cases");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    const colors = {
      active: "bg-green-500/10 text-green-500 border-green-500/20",
      pending: "bg-yellow-500/10 text-yellow-500 border-yellow-500/20",
      solved: "bg-blue-500/10 text-blue-500 border-blue-500/20",
      closed: "bg-gray-500/10 text-gray-500 border-gray-500/20",
    };
    return colors[status as keyof typeof colors] || colors.pending;
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading cases...</div>;
  }

  if (cases.length === 0) {
    return (
      <div className="text-center py-12 space-y-3">
        <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
        <p className="text-muted-foreground">No cases yet</p>
        <p className="text-sm text-muted-foreground">Create your first investigation case to get started</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cases.map((case_) => (
        <div
          key={case_.id}
          className="p-4 rounded-lg border border-border hover:border-primary/50 transition-all cursor-pointer bg-gradient-card"
          onClick={() => navigate(`/case/${case_.id}`)}
        >
          <div className="flex items-start justify-between mb-3">
            <div className="space-y-1">
              <div className="flex items-center gap-2">
                <h3 className="font-semibold text-foreground">{case_.title}</h3>
                <Badge variant="outline" className={getStatusColor(case_.status)}>
                  {case_.status}
                </Badge>
              </div>
              <p className="text-sm text-muted-foreground">Case #{case_.case_number}</p>
            </div>
          </div>

          {case_.description && (
            <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
              {case_.description}
            </p>
          )}

          <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
            <div className="flex items-center gap-1">
              <span className="font-medium">Officer:</span> {case_.officer_name}
            </div>
            {case_.location && (
              <div className="flex items-center gap-1">
                <MapPin className="w-3 h-3" />
                {case_.location}
              </div>
            )}
            {case_.incident_date && (
              <div className="flex items-center gap-1">
                <Calendar className="w-3 h-3" />
                {new Date(case_.incident_date).toLocaleDateString()}
              </div>
            )}
          </div>
        </div>
      ))}
    </div>
  );
};
