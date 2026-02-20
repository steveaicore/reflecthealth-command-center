import { useState, useEffect, useRef } from "react";
import { User, Send, Sparkles } from "lucide-react";
import penguinLogo from "@/assets/penguin-logo.png";

interface ChatMessage {
  id: string;
  speaker: "member" | "agent" | "ai-suggestion";
  text: string;
  timestamp: Date;
}

const INITIAL_MESSAGES: Omit<ChatMessage, "timestamp">[] = [
  { id: "m1", speaker: "member", text: "Hi, I need to check my eligibility for an upcoming specialist visit." },
  { id: "m2", speaker: "agent", text: "Of course! Let me pull up your account. Could you provide your member ID?" },
  { id: "m3", speaker: "member", text: "Sure, it's MBR-48291." },
];

const INCOMING_MESSAGES: string[] = [
  "And can you also confirm if I need a referral?",
  "My primary care doctor mentioned something about prior authorization.",
  "What would my copay be for this visit?",
];

const AI_SUGGESTIONS: string[] = [
  "Member MBR-48291 is active under BlueCross PPO. Specialist visits covered with $30 copay, no referral needed for in-network.",
  "No prior authorization required for this procedure code. Coverage confirmed through end of plan year.",
  "Copay for in-network specialist: $30. Out-of-network: $75 + 30% coinsurance after deductible.",
];

export function Five9ChatView() {
  const [messages, setMessages] = useState<ChatMessage[]>(
    INITIAL_MESSAGES.map(m => ({ ...m, timestamp: new Date() }))
  );
  const [agentInput, setAgentInput] = useState("");
  const [currentSuggestion, setCurrentSuggestion] = useState(AI_SUGGESTIONS[0]);
  const [msgIndex, setMsgIndex] = useState(0);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const timer = setInterval(() => {
      setMsgIndex(prev => {
        const next = prev + 1;
        if (next <= INCOMING_MESSAGES.length) {
          const newMsg: ChatMessage = {
            id: `auto-${next}`,
            speaker: "member",
            text: INCOMING_MESSAGES[next - 1],
            timestamp: new Date(),
          };
          setMessages(p => [...p, newMsg]);
          setCurrentSuggestion(AI_SUGGESTIONS[Math.min(next, AI_SUGGESTIONS.length - 1)]);
        }
        return next;
      });
    }, 8000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" });
  }, [messages]);

  const sendMessage = (text: string) => {
    if (!text.trim()) return;
    setMessages(p => [...p, { id: `agent-${Date.now()}`, speaker: "agent", text, timestamp: new Date() }]);
    setAgentInput("");
  };

  const useSuggestion = () => {
    sendMessage(currentSuggestion);
  };

  return (
    <div className="grid grid-cols-12 gap-0 h-full">
      {/* Chat window */}
      <div className="col-span-8 border-r five9-border flex flex-col five9-panel-bg">
        <div className="p-3 border-b five9-border">
          <span className="text-[10px] font-semibold uppercase tracking-[0.12em] text-five9-muted">Live Chat — Member MBR-48291</span>
        </div>
        <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 space-y-2">
          {messages.map(msg => (
            <div key={msg.id} className={`flex gap-2 ${msg.speaker === "member" ? "flex-row" : "flex-row-reverse"}`}>
              <div className={`w-6 h-6 rounded-full flex items-center justify-center shrink-0 ${
                msg.speaker === "member" ? "bg-secondary" : "bg-five9-accent/10"
              }`}>
                {msg.speaker === "member" ? <User className="h-3 w-3 text-five9-muted" /> : <img src={penguinLogo} alt="Penguin AI" className="h-4 w-4 object-contain" />}
              </div>
              <div className={`five9-card p-2 max-w-[75%] feed-item-enter ${msg.speaker !== "member" ? "five9-active-border" : ""}`}>
                <p className="text-[11px] text-foreground leading-relaxed">{msg.text}</p>
                <span className="text-[8px] text-five9-muted">{msg.timestamp.toLocaleTimeString()}</span>
              </div>
            </div>
          ))}
        </div>
        {/* Input */}
        <div className="p-3 border-t five9-border flex gap-2">
          <input
            value={agentInput}
            onChange={(e) => setAgentInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && sendMessage(agentInput)}
            placeholder="Type a reply..."
            className="flex-1 px-3 py-1.5 text-[11px] rounded border border-border bg-card focus:outline-none focus:ring-1 focus:ring-five9-accent"
          />
          <button onClick={() => sendMessage(agentInput)} className="px-3 py-1.5 rounded five9-accent-bg text-white">
            <Send className="h-3 w-3" />
          </button>
        </div>
      </div>

      {/* AI Suggestions */}
      <div className="col-span-4 overflow-y-auto five9-panel-bg p-3 space-y-3">
        <div className="flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-five9-accent" />
          <span className="text-[10px] font-semibold text-foreground">AI Chat Assist</span>
        </div>
        <div className="five9-card p-2.5 five9-active-border space-y-2">
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-five9-muted">Suggested Reply</span>
          <p className="text-[11px] text-foreground leading-relaxed">{currentSuggestion}</p>
          <button onClick={useSuggestion} className="w-full py-1.5 rounded text-[10px] font-medium five9-accent-bg text-white hover:opacity-90">
            Use Suggestion
          </button>
        </div>
        <div className="five9-card p-2.5">
          <span className="text-[9px] font-semibold uppercase tracking-[0.12em] text-five9-muted">Confidence</span>
          <div className="mt-1.5 flex items-center gap-2">
            <div className="flex-1 h-1.5 rounded-full bg-secondary overflow-hidden">
              <div className="h-full rounded-full five9-accent-bg" style={{ width: "91%" }} />
            </div>
            <span className="text-[10px] font-mono font-semibold text-emerald-600">91%</span>
          </div>
        </div>
      </div>
    </div>
  );
}
