import type { ReactNode } from "react";
import { useTranslation } from "react-i18next";
import type { Chapter, NovelBible, PipelineJob, PlotBeat, QualityScore, ReviewIssue } from "@ai-novel/shared/types/novel";
import AiButton from "@/components/common/AiButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import LLMSelector from "@/components/common/LLMSelector";
import StreamOutput from "@/components/common/StreamOutput";
import CollapsibleSummary from "./CollapsibleSummary";
import WorldInjectionHint from "./WorldInjectionHint";
import { getLowScoreChapterRange, getPipelineStageState, PIPELINE_STAGE_ITEMS } from "./pipelineTab.utils";
import DirectorTakeoverEntryPanel from "./DirectorTakeoverEntryPanel";
import SelectControl from "@/components/common/SelectControl";

interface PipelineTabProps {
  novelId: string;
  worldInjectionSummary: string | null;
  hasCharacters: boolean;
  directorTakeoverEntry?: ReactNode;
  onGoToCharacterTab: () => void;
  pipelineForm: {
    startOrder: number;
    endOrder: number;
    maxRetries: number;
    runMode: "fast" | "polish";
    autoReview: boolean;
    autoRepair: boolean;
    skipCompleted: boolean;
    qualityThreshold: number;
    repairMode: "detect_only" | "light_repair" | "heavy_repair" | "continuity_only" | "character_only" | "ending_only";
  };
  onPipelineFormChange: (
    field: "startOrder" | "endOrder" | "maxRetries" | "runMode" | "autoReview" | "autoRepair" | "skipCompleted" | "qualityThreshold" | "repairMode",
    value: number | boolean | string,
  ) => void;
  maxOrder: number;
  onGenerateBible: () => void;
  onAbortBible: () => void;
  isBibleStreaming: boolean;
  bibleStreamContent: string;
  onGenerateBeats: () => void;
  onAbortBeats: () => void;
  isBeatsStreaming: boolean;
  beatsStreamContent: string;
  onRunPipeline: (patch?: Partial<PipelineTabProps["pipelineForm"]>) => void;
  isRunningPipeline: boolean;
  pipelineMessage: string;
  pipelineJob?: PipelineJob;
  chapters: Chapter[];
  selectedChapterId: string;
  onSelectedChapterChange: (chapterId: string) => void;
  onReviewChapter: () => void;
  isReviewing: boolean;
  onRepairChapter: () => void;
  isRepairing: boolean;
  onGenerateHook: () => void;
  isGeneratingHook: boolean;
  reviewResult: {
    score: QualityScore;
    issues: ReviewIssue[];
  } | null;
  repairBeforeContent: string;
  repairAfterContent: string;
  repairStreamContent: string;
  isRepairStreaming: boolean;
  onAbortRepair: () => void;
  qualitySummary?: QualityScore;
  chapterReports: Array<{
    chapterId?: string | null;
    coherence: number;
    repetition: number;
    pacing: number;
    voice: number;
    engagement: number;
    overall: number;
    issues?: string | null;
  }>;
  bible?: NovelBible | null;
  plotBeats: PlotBeat[];
}

function repairModeLabelKey(mode: PipelineTabProps["pipelineForm"]["repairMode"]): string {
  const mapping: Record<PipelineTabProps["pipelineForm"]["repairMode"], string> = {
    detect_only: "pipeline.repairMode.detectOnly",
    light_repair: "pipeline.repairMode.lightRepair",
    heavy_repair: "pipeline.repairMode.heavyRepair",
    continuity_only: "pipeline.repairMode.continuityOnly",
    character_only: "pipeline.repairMode.characterOnly",
    ending_only: "pipeline.repairMode.endingOnly",
  };
  return mapping[mode];
}

function stageStatusLabelKey(state: "pending" | "active" | "completed" | "failed"): string {
  if (state === "active") return "pipeline.stageStatus.active";
  if (state === "completed") return "pipeline.stageStatus.completed";
  if (state === "failed") return "pipeline.stageStatus.failed";
  return "pipeline.stageStatus.pending";
}

export default function PipelineTab(props: PipelineTabProps) {
  const { t } = useTranslation("novelsEditC");
  const {
    worldInjectionSummary,
    hasCharacters,
    onGoToCharacterTab,
    pipelineForm,
    onPipelineFormChange,
    maxOrder,
    onGenerateBible,
    onAbortBible,
    isBibleStreaming,
    bibleStreamContent,
    onGenerateBeats,
    onAbortBeats,
    isBeatsStreaming,
    beatsStreamContent,
    onRunPipeline,
    isRunningPipeline,
    pipelineMessage,
    pipelineJob,
    chapters,
    selectedChapterId,
    onSelectedChapterChange,
    onReviewChapter,
    isReviewing,
    onRepairChapter,
    isRepairing,
    onGenerateHook,
    isGeneratingHook,
    reviewResult,
    repairBeforeContent,
    repairAfterContent,
    repairStreamContent,
    isRepairStreaming,
    onAbortRepair,
    qualitySummary,
    chapterReports,
    bible,
    plotBeats,
    directorTakeoverEntry,
  } = props;

  const lowScoreRange = getLowScoreChapterRange(chapters, chapterReports, pipelineForm.qualityThreshold);
  const lowScoreReports = chapterReports
    .filter((item) => item.chapterId && item.overall < pipelineForm.qualityThreshold)
    .slice(0, 12);
  const pendingRepairCount = chapterReports.filter((item) => item.chapterId && item.overall < pipelineForm.qualityThreshold).length;

  const exportPipelineReport = () => {
    const report = {
      generatedAt: new Date().toISOString(),
      pipelineForm,
      pipelineJob,
      qualitySummary,
      chapterReports,
      lowScoreThreshold: pipelineForm.qualityThreshold,
    };
    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `pipeline-report-${Date.now()}.json`;
    link.click();
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <DirectorTakeoverEntryPanel
        title={t("pipeline.takeoverTitle")}
        description={t("pipeline.takeoverDesc")}
        entry={directorTakeoverEntry}
      />
      <Card className="border-0 bg-transparent shadow-none">
        <CardHeader className="rounded-2xl bg-muted/20 px-5 py-4">
          <CardTitle>{t("pipeline.batchTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 px-0 pt-5">
          <WorldInjectionHint worldInjectionSummary={worldInjectionSummary} />
          {!hasCharacters ? (
            <div className="flex items-center justify-between gap-2 rounded-2xl bg-amber-50 px-4 py-3 text-xs text-amber-800">
              <span>{t("pipeline.needCharacter")}</span>
              <Button size="sm" variant="outline" onClick={onGoToCharacterTab}>{t("pipeline.goToCharacters")}</Button>
            </div>
          ) : null}
          <div className="grid gap-3 md:grid-cols-3">
            <div className="rounded-xl bg-muted/15 p-3">
              <div className="text-xs text-muted-foreground">{t("pipeline.currentFocus")}</div>
              <div className="mt-1 text-sm font-semibold text-foreground">
                {pendingRepairCount > 0 ? t("pipeline.handleLowScoreFirst", { count: pendingRepairCount }) : t("pipeline.noObviousLowScore")}
              </div>
            </div>
            <div className="rounded-xl bg-muted/15 p-3">
              <div className="text-xs text-muted-foreground">{t("pipeline.qualityThreshold")}</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{pipelineForm.qualityThreshold}</div>
            </div>
            <div className="rounded-xl bg-muted/15 p-3">
              <div className="text-xs text-muted-foreground">{t("pipeline.currentRunMode")}</div>
              <div className="mt-1 text-sm font-semibold text-foreground">{pipelineForm.runMode === "polish" ? t("pipeline.polish") : t("pipeline.fast")}</div>
            </div>
          </div>
          {pipelineMessage ? <div className="text-sm text-muted-foreground">{pipelineMessage}</div> : null}
        </CardContent>
      </Card>

      <Card className="border-0 bg-muted/15 shadow-none">
        <CardHeader>
          <CardTitle>{t("pipeline.riskQueueTitle")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <SelectControl
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={selectedChapterId}
            onChange={(event) => onSelectedChapterChange(event.target.value)}
          >
            {chapters.map((chapter) => (
              <option key={chapter.id} value={chapter.id}>{t("pipeline.chapterOption", { order: chapter.order, title: chapter.title })}</option>
            ))}
          </SelectControl>
          <div className="flex flex-wrap gap-2">
            <AiButton onClick={onReviewChapter} disabled={isReviewing || !selectedChapterId}>{t("pipeline.runReview")}</AiButton>
            <AiButton variant="secondary" onClick={onRepairChapter} disabled={isRepairing || !selectedChapterId}>{t("pipeline.runRepair")}</AiButton>
            <AiButton variant="outline" onClick={onGenerateHook} disabled={isGeneratingHook || !selectedChapterId}>{t("pipeline.generateHook")}</AiButton>
          </div>
          {reviewResult ? (
            <div className="rounded-xl bg-background/70 p-3 text-sm">
              <div className="mb-2 font-medium">{t("pipeline.reviewScore")}</div>
              <div className="grid gap-1 md:grid-cols-2">
                <div>{t("pipeline.scoreCoherence", { value: reviewResult.score.coherence })}</div>
                <div>{t("pipeline.scoreRepetition", { value: reviewResult.score.repetition })}</div>
                <div>{t("pipeline.scorePacing", { value: reviewResult.score.pacing })}</div>
                <div>{t("pipeline.scoreVoice", { value: reviewResult.score.voice })}</div>
                <div>{t("pipeline.scoreEngagement", { value: reviewResult.score.engagement })}</div>
                <div>{t("pipeline.scoreOverall", { value: reviewResult.score.overall })}</div>
              </div>
            </div>
          ) : null}
          <StreamOutput content={repairStreamContent} isStreaming={isRepairStreaming} onAbort={onAbortRepair} />
          {(repairBeforeContent || repairAfterContent) ? (
            <div className="grid gap-3 md:grid-cols-2">
              <pre className="max-h-[220px] overflow-auto whitespace-pre-wrap rounded-xl bg-background/70 p-3 text-xs">{repairBeforeContent || t("common.none")}</pre>
              <pre className="max-h-[220px] overflow-auto whitespace-pre-wrap rounded-xl bg-background/70 p-3 text-xs">{repairAfterContent || t("pipeline.repairAfterPlaceholder")}</pre>
            </div>
          ) : null}
          {lowScoreReports.length > 0 ? (
            <div className="space-y-2 rounded-xl bg-background/70 p-3 text-xs">
              <div className="font-medium">{t("pipeline.lowScoreFilter", { value: pipelineForm.qualityThreshold })}</div>
              {lowScoreReports.map((item, index) => (
                <div key={`${item.chapterId}-${index}`} className="flex items-center justify-between">
                  <span>{item.chapterId}</span>
                  <Badge variant="secondary">overall {item.overall}</Badge>
                </div>
              ))}
            </div>
          ) : null}
        </CardContent>
      </Card>

      <details className="group border-t border-border/60 pt-4">
        <summary className="cursor-pointer list-none">
          <CollapsibleSummary
            title={t("pipeline.configSummaryTitle")}
            description={t("pipeline.configSummaryDesc")}
          />
        </summary>

        <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("pipeline.modelConfigTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              <LLMSelector />
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">{t("pipeline.startChapter")}</div>
                  <Input
                    type="number"
                    min={1}
                    max={maxOrder}
                    value={pipelineForm.startOrder}
                    onChange={(event) => onPipelineFormChange("startOrder", Number(event.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">{t("pipeline.endChapter")}</div>
                  <Input
                    type="number"
                    min={1}
                    max={maxOrder}
                    value={pipelineForm.endOrder}
                    onChange={(event) => onPipelineFormChange("endOrder", Number(event.target.value) || 1)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">{t("pipeline.maxRetries")}</div>
                  <Input
                    type="number"
                    min={0}
                    max={5}
                    value={pipelineForm.maxRetries}
                    onChange={(event) => onPipelineFormChange("maxRetries", Number(event.target.value) || 0)}
                  />
                </div>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">{t("pipeline.runMode")}</div>
                  <SelectControl
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={pipelineForm.runMode}
                    onChange={(event) => onPipelineFormChange("runMode", event.target.value)}
                  >
                    <option value="fast">{t("pipeline.fast")}</option>
                    <option value="polish">{t("pipeline.polish")}</option>
                  </SelectControl>
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">{t("pipeline.qualityThreshold")}</div>
                  <Input
                    type="number"
                    min={0}
                    max={100}
                    value={pipelineForm.qualityThreshold}
                    onChange={(event) => onPipelineFormChange("qualityThreshold", Number(event.target.value) || 75)}
                  />
                </div>
                <div className="space-y-1">
                  <div className="text-xs font-medium text-muted-foreground">{t("pipeline.repairModeLabel")}</div>
                  <SelectControl
                    className="w-full rounded-md border bg-background p-2 text-sm"
                    value={pipelineForm.repairMode}
                    onChange={(event) => onPipelineFormChange("repairMode", event.target.value)}
                  >
                    <option value="detect_only">{t("pipeline.repairMode.detectOnly")}</option>
                    <option value="light_repair">{t("pipeline.repairMode.lightRepair")}</option>
                    <option value="heavy_repair">{t("pipeline.repairMode.heavyRepair")}</option>
                    <option value="continuity_only">{t("pipeline.repairMode.continuityOnly")}</option>
                    <option value="character_only">{t("pipeline.repairMode.characterOnly")}</option>
                    <option value="ending_only">{t("pipeline.repairMode.endingOnly")}</option>
                  </SelectControl>
                </div>
              </div>
              <div className="flex flex-wrap gap-4 text-xs text-muted-foreground">
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={pipelineForm.autoReview}
                    onChange={(event) => onPipelineFormChange("autoReview", event.target.checked)}
                  />
                  {t("pipeline.autoReview")}
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={pipelineForm.autoRepair}
                    onChange={(event) => onPipelineFormChange("autoRepair", event.target.checked)}
                  />
                  {t("pipeline.autoRepair")}
                </label>
                <label className="flex items-center gap-1">
                  <input
                    type="checkbox"
                    checked={pipelineForm.skipCompleted}
                    onChange={(event) => onPipelineFormChange("skipCompleted", event.target.checked)}
                  />
                  {t("pipeline.skipCompleted")}
                </label>
              </div>
              <div className="rounded-md border bg-muted/20 p-2 text-xs text-muted-foreground">
                {t("pipeline.currentSettings", { mode: pipelineForm.runMode === "polish" ? t("pipeline.polish") : t("pipeline.fast"), threshold: pipelineForm.qualityThreshold, repair: t(repairModeLabelKey(pipelineForm.repairMode)) })}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader>
                <CardTitle>{t("pipeline.stageVisualization")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {PIPELINE_STAGE_ITEMS.map((stage) => {
                  const state = getPipelineStageState(stage.key, pipelineJob, PIPELINE_STAGE_ITEMS);
                  return (
                    <div
                      key={stage.key}
                      className={`rounded-md border px-3 py-2 text-sm ${
                        state === "active"
                          ? "border-primary bg-primary/10"
                          : state === "completed"
                            ? "border-emerald-500/30 bg-emerald-500/10"
                            : state === "failed"
                              ? "border-red-400/40 bg-red-500/10"
                              : "border-border bg-background"
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <span>{t(stage.label)}</span>
                        <span className="text-xs text-muted-foreground">{t(stageStatusLabelKey(state))}</span>
                      </div>
                    </div>
                  );
                })}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>{t("pipeline.runPanelTitle")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex flex-wrap gap-2">
                  <AiButton onClick={() => onRunPipeline()} disabled={isRunningPipeline || !hasCharacters}>{t("pipeline.startBatch")}</AiButton>
                  <AiButton
                    variant="outline"
                    onClick={() => {
                      if (!lowScoreRange) {
                        return;
                      }
                      onRunPipeline({
                        startOrder: lowScoreRange.startOrder,
                        endOrder: lowScoreRange.endOrder,
                        skipCompleted: true,
                      });
                    }}
                    disabled={isRunningPipeline || !lowScoreRange}
                  >
                    {t("pipeline.rerunLowScoreOnly")}
                  </AiButton>
                  <Button variant="outline" onClick={exportPipelineReport}>{t("pipeline.exportReport")}</Button>
                  <AiButton onClick={onGenerateBible} disabled={isBibleStreaming || !hasCharacters}>{t("pipeline.generateBible")}</AiButton>
                  <Button variant="secondary" onClick={onAbortBible} disabled={!isBibleStreaming}>{t("pipeline.stopBible")}</Button>
                  <AiButton onClick={onGenerateBeats} disabled={isBeatsStreaming || !hasCharacters}>{t("pipeline.generateBeats")}</AiButton>
                  <Button variant="secondary" onClick={onAbortBeats} disabled={!isBeatsStreaming}>{t("pipeline.stopBeats")}</Button>
                </div>
                {lowScoreRange ? (
                  <div className="text-xs text-muted-foreground">
                    {t("pipeline.lowScoreRange", { count: lowScoreRange.count, start: lowScoreRange.startOrder, end: lowScoreRange.endOrder })}
                  </div>
                ) : (
                  <div className="text-xs text-muted-foreground">{t("pipeline.noBelowThreshold")}</div>
                )}
                <div className="rounded-md border p-3 text-sm">
                  <div className="mb-2 font-medium">{t("pipeline.taskStatus")}</div>
                  {pipelineJob ? (
                    <div className="space-y-1">
                      <div>{t("pipeline.taskId", { value: pipelineJob.id })}</div>
                      <div>{t("pipeline.jobStatus", { value: pipelineJob.status })}</div>
                      <div>{t("pipeline.currentStageLine", { value: pipelineJob.currentStage || "-" })}</div>
                      <div>{t("pipeline.currentChapterLine", { value: pipelineJob.currentItemLabel || "-" })}</div>
                      <div>{t("pipeline.progressLine", { value: Math.round((pipelineJob.progress ?? 0) * 100) })}</div>
                      <div>{t("pipeline.completedLine", { done: pipelineJob.completedCount, total: pipelineJob.totalCount })}</div>
                      <div>{t("pipeline.retryLine", { count: pipelineJob.retryCount, max: pipelineJob.maxRetries })}</div>
                      {pipelineJob.lastErrorType ? <div>{t("pipeline.errorTypeLine", { value: pipelineJob.lastErrorType })}</div> : null}
                      {pipelineJob.error ? <div className="text-red-600">{t("pipeline.errorLine", { value: pipelineJob.error })}</div> : null}
                    </div>
                  ) : (
                    <div className="text-muted-foreground">{t("pipeline.noRunningJob")}</div>
                  )}
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <StreamOutput content={bibleStreamContent} isStreaming={isBibleStreaming} onAbort={onAbortBible} />
                  <StreamOutput content={beatsStreamContent} isStreaming={isBeatsStreaming} onAbort={onAbortBeats} />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </details>

      <details className="group rounded-2xl border border-border/70 bg-background/95 p-4">
        <summary className="cursor-pointer list-none">
          <CollapsibleSummary
            title={t("pipeline.reportSummaryTitle")}
            description={t("pipeline.reportSummaryDesc")}
          />
        </summary>

        <div className="mt-4 space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{t("pipeline.reportOverviewTitle")}</CardTitle>
            </CardHeader>
            <CardContent className="space-y-3">
              {qualitySummary ? (
                <div className="grid gap-2 md:grid-cols-3">
                  <Badge variant="outline">{t("pipeline.scoreCoherence", { value: qualitySummary.coherence })}</Badge>
                  <Badge variant="outline">{t("pipeline.scoreRepetition", { value: qualitySummary.repetition })}</Badge>
                  <Badge variant="outline">{t("pipeline.scorePacing", { value: qualitySummary.pacing })}</Badge>
                  <Badge variant="outline">{t("pipeline.scoreVoice", { value: qualitySummary.voice })}</Badge>
                  <Badge variant="outline">{t("pipeline.scoreEngagement", { value: qualitySummary.engagement })}</Badge>
                  <Badge variant="default">{t("pipeline.scoreOverall", { value: qualitySummary.overall })}</Badge>
                </div>
              ) : (
                <div className="text-sm text-muted-foreground">{t("pipeline.noQualityReport")}</div>
              )}
              <div className="space-y-2 text-sm">
                {chapterReports.slice(0, 10).map((item, index) => (
                  <div key={`${item.chapterId ?? "novel"}-${index}`} className="rounded-md border p-2">
                    <div>{t("pipeline.chapterLabel", { value: item.chapterId ?? t("pipeline.wholeBook") })}</div>
                    <div className="text-muted-foreground">
                      {t("pipeline.reportLine", { overall: item.overall, coherence: item.coherence, repetition: item.repetition })}
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="grid gap-4 xl:grid-cols-2">
            <Card>
              <CardHeader><CardTitle>{t("pipeline.savedBibleTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {bible ? (
                  <>
                    <div className="rounded-md border p-2"><div className="font-medium">{t("pipeline.mainPromise")}</div><div className="text-muted-foreground">{bible.mainPromise ?? t("common.none")}</div></div>
                    <div className="rounded-md border p-2"><div className="font-medium">{t("pipeline.coreSetting")}</div><div className="text-muted-foreground">{bible.coreSetting ?? t("common.none")}</div></div>
                    <div className="rounded-md border p-2">
                      <div className="font-medium">{t("pipeline.bibleWorldRecord")}</div>
                      <div className="text-xs leading-5 text-muted-foreground">
                        {t("pipeline.bibleWorldRecordDesc")}
                      </div>
                      <div className="mt-2 text-muted-foreground">{bible.worldRules ?? t("common.none")}</div>
                    </div>
                  </>
                ) : (
                  <div className="text-muted-foreground">{t("pipeline.noBible")}</div>
                )}
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>{t("pipeline.savedBeatsTitle")}</CardTitle></CardHeader>
              <CardContent className="space-y-2 text-sm">
                {plotBeats.length > 0 ? (
                  plotBeats.slice(0, 20).map((beat) => (
                    <div key={beat.id} className="rounded-md border p-2">
                      <div className="flex items-center justify-between gap-2">
                        <div className="font-medium">{t("pipeline.beatTitle", { order: beat.chapterOrder ?? "-", title: beat.title })}</div>
                        <Badge variant="outline">{beat.status}</Badge>
                      </div>
                      <div className="text-xs text-muted-foreground">{t("pipeline.beatTypeLine", { value: beat.beatType })}</div>
                    </div>
                  ))
                ) : (
                  <div className="text-muted-foreground">{t("pipeline.noBeats")}</div>
                )}
              </CardContent>
            </Card>
          </div>
        </div>
      </details>
    </div>
  );
}
