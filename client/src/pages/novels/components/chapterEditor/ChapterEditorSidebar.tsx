import { useTranslation } from "react-i18next";
import type { Chapter, ChapterEditorDiagnosticCard, ChapterEditorWorkspaceResponse } from "@ai-novel/shared/types/novel";
import { Button } from "@/components/ui/button";

interface ChapterEditorSidebarProps {
  chapter: Chapter;
  workspace: ChapterEditorWorkspaceResponse | null;
  workspaceStatus: "loading" | "ready" | "error";
  wordCount: number;
  saveStatusLabel: string;
  isDirty: boolean;
  isSaving: boolean;
  selectedDiagnosticId: string | null;
  onBack?: () => void;
  onOpenVersionHistory?: () => void;
  onSave: () => void;
  onFocusDiagnostic: (card: ChapterEditorDiagnosticCard) => void;
  onRunDiagnostic: (card: ChapterEditorDiagnosticCard) => void;
}

function MetaChip(props: { label: string }) {
  return (
    <span className="rounded-full bg-muted px-2 py-1 text-xs text-muted-foreground">
      {props.label}
    </span>
  );
}

function LoadingBar(props: { widthClassName?: string }) {
  return (
    <div className={`h-3 animate-pulse rounded-full bg-muted ${props.widthClassName ?? "w-full"}`} />
  );
}

export default function ChapterEditorSidebar(props: ChapterEditorSidebarProps) {
  const { t } = useTranslation("novelsChapterEditor");
  const {
    chapter,
    workspace,
    workspaceStatus,
    wordCount,
    saveStatusLabel,
    isDirty,
    isSaving,
    selectedDiagnosticId,
    onBack,
    onOpenVersionHistory,
    onSave,
    onFocusDiagnostic,
    onRunDiagnostic,
  } = props;

  const recommendedTask = workspace?.recommendedTask ?? null;
  const macroContext = workspace?.macroContext ?? null;
  const isWorkspaceLoading = workspaceStatus === "loading";
  const isWorkspaceError = workspaceStatus === "error";

  return (
    <div className="min-h-0 overflow-hidden">
      <div className="flex h-full min-h-0 flex-col gap-4 overflow-y-auto pr-1">
        <div className="shrink-0 rounded-3xl border border-border/70 bg-background p-4 shadow-sm">
          <div className="flex flex-col gap-4">
            {onBack ? (
              <div>
                <Button size="sm" variant="outline" onClick={onBack}>
                  {t("sidebar.backToChapterExecution")}
                </Button>
              </div>
            ) : null}

            <div className="space-y-3">
              <div className="text-lg font-semibold leading-7 text-foreground">
                {t("sidebar.chapterHeading", {
                  order: chapter.order,
                  title: chapter.title?.trim() || t("sidebar.untitledChapter"),
                })}
              </div>

              <div className="flex flex-wrap gap-2">
                <MetaChip label={t("sidebar.wordCount", { count: wordCount })} />
                <MetaChip label={saveStatusLabel} />
                <MetaChip label={isWorkspaceLoading ? t("sidebar.llmAnalyzing") : t("sidebar.issueCount", { count: workspace?.chapterMeta.openIssueCount ?? 0 })} />
              </div>

              {isWorkspaceLoading ? (
                <div className="space-y-2 pt-1">
                  <LoadingBar widthClassName="w-full" />
                  <LoadingBar widthClassName="w-4/5" />
                </div>
              ) : workspace?.chapterMeta.styleSummary ? (
                <div className="text-sm leading-6 text-muted-foreground">
                  {t("sidebar.styleAsset", { summary: workspace.chapterMeta.styleSummary })}
                </div>
              ) : null}
            </div>

            <div className="grid grid-cols-1 gap-2">
              <Button
                size="sm"
                onClick={onSave}
                disabled={!isDirty || isSaving}
                className="w-full"
              >
                {isSaving ? t("sidebar.saving") : t("sidebar.save")}
              </Button>
              {onOpenVersionHistory ? (
                <Button size="sm" variant="outline" onClick={onOpenVersionHistory} className="w-full">
                  {t("sidebar.versionEntry")}
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="shrink-0 rounded-3xl border border-border/70 bg-background p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-foreground">{t("sidebar.macroPositioning")}</div>
            <span className="text-xs text-muted-foreground">
              {isWorkspaceLoading ? t("sidebar.aiAnalyzing") : workspace?.refreshReason ?? t("sidebar.realtimeGenerated")}
            </span>
          </div>

          {isWorkspaceLoading ? (
            <div className="space-y-4 text-sm leading-6 text-muted-foreground">
              <div>{t("sidebar.macroLoadingBody")}</div>
              <div className="space-y-3">
                <LoadingBar widthClassName="w-2/3" />
                <LoadingBar widthClassName="w-full" />
                <LoadingBar widthClassName="w-5/6" />
                <LoadingBar widthClassName="w-4/5" />
              </div>
            </div>
          ) : macroContext ? (
            <div className="space-y-4 text-sm leading-6">
              <div>
                <div className="mb-1 font-medium text-foreground">{t("sidebar.macroPositionTitle")}</div>
                <div className="text-muted-foreground">
                  {macroContext.volumeTitle} · {macroContext.volumePositionLabel} · {macroContext.volumePhaseLabel}
                </div>
              </div>
              <div>
                <div className="mb-1 font-medium text-foreground">{t("sidebar.paceTitle")}</div>
                <div className="text-muted-foreground">{macroContext.paceDirective}</div>
              </div>
              <div>
                <div className="mb-1 font-medium text-foreground">{t("sidebar.missionTitle")}</div>
                <div className="text-muted-foreground">{macroContext.chapterMission}</div>
              </div>
              <div>
                <div className="mb-1 font-medium text-foreground">{t("sidebar.bridgeTitle")}</div>
                <div className="space-y-2 text-muted-foreground">
                  <div>{t("sidebar.previousBridge", { bridge: macroContext.previousChapterBridge })}</div>
                  <div>{t("sidebar.nextBridge", { bridge: macroContext.nextChapterBridge })}</div>
                </div>
              </div>
            </div>
          ) : isWorkspaceError ? (
            <div className="text-sm leading-6 text-muted-foreground">
              {t("sidebar.macroError")}
            </div>
          ) : (
            <div className="text-sm leading-6 text-muted-foreground">
              {t("sidebar.macroPreparing")}
            </div>
          )}
        </div>

        <div className="min-h-0 shrink-0 rounded-3xl border border-border/70 bg-background p-4 shadow-sm">
          <div className="mb-3 flex items-center justify-between gap-3">
            <div className="text-sm font-medium text-foreground">{t("sidebar.pendingIssueCards")}</div>
            <span className="text-xs text-muted-foreground">
              {isWorkspaceLoading
                ? t("sidebar.aiOrganizing")
                : recommendedTask
                  ? t("sidebar.currentRecommendation", { title: recommendedTask.title })
                  : t("sidebar.waitingIssueCards")}
            </span>
          </div>

          <div className="space-y-3">
            {isWorkspaceLoading ? (
              <>
                <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4 text-sm leading-6 text-muted-foreground">
                  {t("sidebar.issueLoadingBody")}
                </div>
                {[0, 1].map((item) => (
                  <div key={item} className="rounded-2xl border border-border/70 bg-muted/10 p-3">
                    <div className="space-y-3">
                      <LoadingBar widthClassName="w-2/5" />
                      <LoadingBar widthClassName="w-1/3" />
                      <LoadingBar widthClassName="w-full" />
                      <LoadingBar widthClassName="w-5/6" />
                      <div className="flex gap-2 pt-1">
                        <div className="h-8 w-24 animate-pulse rounded-full bg-muted" />
                        <div className="h-8 w-32 animate-pulse rounded-full bg-muted" />
                      </div>
                    </div>
                  </div>
                ))}
              </>
            ) : workspace && workspace.diagnosticCards.length > 0 ? workspace.diagnosticCards.map((card) => {
              const isSelected = selectedDiagnosticId === card.id;
              const isRecommended = recommendedTask?.title === card.title && recommendedTask.recommendedAction === card.recommendedAction;
              return (
                <div
                  key={card.id}
                  className={`rounded-2xl border p-3 transition ${
                    isSelected
                      ? "border-sky-300 bg-sky-50/70"
                      : isRecommended
                        ? "border-emerald-200 bg-emerald-50/60"
                        : "border-border/70 bg-muted/10"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div>
                      <div className="text-sm font-medium text-foreground">{card.title}</div>
                      <div className="mt-1 text-xs text-muted-foreground">
                        {card.paragraphLabel || t("sidebar.wholeChapter")} · {card.severity}
                      </div>
                    </div>
                    {isRecommended ? (
                      <span className="rounded-full bg-emerald-100 px-2 py-1 text-[11px] text-emerald-800">
                        {t("sidebar.recommendFirst")}
                      </span>
                    ) : null}
                  </div>

                  <div className="mt-3 text-sm leading-6 text-muted-foreground">{card.problemSummary}</div>
                  <div className="mt-2 text-sm leading-6 text-foreground/80">{card.whyItMatters}</div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      variant={isSelected ? "default" : "outline"}
                      onClick={() => onFocusDiagnostic(card)}
                    >
                      {isSelected ? t("sidebar.cancelLocate") : t("sidebar.locateInText")}
                    </Button>
                    <Button size="sm" onClick={() => onRunDiagnostic(card)}>
                      {t("sidebar.handleWithAi")}
                    </Button>
                  </div>
                </div>
              );
            }) : (
              <div className="rounded-2xl border border-dashed border-border/70 bg-muted/10 p-4 text-sm leading-6 text-muted-foreground">
                {isWorkspaceError
                  ? t("sidebar.issueCardsError")
                  : workspace
                  ? t("sidebar.issueCardsEmpty")
                  : t("sidebar.workspaceLoading")}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
