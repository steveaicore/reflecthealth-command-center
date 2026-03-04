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

// ── PBM Seeded Scenarios ──

export function buildPbmFormularyCheck(): ScenarioScript {
  const config: ScenarioConfig = {
    requires_phi_verification: true, phi_required_count: 3,
    allow_limited_info_mode: true, warm_transfer_enabled: true,
    warm_transfer_target: "PA Review Team", recording_disclosure_required: true,
    call_outcome_sla: "Immediate",
  };
  return {
    scenarioId: "pbm-formulary-001", useCaseId: "pbm-formulary",
    name: "Formulary & Coverage Check — Member",
    blocks: [
      blockA(config), blockB(config),
      blockC("checking formulary coverage for a medication"),
      blockD(["Drug Name", "Strength", "Dosage Form", "Preferred Pharmacy", "Plan Type"],
        ["What medication are you checking?", "What strength and form?", "Which pharmacy do you prefer?", "Are you on a commercial or Medicare plan?"]),
      blockE([{ label: "Run Coverage Check", type: "lookup" }, { label: "Check Alternatives", type: "lookup" }]),
      blockF("This medication is on Tier 2 of your formulary. Your estimated copay is $25 for a 30-day supply at a preferred pharmacy. No prior authorization is required, but there is a quantity limit of 30 tablets per fill."),
      blockG(["Coverage confirmed — no action needed", "PA required — initiate PA intake", "Warm transfer to PA team"]),
      blockH("PA Review Team", { summary: "Member formulary check — PA required for requested drug", recommendedNextStep: "Initiate PA with clinical documentation", priority: "routine" }),
      blockI(),
    ],
    escalationRules: [
      { trigger: "PA required for requested medication", target: "PA Review Team", priority: "routine" },
      { trigger: "Non-formulary drug with no alternatives", target: "Clinical Pharmacist", priority: "urgent" },
    ],
    resolutionOutcomes: ["resolved_on_call", "resolved_warm_transfer"],
    transferPacketTemplate: { summary: "Formulary check — PA needed", recommendedNextStep: "Collect clinical info and submit PA", priority: "routine" },
    wrapUpDispositionOptions: ["Resolved", "PA Initiated", "Warm Transfer", "Callback Scheduled"],
    config,
  };
}

export function buildPbmRejectTroubleshoot(): ScenarioScript {
  const config: ScenarioConfig = {
    requires_phi_verification: true, phi_required_count: 3,
    allow_limited_info_mode: false, warm_transfer_enabled: true,
    warm_transfer_target: "Pharmacy Help Desk", recording_disclosure_required: true,
    call_outcome_sla: "Immediate",
  };
  return {
    scenarioId: "pbm-reject-001", useCaseId: "pbm-reject",
    name: "Pharmacy Claim Rejection — Pharmacy Call",
    blocks: [
      blockA(config),
      { blockId: "B", title: "Pharmacy Verification",
        agentSay: "For verification, may I have your pharmacy NABP/NCPDP number, the patient's date of birth, and their member ID?",
        callerExpected: "Pharmacy provides NABP + patient DOB + member ID",
        dataToCapture: ["Pharmacy NABP/NCPDP", "Patient DOB", "Member ID"],
        actions: [{ label: "Verify Pharmacy", type: "verify" }],
        completionCriteria: "Pharmacy and patient identity verified" },
      blockC("a pharmacy claim rejection"),
      blockD(["Reject Code", "NDC", "Days Supply", "BIN/PCN/Group", "Prescriber NPI"],
        ["What reject code are you seeing?", "What NDC was submitted?", "What days supply?", "What BIN/PCN/Group?", "Prescriber NPI?"]),
      blockE([{ label: "Diagnose Reject", type: "lookup" }, { label: "Suggest Fix", type: "resolve" }]),
      blockF("The reject code 75 indicates prior authorization is required for this NDC. The prescriber can submit a PA request, or I can initiate the intake now if you have the clinical information available."),
      blockG(["Reject resolved — resubmit guidance provided", "PA initiated for prescriber", "Override applied", "Warm transfer to help desk"]),
      blockH("Pharmacy Help Desk", { summary: "Pharmacy reject — cannot resolve with standard troubleshooting", recommendedNextStep: "Specialized reject resolution", priority: "routine" }),
      blockI(),
    ],
    escalationRules: [
      { trigger: "Reject code not in standard resolution table", target: "Pharmacy Help Desk", priority: "routine" },
      { trigger: "Pharmacy reports patient safety concern", target: "Clinical Pharmacist", priority: "expedited" },
    ],
    resolutionOutcomes: ["resolved_on_call", "resolved_warm_transfer", "resolved_docs_requested"],
    transferPacketTemplate: { summary: "Pharmacy reject — needs specialized resolution", recommendedNextStep: "Review reject code and member eligibility", priority: "routine" },
    wrapUpDispositionOptions: ["Resolved", "Resubmit Guidance Given", "PA Initiated", "Override Applied", "Warm Transfer", "Escalated"],
    config,
  };
}

export function buildPbmPaIntake(): ScenarioScript {
  const config: ScenarioConfig = {
    requires_phi_verification: true, phi_required_count: 3,
    allow_limited_info_mode: false, warm_transfer_enabled: true,
    warm_transfer_target: "Clinical Pharmacist / PA Nurse", recording_disclosure_required: true,
    call_outcome_sla: "Standard: 72 hrs / Expedited: 24 hrs",
  };
  return {
    scenarioId: "pbm-pa-001", useCaseId: "pbm-pa",
    name: "Pharmacy PA Intake — Provider Office",
    blocks: [
      blockA(config),
      { blockId: "B", title: "Provider Verification",
        agentSay: "For verification, may I have the prescriber's NPI, the patient's date of birth, and their member ID?",
        callerExpected: "Provider office provides NPI + patient DOB + member ID",
        dataToCapture: ["Prescriber NPI", "Patient DOB", "Member ID"],
        actions: [{ label: "Verify Provider", type: "verify" }],
        completionCriteria: "Provider and patient identity verified" },
      blockC("submitting a pharmacy prior authorization"),
      blockD(["Drug Name", "NDC", "Diagnosis/ICD-10", "Prior Therapies Tried", "Contraindications", "Urgency"],
        ["What medication requires PA?", "What is the diagnosis?", "What therapies were tried previously?", "Any contraindications?", "Is this standard or expedited?"]),
      blockE([{ label: "Create PA Case", type: "resolve" }, { label: "Generate Doc Checklist", type: "request_docs" }]),
      blockF("I've created a PA case. The reference number is RH-PA-2024-4821. For a standard review, the turnaround is 72 hours. I need the following clinical documentation: office notes, prior therapy records, and lab results if applicable."),
      blockG(["PA case created — docs checklist provided", "Expedited — warm transfer to clinical pharmacist", "Complete submission — no further docs needed"]),
      blockH("Clinical Pharmacist / PA Nurse", { summary: "Expedited pharmacy PA — clinical review needed", recommendedNextStep: "Clinical determination within 24 hours", priority: "expedited" }),
      blockI(),
    ],
    escalationRules: [
      { trigger: "Expedited request — urgent clinical need", target: "Clinical Pharmacist", priority: "expedited" },
      { trigger: "Safety concern flagged during intake", target: "Clinical Pharmacist", priority: "expedited" },
      { trigger: "Provider requests peer-to-peer", target: "Medical Director", priority: "urgent" },
    ],
    resolutionOutcomes: ["resolved_on_call", "resolved_docs_requested", "resolved_warm_transfer"],
    transferPacketTemplate: { summary: "Pharmacy PA intake — expedited clinical review", recommendedNextStep: "Clinical determination", priority: "expedited" },
    wrapUpDispositionOptions: ["PA Created", "Docs Requested", "Warm Transfer — Expedited", "Callback Scheduled"],
    config,
  };
}

export function buildPbmSpecialtyOnboarding(): ScenarioScript {
  const config: ScenarioConfig = {
    requires_phi_verification: true, phi_required_count: 3,
    allow_limited_info_mode: true, warm_transfer_enabled: true,
    warm_transfer_target: "Specialty Pharmacy Team", recording_disclosure_required: true,
    call_outcome_sla: "5-7 business days for onboarding",
  };
  return {
    scenarioId: "pbm-specialty-001", useCaseId: "pbm-specialty",
    name: "Specialty Medication Onboarding — Member",
    blocks: [
      blockA(config), blockB(config),
      blockC("starting a specialty medication"),
      blockD(["Drug Name", "Prescriber Name/NPI", "Specialty Pharmacy Preference"],
        ["What specialty medication has been prescribed?", "Who is the prescribing provider?", "Do you have a preferred specialty pharmacy?"]),
      blockE([{ label: "Benefits Investigation", type: "lookup" }, { label: "Check PA Status", type: "lookup" }]),
      blockF("Your plan covers this specialty medication. The PA has been approved. Your estimated out-of-pocket cost is $75 per fill with your copay card applied. I'm going to connect you with our specialty pharmacy team who will coordinate delivery, cold chain handling, and your first injection training."),
      blockG(["Warm transfer to specialty pharmacy team"]),
      blockH("Specialty Pharmacy Team", { summary: "New specialty Rx onboarding — PA approved, member ready for enrollment", recommendedNextStep: "Coordinate delivery schedule and patient education", priority: "routine" }),
      blockI(),
    ],
    escalationRules: [
      { trigger: "PA not yet approved — needs clinical review", target: "PA Review Team", priority: "urgent" },
      { trigger: "Member has questions about side effects", target: "Clinical Pharmacist", priority: "routine" },
    ],
    resolutionOutcomes: ["resolved_warm_transfer"],
    transferPacketTemplate: { summary: "Specialty onboarding — PA approved, ready for enrollment", recommendedNextStep: "Schedule delivery and patient education", priority: "routine" },
    wrapUpDispositionOptions: ["Warm Transfer Completed", "Callback Scheduled"],
    config,
  };
}

export function buildPbmAppeals(): ScenarioScript {
  const config: ScenarioConfig = {
    requires_phi_verification: true, phi_required_count: 3,
    allow_limited_info_mode: false, warm_transfer_enabled: true,
    warm_transfer_target: "Appeals Team", recording_disclosure_required: true,
    call_outcome_sla: "Standard: 30 days / Expedited: 72 hrs",
  };
  return {
    scenarioId: "pbm-appeals-001", useCaseId: "pbm-appeals",
    name: "Pharmacy Denial Appeal — Member/Provider",
    blocks: [
      blockA(config), blockB(config),
      blockC("appealing a pharmacy denial"),
      blockD(["Drug Name", "Denial Ref", "Denial Reason", "Supporting Clinical Rationale", "Appeal Type"],
        ["What medication was denied?", "What is the denial reference?", "What was the denial reason?", "Do you have supporting clinical documentation?", "Standard or expedited appeal?"]),
      blockE([{ label: "Generate Appeal Checklist", type: "request_docs" }, { label: "Generate Appeal Packet", type: "generate_packet" }]),
      blockF("I've initiated your appeal. For a standard appeal, the review period is up to 30 days. You'll need to submit: the denial notice, clinical rationale from the prescriber, and any supporting lab results or medical records. I can provide the fax number and portal link."),
      blockG(["Appeal initiated — docs checklist provided", "Expedited — warm transfer to appeals team", "Appeal packet generated and submitted"]),
      blockH("Appeals Team", { summary: "Expedited pharmacy appeal — clinical urgency", recommendedNextStep: "Expedited review within 72 hours", priority: "expedited" }),
      blockI(),
    ],
    escalationRules: [
      { trigger: "Expedited appeal — delay risks health", target: "Appeals Team", priority: "expedited" },
      { trigger: "Member requests external review", target: "Appeals Supervisor", priority: "urgent" },
    ],
    resolutionOutcomes: ["resolved_on_call", "resolved_docs_requested", "resolved_warm_transfer"],
    transferPacketTemplate: { summary: "Pharmacy denial appeal — expedited", recommendedNextStep: "Expedited clinical review", priority: "expedited" },
    wrapUpDispositionOptions: ["Appeal Initiated", "Docs Requested", "Warm Transfer — Expedited", "Appeal Packet Submitted"],
    config,
  };
}

export function buildPbmDurEscalation(): ScenarioScript {
  const config: ScenarioConfig = {
    requires_phi_verification: true, phi_required_count: 3,
    allow_limited_info_mode: false, warm_transfer_enabled: true,
    warm_transfer_target: "Clinical Pharmacist", recording_disclosure_required: true,
    call_outcome_sla: "Immediate",
  };
  return {
    scenarioId: "pbm-dur-001", useCaseId: "pbm-dur",
    name: "DUR / Safety Alert — Immediate Clinical Handoff",
    blocks: [
      blockA(config), blockB(config),
      blockC("a drug safety alert"),
      blockD(["Drug Interaction/Alert", "Symptoms", "Urgency", "Dispensing Pharmacy NABP"],
        ["What interaction or alert was flagged?", "Is the patient experiencing symptoms?", "How urgent is this?", "Which pharmacy is involved?"]),
      { blockId: "E-emergency", title: "Emergency Screening",
        agentSay: "If you or the patient are experiencing a medical emergency, please hang up and call 911 immediately. Otherwise, I'm going to connect you with a clinical pharmacist right away.",
        dataToCapture: [], actions: [], completionCriteria: "Emergency status confirmed — not 911" },
      blockE([]),
      blockF("I've documented the safety alert. This requires immediate clinical pharmacist review. I'm connecting you now."),
      blockG(["Immediate warm transfer to clinical pharmacist"]),
      blockH("Clinical Pharmacist", { summary: "DUR safety alert — immediate clinical review required", recommendedNextStep: "Clinical assessment of drug interaction/safety concern", priority: "expedited" }),
      blockI(),
    ],
    escalationRules: [
      { trigger: "Any DUR/safety alert", target: "Clinical Pharmacist", priority: "expedited" },
      { trigger: "Patient experiencing adverse symptoms", target: "Clinical Pharmacist", priority: "expedited" },
    ],
    resolutionOutcomes: ["resolved_warm_transfer"],
    transferPacketTemplate: { summary: "DUR safety alert — immediate pharmacist review", recommendedNextStep: "Clinical assessment", priority: "expedited" },
    wrapUpDispositionOptions: ["Warm Transfer Completed — Clinical Pharmacist"],
    config,
  };
}

// ── Reflect Health: Claim Without Claim Number ──

export function buildReflectHealthClaimWithoutNumber(): ScenarioScript {
  const config: ScenarioConfig = {
    requires_phi_verification: true,
    phi_required_count: 3,
    allow_limited_info_mode: true,
    warm_transfer_enabled: false,
    recording_disclosure_required: true,
    call_outcome_sla: "Immediate",
  };

  return {
    scenarioId: "rh-claim-no-number-001",
    useCaseId: "claims-status",
    name: "Claim Status — No Claim Number (DOS + Billed Charges)",
    blocks: [
      blockA(config),
      blockB(config),
      blockC("checking the status of a claim without a claim number"),
      blockD(
        ["Member ID", "Date of Service", "Total Billed Charges", "Provider Name/NPI", "Service Description"],
        ["May I have the member ID?", "What was the date of service?", "What was the total amount billed?", "Which provider rendered the service?", "Can you describe the service performed?"]
      ),
      blockE([
        { label: "Search by DOS + Billed Amount", type: "lookup" },
        { label: "Cross-Reference Provider", type: "lookup" },
      ]),
      blockF("I located the claim using the date of service and billed charges. Claim CLM-48291 for January 15th, billed at $4,350, was adjudicated on January 28th. Payment of $3,480 was issued to the provider on February 3rd. The member responsibility is $870, applied to the individual deductible."),
      blockG(["Claim status delivered — no further action", "Send EOB to email on file", "Initiate resubmission if needed"]),
      blockI(),
    ],
    escalationRules: [
      { trigger: "Multiple claims match DOS + billed amount", target: "Claims Specialist", priority: "routine" },
      { trigger: "Caller disputes adjudication amount", target: "Supervisor", priority: "routine" },
    ],
    resolutionOutcomes: ["resolved_on_call"],
    wrapUpDispositionOptions: ["Resolved", "EOB Sent", "Callback Scheduled"],
    config,
  };
}

// ── Reflect Health: Complex Benefit Inquiry + Warm Transfer ──

export function buildReflectHealthBenefitInquiry(): ScenarioScript {
  const config: ScenarioConfig = {
    requires_phi_verification: true,
    phi_required_count: 3,
    allow_limited_info_mode: true,
    warm_transfer_enabled: true,
    warm_transfer_target: "Clinical Review / Benefits Specialist",
    recording_disclosure_required: true,
    call_outcome_sla: "Immediate for benefits; escalation for PA",
  };

  return {
    scenarioId: "rh-benefit-inquiry-001",
    useCaseId: "plain-language",
    name: "Complex Benefit Inquiry + Warm Transfer (SBC/SPD)",
    blocks: [
      blockA(config),
      blockB(config),
      blockC("a complex coverage question requiring plan document review"),
      blockD(
        ["Member ID", "Service/Procedure", "Provider Name", "In-Network Status"],
        ["May I have the member ID?", "What specific service or procedure are you inquiring about?", "Which provider will render the service?", "Is this provider in-network?"]
      ),
      blockE([
        { label: "Query SBC/SPD Knowledge Base", type: "lookup" },
        { label: "Pull Benefits Schedule", type: "lookup" },
        { label: "Check Accumulator Status", type: "lookup" },
      ]),
      blockF("Based on the Summary of Benefits and Coverage, outpatient cardiac rehabilitation is covered as a preventive service when medically necessary. The cost-sharing is a $40 copay per session for in-network providers, subject to the annual deductible. The plan allows up to 36 sessions per calendar year. No Schedule of Benefits applies — this is sourced from the SBC and SPD."),
      blockG(["Benefits explanation delivered — resolved", "Send written summary to email", "Escalate follow-up question to clinical review"]),
      blockH("Clinical Review / Benefits Specialist", {
        summary: "Provider calling about complex benefit inquiry — coverage explained, follow-up PA question requires clinical review",
        recommendedNextStep: "Review PA status and provide clinical determination update",
        priority: "routine",
      }),
      blockI(),
    ],
    escalationRules: [
      { trigger: "Follow-up question requires PA status / clinical determination", target: "Clinical Review", priority: "routine" },
      { trigger: "Coverage dispute or plan interpretation disagreement", target: "Benefits Supervisor", priority: "routine" },
      { trigger: "Low confidence on benefit interpretation", target: "Benefits Specialist", priority: "routine" },
    ],
    resolutionOutcomes: ["resolved_on_call", "resolved_warm_transfer"],
    transferPacketTemplate: {
      summary: "Benefit inquiry resolved — follow-up PA question escalated",
      recommendedNextStep: "Provide PA status and clinical determination",
      priority: "routine",
    },
    wrapUpDispositionOptions: ["Resolved", "Warm Transfer Completed", "Summary Sent", "Callback Scheduled"],
    config,
  };
}

// ── Get all seeded scenarios ──
export function getSeededScenarios(): ScenarioScript[] {
  return [
    buildReflectHealthEligibility(),
    buildReflectHealthPriorAuth(),
    buildReflectHealthEscalation(),
    buildReflectHealthClaimWithoutNumber(),
    buildReflectHealthBenefitInquiry(),
    buildPbmFormularyCheck(),
    buildPbmRejectTroubleshoot(),
    buildPbmPaIntake(),
    buildPbmSpecialtyOnboarding(),
    buildPbmAppeals(),
    buildPbmDurEscalation(),
  ];
}

export function getScenarioForUseCase(useCaseId: string): ScenarioScript | undefined {
  return getSeededScenarios().find(s => s.useCaseId === useCaseId);
}
