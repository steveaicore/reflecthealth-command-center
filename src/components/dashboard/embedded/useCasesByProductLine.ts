import type { UseCaseProfile, WorkflowStep, ScriptTemplate, GuardrailRule, KPIProjection, RecommendedAction, PolicySnippet } from "./useCaseProfiles";

// Re-export for convenience
export type { UseCaseProfile };

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

/* ── Helper to generate a use case profile compactly ── */
function uc(
  id: string, name: string, shortName: string, description: string, primaryGoal: string,
  wfIds: string[],
  script: { opening: string; questions: string[]; compliance: { compliant: string; avoid: string }[] },
  inputs: string[], integrations: string[], guardrails: GuardrailRule[],
  actions: RecommendedAction[], snippets: PolicySnippet[],
  kpi: KPIProjection
): UseCaseProfile {
  return {
    id, name, shortName, description, primaryGoal,
    workflowSteps: wf(wfIds),
    scriptTemplate: { opening: script.opening, probingQuestions: script.questions, compliancePhrasing: script.compliance },
    requiredDataInputs: inputs,
    integrationsUsed: integrations,
    guardrails,
    auditEventsToLog: [`${id.toUpperCase().replace(/-/g, "_")}_STARTED`, `${id.toUpperCase().replace(/-/g, "_")}_COMPLETED`],
    recommendedActions: actions,
    policySnippets: snippets,
    kpiProjections: kpi,
  };
}

/* ═══════════════════════════════════════════════════════
   USE CASES BY PRODUCT LINE
   Each key maps to an array of UseCaseProfile objects.
   ═══════════════════════════════════════════════════════ */

const STANDARD_INTEGRATIONS = ["Five9 Voice", "Azure Data Lake", "CRM Sync"];
const ID_GUARD: GuardrailRule = { label: "Confirm identity before disclosing PHI", type: "must_confirm_identity" };
const LOG_GUARD: GuardrailRule = { label: "Log all actions for audit trail", type: "must_log" };
const ESC_GUARD: GuardrailRule = { label: "Escalate complex cases to specialist", type: "must_escalate" };
const PHI_GUARD: GuardrailRule = { label: "PHI data — handle per HIPAA requirements", type: "phi_warning" };

// ── COMMERCIAL ──
const commercialUseCases: UseCaseProfile[] = [
  uc("com-eligibility", "Eligibility & Benefits", "Eligibility", "Medical, pharmacy, vision, and dental rider verification", "Reduce AHT with instant eligibility lookup",
    ["intake", "classification", "policy-match", "audit"],
    { opening: "Thank you for calling. I can help verify eligibility and benefits. May I have the member ID?", questions: ["Can you confirm the member's date of birth?", "Which service do you need coverage details for?", "Is this for in-network or out-of-network?", "Are you checking pharmacy or medical benefits?"], compliance: [{ compliant: "Based on plan details, this service is covered under your current plan.", avoid: "You're definitely covered." }] },
    ["Member ID", "DOB", "Group Number"], [...STANDARD_INTEGRATIONS, "Provider Directory"], [ID_GUARD, LOG_GUARD],
    [{ title: "Verify Member Identity", why: "HIPAA requires identity confirmation", requiredFields: ["Member ID", "DOB"] }, { title: "Pull Plan Benefits", why: "Accurate copay and deductible data", requiredFields: ["Member ID"] }, { title: "Check Network Status", why: "In vs out-of-network cost impact", requiredFields: ["Provider NPI"] }],
    [{ title: "Eligibility Verification Protocol", content: "All eligibility inquiries require 2-factor verification (Member ID + DOB). Coverage status must reflect real-time plan data.", source: "KB-COM-ELG-001", confidence: 97 }],
    { ahtReductionPct: 42, fcrImprovementPct: 35, complianceCoveragePct: 98, costPerCallReduction: 3.85 }),
  uc("com-claims", "Claims Status", "Claims", "Pending/denied/paid/recoupment claim status lookup", "Improve FCR with instant claim status",
    ["intake", "classification", "policy-match", "draft", "audit"],
    { opening: "I can help check on a claim. Do you have the claim number?", questions: ["What is the date of service?", "Was this submitted by provider or member?", "Are you asking about a denial or payment?"], compliance: [{ compliant: "The claim is in [status] as of today.", avoid: "It should be paid soon." }] },
    ["Member ID", "Claim ID", "DOS"], [...STANDARD_INTEGRATIONS, "Core Claims"], [ID_GUARD, PHI_GUARD, LOG_GUARD],
    [{ title: "Look Up Claim", why: "Real-time adjudication status", requiredFields: ["Claim ID"] }, { title: "Explain Denial", why: "Reduce repeat calls", requiredFields: ["Claim ID"] }, { title: "Initiate Resubmission", why: "Correctable denials can be resubmitted", requiredFields: ["Claim ID", "Provider NPI"] }],
    [{ title: "Claim Status Disclosure", content: "Agents may disclose claim status and denial codes to verified callers. Do not speculate on future outcomes.", source: "KB-COM-CLM-003", confidence: 96 }],
    { ahtReductionPct: 38, fcrImprovementPct: 41, complianceCoveragePct: 96, costPerCallReduction: 4.10 }),
  uc("com-prior-auth", "Medical Prior Authorization", "Prior Auth", "Inpatient/outpatient/procedure/imaging PA requests", "Reduce PA cycle time with intelligent routing",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can assist with prior authorization. Do you have a PA reference number?", questions: ["What procedure requires authorization?", "Has clinical documentation been submitted?", "What is the requested date of service?"], compliance: [{ compliant: "The PA is under clinical review with all documentation received.", avoid: "It'll probably get approved." }] },
    ["Member ID", "Provider NPI", "PA Ref", "CPT Code", "ICD-10"], [...STANDARD_INTEGRATIONS, "Prior Auth System", "Clinical Review Queue"], [ID_GUARD, ESC_GUARD, LOG_GUARD],
    [{ title: "Check PA Status", why: "Real-time authorization status", requiredFields: ["PA Ref"] }, { title: "Verify Documentation", why: "Ensures clinical docs on file", requiredFields: ["PA Ref"] }, { title: "Escalate to Clinical", why: "Complex cases need clinical reviewer", requiredFields: ["PA Ref"] }],
    [{ title: "PA Turnaround Requirements", content: "Standard: 14 calendar days. Urgent: 72 hours. Concurrent: 24 hours.", source: "KB-COM-PA-002", confidence: 98 }],
    { ahtReductionPct: 30, fcrImprovementPct: 28, complianceCoveragePct: 99, costPerCallReduction: 5.20 }),
  uc("com-ur", "Utilization Review / Medical Necessity", "UR", "Clinical criteria discussion and medical necessity review", "Ensure appropriate care authorization",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with utilization review inquiries. May I have the case number?", questions: ["What procedure is being reviewed?", "What clinical criteria are being applied?", "Is this a concurrent or retrospective review?"], compliance: [{ compliant: "The review is based on established clinical criteria.", avoid: "We just want to deny things." }] },
    ["Member ID", "Case Number", "CPT Code", "Clinical Notes"], [...STANDARD_INTEGRATIONS, "UR System"], [ID_GUARD, ESC_GUARD, LOG_GUARD],
    [{ title: "Review Clinical Criteria", why: "Match procedure to guidelines", requiredFields: ["Case Number"] }, { title: "Request Peer-to-Peer", why: "Provider can discuss with medical director", requiredFields: ["Case Number"] }],
    [{ title: "UR Clinical Criteria", content: "All UR decisions must reference evidence-based clinical criteria (InterQual/MCG).", source: "KB-COM-UR-001", confidence: 97 }],
    { ahtReductionPct: 25, fcrImprovementPct: 20, complianceCoveragePct: 100, costPerCallReduction: 6.00 }),
  uc("com-denial", "Denial Explanation + Next Steps", "Denials", "Clear explanation of denial reasons with actionable next steps", "Reduce member confusion and repeat calls",
    ["intake", "classification", "policy-match", "draft", "audit"],
    { opening: "I can help explain a denial. Do you have the claim or denial reference number?", questions: ["Do you have the denial letter?", "Would you like to know your appeal options?", "Is this related to a specific service?"], compliance: [{ compliant: "The denial was based on [specific reason]. Here are your options.", avoid: "They just denied it." }] },
    ["Member ID", "Claim ID", "Denial Code"], STANDARD_INTEGRATIONS, [ID_GUARD, LOG_GUARD],
    [{ title: "Explain Denial Code", why: "Plain-language denial explanation", requiredFields: ["Denial Code"] }, { title: "Outline Appeal Rights", why: "Members have right to appeal", requiredFields: ["Claim ID"] }],
    [{ title: "Denial Communication", content: "Always explain denial reason, appeal rights, and deadlines in plain language.", source: "KB-COM-DEN-001", confidence: 96 }],
    { ahtReductionPct: 35, fcrImprovementPct: 38, complianceCoveragePct: 97, costPerCallReduction: 3.50 }),
  uc("com-appeals", "Appeals & Grievances Intake", "Appeals", "Standard and expedited appeal filing with documentation tracking", "Streamline appeal intake and routing",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with filing an appeal. Do you have the denial reference?", questions: ["What is the reason for the appeal?", "Do you have additional documentation?", "Is this standard or expedited?"], compliance: [{ compliant: "You have the right to appeal. The deadline is [X days].", avoid: "Appeals rarely succeed." }] },
    ["Member ID", "Claim ID", "Denial Ref", "Appeal Reason"], [...STANDARD_INTEGRATIONS, "Appeals System"], [ID_GUARD, ESC_GUARD, LOG_GUARD],
    [{ title: "Check Filing Deadline", why: "Ensure within regulatory timeframe", requiredFields: ["Denial Ref"] }, { title: "Draft Appeal", why: "AI-assisted appeal rationale", requiredFields: ["Claim ID", "Appeal Reason"] }],
    [{ title: "Appeal Filing Requirements", content: "Appeals must include original claim, denial notice, clinical rationale, and supporting records.", source: "KB-COM-APL-001", confidence: 98 }],
    { ahtReductionPct: 35, fcrImprovementPct: 18, complianceCoveragePct: 100, costPerCallReduction: 7.50 }),
  uc("com-medical-records", "Medical Records Request + Submission", "Records", "Fax/portal/API document submission with OCR processing", "Automate document classification and routing",
    ["intake", "classification", "draft", "hitl", "audit"],
    { opening: "I can help with medical records. Are you submitting or requesting records?", questions: ["What type of document?", "Related to a specific claim or PA?", "Which submission channel are you using?"], compliance: [{ compliant: "Your document has been received and is being processed.", avoid: "We got your fax, should be fine." }] },
    ["Member ID", "Document Type", "Reference Number"], [...STANDARD_INTEGRATIONS, "OCR Engine", "DMS"], [PHI_GUARD, LOG_GUARD],
    [{ title: "Confirm Receipt", why: "Provide confirmation number", requiredFields: ["Reference Number"] }, { title: "Check OCR Status", why: "Processing progress", requiredFields: ["Reference Number"] }],
    [{ title: "Document Retention", content: "All submitted documents retained for 7 years per CMS requirements.", source: "KB-COM-DOC-001", confidence: 96 }],
    { ahtReductionPct: 55, fcrImprovementPct: 22, complianceCoveragePct: 94, costPerCallReduction: 6.50 }),
  uc("com-eob", "EOB / Patient Responsibility", "EOB", "Deductible, coinsurance, and OON cost explanation", "Improve member comprehension of financial responsibility",
    ["intake", "classification", "draft", "audit"],
    { opening: "I can help explain your EOB or patient responsibility. Which statement are you calling about?", questions: ["Do you have the claim or EOB number?", "Is there a specific charge you'd like clarified?", "Would you like a written summary?"], compliance: [{ compliant: "Your deductible is the amount you pay before insurance covers costs.", avoid: "Don't worry about the deductible." }] },
    ["Member ID", "Claim ID", "EOB Number"], STANDARD_INTEGRATIONS, [ID_GUARD, LOG_GUARD],
    [{ title: "Generate Plain-Language EOB", why: "Translate complex EOB into simple terms", requiredFields: ["Claim ID"] }, { title: "Calculate Member Responsibility", why: "Show deductible/coinsurance/copay breakdown", requiredFields: ["Claim ID"] }],
    [{ title: "EOB Explanation", content: "Always explain: what was billed, what plan paid, what member owes, and why.", source: "KB-COM-EOB-001", confidence: 95 }],
    { ahtReductionPct: 20, fcrImprovementPct: 45, complianceCoveragePct: 100, costPerCallReduction: 2.80 }),
  uc("com-cob", "Coordination of Benefits / Subrogation", "COB", "Primary/secondary insurance coordination and subrogation", "Resolve COB issues to prevent claim delays",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with coordination of benefits. Is this about primary or secondary coverage?", questions: ["Do you have coverage under another plan?", "Which plan is primary?", "Is this related to a specific claim?"], compliance: [{ compliant: "We need to determine which plan is primary per COB rules.", avoid: "Just submit to both and see what happens." }] },
    ["Member ID", "Primary Plan Info", "Secondary Plan Info", "Claim ID"], [...STANDARD_INTEGRATIONS, "COB System"], [ID_GUARD, LOG_GUARD],
    [{ title: "Determine Primary Plan", why: "Apply COB rules correctly", requiredFields: ["Member ID"] }, { title: "Reprocess Claim", why: "Update COB and reprocess", requiredFields: ["Claim ID"] }],
    [{ title: "COB Rules", content: "Birthday rule applies for dependent children. Employment status determines primary for adults.", source: "KB-COM-COB-001", confidence: 94 }],
    { ahtReductionPct: 30, fcrImprovementPct: 25, complianceCoveragePct: 96, costPerCallReduction: 4.00 }),
  uc("com-case-mgmt", "Case Management Referral", "Case Mgmt", "Complex care and post-acute case management referral", "Improve outcomes for high-acuity members",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help coordinate a case management referral. Can you tell me about the member's situation?", questions: ["What is the primary diagnosis?", "Is the member currently hospitalized?", "Are there post-acute care needs?"], compliance: [{ compliant: "I'll connect you with our care management team for ongoing support.", avoid: "You're on your own after discharge." }] },
    ["Member ID", "Diagnosis", "Current Setting"], [...STANDARD_INTEGRATIONS, "Care Management System"], [ID_GUARD, ESC_GUARD, LOG_GUARD],
    [{ title: "Initiate CM Referral", why: "Connect member with care coordinator", requiredFields: ["Member ID"] }, { title: "Review Care Plan", why: "Assess current and needed services", requiredFields: ["Member ID"] }],
    [{ title: "CM Referral Criteria", content: "Refer when: multiple comorbidities, repeated ER visits, complex medication regimen, or post-acute transition.", source: "KB-COM-CM-001", confidence: 95 }],
    { ahtReductionPct: 20, fcrImprovementPct: 30, complianceCoveragePct: 98, costPerCallReduction: 5.00 }),
  uc("com-pharmacy-um", "Pharmacy UM (Step Therapy / PA / Formulary)", "Pharmacy UM", "Step therapy, pharmacy PA, and formulary exception requests", "Reduce pharmacy PA turnaround time",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with pharmacy authorization. What medication are you calling about?", questions: ["Has the prescriber tried step-therapy alternatives?", "Is this a formulary exception request?", "What is the diagnosis?"], compliance: [{ compliant: "This medication requires prior authorization per formulary guidelines.", avoid: "Just have the doctor prescribe something else." }] },
    ["Member ID", "NDC/Drug Name", "Prescriber NPI", "Diagnosis"], [...STANDARD_INTEGRATIONS, "PBM System"], [ID_GUARD, ESC_GUARD, LOG_GUARD],
    [{ title: "Check Formulary Status", why: "Determine coverage tier and requirements", requiredFields: ["Drug Name"] }, { title: "Submit PA Request", why: "Initiate pharmacy prior auth", requiredFields: ["Member ID", "Drug Name", "Prescriber NPI"] }],
    [{ title: "Pharmacy UM", content: "Step therapy protocols must be exhausted before exceptions. Document clinical rationale for all overrides.", source: "KB-COM-RX-001", confidence: 97 }],
    { ahtReductionPct: 28, fcrImprovementPct: 32, complianceCoveragePct: 99, costPerCallReduction: 4.50 }),
];

// ── WORKERS' COMP ──
const workersCompUseCases: UseCaseProfile[] = [
  uc("wc-injury-intake", "Injury Claim Intake + Coverage", "Injury Intake", "New workplace injury claim intake and coverage confirmation", "Streamline FNOL for workplace injuries",
    ["intake", "classification", "policy-match", "audit"],
    { opening: "I can help with a workplace injury claim. When did the injury occur?", questions: ["What is the nature of the injury?", "Where did the injury happen?", "Has the employee seen a doctor?", "What is the employer's policy number?"], compliance: [{ compliant: "I'll document the injury details and confirm coverage under your employer's policy.", avoid: "That doesn't sound like a real injury." }] },
    ["Employee Name", "DOI", "Employer ID", "Policy Number", "Injury Description"], [...STANDARD_INTEGRATIONS, "WC Claims System"], [LOG_GUARD],
    [{ title: "Create FNOL", why: "Document injury for claim initiation", requiredFields: ["Employee Name", "DOI"] }, { title: "Verify Coverage", why: "Confirm employer policy is active", requiredFields: ["Policy Number"] }],
    [{ title: "WC FNOL Requirements", content: "First Notice of Loss must include: date, time, location of injury, nature of injury, witnesses, and initial treatment.", source: "KB-WC-FNOL-001", confidence: 96 }],
    { ahtReductionPct: 40, fcrImprovementPct: 35, complianceCoveragePct: 97, costPerCallReduction: 4.00 }),
  uc("wc-provider-auth", "Treating Provider Auth + UR Status", "Provider Auth", "Authorization for treating providers and UR status updates", "Reduce authorization delays for treatment",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with treatment authorization. What is the claim number?", questions: ["What treatment is being requested?", "Has the provider submitted clinical documentation?", "Is this initial or continued treatment?"], compliance: [{ compliant: "The authorization request is under review per the applicable fee schedule.", avoid: "Just go ahead with the treatment." }] },
    ["Claim Number", "Provider NPI", "Treatment Type", "Clinical Notes"], [...STANDARD_INTEGRATIONS, "UR System", "Fee Schedule"], [ESC_GUARD, LOG_GUARD],
    [{ title: "Check UR Status", why: "Current authorization status", requiredFields: ["Claim Number"] }, { title: "Request Peer-to-Peer", why: "Provider discussion with medical director", requiredFields: ["Claim Number"] }],
    [{ title: "WC UR Timelines", content: "Initial auth: 5 business days. Concurrent review: 1 business day. Retrospective: 30 days. State-specific variations apply.", source: "KB-WC-UR-001", confidence: 95 }],
    { ahtReductionPct: 30, fcrImprovementPct: 28, complianceCoveragePct: 99, costPerCallReduction: 5.50 }),
  uc("wc-med-necessity", "Medical Necessity Review", "Med Necessity", "PT/OT, imaging, surgery medical necessity evaluation", "Ensure appropriate care authorization",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with a medical necessity review. What procedure is being evaluated?", questions: ["What is the diagnosis?", "What alternative treatments have been tried?", "Is this for PT/OT, imaging, or surgery?"], compliance: [{ compliant: "The review follows established medical guidelines for workplace injuries.", avoid: "We're trying to deny your treatment." }] },
    ["Claim Number", "CPT Code", "ICD-10", "Clinical Documentation"], [...STANDARD_INTEGRATIONS, "Clinical Review"], [ESC_GUARD, LOG_GUARD],
    [{ title: "Apply Clinical Criteria", why: "Match request to WC guidelines", requiredFields: ["CPT Code", "ICD-10"] }, { title: "Schedule IME", why: "Independent medical exam if needed", requiredFields: ["Claim Number"] }],
    [{ title: "WC Med Necessity", content: "All treatment must be causally related to the workplace injury. Apply ODG/ACOEM guidelines.", source: "KB-WC-MN-001", confidence: 97 }],
    { ahtReductionPct: 25, fcrImprovementPct: 22, complianceCoveragePct: 100, costPerCallReduction: 6.00 }),
  uc("wc-billing", "Billing Disputes (Fee Schedule)", "Billing", "Fee schedule re-pricing and DRG billing disputes", "Resolve provider billing disputes efficiently",
    ["intake", "classification", "policy-match", "draft", "audit"],
    { opening: "I can help with a billing dispute. What is the claim number?", questions: ["What specific charge is in dispute?", "Is this a fee schedule or DRG issue?", "Has an EOB been issued?"], compliance: [{ compliant: "Payment was calculated per the applicable state fee schedule.", avoid: "We pay what we want." }] },
    ["Claim Number", "Provider NPI", "Billing Code", "Billed Amount"], [...STANDARD_INTEGRATIONS, "Fee Schedule Engine"], [LOG_GUARD],
    [{ title: "Review Fee Schedule", why: "Compare billed vs allowed amounts", requiredFields: ["Billing Code"] }, { title: "Generate EOB Detail", why: "Line-item payment explanation", requiredFields: ["Claim Number"] }],
    [{ title: "WC Fee Schedules", content: "Each state has unique fee schedules. Payments must follow state-mandated maximum allowable amounts.", source: "KB-WC-FS-001", confidence: 94 }],
    { ahtReductionPct: 32, fcrImprovementPct: 30, complianceCoveragePct: 95, costPerCallReduction: 3.80 }),
  uc("wc-denials", "Denials & Appeals (State-Specific)", "WC Appeals", "State-specific denial explanations and appeal timelines", "Navigate complex state-by-state appeal requirements",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with a workers' comp denial or appeal. What state was the claim filed in?", questions: ["What is the denial reason?", "Are you within the state filing deadline?", "Do you have additional medical evidence?"], compliance: [{ compliant: "The appeal deadline in [state] is [X] days from the denial date.", avoid: "You missed the deadline, too bad." }] },
    ["Claim Number", "State", "Denial Code", "Appeal Reason"], [...STANDARD_INTEGRATIONS, "State Compliance DB"], [ESC_GUARD, LOG_GUARD],
    [{ title: "Check State Deadline", why: "State-specific filing requirements", requiredFields: ["State", "Denial Date"] }, { title: "Draft Appeal", why: "Generate compliant appeal document", requiredFields: ["Claim Number", "Appeal Reason"] }],
    [{ title: "WC Appeal Timelines", content: "Appeal deadlines vary by state (15-90 days). Always verify state-specific requirements before filing.", source: "KB-WC-APL-001", confidence: 96 }],
    { ahtReductionPct: 30, fcrImprovementPct: 20, complianceCoveragePct: 100, costPerCallReduction: 6.50 }),
  uc("wc-pharmacy", "Pharmacy Controls (Opioid/PA)", "WC Pharmacy", "Opioid guidelines, PA, and pharmacy controls for WC claims", "Ensure safe prescribing for workplace injuries",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with workers' comp pharmacy authorization. What medication is being prescribed?", questions: ["Is this an opioid or controlled substance?", "How long has the injured worker been on this medication?", "Has a tapering plan been discussed?"], compliance: [{ compliant: "This medication requires authorization per state opioid prescribing guidelines.", avoid: "Just take whatever the doctor says." }] },
    ["Claim Number", "Drug Name", "Prescriber NPI", "Duration"], [...STANDARD_INTEGRATIONS, "WC PBM"], [ESC_GUARD, LOG_GUARD],
    [{ title: "Apply Opioid Guidelines", why: "Check against state prescribing limits", requiredFields: ["Drug Name", "Duration"] }, { title: "Review Formulary", why: "WC-specific formulary check", requiredFields: ["Drug Name"] }],
    [{ title: "WC Opioid Guidelines", content: "Most states limit initial opioid supply to 3-7 days. Ongoing prescriptions require UR approval and tapering plan.", source: "KB-WC-RX-001", confidence: 98 }],
    { ahtReductionPct: 25, fcrImprovementPct: 30, complianceCoveragePct: 100, costPerCallReduction: 5.00 }),
];

// ── P&C BODILY INJURY ──
const pncUseCases: UseCaseProfile[] = [
  uc("pnc-bill-intake", "Medical Bill Intake (UB-04/CMS-1500)", "Bill Intake", "Medical bill receipt and validation for BI claims", "Streamline medical bill processing",
    ["intake", "classification", "draft", "audit"],
    { opening: "I can help with medical bill submission. Do you have the claim number?", questions: ["Is this a UB-04 or CMS-1500 form?", "What is the date of service?", "What is the total billed amount?"], compliance: [{ compliant: "The bill has been received and will be reviewed against the claim file.", avoid: "We'll just pay whatever." }] },
    ["Claim Number", "Bill Type", "Provider NPI", "Billed Amount", "DOS"], [...STANDARD_INTEGRATIONS, "Bill Review System"], [LOG_GUARD],
    [{ title: "Validate Bill", why: "Check for completeness and accuracy", requiredFields: ["Bill Type"] }, { title: "Apply Re-pricing", why: "Apply negotiated or UCR rates", requiredFields: ["Billed Amount"] }],
    [{ title: "BI Bill Review", content: "All medical bills must be validated against the claim file. Apply PPO re-pricing or UCR where applicable.", source: "KB-PNC-BR-001", confidence: 95 }],
    { ahtReductionPct: 45, fcrImprovementPct: 30, complianceCoveragePct: 94, costPerCallReduction: 5.00 }),
  uc("pnc-records", "Record Retrieval (ER/Imaging/Labs)", "Records", "Medical record retrieval for bodily injury claims", "Accelerate claim investigation",
    ["intake", "classification", "draft", "hitl", "audit"],
    { opening: "I can help with medical record requests. What records are you looking for?", questions: ["What is the claim number?", "Which provider treated the claimant?", "What date range do you need?"], compliance: [{ compliant: "We'll submit a records request with proper authorization.", avoid: "Just send us everything." }] },
    ["Claim Number", "Provider Name", "Date Range", "Authorization"], [...STANDARD_INTEGRATIONS, "Records System"], [PHI_GUARD, LOG_GUARD],
    [{ title: "Submit Records Request", why: "Formal request with authorization", requiredFields: ["Claim Number", "Provider Name"] }],
    [{ title: "Record Retrieval", content: "All records requests must include signed authorization. HIPAA-compliant retrieval required.", source: "KB-PNC-RR-001", confidence: 96 }],
    { ahtReductionPct: 40, fcrImprovementPct: 25, complianceCoveragePct: 97, costPerCallReduction: 4.50 }),
  uc("pnc-lien", "Lien & Subrogation Coordination", "Liens/Subro", "Medicare/Medicaid lien and subrogation coordination", "Ensure proper lien resolution before settlement",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with lien or subrogation matters. Is this related to a Medicare lien?", questions: ["Has a conditional payment letter been received?", "What is the settlement status?", "Are there other lienholders?"], compliance: [{ compliant: "We must resolve all liens before finalizing the settlement.", avoid: "Just ignore the liens." }] },
    ["Claim Number", "Lienholder Info", "Settlement Amount"], [...STANDARD_INTEGRATIONS, "MSPRC", "Lien System"], [ESC_GUARD, LOG_GUARD],
    [{ title: "Query MSPRC", why: "Check Medicare conditional payment amount", requiredFields: ["Claim Number"] }, { title: "Calculate Net Settlement", why: "Determine payout after lien resolution", requiredFields: ["Settlement Amount"] }],
    [{ title: "MSP Compliance", content: "Medicare Secondary Payer Act requires resolution of all Medicare liens before settlement disbursement.", source: "KB-PNC-LIEN-001", confidence: 98 }],
    { ahtReductionPct: 20, fcrImprovementPct: 18, complianceCoveragePct: 100, costPerCallReduction: 8.00 }),
  uc("pnc-pip", "PIP / MedPay Coverage Checks", "PIP/MedPay", "Personal injury protection and medical payments coverage verification", "Rapid coverage confirmation for accident claims",
    ["intake", "classification", "policy-match", "audit"],
    { opening: "I can help check PIP or MedPay coverage. What is the policy number?", questions: ["What state is the policy in?", "What is the date of the accident?", "What are the current medical expenses?"], compliance: [{ compliant: "PIP coverage of $[amount] is available per your state's requirements.", avoid: "You have unlimited coverage." }] },
    ["Policy Number", "State", "DOL", "Medical Expenses"], [...STANDARD_INTEGRATIONS, "Policy System"], [ID_GUARD, LOG_GUARD],
    [{ title: "Verify PIP Limits", why: "Check state-specific PIP/MedPay limits", requiredFields: ["Policy Number", "State"] }],
    [{ title: "PIP Requirements", content: "PIP limits and thresholds vary by state. No-fault states have mandatory PIP minimums.", source: "KB-PNC-PIP-001", confidence: 94 }],
    { ahtReductionPct: 35, fcrImprovementPct: 40, complianceCoveragePct: 96, costPerCallReduction: 3.00 }),
];

// ── DISABILITY ──
const disabilityUseCases: UseCaseProfile[] = [
  uc("dis-claim-status", "Claim Status + Missing Docs", "Claim Status", "STD/LTD claim status and documentation tracking", "Reduce status inquiry call volume",
    ["intake", "classification", "policy-match", "audit"],
    { opening: "I can help with your disability claim status. What is your claim number?", questions: ["Is this a short-term or long-term disability claim?", "When was the claim filed?", "Have all medical records been submitted?"], compliance: [{ compliant: "Your claim is in [status]. The following documents are still needed.", avoid: "It's taking forever because of you." }] },
    ["Claim Number", "Member ID", "Employer"], STANDARD_INTEGRATIONS, [ID_GUARD, LOG_GUARD],
    [{ title: "Check Claim Status", why: "Real-time status update", requiredFields: ["Claim Number"] }, { title: "List Missing Docs", why: "Show what's still needed", requiredFields: ["Claim Number"] }],
    [{ title: "Disability Claim Process", content: "STD claims typically have 7-14 day elimination period. LTD has 90-180 day waiting period. All require attending physician statement.", source: "KB-DIS-001", confidence: 95 }],
    { ahtReductionPct: 42, fcrImprovementPct: 38, complianceCoveragePct: 96, costPerCallReduction: 3.80 }),
  uc("dis-aps", "APS / Medical Records Request", "APS Request", "Attending Physician Statement and medical records follow-up", "Accelerate clinical documentation gathering",
    ["intake", "classification", "draft", "hitl", "audit"],
    { opening: "I can help with medical records for your disability claim. What type of records are needed?", questions: ["Has the APS been requested from the treating physician?", "What is the follow-up date?", "Are there any specialty records needed?"], compliance: [{ compliant: "We've requested the APS from your physician. Expected turnaround is 10-14 business days.", avoid: "Your doctor is slow." }] },
    ["Claim Number", "Provider Name", "APS Type"], [...STANDARD_INTEGRATIONS, "APS System"], [PHI_GUARD, LOG_GUARD],
    [{ title: "Track APS Status", why: "Monitor physician response", requiredFields: ["Claim Number"] }, { title: "Send Reminder", why: "Follow up with provider", requiredFields: ["Provider Name"] }],
    [{ title: "APS Requirements", content: "APS must include: diagnosis, treatment plan, functional capacity, restrictions/limitations, and expected recovery timeline.", source: "KB-DIS-APS-001", confidence: 96 }],
    { ahtReductionPct: 35, fcrImprovementPct: 25, complianceCoveragePct: 95, costPerCallReduction: 4.50 }),
  uc("dis-fce", "Functional Capacity / Restrictions", "FCE", "Capture restrictions, limitations, and functional capacity data", "Standardize functional capacity documentation",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help document functional capacity. What are the claimant's current restrictions?", questions: ["Can the claimant perform sedentary work?", "Are there lifting restrictions?", "What is the duration of restrictions?"], compliance: [{ compliant: "I'll document the restrictions as provided by the treating physician.", avoid: "You look fine to me." }] },
    ["Claim Number", "Physician Restrictions", "Job Demands"], [...STANDARD_INTEGRATIONS, "Vocational System"], [ESC_GUARD, LOG_GUARD],
    [{ title: "Document Restrictions", why: "Capture R&L for file", requiredFields: ["Claim Number"] }, { title: "Compare to Job Demands", why: "Match restrictions to occupation", requiredFields: ["Job Demands"] }],
    [{ title: "FCE Standards", content: "Functional capacity must be documented by treating physician. IME may be ordered if discrepancies exist.", source: "KB-DIS-FCE-001", confidence: 94 }],
    { ahtReductionPct: 25, fcrImprovementPct: 20, complianceCoveragePct: 98, costPerCallReduction: 5.00 }),
  uc("dis-rtw", "Return-to-Work Planning", "RTW", "RTW coordination between employer, provider, and claimant", "Facilitate safe, timely return to work",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help coordinate return-to-work planning. What is the current work status?", questions: ["Has the physician cleared the claimant for any work?", "Is modified duty available?", "What are the employer's accommodation options?"], compliance: [{ compliant: "We'll coordinate a transitional work plan with your employer and physician.", avoid: "You need to get back to work immediately." }] },
    ["Claim Number", "Work Status", "Employer Contact", "Physician Clearance"], [...STANDARD_INTEGRATIONS, "RTW System"], [ESC_GUARD, LOG_GUARD],
    [{ title: "Create RTW Plan", why: "Develop transitional work plan", requiredFields: ["Claim Number"] }, { title: "Coordinate with Employer", why: "Arrange accommodations", requiredFields: ["Employer Contact"] }],
    [{ title: "RTW Best Practices", content: "Early RTW intervention reduces claim duration by 30-50%. Modified duty should be offered when medically appropriate.", source: "KB-DIS-RTW-001", confidence: 95 }],
    { ahtReductionPct: 20, fcrImprovementPct: 30, complianceCoveragePct: 96, costPerCallReduction: 4.00 }),
];

// ── LIFE INSURANCE ──
const lifeUseCases: UseCaseProfile[] = [
  uc("life-aps", "APS Request to Providers", "APS Request", "Attending Physician Statement requests for underwriting", "Accelerate underwriting medical evidence gathering",
    ["intake", "classification", "draft", "audit"],
    { opening: "I can help with an APS request. Which provider needs to be contacted?", questions: ["What is the applicant's name?", "What is the provider's fax number?", "Are there specific conditions to document?"], compliance: [{ compliant: "We've sent the APS request with proper authorization.", avoid: "Just send us everything about the patient." }] },
    ["Application Number", "Provider Name", "Provider Fax", "Authorization"], [...STANDARD_INTEGRATIONS, "Underwriting System"], [PHI_GUARD, LOG_GUARD],
    [{ title: "Send APS Request", why: "Formal request with authorization", requiredFields: ["Provider Name"] }, { title: "Track Response", why: "Monitor provider turnaround", requiredFields: ["Application Number"] }],
    [{ title: "Life APS", content: "APS requests must include signed HIPAA authorization. Standard turnaround is 14-21 business days.", source: "KB-LIFE-APS-001", confidence: 96 }],
    { ahtReductionPct: 40, fcrImprovementPct: 30, complianceCoveragePct: 95, costPerCallReduction: 4.00 }),
  uc("life-labs", "Lab Ordering & Results Follow-up", "Labs", "Lab test ordering, scheduling, and results tracking", "Streamline paramedical exam coordination",
    ["intake", "classification", "draft", "audit"],
    { opening: "I can help with lab ordering or results. What is the application number?", questions: ["Has the exam been scheduled?", "Which lab provider is being used?", "Are results available?"], compliance: [{ compliant: "Lab results will be reviewed by our underwriting team.", avoid: "Your labs look bad." }] },
    ["Application Number", "Lab Provider", "Exam Type"], [...STANDARD_INTEGRATIONS, "Lab System"], [PHI_GUARD, LOG_GUARD],
    [{ title: "Schedule Lab", why: "Coordinate paramedical exam", requiredFields: ["Application Number"] }, { title: "Check Results", why: "Monitor lab completion", requiredFields: ["Application Number"] }],
    [{ title: "Lab Requirements", content: "Standard labs include: blood profile, urinalysis. Additional tests based on face amount and age.", source: "KB-LIFE-LAB-001", confidence: 95 }],
    { ahtReductionPct: 35, fcrImprovementPct: 28, complianceCoveragePct: 94, costPerCallReduction: 3.50 }),
  uc("life-case-status", "Case Status (Broker/Employer)", "Case Status", "Application status updates for brokers and employers", "Reduce broker/employer inquiry volume",
    ["intake", "classification", "audit"],
    { opening: "I can provide a case status update. What is the application or case number?", questions: ["Are you the broker or employer?", "What specific information do you need?", "Is there a pending requirement?"], compliance: [{ compliant: "The application is in [stage] of the underwriting process.", avoid: "It's probably going to be declined." }] },
    ["Case Number", "Broker ID"], [...STANDARD_INTEGRATIONS, "Underwriting System"], [LOG_GUARD],
    [{ title: "Check Case Status", why: "Current underwriting stage", requiredFields: ["Case Number"] }, { title: "List Requirements", why: "Outstanding items needed", requiredFields: ["Case Number"] }],
    [{ title: "Case Status", content: "Provide stage updates only. Do not disclose medical details to brokers without proper authorization.", source: "KB-LIFE-CS-001", confidence: 97 }],
    { ahtReductionPct: 45, fcrImprovementPct: 40, complianceCoveragePct: 96, costPerCallReduction: 3.00 }),
];

// ── DENTAL ──
const dentalUseCases: UseCaseProfile[] = [
  uc("den-eligibility", "Eligibility & Benefits", "Eligibility", "Preventive/basic/major/ortho benefit verification", "Instant benefit lookup for dental offices",
    ["intake", "classification", "policy-match", "audit"],
    { opening: "I can help verify dental benefits. What is the member ID or SSN?", questions: ["What type of service is planned?", "Is this preventive, basic, or major?", "Is orthodontic coverage needed?"], compliance: [{ compliant: "The member has [coverage details] for the requested service category.", avoid: "Everything is covered." }] },
    ["Member ID", "DOB", "Service Category"], [...STANDARD_INTEGRATIONS, "Dental System"], [ID_GUARD, LOG_GUARD],
    [{ title: "Verify Benefits", why: "Coverage details by category", requiredFields: ["Member ID"] }, { title: "Check Maximums", why: "Annual max and remaining balance", requiredFields: ["Member ID"] }],
    [{ title: "Dental Benefits", content: "Typical structure: 100% preventive, 80% basic, 50% major, with annual maximum. Ortho may have separate lifetime max.", source: "KB-DEN-ELG-001", confidence: 96 }],
    { ahtReductionPct: 45, fcrImprovementPct: 40, complianceCoveragePct: 97, costPerCallReduction: 3.50 }),
  uc("den-predet", "Predetermination / Prior Auth", "Predet/PA", "Predetermination for crowns, implants, and ortho", "Clarify coverage before treatment begins",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with a dental predetermination. What procedure is planned?", questions: ["Is this for a crown, implant, or orthodontic treatment?", "Has an X-ray been submitted?", "What is the estimated cost?"], compliance: [{ compliant: "The predetermination is being reviewed. You'll receive a written estimate.", avoid: "It will definitely be approved." }] },
    ["Member ID", "Procedure Code", "X-ray", "Estimated Cost"], [...STANDARD_INTEGRATIONS, "Dental UM"], [LOG_GUARD],
    [{ title: "Submit Predet", why: "Request coverage determination before treatment", requiredFields: ["Procedure Code"] }, { title: "Check Predet Status", why: "Track review progress", requiredFields: ["Member ID"] }],
    [{ title: "Dental Predet", content: "Predetermination is recommended for services over $300. Required for implants and ortho in most plans.", source: "KB-DEN-PD-001", confidence: 95 }],
    { ahtReductionPct: 30, fcrImprovementPct: 25, complianceCoveragePct: 98, costPerCallReduction: 4.00 }),
  uc("den-claims", "Claim Status + Denials", "Claims", "Dental claim status and denial reason lookup", "Reduce dental office call volume",
    ["intake", "classification", "policy-match", "draft", "audit"],
    { opening: "I can check dental claim status. Do you have the claim number?", questions: ["Is this a provider or member inquiry?", "What is the date of service?", "Was the claim denied or is it pending?"], compliance: [{ compliant: "The claim was [denied/paid] for [reason]. Missing items include [X-rays/narratives].", avoid: "It was denied because your dentist messed up." }] },
    ["Claim Number", "Member ID", "DOS"], [...STANDARD_INTEGRATIONS, "Dental Claims"], [ID_GUARD, LOG_GUARD],
    [{ title: "Look Up Claim", why: "Real-time status", requiredFields: ["Claim Number"] }, { title: "Explain Denial", why: "Detail missing documentation", requiredFields: ["Claim Number"] }],
    [{ title: "Dental Claims", content: "Common denial reasons: missing X-rays, missing narratives, frequency limitations, waiting periods.", source: "KB-DEN-CLM-001", confidence: 94 }],
    { ahtReductionPct: 38, fcrImprovementPct: 35, complianceCoveragePct: 95, costPerCallReduction: 3.80 }),
  uc("den-appeals", "Appeals Intake", "Appeals", "Dental claim appeal filing and tracking", "Streamline dental appeal process",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with a dental appeal. What claim are you appealing?", questions: ["What is the denial reason?", "Do you have additional clinical evidence?", "Is this within the filing deadline?"], compliance: [{ compliant: "Your appeal has been filed and will be reviewed within [X] business days.", avoid: "Appeals never work for dental." }] },
    ["Claim Number", "Denial Reason", "Supporting Docs"], [...STANDARD_INTEGRATIONS, "Dental Appeals"], [LOG_GUARD],
    [{ title: "File Appeal", why: "Submit formal appeal", requiredFields: ["Claim Number"] }],
    [{ title: "Dental Appeals", content: "Include: clinical notes, X-rays, narratives, and peer-reviewed literature supporting medical necessity.", source: "KB-DEN-APL-001", confidence: 95 }],
    { ahtReductionPct: 30, fcrImprovementPct: 20, complianceCoveragePct: 98, costPerCallReduction: 5.00 }),
];

// ── VISION ──
const visionUseCases: UseCaseProfile[] = [
  uc("vis-eligibility", "Eligibility & Allowances", "Eligibility", "Frames/lenses/contacts allowance verification", "Instant vision benefit lookup",
    ["intake", "classification", "policy-match", "audit"],
    { opening: "I can help verify vision benefits. What is the member ID?", questions: ["Are you looking for frames, lenses, or contacts?", "When was the last exam?", "Is this for a child or adult?"], compliance: [{ compliant: "The member has [allowance] for [frames/lenses/contacts] this benefit year.", avoid: "You can get anything you want." }] },
    ["Member ID", "DOB", "Benefit Type"], [...STANDARD_INTEGRATIONS, "Vision System"], [ID_GUARD, LOG_GUARD],
    [{ title: "Check Allowances", why: "Remaining benefit amounts", requiredFields: ["Member ID"] }, { title: "Verify Exam History", why: "Frequency limitations", requiredFields: ["Member ID"] }],
    [{ title: "Vision Benefits", content: "Typical: exam every 12 months, lenses every 12 months, frames every 24 months. Contact lens allowance may substitute.", source: "KB-VIS-ELG-001", confidence: 96 }],
    { ahtReductionPct: 45, fcrImprovementPct: 42, complianceCoveragePct: 97, costPerCallReduction: 3.20 }),
  uc("vis-claims", "Claim Status + Denials", "Claims", "Vision claim status and denial lookup", "Reduce provider inquiry calls",
    ["intake", "classification", "policy-match", "audit"],
    { opening: "I can check vision claim status. What is the claim number?", questions: ["Is this a provider or member inquiry?", "What was the date of service?", "Was an authorization obtained?"], compliance: [{ compliant: "The claim is [status] for [reason].", avoid: "It was denied randomly." }] },
    ["Claim Number", "Member ID", "DOS"], [...STANDARD_INTEGRATIONS, "Vision Claims"], [ID_GUARD, LOG_GUARD],
    [{ title: "Look Up Claim", why: "Current status", requiredFields: ["Claim Number"] }],
    [{ title: "Vision Claims", content: "Common issues: out-of-network, frequency exceeded, authorization missing, duplicate claim.", source: "KB-VIS-CLM-001", confidence: 94 }],
    { ahtReductionPct: 40, fcrImprovementPct: 38, complianceCoveragePct: 95, costPerCallReduction: 3.00 }),
  uc("vis-med-necessity", "Medical Necessity Contacts", "Med Contacts", "Medically necessary contact lens authorization", "Expedite medical necessity determinations",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with a medically necessary contact lens request. What is the diagnosis?", questions: ["What is the keratometry reading?", "Is this for keratoconus, aphakia, or other condition?", "Has the ophthalmologist submitted clinical documentation?"], compliance: [{ compliant: "Medically necessary contacts require clinical documentation from the treating ophthalmologist.", avoid: "Contacts are just cosmetic." }] },
    ["Member ID", "Diagnosis", "Clinical Docs"], [...STANDARD_INTEGRATIONS, "Vision UM"], [ESC_GUARD, LOG_GUARD],
    [{ title: "Review Clinical Criteria", why: "Validate medical necessity", requiredFields: ["Diagnosis"] }],
    [{ title: "Med Necessary Contacts", content: "Qualifying conditions: keratoconus, aphakia, anisometropia >3D, corneal disorders. Must include K-readings.", source: "KB-VIS-MN-001", confidence: 97 }],
    { ahtReductionPct: 25, fcrImprovementPct: 22, complianceCoveragePct: 100, costPerCallReduction: 4.50 }),
];

// ── ACCIDENT & HEALTH ──
const accidentHealthUseCases: UseCaseProfile[] = [
  uc("ah-claim-intake", "Accident Claim Intake", "Claim Intake", "Accident claim filing with ER/imaging/lab documentation", "Streamline accident claim first notice",
    ["intake", "classification", "policy-match", "audit"],
    { opening: "I can help file an accident claim. When did the accident occur?", questions: ["What type of accident?", "Were you treated at an ER?", "Do you have receipts or bills?"], compliance: [{ compliant: "I'll document the accident details and initiate your claim.", avoid: "That doesn't qualify as an accident." }] },
    ["Policy Number", "Date of Accident", "Type of Accident", "Treatment Details"], STANDARD_INTEGRATIONS, [LOG_GUARD],
    [{ title: "Create Claim", why: "Initiate accident claim", requiredFields: ["Policy Number", "Date of Accident"] }],
    [{ title: "A&H Claims", content: "Accident claims require proof of accident date, treatment within specified timeframe, and itemized bills.", source: "KB-AH-CLM-001", confidence: 95 }],
    { ahtReductionPct: 40, fcrImprovementPct: 35, complianceCoveragePct: 96, costPerCallReduction: 3.80 }),
  uc("ah-benefit-determination", "Benefit Determination", "Benefits", "Benefit amount calculation and explanation", "Clarify benefit amounts quickly",
    ["intake", "classification", "policy-match", "draft", "audit"],
    { opening: "I can help explain your benefit determination. What is your claim number?", questions: ["Which benefit are you asking about?", "Do you have the benefit schedule?", "Was there a specific charge in question?"], compliance: [{ compliant: "Based on your policy schedule, the benefit for [event] is [amount].", avoid: "You should get more money." }] },
    ["Claim Number", "Policy Number", "Event Type"], STANDARD_INTEGRATIONS, [ID_GUARD, LOG_GUARD],
    [{ title: "Calculate Benefit", why: "Apply policy schedule to claim", requiredFields: ["Claim Number"] }],
    [{ title: "A&H Benefits", content: "Benefits are paid per schedule. Hospital confinement, ICU, surgery, and outpatient benefits have specific dollar amounts.", source: "KB-AH-BEN-001", confidence: 94 }],
    { ahtReductionPct: 35, fcrImprovementPct: 38, complianceCoveragePct: 95, costPerCallReduction: 3.50 }),
  uc("ah-denials", "Denials & Appeals", "Denials", "Denial explanation and appeal filing for A&H claims", "Reduce appeal filing confusion",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with a denial or appeal. Do you have the claim number?", questions: ["What was the denial reason?", "Do you have additional documentation?", "When was the denial notice received?"], compliance: [{ compliant: "You have the right to appeal within [X] days.", avoid: "It's not worth appealing." }] },
    ["Claim Number", "Denial Reason", "Appeal Documentation"], STANDARD_INTEGRATIONS, [LOG_GUARD],
    [{ title: "Explain Denial", why: "Plain-language explanation", requiredFields: ["Claim Number"] }, { title: "File Appeal", why: "Submit formal appeal", requiredFields: ["Claim Number", "Appeal Documentation"] }],
    [{ title: "A&H Appeals", content: "Appeals must include additional evidence not previously considered. Filing deadline is typically 60 days from denial.", source: "KB-AH-APL-001", confidence: 95 }],
    { ahtReductionPct: 30, fcrImprovementPct: 22, complianceCoveragePct: 98, costPerCallReduction: 5.00 }),
];

// ── TRAVEL ──
const travelUseCases: UseCaseProfile[] = [
  uc("trv-emergency", "Emergency Medical Claim Intake", "Emergency", "Emergency medical claim filing abroad", "Rapid emergency claim processing",
    ["intake", "classification", "policy-match", "audit"],
    { opening: "I can help with an emergency medical claim from your trip. Are you currently abroad?", questions: ["What country are you in?", "What is the medical emergency?", "Have you been admitted to a hospital?", "Do you have your policy number?"], compliance: [{ compliant: "I'll initiate your emergency claim immediately. Your policy covers [details].", avoid: "You should have bought better coverage." }] },
    ["Policy Number", "Country", "Hospital Name", "Diagnosis"], [...STANDARD_INTEGRATIONS, "Travel Assistance"], [LOG_GUARD],
    [{ title: "Initiate Emergency Claim", why: "Time-sensitive processing", requiredFields: ["Policy Number"] }, { title: "Arrange Direct Payment", why: "Coordinate with hospital if possible", requiredFields: ["Hospital Name"] }],
    [{ title: "Travel Emergency", content: "Emergency claims require notification within 24-48 hours. Coordinate direct payment with facility when possible. If this is a medical emergency, call 911 or local emergency services.", source: "KB-TRV-EMR-001", confidence: 97 }],
    { ahtReductionPct: 30, fcrImprovementPct: 25, complianceCoveragePct: 96, costPerCallReduction: 6.00 }),
  uc("trv-evacuation", "Medical Evacuation Status", "Evacuation", "Medical evacuation authorization and coordination", "Coordinate life-critical evacuations",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with medical evacuation coordination. What is the current situation?", questions: ["What is the patient's condition?", "Where is the patient located?", "What is the nearest appropriate facility?"], compliance: [{ compliant: "I'm coordinating with our evacuation partner. Medical necessity must be confirmed.", avoid: "You're probably fine where you are." }] },
    ["Policy Number", "Location", "Medical Condition", "Destination"], [...STANDARD_INTEGRATIONS, "Evacuation Services"], [ESC_GUARD, LOG_GUARD],
    [{ title: "Assess Evacuation Need", why: "Medical necessity determination", requiredFields: ["Medical Condition"] }, { title: "Coordinate Transport", why: "Arrange air/ground evacuation", requiredFields: ["Location", "Destination"] }],
    [{ title: "Medical Evacuation", content: "Evacuation requires medical necessity confirmation. Coordinate with local physicians and receiving facility. If this is a life-threatening emergency, call local emergency services.", source: "KB-TRV-EVAC-001", confidence: 98 }],
    { ahtReductionPct: 15, fcrImprovementPct: 20, complianceCoveragePct: 100, costPerCallReduction: 10.00 }),
  uc("trv-provider-bills", "Provider Bill Payment", "Provider Bills", "International provider bill submission and payment tracking", "Streamline international bill processing",
    ["intake", "classification", "draft", "audit"],
    { opening: "I can help with provider bill submission from your trip. Do you have itemized bills?", questions: ["What currency are the bills in?", "Do you have original receipts?", "Was this an in-network or out-of-network provider?"], compliance: [{ compliant: "Please submit itemized bills with English translation if applicable.", avoid: "We can't read foreign bills." }] },
    ["Policy Number", "Provider Bills", "Currency", "Translation"], STANDARD_INTEGRATIONS, [LOG_GUARD],
    [{ title: "Submit Bills", why: "Process international provider bills", requiredFields: ["Provider Bills"] }],
    [{ title: "International Bills", content: "Bills must be itemized with diagnosis and procedure codes. Currency conversion at date-of-service rate.", source: "KB-TRV-BILL-001", confidence: 93 }],
    { ahtReductionPct: 40, fcrImprovementPct: 30, complianceCoveragePct: 94, costPerCallReduction: 4.50 }),
];

// ── STOP-LOSS ──
const stopLossUseCases: UseCaseProfile[] = [
  uc("sl-doc-intake", "High-Cost Claim Documentation", "Doc Intake", "High-cost claim documentation and packet assembly", "Accelerate stop-loss claim documentation",
    ["intake", "classification", "draft", "hitl", "audit"],
    { opening: "I can help with stop-loss claim documentation. What is the claim number?", questions: ["What is the total paid amount?", "Has the specific deductible been exceeded?", "Is all supporting documentation assembled?"], compliance: [{ compliant: "I'll compile the claim packet per the stop-loss policy requirements.", avoid: "Just send whatever you have." }] },
    ["Claim Number", "Total Paid", "Specific Deductible", "Policy Year"], [...STANDARD_INTEGRATIONS, "Stop-Loss System"], [LOG_GUARD],
    [{ title: "Verify Deductible", why: "Confirm specific deductible exceeded", requiredFields: ["Total Paid", "Specific Deductible"] }, { title: "Assemble Packet", why: "Compile audit-ready claim packet", requiredFields: ["Claim Number"] }],
    [{ title: "Stop-Loss Claims", content: "Claims must exceed the specific deductible. Documentation must include all paid claims, EOBs, and clinical records.", source: "KB-SL-DOC-001", confidence: 96 }],
    { ahtReductionPct: 35, fcrImprovementPct: 25, complianceCoveragePct: 97, costPerCallReduction: 5.00 }),
  uc("sl-eligibility", "Eligibility Verification", "Eligibility", "Verify stop-loss eligibility for specific deductible claims", "Rapid eligibility confirmation",
    ["intake", "classification", "policy-match", "audit"],
    { opening: "I can verify stop-loss eligibility. What is the policy and claim information?", questions: ["What is the specific deductible amount?", "What is the policy period?", "Is this an individual or aggregate claim?"], compliance: [{ compliant: "I'll verify the claim against the stop-loss policy terms.", avoid: "It's probably covered." }] },
    ["Policy Number", "Claim Number", "Specific Deductible"], [...STANDARD_INTEGRATIONS, "Stop-Loss System"], [LOG_GUARD],
    [{ title: "Verify Eligibility", why: "Confirm policy terms and deductible", requiredFields: ["Policy Number"] }],
    [{ title: "Stop-Loss Eligibility", content: "Verify: active policy period, correct specific deductible, no exclusions, and proper laser application.", source: "KB-SL-ELG-001", confidence: 95 }],
    { ahtReductionPct: 40, fcrImprovementPct: 35, complianceCoveragePct: 96, costPerCallReduction: 3.50 }),
  uc("sl-audit", "Audit-Ready Claim Packet", "Audit Packet", "Generate audit-ready claim documentation for reinsurer review", "Ensure compliance with reinsurer requirements",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help prepare an audit-ready claim packet. Which claim needs preparation?", questions: ["Has all clinical documentation been received?", "Are there any pending subrogation or COB issues?", "What is the reinsurer's submission deadline?"], compliance: [{ compliant: "The packet will include all required documentation per the reinsurance agreement.", avoid: "Just send what you have and hope for the best." }] },
    ["Claim Number", "Reinsurer ID", "Deadline"], [...STANDARD_INTEGRATIONS, "Audit System"], [LOG_GUARD],
    [{ title: "Generate Packet", why: "Compile complete audit documentation", requiredFields: ["Claim Number"] }, { title: "Verify Completeness", why: "Checklist of required items", requiredFields: ["Claim Number"] }],
    [{ title: "Audit Requirements", content: "Packet must include: claim summary, all EOBs, clinical records, subrogation status, and COB resolution.", source: "KB-SL-AUD-001", confidence: 97 }],
    { ahtReductionPct: 30, fcrImprovementPct: 20, complianceCoveragePct: 100, costPerCallReduction: 6.00 }),
];

// ── PBM (PHARMACY BENEFIT MANAGER) ──
const pbmUseCases: UseCaseProfile[] = [
  uc("pbm-formulary", "Formulary & Coverage Check", "Formulary", "Confirm drug coverage, tier, PA/ST/QL rules for member or pharmacy", "Resolve formulary questions on first call",
    ["intake", "classification", "policy-match", "audit"],
    { opening: "Thank you for calling. I can help check formulary coverage. May I have the member ID?", questions: ["What medication are you checking?", "What is the strength and dosage form?", "Which pharmacy will be dispensing?", "Is this a new prescription or a refill?"], compliance: [{ compliant: "This medication is on Tier [X] of your formulary with [requirements].", avoid: "It should be covered, just try submitting it." }] },
    ["Member ID", "Drug Name", "NDC", "Pharmacy NPI"], [...STANDARD_INTEGRATIONS, "PBM Platform", "Formulary DB"], [ID_GUARD, LOG_GUARD],
    [{ title: "Run Coverage Check", why: "Show tier, PA/ST/QL flags, copay range", requiredFields: ["Member ID", "Drug Name"] }, { title: "Check Alternatives", why: "Preferred formulary alternatives", requiredFields: ["Drug Name"] }],
    [{ title: "Formulary Lookup Protocol", content: "Verify member identity before disclosing coverage. Always provide tier, cost-share, and any utilization management requirements.", source: "KB-PBM-FORM-001", confidence: 97 }],
    { ahtReductionPct: 45, fcrImprovementPct: 50, complianceCoveragePct: 98, costPerCallReduction: 3.80 }),
  uc("pbm-reject", "Pharmacy Claim Rejection Help", "Reject Help", "Troubleshoot pharmacy claim rejections: eligibility, NDC, PA, days supply", "Resolve pharmacy rejects without callbacks",
    ["intake", "classification", "policy-match", "draft", "audit"],
    { opening: "I can help troubleshoot a claim rejection. What reject code are you seeing?", questions: ["What is the reject code?", "What NDC was submitted?", "What days supply?", "What BIN/PCN/Group was used?", "What is the prescriber NPI?"], compliance: [{ compliant: "The reject is due to [reason]. Here's how to resolve it.", avoid: "Just resubmit it and it should work." }] },
    ["Reject Code", "NDC", "Days Supply", "BIN/PCN/Group", "Prescriber NPI", "Member ID"], [...STANDARD_INTEGRATIONS, "PBM Platform", "Reject Resolution Engine"], [ID_GUARD, LOG_GUARD],
    [{ title: "Diagnose Reject", why: "Identify root cause from reject code", requiredFields: ["Reject Code", "NDC"] }, { title: "Suggest Fix", why: "Recommend corrective action", requiredFields: ["Reject Code"] }, { title: "Override if Eligible", why: "Apply override when authorized", requiredFields: ["Reject Code", "Member ID"] }],
    [{ title: "Reject Resolution", content: "Common rejects: 70=Product Not Covered, 75=PA Required, 76=Plan Limitations. Always verify eligibility before troubleshooting.", source: "KB-PBM-REJ-001", confidence: 96 }],
    { ahtReductionPct: 40, fcrImprovementPct: 55, complianceCoveragePct: 97, costPerCallReduction: 4.20 }),
  uc("pbm-pa", "Pharmacy Prior Auth Intake & Status", "Pharmacy PA", "Collect clinical info for pharmacy PA or check existing PA status", "Accelerate PA turnaround with complete intake",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with a pharmacy prior authorization. Do you have a PA reference number?", questions: ["What medication requires PA?", "What is the diagnosis?", "What medications has the patient tried previously?", "Were there adverse reactions or treatment failures?", "Is this standard or expedited?"], compliance: [{ compliant: "The PA request has been submitted. Standard turnaround is [X] hours.", avoid: "It'll probably get approved." }] },
    ["Member ID", "Drug Name", "NDC", "Diagnosis/ICD-10", "Prior Therapies", "Prescriber NPI", "Urgency"], [...STANDARD_INTEGRATIONS, "PBM Platform", "Clinical Review Queue"], [ID_GUARD, ESC_GUARD, LOG_GUARD],
    [{ title: "Check PA Status", why: "Real-time PA determination status", requiredFields: ["PA Ref"] }, { title: "Submit PA Request", why: "Initiate new pharmacy PA", requiredFields: ["Member ID", "Drug Name", "Prescriber NPI"] }, { title: "Escalate to Clinical", why: "Complex clinical review needed", requiredFields: ["PA Ref"] }],
    [{ title: "Pharmacy PA Turnaround", content: "Standard: 72 hours. Urgent/expedited: 24 hours. Document all clinical rationale and prior therapy attempts.", source: "KB-PBM-PA-001", confidence: 98 }],
    { ahtReductionPct: 32, fcrImprovementPct: 30, complianceCoveragePct: 99, costPerCallReduction: 5.50 }),
  uc("pbm-step-therapy", "Step Therapy / Medical Exception", "Step Therapy", "Document therapy failure or contraindication and initiate exception", "Streamline step therapy exception process",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with a step therapy exception. Which medication is being requested?", questions: ["Which step therapy medications were tried?", "What was the clinical outcome?", "Were there adverse reactions?", "Is there a contraindication to the step therapy drug?"], compliance: [{ compliant: "I'll document the clinical rationale and submit an exception request.", avoid: "Just say the patient can't take it." }] },
    ["Member ID", "Requested Drug", "Step Therapy Drugs Tried", "Clinical Outcome", "Prescriber NPI"], [...STANDARD_INTEGRATIONS, "PBM Platform", "Clinical Review Queue"], [ID_GUARD, ESC_GUARD, LOG_GUARD],
    [{ title: "Document Exception", why: "Capture clinical rationale", requiredFields: ["Requested Drug", "Step Therapy Drugs Tried"] }, { title: "Submit Exception", why: "Route for clinical review", requiredFields: ["Member ID", "Prescriber NPI"] }],
    [{ title: "Step Therapy Protocol", content: "Exceptions require documented failure, adverse reaction, or contraindication to preferred agents. Include lab results if available.", source: "KB-PBM-ST-001", confidence: 97 }],
    { ahtReductionPct: 28, fcrImprovementPct: 25, complianceCoveragePct: 100, costPerCallReduction: 5.00 }),
  uc("pbm-quantity-limit", "Quantity Limit Override Request", "QL Override", "Capture clinical rationale and submit quantity limit override", "Reduce QL override cycle time",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with a quantity limit override. What medication is affected?", questions: ["What quantity is being prescribed?", "What is the plan's quantity limit?", "What is the clinical rationale for the higher quantity?", "Has the prescriber provided documentation?"], compliance: [{ compliant: "I'll submit the override request with the clinical documentation.", avoid: "We can just approve a higher quantity." }] },
    ["Member ID", "Drug Name", "Prescribed Quantity", "Plan QL", "Clinical Rationale", "Prescriber NPI"], [...STANDARD_INTEGRATIONS, "PBM Platform"], [ID_GUARD, LOG_GUARD],
    [{ title: "Submit QL Override", why: "Route override with rationale", requiredFields: ["Member ID", "Drug Name", "Clinical Rationale"] }],
    [{ title: "QL Override Policy", content: "Override requires prescriber rationale. Common approvals: titration, weight-based dosing, split dosing. Standard review: 72 hours.", source: "KB-PBM-QL-001", confidence: 95 }],
    { ahtReductionPct: 30, fcrImprovementPct: 35, complianceCoveragePct: 98, costPerCallReduction: 4.00 }),
  uc("pbm-tier-exception", "Tier Exception / Non-Formulary Request", "Tier Exception", "Initiate formulary exception with clinical evidence checklist", "Reduce member cost with appropriate exceptions",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with a tier exception request. What medication do you need covered?", questions: ["Is this medication on the formulary?", "What formulary alternatives have been tried?", "What was the clinical outcome with alternatives?", "Does the prescriber have supporting documentation?"], compliance: [{ compliant: "I'll submit the exception with the required clinical evidence.", avoid: "We can just move it to a lower tier." }] },
    ["Member ID", "Drug Name", "Alternatives Tried", "Clinical Evidence", "Prescriber NPI"], [...STANDARD_INTEGRATIONS, "PBM Platform", "Formulary DB"], [ID_GUARD, ESC_GUARD, LOG_GUARD],
    [{ title: "Check Formulary Alternatives", why: "Verify alternatives attempted", requiredFields: ["Drug Name"] }, { title: "Submit Exception", why: "Route with clinical evidence", requiredFields: ["Member ID", "Drug Name", "Prescriber NPI"] }],
    [{ title: "Tier Exception Criteria", content: "Requires documented failure or contraindication to all formulary alternatives in same therapeutic class.", source: "KB-PBM-TE-001", confidence: 97 }],
    { ahtReductionPct: 25, fcrImprovementPct: 22, complianceCoveragePct: 99, costPerCallReduction: 5.20 }),
  uc("pbm-specialty", "Specialty Medication Onboarding", "Specialty Rx", "Benefits investigation + transfer to specialty pharmacy team", "Smooth specialty onboarding experience",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with specialty medication onboarding. What medication has been prescribed?", questions: ["What is the specialty drug?", "Who is the prescribing provider?", "Do you have a preferred specialty pharmacy?", "Has benefits investigation been completed?"], compliance: [{ compliant: "I'll connect you with our specialty pharmacy team for enrollment.", avoid: "You can just go to any pharmacy." }] },
    ["Member ID", "Drug Name", "Prescriber NPI", "Specialty Pharmacy Preference"], [...STANDARD_INTEGRATIONS, "PBM Platform", "Specialty Pharmacy System"], [ID_GUARD, ESC_GUARD, LOG_GUARD],
    [{ title: "Benefits Investigation", why: "Verify coverage and cost for specialty drug", requiredFields: ["Member ID", "Drug Name"] }, { title: "Warm Transfer to Specialty", why: "Connect with specialty pharmacy team", requiredFields: ["Member ID"] }],
    [{ title: "Specialty Onboarding", content: "Specialty drugs require benefits investigation, PA confirmation, and enrollment with designated specialty pharmacy. Average onboarding: 5-7 business days.", source: "KB-PBM-SPEC-001", confidence: 96 }],
    { ahtReductionPct: 20, fcrImprovementPct: 30, complianceCoveragePct: 100, costPerCallReduction: 6.00 }),
  uc("pbm-copay-assist", "Copay Assistance / Benefit Coordination", "Copay Assist", "Coordination guidance for manufacturer copay cards and assistance programs", "Help members reduce out-of-pocket costs",
    ["intake", "classification", "policy-match", "audit"],
    { opening: "I can help with copay assistance options. What medication are you taking?", questions: ["What is your current copay?", "Are you using a manufacturer copay card?", "Have you applied for patient assistance?", "Is this a specialty or retail medication?"], compliance: [{ compliant: "Here are the available assistance options for your medication.", avoid: "You shouldn't have to pay anything." }] },
    ["Member ID", "Drug Name", "Current Copay"], [...STANDARD_INTEGRATIONS, "PBM Platform"], [ID_GUARD, LOG_GUARD],
    [{ title: "Check Copay Programs", why: "Identify available assistance", requiredFields: ["Drug Name"] }, { title: "Coordinate Benefits", why: "Optimize cost-sharing", requiredFields: ["Member ID", "Drug Name"] }],
    [{ title: "Copay Assistance", content: "Manufacturer copay cards may apply. Accumulator/maximizer programs may affect OOP calculations. Always disclose plan rules.", source: "KB-PBM-COPAY-001", confidence: 94 }],
    { ahtReductionPct: 35, fcrImprovementPct: 40, complianceCoveragePct: 96, costPerCallReduction: 3.00 }),
  uc("pbm-adherence", "Medication Adherence Outreach", "Adherence", "Refill reminders and barrier resolution outreach", "Improve medication adherence rates",
    ["intake", "classification", "audit"],
    { opening: "Hi, I'm calling from your pharmacy benefit plan about your medication. Is this a good time?", questions: ["Have you been able to fill your recent prescription?", "Are you experiencing any side effects?", "Is cost a barrier to filling?", "Would you like to set up auto-refill?"], compliance: [{ compliant: "I want to make sure you have what you need to stay on your medication.", avoid: "You need to take your medication or else." }] },
    ["Member ID", "Drug Name", "Last Fill Date"], [...STANDARD_INTEGRATIONS, "PBM Platform"], [ID_GUARD, LOG_GUARD],
    [{ title: "Check Fill History", why: "Identify gaps in therapy", requiredFields: ["Member ID", "Drug Name"] }, { title: "Resolve Barriers", why: "Address cost, access, or side effect issues", requiredFields: ["Member ID"] }],
    [{ title: "Adherence Outreach", content: "Outbound calls must identify caller and purpose. Do not pressure. Document barriers and resolutions.", source: "KB-PBM-ADH-001", confidence: 93 }],
    { ahtReductionPct: 15, fcrImprovementPct: 60, complianceCoveragePct: 95, costPerCallReduction: 2.50 }),
  uc("pbm-appeals", "Appeals for Pharmacy Denials", "Rx Appeals", "Standard and expedited pharmacy denial appeal intake with documentation", "Streamline pharmacy appeal processing",
    ["intake", "classification", "policy-match", "draft", "hitl", "audit"],
    { opening: "I can help with a pharmacy denial appeal. Do you have the denial reference number?", questions: ["What medication was denied?", "What was the denial reason?", "Do you have additional clinical documentation?", "Is this a standard or expedited appeal?"], compliance: [{ compliant: "You have the right to appeal. I'll help initiate the process.", avoid: "Appeals rarely get overturned." }] },
    ["Member ID", "Drug Name", "Denial Ref", "Denial Reason", "Appeal Type"], [...STANDARD_INTEGRATIONS, "PBM Platform", "Appeals System"], [ID_GUARD, ESC_GUARD, LOG_GUARD],
    [{ title: "Initiate Appeal", why: "Start formal appeal process", requiredFields: ["Denial Ref", "Appeal Type"] }, { title: "Generate Checklist", why: "Document requirements for appeal", requiredFields: ["Denial Ref"] }, { title: "Expedited Routing", why: "Urgent clinical need pathway", requiredFields: ["Denial Ref"] }],
    [{ title: "Pharmacy Appeal Rights", content: "Standard: 30 days. Expedited: 72 hours (if delay risks health). Include denial notice, clinical rationale, supporting records.", source: "KB-PBM-APL-001", confidence: 98 }],
    { ahtReductionPct: 30, fcrImprovementPct: 20, complianceCoveragePct: 100, costPerCallReduction: 6.50 }),
  uc("pbm-dur", "DUR / Safety Alert Escalation", "DUR Alert", "Drug utilization review and safety alert escalation to clinical pharmacist", "Immediate clinical handoff for safety concerns",
    ["intake", "classification", "hitl", "audit"],
    { opening: "I see there's a safety alert flagged. Let me help address this right away.", questions: ["What interaction or alert was flagged?", "Is the patient experiencing any symptoms?", "Is this urgent?", "What is the dispensing pharmacy?"], compliance: [{ compliant: "I'm going to connect you with a clinical pharmacist immediately for a safety review.", avoid: "It's probably fine to take both." }] },
    ["Member ID", "Drug Interaction", "Symptoms", "Urgency", "Pharmacy NABP"], [...STANDARD_INTEGRATIONS, "PBM Platform", "Clinical Review Queue"], [ESC_GUARD, LOG_GUARD, PHI_GUARD],
    [{ title: "Immediate Pharmacist Handoff", why: "Safety alerts require clinical review", requiredFields: ["Member ID"] }, { title: "Document Alert", why: "Record interaction details", requiredFields: ["Drug Interaction"] }],
    [{ title: "DUR Alert Protocol", content: "All DUR alerts require clinical pharmacist review. Do NOT advise patient to continue or discontinue medication. Emergency: direct to 911.", source: "KB-PBM-DUR-001", confidence: 99 }],
    { ahtReductionPct: 10, fcrImprovementPct: 15, complianceCoveragePct: 100, costPerCallReduction: 8.00 }),
  uc("pbm-fwa", "Fraud/Waste/Abuse Signal Intake", "FWA Intake", "Capture suspected fraud, waste, or abuse details and route to FWA queue", "Protect plan integrity with structured FWA intake",
    ["intake", "classification", "hitl", "audit"],
    { opening: "Thank you for reporting this concern. I'll help document the details.", questions: ["What is the nature of the concern?", "Which pharmacy or provider is involved?", "What prescription or claim is in question?", "How did you become aware of this?"], compliance: [{ compliant: "I'll document this and route it to our investigations team.", avoid: "That's definitely fraud." }] },
    ["Reporter Info", "Pharmacy/Provider ID", "Claim/Rx Details", "Nature of Concern"], [...STANDARD_INTEGRATIONS, "PBM Platform", "SIU/FWA Queue"], [LOG_GUARD],
    [{ title: "Document FWA Report", why: "Structured intake for investigation", requiredFields: ["Nature of Concern"] }, { title: "Route to SIU", why: "Investigation team review", requiredFields: ["Reporter Info"] }],
    [{ title: "FWA Intake Protocol", content: "Do not make determinations. Collect facts only. Protect reporter identity. Route to SIU within 24 hours.", source: "KB-PBM-FWA-001", confidence: 97 }],
    { ahtReductionPct: 20, fcrImprovementPct: 10, complianceCoveragePct: 100, costPerCallReduction: 3.50 }),
];

/* ═══════════════════════════════════════════════════════
   PRODUCT LINE → USE CASE MAP
   ═══════════════════════════════════════════════════════ */

// For Medicare, Medicaid, Duals, Group, Employer/TPA, WC PBM, and Specialty BM
// we reuse the existing comprehensive profiles from useCaseProfiles.ts
// and map them through the import. The "medicare" key returns null to signal
// "use the original USE_CASE_PROFILES from useCaseProfiles.ts"

export const USE_CASES_BY_PRODUCT_LINE: Record<string, UseCaseProfile[] | null> = {
  "commercial": commercialUseCases,
  "medicare": null, // signals: use original USE_CASE_PROFILES
  "medicaid": null, // reuse Medicare profiles (same structure)
  "dual-eligible": null, // reuse Medicare profiles
  "workers-comp": workersCompUseCases,
  "pnc-bi": pncUseCases,
  "disability": disabilityUseCases,
  "accident-health": accidentHealthUseCases,
  "life": lifeUseCases,
  "vision": visionUseCases,
  "dental": dentalUseCases,
  "travel": travelUseCases,
  "stop-loss": stopLossUseCases,
  "group-benefits": null, // reuse Medicare profiles (bundle)
  "employer-tpa": null, // reuse Medicare profiles (TPA operations)
  "wc-pbm": workersCompUseCases, // reuse WC
  "specialty-bm": commercialUseCases, // reuse Commercial
  "pharmacy-benefit": pbmUseCases,
  "medicare-part-d": pbmUseCases, // Part D uses PBM use cases
  "medicaid-rx": pbmUseCases, // Medicaid Rx uses PBM use cases
};

/**
 * Get use cases for a product line.
 * Returns the product-line-specific cases, or falls back to the original
 * Medicare profiles from useCaseProfiles.ts when the mapping is null.
 */
export function getUseCasesForProductLine(productLineId: string, fallbackProfiles: UseCaseProfile[]): UseCaseProfile[] {
  const mapped = USE_CASES_BY_PRODUCT_LINE[productLineId];
  if (mapped === null || mapped === undefined) return fallbackProfiles;
  return mapped;
}
