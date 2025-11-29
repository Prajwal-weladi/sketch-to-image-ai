import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, AlertTriangle, Shield, Skull, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { AddCriminalDialog } from "@/components/AddCriminalDialog";

interface Criminal {
  id: string;
  name: string;
  photo_url: string;
  threat_level: 'low' | 'medium' | 'high' | 'critical';
  warrant_status: string | null;
  last_known_location: string | null;
  is_active: boolean;
  created_at: string;
}

export default function CriminalsDatabase() {
  const navigate = useNavigate();
  const [criminals, setCriminals] = useState<Criminal[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);

  useEffect(() => {
    fetchCriminals();
  }, []);

  const fetchCriminals = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('criminals')
        .select('*')
        .eq('is_active', true)
        .order('created_at', { ascending: false });

      if (error) throw error;
      setCriminals(data || []);
    } catch (error) {
      console.error('Error fetching criminals:', error);
      toast.error('Failed to load criminals database');
    } finally {
      setLoading(false);
    }
  };

  const getThreatIcon = (level: string) => {
    switch (level) {
      case 'critical':
        return <Skull className="h-4 w-4" />;
      case 'high':
        return <AlertTriangle className="h-4 w-4" />;
      case 'medium':
        return <Shield className="h-4 w-4" />;
      default:
        return <Shield className="h-4 w-4" />;
    }
  };

  const getThreatColor = (level: string) => {
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

  return (
    <div className="container mx-auto p-6">
      <Button 
        variant="ghost" 
        onClick={() => navigate(-1)}
        className="mb-4"
      >
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-3xl font-bold">Criminals Database</h1>
          <p className="text-muted-foreground">
            Manage wanted criminals and suspects for detection
          </p>
        </div>
        <Button onClick={() => setDialogOpen(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Criminal
        </Button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading criminals database...</div>
      ) : criminals.length === 0 ? (
        <Card className="p-12 text-center">
          <Shield className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">No criminals in database</h3>
          <p className="text-muted-foreground mb-4">
            Add criminals to start using the detection system
          </p>
          <Button onClick={() => setDialogOpen(true)}>
            <Plus className="mr-2 h-4 w-4" />
            Add First Criminal
          </Button>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {criminals.map((criminal) => (
            <Card key={criminal.id} className="overflow-hidden">
              <div className="aspect-square relative">
                <img
                  src={criminal.photo_url}
                  alt={criminal.name}
                  className="w-full h-full object-cover"
                />
                <Badge
                  variant={getThreatColor(criminal.threat_level) as any}
                  className="absolute top-2 right-2 gap-1"
                >
                  {getThreatIcon(criminal.threat_level)}
                  {criminal.threat_level.toUpperCase()}
                </Badge>
              </div>
              <div className="p-4">
                <h3 className="font-semibold text-lg mb-2">{criminal.name}</h3>
                
                {criminal.warrant_status && (
                  <div className="mb-2">
                    <Badge variant="outline" className="text-xs">
                      {criminal.warrant_status}
                    </Badge>
                  </div>
                )}
                
                {criminal.last_known_location && (
                  <p className="text-sm text-muted-foreground">
                    Last seen: {criminal.last_known_location}
                  </p>
                )}
              </div>
            </Card>
          ))}
        </div>
      )}

      <AddCriminalDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        onSuccess={fetchCriminals}
      />
    </div>
  );
}
