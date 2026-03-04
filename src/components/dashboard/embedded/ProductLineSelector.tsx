import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { PRODUCT_LINES } from "./productLines";
import { getProductLinesForOrgType } from "./orgTypeProfiles";
import { toast } from "@/hooks/use-toast";
import { logAuditEvent } from "./auditLogger";

interface ProductLineSelectorProps {
  selectedId: string;
  onSelect: (id: string) => void;
  orgTypeId?: string;
}

export function ProductLineSelector({ selectedId, onSelect, orgTypeId }: ProductLineSelectorProps) {
  const allIds = PRODUCT_LINES.map(p => p.id);
  const allowedIds = orgTypeId ? getProductLinesForOrgType(orgTypeId, allIds) : allIds;
  const filteredLines = PRODUCT_LINES.filter(p => allowedIds.includes(p.id));

  const handleChange = (newId: string) => {
    if (newId !== selectedId) {
      logAuditEvent("PRODUCT_LINE_CHANGED", "", undefined, { previousProductLineId: selectedId, newProductLineId: newId });
      onSelect(newId);
      const pl = PRODUCT_LINES.find(p => p.id === newId);
      toast({
        title: "Product line updated",
        description: `Switched to ${pl?.shortName || newId}. Use cases refreshed.`,
      });
    }
  };

  return (
    <Select value={selectedId} onValueChange={handleChange}>
      <SelectTrigger className="h-6 w-[120px] text-[10px] bg-white/10 border-white/20 text-white/90 focus:ring-0 focus:ring-offset-0 [&>span]:text-[10px]">
        <SelectValue placeholder="Product Line" />
      </SelectTrigger>
      <SelectContent className="max-h-[400px] w-[320px]">
        <div className="px-2 py-1.5 text-[9px] font-semibold uppercase tracking-[0.15em] text-muted-foreground">
          Insurance Product Line
        </div>
        {filteredLines.map((pl) => (
          <SelectItem key={pl.id} value={pl.id} className="text-[11px] py-1.5">
            <div className="flex items-center gap-2">
              <span className="text-[12px]">{pl.icon}</span>
              <div>
                <span className="font-medium">{pl.shortName}</span>
                <span className="text-muted-foreground ml-1.5 text-[9px]">{pl.description.slice(0, 45)}</span>
              </div>
            </div>
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}
