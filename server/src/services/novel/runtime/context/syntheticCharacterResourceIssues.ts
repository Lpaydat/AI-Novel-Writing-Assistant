import type { GenerationContextPackage } from "@ai-novel/shared/types/chapterRuntime";
import { serverT, type Locale } from "../../../../i18n/serverMessages";

export function buildSyntheticCharacterResourceIssues(
  context: GenerationContextPackage["characterResourceContext"],
  input: {
    novelId: string;
    chapterId: string;
    locale?: Locale;
  },
): GenerationContextPackage["openAuditIssues"] {
  const locale: Locale = input.locale ?? "zh";
  if (!context) {
    return [];
  }
  const now = new Date().toISOString();
  const blockedIssues = context.blockedItems.slice(0, 4).map((item) => ({
    id: `character-resource:${item.id}:blocked`,
    reportId: `character-resource:${input.novelId}:${input.chapterId}`,
    auditType: "continuity" as const,
    severity: item.status === "destroyed" || item.status === "lost" ? "high" as const : "medium" as const,
    code: "character_resource_unavailable",
    description: serverT("chapter.guidance.resourceBlocked", locale, { name: item.name, status: item.status }),
    evidence: item.evidence[0]?.summary ?? item.summary,
    fixSuggestion: serverT("chapter.guidance.resourceBlockedFix", locale, { name: item.name }),
    status: "open" as const,
    createdAt: now,
    updatedAt: now,
  }));
  const highRiskIssues = context.highRiskCommittedItems.slice(0, 3).map((item) => ({
    id: `character-resource:${item.id}:high-risk-committed`,
    reportId: `character-resource:${input.novelId}:${input.chapterId}`,
    auditType: "continuity" as const,
    severity: "medium" as const,
    code: "character_resource_high_risk_committed",
    description: serverT("chapter.guidance.resourceHighRiskCommitted", locale, { name: item.name }),
    evidence: item.evidence[0]?.summary ?? item.summary,
    fixSuggestion: serverT("chapter.guidance.resourceHighRiskCommittedFix", locale, { name: item.name }),
    status: "open" as const,
    createdAt: now,
    updatedAt: now,
  }));
  const pendingProposalIssues = context.pendingProposalItems.slice(0, 3).map((proposal) => ({
    id: `character-resource-proposal:${proposal.id}:pending-review`,
    reportId: `character-resource:${input.novelId}:${input.chapterId}`,
    auditType: "continuity" as const,
    severity: proposal.riskLevel === "high" ? "high" as const : "medium" as const,
    code: "character_resource_pending_proposal",
    description: serverT("chapter.guidance.resourcePendingProposal", locale, { summary: proposal.summary }),
    evidence: proposal.evidence[0] ?? proposal.summary,
    fixSuggestion: serverT("chapter.guidance.resourcePendingProposalFix", locale),
    status: "open" as const,
    createdAt: now,
    updatedAt: now,
  }));
  const signalIssues = context.riskSignals
    .filter((signal) => signal.severity === "high" || signal.severity === "critical")
    .slice(0, 3)
    .map((signal, index) => ({
      id: `character-resource:signal:${index}:${signal.code}`,
      reportId: `character-resource:${input.novelId}:${input.chapterId}`,
      auditType: "continuity" as const,
      severity: signal.severity,
      code: signal.code || "character_resource_risk",
      description: signal.summary,
      evidence: signal.summary,
      fixSuggestion: serverT("chapter.guidance.signalFix", locale),
      status: "open" as const,
      createdAt: now,
      updatedAt: now,
    }));
  return [...blockedIssues, ...highRiskIssues, ...pendingProposalIssues, ...signalIssues];
}
