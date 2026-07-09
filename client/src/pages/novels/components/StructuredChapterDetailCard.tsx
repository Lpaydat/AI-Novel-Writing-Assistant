import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { UnlockKeyhole } from "lucide-react";
import AiButton from "@/components/common/AiButton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";
import {
  getChapterExecutionDetailStatus,
  type ChapterDetailBatchSelection,
} from "../chapterDetailPlanning.shared";
import type { StructuredTabViewProps } from "./NovelEditView.types";
import SelectControl from "@/components/common/SelectControl";

const textareaClassName =
  "w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

type StructuredVolume = StructuredTabViewProps["volumes"][number];
type StructuredChapter = StructuredVolume["chapters"][number];
type BatchMode = "count" | "visible_all" | "volume_all";

interface BatchPlan {
  count: number;
  hint: string;
  request: ChapterDetailBatchSelection;
}

function renderChapterDetailStatusBadge(
  status: ReturnType<typeof getChapterExecutionDetailStatus>,
  t: TFunction,
) {
  if (status === "complete") {
    return <Badge variant="secondary">{t("common.refined")}</Badge>;
  }
  if (status === "partial") {
    return <Badge>{t("common.refining")}</Badge>;
  }
  return <Badge variant="outline">{t("common.pendingRefine")}</Badge>;
}

interface StructuredChapterDetailCardProps {
  selectedVolume: StructuredVolume | undefined;
  selectedChapter: StructuredChapter | null;
  visibleChapters: StructuredChapter[];
  selectedChapterBeatLabel?: string | null;
  selectedChapterIndex: number;
  showChapterAdvanced: boolean;
  onToggleAdvanced: () => void;
  isGeneratingChapterDetail: boolean;
  isGeneratingChapterDetailBundle: boolean;
  generatingChapterDetailMode: "purpose" | "boundary" | "task_sheet" | "";
  generatingChapterDetailChapterId: string;
  onGenerateChapterDetail: StructuredTabViewProps["onGenerateChapterDetail"];
  onGenerateChapterDetailBundle: StructuredTabViewProps["onGenerateChapterDetailBundle"];
  onChapterFieldChange: StructuredTabViewProps["onChapterFieldChange"];
  onChapterNumberChange: StructuredTabViewProps["onChapterNumberChange"];
  onChapterPayoffRefsChange: StructuredTabViewProps["onChapterPayoffRefsChange"];
  onMoveChapter: StructuredTabViewProps["onMoveChapter"];
  onRemoveChapter: StructuredTabViewProps["onRemoveChapter"];
  locked: boolean;
}

export default function StructuredChapterDetailCard(props: StructuredChapterDetailCardProps) {
  const { t, i18n } = useTranslation("novelsEditD");
  const {
    selectedVolume,
    selectedChapter,
    visibleChapters,
    selectedChapterBeatLabel,
    selectedChapterIndex,
    showChapterAdvanced,
    onToggleAdvanced,
    isGeneratingChapterDetail,
    isGeneratingChapterDetailBundle,
    generatingChapterDetailMode,
    generatingChapterDetailChapterId,
    onGenerateChapterDetail,
    onGenerateChapterDetailBundle,
    onChapterFieldChange,
    onChapterNumberChange,
    onChapterPayoffRefsChange,
    onMoveChapter,
    onRemoveChapter,
    locked,
  } = props;

  const [batchMode, setBatchMode] = useState<BatchMode>("count");
  const [batchCount, setBatchCount] = useState(3);

  const volumeChapters = selectedVolume?.chapters ?? [];
  const remainingChapters = selectedChapterIndex >= 0 ? volumeChapters.slice(selectedChapterIndex) : [];
  const hasVisibleBatch = visibleChapters.length > 1 && visibleChapters.length < volumeChapters.length;
  const hasVolumeBatch = volumeChapters.length > 1;
  const hasCountBatch = remainingChapters.length > 1;
  const chapterDetailStatus = selectedChapter ? getChapterExecutionDetailStatus(selectedChapter) : "empty";

  useEffect(() => {
    if (hasCountBatch) {
      setBatchCount((current) => Math.min(Math.max(current, 2), remainingChapters.length));
      return;
    }
    setBatchCount(1);
  }, [hasCountBatch, remainingChapters.length]);

  useEffect(() => {
    if (batchMode === "count" && !hasCountBatch) {
      if (hasVisibleBatch) {
        setBatchMode("visible_all");
        return;
      }
      if (hasVolumeBatch) {
        setBatchMode("volume_all");
      }
      return;
    }
    if (batchMode === "visible_all" && !hasVisibleBatch) {
      setBatchMode(hasCountBatch ? "count" : "volume_all");
      return;
    }
    if (batchMode === "volume_all" && !hasVolumeBatch) {
      setBatchMode("count");
    }
  }, [batchMode, hasCountBatch, hasVisibleBatch, hasVolumeBatch]);

  const batchPlan = useMemo<BatchPlan | null>(() => {
    if (!selectedVolume || !selectedChapter) {
      return null;
    }
    if (batchMode === "visible_all" && hasVisibleBatch) {
      return {
        count: visibleChapters.length,
        hint: t("chapterDetail.batch.hintVisible", { count: visibleChapters.length }),
        request: {
          chapterIds: visibleChapters.map((chapter) => chapter.id),
          label: t("chapterDetail.batch.labelVisible", { count: visibleChapters.length }),
        },
      };
    }
    if (batchMode === "volume_all" && hasVolumeBatch) {
      return {
        count: volumeChapters.length,
        hint: t("chapterDetail.batch.hintVolume", { count: volumeChapters.length }),
        request: {
          chapterIds: volumeChapters.map((chapter) => chapter.id),
          label: t("chapterDetail.batch.labelVolume", { count: volumeChapters.length }),
        },
      };
    }
    if (!hasCountBatch) {
      return null;
    }
    const count = Math.min(Math.max(batchCount, 2), remainingChapters.length);
    return {
      count,
      hint: t("chapterDetail.batch.hintCount", { order: selectedChapter.chapterOrder, count }),
      request: {
        chapterIds: remainingChapters.slice(0, count).map((chapter) => chapter.id),
        label: t("chapterDetail.batch.labelCount", { order: selectedChapter.chapterOrder, count }),
      },
    };
  }, [
    batchCount,
    batchMode,
    hasCountBatch,
    hasVisibleBatch,
    hasVolumeBatch,
    remainingChapters,
    selectedChapter,
    selectedVolume,
    visibleChapters,
    volumeChapters,
    t,
    i18n.language,
  ]);

  const currentBundleRunning = Boolean(
    selectedChapter
    && isGeneratingChapterDetailBundle
    && generatingChapterDetailChapterId === selectedChapter.id,
  );

  return (
    <Card>
      <CardHeader className="pb-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <CardTitle className="text-base leading-none">{t("chapterDetail.title")}</CardTitle>
              {selectedChapter ? (
                <>
                  <Badge variant="outline">{t("common.chapterLabel", { order: selectedChapter.chapterOrder })}</Badge>
                  {selectedChapterBeatLabel ? <Badge variant="secondary">{selectedChapterBeatLabel}</Badge> : null}
                  {renderChapterDetailStatusBadge(chapterDetailStatus, t)}
                </>
              ) : null}
            </div>
            <div className="text-sm text-muted-foreground">
              {selectedChapter
                ? t("chapterDetail.subtitle.selected")
                : t("chapterDetail.subtitle.empty")}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            {selectedVolume && selectedChapter ? (
              <AiButton
                size="sm"
                onClick={() => onGenerateChapterDetailBundle(selectedVolume.id, selectedChapter.id)}
                disabled={isGeneratingChapterDetail || locked}
              >
                {currentBundleRunning ? t("chapterDetail.refineCurrent.loading") : t("chapterDetail.refineCurrent.label")}
              </AiButton>
            ) : null}
            <Button size="sm" variant="outline" onClick={onToggleAdvanced}>
              {showChapterAdvanced ? t("chapterDetail.advanced.collapse") : t("chapterDetail.advanced.expand")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {selectedVolume && selectedChapter ? (
          <>
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-1">
                  <div className="text-sm font-medium">{t("chapterDetail.batch.sectionTitle")}</div>
                  <div className="text-xs leading-6 text-muted-foreground">
                    {t("chapterDetail.batch.sectionDesc")}
                  </div>
                </div>
                <AiButton
                  size="sm"
                  variant="secondary"
                  onClick={() => onGenerateChapterDetailBundle(selectedVolume.id, batchPlan?.request ?? { chapterIds: [] })}
                  disabled={isGeneratingChapterDetail || locked || !batchPlan}
                >
                  {isGeneratingChapterDetailBundle
                    ? t("chapterDetail.batch.loading")
                    : batchPlan
                      ? t("chapterDetail.batch.buttonWithCount", { count: batchPlan.count })
                      : t("chapterDetail.batch.button")}
                </AiButton>
              </div>

              <div className="mt-3 grid gap-3 md:grid-cols-[minmax(0,1fr)_160px]">
                <label className="space-y-2 text-sm">
                  <span className="text-xs text-muted-foreground">{t("chapterDetail.batch.rangeLabel")}</span>
                  <SelectControl
                    className="w-full rounded-xl border bg-background px-3 py-2 text-sm text-foreground"
                    value={batchMode}
                    onChange={(event) => setBatchMode(event.target.value as BatchMode)}
                  >
                    <option value="count" disabled={!hasCountBatch}>{t("chapterDetail.batch.optionCount")}</option>
                    {hasVisibleBatch ? <option value="visible_all">{t("chapterDetail.batch.optionVisible")}</option> : null}
                    {hasVolumeBatch ? <option value="volume_all">{t("chapterDetail.batch.optionVolume")}</option> : null}
                  </SelectControl>
                </label>
                <label className="space-y-2 text-sm">
                  <span className="text-xs text-muted-foreground">{batchMode === "count" ? t("chapterDetail.batch.countFieldLabel") : t("chapterDetail.batch.rangeFieldLabel")}</span>
                  {batchMode === "count" ? (
                    <Input
                      type="number"
                      min={hasCountBatch ? 2 : 1}
                      max={Math.max(remainingChapters.length, 1)}
                      value={batchCount}
                      onChange={(event) => setBatchCount(Number(event.target.value || 0))}
                      disabled={!hasCountBatch}
                    />
                  ) : (
                    <div className="rounded-xl border border-border/70 bg-background px-3 py-2 text-sm text-foreground">
                      {batchPlan ? t("chapterDetail.batch.chapterCountSpaced", { count: batchPlan.count }) : t("chapterDetail.batch.unavailable")}
                    </div>
                  )}
                </label>
              </div>

              <div className="mt-2 text-xs leading-6 text-muted-foreground">
                {locked
                  ? t("chapterDetail.batch.lockedHint")
                  : batchPlan?.hint ?? t("chapterDetail.batch.singleChapterHint")}
              </div>
            </div>

            <label className="space-y-2 text-sm">
              <span className="text-xs text-muted-foreground">{t("chapterDetail.field.title")}</span>
              <Input
                value={selectedChapter.title}
                onChange={(event) => onChapterFieldChange(selectedVolume.id, selectedChapter.id, "title", event.target.value)}
              />
            </label>

            <label className="space-y-2 text-sm">
              <span className="text-xs text-muted-foreground">{t("chapterDetail.field.summary")}</span>
              <textarea
                className={cn(textareaClassName, "min-h-[130px]")}
                value={selectedChapter.summary}
                onChange={(event) => onChapterFieldChange(selectedVolume.id, selectedChapter.id, "summary", event.target.value)}
              />
            </label>

            <label className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{t("chapterDetail.field.purpose")}</span>
                <AiButton
                  size="sm"
                  variant="outline"
                  onClick={() => onGenerateChapterDetail(selectedVolume.id, selectedChapter.id, "purpose")}
                  disabled={isGeneratingChapterDetail || locked}
                >
                  {isGeneratingChapterDetail && generatingChapterDetailMode === "purpose" && generatingChapterDetailChapterId === selectedChapter.id ? t("chapterDetail.aiFix.loading") : t("chapterDetail.aiFix.label")}
                </AiButton>
              </div>
              <textarea
                className={cn(textareaClassName, "min-h-[110px]")}
                value={selectedChapter.purpose ?? ""}
                onChange={(event) => onChapterFieldChange(selectedVolume.id, selectedChapter.id, "purpose", event.target.value)}
              />
            </label>

            <label className="space-y-2 text-sm">
              <div className="flex items-center justify-between gap-2">
                <span className="text-xs text-muted-foreground">{t("chapterDetail.field.taskSheet")}</span>
                <AiButton
                  size="sm"
                  variant="outline"
                  onClick={() => onGenerateChapterDetail(selectedVolume.id, selectedChapter.id, "task_sheet")}
                  disabled={isGeneratingChapterDetail || locked}
                >
                  {isGeneratingChapterDetail && generatingChapterDetailMode === "task_sheet" && generatingChapterDetailChapterId === selectedChapter.id ? t("chapterDetail.aiFix.loading") : t("chapterDetail.aiFix.label")}
                </AiButton>
              </div>
              <textarea
                className={cn(textareaClassName, "min-h-[130px]")}
                value={selectedChapter.taskSheet ?? ""}
                onChange={(event) => onChapterFieldChange(selectedVolume.id, selectedChapter.id, "taskSheet", event.target.value)}
              />
            </label>

            {showChapterAdvanced ? (
              <div className="space-y-4 rounded-xl border border-border/70 bg-muted/20 p-4">
                <div className="text-sm font-medium">{t("chapterDetail.advanced.title")}</div>
                <div className="grid gap-3 md:grid-cols-3">
                  <label className="space-y-2 text-sm">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs text-muted-foreground">{t("chapterDetail.field.conflictLevel")}</span>
                      {selectedChapter.conflictLevelSource === "user" && typeof selectedChapter.conflictLevel === "number" ? (
                        <Button
                          type="button"
                          size="sm"
                          variant="outline"
                          className="h-7 px-2 text-xs"
                          title={t("chapterDetail.unlockTitle")}
                          onClick={() => {
                            const conflictLevel = selectedChapter.conflictLevel;
                            if (typeof conflictLevel !== "number") {
                              return;
                            }
                            onChapterNumberChange(selectedVolume.id, selectedChapter.id, "conflictLevel", conflictLevel, {
                              conflictLevelSource: "ai",
                            });
                          }}
                        >
                          <UnlockKeyhole className="mr-1 h-3.5 w-3.5" aria-hidden="true" />
                          {t("chapterDetail.returnToAi")}
                        </Button>
                      ) : null}
                    </div>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={selectedChapter.conflictLevel ?? ""}
                      onChange={(event) => {
                        const nextValue = event.target.value ? Number(event.target.value) : null;
                        onChapterNumberChange(selectedVolume.id, selectedChapter.id, "conflictLevel", nextValue, nextValue == null ? {} : {
                          conflictLevelSource: "user",
                        });
                      }}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-xs text-muted-foreground">{t("chapterDetail.field.revealLevel")}</span>
                    <Input
                      type="number"
                      min={0}
                      max={100}
                      value={selectedChapter.revealLevel ?? ""}
                      onChange={(event) => onChapterNumberChange(selectedVolume.id, selectedChapter.id, "revealLevel", event.target.value ? Number(event.target.value) : null)}
                    />
                  </label>
                  <label className="space-y-2 text-sm">
                    <span className="text-xs text-muted-foreground">{t("chapterDetail.field.targetWordCount")}</span>
                    <Input
                      type="number"
                      min={200}
                      step={100}
                      value={selectedChapter.targetWordCount ?? ""}
                      onChange={(event) => onChapterNumberChange(selectedVolume.id, selectedChapter.id, "targetWordCount", event.target.value ? Number(event.target.value) : null)}
                    />
                  </label>
                </div>

                <label className="space-y-2 text-sm">
                  <span className="text-xs text-muted-foreground">{t("chapterDetail.field.mustAvoid")}</span>
                  <textarea
                    className={cn(textareaClassName, "min-h-[100px]")}
                    value={selectedChapter.mustAvoid ?? ""}
                    onChange={(event) => onChapterFieldChange(selectedVolume.id, selectedChapter.id, "mustAvoid", event.target.value)}
                  />
                </label>

                <label className="space-y-2 text-sm">
                  <span className="text-xs text-muted-foreground">{t("chapterDetail.field.payoffRefs")}</span>
                  <textarea
                    className={cn(textareaClassName, "min-h-[100px]")}
                    value={selectedChapter.payoffRefs.join("\n")}
                    onChange={(event) => onChapterPayoffRefsChange(selectedVolume.id, selectedChapter.id, event.target.value)}
                  />
                </label>

                <div className="flex flex-wrap gap-2">
                  <Button size="sm" variant="outline" onClick={() => onMoveChapter(selectedVolume.id, selectedChapter.id, -1)} disabled={selectedChapterIndex <= 0}>
                    {t("chapterDetail.moveUp")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onMoveChapter(selectedVolume.id, selectedChapter.id, 1)} disabled={selectedChapterIndex < 0 || selectedChapterIndex >= selectedVolume.chapters.length - 1}>
                    {t("chapterDetail.moveDown")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onRemoveChapter(selectedVolume.id, selectedChapter.id)} disabled={selectedVolume.chapters.length <= 1}>
                    {t("common.delete")}
                  </Button>
                </div>
              </div>
            ) : (
              <div className="rounded-xl border border-dashed p-3 text-sm text-muted-foreground">
                {t("chapterDetail.advanced.collapsedHint")}
              </div>
            )}
          </>
        ) : (
          <div className="rounded-md border border-dashed p-6 text-sm text-muted-foreground">
            {t("chapterDetail.emptyChapter")}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
