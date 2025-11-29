import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useNavigate } from "react-router-dom";
import { FileText, Calendar, MapPin, Trash2, Filter, MoreVertical, CheckCircle, Clock, Archive, XCircle } from "lucide-react";
import { toast } from "sonner";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
} from "@/components/ui/dropdown-menu";

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

type StatusFilter = "all" | "active" | "pending" | "solved" | "closed";
type CaseStatus = "active" | "pending" | "solved" | "closed";

interface CasesListProps {
  onStatsChange?: (stats: { cases: number; evidence: number; suspects: number }) => void;
}

export const CasesList = ({ onStatsChange }: CasesListProps) => {
  const [cases, setCases] = useState<Case[]>([]);
  const [filteredCases, setFilteredCases] = useState<Case[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<StatusFilter>("all");
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
  const [caseToDelete, setCaseToDelete] = useState<string | null>(null);
  const navigate = useNavigate();

  useEffect(() => {
    fetchCases();
  }, []);

  useEffect(() => {
    if (statusFilter === "all") {
      setFilteredCases(cases);
    } else {
      setFilteredCases(cases.filter(c => c.status === statusFilter));
    }
  }, [statusFilter, cases]);

  const fetchCases = async () => {
    try {
      const { data: casesData, error: casesError } = await supabase
        .from("cases")
        .select("*")
        .order("created_at", { ascending: false });

      if (casesError) throw casesError;
      setCases(casesData || []);

      // Fetch stats
      const { count: evidenceCount } = await supabase
        .from("evidence")
        .select("*", { count: "exact", head: true });

      const { count: suspectsCount } = await supabase
        .from("suspects")
        .select("*", { count: "exact", head: true });

      const activeCases = (casesData || []).filter(c => c.status === "active").length;

      onStatsChange?.({
        cases: activeCases,
        evidence: evidenceCount || 0,
        suspects: suspectsCount || 0,
      });
    } catch (error: any) {
      toast.error("Failed to load cases");
      console.error(error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleStatusChange = async (caseId: string, newStatus: CaseStatus) => {
    try {
      const { error } = await supabase
        .from("cases")
        .update({ status: newStatus })
        .eq("id", caseId);

      if (error) throw error;
      toast.success(`Case status updated to ${newStatus}`);
      fetchCases();
    } catch (error: any) {
      toast.error("Failed to update status");
      console.error(error);
    }
  };

  const handleDeleteCase = async () => {
    if (!caseToDelete) return;
    
    try {
      // Delete related data first
      await supabase.from("case_notes").delete().eq("case_id", caseToDelete);
      await supabase.from("evidence").delete().eq("case_id", caseToDelete);
      await supabase.from("suspects").delete().eq("case_id", caseToDelete);
      await supabase.from("detections").delete().eq("case_id", caseToDelete);
      
      const { error } = await supabase.from("cases").delete().eq("id", caseToDelete);
      if (error) throw error;
      
      toast.success("Case deleted successfully");
      setDeleteDialogOpen(false);
      setCaseToDelete(null);
      fetchCases();
    } catch (error: any) {
      toast.error("Failed to delete case");
      console.error(error);
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

  const getStatusIcon = (status: CaseStatus) => {
    const icons = {
      active: <CheckCircle className="w-4 h-4 text-green-500" />,
      pending: <Clock className="w-4 h-4 text-yellow-500" />,
      solved: <Archive className="w-4 h-4 text-blue-500" />,
      closed: <XCircle className="w-4 h-4 text-gray-500" />,
    };
    return icons[status];
  };

  if (isLoading) {
    return <div className="text-center py-8 text-muted-foreground">Loading cases...</div>;
  }

  return (
    <div className="space-y-4">
      {/* Filter Section */}
      <div className="flex items-center gap-3 pb-4 border-b border-border">
        <Filter className="w-4 h-4 text-muted-foreground" />
        <Select value={statusFilter} onValueChange={(val) => setStatusFilter(val as StatusFilter)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Filter by status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Cases</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="pending">Pending</SelectItem>
            <SelectItem value="solved">Solved</SelectItem>
            <SelectItem value="closed">Closed</SelectItem>
          </SelectContent>
        </Select>
        <span className="text-sm text-muted-foreground">
          {filteredCases.length} case{filteredCases.length !== 1 ? "s" : ""}
        </span>
      </div>

      {filteredCases.length === 0 ? (
        <div className="text-center py-12 space-y-3">
          <FileText className="w-12 h-12 mx-auto text-muted-foreground opacity-50" />
          <p className="text-muted-foreground">
            {cases.length === 0 ? "No cases yet" : `No ${statusFilter} cases found`}
          </p>
          {cases.length === 0 && (
            <p className="text-sm text-muted-foreground">Create your first investigation case to get started</p>
          )}
        </div>
      ) : (
        filteredCases.map((case_) => (
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
              
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <MoreVertical className="w-4 h-4" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" onClick={(e) => e.stopPropagation()}>
                  <DropdownMenuSub>
                    <DropdownMenuSubTrigger>
                      <span>Change Status</span>
                    </DropdownMenuSubTrigger>
                    <DropdownMenuSubContent>
                      {(["active", "pending", "solved", "closed"] as CaseStatus[]).map((status) => (
                        <DropdownMenuItem
                          key={status}
                          onClick={() => handleStatusChange(case_.id, status)}
                          className="flex items-center gap-2"
                        >
                          {getStatusIcon(status)}
                          <span className="capitalize">{status}</span>
                          {case_.status === status && <span className="ml-auto text-xs">✓</span>}
                        </DropdownMenuItem>
                      ))}
                    </DropdownMenuSubContent>
                  </DropdownMenuSub>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem
                    className="text-destructive focus:text-destructive"
                    onClick={() => {
                      setCaseToDelete(case_.id);
                      setDeleteDialogOpen(true);
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Delete Case
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
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
        ))
      )}

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Case</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this case? This will also delete all related evidence, suspects, and notes. This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={handleDeleteCase}
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};
