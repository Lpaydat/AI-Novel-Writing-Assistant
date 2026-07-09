import { useTranslation } from "react-i18next";
import type {
  AuditReport,
  Chapter,
  ReplanRecommendation,
  ReplanResult,
  StoryPlan,
  StoryStateSnapshot,
} from "@ai-novel/shared/types/novel";
import type { SSEFrame } from "@ai-novel/shared/types/api";
import type { ChapterRuntimePackage } from "@ai-novel/shared/types/chapterRuntime";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import StreamOutput from "@/components/common/StreamOutput";
import {
  ChapterRuntimeAuditCard,
  ChapterRuntimeContextCard,
  ChapterRuntimeLengthCard,
} from "../ChapterRuntimePanels";
import {
  hasText,
  parseChapterScenePlanForDisplay,
  type AssetTabKey,
  MetricBadge,
} from "../chapterExecution.shared";

interface ChapterExecutionReferencePanelProps {
  selectedChapter?: Chapter;
  assetTab: AssetTabKey;
  onAssetTabChange: (tab: AssetTabKey) => void;
  chapterPlan?: StoryPlan | null;
  latestStateSnapshot?: StoryStateSnapshot | null;
  chapterAuditReports: AuditReport[];
  replanRecommendation?: ReplanRecommendation | null;
  onReplanChapter: () => void;
  isReplanningChapter: boolean;
  lastReplanResult?: ReplanResult | null;
  chapterQualityReport?: {
    coherence: number;
    repetition: number;
    pacing: number;
    voice: number;
    engagement: number;
    overall: number;
    issues?: string | null;
  };
  chapterRuntimePackage?: ChapterRuntimePackage | null;
  reviewResult: {
    issues?: Array<{ category: string; fixSuggestion: string }>;
  } | null;
  openAuditIssues: Array<{ id: string; auditType: string; fixSuggestion: string }>;
  repairStreamContent: string;
  isRepairStreaming: boolean;
  repairStreamingChapterId?: string | null;
  repairStreamingChapterLabel?: string | null;
  repairRunStatus?: Extract<SSEFrame, { type: "run_status" }> | null;
  onAbortRepair: () => void;
}

function PanelHintCard(props: { title: string; content: string }) {
  return (
    <div className="rounded-xl border border-border/70 bg-background/90 p-3">
      <div className="text-xs text-muted-foreground">{props.title}</div>
      <div className="mt-2 text-sm leading-6 text-foreground">{props.content}</div>
    </div>
  );
}

function ReferenceNotice(props: { title: string; description: string }) {
  return (
    <div className="rounded-xl border border-amber-200 bg-amber-50/90 p-3 text-sm text-amber-900">
      <div className="font-medium">{props.title}</div>
      <div className="mt-1 leading-6 text-amber-800">{props.description}</div>
    </div>
  );
}

export default function ChapterExecutionReferencePanel(props: ChapterExecutionReferencePanelProps) {
  const { t } = useTranslation("novelsChapterInsights");
  const {
    selectedChapter,
    assetTab,
    onAssetTabChange,
    chapterPlan,
    latestStateSnapshot,
    chapterAuditReports,
    replanRecommendation,
    onReplanChapter,
    isReplanningChapter,
    lastReplanResult,
    chapterQualityReport,
    chapterRuntimePackage,
    reviewResult,
    openAuditIssues,
    repairStreamContent,
    isRepairStreaming,
    repairStreamingChapterId,
    repairStreamingChapterLabel,
    repairRunStatus,
    onAbortRepair,
  } = props;

  if (!selectedChapter) {
    return (
      <div className="rounded-2xl border border-dashed border-border/70 bg-background p-4 text-sm leading-6 text-muted-foreground">
        {t("reference.emptyPrompt")}
      </div>
    );
  }

  const runtimePackage = chapterRuntimePackage?.chapterId === selectedChapter.id ? chapterRuntimePackage : null;
  const chapterObjective = chapterPlan?.objective ?? selectedChapter.expectation ?? t("common.noObjective");
  const scenePlan = parseChapterScenePlanForDisplay(selectedChapter);
  const isSelectedChapterRepairStreaming = isRepairStreaming && repairStreamingChapterId === selectedChapter.id;
  const isSelectedChapterRepairFinalizing = isSelectedChapterRepairStreaming && repairRunStatus?.phase === "finalizing";
  const visibleRepairStreamContent = repairStreamingChapterId === selectedChapter.id ? repairStreamContent : "";
  const hasVisibleRepairOutput = hasText(visibleRepairStreamContent);
  const repairingOtherChapter = isRepairStreaming && repairStreamingChapterId && repairStreamingChapterId !== selectedChapter.id;
  const detailTab = assetTab === "content" ? "taskSheet" : assetTab;

  return (
    <div className="space-y-4">
      <div className="rounded-2xl border border-border/70 bg-background p-4">
        <div className="flex items-start justify-between gap-3">
          <div>
            <div className="text-base font-semibold text-foreground">{t("reference.title")}</div>
            <div className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("reference.subtitle")}
            </div>
          </div>
          <Badge variant="outline" className="shrink-0">{t("common.chapterLabel", { order: selectedChapter.order })}</Badge>
        </div>
      </div>

      <Tabs value={detailTab} onValueChange={(value) => onAssetTabChange(value as AssetTabKey)}>
        <TabsList className="grid h-auto w-full grid-cols-2 gap-1 rounded-2xl bg-muted/50 p-1.5">
          <TabsTrigger value="taskSheet" className="rounded-xl text-xs">{t("reference.tabTaskSheet")}</TabsTrigger>
          <TabsTrigger value="sceneCards" className="rounded-xl text-xs">{t("reference.tabScenes")}</TabsTrigger>
          <TabsTrigger value="quality" className="rounded-xl text-xs">{t("reference.tabQuality")}</TabsTrigger>
          <TabsTrigger value="repair" className="rounded-xl text-xs">{t("reference.tabRepair")}</TabsTrigger>
          <TabsTrigger value="content" className="col-span-2 rounded-xl text-xs">{t("reference.tabContext")}</TabsTrigger>
        </TabsList>

        <TabsContent value="taskSheet" className="space-y-3">
          <div className="rounded-2xl border bg-muted/20 p-4">
            <div className="text-xs text-muted-foreground">{t("reference.taskSheetTitle")}</div>
            <div className="mt-3 whitespace-pre-wrap text-sm leading-7">
              {selectedChapter.taskSheet?.trim() || t("reference.taskSheetEmpty")}
            </div>
          </div>
          <PanelHintCard title={t("reference.chapterObjective")} content={chapterObjective} />
          <PanelHintCard title={t("common.latestState")} content={latestStateSnapshot?.summary || t("reference.noStateSummary")} />
          <ChapterRuntimeContextCard
            runtimePackage={runtimePackage}
            chapterPlan={chapterPlan}
            stateSnapshot={latestStateSnapshot}
          />
        </TabsContent>

        <TabsContent value="sceneCards" className="space-y-3">
          <ChapterRuntimeLengthCard runtimePackage={runtimePackage} />
          {scenePlan ? (
            <div className="space-y-3">
              <div className="rounded-2xl border bg-muted/20 p-4">
                <div className="text-xs text-muted-foreground">{t("reference.sceneBudgetContract")}</div>
                <div className="mt-3 grid grid-cols-2 gap-3">
                  <MetricBadge label={t("common.chapterTarget")} value={t("common.wordCount", { value: scenePlan.targetWordCount })} />
                  <MetricBadge label={t("reference.sceneCount")} value={String(scenePlan.scenes.length)} />
                </div>
              </div>
              {scenePlan.scenes.map((scene, index) => (
                <div key={scene.key} className="rounded-2xl border bg-background p-4">
                  <div className="flex flex-wrap items-center gap-2">
                    <Badge variant="outline">{t("reference.sceneIndex", { index: index + 1 })}</Badge>
                    <Badge variant="secondary">{t("common.wordCount", { value: scene.targetWordCount })}</Badge>
                  </div>
                  <div className="mt-3 text-sm font-semibold text-foreground">{scene.title}</div>
                  <div className="mt-2 text-sm leading-6 text-muted-foreground">{scene.purpose}</div>
                  <div className="mt-3 space-y-2">
                    <PanelHintCard title={t("reference.mustAdvance")} content={scene.mustAdvance.join(t("common.listSeparator")) || t("common.none")} />
                    <PanelHintCard title={t("reference.mustPreserve")} content={scene.mustPreserve.join(t("common.listSeparator")) || t("common.none")} />
                    <PanelHintCard title={t("reference.entryState")} content={scene.entryState} />
                    <PanelHintCard title={t("reference.exitState")} content={scene.exitState} />
                  </div>
                  {scene.forbiddenExpansion.length > 0 ? (
                    <div className="mt-3 rounded-xl border border-amber-200 bg-amber-50/70 p-3 text-sm leading-6 text-amber-900">
                      {t("reference.forbiddenExpansion", { items: scene.forbiddenExpansion.join(t("common.listSeparator")) })}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-2xl border bg-muted/20 p-4">
              <div className="text-xs text-muted-foreground">{t("reference.sceneBreakdown")}</div>
              <div className="mt-3 whitespace-pre-wrap text-sm leading-7">
                {selectedChapter.sceneCards?.trim()
                  ? t("reference.legacySceneText")
                  : t("reference.noSceneBreakdown")}
              </div>
            </div>
          )}
        </TabsContent>

        <TabsContent value="quality" className="space-y-3">
          <div className="grid grid-cols-2 gap-3">
            <MetricBadge label={t("reference.metricOverall")} value={String(chapterQualityReport?.overall ?? selectedChapter.qualityScore ?? "-")} />
            <MetricBadge label={t("reference.metricCoherence")} value={String(chapterQualityReport?.coherence ?? "-")} />
            <MetricBadge label={t("reference.metricRepetition")} value={String(chapterQualityReport?.repetition ?? "-")} />
            <MetricBadge label={t("reference.metricPacing")} value={String(chapterQualityReport?.pacing ?? selectedChapter.pacingScore ?? "-")} />
            <MetricBadge label={t("reference.metricVoice")} value={String(chapterQualityReport?.voice ?? "-")} />
            <MetricBadge label={t("reference.metricEngagement")} value={String(chapterQualityReport?.engagement ?? "-")} />
          </div>

          <div className="rounded-2xl border p-4 text-sm">
            <div className="font-semibold text-foreground">{t("reference.recentReviewIssues")}</div>
            {reviewResult?.issues?.length ? (
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                {reviewResult.issues.slice(0, 5).map((item, index) => (
                  <div key={`${item.category}-${index}`} className="rounded-xl border p-3">
                    <div className="font-medium text-foreground">{item.category}</div>
                    <div className="mt-1 leading-6">{item.fixSuggestion}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-xs leading-6 text-muted-foreground">{t("reference.noRecentReviewIssues")}</div>
            )}
          </div>

          <div className="rounded-2xl border p-4 text-sm">
            <div className="font-semibold text-foreground">{t("reference.structuredAuditIssues")}</div>
            {openAuditIssues.length > 0 ? (
              <div className="mt-3 space-y-2 text-xs text-muted-foreground">
                {openAuditIssues.slice(0, 6).map((item) => (
                  <div key={item.id} className="rounded-xl border p-3">
                    <div className="font-medium text-foreground">{item.auditType}</div>
                    <div className="mt-1 leading-6">{item.fixSuggestion}</div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="mt-3 text-xs leading-6 text-muted-foreground">{t("reference.noStructuredAuditIssues")}</div>
            )}
          </div>

          <ChapterRuntimeAuditCard
            runtimePackage={runtimePackage}
            auditReports={chapterAuditReports}
            replanRecommendation={replanRecommendation}
            onReplan={onReplanChapter}
            isReplanning={isReplanningChapter}
            lastReplanResult={lastReplanResult}
          />
        </TabsContent>

        <TabsContent value="repair" className="space-y-3">
          {repairingOtherChapter ? (
            <ReferenceNotice
              title={t("reference.otherChapterRepairing")}
              description={t("reference.otherChapterRepairingDesc", {
                label: repairStreamingChapterLabel ?? t("reference.anotherChapter"),
              })}
            />
          ) : null}

          {(isSelectedChapterRepairStreaming || hasVisibleRepairOutput) ? (
            <StreamOutput
              title={t("reference.repairOutputTitle")}
              emptyText={isSelectedChapterRepairFinalizing
                ? (repairRunStatus?.message ?? t("reference.repairFinalizing"))
                : t("reference.repairWaiting")}
              content={visibleRepairStreamContent}
              isStreaming={isSelectedChapterRepairStreaming}
              onAbort={isSelectedChapterRepairFinalizing ? undefined : onAbortRepair}
            />
          ) : null}

          <div className="rounded-2xl border bg-muted/20 p-4">
            <div className="text-xs text-muted-foreground">{t("reference.repairHistory")}</div>
            <div className="mt-3 max-h-[420px] overflow-y-auto whitespace-pre-wrap text-sm leading-7">
              {selectedChapter.repairHistory?.trim() || t("reference.noRepairHistory")}
            </div>
          </div>
        </TabsContent>

        <TabsContent value="content" className="space-y-3">
          <ChapterRuntimeContextCard
            runtimePackage={null}
            chapterPlan={chapterPlan}
            stateSnapshot={latestStateSnapshot}
          />
          <ChapterRuntimeAuditCard
            runtimePackage={null}
            auditReports={chapterAuditReports}
            replanRecommendation={replanRecommendation}
            onReplan={onReplanChapter}
            isReplanning={isReplanningChapter}
            lastReplanResult={lastReplanResult}
          />
        </TabsContent>
      </Tabs>
    </div>
  );
}
