import { useState, useCallback, useEffect, useMemo } from "react";
import {
  type ScenarioScript, type ScriptBlock, type TransferPacket, type ValidationResult,
  validateScript, generateTransferPacket, formatTransferPacket, generateRefNumber,
} from "./scriptEngine";
import {
  type ResolutionEnding,
  getEndingsForUseCase, patchScriptBlocks,
} from "./resolutionVarietyEngine";
import { ResolutionEndingPanel } from "./ResolutionEndingPanel";
import { logAuditEvent } from "./auditLogger";
import { toast } from "@/hooks/use-toast";
import { Badge } from "@/components/ui/badge";
import {
  CheckCircle2, Circle, ChevronDown, Copy, ArrowRight,
  ShieldCheck, ShieldAlert, Phone, FileText, Zap, UserCheck,
  ClipboardCopy, AlertTriangle, Loader2, Play, SkipForward
} from "lucide-react";

interface ScriptGuidedPanelProps {
  scenario: ScenarioScript;
  autoPlay?: boolean;
}

export function ScriptGuidedPanel({ scenario, autoPlay = false }: ScriptGuidedPanelProps) {
  const [currentBlockIdx, setCurrentBlockIdx] = useState(0);
  const [completedBlocks, setCompletedBlocks] = useState<Set<string>>(new Set());
  const [phiVerified, setPhiVerified] = useState(false);
  const [phiPoints, setPhiPoints] = useState<string[]>([]);
  const [disposition, setDisposition] = useState<string>("");
  const [refNumber] = useState(() => generateRefNumber());
  const [transferPacket, setTransferPacket] = useState<TransferPacket | null>(null);
  const [isAutoPlaying, setIsAutoPlaying] = useState(autoPlay);
  const [capturedData, setCapturedData] = useState<Record<string, string>>({});
  const [selectedEnding, setSelectedEnding] = useState<ResolutionEnding | null>(null);

  // Patched scenario blocks when an ending is selected
  const activeBlocks = useMemo(() => {
    if (!selectedEnding) return scenario.blocks;
    return patchScriptBlocks(scenario.blocks, selectedEnding);
  }, [scenario.blocks, selectedEnding]);

  const validation = validateScript(scenario);
  const currentBlock = activeBlocks[currentBlockIdx];
  const isComplete = completedBlocks.size === activeBlocks.length;

  // Reset when scenario changes
  useEffect(() => {
    setCurrentBlockIdx(0);
    setCompletedBlocks(new Set());
    setPhiVerified(false);
    setPhiPoints([]);
    setDisposition("");
    setTransferPacket(null);
    setSelectedEnding(null);
  }, [scenario.scenarioId]);

  // Auto-play advancement
  useEffect(() => {
    if (!isAutoPlaying || isComplete) return;
    const timer = setTimeout(() => {
      handleCompleteBlock(currentBlock?.blockId || "");
    }, 2500);
    return () => clearTimeout(timer);
  }, [isAutoPlaying, currentBlockIdx, isComplete]);

  const handleEndingSelected = useCallback((ending: ResolutionEnding) => {
    setSelectedEnding(ending);
    // Auto-set disposition
    setDisposition(ending.disposition);
    logAuditEvent("DEFLECTION_SCORE_RECORDED", scenario.useCaseId, undefined, {
      ending_id: ending.ending_id,
      deflection_score: ending.deflection_score,
      disposition: ending.disposition,
    });
  }, [scenario.useCaseId]);

  const handleCompleteBlock = useCallback((blockId: string) => {
    setCompletedBlocks(prev => {
      const next = new Set(prev);
      next.add(blockId);
      return next;
    });

    if (blockId === "B") {
      const mockPoints = ["Full Name", "Date of Birth", "Member ID"];
      setPhiPoints(mockPoints);
      setPhiVerified(true);
      logAuditEvent("PHI_VERIFICATION_PASSED", scenario.useCaseId, undefined, { phiPoints: mockPoints, count: 3 });
    }

    if (blockId === "D") logAuditEvent("INTAKE_COMPLETED", scenario.useCaseId);
    if (blockId === "E" || blockId === "E-deesc") logAuditEvent("LOOKUP_RUN", scenario.useCaseId);

    if (currentBlockIdx < activeBlocks.length - 1) {
      setCurrentBlockIdx(prev => prev + 1);
    }
  }, [currentBlockIdx, activeBlocks, scenario]);

  const handleAction = useCallback((actionType: string, label: string) => {
    switch (actionType) {
      case "verify":
        setPhiPoints(["Full Name", "Date of Birth", "Member ID"]);
        setPhiVerified(true);
        logAuditEvent("PHI_VERIFICATION_PASSED", scenario.useCaseId, undefined, { phiPoints: ["Full Name", "Date of Birth", "Member ID"] });
        toast({ title: "Identity Verified", description: "3 PHI points matched successfully." });
        break;
      case "lookup":
        logAuditEvent("LOOKUP_RUN", scenario.useCaseId, undefined, { action: label });
        toast({ title: "Lookup Complete", description: `${label} — results loaded.` });
        break;
      case "generate_packet": {
        const packet = generateTransferPacket(
          phiVerified, phiPoints,
          selectedEnding?.agent_script_patch.blockH_summary || scenario.transferPacketTemplate?.summary || "Call context transfer",
          Object.entries(capturedData).map(([label, value]) => ({ label, value })),
          Array.from(completedBlocks).map(b => `Block ${b} completed`),
          scenario.transferPacketTemplate?.recommendedNextStep || "Continue resolution",
          scenario.transferPacketTemplate?.priority || "routine"
        );
        setTransferPacket(packet);
        logAuditEvent("WARM_TRANSFER_INITIATED", scenario.useCaseId, undefined, {
          target: selectedEnding?.agent_script_patch.blockH_target || scenario.config.warm_transfer_target,
        });
        toast({ title: "Transfer Packet Generated", description: "Ready for warm transfer." });
        break;
      }
      case "copy":
        if (transferPacket) {
          navigator.clipboard.writeText(formatTransferPacket(transferPacket));
          toast({ title: "Copied to Clipboard", description: "Transfer packet copied." });
        }
        break;
      case "warm_transfer":
        logAuditEvent("WARM_TRANSFER_COMPLETED", scenario.useCaseId, undefined, {
          target: selectedEnding?.agent_script_patch.blockH_target || scenario.config.warm_transfer_target,
        });
        toast({ title: "Warm Transfer Initiated", description: `Connecting to ${selectedEnding?.agent_script_patch.blockH_target || scenario.config.warm_transfer_target}…` });
        break;
      case "request_docs":
        logAuditEvent("DOCS_REQUESTED", scenario.useCaseId);
        toast({ title: "Documents Requested", description: "Document checklist sent to caller." });
        break;
      case "resolve":
        logAuditEvent("CALL_RESOLVED", scenario.useCaseId, undefined, { outcome: label });
        toast({ title: "Resolution Recorded", description: label });
        break;
      case "escalate":
        logAuditEvent("ESCALATION_TRIGGERED", scenario.useCaseId, undefined, { reason: label });
        toast({ title: "Escalation Triggered", description: label });
        break;
    }
  }, [scenario, selectedEnding, phiVerified, phiPoints, capturedData, completedBlocks, transferPacket]);

  const handleSetDisposition = (d: string) => {
    setDisposition(d);
    logAuditEvent("DISPOSITION_SET", scenario.useCaseId, undefined, {
      disposition: d, refNumber,
      ending_id: selectedEnding?.ending_id,
    });
    toast({ title: "Disposition Set", description: `${d} — Ref: ${refNumber}` });
  };

  const blockIcon = (block: ScriptBlock) => {
    const done = completedBlocks.has(block.blockId);
    const active = activeBlocks[currentBlockIdx]?.blockId === block.blockId;
    if (done) return <CheckCircle2 className="h-3.5 w-3.5 text-emerald-600 shrink-0" />;
    if (active) return <Loader2 className="h-3.5 w-3.5 text-primary animate-spin shrink-0" />;
    return <Circle className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />;
  };

  // Compute ending count for display
  const endingCount = useMemo(() => getEndingsForUseCase(scenario.useCaseId).length, [scenario.useCaseId]);

  return (
    <div className="space-y-2">
      {/* Validation Badge */}
      <div className="flex items-center justify-between">
        <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
          <FileText className="h-3 w-3" /> Script Guide
        </span>
        <div className="flex items-center gap-1.5">
          {validation.isValid ? (
            <Badge variant="outline" className="h-4 px-1.5 text-[8px] border-emerald-500/30 text-emerald-600 bg-emerald-500/5">
              <ShieldCheck className="h-2.5 w-2.5 mr-0.5" /> End-to-End Ready
            </Badge>
          ) : (
            <Badge variant="outline" className="h-4 px-1.5 text-[8px] border-amber-500/30 text-amber-600 bg-amber-500/5">
              <ShieldAlert className="h-2.5 w-2.5 mr-0.5" /> Incomplete
            </Badge>
          )}
          <Badge variant="outline" className="h-4 px-1.5 text-[8px] border-border text-muted-foreground">
            {endingCount} endings
          </Badge>
          <button
            onClick={() => setIsAutoPlaying(!isAutoPlaying)}
            className={`flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] font-medium transition-colors ${
              isAutoPlaying ? "bg-primary text-primary-foreground" : "bg-secondary text-muted-foreground hover:text-foreground"
            }`}
          >
            {isAutoPlaying ? <SkipForward className="h-2.5 w-2.5" /> : <Play className="h-2.5 w-2.5" />}
            {isAutoPlaying ? "Auto" : "Manual"}
          </button>
        </div>
      </div>

      {/* Progress bar */}
      <div className="h-1 rounded-full bg-secondary overflow-hidden">
        <div
          className="h-full rounded-full five9-accent-bg transition-all duration-500"
          style={{ width: `${(completedBlocks.size / activeBlocks.length) * 100}%` }}
        />
      </div>

      {/* Resolution Variety Engine Panel */}
      <ResolutionEndingPanel
        useCaseId={scenario.useCaseId}
        onEndingSelected={handleEndingSelected}
        selectedEnding={selectedEnding}
      />

      {/* Block stepper */}
      <div className="space-y-1">
        {activeBlocks.map((block, idx) => {
          const done = completedBlocks.has(block.blockId);
          const active = idx === currentBlockIdx;
          const isExpanded = active && !done;

          return (
            <div
              key={block.blockId}
              className={`rounded border transition-all duration-300 ${
                active && !done
                  ? "border-primary/30 bg-primary/5"
                  : done
                    ? "border-emerald-500/20 bg-emerald-500/5"
                    : "border-border bg-secondary/20 opacity-60"
              }`}
            >
              {/* Block header */}
              <button
                onClick={() => !done && setCurrentBlockIdx(idx)}
                className="w-full p-2 flex items-center gap-2 text-left"
              >
                {blockIcon(block)}
                <span className={`text-[10px] font-semibold flex-1 ${done ? "text-emerald-700" : active ? "text-foreground" : "text-muted-foreground"}`}>
                  {block.blockId}. {block.title}
                </span>
                {active && !done && <ChevronDown className="h-3 w-3 text-primary" />}
                {done && <span className="text-[8px] text-emerald-600 font-medium">Done</span>}
              </button>

              {/* Expanded block content */}
              {isExpanded && (
                <div className="px-2 pb-2.5 space-y-2 animate-in fade-in slide-in-from-top-1">
                  {/* Agent script */}
                  <div className="p-2 rounded bg-primary/5 border border-primary/10">
                    <span className="text-[8px] font-semibold text-primary uppercase tracking-wider">Say:</span>
                    <p className="text-[10px] text-foreground mt-0.5 leading-relaxed">
                      {block.agentSay.replace("[REF]", refNumber)}
                    </p>
                  </div>

                  {/* Expected caller response */}
                  {block.callerExpected && (
                    <div className="p-1.5 rounded bg-secondary/40 border border-border">
                      <span className="text-[8px] text-muted-foreground uppercase">Expected:</span>
                      <p className="text-[9px] text-muted-foreground">{block.callerExpected}</p>
                    </div>
                  )}

                  {/* Data to capture */}
                  {block.dataToCapture.length > 0 && (
                    <div className="space-y-1">
                      <span className="text-[8px] font-semibold text-muted-foreground uppercase">Capture:</span>
                      <div className="flex flex-wrap gap-1">
                        {block.dataToCapture.map(field => (
                          <span key={field} className="text-[8px] px-1.5 py-0.5 rounded bg-secondary border border-border text-muted-foreground">
                            {field}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* PHI verification status (Block B) */}
                  {block.blockId === "B" && (
                    <div className={`p-2 rounded border ${phiVerified ? "bg-emerald-500/5 border-emerald-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
                      <div className="flex items-center gap-1.5">
                        {phiVerified ? <UserCheck className="h-3 w-3 text-emerald-600" /> : <ShieldAlert className="h-3 w-3 text-amber-600" />}
                        <span className={`text-[10px] font-semibold ${phiVerified ? "text-emerald-700" : "text-amber-700"}`}>
                          {phiVerified ? `Verified (${phiPoints.length}/${scenario.config.phi_required_count} PHI)` : `Awaiting ${scenario.config.phi_required_count} PHI Points`}
                        </span>
                      </div>
                      {phiVerified && (
                        <div className="flex flex-wrap gap-1 mt-1">
                          {phiPoints.map(p => (
                            <Badge key={p} variant="outline" className="text-[7px] h-3.5 border-emerald-500/30 text-emerald-600">{p}</Badge>
                          ))}
                        </div>
                      )}
                    </div>
                  )}

                  {/* Actions */}
                  {block.actions.length > 0 && (
                    <div className="flex flex-wrap gap-1">
                      {block.actions.map(action => (
                        <button
                          key={action.label}
                          onClick={() => handleAction(action.type, action.label)}
                          className="flex items-center gap-1 px-2 py-1 rounded text-[9px] font-medium five9-accent-bg text-white hover:opacity-90 transition-colors"
                        >
                          <Zap className="h-2.5 w-2.5" />
                          {action.label}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Transfer Packet Preview (Block H) */}
                  {block.blockId === "H" && transferPacket && (
                    <div className="p-2 rounded bg-secondary/40 border border-border space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-[9px] font-semibold text-foreground">Transfer Packet</span>
                        <button
                          onClick={() => {
                            navigator.clipboard.writeText(formatTransferPacket(transferPacket));
                            toast({ title: "Copied", description: "Transfer packet copied to clipboard." });
                          }}
                          className="flex items-center gap-0.5 px-1.5 py-0.5 rounded text-[8px] bg-secondary text-muted-foreground hover:text-foreground"
                        >
                          <ClipboardCopy className="h-2.5 w-2.5" /> Copy
                        </button>
                      </div>
                      <div className="text-[9px] space-y-0.5">
                        <div className="flex justify-between"><span className="text-muted-foreground">Identity:</span><span className={transferPacket.identityVerified ? "text-emerald-600" : "text-amber-600"}>{transferPacket.identityVerified ? "Verified ✓" : "Not Verified ✗"}</span></div>
                        <div className="flex justify-between"><span className="text-muted-foreground">Priority:</span><span className="text-foreground font-medium">{transferPacket.priority.toUpperCase()}</span></div>
                        <div><span className="text-muted-foreground">Summary:</span> <span className="text-foreground">{transferPacket.summary}</span></div>
                        <div><span className="text-muted-foreground">Next Step:</span> <span className="text-foreground">{transferPacket.recommendedNextStep}</span></div>
                      </div>
                      <div className="p-1.5 rounded bg-primary/5 border border-primary/10 mt-1">
                        <span className="text-[8px] font-semibold text-primary uppercase">While Transferring, Say:</span>
                        <p className="text-[9px] text-foreground mt-0.5">"I'm connecting you now with our {selectedEnding?.agent_script_patch.blockH_target || scenario.config.warm_transfer_target} team. I've shared all the details we discussed so you won't need to repeat anything. They'll be able to assist you from here. Is there anything else before I transfer?"</p>
                      </div>
                    </div>
                  )}

                  {/* Disposition (Block I) */}
                  {block.blockId === "I" && (
                    <div className="space-y-1.5">
                      <div className="p-2 rounded bg-secondary/40 border border-border">
                        <span className="text-[9px] font-semibold text-foreground">Reference Number:</span>
                        <span className="text-[10px] font-mono text-primary ml-1.5">{refNumber}</span>
                      </div>
                      <div className="space-y-1">
                        <span className="text-[8px] font-semibold text-muted-foreground uppercase">Set Disposition:</span>
                        <div className="flex flex-wrap gap-1">
                          {scenario.wrapUpDispositionOptions.map(d => (
                            <button
                              key={d}
                              onClick={() => handleSetDisposition(d)}
                              className={`px-2 py-0.5 rounded text-[9px] font-medium transition-colors ${
                                disposition === d
                                  ? "bg-emerald-500 text-white"
                                  : "bg-secondary text-muted-foreground hover:text-foreground hover:bg-secondary/80"
                              }`}
                            >
                              {d}
                            </button>
                          ))}
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Complete button */}
                  <button
                    onClick={() => handleCompleteBlock(block.blockId)}
                    className="w-full py-1.5 rounded bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-700 hover:bg-emerald-500/20 transition-colors flex items-center justify-center gap-1"
                  >
                    <CheckCircle2 className="h-3 w-3" />
                    Mark Complete & Continue
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Resolution summary */}
      {isComplete && (
        <div className="five9-card p-3 border-emerald-500/30 bg-emerald-500/5 space-y-2 animate-in fade-in">
          <div className="flex items-center gap-1.5">
            <CheckCircle2 className="h-4 w-4 text-emerald-600" />
            <span className="text-[12px] font-bold text-emerald-700">Call Resolved</span>
          </div>
          <div className="grid grid-cols-2 gap-2 text-[10px]">
            <div><span className="text-muted-foreground">Disposition:</span> <span className="font-semibold text-foreground">{disposition || selectedEnding?.disposition || "Resolved"}</span></div>
            <div><span className="text-muted-foreground">Reference:</span> <span className="font-mono text-primary">{refNumber}</span></div>
            <div><span className="text-muted-foreground">PHI Verified:</span> <span className={phiVerified ? "text-emerald-600" : "text-amber-600"}>{phiVerified ? "Yes ✓" : "No"}</span></div>
            <div><span className="text-muted-foreground">Blocks:</span> <span className="text-foreground">{completedBlocks.size}/{activeBlocks.length}</span></div>
            {selectedEnding && (
              <>
                <div><span className="text-muted-foreground">Ending:</span> <span className="text-foreground font-medium">{selectedEnding.label}</span></div>
                <div><span className="text-muted-foreground">Deflection:</span> <span className="text-foreground font-medium">{selectedEnding.deflection_score}%</span></div>
              </>
            )}
          </div>
        </div>
      )}

      {/* Escalation rules */}
      {scenario.escalationRules.length > 0 && currentBlock && ["E", "E-deesc", "F", "G"].includes(currentBlock.blockId) && (
        <div className="five9-card p-2 space-y-1">
          <span className="type-micro uppercase tracking-[0.12em] text-five9-muted flex items-center gap-1">
            <AlertTriangle className="h-3 w-3" /> Escalation Triggers
          </span>
          {scenario.escalationRules.map((rule, i) => (
            <div key={i} className="flex items-center justify-between text-[9px] p-1 rounded bg-secondary/20">
              <span className="text-muted-foreground">{rule.trigger}</span>
              <Badge variant="outline" className={`text-[7px] h-3.5 ${
                rule.priority === "expedited" ? "border-red-500/30 text-red-600" :
                rule.priority === "urgent" ? "border-amber-500/30 text-amber-600" :
                "border-border text-muted-foreground"
              }`}>
                {rule.target} · {rule.priority}
              </Badge>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
