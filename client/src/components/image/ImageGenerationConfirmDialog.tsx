/**
 * Unified pre-generation confirmation dialog.
 *
 * Used for every image-generation entry point (character turnaround / expression sheet / asset /
 * scene setting image / panel grid / Drama character / Drama keyframe). Before actually consuming
 * tokens it shows the prompt to be sent + reference materials + model/size; the user can temporarily
 * adjust prompt / provider / size, and generation only starts after confirmation.
 */
import { useEffect, useMemo, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Image as ImageIcon, Info, Loader2, Sparkles, Wand2, X } from "lucide-react";
import { useTranslation } from "react-i18next";

import { Dialog, AppDialogContent } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { getAPIKeySettings } from "@/api/settings";
import type { ImageGenerationOverrides, ImageGenerationPreview } from "@/api/comic";
import { assistImageGenerationPrompt, resolveImageAssetUrl, type ImagePromptAssistResult } from "@/api/images";
import { toast } from "@/components/ui/toast";
import SelectControl from "@/components/common/SelectControl";

const SIZE_OPTIONS: { value: string; labelKey: string }[] = [
  { value: "1024x1024", labelKey: "imageConfirm.size.square" },
  { value: "1024x1536", labelKey: "imageConfirm.size.portrait" },
  { value: "1536x1024", labelKey: "imageConfirm.size.landscape" },
];

const REF_KIND_LABEL_KEY: Record<string, string> = {
  character_sheet: "imageConfirm.refKind.characterSheet",
  character_expression: "imageConfirm.refKind.characterExpression",
  character_face: "imageConfirm.refKind.characterFace",
  book_analysis_character_base: "imageConfirm.refKind.bookAnalysisCharacterBase",
  asset: "imageConfirm.refKind.asset",
  scene: "imageConfirm.refKind.scene",
};

const REF_KIND_COLOR: Record<string, string> = {
  character_sheet: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-900/20 dark:text-sky-300",
  character_expression: "border-pink-200 bg-pink-50 text-pink-700 dark:border-pink-700 dark:bg-pink-900/20 dark:text-pink-300",
  character_face: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-900/20 dark:text-sky-300",
  book_analysis_character_base: "border-sky-200 bg-sky-50 text-sky-700 dark:border-sky-700 dark:bg-sky-900/20 dark:text-sky-300",
  asset: "border-amber-200 bg-amber-50 text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300",
  scene: "border-emerald-200 bg-emerald-50 text-emerald-700 dark:border-emerald-700 dark:bg-emerald-900/20 dark:text-emerald-300",
};

type PromptAssistAction = "explain" | "optimize";

interface Props {
  open: boolean;
  preview: ImageGenerationPreview | null;
  loading?: boolean;          // during prepare
  submitting?: boolean;       // during generate
  onCancel: () => void;
  onConfirm: (overrides: ImageGenerationOverrides) => void;
}

export function ImageGenerationConfirmDialog({
  open,
  preview,
  loading,
  submitting,
  onCancel,
  onConfirm,
}: Props) {
  const { t } = useTranslation("componentsMisc");
  const [prompt, setPrompt] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [optimizationInstruction, setOptimizationInstruction] = useState("");
  const [includedReferenceImageUrls, setIncludedReferenceImageUrls] = useState<string[]>([]);
  const [provider, setProvider] = useState("");
  const [size, setSize] = useState("");
  const [promptAssistAction, setPromptAssistAction] = useState<PromptAssistAction | null>(null);
  const [promptAssistLoading, setPromptAssistLoading] = useState<PromptAssistAction | null>(null);
  const [promptAssistResult, setPromptAssistResult] = useState<ImagePromptAssistResult | null>(null);
  const [promptAssistError, setPromptAssistError] = useState("");

  // When the dialog reopens or preview changes, reset the edit state to the preview defaults
  useEffect(() => {
    if (preview) {
      setPrompt(preview.prompt);
      setNegativePrompt(preview.negativePrompt ?? "");
      setOptimizationInstruction("");
      setIncludedReferenceImageUrls(preview.referenceImages.map((ref) => ref.url));
      setProvider(preview.provider);
      setSize(preview.size);
      setPromptAssistAction(null);
      setPromptAssistLoading(null);
      setPromptAssistResult(null);
      setPromptAssistError("");
    }
  }, [preview]);

  // Available provider list (image generation + configured)
  const { data: providerOptions = [] } = useQuery({
    queryKey: ["settings", "api-keys"],
    queryFn: getAPIKeySettings,
    select: (res) =>
      (res.data ?? [])
        .filter((p) => p.supportsImageGeneration && p.isConfigured)
        .map((p) => ({ value: p.provider, label: p.displayName ?? p.name })),
  });

  // When the current provider is not in the available list, temporarily append it as an option (no data loss)
  const providerChoices = useMemo(() => {
    if (!provider) return providerOptions;
    if (providerOptions.some((p) => p.value === provider)) return providerOptions;
    return [...providerOptions, { value: provider, label: provider }];
  }, [provider, providerOptions]);

  // Also make sure the current size value stays in the list
  const sizeChoices = useMemo<{ value: string; labelKey?: string }[]>(() => {
    if (!size) return SIZE_OPTIONS;
    if (SIZE_OPTIONS.some((s) => s.value === size)) return SIZE_OPTIONS;
    return [...SIZE_OPTIONS, { value: size }];
  }, [size]);

  const promptDirty = preview ? prompt.trim() !== preview.prompt.trim() : false;
  const negativePromptDirty = preview ? negativePrompt.trim() !== (preview.negativePrompt ?? "").trim() : false;
  const providerDirty = preview ? provider !== preview.provider : false;
  const sizeDirty = preview ? size !== preview.size : false;
  const referenceImages = useMemo(
    () => preview?.referenceImages.filter((ref) => includedReferenceImageUrls.includes(ref.url)) ?? [],
    [includedReferenceImageUrls, preview],
  );
  const excludedReferenceImageUrls = useMemo(
    () => preview?.referenceImages
      .filter((ref) => !includedReferenceImageUrls.includes(ref.url))
      .map((ref) => ref.url) ?? [],
    [includedReferenceImageUrls, preview],
  );
  const referenceDirty = excludedReferenceImageUrls.length > 0;
  const anyDirty = promptDirty || negativePromptDirty || providerDirty || sizeDirty || referenceDirty;

  const handleConfirm = () => {
    if (!preview) return;
    onConfirm({
      promptOverride: promptDirty ? prompt.trim() : undefined,
      negativePromptOverride: negativePromptDirty ? negativePrompt.trim() : undefined,
      providerOverride: providerDirty ? provider : undefined,
      sizeOverride: sizeDirty ? size : undefined,
      excludedReferenceImageUrls: referenceDirty ? excludedReferenceImageUrls : undefined,
    });
  };

  const clearPromptAssistResult = () => {
    setPromptAssistAction(null);
    setPromptAssistResult(null);
    setPromptAssistError("");
  };

  const handlePromptAssist = async (action: PromptAssistAction) => {
    if (!preview || !prompt.trim()) return;
    setPromptAssistAction(action);
    setPromptAssistLoading(action);
    setPromptAssistError("");
    try {
      const response = await assistImageGenerationPrompt({
        action,
        title: preview.title,
        kind: preview.kind,
        prompt: prompt.trim(),
        negativePrompt: negativePrompt.trim() || undefined,
        optimizationInstruction: action === "optimize" ? optimizationInstruction.trim() || undefined : undefined,
        provider: provider || undefined,
        size: size || undefined,
        referenceImages: referenceImages.map((ref) => ({
          kind: ref.kind,
          label: ref.label,
        })),
      });
      if (!response.data) {
        throw new Error(t("imageConfirm.noResult"));
      }
      if (action === "optimize" && response.data.optimizedPrompt?.trim()) {
        setPrompt(response.data.optimizedPrompt.trim());
      }
      setPromptAssistResult(response.data);
    } catch (error) {
      const message = error instanceof Error ? error.message : t("imageConfirm.assistFailed");
      setPromptAssistError(message);
      toast.error(t("imageConfirm.assistFailedTitle"), { description: message });
    } finally {
      setPromptAssistLoading(null);
    }
  };

  const footer = preview ? (
    <div className="flex w-full items-center justify-between gap-3">
      <p className="text-[11px] text-muted-foreground">
        {anyDirty ? t("imageConfirm.dirtyHint") : t("imageConfirm.cleanHint")}
      </p>
      <div className="flex gap-2">
        <Button type="button" size="sm" variant="outline" onClick={onCancel} disabled={submitting}>
          {t("imageConfirm.cancel")}
        </Button>
        <Button type="button" size="sm" onClick={handleConfirm} disabled={submitting || !prompt.trim()}>
          {submitting ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Sparkles className="h-3.5 w-3.5" />}
          {submitting ? t("imageConfirm.generating") : t("imageConfirm.startGenerate")}
        </Button>
      </div>
    </div>
  ) : null;

  return (
    <Dialog open={open} onOpenChange={(o) => { if (!o) onCancel(); }}>
      <AppDialogContent
        title={t("imageConfirm.dialogTitle")}
        description={preview?.title}
        footer={footer}
        className="max-w-3xl"
        onPointerDownOutside={(e) => e.preventDefault()}
      >
        {loading ? (
          <div className="flex items-center justify-center gap-2 py-12 text-sm text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin" />
            {t("imageConfirm.preparing")}
          </div>
        ) : !preview ? (
          <div className="py-12 text-center text-sm text-muted-foreground">{t("imageConfirm.noPreview")}</div>
        ) : (
          <div className="space-y-4">
            {/* Reference materials */}
            <div>
              <div className="mb-1.5 flex items-center gap-1.5 text-xs font-semibold text-muted-foreground">
                <ImageIcon className="h-3 w-3" />
                {t("imageConfirm.refMaterials")}
                <span className="rounded border bg-muted px-1.5 py-0.5 text-[10px] font-normal">
                  {referenceImages.length}/{preview.referenceImages.length}
                </span>
                {referenceDirty && (
                  <button
                    type="button"
                    className="ml-auto text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                    onClick={() => setIncludedReferenceImageUrls(preview.referenceImages.map((ref) => ref.url))}
                    disabled={submitting || !!promptAssistLoading}
                  >
                    {t("imageConfirm.restoreAll")}
                  </button>
                )}
              </div>
              {preview.referenceImages.length === 0 ? (
                <div className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-center text-[11px] text-muted-foreground">
                  {t("imageConfirm.noRefText2Img")}
                </div>
              ) : referenceImages.length === 0 ? (
                <div className="rounded-md border border-dashed bg-muted/20 px-3 py-3 text-center text-[11px] text-muted-foreground">
                  {t("imageConfirm.noRefSent")}
                </div>
              ) : (
                <div className="flex flex-wrap items-end gap-2 rounded-md border bg-muted/10 p-2">
                  {referenceImages.map((ref, i) => {
                    const kindStyle = REF_KIND_COLOR[ref.kind] ?? REF_KIND_COLOR.asset;
                    const kindLabelKey = REF_KIND_LABEL_KEY[ref.kind];
                    const kindLabel = kindLabelKey ? t(kindLabelKey) : ref.kind;
                    return (
                      <div
                        key={`${ref.url}-${i}`}
                        className="group relative flex flex-col overflow-hidden rounded border bg-background transition-colors hover:border-primary"
                      >
                        <button
                          type="button"
                          className="absolute right-1 top-1 z-10 inline-flex h-6 w-6 items-center justify-center rounded-full border bg-background/95 text-muted-foreground shadow-sm hover:text-destructive"
                          title={t("imageConfirm.excludeRefTitle")}
                          onClick={() => {
                            setIncludedReferenceImageUrls((urls) => urls.filter((url) => url !== ref.url));
                            clearPromptAssistResult();
                          }}
                          disabled={submitting || !!promptAssistLoading}
                        >
                          <X className="h-3.5 w-3.5" />
                        </button>
                        {/* Fixed height h-32, width scales to the image aspect ratio */}
                        <a
                          href={resolveImageAssetUrl(ref.url)}
                          target="_blank"
                          rel="noreferrer"
                          title={t("imageConfirm.refImageTitle", { kind: kindLabel, label: ref.label })}
                          className="flex h-32 items-center justify-center bg-muted/30"
                        >
                          <img
                            src={resolveImageAssetUrl(ref.url)}
                            alt={ref.label}
                            className="block h-full w-auto object-contain"
                            loading="lazy"
                            onError={(e) => { e.currentTarget.style.display = "none"; }}
                          />
                        </a>
                        <div className="border-t px-1.5 py-1">
                          <span className={`inline-block rounded border px-1 py-px text-[9px] leading-none ${kindStyle}`}>{kindLabel}</span>
                          <p className="mt-0.5 line-clamp-1 text-[10px] leading-tight text-muted-foreground">{ref.label}</p>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>

            {/* Prompt (editable) */}
            <div>
              <div className="mb-1 flex items-center justify-between">
                <p className="text-xs font-semibold text-muted-foreground">
                  Prompt
                  {promptDirty && <span className="ml-1.5 rounded bg-amber-100 px-1 py-px text-[9px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{t("imageConfirm.modified")}</span>}
                </p>
                <div className="flex flex-wrap items-center justify-end gap-1.5">
                  <Button
                    type="button"
                    size="sm"
                    variant="outline"
                    className="h-7 px-2 text-[11px]"
                    onClick={() => handlePromptAssist("explain")}
                    disabled={submitting || !!promptAssistLoading || !prompt.trim()}
                  >
                    {promptAssistLoading === "explain" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Info className="h-3.5 w-3.5" />}
                    {t("imageConfirm.explainPrompt")}
                  </Button>
                  {promptDirty && (
                    <button
                      type="button"
                      className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                      onClick={() => {
                        setPrompt(preview.prompt);
                        clearPromptAssistResult();
                      }}
                      disabled={submitting || !!promptAssistLoading}
                    >
                      {t("imageConfirm.restoreDefault")}
                    </button>
                  )}
                </div>
              </div>
              <textarea
                className="w-full resize-y rounded-md border bg-background px-2.5 py-1.5 text-xs leading-relaxed font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                style={{ minHeight: 160, maxHeight: 280 }}
                value={prompt}
                onChange={(e) => {
                  setPrompt(e.target.value);
                  clearPromptAssistResult();
                }}
                disabled={submitting || !!promptAssistLoading}
              />
              <p className="mt-1 text-[10px] text-muted-foreground">{t("imageConfirm.promptCharHint", { chars: prompt.length })}</p>
              <div className="mt-2">
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">{t("imageConfirm.optimizeRequirement")}</p>
                  <div className="flex items-center justify-end gap-1.5">
                    <Button
                      type="button"
                      size="sm"
                      variant="outline"
                      className="h-7 px-2 text-[11px]"
                      onClick={() => handlePromptAssist("optimize")}
                      disabled={submitting || !!promptAssistLoading || !prompt.trim()}
                    >
                      {promptAssistLoading === "optimize" ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Wand2 className="h-3.5 w-3.5" />}
                      {t("imageConfirm.optimizePrompt")}
                    </Button>
                    {optimizationInstruction && (
                      <button
                        type="button"
                        className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                        onClick={() => {
                          setOptimizationInstruction("");
                          clearPromptAssistResult();
                        }}
                        disabled={submitting || !!promptAssistLoading}
                      >
                        {t("imageConfirm.clear")}
                      </button>
                    )}
                  </div>
                </div>
                <textarea
                  className="w-full resize-y rounded-md border bg-background px-2.5 py-1.5 text-xs leading-relaxed outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  style={{ minHeight: 56, maxHeight: 120 }}
                  value={optimizationInstruction}
                  onChange={(e) => {
                    setOptimizationInstruction(e.target.value);
                    clearPromptAssistResult();
                  }}
                  placeholder={t("imageConfirm.optimizePlaceholder")}
                  disabled={submitting || !!promptAssistLoading}
                />
                <p className="mt-1 text-[10px] text-muted-foreground">{t("imageConfirm.optimizeCharHint", { chars: optimizationInstruction.length })}</p>
              </div>
              {(promptAssistResult || promptAssistError) && (
                <div className="mt-2 rounded-md border bg-muted/20 p-2.5 text-xs">
                  {promptAssistError ? (
                    <p className="text-destructive">{promptAssistError}</p>
                  ) : promptAssistResult ? (
                    <div className="space-y-2">
                      <div className="flex items-start gap-1.5">
                        {promptAssistAction === "optimize" ? (
                          <Wand2 className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        ) : (
                          <Info className="mt-0.5 h-3.5 w-3.5 shrink-0 text-primary" />
                        )}
                        <p className="font-medium leading-relaxed text-foreground">{promptAssistResult.summary}</p>
                      </div>
                      <ul className="space-y-1 pl-5 text-muted-foreground">
                        {promptAssistResult.details.map((item, index) => (
                          <li key={`detail-${index}`} className="list-disc leading-relaxed">{item}</li>
                        ))}
                      </ul>
                      {promptAssistAction === "optimize" && promptAssistResult.changes.length > 0 && (
                        <div className="rounded border bg-background/70 px-2 py-1.5">
                          <p className="mb-1 text-[11px] font-semibold text-muted-foreground">{t("imageConfirm.adjusted")}</p>
                          <ul className="space-y-1 pl-4 text-muted-foreground">
                            {promptAssistResult.changes.map((item, index) => (
                              <li key={`change-${index}`} className="list-disc leading-relaxed">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                      {promptAssistResult.risks.length > 0 && (
                        <div className="rounded border border-amber-200 bg-amber-50 px-2 py-1.5 text-amber-800 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-200">
                          <p className="mb-1 text-[11px] font-semibold">{t("imageConfirm.cautions")}</p>
                          <ul className="space-y-1 pl-4">
                            {promptAssistResult.risks.map((item, index) => (
                              <li key={`risk-${index}`} className="list-disc leading-relaxed">{item}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : null}
                </div>
              )}
            </div>

            {preview.negativePrompt !== undefined && (
              <div>
                <div className="mb-1 flex items-center justify-between">
                  <p className="text-xs font-semibold text-muted-foreground">
                    {t("imageConfirm.negativePrompt")}
                    {negativePromptDirty && <span className="ml-1.5 rounded bg-amber-100 px-1 py-px text-[9px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{t("imageConfirm.modified")}</span>}
                  </p>
                  {negativePromptDirty && (
                    <button
                      type="button"
                      className="text-[10px] text-muted-foreground underline-offset-2 hover:text-foreground hover:underline"
                      onClick={() => {
                        setNegativePrompt(preview.negativePrompt ?? "");
                        clearPromptAssistResult();
                      }}
                      disabled={submitting || !!promptAssistLoading}
                    >
                      {t("imageConfirm.restoreDefault")}
                    </button>
                  )}
                </div>
                <textarea
                  className="w-full resize-y rounded-md border bg-background px-2.5 py-1.5 text-xs leading-relaxed font-mono outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  style={{ minHeight: 72, maxHeight: 160 }}
                  value={negativePrompt}
                  onChange={(e) => {
                    setNegativePrompt(e.target.value);
                    clearPromptAssistResult();
                  }}
                  disabled={submitting || !!promptAssistLoading}
                />
                <p className="mt-1 text-[10px] text-muted-foreground">{t("imageConfirm.negativeCharHint", { chars: negativePrompt.length })}</p>
              </div>
            )}

            {/* Params: provider / size */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">
                  {t("imageConfirm.imageModel")}
                  {providerDirty && <span className="ml-1.5 rounded bg-amber-100 px-1 py-px text-[9px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{t("imageConfirm.modified")}</span>}
                </p>
                <SelectControl
                  className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  value={provider}
                  onChange={(e) => {
                    setProvider(e.target.value);
                    clearPromptAssistResult();
                  }}
                  disabled={submitting || !!promptAssistLoading}
                >
                  {providerChoices.length === 0 ? (
                    <option value="">{t("imageConfirm.noProvider")}</option>
                  ) : (
                    providerChoices.map((p) => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))
                  )}
                </SelectControl>
              </div>
              <div>
                <p className="mb-1 text-xs font-semibold text-muted-foreground">
                  {t("imageConfirm.imageSize")}
                  {sizeDirty && <span className="ml-1.5 rounded bg-amber-100 px-1 py-px text-[9px] text-amber-700 dark:bg-amber-900/30 dark:text-amber-300">{t("imageConfirm.modified")}</span>}
                </p>
                <SelectControl
                  className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs outline-none focus:border-primary focus:ring-1 focus:ring-primary/20"
                  value={size}
                  onChange={(e) => {
                    setSize(e.target.value);
                    clearPromptAssistResult();
                  }}
                  disabled={submitting || !!promptAssistLoading}
                >
                  {sizeChoices.map((s) => (
                    <option key={s.value} value={s.value}>{s.labelKey ? t(s.labelKey) : s.value}</option>
                  ))}
                </SelectControl>
              </div>
            </div>

          </div>
        )}
      </AppDialogContent>
    </Dialog>
  );
}
