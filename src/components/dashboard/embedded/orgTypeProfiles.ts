export interface OrgTypeProfile {
  id: string;
  name: string;
  shortName: string;
  description: string;
  icon: string;
  supportedPersonas: string[];
  allowedActions: string[];
  handoffTargets: string[];
  complianceMode: string[];
  toolingIntegrations: string[];
  /** Product line IDs this org type can access; empty = all */
  allowedProductLines: string[];
  authorityModel: "READ_ONLY" | "ASSISTED_SUBMISSION" | "DELEGATED_AUTHORITY";
}

export const ORG_TYPE_PROFILES: OrgTypeProfile[] = [
  {
    id: "payer",
    name: "Payer / Health Plan",
    shortName: "Payer",
    description: "Insurance carrier operating its own call center with full authority over benefits, claims, and clinical decisions.",
    icon: "🏦",
    supportedPersonas: ["Member", "Provider", "Billing Office", "Employer", "Broker"],
    allowedActions: ["status_lookup", "doc_request", "submission", "escalation", "create_case", "schedule_p2p", "approve", "deny", "appeal_intake"],
    handoffTargets: ["UM Nurse", "Claims Supervisor", "Provider Relations", "Employer Services", "SIU"],
    complianceMode: ["HIPAA identity verification", "Call recording disclosure", "PHI minimum necessary"],
    toolingIntegrations: ["CRM", "Core Claims", "UM Platform", "Fax/OCR Queue", "EDI Intake", "Provider Directory"],
    allowedProductLines: [],
    authorityModel: "DELEGATED_AUTHORITY",
  },
  {
    id: "provider",
    name: "Provider / Health System",
    shortName: "Provider",
    description: "Hospital or physician group contacting payers on behalf of patients for authorizations, claims, and referrals.",
    icon: "🏥",
    supportedPersonas: ["Patient", "Provider", "Billing Office"],
    allowedActions: ["status_lookup", "doc_request", "submission", "escalation", "schedule_p2p"],
    handoffTargets: ["UM Nurse", "Claims Supervisor", "Patient Financial Counselor", "Referral Coordinator"],
    complianceMode: ["HIPAA identity verification", "Provider NPI/TIN verification", "Call recording disclosure"],
    toolingIntegrations: ["EHR", "Practice Management", "Fax/OCR Queue", "Revenue Cycle"],
    allowedProductLines: ["commercial", "medicare", "medicaid", "dual-eligible", "workers-comp", "dental", "vision"],
    authorityModel: "ASSISTED_SUBMISSION",
  },
  {
    id: "mso",
    name: "MSO (Management Services Org)",
    shortName: "MSO",
    description: "Manages provider operations including billing, credentialing, prior auth, and care coordination under delegated or assisted authority.",
    icon: "🏗️",
    supportedPersonas: ["Patient", "Provider", "Billing Office"],
    allowedActions: ["status_lookup", "doc_request", "submission", "escalation", "create_case", "schedule_p2p"],
    handoffTargets: ["UM Nurse", "Claims Supervisor", "Provider Relations", "Credentialing", "Care Coordinator"],
    complianceMode: ["HIPAA identity verification", "Delegated authority disclosure", "Call recording disclosure"],
    toolingIntegrations: ["CRM", "Practice Management", "Fax/OCR Queue", "Credentialing System", "Revenue Cycle"],
    allowedProductLines: ["commercial", "medicare", "medicaid", "dual-eligible", "workers-comp"],
    authorityModel: "ASSISTED_SUBMISSION",
  },
  {
    id: "tpa",
    name: "TPA (Third-Party Administrator)",
    shortName: "TPA",
    description: "Administers benefits on behalf of employer plans—handles eligibility, claims, clinical coordination, and stop-loss documentation.",
    icon: "📑",
    supportedPersonas: ["Member", "Provider", "Billing Office", "Employer", "Broker"],
    allowedActions: ["status_lookup", "doc_request", "submission", "escalation", "create_case", "schedule_p2p"],
    handoffTargets: ["UM Nurse", "Claims Supervisor", "Client Plan Liaison", "Employer Services", "Stop-Loss Coordinator"],
    complianceMode: ["HIPAA identity verification", "Administering on behalf of employer plan disclosure", "Call recording disclosure", "Employer group verification"],
    toolingIntegrations: ["CRM", "Claims Platform", "UM Platform", "Fax/OCR Queue", "EDI Intake", "Stop-Loss System"],
    allowedProductLines: ["commercial", "employer-tpa", "group-benefits", "stop-loss", "dental", "vision", "disability", "life"],
    authorityModel: "DELEGATED_AUTHORITY",
  },
  {
    id: "bpo",
    name: "BPO (Contact Center Outsourcer)",
    shortName: "BPO",
    description: "Outsourced contact center with restricted authority—focuses on intake, triage, scripted responses, and warm transfers with context summaries.",
    icon: "🎧",
    supportedPersonas: ["Member", "Provider", "Billing Office"],
    allowedActions: ["status_lookup", "doc_request", "escalation"],
    handoffTargets: ["Client Queue", "UM Team", "Claims Team", "Supervisor", "Warm Transfer"],
    complianceMode: ["HIPAA identity verification", "Limited authority disclosure", "Call recording disclosure", "QA script adherence", "Prohibited phrases check"],
    toolingIntegrations: ["CRM", "Fax/OCR Queue", "QA Scoring"],
    allowedProductLines: ["commercial", "medicare", "medicaid", "dual-eligible", "employer-tpa", "dental", "vision"],
    authorityModel: "READ_ONLY",
  },
  {
    id: "pbm",
    name: "PBM / Benefit Manager",
    shortName: "PBM",
    description: "Pharmacy benefit manager handling formulary, step therapy, prior auth, and clinical pharmacy support.",
    icon: "💊",
    supportedPersonas: ["Member", "Provider", "Pharmacy"],
    allowedActions: ["status_lookup", "doc_request", "submission", "escalation", "schedule_p2p"],
    handoffTargets: ["Clinical Pharmacist", "UM Nurse", "Formulary Exception Team"],
    complianceMode: ["HIPAA identity verification", "Call recording disclosure", "Prescriber verification"],
    toolingIntegrations: ["PBM Platform", "Formulary DB", "Clinical Review Queue", "EDI Intake"],
    allowedProductLines: ["commercial", "medicare", "medicaid", "wc-pbm", "group-benefits"],
    authorityModel: "DELEGATED_AUTHORITY",
  },
];

export const DEFAULT_ORG_TYPE_ID = "payer";

export function getOrgTypeById(id: string): OrgTypeProfile | undefined {
  return ORG_TYPE_PROFILES.find(o => o.id === id);
}

export function getProductLinesForOrgType(orgTypeId: string, allProductLineIds: string[]): string[] {
  const org = getOrgTypeById(orgTypeId);
  if (!org || org.allowedProductLines.length === 0) return allProductLineIds;
  return org.allowedProductLines;
}
