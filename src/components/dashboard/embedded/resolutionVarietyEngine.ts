/* ═══════════════════════════════════════════════════════
   Resolution Variety Engine (RVE)
   Provides realistic ending variety for every use case,
   with weighted selection, deflection scoring, and
   script patching for blocks F–I.
   ═══════════════════════════════════════════════════════ */

import type { ScriptBlock, ScriptAction, ResolutionOutcome } from "./scriptEngine";

// ── Core Types ──

export type EndingDisposition = "Resolved" | "Docs Requested" | "Escalated" | "Warm Transfer" | "Callback" | "Appeal Initiated";
export type DeflectionLevel = "high" | "medium" | "low";
export type EndingMode = "auto" | "manual";
export type DeflectionBias = "low" | "medium" | "high";

export interface UIAction {
  label: string;
  type: "copy" | "send" | "generate" | "transfer" | "appeal" | "resolve" | "escalate";
  icon?: string;
}

export interface ResolutionEnding {
  ending_id: string;
  label: string;
  disposition: EndingDisposition;
  handoff_required: boolean;
  deflection_score: number;          // 0–100
  weight: number;                    // default probability weight
  agent_script_patch: {
    blockF: string;                  // status explanation
    blockG: string[];                // resolution path outcomes
    blockH_target?: string;          // warm transfer target (if handoff)
    blockH_summary?: string;
    blockI_recap: string;            // wrap-up recap
  };
  ui_actions: UIAction[];
  outputs?: { label: string; value: string }[];
}

export interface UseCaseEndingSet {
  useCaseId: string;
  endings: ResolutionEnding[];
}

// ── Mock Data Generators ──

export function generateAuthNumber(): string {
  return `AUTH-2026-${Math.floor(1000000 + Math.random() * 9000000)}`;
}

export function generateCaseRef(): string {
  return `PA-REF-${Math.floor(1000000 + Math.random() * 9000000)}`;
}

export function generateAppealRef(): string {
  return `APL-${Math.floor(100000 + Math.random() * 900000)}`;
}

export function generateTicketNumber(): string {
  return `TKT-${Date.now().toString(36).toUpperCase()}-${Math.random().toString(36).slice(2, 6).toUpperCase()}`;
}

export function generateSLATimestamp(): string {
  const d = new Date();
  d.setHours(d.getHours() + Math.floor(12 + Math.random() * 36));
  return d.toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", hour: "numeric", minute: "2-digit" });
}

// ── Deflection Level Helpers ──

export function getDeflectionLevel(score: number): DeflectionLevel {
  if (score >= 70) return "high";
  if (score >= 40) return "medium";
  return "low";
}

export function getDeflectionColor(level: DeflectionLevel): string {
  switch (level) {
    case "high": return "text-emerald-600";
    case "medium": return "text-amber-600";
    case "low": return "text-red-500";
  }
}

export function getDeflectionBg(level: DeflectionLevel): string {
  switch (level) {
    case "high": return "bg-emerald-500/10 border-emerald-500/20";
    case "medium": return "bg-amber-500/10 border-amber-500/20";
    case "low": return "bg-red-500/10 border-red-500/20";
  }
}

// ── Prior Auth Endings (10+) ──

function priorAuthEndings(): ResolutionEnding[] {
  const authNum = generateAuthNumber();
  const caseRef = generateCaseRef();
  const appealRef = generateAppealRef();
  const sla = generateSLATimestamp();
  const ticketNum = generateTicketNumber();

  return [
    {
      ending_id: "pa-approved",
      label: "Approved — Auth # Issued",
      disposition: "Resolved",
      handoff_required: false,
      deflection_score: 95,
      weight: 25,
      agent_script_patch: {
        blockF: `Great news — the prior authorization has been approved. Your authorization number is ${authNum}. This covers up to 12 visits of outpatient physical therapy, effective today through December 31st, 2026. The service must be rendered at an in-network facility.`,
        blockG: ["Confirm authorization details delivered", "Send approval summary to provider", "Copy authorization number"],
        blockI_recap: `Your authorization number is ${authNum}. Approved for 12 visits through 12/31/2026. Is there anything else I can help with?`,
      },
      ui_actions: [
        { label: `Copy Auth # ${authNum}`, type: "copy" },
        { label: "Send Approval Summary", type: "send" },
      ],
      outputs: [
        { label: "Auth #", value: authNum },
        { label: "Status", value: "Approved" },
        { label: "Visits", value: "12 (Outpatient PT)" },
        { label: "Effective", value: "Today – 12/31/2026" },
        { label: "Facility", value: "In-Network Only" },
      ],
    },
    {
      ending_id: "pa-approved-modified",
      label: "Approved with Modification",
      disposition: "Resolved",
      handoff_required: false,
      deflection_score: 85,
      weight: 10,
      agent_script_patch: {
        blockF: `The authorization has been approved with a modification. Your auth number is ${authNum}. The request was for 20 visits, but the approval covers 8 visits initially, with re-evaluation required before additional visits. The facility must be in-network.`,
        blockG: ["Confirm modified terms delivered", "Explain modification rationale", "Send modified approval summary"],
        blockI_recap: `Auth ${authNum} approved for 8 visits initially (modified from 20). Re-evaluation required. Ref: ${caseRef}.`,
      },
      ui_actions: [
        { label: `Copy Auth # ${authNum}`, type: "copy" },
        { label: "Explain Modification", type: "resolve" },
        { label: "Send Modified Terms", type: "send" },
      ],
      outputs: [
        { label: "Auth #", value: authNum },
        { label: "Status", value: "Approved (Modified)" },
        { label: "Approved", value: "8 visits (requested 20)" },
        { label: "Re-eval", value: "Required after 8 visits" },
      ],
    },
    {
      ending_id: "pa-pending-docs",
      label: "Pending — Missing Documentation",
      disposition: "Docs Requested",
      handoff_required: false,
      deflection_score: 70,
      weight: 25,
      agent_script_patch: {
        blockF: `The authorization request is pending due to missing documentation. I need the following to proceed: 1) office visit notes from the last 90 days, 2) imaging results if available, and 3) a letter of medical necessity from the ordering provider. You can submit via fax to 800-555-0199 or through the provider portal. The SLA for review is 48 hours after documents are received.`,
        blockG: ["Generate document checklist", "Send submission instructions", "Set follow-up reminder"],
        blockI_recap: `PA is pending. Documents needed: office notes, imaging, letter of necessity. Submit via fax or portal. Decision within 48 hours of receipt. Ref: ${caseRef}.`,
      },
      ui_actions: [
        { label: "Generate Doc Checklist", type: "generate" },
        { label: "Send Submission Instructions", type: "send" },
        { label: `Copy Ref # ${caseRef}`, type: "copy" },
      ],
      outputs: [
        { label: "Ref #", value: caseRef },
        { label: "Status", value: "Pending — Docs Needed" },
        { label: "Docs Required", value: "Office notes, Imaging, LON" },
        { label: "Submit Via", value: "Fax: 800-555-0199 / Portal" },
        { label: "SLA", value: "48 hrs after receipt" },
      ],
    },
    {
      ending_id: "pa-pending-clinical-qs",
      label: "Pending — Additional Clinical Questions",
      disposition: "Docs Requested",
      handoff_required: false,
      deflection_score: 65,
      weight: 5,
      agent_script_patch: {
        blockF: `The clinical review team has specific questions before a determination can be made. I'm sending the following to the provider office: 1) Has the patient completed conservative treatment? 2) What is the current functional status? 3) Were alternative therapies considered? 4) What is the expected duration of treatment? Responses are needed within 5 business days.`,
        blockG: ["Send clinical questions to provider", "Set follow-up reminder", "Copy question list"],
        blockI_recap: `PA pending clinical questions sent to provider. Responses due within 5 business days. Ref: ${caseRef}.`,
      },
      ui_actions: [
        { label: "Send Questions to Provider", type: "send" },
        { label: "Set Follow-up Reminder", type: "resolve" },
        { label: `Copy Ref # ${caseRef}`, type: "copy" },
      ],
      outputs: [
        { label: "Ref #", value: caseRef },
        { label: "Status", value: "Pending — Clinical Questions" },
        { label: "Questions Sent", value: "4 targeted questions" },
        { label: "Response Due", value: "5 business days" },
      ],
    },
    {
      ending_id: "pa-peer-to-peer",
      label: "Peer-to-Peer Required",
      disposition: "Warm Transfer",
      handoff_required: true,
      deflection_score: 30,
      weight: 10,
      agent_script_patch: {
        blockF: `A peer-to-peer review has been requested. The ordering physician will need to speak with our Medical Director to discuss the clinical necessity. The scheduling window is Monday through Friday, 9 AM to 4 PM. The attending physician or qualified designee must participate.`,
        blockG: ["Generate peer-to-peer packet", "Warm transfer to PA team", "Schedule peer-to-peer call"],
        blockH_target: "PA / Medical Director Team",
        blockH_summary: "Peer-to-peer review required — scheduling needed between ordering physician and Medical Director",
        blockI_recap: `Peer-to-peer review required. Scheduling window: Mon–Fri 9AM–4PM. Ref: ${caseRef}. Transferring now.`,
      },
      ui_actions: [
        { label: "Generate P2P Packet", type: "generate" },
        { label: "Warm Transfer to PA Team", type: "transfer" },
        { label: `Copy Ref # ${caseRef}`, type: "copy" },
      ],
      outputs: [
        { label: "Ref #", value: caseRef },
        { label: "Status", value: "Peer-to-Peer Required" },
        { label: "Window", value: "Mon–Fri 9AM–4PM" },
        { label: "Required", value: "Ordering physician or designee" },
      ],
    },
    {
      ending_id: "pa-denied-necessity",
      label: "Denied — Medical Necessity Not Met",
      disposition: "Appeal Initiated",
      handoff_required: false,
      deflection_score: 55,
      weight: 15,
      agent_script_patch: {
        blockF: `Unfortunately, the prior authorization has been denied. The clinical review determined that medical necessity criteria were not met based on the documentation submitted. You have the right to appeal this decision. A standard appeal takes up to 30 days, or you can request an expedited appeal within 72 hours if there's clinical urgency. I can help you start the process now.`,
        blockG: ["Start appeal packet", "Generate evidence checklist", "Explain appeal options", "Route to appeals team"],
        blockI_recap: `PA denied — medical necessity not met. Appeal options: standard (30 days) or expedited (72 hrs). Appeal ref: ${appealRef}.`,
      },
      ui_actions: [
        { label: "Start Appeal Packet", type: "appeal" },
        { label: "Generate Evidence Checklist", type: "generate" },
        { label: `Copy Appeal Ref ${appealRef}`, type: "copy" },
      ],
      outputs: [
        { label: "Appeal Ref", value: appealRef },
        { label: "Status", value: "Denied — Appeal Available" },
        { label: "Reason", value: "Medical necessity not met" },
        { label: "Standard Appeal", value: "30 days" },
        { label: "Expedited Appeal", value: "72 hours" },
      ],
    },
    {
      ending_id: "pa-denied-exclusion",
      label: "Denied — Non-Covered / Exclusion",
      disposition: "Resolved",
      handoff_required: false,
      deflection_score: 60,
      weight: 5,
      agent_script_patch: {
        blockF: `The requested service is not covered under the member's current plan — it falls under a plan exclusion. However, there are alternatives: 1) a covered alternative procedure (CPT 97140 vs 97530), 2) a self-pay estimate of approximately $450 per session, or 3) I can route you to benefits counseling for coverage options.`,
        blockG: ["Show covered alternatives", "Provide self-pay estimate", "Route to benefits team"],
        blockI_recap: `PA denied — plan exclusion. Alternatives provided: covered procedure, self-pay option. Ref: ${caseRef}.`,
      },
      ui_actions: [
        { label: "Show Alternatives", type: "resolve" },
        { label: "Route to Benefits Team", type: "transfer" },
        { label: `Copy Ref # ${caseRef}`, type: "copy" },
      ],
      outputs: [
        { label: "Ref #", value: caseRef },
        { label: "Status", value: "Denied — Plan Exclusion" },
        { label: "Alternative CPT", value: "97140 (Covered)" },
        { label: "Self-Pay Est.", value: "~$450/session" },
      ],
    },
    {
      ending_id: "pa-cancelled",
      label: "Cancelled / Withdrawn Request",
      disposition: "Resolved",
      handoff_required: false,
      deflection_score: 90,
      weight: 3,
      agent_script_patch: {
        blockF: `This PA request was withdrawn by the provider office on February 10th. If you need to resubmit, you can do so through the provider portal or by calling back with the clinical documentation. The original case reference is ${caseRef}.`,
        blockG: ["Provide resubmission steps", "Copy original reference"],
        blockI_recap: `PA was withdrawn 02/10. Resubmission available via portal or phone. Original ref: ${caseRef}.`,
      },
      ui_actions: [
        { label: "Resubmission Steps", type: "resolve" },
        { label: `Copy Ref # ${caseRef}`, type: "copy" },
      ],
      outputs: [
        { label: "Ref #", value: caseRef },
        { label: "Status", value: "Withdrawn" },
        { label: "Withdrawn By", value: "Provider Office" },
        { label: "Withdrawn Date", value: "02/10/2026" },
      ],
    },
    {
      ending_id: "pa-duplicate",
      label: "Duplicate Request Found",
      disposition: "Resolved",
      handoff_required: false,
      deflection_score: 92,
      weight: 4,
      agent_script_patch: {
        blockF: `I found an existing authorization that matches this request. Auth number ${authNum} was issued on February 5th for the same service and member. It's currently active through June 30th, 2026. No new authorization is needed.`,
        blockG: ["Copy existing auth number", "Explain duplicate"],
        blockI_recap: `Duplicate found. Existing auth ${authNum} is active through 06/30/2026. No new PA needed.`,
      },
      ui_actions: [
        { label: `Copy Existing Auth # ${authNum}`, type: "copy" },
        { label: "Explain Duplicate", type: "resolve" },
      ],
      outputs: [
        { label: "Existing Auth #", value: authNum },
        { label: "Status", value: "Active (Duplicate)" },
        { label: "Effective", value: "02/05 – 06/30/2026" },
      ],
    },
    {
      ending_id: "pa-expedited",
      label: "Urgent/Expedited Review Triggered",
      disposition: "Escalated",
      handoff_required: false,
      deflection_score: 45,
      weight: 3,
      agent_script_patch: {
        blockF: `Due to clinical urgency, this has been escalated to expedited review. The determination will be made within 24 hours. Your escalation ticket is ${ticketNum}. You'll receive a call or fax with the decision by ${sla}.`,
        blockG: ["Create escalation ticket", "Confirm expedited SLA", "Warm transfer if needed"],
        blockI_recap: `Expedited review triggered. Ticket: ${ticketNum}. Decision expected by ${sla}.`,
      },
      ui_actions: [
        { label: "Create Escalation Ticket", type: "escalate" },
        { label: `Copy Ticket # ${ticketNum}`, type: "copy" },
        { label: "Warm Transfer if Needed", type: "transfer" },
      ],
      outputs: [
        { label: "Ticket #", value: ticketNum },
        { label: "Status", value: "Expedited Review" },
        { label: "SLA", value: `Decision by ${sla}` },
        { label: "Next Update", value: sla },
      ],
    },
  ];
}

// ── Eligibility Endings ──

function eligibilityEndings(): ResolutionEnding[] {
  return [
    {
      ending_id: "elig-active", label: "Active & Eligible", disposition: "Resolved",
      handoff_required: false, deflection_score: 95, weight: 40,
      agent_script_patch: {
        blockF: "Coverage is active. The member is enrolled in a PPO Gold plan through their employer. Specialist copay is $30, deductible is 74% met at $1,480 of $2,000. No prior auth required for in-network. Coverage is effective through 12/31/2026.",
        blockG: ["Confirm details delivered", "Send summary to email"], blockI_recap: "Eligibility confirmed. Active coverage through 12/31/2026.",
      },
      ui_actions: [{ label: "Send Benefit Summary", type: "send" }],
      outputs: [{ label: "Status", value: "Active" }, { label: "Plan", value: "PPO Gold" }, { label: "Deductible", value: "74% met" }],
    },
    {
      ending_id: "elig-limited", label: "Eligible with Limitations", disposition: "Resolved",
      handoff_required: false, deflection_score: 85, weight: 15,
      agent_script_patch: {
        blockF: "Coverage is active but there are limitations on the requested service. Out-of-network services require prior authorization and are subject to a higher cost-share of 40% coinsurance after the separate OON deductible.",
        blockG: ["Explain limitations", "Provide in-network alternatives"], blockI_recap: "Eligible with limitations. OON requires PA and 40% coinsurance.",
      },
      ui_actions: [{ label: "Show Limitations", type: "resolve" }, { label: "Find In-Network", type: "resolve" }],
      outputs: [{ label: "Status", value: "Active — Limited" }, { label: "OON Coinsurance", value: "40%" }, { label: "PA Required", value: "Yes (OON)" }],
    },
    {
      ending_id: "elig-inactive", label: "Inactive Coverage", disposition: "Resolved",
      handoff_required: false, deflection_score: 80, weight: 15,
      agent_script_patch: {
        blockF: "The member's coverage terminated on January 31st, 2026. The reason code indicates voluntary termination. COBRA continuation options may be available. I can provide next steps.",
        blockG: ["Explain termination", "Provide COBRA info", "Route to enrollment"], blockI_recap: "Coverage inactive as of 01/31/2026. COBRA options discussed.",
      },
      ui_actions: [{ label: "COBRA Info", type: "resolve" }, { label: "Route to Enrollment", type: "transfer" }],
      outputs: [{ label: "Status", value: "Inactive" }, { label: "Term Date", value: "01/31/2026" }, { label: "Reason", value: "Voluntary" }],
    },
    {
      ending_id: "elig-cob", label: "COB — Other Primary Suspected", disposition: "Docs Requested",
      handoff_required: false, deflection_score: 55, weight: 10,
      agent_script_patch: {
        blockF: "Our records indicate a possible other primary payer. Before processing, we need the member to complete a COB questionnaire. I can send the form and instructions now.",
        blockG: ["Send COB questionnaire", "Explain COB process"], blockI_recap: "COB questionnaire sent. Member must complete before claims process.",
      },
      ui_actions: [{ label: "Send COB Form", type: "send" }, { label: "Explain COB", type: "resolve" }],
      outputs: [{ label: "Status", value: "COB Investigation" }, { label: "Action", value: "Questionnaire sent" }],
    },
    {
      ending_id: "elig-id-update", label: "Identity Verification Update Needed", disposition: "Resolved",
      handoff_required: false, deflection_score: 75, weight: 10,
      agent_script_patch: {
        blockF: "Eligibility was confirmed with limited information. However, the address on file appears outdated. The member should update demographics through the portal or by calling member services to ensure future claim processing isn't delayed.",
        blockG: ["Confirm limited eligibility", "Advise demographic update"], blockI_recap: "Eligible with limited info. Demographics update recommended.",
      },
      ui_actions: [{ label: "Send Update Instructions", type: "send" }],
      outputs: [{ label: "Status", value: "Active — Update Needed" }, { label: "Issue", value: "Address outdated" }],
    },
    {
      ending_id: "elig-oon", label: "Out-of-Network / Plan Mismatch", disposition: "Resolved",
      handoff_required: false, deflection_score: 78, weight: 10,
      agent_script_patch: {
        blockF: "The requested provider is out of network for the member's plan. In-network alternatives are available within 10 miles. I can provide a list of in-network providers offering the same service.",
        blockG: ["Provide in-network list", "Explain OON cost"], blockI_recap: "Provider is OON. In-network alternatives provided.",
      },
      ui_actions: [{ label: "Show In-Network Providers", type: "resolve" }],
      outputs: [{ label: "Status", value: "OON Mismatch" }, { label: "Alternatives", value: "3 in-network within 10 mi" }],
    },
  ];
}

// ── Claims Status Endings ──

function claimsStatusEndings(): ResolutionEnding[] {
  const claimId = `CLM-${Math.floor(10000 + Math.random() * 90000)}`;
  const appealRef = generateAppealRef();
  const ticketNum = generateTicketNumber();

  return [
    {
      ending_id: "clm-paid", label: "Paid — Payment Issued", disposition: "Resolved",
      handoff_required: false, deflection_score: 95, weight: 30,
      agent_script_patch: {
        blockF: `Claim ${claimId} has been adjudicated and payment of $2,840 was issued to the provider on February 10th. The member responsibility is $460, applied to the deductible. The check/EFT reference number is available on the EOB.`,
        blockG: ["Confirm payment details", "Send EOB"], blockI_recap: `Claim ${claimId} paid $2,840 on 02/10. Member owes $460.`,
      },
      ui_actions: [{ label: `Copy Claim # ${claimId}`, type: "copy" }, { label: "Send EOB", type: "send" }],
      outputs: [{ label: "Claim", value: claimId }, { label: "Status", value: "Paid" }, { label: "Amount", value: "$2,840" }, { label: "Member Resp.", value: "$460" }],
    },
    {
      ending_id: "clm-denied", label: "Denied — Appeal Path Available", disposition: "Resolved",
      handoff_required: false, deflection_score: 60, weight: 20,
      agent_script_patch: {
        blockF: `Claim ${claimId} was denied. Reason: service not covered under plan terms (exclusion code EX-204). You have the right to appeal. Standard appeal: 30 days. Expedited: 72 hours.`,
        blockG: ["Explain denial reason", "Start appeal", "Provide appeal instructions"], blockI_recap: `Claim denied — exclusion. Appeal available. Ref: ${appealRef}.`,
      },
      ui_actions: [{ label: "Start Appeal", type: "appeal" }, { label: `Copy Appeal Ref ${appealRef}`, type: "copy" }],
      outputs: [{ label: "Claim", value: claimId }, { label: "Status", value: "Denied" }, { label: "Code", value: "EX-204" }, { label: "Appeal Ref", value: appealRef }],
    },
    {
      ending_id: "clm-pending", label: "Pending — Additional Info Needed", disposition: "Docs Requested",
      handoff_required: false, deflection_score: 70, weight: 15,
      agent_script_patch: {
        blockF: `Claim ${claimId} is pended awaiting additional information. We need: operative notes and itemized billing. Submit via fax to 800-555-0199 within 30 days.`,
        blockG: ["Generate doc checklist", "Send submission instructions"], blockI_recap: `Claim pended. Docs needed within 30 days. Ref: ${claimId}.`,
      },
      ui_actions: [{ label: "Generate Doc Checklist", type: "generate" }, { label: "Send Instructions", type: "send" }],
      outputs: [{ label: "Claim", value: claimId }, { label: "Status", value: "Pended" }, { label: "Docs Needed", value: "Op notes, itemized bill" }, { label: "Deadline", value: "30 days" }],
    },
    {
      ending_id: "clm-returned", label: "Returned for Correction", disposition: "Resolved",
      handoff_required: false, deflection_score: 75, weight: 10,
      agent_script_patch: {
        blockF: `Claim ${claimId} was returned to the provider. Reason: invalid modifier (modifier 59 not supported with this CPT). Corrected claim can be resubmitted.`,
        blockG: ["Explain correction needed", "Provide resubmission instructions"], blockI_recap: `Claim returned — invalid modifier. Resubmit with corrected coding.`,
      },
      ui_actions: [{ label: "Correction Details", type: "resolve" }],
      outputs: [{ label: "Claim", value: claimId }, { label: "Status", value: "Returned" }, { label: "Issue", value: "Invalid modifier 59" }],
    },
    {
      ending_id: "clm-duplicate", label: "Duplicate Claim", disposition: "Resolved",
      handoff_required: false, deflection_score: 90, weight: 10,
      agent_script_patch: {
        blockF: `Claim ${claimId} was identified as a duplicate of a previously processed claim. The original claim was paid on January 28th. No additional action is needed.`,
        blockG: ["Explain duplicate", "Provide original claim details"], blockI_recap: `Duplicate claim. Original processed and paid 01/28.`,
      },
      ui_actions: [{ label: "Show Original Claim", type: "resolve" }],
      outputs: [{ label: "Claim", value: claimId }, { label: "Status", value: "Duplicate" }, { label: "Original Paid", value: "01/28/2026" }],
    },
    {
      ending_id: "clm-overpayment", label: "Overpayment / Recoupment", disposition: "Resolved",
      handoff_required: false, deflection_score: 50, weight: 8,
      agent_script_patch: {
        blockF: `An overpayment of $340 has been identified on claim ${claimId}. A recoupment notice was sent on February 1st. You can dispute within 45 days by submitting a written dispute with supporting documentation.`,
        blockG: ["Explain recoupment", "Provide dispute steps"], blockI_recap: `Overpayment of $340. Dispute window: 45 days from 02/01.`,
      },
      ui_actions: [{ label: "Dispute Steps", type: "resolve" }],
      outputs: [{ label: "Claim", value: claimId }, { label: "Status", value: "Overpayment" }, { label: "Amount", value: "$340" }, { label: "Dispute By", value: "03/18/2026" }],
    },
    {
      ending_id: "clm-research", label: "Escalated to Claims Research", disposition: "Escalated",
      handoff_required: false, deflection_score: 35, weight: 7,
      agent_script_patch: {
        blockF: `This claim requires specialized research. I've created ticket ${ticketNum} with the claims research team. You'll receive an update within 5 business days.`,
        blockG: ["Create research ticket", "Set SLA"], blockI_recap: `Escalated to claims research. Ticket: ${ticketNum}. Update in 5 business days.`,
      },
      ui_actions: [{ label: `Copy Ticket # ${ticketNum}`, type: "copy" }, { label: "Set Follow-up", type: "resolve" }],
      outputs: [{ label: "Ticket", value: ticketNum }, { label: "Status", value: "Research" }, { label: "SLA", value: "5 business days" }],
    },
  ];
}

// ── Denials & Appeals Endings ──

function denialsAppealsEndings(): ResolutionEnding[] {
  const appealRef = generateAppealRef();
  const ticketNum = generateTicketNumber();

  return [
    {
      ending_id: "appeal-initiated", label: "Appeal Initiated", disposition: "Resolved",
      handoff_required: false, deflection_score: 80, weight: 30,
      agent_script_patch: {
        blockF: `Your appeal has been initiated. Appeal reference: ${appealRef}. Standard review: up to 30 days. We'll send written confirmation to the address on file.`,
        blockG: ["Confirm appeal filed", "Send confirmation"], blockI_recap: `Appeal ${appealRef} initiated. Decision within 30 days.`,
      },
      ui_actions: [{ label: `Copy Appeal Ref ${appealRef}`, type: "copy" }],
      outputs: [{ label: "Appeal Ref", value: appealRef }, { label: "Status", value: "Initiated" }, { label: "Timeline", value: "30 days" }],
    },
    {
      ending_id: "appeal-expedited", label: "Appeal Expedited", disposition: "Escalated",
      handoff_required: false, deflection_score: 55, weight: 15,
      agent_script_patch: {
        blockF: `Due to clinical urgency, an expedited appeal has been filed. Reference: ${appealRef}. Decision within 72 hours. Ticket: ${ticketNum}.`,
        blockG: ["Confirm expedited filing", "Set urgent SLA"], blockI_recap: `Expedited appeal ${appealRef}. Decision within 72 hrs.`,
      },
      ui_actions: [{ label: `Copy Appeal Ref ${appealRef}`, type: "copy" }, { label: `Copy Ticket ${ticketNum}`, type: "copy" }],
      outputs: [{ label: "Appeal Ref", value: appealRef }, { label: "Status", value: "Expedited" }, { label: "SLA", value: "72 hours" }],
    },
    {
      ending_id: "reconsideration", label: "Reconsideration Eligible", disposition: "Resolved",
      handoff_required: false, deflection_score: 75, weight: 15,
      agent_script_patch: {
        blockF: "This denial is eligible for an informal reconsideration before a formal appeal. If the provider submits updated clinical notes, we can re-review within 10 business days without initiating the formal appeal process.",
        blockG: ["Explain reconsideration", "Send instructions"], blockI_recap: "Reconsideration available. Submit updated notes for re-review in 10 days.",
      },
      ui_actions: [{ label: "Send Reconsideration Info", type: "send" }],
      outputs: [{ label: "Status", value: "Reconsideration Eligible" }, { label: "Timeline", value: "10 business days" }],
    },
    {
      ending_id: "not-appealable", label: "Not Appealable — Grievance Path", disposition: "Resolved",
      handoff_required: false, deflection_score: 65, weight: 10,
      agent_script_patch: {
        blockF: "This type of determination is not eligible for a formal appeal. However, you can file a grievance. I can explain the grievance process and provide the submission form.",
        blockG: ["Explain grievance process", "Send grievance form"], blockI_recap: "Not appealable. Grievance process explained and form sent.",
      },
      ui_actions: [{ label: "Send Grievance Form", type: "send" }],
      outputs: [{ label: "Status", value: "Not Appealable" }, { label: "Alternative", value: "Grievance Process" }],
    },
    {
      ending_id: "appeal-missing-evidence", label: "Missing Evidence — Checklist Sent", disposition: "Docs Requested",
      handoff_required: false, deflection_score: 70, weight: 20,
      agent_script_patch: {
        blockF: "To strengthen the appeal, we need additional evidence. I'm sending a checklist of recommended supporting documents: clinical notes, lab results, peer-reviewed literature, and a physician attestation.",
        blockG: ["Generate evidence checklist", "Send to provider"], blockI_recap: "Evidence checklist sent. Submit within appeal deadline.",
      },
      ui_actions: [{ label: "Generate Evidence Checklist", type: "generate" }],
      outputs: [{ label: "Status", value: "Evidence Needed" }, { label: "Docs", value: "Clinical notes, labs, literature, attestation" }],
    },
    {
      ending_id: "appeal-supervisor", label: "Supervisor Escalation", disposition: "Warm Transfer",
      handoff_required: true, deflection_score: 20, weight: 10,
      agent_script_patch: {
        blockF: "I understand the urgency. Let me connect you with a supervisor who can review this denial with you in real time and discuss all available options.",
        blockG: ["Generate transfer packet", "Warm transfer to supervisor"],
        blockH_target: "Denials Supervisor", blockH_summary: "Caller requesting supervisor review of denial — escalated from appeals intake",
        blockI_recap: "Transferred to supervisor for denial review.",
      },
      ui_actions: [{ label: "Warm Transfer", type: "transfer" }],
      outputs: [{ label: "Status", value: "Supervisor Escalation" }],
    },
  ];
}

// ── Document Intake Endings ──

function docIntakeEndings(): ResolutionEnding[] {
  const caseRef = generateCaseRef();

  return [
    {
      ending_id: "doc-accepted", label: "Document Accepted & Indexed", disposition: "Resolved",
      handoff_required: false, deflection_score: 95, weight: 35,
      agent_script_patch: {
        blockF: `Your document has been received, processed through OCR, and indexed to the correct case. Reference: ${caseRef}. Processing is complete.`,
        blockG: ["Confirm receipt", "Copy reference"], blockI_recap: `Document accepted. Ref: ${caseRef}. No further action needed.`,
      },
      ui_actions: [{ label: `Copy Ref # ${caseRef}`, type: "copy" }],
      outputs: [{ label: "Ref #", value: caseRef }, { label: "Status", value: "Accepted & Indexed" }],
    },
    {
      ending_id: "doc-rejected", label: "Document Rejected", disposition: "Resolved",
      handoff_required: false, deflection_score: 75, weight: 15,
      agent_script_patch: {
        blockF: "The submitted document was rejected. Reason: incorrect document type submitted (received lab results instead of operative notes). Please resubmit the correct document.",
        blockG: ["Explain rejection", "Provide resubmit instructions"], blockI_recap: "Document rejected — wrong type. Resubmit operative notes.",
      },
      ui_actions: [{ label: "Resubmit Instructions", type: "send" }],
      outputs: [{ label: "Status", value: "Rejected" }, { label: "Reason", value: "Wrong document type" }],
    },
    {
      ending_id: "doc-missing-pages", label: "Missing Pages / Signature", disposition: "Docs Requested",
      handoff_required: false, deflection_score: 70, weight: 20,
      agent_script_patch: {
        blockF: "The document was received but is incomplete. Pages 3 and 4 are missing, and the physician signature is not present on the attestation page. Please resubmit the complete document.",
        blockG: ["Specify missing items", "Send resubmit instructions"], blockI_recap: "Incomplete submission. Missing pages 3–4 and signature.",
      },
      ui_actions: [{ label: "Send Missing Items List", type: "send" }],
      outputs: [{ label: "Status", value: "Incomplete" }, { label: "Missing", value: "Pages 3-4, signature" }],
    },
    {
      ending_id: "doc-illegible", label: "Illegible — Better Copy Needed", disposition: "Docs Requested",
      handoff_required: false, deflection_score: 65, weight: 10,
      agent_script_patch: {
        blockF: "The submitted document is illegible. OCR was unable to process the text. Please resubmit a clearer copy — ideally a direct print rather than a fax-of-a-fax.",
        blockG: ["Request clearer copy", "Explain OCR requirements"], blockI_recap: "Document illegible. Clearer copy needed.",
      },
      ui_actions: [{ label: "Send Resubmit Instructions", type: "send" }],
      outputs: [{ label: "Status", value: "Illegible" }, { label: "Action", value: "Resubmit clearer copy" }],
    },
    {
      ending_id: "doc-nurse-review", label: "Routed to Nurse Reviewer", disposition: "Resolved",
      handoff_required: false, deflection_score: 60, weight: 15,
      agent_script_patch: {
        blockF: `The document has been received and routed to a nurse reviewer for clinical assessment. Reference: ${caseRef}. Expected review time: 3–5 business days.`,
        blockG: ["Confirm routing", "Set review SLA"], blockI_recap: `Document routed to nurse review. Ref: ${caseRef}. 3–5 day SLA.`,
      },
      ui_actions: [{ label: `Copy Ref # ${caseRef}`, type: "copy" }],
      outputs: [{ label: "Ref #", value: caseRef }, { label: "Status", value: "Nurse Review" }, { label: "SLA", value: "3–5 days" }],
    },
    {
      ending_id: "doc-siu", label: "Routed to SIU / FWA Queue", disposition: "Escalated",
      handoff_required: false, deflection_score: 30, weight: 5,
      agent_script_patch: {
        blockF: "This document has been flagged for special investigation review. I'm unable to provide additional details at this time. A representative will contact the submitter if additional information is needed.",
        blockG: ["Confirm receipt only", "No further details"], blockI_recap: "Document received. Routed to special review. No additional info available.",
      },
      ui_actions: [],
      outputs: [{ label: "Status", value: "Special Investigation Review" }],
    },
  ];
}

// ── Ending Registry ──

const ENDING_REGISTRY: Record<string, () => ResolutionEnding[]> = {
  "prior-auth": priorAuthEndings,
  "eligibility-coverage": eligibilityEndings,
  "claims-status": claimsStatusEndings,
  "evidence-upload": docIntakeEndings,
  "plain-language": eligibilityEndings,       // shares eligibility pattern
  "multilingual": eligibilityEndings,
  "accessibility": eligibilityEndings,
};

export function getEndingsForUseCase(useCaseId: string): ResolutionEnding[] {
  const factory = ENDING_REGISTRY[useCaseId];
  if (factory) return factory();
  // For denials-related use cases
  if (useCaseId.includes("appeal") || useCaseId.includes("denial")) return denialsAppealsEndings();
  if (useCaseId.includes("doc") || useCaseId.includes("evidence")) return docIntakeEndings();
  // Fallback: eligibility endings (generic resolved patterns)
  return eligibilityEndings();
}

// ── Selection Engine ──

export function selectEnding(
  endings: ResolutionEnding[],
  deflectionBias: DeflectionBias = "medium"
): ResolutionEnding {
  // Apply bias multiplier
  const biasMultiplier: Record<DeflectionBias, (score: number) => number> = {
    low: (s) => s < 50 ? 1.5 : 0.7,
    medium: () => 1,
    high: (s) => s >= 70 ? 1.8 : 0.5,
  };

  const adjusted = endings.map(e => ({
    ending: e,
    adjustedWeight: e.weight * biasMultiplier[deflectionBias](e.deflection_score),
  }));

  const totalWeight = adjusted.reduce((sum, a) => sum + a.adjustedWeight, 0);
  let r = Math.random() * totalWeight;

  for (const a of adjusted) {
    r -= a.adjustedWeight;
    if (r <= 0) return a.ending;
  }
  return endings[0];
}

// ── Script Patch Applicator ──

export function patchScriptBlocks(
  originalBlocks: import("./scriptEngine").ScriptBlock[],
  ending: ResolutionEnding
): import("./scriptEngine").ScriptBlock[] {
  return originalBlocks.map(block => {
    switch (block.blockId) {
      case "F":
        return { ...block, agentSay: ending.agent_script_patch.blockF };
      case "G":
        return {
          ...block,
          agentSay: "Based on what I've found, here's what happens next…",
          actions: ending.agent_script_patch.blockG.map(label => ({
            label,
            type: "resolve" as const,
          })),
        };
      case "H":
        if (ending.agent_script_patch.blockH_target) {
          return {
            ...block,
            agentSay: `I'm going to connect you with our ${ending.agent_script_patch.blockH_target} who can assist further. Let me transfer all our call context so you won't need to repeat anything.`,
          };
        }
        return block;
      case "I":
        return {
          ...block,
          agentSay: `Before we end, let me confirm: ${ending.agent_script_patch.blockI_recap} Your reference number is [REF]. Is there anything else I can help with today?`,
        };
      default:
        return block;
    }
  });
}
