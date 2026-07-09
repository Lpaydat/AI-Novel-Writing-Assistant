import { RefreshCw } from "lucide-react";
import { useTranslation } from "react-i18next";
import type { CharacterResourceLedgerItem } from "@ai-novel/shared/types/characterResource";
import type { ChapterExecutionInsightsSidebarProps } from "./chapterInsights.types";
import { getTimelineCheckLabel } from "./TimelinePanel";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

function ResourceGroup(props: {
  title: string;
  items: CharacterResourceLedgerItem[];
  emptyText: string;
}) {
  const { title, items, emptyText } = props;
  return (
    <div className="rounded-lg border border-border/70 bg-background p-3">
      <div className="text-xs font-medium text-muted-foreground">{title}</div>
      {items.length > 0 ? (
        <div className="mt-2 space-y-2">
          {items.slice(0, 4).map((item) => (
            <div key={item.id} className="rounded-md border border-border/60 bg-muted/15 p-2">
              <div className="flex min-w-0 flex-wrap items-center gap-2">
                <span className="min-w-0 flex-1 text-sm font-medium">{item.name}</span>
                <Badge variant="outline">{item.status}</Badge>
              </div>
              <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">{item.summary}</div>
            </div>
          ))}
        </div>
      ) : (
        <div className="mt-2 text-xs leading-5 text-muted-foreground">{emptyText}</div>
      )}
    </div>
  );
}

export default function ResourceRiskPanel(props: ChapterExecutionInsightsSidebarProps) {
  const { t } = useTranslation("novelsChapterInsights");
  const {
    selectedChapter,
    chapterResourceContext,
    isLoadingChapterResourceContext = false,
    resourceWorkflowMode = "manual",
    pendingCharacterResourceProposals = [],
    onExtractChapterResources,
    isExtractingChapterResources = false,
    onConfirmCharacterResourceProposal,
    onRejectCharacterResourceProposal,
    confirmingCharacterResourceProposalId = "",
    rejectingCharacterResourceProposalId = "",
    chapterRuntimePackage,
  } = props;

  const isAutoDirectorMode = resourceWorkflowMode === "auto_director";
  const modeHint = isAutoDirectorMode ? t("resourceRisk.modeHintAuto") : t("resourceRisk.modeHintManual");
  const openConflicts = chapterRuntimePackage?.context.openConflicts ?? [];
  const blockingIssues = chapterRuntimePackage?.audit.openIssues ?? [];
  const failureSummary = chapterRuntimePackage?.failureClassification?.summary?.trim() ?? "";
  const timelineCheck = chapterRuntimePackage?.timelineCheck ?? null;

  return (
    <div className="space-y-3">
      <div className="rounded-xl border border-border/70 bg-background p-3">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-xs font-medium text-muted-foreground">{t("common.resourcesAndRisks")}</div>
            <div className="mt-1 text-sm font-medium text-foreground">{t("resourceRisk.subtitle")}</div>
            <div className="mt-1 text-xs leading-5 text-muted-foreground">{modeHint}</div>
          </div>
          <div className="flex flex-col items-end gap-2">
            <Badge variant={isAutoDirectorMode ? "secondary" : "outline"}>{isAutoDirectorMode ? t("resourceRisk.badgeAutoSync") : t("resourceRisk.badgeManualReview")}</Badge>
            {pendingCharacterResourceProposals.length > 0 ? <Badge variant="secondary">{pendingCharacterResourceProposals.length}</Badge> : null}
          </div>
        </div>
        {!isAutoDirectorMode ? (
          <Button
            size="sm"
            variant="outline"
            onClick={() => onExtractChapterResources?.()}
            disabled={isExtractingChapterResources || !onExtractChapterResources}
            className="mt-3 w-full justify-center gap-2"
          >
            <RefreshCw className={isExtractingChapterResources ? "h-4 w-4 animate-spin" : "h-4 w-4"} />
            {isExtractingChapterResources ? t("resourceRisk.reviewing") : t("resourceRisk.reviewChapterResources")}
          </Button>
        ) : null}
      </div>

      <div className="grid gap-2 md:grid-cols-2 xl:grid-cols-1">
        <div className="rounded-xl border border-border/70 bg-background p-3">
          <div className="text-xs font-medium text-muted-foreground">{t("resourceRisk.riskSummary")}</div>
          <div className="mt-2 space-y-2 text-xs leading-5 text-muted-foreground">
            <div className="flex items-center justify-between gap-2">
              <span>{t("resourceRisk.failureClassification")}</span>
              <span className="font-medium text-foreground">{failureSummary || t("common.none")}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>{t("resourceRisk.openConflicts")}</span>
              <span className="font-medium text-foreground">{openConflicts.length}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>{t("resourceRisk.blockingIssues")}</span>
              <span className="font-medium text-foreground">{blockingIssues.length}</span>
            </div>
            <div className="flex items-center justify-between gap-2">
              <span>{t("common.timeline")}</span>
              <span className="font-medium text-foreground">{timelineCheck ? getTimelineCheckLabel(timelineCheck.status) : t("common.notChecked")}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border/70 bg-background p-3">
          <div className="text-xs font-medium text-muted-foreground">{t("resourceRisk.currentChapter")}</div>
          <div className="mt-2 text-sm font-medium text-foreground">
            {selectedChapter
              ? t("common.chapterWithTitle", {
                  order: selectedChapter.order,
                  title: selectedChapter.title || t("common.unnamedChapter"),
                })
              : t("common.chapterUnselected")}
          </div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            {chapterResourceContext?.summary ?? t("resourceRisk.contextEmpty")}
          </div>
        </div>
      </div>

      {isLoadingChapterResourceContext ? (
        <div className="rounded-xl border border-dashed border-border/70 bg-muted/10 p-3 text-xs leading-6 text-muted-foreground">
          {t("resourceRisk.loadingBoundaries")}
        </div>
      ) : null}

      <div className="space-y-3">
        <ResourceGroup title={t("resourceRisk.availableResources")} items={chapterResourceContext?.availableItems ?? []} emptyText={t("resourceRisk.availableResourcesEmpty")} />
        <ResourceGroup title={t("resourceRisk.setupNeeded")} items={chapterResourceContext?.setupNeededItems ?? []} emptyText={t("resourceRisk.setupNeededEmpty")} />
        <ResourceGroup title={t("resourceRisk.cannotUseEarly")} items={chapterResourceContext?.blockedItems ?? []} emptyText={t("resourceRisk.cannotUseEarlyEmpty")} />
        <ResourceGroup title={t("resourceRisk.highRiskCommitted")} items={chapterResourceContext?.highRiskCommittedItems ?? []} emptyText={t("resourceRisk.highRiskCommittedEmpty")} />

        {pendingCharacterResourceProposals.length > 0 ? (
          <div className="space-y-2 rounded-lg border border-border/70 bg-muted/10 p-3">
            <div className="text-xs font-medium text-muted-foreground">{t("resourceRisk.changesNeedingReview")}</div>
            {pendingCharacterResourceProposals.slice(0, 2).map((proposal) => (
              <div key={proposal.id} className="space-y-2 rounded-md border border-border/70 bg-background p-2">
                <div className="flex flex-wrap items-start gap-2">
                  <div className="min-w-0 flex-1 text-sm font-medium leading-5">{proposal.summary}</div>
                  <Badge variant="outline">{proposal.sourceType === "chapter_background_sync" ? t("resourceRisk.foundByAutoSync") : t("resourceRisk.foundByManualReview")}</Badge>
                </div>
                {proposal.evidence[0] ? <div className="line-clamp-2 text-[11px] leading-5 text-muted-foreground">{t("resourceRisk.evidence", { evidence: proposal.evidence[0] })}</div> : null}
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => onConfirmCharacterResourceProposal?.(proposal.id)} disabled={confirmingCharacterResourceProposalId === proposal.id}>
                    {confirmingCharacterResourceProposalId === proposal.id ? t("resourceRisk.confirming") : t("resourceRisk.confirm")}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => onRejectCharacterResourceProposal?.(proposal.id)}
                    disabled={rejectingCharacterResourceProposalId === proposal.id}
                  >
                    {rejectingCharacterResourceProposalId === proposal.id ? t("resourceRisk.processing") : t("resourceRisk.ignore")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
