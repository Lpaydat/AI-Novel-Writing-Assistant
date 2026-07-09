import type { WorldConsistencyIssue, WorldConsistencyReport } from "@ai-novel/shared/types/world";
import i18n from "@/i18n";

// Maps issue codes / world fields to i18n keys (namespace `worlds`). Values are
// resolved with `i18n.t(...)` at each call site so they follow the active locale.
const ISSUE_CODE_KEYS: Record<string, string> = {
  THEMATIC_INCOHERENCE: "consistency.issueTitle.THEMATIC_INCOHERENCE",
  REDUNDANT_AXIOM_APPLICATION: "consistency.issueTitle.REDUNDANT_AXIOM_APPLICATION",
  AXIOM_VIOLATION: "consistency.issueTitle.AXIOM_VIOLATION",
  GENRE_MISMATCH: "consistency.issueTitle.GENRE_MISMATCH",
  AXIOM_MAGIC_CONFLICT: "consistency.issueTitle.AXIOM_MAGIC_CONFLICT",
  TECH_ERA_MISMATCH: "consistency.issueTitle.TECH_ERA_MISMATCH",
  CONFLICT_WEAK: "consistency.issueTitle.CONFLICT_WEAK",
  BASELINE_PASS: "consistency.issueTitle.BASELINE_PASS",
};

const ISSUE_MESSAGE_KEYS: Record<string, string> = {
  THEMATIC_INCOHERENCE: "consistency.issueMessage.THEMATIC_INCOHERENCE",
  REDUNDANT_AXIOM_APPLICATION: "consistency.issueMessage.REDUNDANT_AXIOM_APPLICATION",
  AXIOM_VIOLATION: "consistency.issueMessage.AXIOM_VIOLATION",
  GENRE_MISMATCH: "consistency.issueMessage.GENRE_MISMATCH",
  AXIOM_MAGIC_CONFLICT: "consistency.issueMessage.AXIOM_MAGIC_CONFLICT",
  TECH_ERA_MISMATCH: "consistency.issueMessage.TECH_ERA_MISMATCH",
  CONFLICT_WEAK: "consistency.issueMessage.CONFLICT_WEAK",
  BASELINE_PASS: "consistency.issueMessage.BASELINE_PASS",
};

const ISSUE_DETAIL_KEYS: Record<string, string> = {
  THEMATIC_INCOHERENCE: "consistency.issueDetail.THEMATIC_INCOHERENCE",
  REDUNDANT_AXIOM_APPLICATION: "consistency.issueDetail.REDUNDANT_AXIOM_APPLICATION",
  AXIOM_VIOLATION: "consistency.issueDetail.AXIOM_VIOLATION",
  GENRE_MISMATCH: "consistency.issueDetail.GENRE_MISMATCH",
  AXIOM_MAGIC_CONFLICT: "consistency.issueDetail.AXIOM_MAGIC_CONFLICT",
  TECH_ERA_MISMATCH: "consistency.issueDetail.TECH_ERA_MISMATCH",
  CONFLICT_WEAK: "consistency.issueDetail.CONFLICT_WEAK",
};

const FIELD_LABEL_KEYS: Record<string, string> = {
  description: "consistency.fieldLabel.description",
  background: "consistency.fieldLabel.background",
  geography: "consistency.fieldLabel.geography",
  cultures: "consistency.fieldLabel.cultures",
  magicSystem: "consistency.fieldLabel.magicSystem",
  politics: "consistency.fieldLabel.politics",
  races: "consistency.fieldLabel.races",
  religions: "consistency.fieldLabel.religions",
  technology: "consistency.fieldLabel.technology",
  conflicts: "consistency.fieldLabel.conflicts",
  history: "consistency.fieldLabel.history",
  economy: "consistency.fieldLabel.economy",
  factions: "consistency.fieldLabel.factions",
};

function hasChinese(text: string): boolean {
  return /[\u4E00-\u9FFF]/.test(text);
}

function localizeSummary(summary: string, status: WorldConsistencyReport["status"], issues: WorldConsistencyIssue[]): string {
  if (hasChinese(summary)) {
    return summary;
  }
  if (/Consistency check passed/i.test(summary)) {
    return i18n.t("consistency.summary.passed", { ns: "worlds" });
  }
  const errorCount = issues.filter((item) => item.severity === "error").length;
  const warnCount = issues.filter((item) => item.severity === "warn").length;
  if (status === "error") {
    return i18n.t("consistency.summary.error", { errorCount, warnCount, ns: "worlds" });
  }
  if (status === "warn") {
    return i18n.t("consistency.summary.warn", { warnCount, ns: "worlds" });
  }
  return i18n.t("consistency.summary.done", { ns: "worlds" });
}

export function parseConsistencyReport(raw: string | null | undefined, issues: WorldConsistencyIssue[]): WorldConsistencyReport | null {
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as Partial<WorldConsistencyReport>;
    if (!parsed || typeof parsed !== "object") {
      return null;
    }
    const status = parsed.status === "error" || parsed.status === "warn" || parsed.status === "pass"
      ? parsed.status
      : "pass";
    return {
      worldId: typeof parsed.worldId === "string" ? parsed.worldId : "",
      score: typeof parsed.score === "number" ? parsed.score : 0,
      summary: localizeSummary(typeof parsed.summary === "string" ? parsed.summary : "", status, issues),
      status,
      generatedAt: typeof parsed.generatedAt === "string" ? parsed.generatedAt : undefined,
      issues,
    };
  } catch {
    return null;
  }
}

export function localizeConsistencySeverity(severity: WorldConsistencyIssue["severity"]): string {
  switch (severity) {
    case "error":
      return i18n.t("consistency.severity.error", { ns: "worlds" });
    case "warn":
      return i18n.t("consistency.severity.warn", { ns: "worlds" });
    case "pass":
      return i18n.t("consistency.severity.pass", { ns: "worlds" });
    default:
      return severity;
  }
}

export function localizeConsistencyStatus(status: WorldConsistencyIssue["status"] | WorldConsistencyReport["status"]): string {
  switch (status) {
    case "open":
      return i18n.t("consistency.status.open", { ns: "worlds" });
    case "resolved":
      return i18n.t("consistency.status.resolved", { ns: "worlds" });
    case "ignored":
      return i18n.t("consistency.status.ignored", { ns: "worlds" });
    case "error":
      return i18n.t("consistency.status.error", { ns: "worlds" });
    case "warn":
      return i18n.t("consistency.status.warn", { ns: "worlds" });
    case "pass":
      return i18n.t("consistency.status.pass", { ns: "worlds" });
    default:
      return status;
  }
}

export function localizeConsistencySource(source: WorldConsistencyIssue["source"]): string {
  return source === "llm"
    ? i18n.t("consistency.source.llm", { ns: "worlds" })
    : i18n.t("consistency.source.rule", { ns: "worlds" });
}

export function localizeConsistencyField(targetField?: string | null): string {
  if (!targetField) {
    return i18n.t("consistency.field.unspecified", { ns: "worlds" });
  }
  return FIELD_LABEL_KEYS[targetField]
    ? i18n.t(FIELD_LABEL_KEYS[targetField], { ns: "worlds" })
    : targetField;
}

export function localizeConsistencyIssueTitle(code: string): string {
  return ISSUE_CODE_KEYS[code] ? i18n.t(ISSUE_CODE_KEYS[code], { ns: "worlds" }) : code;
}

export function localizeConsistencyIssueMessage(issue: WorldConsistencyIssue): string {
  if (hasChinese(issue.message)) {
    return issue.message;
  }
  return ISSUE_MESSAGE_KEYS[issue.code]
    ? i18n.t(ISSUE_MESSAGE_KEYS[issue.code], { ns: "worlds" })
    : i18n.t("consistency.issueMessage.fallback", {
      field: localizeConsistencyField(issue.targetField),
      ns: "worlds",
    });
}

export function localizeConsistencyIssueDetail(issue: WorldConsistencyIssue): string | null {
  if (issue.detail && hasChinese(issue.detail)) {
    return issue.detail;
  }
  if (ISSUE_DETAIL_KEYS[issue.code]) {
    return i18n.t(ISSUE_DETAIL_KEYS[issue.code], { ns: "worlds" });
  }
  if (issue.detail) {
    return i18n.t("consistency.issueDetail.fallback", {
      field: localizeConsistencyField(issue.targetField),
      ns: "worlds",
    });
  }
  return null;
}
