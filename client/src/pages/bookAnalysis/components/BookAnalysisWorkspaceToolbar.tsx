import type { BookAnalysisDetail } from "@ai-novel/shared/types/bookAnalysis";
import { Columns2, Pencil } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatStatus } from "../bookAnalysis.utils";

type ExportFormat = "markdown" | "json";

function formatTokenCount(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0";
  }
  return new Intl.NumberFormat("zh-CN").format(Math.max(0, Math.round(value)));
}

interface ToolbarPendingState {
  copy: boolean;
  rebuild: boolean;
  archive: boolean;
  publish: boolean;
  createStyleProfile: boolean;
  updateBudget: boolean;
  resumeWithBudget: boolean;
}

interface BookAnalysisWorkspaceToolbarProps {
  selectedAnalysis: BookAnalysisDetail;
  selectedNovelId: string;
  dualPaneAvailable: boolean;
  isDualPane: boolean;
  pending: ToolbarPendingState;
  onCopy: () => void;
  onRebuild: (analysisId: string) => void;
  onArchive: (analysisId: string) => void;
  onPublish: () => void;
  onCreateStyleProfile: () => void;
  onDownload: (format: ExportFormat) => void;
  onDualPaneChange: (enabled: boolean) => void;
  onOpenBudgetAdjust: () => void;
  onOpenBudgetResume: () => void;
}

export default function BookAnalysisWorkspaceToolbar(props: BookAnalysisWorkspaceToolbarProps) {
  const {
    selectedAnalysis,
    selectedNovelId,
    dualPaneAvailable,
    isDualPane,
    pending,
    onCopy,
    onRebuild,
    onArchive,
    onPublish,
    onCreateStyleProfile,
    onDownload,
    onDualPaneChange,
    onOpenBudgetAdjust,
    onOpenBudgetResume,
  } = props;
  const { t } = useTranslation("bookAnalysisComponents");

  const budgetTokens = selectedAnalysis.budgetTokens ?? null;
  const usedTokens = selectedAnalysis.usedTokens ?? 0;
  const budgetExceeded = selectedAnalysis.lastError?.includes("budget_exceeded") ?? false;
  const budgetResumeAvailable =
    budgetExceeded && (selectedAnalysis.status === "failed" || selectedAnalysis.status === "cancelled");
  const canAdjustBudget = selectedAnalysis.status !== "archived";

  return (
    <div className="sticky top-0 z-30 rounded-md border bg-background/95 p-3 shadow-sm backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div className="min-w-0 space-y-1">
          <div className="flex flex-wrap items-center gap-2">
            <h2 className="truncate text-lg font-semibold tracking-normal">{selectedAnalysis.title}</h2>
            <Badge variant="outline">{formatStatus(selectedAnalysis.status)}</Badge>
            {selectedAnalysis.publishedDocumentId ? <Badge variant="secondary">{t("toolbar.published")}</Badge> : null}
            {selectedAnalysis.sourceRange ? <Badge variant="secondary">{selectedAnalysis.sourceRange.label ?? t("toolbar.selectedChapters")}</Badge> : null}
            <Badge variant="outline">{t("toolbar.progress", { percent: Math.round(selectedAnalysis.progress * 100) })}</Badge>
            <span className="inline-flex items-center gap-1">
              <Badge variant={budgetExceeded ? "destructive" : "outline"}>
                {budgetTokens
                  ? t("toolbar.budgetWithLimit", { used: formatTokenCount(usedTokens), limit: formatTokenCount(budgetTokens) })
                  : t("toolbar.budgetUnlimited", { used: formatTokenCount(usedTokens) })}
              </Badge>
              {canAdjustBudget ? (
                <Button
                  type="button"
                  size="icon"
                  variant="ghost"
                  className="h-6 w-6"
                  title={t("toolbar.adjustBudgetTitle")}
                  onClick={onOpenBudgetAdjust}
                  disabled={pending.updateBudget || pending.resumeWithBudget}
                >
                  <Pencil className="h-3.5 w-3.5" />
                  <span className="sr-only">{t("toolbar.adjustBudgetTitle")}</span>
                </Button>
              ) : null}
            </span>
          </div>
          <div className="text-xs text-muted-foreground">
            {t("toolbar.sourceVersion", { title: selectedAnalysis.documentTitle, version: selectedAnalysis.documentVersionNumber })}
            {selectedAnalysis.sourceRange ? t("toolbar.rangeSuffix", { label: selectedAnalysis.sourceRange.label ?? t("toolbar.selectedChapters") }) : ""}
            {selectedAnalysis.isCurrentVersion ? "" : t("toolbar.currentActiveVersion", { version: selectedAnalysis.currentDocumentVersionNumber })}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button size="sm" variant="outline" onClick={onCopy} disabled={pending.copy}>
            {t("toolbar.copy")}
          </Button>
          {budgetResumeAvailable ? (
            <Button
              size="sm"
              onClick={onOpenBudgetResume}
              disabled={pending.resumeWithBudget || selectedAnalysis.status === "archived"}
            >
              {pending.resumeWithBudget ? t("toolbar.submitting") : t("toolbar.resumeWithBudget")}
            </Button>
          ) : null}
          <Button
            size="sm"
            variant="outline"
            onClick={() => onRebuild(selectedAnalysis.id)}
            disabled={pending.rebuild || selectedAnalysis.status === "archived"}
          >
            {t("toolbar.rebuild")}
          </Button>
          <Button
            size="sm"
            onClick={onPublish}
            disabled={!selectedNovelId || pending.publish || selectedAnalysis.status === "archived"}
            title={!selectedNovelId ? t("toolbar.publishTitleNoNovel") : t("toolbar.publishTitle")}
          >
            {pending.publish ? t("toolbar.publishing") : t("toolbar.publish")}
          </Button>
          <Button asChild size="sm" variant="outline">
            <Link to={`/tasks?kind=book_analysis&id=${selectedAnalysis.id}`}>{t("toolbar.taskCenter")}</Link>
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDownload("markdown")}>
            {t("toolbar.exportMd")}
          </Button>
          <Button size="sm" variant="outline" onClick={() => onDownload("json")}>
            {t("toolbar.exportJson")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={onCreateStyleProfile}
            disabled={pending.createStyleProfile || selectedAnalysis.status === "archived"}
          >
            {pending.createStyleProfile ? t("toolbar.creatingStyle") : t("toolbar.createStyle")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() => onArchive(selectedAnalysis.id)}
            disabled={pending.archive || selectedAnalysis.status === "archived"}
          >
            {t("toolbar.archive")}
          </Button>
          {dualPaneAvailable ? (
            <Button
              type="button"
              size="sm"
              variant={isDualPane ? "default" : "outline"}
              onClick={() => onDualPaneChange(!isDualPane)}
              title={isDualPane ? t("toolbar.dualPaneClose") : t("toolbar.dualPaneOpen")}
            >
              <Columns2 className="mr-1.5 h-3.5 w-3.5" />
              {t("toolbar.dualPane")}
            </Button>
          ) : null}
        </div>
      </div>
    </div>
  );
}
