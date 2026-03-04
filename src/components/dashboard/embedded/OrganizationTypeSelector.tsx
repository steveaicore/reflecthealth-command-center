import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ORG_TYPE_PROFILES, getOrgTypeById } from "./orgTypeProfiles";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import { logAuditEvent } from "./auditLogger";
import { Info } from "lucide-react";
import { useState } from "react";

interface OrganizationTypeSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
}

export function OrganizationTypeSelector({ selectedId, onSelect }: OrganizationTypeSelectorProps) {
  const [showInfo, setShowInfo] = useState(false);
  const selected = getOrgTypeById(selectedId);

  const handleChange = (newId: string) => {
    if (newId !== selectedId) {
      logAuditEvent("ORG_TYPE_CHANGED", "", undefined, { previousOrgTypeId: selectedId, newOrgTypeId: newId });
      onSelect(newId);
      const org = getOrgTypeById(newId);
      toast({
        title: "Organization type updated",
        description: `Operating as ${org?.shortName || newId}. Product lines and use cases refreshed.`,
      });
    }
  };

  return (
    <div className="flex items-center gap-1.5 relative">
      <Select value={selectedId} onValueChange={handleChange}>
        <SelectTrigger className="h-7 w-[130px] text-[10px] bg-white/10 border-white/20 text-white/90 focus:ring-0 focus:ring-offset-0 [&>span]:text-[10px] [&>span]:truncate">
          <SelectValue placeholder="Org Type" />
        </SelectTrigger>
        <SelectContent className="max-h-[400px] w-[340px]">
          <div className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
            Organization Type
          </div>
          {ORG_TYPE_PROFILES.map((org) => (
            <SelectItem key={org.id} value={org.id} className="text-[11px] py-1.5">
              <div className="flex items-center gap-2">
                <span className="text-[12px]">{org.icon}</span>
                <div>
                  <span className="font-medium">{org.shortName}</span>
                  <span className="text-muted-foreground ml-1.5 text-[9px]">{org.description.slice(0, 50)}</span>
                </div>
              </div>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      {selected && (
        <Badge variant="outline" className="h-5 px-1.5 text-[8px] font-medium border-white/20 text-white/60 hidden xl:flex whitespace-nowrap">
          {selected.authorityModel.replace(/_/g, " ")}
        </Badge>
      )}
      <button
        onClick={() => setShowInfo(!showInfo)}
        className="p-0.5 rounded text-white/50 hover:text-white/80 transition-colors"
        title="About this org type"
      >
        <Info className="h-3 w-3" />
      </button>
      {showInfo && selected && (
        <div className="absolute top-full left-0 mt-1 w-72 bg-card border border-border rounded-lg shadow-lg p-3 z-50 animate-in fade-in slide-in-from-top-1">
          <p className="text-[11px] font-semibold text-foreground mb-1">{selected.icon} {selected.name}</p>
          <p className="text-[10px] text-muted-foreground leading-relaxed mb-2">{selected.description}</p>
          <div className="flex flex-wrap gap-1">
            {selected.supportedPersonas.map(p => (
              <Badge key={p} variant="secondary" className="text-[8px] h-4">{p}</Badge>
            ))}
          </div>
          <p className="text-[9px] text-primary mt-1.5 font-medium">Authority: {selected.authorityModel.replace(/_/g, " ")}</p>
        </div>
      )}
    </div>
  );
}
