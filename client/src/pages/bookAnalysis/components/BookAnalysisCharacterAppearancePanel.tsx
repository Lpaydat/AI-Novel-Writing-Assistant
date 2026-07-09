import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import type {
  BookAnalysisCharacter,
  BookAnalysisCharacterAppearanceScanJob,
} from "@ai-novel/shared/types/bookAnalysisCharacter";
import {
  generateBookAnalysisCharacterAppearanceImage,
  getBookAnalysisCharacterAppearance,
  getBookAnalysisCharacterAppearanceScanJob,
  listBookAnalysisCharacterImages,
  listBookAnalysisCharacterAppearanceTerms,
  mergeBookAnalysisCharacterAppearanceTerms,
  prepareBookAnalysisCharacterAppearanceImage,
  scanBookAnalysisCharacterAppearance,
  updateBookAnalysisCharacterAppearanceTerm,
} from "@/api/bookAnalysis";
import { getImageTask, resolveImageAssetUrl } from "@/api/images";
import { queryKeys } from "@/api/queryKeys";
import { ImageGenerationConfirmDialog } from "@/components/image/ImageGenerationConfirmDialog";
import { useImageGenerationFlow } from "@/components/image/useImageGenerationFlow";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";

interface BookAnalysisCharacterAppearancePanelProps {
  analysisId: string;
  character: BookAnalysisCharacter;
  disabled: boolean;
}

const COVERAGE_MARKS = [25, 50, 75, 100];
const IMAGE_STATUS_TEXT: Record<string, string> = {
  queued: "imageStatus.queued",
  running: "imageStatus.running",
  succeeded: "imageStatus.succeeded",
  failed: "imageStatus.failed",
  cancelled: "imageStatus.cancelled",
};

function formatJsonSummary(value: Record<string, unknown> | null | undefined, t: TFunction): string {
  if (!value || Object.keys(value).length === 0) {
    return t("appearance.noStableFeatures");
  }
  return Object.entries(value)
    .slice(0, 6)
    .map(([key, item]) => t("appearance.featureEntry", { key, value: typeof item === "string" ? item : JSON.stringify(item) }))
    .join(t("appearance.featureSeparator"));
}

export default function BookAnalysisCharacterAppearancePanel({
  analysisId,
  character,
  disabled,
}: BookAnalysisCharacterAppearancePanelProps) {
  const { t } = useTranslation("bookAnalysisComponents");
  const queryClient = useQueryClient();
  const flow = useImageGenerationFlow();
  const [targetPercent, setTargetPercent] = useState(25);
  const [activeTaskId, setActiveTaskId] = useState("");
  const [activeScanJobId, setActiveScanJobId] = useState("");
  const [lastScanJob, setLastScanJob] = useState<BookAnalysisCharacterAppearanceScanJob | null>(null);
  const [selectedTermIds, setSelectedTermIds] = useState<string[]>([]);
  const [selectedReferenceAssetIds, setSelectedReferenceAssetIds] = useState<string[]>([]);
  const referenceInitializedForCharacter = useRef("");
  const queryKey = ["book-analysis-character-appearance", analysisId, character.id];
  const termsQueryKey = ["book-analysis-character-appearance-terms", analysisId, character.id, "pending"];
  const appearanceQuery = useQuery({
    queryKey,
    queryFn: () => getBookAnalysisCharacterAppearance(analysisId, character.id),
    refetchInterval: activeScanJobId ? 2500 : false,
  });
  const appearance = appearanceQuery.data?.data ?? character.appearance ?? null;
  const termsQuery = useQuery({
    queryKey: termsQueryKey,
    queryFn: () => listBookAnalysisCharacterAppearanceTerms(analysisId, character.id, "pending"),
  });
  const pendingTerms = termsQuery.data?.data ?? [];
  const characterImagesQuery = useQuery({
    queryKey: ["book-analysis-character-images", analysisId, character.id],
    queryFn: () => listBookAnalysisCharacterImages(analysisId, character.id),
  });
  const characterImages = characterImagesQuery.data?.data ?? [];

  const scanMutation = useMutation({
    mutationFn: () => scanBookAnalysisCharacterAppearance(analysisId, character.id, { targetPercent }),
    onSuccess: async (response) => {
      if (response.data?.jobId) {
        setLastScanJob(null);
        setActiveScanJobId(response.data.jobId);
      }
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey: termsQueryKey });
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookAnalysis.characters(analysisId) });
    },
  });

  const mergeTermsMutation = useMutation({
    mutationFn: () => mergeBookAnalysisCharacterAppearanceTerms(analysisId, character.id, { termIds: selectedTermIds }),
    onSuccess: async () => {
      setSelectedTermIds([]);
      await queryClient.invalidateQueries({ queryKey });
      await queryClient.invalidateQueries({ queryKey: termsQueryKey });
      await queryClient.invalidateQueries({ queryKey: queryKeys.bookAnalysis.characters(analysisId) });
    },
  });

  const rejectTermMutation = useMutation({
    mutationFn: (termId: string) =>
      updateBookAnalysisCharacterAppearanceTerm(analysisId, character.id, termId, { status: "rejected" }),
    onSuccess: async () => {
      setSelectedTermIds((current) => current.filter((id) => pendingTerms.some((term) => term.id === id)));
      await queryClient.invalidateQueries({ queryKey: termsQueryKey });
    },
  });

  const scanJobQuery = useQuery({
    queryKey: ["book-analysis-character-appearance-scan-job", analysisId, character.id, activeScanJobId || "none"],
    queryFn: () => getBookAnalysisCharacterAppearanceScanJob(analysisId, character.id, activeScanJobId),
    enabled: Boolean(activeScanJobId),
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      return status === "queued" || status === "running" ? 2000 : false;
    },
    retry: 1,
  });
  const scanJob = scanJobQuery.data?.data;
  const scanActive = scanMutation.isPending
    || Boolean(activeScanJobId && (!scanJob || scanJob.status === "queued" || scanJob.status === "running"));

  useEffect(() => {
    if (!scanJob || !activeScanJobId) {
      return;
    }
    if (scanJob.status === "queued" || scanJob.status === "running") {
      return;
    }
    void queryClient.invalidateQueries({ queryKey });
    void queryClient.invalidateQueries({ queryKey: queryKeys.bookAnalysis.characters(analysisId) });
    setLastScanJob(scanJob);
    setActiveScanJobId("");
  }, [activeScanJobId, analysisId, queryClient, queryKey, scanJob]);

  useEffect(() => {
    const available = new Set(pendingTerms.map((term) => term.id));
    setSelectedTermIds((current) => current.filter((id) => available.has(id)));
  }, [pendingTerms]);

  useEffect(() => {
    const key = `${analysisId}:${character.id}`;
    if (referenceInitializedForCharacter.current === key) {
      return;
    }
    if (characterImages.length === 0) {
      setSelectedReferenceAssetIds([]);
      return;
    }
    const primary = characterImages.find((image) => image.isPrimary) ?? characterImages[0];
    setSelectedReferenceAssetIds(primary ? [primary.id] : []);
    referenceInitializedForCharacter.current = key;
  }, [analysisId, character.id, characterImages]);

  const taskQuery = useQuery({
    queryKey: queryKeys.images.task(activeTaskId || "none"),
    queryFn: () => getImageTask(activeTaskId),
    enabled: Boolean(activeTaskId),
    refetchInterval: (query) => {
      const status = query.state.data?.data?.status;
      return status === "queued" || status === "running" ? 1500 : false;
    },
  });
  const activeTask = taskQuery.data?.data;

  useEffect(() => {
    if (!activeTask || !activeTaskId) {
      return;
    }
    if (activeTask.status === "queued" || activeTask.status === "running") {
      return;
    }
    void queryClient.invalidateQueries({ queryKey });
    void queryClient.invalidateQueries({ queryKey: queryKeys.bookAnalysis.characters(analysisId) });
    setActiveTaskId("");
  }, [activeTask, activeTaskId, analysisId, queryClient, queryKey]);

  const startGenerateSnapshotImage = (snapshotId: string) => {
    void flow.start({
      prepare: async () => (await prepareBookAnalysisCharacterAppearanceImage(analysisId, character.id, snapshotId, {
        referenceImageAssetIds: selectedReferenceAssetIds,
      })).data!,
      generate: async (overrides) => {
        const response = await generateBookAnalysisCharacterAppearanceImage(analysisId, character.id, snapshotId, {
          count: 2,
          stylePreset: "同一角色章节形象演变图",
          referenceImageAssetIds: selectedReferenceAssetIds,
          overrides,
        });
        if (response.data?.id) {
          setActiveTaskId(response.data.id);
        }
        return response;
      },
    });
  };

  const toggleTerm = (termId: string, checked: boolean) => {
    setSelectedTermIds((current) =>
      checked ? Array.from(new Set([...current, termId])) : current.filter((id) => id !== termId),
    );
  };

  const toggleReferenceAsset = (assetId: string, checked: boolean) => {
    setSelectedReferenceAssetIds((current) =>
      checked ? Array.from(new Set([...current, assetId])) : current.filter((id) => id !== assetId),
    );
  };

  const currentAppearance = character.profile.appearance?.trim() || "";

  return (
    <div className="mt-3 space-y-3 rounded-md border bg-muted/10 p-3">
      <ImageGenerationConfirmDialog {...flow.dialogProps} />
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap items-center gap-2">
          <span className="font-medium">{t("appearance.title")}</span>
          <Badge variant="outline">{appearance?.coveragePercent ?? 0}%</Badge>
          <Badge variant="secondary">{t("appearance.snapshotCount", { count: appearance?.snapshots.length ?? 0 })}</Badge>
        </div>
        <Button
          size="sm"
          variant="outline"
          onClick={() => scanMutation.mutate()}
          disabled={disabled || scanActive}
        >
          {scanActive ? t("appearance.scanning") : t("appearance.incrementalScan")}
        </Button>
      </div>

      <div className="rounded-md border bg-background p-2 text-sm">
        <div className="text-xs text-muted-foreground">{t("appearance.currentAppearance")}</div>
        <div className="mt-1 whitespace-pre-wrap">{currentAppearance || t("appearance.noAppearance")}</div>
      </div>

      {characterImages.length > 0 ? (
        <div className="rounded-md border bg-background p-2 text-sm">
          <div className="flex flex-wrap items-center justify-between gap-2">
            <div>
              <div className="text-xs text-muted-foreground">{t("appearance.baseReference")}</div>
              <div className="mt-1 text-sm">{t("appearance.baseReferenceHint")}</div>
            </div>
            <Badge variant="outline">{t("appearance.referenceCount", { count: selectedReferenceAssetIds.length })}</Badge>
          </div>
          <div className="mt-2 grid gap-2 sm:grid-cols-3">
            {characterImages.map((image) => (
              <label
                key={image.id}
                className="flex cursor-pointer items-center gap-2 rounded-md border p-2 text-xs"
              >
                <input
                  type="checkbox"
                  checked={selectedReferenceAssetIds.includes(image.id)}
                  onChange={(event) => toggleReferenceAsset(image.id, event.target.checked)}
                  disabled={disabled || Boolean(activeTaskId)}
                  className="size-3 accent-primary"
                />
                <img
                  src={resolveImageAssetUrl(image.url)}
                  alt={t("appearance.baseReferenceAlt", { name: character.name })}
                  className="size-12 rounded object-cover"
                  loading="lazy"
                />
                  <span className="min-w-0 flex-1">
                    <span className="block truncate font-medium">{image.isPrimary ? t("appearance.primary") : t("appearance.referenceLabel", { index: image.sortOrder + 1 })}</span>
                  <span className="block text-muted-foreground">
                    {image.width && image.height ? `${image.width}×${image.height}` : image.provider}
                  </span>
                  </span>
              </label>
            ))}
          </div>
        </div>
      ) : characterImagesQuery.isLoading ? (
        <div className="rounded-md border bg-background p-2 text-xs text-muted-foreground">{t("appearance.loadingBaseImages")}</div>
      ) : null}

      <div className="space-y-2">
        <div className="flex flex-wrap items-center gap-2">
          {COVERAGE_MARKS.map((value) => (
            <Button
              key={value}
              type="button"
              size="sm"
              variant={targetPercent === value ? "default" : "outline"}
              onClick={() => setTargetPercent(value)}
              disabled={disabled || scanActive}
            >
              {value}%
            </Button>
          ))}
        </div>
        <input
          type="range"
          min={0}
          max={100}
          step={25}
          value={targetPercent}
          onChange={(event) => setTargetPercent(Number(event.target.value))}
          className="w-full accent-primary"
          disabled={disabled || scanActive}
          aria-label={t("appearance.targetCoverageAria")}
        />
      </div>

      {appearanceQuery.isLoading ? <div className="text-xs text-muted-foreground">{t("appearance.loadingAppearance")}</div> : null}
      {scanMutation.error ? (
        <div className="text-xs text-destructive">
          {scanMutation.error instanceof Error ? scanMutation.error.message : t("appearance.scanFailed")}
        </div>
      ) : null}
      {scanJob || lastScanJob ? (
        <div className="rounded-md border bg-background p-2 text-xs text-muted-foreground">
          {t("appearance.scanStatusPrefix")}{(scanJob ?? lastScanJob)?.status === "queued" ? t("appearance.statusQueued") : (scanJob ?? lastScanJob)?.status === "running" ? t("appearance.statusScanning") : (scanJob ?? lastScanJob)?.status === "succeeded" ? t("appearance.statusCompleted") : t("appearance.statusFailed")}
          {(scanJob ?? lastScanJob)?.error ? <span className="ml-2 text-destructive">{(scanJob ?? lastScanJob)?.error}</span> : null}
        </div>
      ) : null}
      {scanJobQuery.error ? (
        <div className="text-xs text-destructive">
          {scanJobQuery.error instanceof Error ? scanJobQuery.error.message : t("appearance.scanProgressFailed")}
        </div>
      ) : null}
      {mergeTermsMutation.error ? (
        <div className="text-xs text-destructive">
          {mergeTermsMutation.error instanceof Error ? mergeTermsMutation.error.message : t("appearance.mergeFailed")}
        </div>
      ) : null}
      {activeTask ? (
        <div className="rounded-md border bg-background p-2 text-xs text-muted-foreground">
          {t("appearance.currentImageTask", { status: IMAGE_STATUS_TEXT[activeTask.status] ? t(IMAGE_STATUS_TEXT[activeTask.status]) : activeTask.status })}
          {activeTask.error ? <span className="ml-2 text-destructive">{activeTask.error}</span> : null}
        </div>
      ) : null}

      {appearance ? (
        <>
          <div className="rounded-md border bg-background p-2 text-sm">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="text-xs text-muted-foreground">{t("appearance.pendingTermsTitle")}</div>
                <div className="mt-1 text-sm">{pendingTerms.length > 0 ? t("appearance.pendingTermsHint") : t("appearance.noPendingTerms")}</div>
              </div>
              <Button
                type="button"
                size="sm"
                onClick={() => mergeTermsMutation.mutate()}
                disabled={disabled || selectedTermIds.length === 0 || mergeTermsMutation.isPending}
              >
                {mergeTermsMutation.isPending ? t("appearance.merging") : t("appearance.mergeAppearance")}
              </Button>
            </div>
            {termsQuery.isLoading ? <div className="mt-2 text-xs text-muted-foreground">{t("appearance.loadingTerms")}</div> : null}
            {pendingTerms.length > 0 ? (
              <div className="mt-2 flex flex-wrap gap-2">
                {pendingTerms.map((term) => (
                  <label
                    key={term.id}
                    className="flex max-w-full items-center gap-2 rounded-md border px-2 py-1 text-xs"
                  >
                    <input
                      type="checkbox"
                      checked={selectedTermIds.includes(term.id)}
                      onChange={(event) => toggleTerm(term.id, event.target.checked)}
                      disabled={disabled || mergeTermsMutation.isPending}
                      className="size-3 accent-primary"
                    />
                    <span className="font-medium">{term.text}</span>
                    <span className="text-muted-foreground">{t("appearance.chapterLabel", { index: term.chapterIndex + 1 })}</span>
                    {term.evidence.length > 0 ? <span className="text-muted-foreground">{t("appearance.evidenceCount", { count: term.evidence.length })}</span> : null}
                    <Button
                      type="button"
                      size="sm"
                      variant="ghost"
                      className="h-6 px-1 text-xs"
                      onClick={(event) => {
                        event.preventDefault();
                        rejectTermMutation.mutate(term.id);
                      }}
                      disabled={disabled || rejectTermMutation.isPending}
                    >
                      {t("appearance.ignoreTerm")}
                    </Button>
                  </label>
                ))}
              </div>
            ) : null}
          </div>
          <div className="rounded-md border bg-background p-2 text-sm">
            <div className="text-xs text-muted-foreground">{t("appearance.stableFeatures")}</div>
            <div className="mt-1 whitespace-pre-wrap">{formatJsonSummary(appearance.consolidatedAppearance, t)}</div>
          </div>
          {appearance.variantPolicy && Object.keys(appearance.variantPolicy).length > 0 ? (
            <div className="rounded-md border border-amber-500/40 bg-amber-500/5 p-2 text-sm text-amber-700 dark:text-amber-300">
              {formatJsonSummary(appearance.variantPolicy, t)}
            </div>
          ) : null}
          {appearance.snapshots.length > 0 ? (
            <div className="space-y-2">
              {appearance.snapshots.map((snapshot) => (
                <div key={snapshot.id} className="rounded-md border bg-background p-2">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <div className="font-medium">{t("appearance.chapterLabel", { index: snapshot.chapterIndex + 1 })}</div>
                      {snapshot.manuallyEdited ? <Badge variant="outline">{t("appearance.manuallyKept")}</Badge> : null}
                      {(() => {
                        const readyCount = snapshot.images.filter((image) => image.imageAsset).length;
                        return readyCount > 0 ? <Badge variant="secondary">{t("appearance.imageCount", { count: readyCount })}</Badge> : null;
                      })()}
                    </div>
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      onClick={() => startGenerateSnapshotImage(snapshot.id)}
                      disabled={disabled || Boolean(activeTaskId)}
                    >
                      {t("appearance.generateImage")}
                    </Button>
                  </div>
                  {snapshot.chapterTitle ? (
                    <div className="mt-1 text-xs text-muted-foreground">{snapshot.chapterTitle}</div>
                  ) : null}
                  {snapshot.summaryCaption ? (
                    <div className="mt-2 text-sm">{snapshot.summaryCaption}</div>
                  ) : null}
                  <div className="mt-2 text-xs text-muted-foreground">
                    {snapshot.evidence.length > 0 ? t("appearance.evidenceItemCount", { count: snapshot.evidence.length }) : t("appearance.noEvidence")}
                  </div>
                  {snapshot.images.some((image) => image.imageAsset) ? (
                    <div className="mt-2 grid gap-2 sm:grid-cols-2">
                      {snapshot.images
                        .filter((image) => image.imageAsset)
                        .map((image) => (
                          <img
                            key={image.id}
                            src={resolveImageAssetUrl(image.imageAsset!.url)}
                            alt={t("appearance.snapshotImageAlt", { name: character.name, index: snapshot.chapterIndex + 1 })}
                            className="aspect-square w-full rounded-md object-cover"
                            loading="lazy"
                          />
                        ))}
                    </div>
                  ) : null}
                </div>
              ))}
            </div>
          ) : null}
        </>
      ) : (
        <div className="text-xs text-muted-foreground">{t("appearance.emptyHint")}</div>
      )}
    </div>
  );
}
