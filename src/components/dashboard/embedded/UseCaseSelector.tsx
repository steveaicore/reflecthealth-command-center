import { useState } from "react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { USE_CASE_PROFILES, type UseCaseProfile } from "./useCaseProfiles";
import { ChevronDown, Info } from "lucide-react";
import { toast } from "@/hooks/use-toast";

interface UseCaseSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function UseCaseSelector({ selectedId, onSelect }: UseCaseSelectorProps) {
  const [expandedInfo, setExpandedInfo] = useState(false);
  const selected = USE_CASE_PROFILES.find(p => p.id === selectedId);

  const handleChange = (newId: string) => {
    if (newId !== selectedId) {
      onSelect(newId);
      const profile = USE_CASE_PROFILES.find(p => p.id === newId);
      toast({
        title: "Use case updated",
        description: `Scripts and actions refreshed for ${profile?.shortName || newId}.`,
      });
    }
  };

  return (
    <div className="flex items-center gap-1.5">
      <Select value={selectedId} onValueChange={handleChange}>
        <SelectTrigger className="h-6 w-[140px] text-[10px] bg-white/10 border-white/20 text-white/90 focus:ring-0 focus:ring-offset-0 [&>span]:text-[10px]">
          <SelectValue placeholder="Use Case" />
        </SelectTrigger>
        <SelectContent className="max-h-[320px] w-[280px]">
          <div className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Medicare Use Case
          </div>
          {USE_CASE_PROFILES.map((p) => (
            <SelectItem key={p.id} value={p.id} className="text-[11px] py-1.5">
              <div>
                <span className="font-medium">{p.shortName}</span>
                <span className="text-muted-foreground ml-1.5 text-[9px]">{p.primaryGoal.slice(0, 40)}</span>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <button
        onClick={() => setExpandedInfo(!expandedInfo)}
        className="p-0.5 rounded text-white/50 hover:text-white/80 transition-colors"
        title="Explain this use case"
      >
        <Info className="h-3 w-3" />
      </button>
      {expandedInfo && selected && (
        <div className="absolute top-full right-0 mt-1 w-64 bg-card border border-border rounded-lg shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-1">
          <p className="text-[11px] font-semibold text-foreground mb-1">{selected.name}</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed">{selected.description}</p>
          <p className="text-[9px] text-primary mt-1 font-medium">Goal: {selected.primaryGoal}</p>
        </div>
      )}
    </div>
  );
}
