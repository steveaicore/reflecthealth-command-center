export interface WorkflowStep {
  id: string;
  label: string;
  required: boolean;
}

export interface ScriptTemplate {
  opening: string;
  probingQuestions: string[];
  compliancePhrasing: { compliant: string; avoid: string }[];
}

export interface GuardrailRule {
  label: string;
  type: "phi_warning" | "must_escalate" | "must_confirm_identity" | "must_log";
}

export interface KPIProjection {
  ahtReductionPct: number;
  fcrImprovementPct: number;
  complianceCoveragePct: number;
  costPerCallReduction: number;
}

export interface RecommendedAction {
  title: string;
  why: string;
  requiredFields: string[];
}

export interface PolicySnippet {
  title: string;
  content: string;
  source: string;
  confidence: number;
}

export interface UseCaseProfile {
  id: string;
  name: string;
  shortName: string;
  description: string;
  primaryGoal: string;
  workflowSteps: WorkflowStep[];
  scriptTemplate: ScriptTemplate;
  requiredDataInputs: string[];
  integrationsUsed: string[];
  guardrails: GuardrailRule[];
  auditEventsToLog: string[];
  recommendedActions: RecommendedAction[];
  policySnippets: PolicySnippet[];
  kpiProjections: KPIProjection;
}

const WORKFLOW_FULL: WorkflowStep[] = [
  { id: "intake", label: "Intake", required: true },
  { id: "classification", label: "Classification", required: true },
  { id: "policy-match", label: "Policy Match", required: true },
  { id: "draft", label: "Draft", required: true },
  { id: "hitl", label: "Human Review", required: true },
  { id: "audit", label: "Audit", required: true },
];

function wf(requiredIds: string[]): WorkflowStep[] {
  return WORKFLOW_FULL.map(s => ({ ...s, required: requiredIds.includes(s.id) }));
}

export const USE_CASE_PROFILES: UseCaseProfile[] = [
  {
    id: "eligibility-coverage",
    name: "Eligibility & Coverage Check",
    shortName: "Eligibility",
    description: "24/7 self-service or agent-assisted eligibility verification with real-time plan lookup.",
    primaryGoal: "Reduce AHT by enabling instant eligibility confirmation",
    workflowSteps: wf(["intake", "classification", "policy-match", "audit"]),
    scriptTemplate: {
      opening: "Thank you for calling. I can help verify eligibility and coverage details. May I have the member ID?",
      probingQuestions: [
        "Can you confirm the member's date of birth?",
        "Which specific service or procedure do you need coverage details for?",
        "Is this for in-network or out-of-network coverage?"
      ],
      compliancePhrasing: [
        { compliant: "Based on the plan details on file, this service is covered under your current plan.", avoid: "You're definitely covered — don't worry about it." },
        { compliant: "I can confirm active coverage through the plan end date.", avoid: "Your insurance will always cover this." },
      ],
    },
    requiredDataInputs: ["Member ID", "DOB", "Provider NPI"],
    integrationsUsed: ["Five9 Voice", "Azure Data Lake", "Provider Directory", "CRM Sync"],
    guardrails: [
      { label: "Confirm member identity before disclosing PHI", type: "must_confirm_identity" },
      { label: "Log all eligibility lookups", type: "must_log" },
    ],
    auditEventsToLog: ["ELIGIBILITY_LOOKUP", "COVERAGE_DISCLOSED", "PLAN_DETAILS_VIEWED"],
    recommendedActions: [
      { title: "Verify Member Identity", why: "HIPAA requires identity confirmation before releasing PHI", requiredFields: ["Member ID", "DOB"] },
      { title: "Pull Plan Benefits", why: "Provides accurate copay, deductible, and coinsurance data", requiredFields: ["Member ID"] },
      { title: "Check Provider Network Status", why: "In-network vs out-of-network impacts cost estimates", requiredFields: ["Provider NPI"] },
      { title: "Generate Coverage Summary", why: "Gives caller a clear, plain-language answer", requiredFields: [] },
    ],
    policySnippets: [
      { title: "Eligibility Verification Protocol", content: "All eligibility inquiries must include member identity verification (2-factor: Member ID + DOB). Coverage status must reflect real-time plan data.", source: "KB-ELG-001", confidence: 97 },
      { title: "Network Status Disclosure", content: "When disclosing network status, always specify effective date and any pending network changes within 90 days.", source: "KB-ELG-014", confidence: 94 },
    ],
    kpiProjections: { ahtReductionPct: 42, fcrImprovementPct: 35, complianceCoveragePct: 98, costPerCallReduction: 3.85 },
  },
  {
    id: "claims-status",
    name: "Claims Status & Resolution",
    shortName: "Claims",
    description: "Real-time claim status lookup, resolution tracking, and denial explanation.",
    primaryGoal: "Improve FCR with instant claim status delivery",
    workflowSteps: wf(["intake", "classification", "policy-match", "draft", "audit"]),
    scriptTemplate: {
      opening: "I can help you check on a claim. Do you have the claim number or member ID?",
      probingQuestions: [
        "What is the claim number or date of service?",
        "Was this claim submitted by a provider or member?",
        "Are you inquiring about a specific denial or payment?"
      ],
      compliancePhrasing: [
        { compliant: "The claim is currently in [status] as of today's date.", avoid: "The claim should be paid soon." },
        { compliant: "The denial reason code indicates [specific reason]. Here are the next steps.", avoid: "They denied it for no good reason." },
      ],
    },
    requiredDataInputs: ["Member ID", "Claim ID", "Date of Service", "Provider NPI"],
    integrationsUsed: ["Five9 Voice", "Core Claims System", "Azure Data Lake", "CRM Sync"],
    guardrails: [
      { label: "Confirm identity before disclosing claim details", type: "must_confirm_identity" },
      { label: "PHI warning: claim data contains diagnosis codes", type: "phi_warning" },
      { label: "Log all claim status inquiries", type: "must_log" },
    ],
    auditEventsToLog: ["CLAIM_LOOKUP", "CLAIM_STATUS_DISCLOSED", "DENIAL_EXPLANATION_GIVEN"],
    recommendedActions: [
      { title: "Look Up Claim Status", why: "Provides real-time adjudication status", requiredFields: ["Claim ID"] },
      { title: "Explain Denial Reason", why: "Reduces repeat calls by clarifying denial codes", requiredFields: ["Claim ID"] },
      { title: "Initiate Resubmission", why: "Correctable denials can be resubmitted immediately", requiredFields: ["Claim ID", "Provider NPI"] },
      { title: "Generate EOB Summary", why: "Plain-language explanation of benefits paid", requiredFields: ["Claim ID"] },
      { title: "Transfer to Appeals", why: "Complex denials may require formal appeal", requiredFields: ["Claim ID"] },
    ],
    policySnippets: [
      { title: "Claim Status Disclosure", content: "Agents may disclose claim status, payment amount, and denial reason codes to verified callers. Do not speculate on future adjudication outcomes.", source: "KB-CLM-003", confidence: 96 },
      { title: "Timely Filing Rules", content: "Claims must be submitted within 90 days of service date for in-network and 180 days for out-of-network. Late submissions may be denied.", source: "KB-CLM-017", confidence: 93 },
    ],
    kpiProjections: { ahtReductionPct: 38, fcrImprovementPct: 41, complianceCoveragePct: 96, costPerCallReduction: 4.10 },
  },
  {
    id: "prior-auth",
    name: "Prior Authorization / Determination",
    shortName: "Prior Auth",
    description: "PA request status, clinical review tracking, and determination support.",
    primaryGoal: "Reduce PA cycle time with intelligent routing",
    workflowSteps: wf(["intake", "classification", "policy-match", "draft", "hitl", "audit"]),
    scriptTemplate: {
      opening: "I can assist with prior authorization inquiries. Do you have a PA reference number?",
      probingQuestions: [
        "What procedure or service requires authorization?",
        "Has the clinical documentation been submitted?",
        "What is the requested date of service?"
      ],
      compliancePhrasing: [
        { compliant: "The PA request is currently under clinical review. All required documentation has been received.", avoid: "It'll probably get approved." },
        { compliant: "The determination is expected within the timeframe required by regulation.", avoid: "We'll get to it when we can." },
      ],
    },
    requiredDataInputs: ["Member ID", "Provider NPI", "PA Reference Number", "CPT Code", "Diagnosis Code"],
    integrationsUsed: ["Five9 Voice", "Prior Auth System", "Clinical Review Queue", "CRM Sync"],
    guardrails: [
      { label: "Do not predict authorization outcomes", type: "must_escalate" },
      { label: "Clinical determinations require HITL review", type: "must_escalate" },
      { label: "Log all PA status inquiries", type: "must_log" },
    ],
    auditEventsToLog: ["PA_LOOKUP", "PA_STATUS_DISCLOSED", "CLINICAL_REVIEW_FLAGGED"],
    recommendedActions: [
      { title: "Check PA Status", why: "Real-time status from authorization system", requiredFields: ["PA Reference Number"] },
      { title: "Verify Documentation", why: "Ensures all clinical docs are on file", requiredFields: ["PA Reference Number"] },
      { title: "Escalate to Clinical", why: "Complex cases need clinical reviewer", requiredFields: ["PA Reference Number"] },
      { title: "Generate PA Timeline", why: "Shows regulatory compliance deadlines", requiredFields: ["PA Reference Number"] },
    ],
    policySnippets: [
      { title: "PA Turnaround Requirements", content: "Standard PA requests: 14 calendar days. Urgent requests: 72 hours. Concurrent review: 24 hours. These are regulatory minimums.", source: "KB-PA-002", confidence: 98 },
      { title: "Clinical Documentation", content: "PA requests require: diagnosis code, CPT code, clinical notes, and medical necessity justification. Incomplete submissions will be pended.", source: "KB-PA-008", confidence: 95 },
    ],
    kpiProjections: { ahtReductionPct: 30, fcrImprovementPct: 28, complianceCoveragePct: 99, costPerCallReduction: 5.20 },
  },
  {
    id: "evidence-upload",
    name: "Evidence Upload & Document Intake",
    shortName: "Doc Intake",
    description: "Fax/Portal/API document intake with OCR processing and classification.",
    primaryGoal: "Automate document classification and routing",
    workflowSteps: wf(["intake", "classification", "draft", "hitl", "audit"]),
    scriptTemplate: {
      opening: "I can help with document submissions. Are you submitting via fax, portal, or API?",
      probingQuestions: [
        "What type of document are you submitting?",
        "Is this related to a specific claim or authorization?",
        "Do you have a reference number for the submission?"
      ],
      compliancePhrasing: [
        { compliant: "Your document has been received and is being processed. You'll receive a confirmation number.", avoid: "We got your fax, should be fine." },
        { compliant: "OCR processing is underway. Any fields requiring manual review will be flagged.", avoid: "The computer will read it automatically." },
      ],
    },
    requiredDataInputs: ["Document Type", "Reference Number", "Member ID", "Submission Channel"],
    integrationsUsed: ["Five9 Voice", "OCR Engine", "Document Management System", "CRM Sync"],
    guardrails: [
      { label: "PHI in uploaded documents must be encrypted at rest", type: "phi_warning" },
      { label: "Log all document receipt events", type: "must_log" },
    ],
    auditEventsToLog: ["DOCUMENT_RECEIVED", "OCR_PROCESSED", "DOCUMENT_CLASSIFIED", "MANUAL_REVIEW_FLAGGED"],
    recommendedActions: [
      { title: "Confirm Document Receipt", why: "Provides caller with confirmation number", requiredFields: ["Reference Number"] },
      { title: "Check OCR Status", why: "Shows processing progress", requiredFields: ["Reference Number"] },
      { title: "Route to Manual Review", why: "Low-confidence OCR requires human review", requiredFields: ["Reference Number"] },
    ],
    policySnippets: [
      { title: "Document Retention", content: "All submitted documents must be retained for 7 years per CMS requirements. OCR results are stored alongside originals.", source: "KB-DOC-001", confidence: 96 },
    ],
    kpiProjections: { ahtReductionPct: 55, fcrImprovementPct: 22, complianceCoveragePct: 94, costPerCallReduction: 6.50 },
  },
  {
    id: "plain-language",
    name: "Plain-Language Explanation",
    shortName: "Plain Language",
    description: "Grade 6–8 reading level explanations of benefits, EOBs, and coverage terms.",
    primaryGoal: "Improve member comprehension and reduce repeat calls",
    workflowSteps: wf(["intake", "classification", "draft", "audit"]),
    scriptTemplate: {
      opening: "I'd be happy to explain that in simpler terms. What would you like me to clarify?",
      probingQuestions: [
        "Would you like me to explain your EOB statement?",
        "Is there a specific term or charge you'd like clarified?",
        "Would you prefer a written summary emailed to you?"
      ],
      compliancePhrasing: [
        { compliant: "Your deductible is the amount you pay before your insurance starts covering costs.", avoid: "Don't worry about the deductible — it's complicated." },
        { compliant: "This means your plan covers 80% of the cost, and you pay the remaining 20%.", avoid: "You only pay a little bit." },
      ],
    },
    requiredDataInputs: ["Member ID", "Document or Term to Explain"],
    integrationsUsed: ["Five9 Voice", "Plain Language Engine", "Benefits KB", "CRM Sync"],
    guardrails: [
      { label: "Reading level must be grade 6–8", type: "must_log" },
      { label: "Confirm member identity for personalized explanations", type: "must_confirm_identity" },
    ],
    auditEventsToLog: ["EXPLANATION_GENERATED", "READING_LEVEL_VERIFIED", "MEMBER_COMPREHENSION_CONFIRMED"],
    recommendedActions: [
      { title: "Generate Plain-Language EOB", why: "Translates complex EOB into simple terms", requiredFields: ["Member ID", "Claim ID"] },
      { title: "Explain Coverage Terms", why: "Defines deductible, copay, coinsurance simply", requiredFields: [] },
      { title: "Email Summary", why: "Sends written explanation for member reference", requiredFields: ["Member ID"] },
    ],
    policySnippets: [
      { title: "CMS Plain Language Requirements", content: "Medicare communications must be written at a 6th-8th grade reading level per CMS guidelines. Use short sentences and common words.", source: "KB-PL-001", confidence: 99 },
    ],
    kpiProjections: { ahtReductionPct: 20, fcrImprovementPct: 45, complianceCoveragePct: 100, costPerCallReduction: 2.80 },
  },
  {
    id: "multilingual",
    name: "Multilingual Assistance",
    shortName: "Multilingual",
    description: "Real-time language detection and 10+ language support for member interactions.",
    primaryGoal: "Eliminate language barriers in member service",
    workflowSteps: wf(["intake", "classification", "draft", "audit"]),
    scriptTemplate: {
      opening: "I can assist you in your preferred language. How may I help you today?",
      probingQuestions: [
        "Would you prefer to continue in [detected language]?",
        "Would you like written materials sent in your preferred language?",
        "Do you need an interpreter for a more complex discussion?"
      ],
      compliancePhrasing: [
        { compliant: "This service is available in over 10 languages at no additional cost.", avoid: "We only really support English well." },
        { compliant: "A certified interpreter is available if you need one.", avoid: "Can you find someone who speaks English?" },
      ],
    },
    requiredDataInputs: ["Member ID", "Preferred Language"],
    integrationsUsed: ["Five9 Voice", "Language Detection", "Translation Engine", "CRM Sync"],
    guardrails: [
      { label: "Never refuse service based on language", type: "must_escalate" },
      { label: "Log language preferences for compliance", type: "must_log" },
    ],
    auditEventsToLog: ["LANGUAGE_DETECTED", "TRANSLATION_INITIATED", "INTERPRETER_REQUESTED"],
    recommendedActions: [
      { title: "Detect Language", why: "Automatically identifies caller's language", requiredFields: [] },
      { title: "Enable Real-Time Translation", why: "Provides live translation during call", requiredFields: [] },
      { title: "Connect Interpreter", why: "Complex scenarios may need certified interpreter", requiredFields: [] },
    ],
    policySnippets: [
      { title: "Language Access Requirements", content: "Federal law requires meaningful access to services for LEP individuals. All Medicare communications must be available in the top 15 languages in the service area.", source: "KB-LANG-001", confidence: 97 },
    ],
    kpiProjections: { ahtReductionPct: 15, fcrImprovementPct: 30, complianceCoveragePct: 100, costPerCallReduction: 2.10 },
  },
  {
    id: "accessibility",
    name: "Accessibility Support",
    shortName: "Accessibility",
    description: "Section 508 / WCAG 2.2 AA compliant interactions and alternative format support.",
    primaryGoal: "Ensure equitable access for all members",
    workflowSteps: wf(["intake", "classification", "draft", "audit"]),
    scriptTemplate: {
      opening: "I'm here to help. Would you like any accessibility accommodations for this call?",
      probingQuestions: [
        "Would you prefer information in large print, audio, or Braille?",
        "Do you need additional time to process information?",
        "Would you like me to repeat or rephrase anything?"
      ],
      compliancePhrasing: [
        { compliant: "We can provide this information in large print, audio, or Braille at no extra cost.", avoid: "We can't really do Braille." },
        { compliant: "Take as much time as you need. I'm here to help.", avoid: "Can you hurry up?" },
      ],
    },
    requiredDataInputs: ["Member ID", "Accommodation Type"],
    integrationsUsed: ["Five9 Voice", "Accessibility Engine", "Alternative Formats System", "CRM Sync"],
    guardrails: [
      { label: "Never deny accessibility accommodations", type: "must_escalate" },
      { label: "Log all accommodation requests", type: "must_log" },
    ],
    auditEventsToLog: ["ACCOMMODATION_REQUESTED", "ALTERNATIVE_FORMAT_GENERATED", "ACCESSIBILITY_COMPLIANCE_LOGGED"],
    recommendedActions: [
      { title: "Offer Accommodations", why: "Proactively offer accessibility options", requiredFields: [] },
      { title: "Generate Alternative Format", why: "Large print, audio, or Braille versions", requiredFields: ["Member ID", "Document ID"] },
      { title: "Log Accommodation", why: "CMS requires tracking of accommodation requests", requiredFields: ["Member ID"] },
    ],
    policySnippets: [
      { title: "Section 508 Compliance", content: "All digital interactions must meet WCAG 2.2 AA standards. Alternative formats must be provided within 5 business days of request.", source: "KB-ACC-001", confidence: 98 },
    ],
    kpiProjections: { ahtReductionPct: 10, fcrImprovementPct: 25, complianceCoveragePct: 100, costPerCallReduction: 1.50 },
  },
  {
    id: "fraud-integrity",
    name: "Fraud / Program Integrity Review",
    shortName: "Fraud Review",
    description: "AI-flagged fraud signals with investigator routing and SIU escalation.",
    primaryGoal: "Detect and route fraud signals for investigation",
    workflowSteps: wf(["intake", "classification", "policy-match", "draft", "hitl", "audit"]),
    scriptTemplate: {
      opening: "I'm reviewing the details of this interaction for quality and compliance purposes.",
      probingQuestions: [
        "Can you verify the provider's NPI and billing address?",
        "Is this service consistent with the member's diagnosis history?",
        "Have there been multiple similar claims in a short timeframe?"
      ],
      compliancePhrasing: [
        { compliant: "This claim has been flagged for additional review per our quality assurance process.", avoid: "We think this is fraud." },
        { compliant: "Additional documentation may be required before processing.", avoid: "We're investigating you for fraud." },
      ],
    },
    requiredDataInputs: ["Claim ID", "Provider NPI", "Member ID", "Billing Codes"],
    integrationsUsed: ["Five9 Voice", "Fraud Detection Engine", "SIU System", "CRM Sync"],
    guardrails: [
      { label: "Never accuse a caller of fraud", type: "must_escalate" },
      { label: "All fraud signals must be escalated to SIU", type: "must_escalate" },
      { label: "Log all fraud review actions", type: "must_log" },
    ],
    auditEventsToLog: ["FRAUD_SIGNAL_DETECTED", "SIU_ESCALATION", "INVESTIGATION_INITIATED"],
    recommendedActions: [
      { title: "Review Billing Pattern", why: "Detects anomalous billing frequency or amounts", requiredFields: ["Provider NPI"] },
      { title: "Cross-Reference Claims", why: "Identifies duplicate or overlapping claims", requiredFields: ["Member ID"] },
      { title: "Escalate to SIU", why: "High-confidence fraud signals require investigator review", requiredFields: ["Claim ID"] },
      { title: "Flag for Prepayment Review", why: "Suspicious claims can be held pre-payment", requiredFields: ["Claim ID"] },
    ],
    policySnippets: [
      { title: "Fraud Reporting Requirements", content: "Suspected fraud must be reported to the OIG within 60 days of detection. All evidence must be preserved in its original form.", source: "KB-FRD-001", confidence: 99 },
    ],
    kpiProjections: { ahtReductionPct: 25, fcrImprovementPct: 15, complianceCoveragePct: 100, costPerCallReduction: 8.00 },
  },
  {
    id: "smart-escalation",
    name: "Smart Escalation + Context Handoff",
    shortName: "Escalation",
    description: "Intelligent routing with full context transfer to the right specialist.",
    primaryGoal: "Reduce re-explanation time with warm handoffs",
    workflowSteps: wf(["intake", "classification", "policy-match", "audit"]),
    scriptTemplate: {
      opening: "I'll connect you with a specialist who can help with this. Let me transfer all context so you won't need to repeat anything.",
      probingQuestions: [
        "Before I transfer, is there anything else you'd like me to note?",
        "Would you prefer a callback if wait times are long?",
        "Has this issue been escalated before?"
      ],
      compliancePhrasing: [
        { compliant: "I'm transferring you to a specialist with a full summary of our conversation.", avoid: "I'm going to transfer you — you'll need to explain everything again." },
        { compliant: "The specialist will have all the details from this call.", avoid: "Good luck with the next agent." },
      ],
    },
    requiredDataInputs: ["Member ID", "Call Context Summary", "Escalation Reason"],
    integrationsUsed: ["Five9 Voice", "Skill-Based Routing", "Context Transfer API", "CRM Sync"],
    guardrails: [
      { label: "Always transfer full context with escalation", type: "must_log" },
      { label: "Log escalation reason and destination", type: "must_log" },
    ],
    auditEventsToLog: ["ESCALATION_INITIATED", "CONTEXT_TRANSFERRED", "SPECIALIST_CONNECTED"],
    recommendedActions: [
      { title: "Generate Context Summary", why: "Creates structured handoff for receiving agent", requiredFields: [] },
      { title: "Select Specialist Queue", why: "Routes to the right skill group", requiredFields: ["Escalation Reason"] },
      { title: "Offer Callback Option", why: "Reduces abandonment during transfers", requiredFields: ["Member ID"] },
    ],
    policySnippets: [
      { title: "Warm Transfer Requirements", content: "All escalations must include: caller identity, verified status, call reason, actions taken, and outstanding issues. Cold transfers are prohibited for Medicare calls.", source: "KB-ESC-001", confidence: 97 },
    ],
    kpiProjections: { ahtReductionPct: 50, fcrImprovementPct: 20, complianceCoveragePct: 95, costPerCallReduction: 3.50 },
  },
  {
    id: "appeals-reconsiderations",
    name: "Appeals & Reconsiderations",
    shortName: "Appeals",
    description: "Draft appeal rationale with HITL review and regulatory compliance tracking.",
    primaryGoal: "Streamline appeal drafting with AI + human review",
    workflowSteps: wf(["intake", "classification", "policy-match", "draft", "hitl", "audit"]),
    scriptTemplate: {
      opening: "I can help with filing an appeal or reconsideration. Do you have the claim or denial reference number?",
      probingQuestions: [
        "What is the reason for the appeal?",
        "Do you have additional clinical documentation to support the appeal?",
        "Are you within the filing deadline for this appeal level?"
      ],
      compliancePhrasing: [
        { compliant: "You have the right to appeal this decision. The deadline is [X days] from the denial date.", avoid: "You probably won't win the appeal." },
        { compliant: "I'll draft the appeal rationale for clinical review before submission.", avoid: "I'll just submit whatever." },
      ],
    },
    requiredDataInputs: ["Claim ID", "Denial Reference", "Member ID", "Appeal Reason", "Supporting Documentation"],
    integrationsUsed: ["Five9 Voice", "Appeals Management System", "Clinical Review Queue", "CRM Sync"],
    guardrails: [
      { label: "Appeal rationale must be reviewed by clinical staff", type: "must_escalate" },
      { label: "Track regulatory filing deadlines", type: "must_log" },
      { label: "Log all appeal-related actions", type: "must_log" },
    ],
    auditEventsToLog: ["APPEAL_INITIATED", "RATIONALE_DRAFTED", "CLINICAL_REVIEW_REQUESTED", "APPEAL_SUBMITTED"],
    recommendedActions: [
      { title: "Check Filing Deadline", why: "Ensures appeal is within regulatory timeframe", requiredFields: ["Denial Reference"] },
      { title: "Draft Appeal Rationale", why: "AI-generated rationale for clinical review", requiredFields: ["Claim ID", "Appeal Reason"] },
      { title: "Submit for HITL Review", why: "Clinical staff must approve before submission", requiredFields: ["Claim ID"] },
      { title: "Track Appeal Status", why: "Monitors progress through appeal levels", requiredFields: ["Appeal Reference"] },
      { title: "Escalate to External Review", why: "If internal appeal is denied, external review is available", requiredFields: ["Appeal Reference"] },
    ],
    policySnippets: [
      { title: "Medicare Appeal Levels", content: "Level 1: Redetermination (60 days). Level 2: Reconsideration by QIC (180 days). Level 3: ALJ hearing ($180 threshold). Level 4: Medicare Appeals Council. Level 5: Federal court.", source: "KB-APL-001", confidence: 99 },
      { title: "Appeal Documentation Requirements", content: "Appeals must include: original claim, denial notice, clinical rationale, supporting medical records, and member/provider statement.", source: "KB-APL-005", confidence: 96 },
    ],
    kpiProjections: { ahtReductionPct: 35, fcrImprovementPct: 18, complianceCoveragePct: 100, costPerCallReduction: 7.50 },
  },
];

export const DEFAULT_USE_CASE_ID = "claims-status";

export function getUseCaseById(id: string): UseCaseProfile | undefined {
  return USE_CASE_PROFILES.find(p => p.id === id);
}
