/* ═══════════════════════════════════════════════════════
   Script Engine — End-to-End Resolution System
   Provides structured script blocks A–I, PHI verification,
   warm transfer packets, and script validation.
   ═══════════════════════════════════════════════════════ */

// ── Types ──

export interface ScriptAction {
  label: string;
  type: "lookup" | "generate_packet" | "request_docs" | "warm_transfer" | "copy" | "resolve" | "escalate" | "verify";
  icon?: string;
}

export interface ScriptBlock {
  blockId: string;
  title: string;
  agentSay: string;
  callerExpected?: string;
  dataToCapture: string[];
  actions: ScriptAction[];
  completionCriteria: string;
}

export interface EscalationRule {
  trigger: string;
  target: string;
  priority: "routine" | "urgent" | "expedited";
}

export interface TransferPacket {
  identityVerified: boolean;
  phiPointsUsed: string[];
  summary: string;
  keyData: { label: string; value: string }[];
  attemptedActions: string[];
  recommendedNextStep: string;
  priority: "routine" | "urgent" | "expedited";
}

export type ResolutionOutcome =
  | "resolved_on_call"
  | "resolved_docs_requested"
  | "resolved_escalation"
  | "resolved_warm_transfer"
  | "callback_scheduled";

export interface ScenarioConfig {
  requires_phi_verification: boolean;
  phi_required_count: number;
  allow_limited_info_mode: boolean;
  warm_transfer_enabled: boolean;
  warm_transfer_target?: string;
  recording_disclosure_required: boolean;
  call_outcome_sla?: string;
}

export interface ScenarioScript {
  scenarioId: string;
  useCaseId: string;
  name: string;
  blocks: ScriptBlock[];
  escalationRules: EscalationRule[];
  resolutionOutcomes: ResolutionOutcome[];
  transferPacketTemplate?: Partial<TransferPacket>;
  wrapUpDispositionOptions: string[];
  config: ScenarioConfig;
}

// ── PHI Verification Fields ──

export const PHI_FIELDS = [
  "Full Name",
  "Date of Birth",
  "Member ID",
  "Last 4 SSN",
  "Address ZIP",
  "Phone on File",
  "Email on File",
] as const;

export type PhiField = typeof PHI_FIELDS[number];

// ── Script Block Builders ──

function blockA(config: ScenarioConfig): ScriptBlock {
  return {
    blockId: "A",
    title: "Greeting + Call Recording Disclosure",
    agentSay: config.recording_disclosure_required
      ? "Thank you for calling. Before we begin, I'd like to let you know this call may be recorded for quality and training purposes. Are you a member, provider, or calling on behalf of someone?"
      : "Thank you for calling. Are you a member, provider, or calling on behalf of someone?",
    callerExpected: "Caller confirms role (member / provider / biller)",
    dataToCapture: ["Caller Role"],
    actions: [],
    completionCriteria: "Caller role identified",
  };
}

function blockB(config: ScenarioConfig): ScriptBlock {
  const count = config.phi_required_count;
  return {
    blockId: "B",
    title: `Identity Verification (${count} PHI Points)`,
    agentSay: `For your protection, I'll need to verify your identity. Can you please provide me with ${count} of the following: your full name, date of birth, member ID, or the last four digits of your Social Security number?`,
    callerExpected: `Caller provides ${count} PHI match points`,
    dataToCapture: ["PHI Point 1", "PHI Point 2", "PHI Point 3"],
    actions: [
      { label: "Verify Identity", type: "verify" },
    ],
    completionCriteria: `${count} PHI points matched`,
  };
}

function blockC(issue: string): ScriptBlock {
  return {
    blockId: "C",
    title: "Problem Restatement + Goal Confirmation",
    agentSay: `Let me confirm I understand — you're calling about ${issue}. Is that correct?`,
    callerExpected: "Caller confirms or corrects the issue",
    dataToCapture: [],
    actions: [],
    completionCriteria: "Caller confirms understanding",
  };
}

function blockD(fields: string[], questions: string[]): ScriptBlock {
  return {
    blockId: "D",
    title: "Structured Intake",
    agentSay: "I'll need a few details to look this up. " + (questions[0] || ""),
    callerExpected: "Caller provides requested information",
    dataToCapture: fields,
    actions: [],
    completionCriteria: "All required fields captured",
  };
}

function blockE(actions: ScriptAction[]): ScriptBlock {
  return {
    blockId: "E",
    title: "Real-Time Action Execution",
    agentSay: "Let me pull up those details for you now…",
    dataToCapture: [],
    actions: [
      { label: "Run Status Lookup", type: "lookup" },
      { label: "Identify Missing Items", type: "lookup" },
      { label: "Generate Next Best Action", type: "resolve" },
      ...actions,
    ],
    completionCriteria: "All lookups complete, results displayed",
  };
}

function blockF(explanation: string): ScriptBlock {
  return {
    blockId: "F",
    title: "Decision / Status Explanation",
    agentSay: explanation,
    dataToCapture: [],
    actions: [],
    completionCriteria: "Status explained in plain language",
  };
}

function blockG(outcomes: string[]): ScriptBlock {
  return {
    blockId: "G",
    title: "Resolution Path",
    agentSay: "Based on what I've found, here's what happens next…",
    dataToCapture: [],
    actions: outcomes.map(o => ({ label: o, type: "resolve" as const })),
    completionCriteria: "Resolution outcome selected",
  };
}

function blockH(target: string, packet: Partial<TransferPacket>): ScriptBlock {
  return {
    blockId: "H",
    title: "Escalation / Warm Transfer",
    agentSay: `I'm going to connect you with our ${target} team who can assist further. While I transfer you, let me confirm what we've discussed so far…`,
    dataToCapture: [],
    actions: [
      { label: "Generate Transfer Packet", type: "generate_packet" },
      { label: "Copy Packet to Clipboard", type: "copy" },
      { label: "Initiate Warm Transfer", type: "warm_transfer" },
    ],
    completionCriteria: "Transfer packet generated and transfer initiated",
  };
}

function blockI(): ScriptBlock {
  return {
    blockId: "I",
    title: "Wrap-Up + Disposition",
    agentSay: "Before we end, let me confirm: [recap next steps]. Your reference number is [REF]. Is there anything else I can help with today?",
    callerExpected: "Caller confirms or asks additional question",
    dataToCapture: ["Disposition", "Reference Number"],
    actions: [
      { label: "Set Disposition", type: "resolve" },
    ],
    completionCriteria: "Disposition set and reference number provided",
  };
}

// ── Script Validator ──

export interface ValidationResult {
  isValid: boolean;
  missingBlocks: string[];
  warnings: string[];
}

export function validateScript(script: ScenarioScript): ValidationResult {
  const requiredBlockIds = ["A", "B", "C", "D", "E", "F", "G", "I"];
  const blockIds = new Set(script.blocks.map(b => b.blockId));
  const missingBlocks: string[] = [];
  const warnings: string[] = [];

  for (const id of requiredBlockIds) {
    if (!blockIds.has(id)) missingBlocks.push(id);
  }

  if (script.resolutionOutcomes.length === 0) {
    warnings.push("No resolution outcomes defined");
  }
  if (script.escalationRules.length === 0) {
    warnings.push("No escalation criteria defined");
  }
  if (script.resolutionOutcomes.includes("resolved_docs_requested")) {
    const hasDocAction = script.blocks.some(b => b.actions.some(a => a.type === "request_docs"));
    if (!hasDocAction) warnings.push("Doc-requested outcome but no doc checklist action");
  }
  if (script.resolutionOutcomes.includes("resolved_warm_transfer")) {
    if (!blockIds.has("H")) missingBlocks.push("H");
    if (!script.transferPacketTemplate) warnings.push("Warm transfer outcome but no transfer packet template");
  }

  return {
    isValid: missingBlocks.length === 0 && warnings.length === 0,
    missingBlocks,
    warnings,
  };
}

// ── Transfer Packet Generator ──

export function generateTransferPacket(
  identityVerified: boolean,
  phiPointsUsed: string[],
  summary: string,
  keyData: { label: string; value: string }[],
  attemptedActions: string[],
  recommendedNextStep: string,
  priority: "routine" | "urgent" | "expedited" = "routine"
): TransferPacket {
  return { identityVerified, phiPointsUsed, summary, keyData, attemptedActions, recommendedNextStep, priority };
}

export function formatTransferPacket(packet: TransferPacket): string {
  const lines = [
    "═══ WARM TRANSFER PACKET ═══",
    `Priority: ${packet.priority.toUpperCase()}`,
    `Identity Verified: ${packet.identityVerified ? "YES ✓" : "NO ✗"}`,
    `PHI Points Used: ${packet.phiPointsUsed.join(", ") || "None"}`,
    "",
    `Summary: ${packet.summary}`,
    "",
    "Key Data:",
    ...packet.keyData.map(d => `  • ${d.label}: ${d.value}`),
    "",
    "Already Attempted:",
    ...packet.attemptedActions.map(a => `  • ${a}`),
    "",
    `Recommended Next Step: ${packet.recommendedNextStep}`,
    "═══════════════════════════",
  ];
  return lines.join("\n");
}

// ── Mock Reference Number Generator ──
export function generateRefNumber(): string {
  const prefix = "RH";
  const date = new Date().toISOString().slice(2, 10).replace(/-/g, "");
  const rand = Math.random().toString(36).slice(2, 6).toUpperCase();
  return `${prefix}-${date}-${rand}`;
}

// ── Seeded Reflect Health Scenarios ──

export function buildReflectHealthEligibility(): ScenarioScript {
  const config: ScenarioConfig = {
    requires_phi_verification: true,
    phi_required_count: 3,
    allow_limited_info_mode: true,
    warm_transfer_enabled: false,
    recording_disclosure_required: true,
    call_outcome_sla: "Immediate",
  };

  return {
    scenarioId: "rh-eligibility-001",
    useCaseId: "eligibility-coverage",
    name: "Eligibility & Benefits — Full Resolution",
    blocks: [
      blockA(config),
      blockB(config),
      blockC("verifying eligibility and benefits coverage"),
      blockD(
        ["Member ID", "Plan Type", "Coverage Question", "Provider Name"],
        ["May I have your member ID?", "Which plan are you enrolled in?", "What specific coverage are you checking?", "Is there a specific provider you'd like to check network status for?"]
      ),
      blockE([]),
      blockF("Based on your plan details, your coverage is active. Your specialist copay is $30, your deductible is 74% met at $1,480 of $2,000, and no prior authorization is required for in-network specialists. Your out-of-pocket maximum remaining is $3,200."),
      blockG(["Confirm coverage details delivered", "Send written summary to email on file", "Schedule follow-up if needed"]),
      blockI(),
    ],
    escalationRules: [
      { trigger: "Caller disputes coverage information", target: "Benefits Supervisor", priority: "routine" },
      { trigger: "Complex plan structure (dual coverage / COB)", target: "COB Specialist", priority: "routine" },
    ],
    resolutionOutcomes: ["resolved_on_call"],
    wrapUpDispositionOptions: ["Resolved", "Docs Requested", "Callback Scheduled"],
    config,
  };
}

export function buildReflectHealthPriorAuth(): ScenarioScript {
  const config: ScenarioConfig = {
    requires_phi_verification: true,
    phi_required_count: 3,
    allow_limited_info_mode: true,
    warm_transfer_enabled: true,
    warm_transfer_target: "UM Clinical Review Team",
    recording_disclosure_required: true,
    call_outcome_sla: "24–48 hours",
  };

  return {
    scenarioId: "rh-prior-auth-001",
    useCaseId: "prior-auth",
    name: "Prior Auth Status + Warm Transfer",
    blocks: [
      blockA(config),
      blockB(config),
      blockC("a prior authorization request"),
      blockD(
        ["PA Reference #", "Date of Service", "CPT Code", "Ordering Provider NPI", "Urgency Level"],
        ["Do you have the PA reference number?", "What is the requested date of service?", "What procedure code is being authorized?", "Who is the ordering provider?", "Is this standard or expedited?"]
      ),
      blockE([
        { label: "Check PA Status", type: "lookup" },
        { label: "Verify Clinical Docs on File", type: "lookup" },
      ]),
      blockF("The prior authorization request is currently under clinical review. All required clinical documentation has been received. Because this requires a clinical determination, I'll connect you with our UM Clinical Review team who can provide a detailed update."),
      blockG(["PA status delivered — no transfer needed", "Connect to UM Clinical Review (warm transfer)", "Request additional documentation"]),
      blockH("UM Clinical Review", {
        summary: "Caller inquiring about PA status — clinical determination pending",
        recommendedNextStep: "Provide clinical review update and expected timeline",
        priority: "routine",
      }),
      blockI(),
    ],
    escalationRules: [
      { trigger: "Expedited request — urgent clinical need", target: "UM Clinical Review Team", priority: "expedited" },
      { trigger: "Caller requests peer-to-peer review", target: "Medical Director", priority: "urgent" },
      { trigger: "PA denied — caller wants to appeal", target: "Appeals Intake", priority: "routine" },
    ],
    resolutionOutcomes: ["resolved_on_call", "resolved_warm_transfer", "resolved_docs_requested"],
    transferPacketTemplate: {
      summary: "PA status inquiry — clinical review pending",
      recommendedNextStep: "Provide clinical review update",
      priority: "routine",
    },
    wrapUpDispositionOptions: ["Resolved", "Warm Transfer Completed", "Docs Requested", "Escalated", "Callback Scheduled"],
    config,
  };
}

export function buildReflectHealthEscalation(): ScenarioScript {
  const config: ScenarioConfig = {
    requires_phi_verification: true,
    phi_required_count: 3,
    allow_limited_info_mode: false,
    warm_transfer_enabled: true,
    warm_transfer_target: "Supervisor",
    recording_disclosure_required: true,
    call_outcome_sla: "Callback within 4 hours",
  };

  return {
    scenarioId: "rh-escalation-001",
    useCaseId: "claims-status",
    name: "Escalation Handling — Denial Dispute",
    blocks: [
      blockA(config),
      blockB(config),
      blockC("a claim denial that you'd like to dispute"),
      blockD(
        ["Claim ID", "Date of Service", "Denial Code", "Reason for Dispute"],
        ["What is the claim number?", "What was the date of service?", "Do you have the denial code from the letter?", "Can you tell me why you believe this should be covered?"]
      ),
      {
        blockId: "E-deesc",
        title: "De-escalation + Empathy",
        agentSay: "I completely understand your frustration, and I want to help resolve this. Let me look into the details of this denial so I can explain exactly what happened and what options you have.",
        dataToCapture: [],
        actions: [
          { label: "Look Up Claim & Denial", type: "lookup" },
        ],
        completionCriteria: "Caller acknowledged, claim data retrieved",
      },
      blockE([]),
      blockF("I can see the denial was issued because the service was coded as out-of-network. I understand that's frustrating. Here's what I can do: I can initiate a formal appeal on your behalf right now, or I can connect you with a supervisor who can review this in real time."),
      blockG(["Initiate appeal on the call", "Connect to Supervisor (warm transfer)", "Create escalation ticket with 4-hour callback SLA"]),
      blockH("Supervisor", {
        summary: "Member disputing claim denial — requesting supervisor review",
        recommendedNextStep: "Review denial rationale, consider network exception or appeal initiation",
        priority: "urgent",
      }),
      blockI(),
    ],
    escalationRules: [
      { trigger: "Caller requests supervisor", target: "Supervisor", priority: "urgent" },
      { trigger: "Caller uses threatening language", target: "Supervisor", priority: "expedited" },
      { trigger: "Denial involves emergency services", target: "Emergency Claims Review", priority: "expedited" },
    ],
    resolutionOutcomes: ["resolved_on_call", "resolved_escalation", "resolved_warm_transfer", "callback_scheduled"],
    transferPacketTemplate: {
      summary: "Member disputing claim denial",
      recommendedNextStep: "Supervisor review of denial rationale",
      priority: "urgent",
    },
    wrapUpDispositionOptions: ["Resolved", "Appeal Initiated", "Warm Transfer Completed", "Escalated — Callback Scheduled", "Supervisor Review"],
    config,
  };
}

// ── Get all seeded scenarios ──
export function getSeededScenarios(): ScenarioScript[] {
  return [
    buildReflectHealthEligibility(),
    buildReflectHealthPriorAuth(),
    buildReflectHealthEscalation(),
  ];
}

export function getScenarioForUseCase(useCaseId: string): ScenarioScript | undefined {
  return getSeededScenarios().find(s => s.useCaseId === useCaseId);
}
