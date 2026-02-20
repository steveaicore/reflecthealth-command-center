import { useState } from "react";
import { Mail, Send, AlertTriangle } from "lucide-react";
import penguinLogo from "@/assets/penguin-logo.png";

interface Email {
  id: string;
  from: string;
  subject: string;
  preview: string;
  time: string;
  type: "eligibility" | "claims" | "auth";
}

const INBOX: Email[] = [
  { id: "e1", from: "provider@bcbs.com", subject: "Eligibility Verification — Member #4821", preview: "Please confirm eligibility for upcoming procedure...", time: "2m ago", type: "eligibility" },
  { id: "e2", from: "claims@aetna.com", subject: "Claim Appeal #CB-1193", preview: "Requesting reconsideration of denied claim for...", time: "8m ago", type: "claims" },
  { id: "e3", from: "admin@uhc.com", subject: "Prior Authorization Request", preview: "Submitting PA for specialty medication...", time: "15m ago", type: "auth" },
  { id: "e4", from: "billing@cigna.com", subject: "COB Verification Needed", preview: "Need coordination of benefits confirmation for...", time: "22m ago", type: "eligibility" },
];

const AI_RESPONSES: Record<string, string> = {
  e1: "Member #4821 is active under BlueCross PPO. Specialist visits covered with $30 copay. No prior auth required for in-network providers. Recommend confirming provider network status.",
  e2: "Claim #CB-1193 was denied due to duplicate billing. AI analysis shows the original claim was processed on 2/5. Recommend responding with original processing confirmation and denial upheld.",
  e3: "PA request matches formulary criteria for specialty medication. AI recommends auto-approval based on diagnosis code match and prior treatment history.",
  e4: "COB verification shows primary coverage under Cigna. Secondary coverage under Medicare Part B. Recommend standard COB response template with coverage splits.",
};

export function Five9EmailView() {
  const [selected, setSelected] = useState<string | null>(null);
  const [draft, setDraft] = useState("");
  const [escalated, setEscalated] = useState<string | null>(null);

  const selectedEmail = INBOX.find(e => e.id === selected);

  return (
    <div className="grid grid-cols-12 gap-0 h-full">
      {/* Inbox list */}
      <div className="col-span-4 border-r five9-border overflow-y-auto five9-panel-bg">
        <div className="p-3">
          <div className="text-[10px] font-semibold uppercase tracking-[0.12em] text-five9-muted mb-2">
            Email Inbox ({INBOX.length})
          </div>
          {INBOX.map(email => (
            <button
              key={email.id}
              onClick={() => { setSelected(email.id); setDraft(""); setEscalated(null); }}
              className={`w-full text-left p-2.5 rounded mb-1 transition-colors ${
                selected === email.id ? "five9-active-border bg-card" : "hover:bg-secondary/50"
              }`}
            >
              <div className="flex items-center gap-1.5">
                <Mail className="h-3 w-3 text-five9-accent shrink-0" />
                <span className="text-[11px] font-medium text-foreground truncate">{email.subject}</span>
              </div>
              <span className="text-[9px] text-five9-muted block mt-0.5">{email.from} · {email.time}</span>
              <span className="text-[10px] text-muted-foreground truncate block mt-0.5">{email.preview}</span>
            </button>
          ))}
        </div>
      </div>

      {/* Email content */}
      <div className="col-span-4 border-r five9-border overflow-y-auto five9-panel-bg p-3">
        {selectedEmail ? (
          <div className="space-y-3">
            <div>
              <span className="text-xs font-semibold text-foreground">{selectedEmail.subject}</span>
              <span className="text-[10px] text-five9-muted block">From: {selectedEmail.from}</span>
            </div>
            <p className="text-[11px] text-foreground leading-relaxed">
              {selectedEmail.preview} We need this resolved as soon as possible to proceed with the scheduled appointment.
              Please verify coverage details and respond at your earliest convenience.
            </p>

            {escalated === selectedEmail.id && (
              <div className="p-2 rounded bg-amber-500/10 border border-amber-500/20 flex items-center gap-1.5 text-[10px] text-amber-700">
                <AlertTriangle className="h-3 w-3" />
                Escalated to senior agent
              </div>
            )}

            {/* Draft area */}
            <div className="space-y-2">
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-five9-muted">Draft Response</span>
              <textarea
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="Type your response..."
                className="w-full h-24 p-2 text-[11px] rounded border border-border bg-card resize-none focus:outline-none focus:ring-1 focus:ring-five9-accent"
              />
              <div className="flex gap-1.5">
                <button className="flex items-center gap-1 px-3 py-1.5 rounded text-[10px] font-medium five9-accent-bg text-white hover:opacity-90">
                  <Send className="h-2.5 w-2.5" /> Send
                </button>
                <button
                  onClick={() => setEscalated(selectedEmail.id)}
                  className="px-3 py-1.5 rounded text-[10px] font-medium bg-amber-500/10 text-amber-700 hover:bg-amber-500/20"
                >
                  Escalate
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-five9-muted text-center py-12">Select an email to view</div>
        )}
      </div>

      {/* AI Assist */}
      <div className="col-span-4 overflow-y-auto five9-panel-bg p-3">
        <div className="flex items-center gap-1.5 mb-3">
          <img src={penguinLogo} alt="Penguin AI" className="h-4 w-4 object-contain" />
          <span className="text-[10px] font-semibold text-foreground">AI Email Assist</span>
        </div>
        {selectedEmail ? (
          <div className="space-y-3">
            <div className="five9-card p-2.5 five9-active-border space-y-2">
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-five9-muted">Recommended Response</span>
              <p className="text-[11px] text-foreground leading-relaxed">{AI_RESPONSES[selectedEmail.id]}</p>
              <button
                onClick={() => setDraft(AI_RESPONSES[selectedEmail.id] || "")}
                className="w-full py-1.5 rounded text-[10px] font-medium five9-accent-bg text-white hover:opacity-90"
              >
                Auto-populate Draft
              </button>
            </div>
            <div className="five9-card p-2.5">
              <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-five9-muted">Analysis</span>
              <div className="mt-1.5 grid grid-cols-2 gap-x-3 gap-y-1 text-[10px]">
                <span className="text-five9-muted">Intent:</span>
                <span className="text-foreground font-medium capitalize">{selectedEmail.type}</span>
                <span className="text-five9-muted">Confidence:</span>
                <span className="text-emerald-600 font-mono font-medium">94%</span>
                <span className="text-five9-muted">Policy Ref:</span>
                <span className="text-foreground font-medium">Section 7.4</span>
              </div>
            </div>
          </div>
        ) : (
          <div className="text-[11px] text-five9-muted text-center py-12">Select an email for AI assistance</div>
        )}
      </div>
    </div>
  );
}
