import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import type { EmbeddingProvider, RagEmbeddingModelStatus, RagProviderStatus } from "@/api/settings";
import SearchableSelect from "@/components/common/SearchableSelect";
import SelectField from "@/components/common/SelectField";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";

export interface KnowledgeEmbeddingSettingsFormState {
  embeddingProvider: EmbeddingProvider;
  embeddingModel: string;
  collectionVersion: number;
  collectionMode: "auto" | "manual";
  collectionName: string;
  collectionTag: string;
  autoReindexOnChange: boolean;
  embeddingBatchSize: number;
  embeddingTimeoutMs: number;
  embeddingMaxRetries: number;
  embeddingRetryBaseMs: number;
  embeddingConcurrency: number;
  enabled: boolean;
  qdrantUrl: string;
  qdrantApiKey: string;
  qdrantApiKeyConfigured: boolean;
  clearQdrantApiKey: boolean;
  qdrantTimeoutMs: number;
  qdrantUpsertMaxBytes: number;
  qdrantUpsertConcurrency: number;
  chunkSize: number;
  chunkOverlap: number;
  vectorCandidates: number;
  keywordCandidates: number;
  finalTopK: number;
  workerPollMs: number;
  workerMaxAttempts: number;
  workerRetryBaseMs: number;
  httpTimeoutMs: number;
}

interface KnowledgeEmbeddingSettingsCardProps {
  form: KnowledgeEmbeddingSettingsFormState;
  setForm: Dispatch<SetStateAction<KnowledgeEmbeddingSettingsFormState>>;
  providers: RagProviderStatus[];
  modelOptions: string[];
  modelQuery: {
    isLoading: boolean;
    data?: RagEmbeddingModelStatus;
  };
  isSaving: boolean;
  onSave: () => void;
}

function slugifySegment(value: string, fallback: string): string {
  const normalized = value
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");
  return normalized || fallback;
}

function buildSuggestedCollectionName(form: KnowledgeEmbeddingSettingsFormState): string {
  const parts = [
    "ai",
    "novel",
    "rag",
    form.embeddingProvider,
    slugifySegment(form.embeddingModel, "embedding"),
    slugifySegment(form.collectionTag, "kb"),
    `v${form.collectionVersion}`,
  ];
  return parts.join("_").slice(0, 120);
}

function parseNumberInput(value: string, fallback: number): number {
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : fallback;
}

export default function KnowledgeEmbeddingSettingsCard({
  form,
  setForm,
  providers,
  modelOptions,
  modelQuery,
  isSaving,
  onSave,
}: KnowledgeEmbeddingSettingsCardProps) {
  const { t } = useTranslation("knowledge");
  const suggestedCollectionName = useMemo(() => buildSuggestedCollectionName(form), [form]);
  const currentProvider = providers.find((item) => item.provider === form.embeddingProvider);
  const collectionNameToDisplay = form.collectionMode === "auto"
    ? suggestedCollectionName
    : form.collectionName.trim();

  return (
    <Card>
      <CardHeader className="space-y-3">
        <div className="flex flex-wrap items-center gap-2">
          <CardTitle>{t("settingsCard.title")}</CardTitle>
          <Badge variant="outline">{t("settingsCard.collectionVersionBadge", { version: form.collectionVersion })}</Badge>
          {currentProvider ? <Badge variant="outline">{currentProvider.name}</Badge> : null}
          <Badge variant={form.enabled ? "default" : "outline"}>
            {form.enabled ? t("settingsCard.ragEnabled") : t("settingsCard.ragPaused")}
          </Badge>
        </div>
        <div className="text-sm text-muted-foreground">
          {t("settingsCard.intro")}
        </div>
      </CardHeader>
      <CardContent className="space-y-6">
        <section className="space-y-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">{t("settingsCard.vectorModelSection")}</div>
            <div className="text-xs text-muted-foreground">
              {t("settingsCard.vectorModelHint")}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <SelectField
                label={t("settingsCard.embeddingProviderLabel")}
                value={form.embeddingProvider}
                onValueChange={(value) =>
                  setForm((prev) => ({
                    ...prev,
                    embeddingProvider: value as EmbeddingProvider,
                    embeddingModel: "",
                  }))}
                options={providers.map((item) => ({
                  value: item.provider,
                  label: item.name,
                }))}
              />
              {currentProvider ? (
                <div className="flex flex-wrap gap-2 text-xs text-muted-foreground">
                  <Badge variant={currentProvider.isConfigured ? "default" : "outline"}>
                    {currentProvider.isConfigured ? t("settingsCard.connectionConfigured") : t("settingsCard.connectionPending")}
                  </Badge>
                  <Badge variant={currentProvider.isActive ? "default" : "outline"}>
                    {currentProvider.isActive ? t("settingsCard.providerActive") : t("settingsCard.providerInactive")}
                  </Badge>
                </div>
              ) : null}
            </div>

            <div className="space-y-2">
              <div className="text-sm font-medium">{t("settingsCard.embeddingModelLabel")}</div>
              {modelQuery.isLoading ? (
                <div className="rounded-md border border-dashed p-3 text-sm text-muted-foreground">
                  {t("settingsCard.loadingModels")}
                </div>
              ) : modelOptions.length > 0 ? (
                <SearchableSelect
                  value={form.embeddingModel}
                  onValueChange={(value) => setForm((prev) => ({ ...prev, embeddingModel: value }))}
                  options={modelOptions.map((model) => ({ value: model }))}
                  placeholder={t("settingsCard.selectModelPlaceholder")}
                  searchPlaceholder={t("settingsCard.searchModelPlaceholder")}
                  emptyText={t("settingsCard.noModelMatch")}
                />
              ) : null}
              <Input
                className={modelQuery.isLoading || modelOptions.length > 0 ? "hidden" : undefined}
                value={form.embeddingModel}
                onChange={(event) => setForm((prev) => ({ ...prev, embeddingModel: event.target.value }))}
                placeholder={t("settingsCard.modelInputPlaceholder")}
              />
              {modelQuery.data ? (
                <div className="text-xs text-muted-foreground">
                  {modelQuery.data.source === "remote"
                    ? t("settingsCard.remoteModelsCount", { models: modelQuery.data.models.length })
                    : t("settingsCard.localModelsHint")}
                </div>
              ) : null}
            </div>
          </div>

        </section>

        <section className="space-y-4 rounded-md border bg-background/60 p-4">
          <div className="space-y-1">
            <div className="text-sm font-medium">{t("settingsCard.vectorStoreSection")}</div>
            <div className="text-xs text-muted-foreground">
              {t("settingsCard.vectorStoreHint")}
            </div>
          </div>

          <div className="space-y-2">
            <div className="text-sm font-medium">{t("settingsCard.vectorStoreUrlLabel")}</div>
            <Input
              value={form.qdrantUrl}
              onChange={(event) => setForm((prev) => ({ ...prev, qdrantUrl: event.target.value }))}
              placeholder="http://127.0.0.1:6333"
            />
            <div className="text-xs text-muted-foreground">
              {t("settingsCard.vectorStoreUrlHint")}
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{t("settingsCard.vectorStoreApiKeyLabel")}</div>
                <Badge variant={form.qdrantApiKeyConfigured ? "default" : "outline"}>
                  {form.qdrantApiKeyConfigured ? t("settingsCard.apiKeyConfigured") : t("settingsCard.apiKeyUnset")}
                </Badge>
              </div>
              <Input
                type="password"
                value={form.qdrantApiKey}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    qdrantApiKey: event.target.value,
                    clearQdrantApiKey: false,
                  }))}
                placeholder={form.qdrantApiKeyConfigured ? t("settingsCard.apiKeyKeepPlaceholder") : t("settingsCard.apiKeyInputPlaceholder")}
              />
            </div>

            <label className="flex items-center gap-2 rounded-md border px-3 py-2 text-sm">
              <input
                type="checkbox"
                checked={form.clearQdrantApiKey}
                onChange={(event) =>
                  setForm((prev) => ({
                    ...prev,
                    clearQdrantApiKey: event.target.checked,
                    qdrantApiKey: event.target.checked ? "" : prev.qdrantApiKey,
                  }))}
              />
              {t("settingsCard.clearApiKeyLabel")}
            </label>
          </div>
        </section>

        <details className="group rounded-md border bg-muted/10 p-4">
          <summary className="flex cursor-pointer list-none flex-col gap-2 md:flex-row md:items-center md:justify-between">
            <div className="space-y-1">
              <div className="text-sm font-semibold">{t("settingsCard.advancedTitle")}</div>
              <div className="text-xs text-muted-foreground">
                {t("settingsCard.advancedHint")}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2 text-xs text-muted-foreground">
              <span className="group-open:hidden">{t("settingsCard.expand")}</span>
              <span className="hidden group-open:inline">{t("settingsCard.collapse")}</span>
              <ChevronDown className="h-4 w-4 transition-transform duration-200 group-open:rotate-180" />
            </div>
          </summary>

          <div className="mt-5 space-y-6">
            <section className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">{t("settingsCard.collectionSection")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("settingsCard.collectionHint")}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label={t("settingsCard.collectionModeLabel")}
                  value={form.collectionMode}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      collectionMode: value as "auto" | "manual",
                    }))}
                  options={[
                    { value: "auto", label: t("settingsCard.collectionModeAuto") },
                    { value: "manual", label: t("settingsCard.collectionModeManual") },
                  ]}
                />

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.collectionTagLabel")}</div>
                  <Input
                    value={form.collectionTag}
                    onChange={(event) => setForm((prev) => ({ ...prev, collectionTag: event.target.value }))}
                    placeholder={t("settingsCard.collectionTagPlaceholder")}
                  />
                  <div className="text-xs text-muted-foreground">
                    {t("settingsCard.collectionTagHint")}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">
                  {form.collectionMode === "auto" ? t("settingsCard.autoCollectionNameLabel") : t("settingsCard.manualCollectionNameLabel")}
                </div>
                {form.collectionMode === "auto" ? (
                  <div className="rounded-md border border-dashed bg-muted/20 p-3 font-mono text-xs break-all">
                    {collectionNameToDisplay}
                  </div>
                ) : (
                  <Input
                    value={form.collectionName}
                    onChange={(event) => setForm((prev) => ({ ...prev, collectionName: event.target.value }))}
                    placeholder={t("settingsCard.collectionNamePlaceholder")}
                  />
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <SelectField
                  label={t("settingsCard.autoReindexLabel")}
                  value={form.autoReindexOnChange ? "true" : "false"}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      autoReindexOnChange: value === "true",
                    }))}
                  options={[
                    { value: "true", label: t("settingsCard.on") },
                    { value: "false", label: t("settingsCard.off") },
                  ]}
                />

                <div className="rounded-md border bg-background p-3">
                  <div className="text-sm font-medium">{t("settingsCard.targetCollectionLabel")}</div>
                  <div className="mt-2 font-mono text-xs break-all">{collectionNameToDisplay}</div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">{t("settingsCard.connectionParamsSection")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("settingsCard.connectionParamsHint")}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <SelectField
                  label={t("settingsCard.ragStatusLabel")}
                  value={form.enabled ? "true" : "false"}
                  onValueChange={(value) =>
                    setForm((prev) => ({
                      ...prev,
                      enabled: value === "true",
                    }))}
                  options={[
                    { value: "true", label: t("settingsCard.enable") },
                    { value: "false", label: t("settingsCard.pause") },
                  ]}
                />

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.qdrantTimeoutLabel")}</div>
                  <Input
                    type="number"
                    min={1000}
                    max={300000}
                    value={form.qdrantTimeoutMs}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        qdrantTimeoutMs: parseNumberInput(event.target.value, prev.qdrantTimeoutMs),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.upsertMaxBytesLabel")}</div>
                  <Input
                    type="number"
                    min={1024 * 1024}
                    max={64 * 1024 * 1024}
                    value={form.qdrantUpsertMaxBytes}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        qdrantUpsertMaxBytes: parseNumberInput(event.target.value, prev.qdrantUpsertMaxBytes),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.upsertConcurrencyLabel")}</div>
                  <Input
                    type="number"
                    min={1}
                    max={16}
                    value={form.qdrantUpsertConcurrency}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        qdrantUpsertConcurrency: parseNumberInput(event.target.value, prev.qdrantUpsertConcurrency),
                      }))}
                  />
                  <div className="text-xs text-muted-foreground">
                    {t("settingsCard.upsertConcurrencyHint")}
                  </div>
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">{t("settingsCard.retrievalTuningSection")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("settingsCard.retrievalTuningHint")}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.chunkSizeLabel")}</div>
                  <Input
                    type="number"
                    min={200}
                    max={4000}
                    value={form.chunkSize}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        chunkSize: parseNumberInput(event.target.value, prev.chunkSize),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.chunkOverlapLabel")}</div>
                  <Input
                    type="number"
                    min={0}
                    max={1000}
                    value={form.chunkOverlap}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        chunkOverlap: parseNumberInput(event.target.value, prev.chunkOverlap),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.finalTopKLabel")}</div>
                  <Input
                    type="number"
                    min={1}
                    max={50}
                    value={form.finalTopK}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        finalTopK: parseNumberInput(event.target.value, prev.finalTopK),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.vectorCandidatesLabel")}</div>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={form.vectorCandidates}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        vectorCandidates: parseNumberInput(event.target.value, prev.vectorCandidates),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.keywordCandidatesLabel")}</div>
                  <Input
                    type="number"
                    min={1}
                    max={200}
                    value={form.keywordCandidates}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        keywordCandidates: parseNumberInput(event.target.value, prev.keywordCandidates),
                      }))}
                  />
                </div>
              </div>
            </section>

            <section className="space-y-4">
              <div className="space-y-1">
                <div className="text-sm font-medium">{t("settingsCard.embeddingBehaviorSection")}</div>
                <div className="text-xs text-muted-foreground">
                  {t("settingsCard.embeddingBehaviorHint")}
                </div>
              </div>

              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.embeddingBatchSizeLabel")}</div>
                  <Input
                    type="number"
                    min={1}
                    max={256}
                    value={form.embeddingBatchSize}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        embeddingBatchSize: parseNumberInput(event.target.value, prev.embeddingBatchSize),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.embeddingConcurrencyLabel")}</div>
                  <Input
                    type="number"
                    min={1}
                    max={16}
                    value={form.embeddingConcurrency}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        embeddingConcurrency: parseNumberInput(event.target.value, prev.embeddingConcurrency),
                      }))}
                  />
                  <div className="text-xs text-muted-foreground">
                    {t("settingsCard.embeddingConcurrencyHint")}
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.embeddingTimeoutLabel")}</div>
                  <Input
                    type="number"
                    min={5000}
                    max={300000}
                    value={form.embeddingTimeoutMs}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        embeddingTimeoutMs: parseNumberInput(event.target.value, prev.embeddingTimeoutMs),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.embeddingMaxRetriesLabel")}</div>
                  <Input
                    type="number"
                    min={0}
                    max={8}
                    value={form.embeddingMaxRetries}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        embeddingMaxRetries: parseNumberInput(event.target.value, prev.embeddingMaxRetries),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.embeddingRetryBaseLabel")}</div>
                  <Input
                    type="number"
                    min={100}
                    max={10000}
                    value={form.embeddingRetryBaseMs}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        embeddingRetryBaseMs: parseNumberInput(event.target.value, prev.embeddingRetryBaseMs),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.workerPollLabel")}</div>
                  <Input
                    type="number"
                    min={200}
                    max={60000}
                    value={form.workerPollMs}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        workerPollMs: parseNumberInput(event.target.value, prev.workerPollMs),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.workerMaxAttemptsLabel")}</div>
                  <Input
                    type="number"
                    min={1}
                    max={20}
                    value={form.workerMaxAttempts}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        workerMaxAttempts: parseNumberInput(event.target.value, prev.workerMaxAttempts),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.workerRetryBaseLabel")}</div>
                  <Input
                    type="number"
                    min={1000}
                    max={300000}
                    value={form.workerRetryBaseMs}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        workerRetryBaseMs: parseNumberInput(event.target.value, prev.workerRetryBaseMs),
                      }))}
                  />
                </div>

                <div className="space-y-2">
                  <div className="text-sm font-medium">{t("settingsCard.httpTimeoutLabel")}</div>
                  <Input
                    type="number"
                    min={1000}
                    max={300000}
                    value={form.httpTimeoutMs}
                    onChange={(event) =>
                      setForm((prev) => ({
                        ...prev,
                        httpTimeoutMs: parseNumberInput(event.target.value, prev.httpTimeoutMs),
                      }))}
                  />
                </div>
              </div>
            </section>
          </div>
        </details>

        <Button
          onClick={onSave}
          disabled={
            isSaving
            || modelQuery.isLoading
            || !form.embeddingModel.trim()
            || !collectionNameToDisplay.trim()
            || !form.qdrantUrl.trim()
          }
        >
          {isSaving ? t("settingsCard.saving") : t("settingsCard.save")}
        </Button>
      </CardContent>
    </Card>
  );
}
