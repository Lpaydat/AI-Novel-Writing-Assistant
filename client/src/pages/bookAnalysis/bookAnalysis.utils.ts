import i18n from "@/i18n";
import type { BookAnalysisDetail, BookAnalysisSection, BookAnalysisStatus } from "@ai-novel/shared/types/bookAnalysis";
import type { SectionDraft } from "./bookAnalysis.types";

export function formatStatus(status: BookAnalysisStatus | BookAnalysisSection["status"]): string {
  switch (status) {
    case "draft":
      return i18n.t("status.draft", { ns: "bookAnalysis" });
    case "queued":
      return i18n.t("status.queued", { ns: "bookAnalysis" });
    case "running":
      return i18n.t("status.running", { ns: "bookAnalysis" });
    case "succeeded":
      return i18n.t("status.succeeded", { ns: "bookAnalysis" });
    case "failed":
      return i18n.t("status.failed", { ns: "bookAnalysis" });
    case "archived":
      return i18n.t("status.archived", { ns: "bookAnalysis" });
    case "idle":
      return i18n.t("status.idle", { ns: "bookAnalysis" });
    default:
      return status;
  }
}

export function formatStage(stage?: string | null): string {
  switch (stage) {
    case "loading_cache":
      return i18n.t("stage.loadingCache", { ns: "bookAnalysis" });
    case "preparing_notes":
      return i18n.t("stage.preparingNotes", { ns: "bookAnalysis" });
    case "generating_overview":
      return i18n.t("stage.generatingOverview", { ns: "bookAnalysis" });
    case "generating_sections":
      return i18n.t("stage.generatingSections", { ns: "bookAnalysis" });
    default:
      return stage?.trim() || i18n.t("common.none", { ns: "bookAnalysis" });
  }
}

export function formatDate(value?: string | null): string {
  if (!value) {
    return i18n.t("common.none", { ns: "bookAnalysis" });
  }
  return new Date(value).toLocaleString();
}

export function syncDrafts(detail: BookAnalysisDetail): Record<string, SectionDraft> {
  return Object.fromEntries(
    detail.sections.map((section) => [
      section.id,
      {
        editedContent: section.editedContent ?? section.aiContent ?? "",
        notes: section.notes ?? "",
        focusInstruction: section.focusInstruction ?? "",
        frozen: section.frozen,
        optimizeInstruction: "",
        optimizePreview: "",
      },
    ]),
  );
}

export function createDownload(blob: Blob, fileName: string): void {
  const url = URL.createObjectURL(blob);
  const anchor = document.createElement("a");
  anchor.href = url;
  anchor.download = fileName;
  document.body.appendChild(anchor);
  anchor.click();
  anchor.remove();
  URL.revokeObjectURL(url);
}

export function buildSectionDraft(section: BookAnalysisSection): SectionDraft {
  return {
    editedContent: section.editedContent ?? section.aiContent ?? "",
    notes: section.notes ?? "",
    focusInstruction: section.focusInstruction ?? "",
    frozen: section.frozen,
    optimizeInstruction: "",
    optimizePreview: "",
  };
}
