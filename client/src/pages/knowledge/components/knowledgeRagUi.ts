import i18n from "@/i18n";
import type { RagJobSummary } from "@/api/knowledge";

export function formatStatus(status: string): string {
  switch (status) {
    case "enabled":
      return i18n.t("ragUi.statusEnabled", { ns: "knowledge" });
    case "disabled":
      return i18n.t("ragUi.statusDisabled", { ns: "knowledge" });
    case "archived":
      return i18n.t("ragUi.statusArchived", { ns: "knowledge" });
    case "idle":
      return i18n.t("ragUi.statusIdle", { ns: "knowledge" });
    case "queued":
      return i18n.t("ragUi.statusQueued", { ns: "knowledge" });
    case "running":
      return i18n.t("ragUi.statusRunning", { ns: "knowledge" });
    case "succeeded":
      return i18n.t("ragUi.statusSucceeded", { ns: "knowledge" });
    case "failed":
      return i18n.t("ragUi.statusFailed", { ns: "knowledge" });
    default:
      return status;
  }
}

export function getRagJobProgressPercent(job: RagJobSummary): number {
  const raw = job.progress?.percent ?? (job.status === "succeeded" ? 1 : 0);
  return Math.max(0, Math.min(100, Math.round(raw * 100)));
}

export function getRagJobProgressWidth(job: RagJobSummary): string {
  const percent = getRagJobProgressPercent(job);
  if (job.status === "queued" || job.status === "running") {
    return `${Math.max(percent, 6)}%`;
  }
  return `${percent}%`;
}

export function formatRagJobMeta(job: RagJobSummary): string {
  const parts = [
    job.jobType,
    i18n.t("ragUi.metaAttempts", { ns: "knowledge", attempts: job.attempts, maxAttempts: job.maxAttempts }),
  ];
  if (job.progress?.current !== undefined && job.progress?.total !== undefined && job.progress.total > 0) {
    parts.push(`${job.progress.current}/${job.progress.total}`);
  }
  if (job.progress?.chunks) {
    parts.push(i18n.t("ragUi.metaChunks", { ns: "knowledge", chunks: job.progress.chunks }));
  }
  if (job.progress?.documents) {
    parts.push(i18n.t("ragUi.metaDocuments", { ns: "knowledge", documents: job.progress.documents }));
  }
  return parts.join(" | ");
}
