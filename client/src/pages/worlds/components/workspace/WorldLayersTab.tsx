import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type { World } from "@ai-novel/shared/types/world";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import StreamOutput from "@/components/common/StreamOutput";
import {
  LAYERS,
  LAYER_STATUS_LABELS,
  pickLayerFieldText,
  type LayerKey,
  type RefineAttribute,
  REFINE_ATTRIBUTE_OPTIONS,
} from "./worldWorkspaceShared";
import SelectControl from "@/components/common/SelectControl";

interface WorldLayersTabProps {
  world?: World;
  selectedLayer: LayerKey;
  setSelectedLayer: (layer: LayerKey) => void;
  layerDrafts: Partial<Record<LayerKey, string>>;
  setLayerDrafts: Dispatch<SetStateAction<Partial<Record<LayerKey, string>>>>;
  layerStates: Record<string, { status: string; updatedAt: string }>;
  isInitialLayerGeneration: boolean;
  generateAllPending: boolean;
  generateLayerPending: boolean;
  generateLayerVariable?: LayerKey;
  saveLayerPending: boolean;
  saveLayerVariable?: { layerKey: LayerKey; content: string };
  confirmLayerPending: boolean;
  confirmLayerVariable?: LayerKey;
  onGenerateAll: () => void;
  onGenerateLayer: (layer: LayerKey) => void;
  onSaveLayer: (payload: { layerKey: LayerKey; content: string }) => void;
  onConfirmLayer: (layer: LayerKey) => void;
  refineAttribute: RefineAttribute;
  setRefineAttribute: (value: RefineAttribute) => void;
  refineMode: "replace" | "alternatives";
  setRefineMode: (value: "replace" | "alternatives") => void;
  refineLevel: "light" | "deep";
  setRefineLevel: (value: "light" | "deep") => void;
  onStartRefine: () => void;
  refineStreaming: boolean;
  refineContent: string;
  onAbortRefine: () => void;
}

export default function WorldLayersTab(props: WorldLayersTabProps) {
  const {
    world,
    selectedLayer,
    setSelectedLayer,
    layerDrafts,
    setLayerDrafts,
    layerStates,
    isInitialLayerGeneration,
    generateAllPending,
    generateLayerPending,
    generateLayerVariable,
    saveLayerPending,
    saveLayerVariable,
    confirmLayerPending,
    confirmLayerVariable,
    onGenerateAll,
    onGenerateLayer,
    onSaveLayer,
    onConfirmLayer,
    refineAttribute,
    setRefineAttribute,
    refineMode,
    setRefineMode,
    refineLevel,
    setRefineLevel,
    onStartRefine,
    refineStreaming,
    refineContent,
    onAbortRefine,
  } = props;
  const { t } = useTranslation("worldsComponentsB");
  const selectedLayerMeta = LAYERS.find((layer) => layer.key === selectedLayer) ?? LAYERS[0];
  const worldRecord = world as unknown as Record<string, unknown> | undefined;
  const hasSelectedDraft = Object.prototype.hasOwnProperty.call(layerDrafts, selectedLayerMeta.key);
  const selectedLayerValue = hasSelectedDraft
    ? (layerDrafts[selectedLayerMeta.key] ?? "")
    : pickLayerFieldText(selectedLayerMeta.key, worldRecord);
  const selectedLayerStatus = layerStates[selectedLayerMeta.key]?.status ?? "pending";
  const isGeneratingSelectedLayer = generateLayerPending && generateLayerVariable === selectedLayerMeta.key;
  const isSavingSelectedLayer =
    saveLayerPending && saveLayerVariable?.layerKey === selectedLayerMeta.key;
  const isConfirmingSelectedLayer =
    confirmLayerPending && confirmLayerVariable === selectedLayerMeta.key;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("layersTab.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-wrap items-center gap-2 rounded-md border p-3">
          <Button onClick={onGenerateAll} disabled={generateAllPending || !world}>
            {generateAllPending ? t("common.organizing") : isInitialLayerGeneration ? t("layersTab.generateAllInitial") : t("layersTab.generateAllRedo")}
          </Button>
          <div className="text-xs text-muted-foreground">
            {isInitialLayerGeneration
              ? t("layersTab.generateAllHintInitial")
              : t("layersTab.generateAllHintRedo")}
          </div>
        </div>

        <div className="grid gap-3 lg:grid-cols-[240px_minmax(0,1fr)]">
          <div className="space-y-2 rounded-md border p-3">
            <div className="text-sm font-medium">{t("layersTab.selectLayerTitle")}</div>
            <div className="space-y-2">
              {LAYERS.map((layer) => {
                const layerStatus = layerStates[layer.key]?.status ?? "pending";
                const hasDraft = Object.prototype.hasOwnProperty.call(layerDrafts, layer.key);

                return (
                  <button
                    key={layer.key}
                    type="button"
                    className={[
                      "w-full rounded-md border p-2 text-left text-sm transition-colors",
                      selectedLayer === layer.key ? "border-primary bg-primary/5" : "border-border/70 bg-background hover:bg-muted/40",
                    ].join(" ")}
                    onClick={() => setSelectedLayer(layer.key)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{t(layer.label)}</span>
                      {hasDraft ? <span className="text-xs text-primary">{t("layersTab.draft")}</span> : null}
                    </div>
                    <div className="mt-1 text-xs text-muted-foreground">
                      {t(LAYER_STATUS_LABELS[layerStatus] ?? layerStatus)}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>

          <div className="rounded-md border p-3 space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div>
                <div className="font-medium">{t(selectedLayerMeta.label)}</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  {t("layersTab.statusPrefix", { status: t(LAYER_STATUS_LABELS[selectedLayerStatus] ?? selectedLayerStatus) })}
                </div>
              </div>
              {hasSelectedDraft ? <div className="text-xs text-primary">{t("layersTab.unsavedDraft")}</div> : null}
            </div>
            <textarea
              className="min-h-[260px] w-full rounded-md border bg-background p-2 text-sm"
              value={selectedLayerValue}
              onChange={(event) =>
                setLayerDrafts((prev) => ({
                  ...prev,
                  [selectedLayerMeta.key]: event.target.value,
                }))
              }
            />
            <div className="flex flex-wrap gap-2">
              <Button
                onClick={() => {
                  if (isInitialLayerGeneration) {
                    onGenerateAll();
                    return;
                  }
                  onGenerateLayer(selectedLayerMeta.key);
                }}
                disabled={generateAllPending || generateLayerPending || !world}
              >
                {isInitialLayerGeneration
                  ? generateAllPending
                    ? t("layersTab.generatingSixInitial")
                    : t("layersTab.generateSixFirst")
                  : isGeneratingSelectedLayer
                    ? t("layersTab.rewriting")
                    : t("layersTab.generateThisLayer")}
              </Button>
              <Button
                variant="secondary"
                onClick={() => onSaveLayer({ layerKey: selectedLayerMeta.key, content: selectedLayerValue })}
                disabled={saveLayerPending || generateAllPending || !selectedLayerValue.trim()}
              >
                {isSavingSelectedLayer ? t("common.savingShort") : t("layersTab.saveThisLayer")}
              </Button>
              <Button
                variant="outline"
                onClick={() => onConfirmLayer(selectedLayerMeta.key)}
                disabled={confirmLayerPending || generateAllPending}
              >
                {isConfirmingSelectedLayer ? t("layersTab.confirming") : t("layersTab.confirmThisLayer")}
              </Button>
            </div>
          </div>
        </div>

        <div className="rounded-md border p-3">
          <div className="mb-2 text-sm font-medium">{t("layersTab.refineTitle")}</div>
          <div className="grid gap-2 md:grid-cols-4">
            <SelectControl
              className="rounded-md border bg-background p-2 text-sm"
              value={refineAttribute}
              onChange={(event) => setRefineAttribute(event.target.value as RefineAttribute)}
            >
              {REFINE_ATTRIBUTE_OPTIONS.map((item) => (
                <option key={item.value} value={item.value}>
                  {t(item.label)}
                </option>
              ))}
            </SelectControl>
            <SelectControl
              className="rounded-md border bg-background p-2 text-sm"
              value={refineMode}
              onChange={(event) => setRefineMode(event.target.value as "replace" | "alternatives")}
            >
              <option value="replace">{t("layersTab.refineMode.replace")}</option>
              <option value="alternatives">{t("layersTab.refineMode.alternatives")}</option>
            </SelectControl>
            <SelectControl
              className="rounded-md border bg-background p-2 text-sm"
              value={refineLevel}
              onChange={(event) => setRefineLevel(event.target.value as "light" | "deep")}
            >
              <option value="light">{t("layersTab.refineLevel.light")}</option>
              <option value="deep">{t("layersTab.refineLevel.deep")}</option>
            </SelectControl>
            <Button onClick={onStartRefine} disabled={refineStreaming}>
              {refineStreaming ? t("layersTab.refining") : selectedLayer === "foundation" ? t("layersTab.refineFoundation") : t("layersTab.refineThisLayer")}
            </Button>
          </div>
          <StreamOutput content={refineContent} isStreaming={refineStreaming} onAbort={onAbortRefine} />
        </div>
      </CardContent>
    </Card>
  );
}
