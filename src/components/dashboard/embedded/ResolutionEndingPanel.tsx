import { useState, useCallback, useMemo } from "react";
import {
  type ResolutionEnding, type EndingMode, type DeflectionBias,
  getEndingsForUseCase, selectEnding, getDeflectionLevel,
  getDeflectionColor, getDeflectionBg,
} from "./resolutionVarietyEngine";
import { logAuditEvent } from "./auditLogger";
import { Badge } from "@/components/ui/badge";
import { toast } from "@/hooks/use-toast";
import {
  Shuffle, ChevronDown, Copy, Send, FileText, Phone,
  Scale, Zap, Shield, ArrowRight, ToggleLeft, ToggleRight
} from "lucide-react";

interface ResolutionEndingPanelProps {
  useCaseId: string;
  onEndingSelected: (ending: ResolutionEnding) => void;
  selectedEnding: ResolutionEnding | null;
}

export function ResolutionEndingPanel({ useCaseId, onEndingSelected, selectedEnding }: ResolutionEndingPanelProps) {
  const [endingMode, setEndingMode] = useState<EndingMode>("auto");
  const [deflectionBias, setDeflectionBias] = useState<DeflectionBias>("medium");
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  const endings = useMemo(() => getEndingsForUseCase(useCaseId), [useCaseId]);

  const handleAutoSelect = useCallback(() => {
    const ending = selectEnding(endings, deflectionBias);
    onEndingSelected(ending);
    logAuditEvent("ENDING_SELECTED", useCaseId, undefined, {
      ending_id: ending.ending_id,
      label: ending.label,
      mode: "auto",
      deflection_score: ending.deflection_score,
    });
  }, [endings, deflectionBias, useCaseId, onEndingSelected]);

  const handleManualSelect = useCallback((ending: ResolutionEnding) => {
    onEndingSelected(ending);
    setIsDropdownOpen(false);
    logAuditEvent("ENDING_FORCED_BY_AGENT", useCaseId, undefined, {
      ending_id: ending.ending_id,
      label: ending.label,
      mode: "manual",
      deflection_score: ending.deflection_score,
    });
    toast({ title: "Ending Selected", description: ending.label });
  }, [useCaseId, onEndingSelected]);

  const handleCopy = (text: string, label: string) => {
    navigator.clipboard.writeText(text);
    toast({ title: "Copied", description: `${label} copied to clipboard.` });
  };

  const actionIcon = (type: string) => {
    switch (type) {
      case "copy": return <Copy className="h-2.5 w-2.5" />;
      case "send": return <Send className="h-2.5 w-2.5" />;
      case "generate": return <FileText className="h-2.5 w-2.5" />;
      case "transfer": return <Phone className="h-2.5 w-2.5" />;
      case "appeal": return <Scale className="h-2.5 w-2.5" />;
      case "escalate": return <Shield className="h-2.5 w-2.5" />;
      default: return <Zap className="h-2.5 w-2.5" />;
    }
  };

  const deflLevel = selectedEnding ? getDeflectionLevel(selectedEnding.deflection_score) : null;

  return (
    <div className="five9-card p-2.5 space-y-2">
      {/* Header */}
      <div className="flex items-center justify-between">
        <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
          <Shuffle className="h-3 w-3" /> Resolution Engine
        </span>
        <div className="flex items-center gap-1">
          {/* Auto/Manual Toggle */}
          <button
            onClick={() => setEndingMode(endingMode === "auto" ? "manual" : "auto")}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium transition-colors ${
              endingMode === "auto"
                ? "bg-primary/10 text-primary border border-primary/20"
                : "bg-secondary text-muted-foreground border border-border"
            }`}
          >
            {endingMode === "auto" ? <ToggleRight className="h-2.5 w-2.5" /> : <ToggleLeft className="h-2.5 w-2.5" />}
            {endingMode === "auto" ? "Auto" : "Manual"}
          </button>
        </div>
      </div>

      {/* Deflection Bias Selector */}
      <div className="flex items-center gap-1">
        <span className="text-[8px] text-five9-muted">Deflection Bias:</span>
        {(["low", "medium", "high"] as DeflectionBias[]).map(b => (
          <button
            key={b}
            onClick={() => setDeflectionBias(b)}
            className={`px-1.5 py-0.5 rounded text-[8px] font-medium capitalize transition-colors ${
              deflectionBias === b
                ? "five9-accent-bg text-white"
                : "bg-secondary text-five9-muted hover:text-foreground"
            }`}
          >
            {b}
          </button>
        ))}
      </div>

      {/* Auto Mode: Roll button */}
      {endingMode === "auto" && (
        <button
          onClick={handleAutoSelect}
          className="w-full py-1.5 rounded bg-primary/10 border border-primary/20 text-[10px] font-semibold text-primary hover:bg-primary/20 transition-colors flex items-center justify-center gap-1"
        >
          <Shuffle className="h-3 w-3" />
          Roll Resolution ({endings.length} endings)
        </button>
      )}

      {/* Manual Mode: Dropdown */}
      {endingMode === "manual" && (
        <div className="relative">
          <button
            onClick={() => setIsDropdownOpen(!isDropdownOpen)}
            className="w-full py-1.5 px-2 rounded bg-secondary border border-border text-[10px] font-medium text-foreground flex items-center justify-between"
          >
            <span>{selectedEnding ? selectedEnding.label : "Select Ending…"}</span>
            <ChevronDown className={`h-3 w-3 transition-transform ${isDropdownOpen ? "rotate-180" : ""}`} />
          </button>
          {isDropdownOpen && (
            <div className="absolute z-50 mt-1 w-full max-h-48 overflow-y-auto rounded border border-border bg-popover shadow-lg">
              {endings.map(e => {
                const dl = getDeflectionLevel(e.deflection_score);
                return (
                  <button
                    key={e.ending_id}
                    onClick={() => handleManualSelect(e)}
                    className={`w-full text-left px-2 py-1.5 text-[9px] hover:bg-accent transition-colors flex items-center justify-between gap-1 ${
                      selectedEnding?.ending_id === e.ending_id ? "bg-primary/5" : ""
                    }`}
                  >
                    <span className="flex-1">{e.label}</span>
                    <div className="flex items-center gap-1 shrink-0">
                      <Badge variant="outline" className={`text-[7px] h-3.5 ${getDeflectionBg(dl)} ${getDeflectionColor(dl)}`}>
                        {e.deflection_score}%
                      </Badge>
                      <span className="text-[7px] text-muted-foreground">{e.disposition}</span>
                    </div>
                  </button>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Selected Ending Display */}
      {selectedEnding && (
        <div className="space-y-2 animate-in fade-in slide-in-from-top-1">
          {/* Deflection Badge */}
          <div className={`flex items-center justify-between p-1.5 rounded border ${deflLevel ? getDeflectionBg(deflLevel) : ""}`}>
            <span className="text-[9px] font-semibold text-foreground">{selectedEnding.label}</span>
            <Badge variant="outline" className={`text-[8px] h-4 ${deflLevel ? `${getDeflectionBg(deflLevel)} ${getDeflectionColor(deflLevel)}` : ""}`}>
              Deflection: {selectedEnding.deflection_score}% · {deflLevel?.toUpperCase()}
            </Badge>
          </div>

          {/* Disposition */}
          <div className="flex items-center gap-2 text-[9px]">
            <span className="text-muted-foreground">Disposition:</span>
            <Badge variant="outline" className={`text-[8px] h-4 ${
              selectedEnding.disposition === "Resolved" ? "border-emerald-500/30 text-emerald-600 bg-emerald-500/5" :
              selectedEnding.disposition === "Docs Requested" ? "border-amber-500/30 text-amber-600 bg-amber-500/5" :
              selectedEnding.disposition === "Warm Transfer" ? "border-blue-500/30 text-blue-600 bg-blue-500/5" :
              "border-red-500/30 text-red-600 bg-red-500/5"
            }`}>
              {selectedEnding.disposition}
            </Badge>
            {selectedEnding.handoff_required && (
              <Badge variant="outline" className="text-[8px] h-4 border-blue-500/30 text-blue-600 bg-blue-500/5">
                <Phone className="h-2 w-2 mr-0.5" /> Handoff
              </Badge>
            )}
          </div>

          {/* Outputs */}
          {selectedEnding.outputs && selectedEnding.outputs.length > 0 && (
            <div className="p-2 rounded bg-secondary/40 border border-border space-y-1">
              <span className="text-[8px] font-semibold text-muted-foreground uppercase">Outputs</span>
              <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                {selectedEnding.outputs.map(o => (
                  <div key={o.label} className="flex items-center justify-between text-[9px]">
                    <span className="text-muted-foreground">{o.label}:</span>
                    <span className="font-mono text-foreground font-medium">{o.value}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* UI Actions */}
          {selectedEnding.ui_actions.length > 0 && (
            <div className="flex flex-wrap gap-1">
              {selectedEnding.ui_actions.map(action => (
                <button
                  key={action.label}
                  onClick={() => {
                    if (action.type === "copy") {
                      const val = selectedEnding.outputs?.find(o => action.label.includes(o.value))?.value || action.label;
                      handleCopy(val, action.label);
                    } else {
                      logAuditEvent("ENDING_ACTION_TAKEN", useCaseId, undefined, { action: action.label, type: action.type });
                      toast({ title: action.label, description: `${action.type} action executed.` });
                    }
                  }}
                  className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium five9-accent-bg text-white hover:opacity-90 transition-colors"
                >
                  {actionIcon(action.type)}
                  {action.label}
                </button>
              ))}
            </div>
          )}

          {/* Script Preview */}
          <div className="p-2 rounded bg-primary/5 border border-primary/10">
            <span className="text-[8px] font-semibold text-primary uppercase tracking-wider flex items-center gap-1">
              <ArrowRight className="h-2.5 w-2.5" /> Resolution Script
            </span>
            <p className="text-[9px] text-foreground mt-0.5 leading-relaxed">
              {selectedEnding.agent_script_patch.blockF}
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
