import { useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { AlertTriangle, BookOpen, Check, FileText, Layers, Loader2, Pencil, Sparkles, X } from "lucide-react";
import {
  generateComicOutline,
  generateComicPanelScript,
  importComicSourceBundle,
  listComicEpisodes,
  updateComicEpisode,
  type ComicCharacter,
  type ComicEpisode,
  type ComicProject,
  type GenerateScriptPayload,
} from "@/api/comic";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { toast } from "@/components/ui/toast";

type DensityMode = NonNullable<GenerateScriptPayload["densityMode"]>;

const DENSITY_OPTIONS: Array<{ value: DensityMode; label: string; desc: string }> = [
  { value: "relaxed", label: "density.relaxed.label", desc: "density.relaxed.desc" },
  { value: "balanced", label: "density.balanced.label", desc: "density.balanced.desc" },
  { value: "compact", label: "density.compact.label", desc: "density.compact.desc" },
];

const DENSITY_LABELS: Record<DensityMode, string> = { relaxed: "density.relaxed.label", balanced: "density.balanced.label", compact: "density.compact.label" };

function parsePresetFormat(raw: string | null | undefined): string {
  if (!raw) return "webtoon";
  try {
    const parsed = JSON.parse(raw) as { format?: string };
    return parsed.format ?? "webtoon";
  } catch {
    return "webtoon";
  }
}

function parseScriptConfig(raw: string | null | undefined): {
  densityMode?: DensityMode;
  targetPanelCount?: number;
  comicFormat?: string;
  generatedAt?: string;
} {
  if (!raw) return {};
  try {
    return JSON.parse(raw);
  } catch {
    return {};
  }
}

function resolveTargetPanelCount(densityMode: DensityMode, format: string): number {
  if (format === "4koma") {
    if (densityMode === "relaxed") return 10;
    if (densityMode === "compact") return 16;
    return 12;
  }
  if (densityMode === "relaxed") return 30;
  if (densityMode === "compact") return 65;
  return 45;
}

// ─── Episode inline editor ──────────────────────────────────────────────────

function EpisodeCard({
  ep,
  isBusy,
  onGenerateScript,
}: {
  ep: ComicEpisode;
  isBusy: boolean;
  onGenerateScript: (ep: ComicEpisode) => void;
}) {
  const { t } = useTranslation("comic");
  const queryClient = useQueryClient();
  const [editing, setEditing] = useState(false);
  const [draftTitle, setDraftTitle] = useState(ep.title ?? "");
  const [draftOutline, setDraftOutline] = useState(ep.outline ?? "");
  const [draftCliffhanger, setDraftCliffhanger] = useState(ep.cliffhanger ?? "");
  const [draftPaywalled, setDraftPaywalled] = useState(ep.isPaywalled);
  const scriptConfig = parseScriptConfig(ep.scriptConfig);

  const saveMut = useMutation({
    mutationFn: () =>
      updateComicEpisode(ep.id, {
        title: draftTitle || undefined,
        outline: draftOutline || undefined,
        cliffhanger: draftCliffhanger || undefined,
        isPaywalled: draftPaywalled,
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comic", "episodes", ep.projectId] });
      setEditing(false);
      toast.success(t("toast.outlineSaved"));
    },
    onError: (e) => toast.error(String(e)),
  });

  const startEdit = () => {
    setDraftTitle(ep.title ?? "");
    setDraftOutline(ep.outline ?? "");
    setDraftCliffhanger(ep.cliffhanger ?? "");
    setDraftPaywalled(ep.isPaywalled);
    setEditing(true);
  };

  return (
    <Card className="rounded-md">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <CardTitle className="text-sm leading-snug">
            {t("episode.cardTitle", { order: ep.order, title: ep.title ? t("episode.titleQuoted", { title: ep.title }) : "" })}
          </CardTitle>
          <div className="flex shrink-0 gap-1">
            {ep.isPaywalled && <Badge variant="destructive" className="h-5 text-[10px]">{t("episode.paywallBadge")}</Badge>}
            <Badge variant="outline" className="h-5 text-[10px]">{t("panel.count", { count: ep._count?.panels ?? 0 })}</Badge>
            {!editing && (
              <button
                type="button"
                title={t("episode.editTitle")}
                onClick={startEdit}
                className="ml-1 rounded p-0.5 text-muted-foreground hover:bg-muted hover:text-foreground"
              >
                <Pencil className="h-3 w-3" />
              </button>
            )}
          </div>
        </div>

        {editing ? (
          <div className="mt-2 space-y-2">
            <div>
              <label className="mb-0.5 block text-[11px] text-muted-foreground">{t("episode.titleLabel")}</label>
              <input
                value={draftTitle}
                maxLength={30}
                onChange={(e) => setDraftTitle(e.target.value)}
                className="w-full rounded border bg-background px-2 py-1 text-xs"
                placeholder={t("episode.titlePlaceholder")}
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[11px] text-muted-foreground">{t("episode.outlineLabel")}</label>
              <textarea
                value={draftOutline}
                maxLength={1000}
                rows={4}
                onChange={(e) => setDraftOutline(e.target.value)}
                className="w-full resize-y rounded border bg-background px-2 py-1 text-xs leading-relaxed"
                placeholder={t("episode.outlinePlaceholder")}
              />
            </div>
            <div>
              <label className="mb-0.5 block text-[11px] text-muted-foreground">{t("episode.cliffhangerLabel")}</label>
              <input
                value={draftCliffhanger}
                maxLength={100}
                onChange={(e) => setDraftCliffhanger(e.target.value)}
                className="w-full rounded border bg-background px-2 py-1 text-xs"
                placeholder={t("episode.cliffhangerPlaceholder")}
              />
            </div>
            <label className="flex items-center gap-2 text-xs text-muted-foreground">
              <input
                type="checkbox"
                checked={draftPaywalled}
                onChange={(e) => setDraftPaywalled(e.target.checked)}
              />
              {t("episode.paywalledLabel")}
            </label>
            <div className="flex gap-2">
              <Button
                type="button"
                size="sm"
                disabled={saveMut.isPending}
                onClick={() => saveMut.mutate()}
                className="h-7 px-3 text-xs"
              >
                {saveMut.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Check className="h-3 w-3" />}
                {t("common.save")}
              </Button>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                disabled={saveMut.isPending}
                onClick={() => setEditing(false)}
                className="h-7 px-3 text-xs"
              >
                <X className="h-3 w-3" />
                {t("common.cancel")}
              </Button>
            </div>
          </div>
        ) : (
          <>
            {ep.outline && (
              <p className="mt-1 line-clamp-3 text-xs text-muted-foreground">{ep.outline}</p>
            )}
            {ep.cliffhanger && (
              <p className="mt-1 text-[11px] text-muted-foreground/70 italic">↳ {ep.cliffhanger}</p>
            )}
            {scriptConfig.densityMode && (
              <div className="mt-2 flex flex-wrap gap-1.5 text-[11px] text-muted-foreground">
                <span className="rounded border bg-muted/40 px-2 py-0.5">{t("episode.densityBadge", { label: t(DENSITY_LABELS[scriptConfig.densityMode]) })}</span>
                {scriptConfig.targetPanelCount ? (
                  <span className="rounded border bg-muted/40 px-2 py-0.5">{t("episode.approxPanels", { count: scriptConfig.targetPanelCount })}</span>
                ) : null}
              </div>
            )}
          </>
        )}
      </CardHeader>

      {!editing && (
        <CardContent className="pt-0">
          <Button
            type="button"
            size="sm"
            variant="outline"
            className="w-full"
            disabled={isBusy || !ep.outline}
            onClick={() => onGenerateScript(ep)}
          >
            {isBusy ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                {t("episode.generatingScript")}
              </>
            ) : (
              <>
                <BookOpen className="h-3.5 w-3.5" />
                {t("episode.generateScript")}
              </>
            )}
          </Button>
        </CardContent>
      )}
    </Card>
  );
}

// ─── Character readiness warning ─────────────────────────────────────────────

function CharacterReadinessWarning({ characters }: { characters: ComicCharacter[] }) {
  const { t } = useTranslation("comic");
  const withoutSheet = characters.filter((c) => {
    try {
      const sd = c.sheetData ? JSON.parse(c.sheetData) : {};
      return sd.status !== "done";
    } catch {
      return true;
    }
  });
  if (characters.length === 0 || withoutSheet.length === 0) return null;
  return (
    <div className="flex items-start gap-2.5 rounded-lg border border-amber-200 bg-amber-50 px-3 py-2.5 text-xs text-amber-800 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-300">
      <AlertTriangle className="mt-0.5 h-3.5 w-3.5 shrink-0" />
      <div>
        <span className="font-semibold">{t("episode.readinessTitle")}</span>
        <span className="ml-1">
          {t("episode.readinessDetail", { names: withoutSheet.map((c) => c.name).join(t("common.enumSeparator")) })}
        </span>
      </div>
    </div>
  );
}

// ─── Main component ──────────────────────────────────────────────────────────

export function EpisodeListPanel({
  projectId,
  project,
}: {
  projectId: string;
  project: ComicProject & { characters: ComicCharacter[] };
}) {
  const { t } = useTranslation("comic");
  const queryClient = useQueryClient();
  const [busyEpId, setBusyEpId] = useState("");
  const [densityMode, setDensityMode] = useState<DensityMode>("balanced");
  const [showPromptSettings, setShowPromptSettings] = useState(false);
  const [scriptPromptInstruction, setScriptPromptInstruction] = useState("");

  const { data: episodes = [], isLoading } = useQuery({
    queryKey: ["comic", "episodes", projectId],
    queryFn: () => listComicEpisodes(projectId),
  });

  const format = parsePresetFormat(project.stylePreset);
  const targetPanelCount = resolveTargetPanelCount(densityMode, format);

  const bundleMut = useMutation({
    mutationFn: () => importComicSourceBundle(projectId),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comic", "project", projectId] });
      toast.success(t("msg.sourceImported"));
    },
  });

  const outlineMut = useMutation({
    mutationFn: ({ startOrder, count }: { startOrder?: number; count?: number }) =>
      generateComicOutline(projectId, { startOrder, count }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["comic", "episodes", projectId] });
      toast.success(t("toast.outlineGenerated"));
    },
    onError: (e) => toast.error(String(e)),
  });

  const scriptMut = useMutation({
    mutationFn: ({ episodeId, payload }: { episodeId: string; payload: GenerateScriptPayload }) =>
      generateComicPanelScript(episodeId, payload),
    onMutate: ({ episodeId }) => setBusyEpId(episodeId),
    onSuccess: (ep) => {
      queryClient.invalidateQueries({ queryKey: ["comic", "episodes", projectId] });
      queryClient.invalidateQueries({ queryKey: ["comic", "panels", ep?.id] });
      toast.success(t("toast.scriptDone", { order: ep?.order ?? "?" }));
    },
    onError: (e) => toast.error(String(e)),
    onSettled: () => setBusyEpId(""),
  });

  const generateScript = (episode: ComicEpisode) => {
    if ((episode._count?.panels ?? 0) > 0) {
      const ok = window.confirm(t("episode.confirmRegenerate"));
      if (!ok) return;
    }
    scriptMut.mutate({
      episodeId: episode.id,
      payload: {
        targetPanelCount,
        densityMode,
        scriptPromptInstruction: scriptPromptInstruction.trim() || undefined,
      },
    });
  };

  return (
    <div className="space-y-4">
      <CharacterReadinessWarning characters={project.characters} />

      <div className="rounded-lg border bg-muted/20 p-3">
        <div className="flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
          <div className="flex flex-wrap gap-2">
            {!project.sourceBundle && (
              <Button
                type="button"
                size="sm"
                variant="outline"
                disabled={bundleMut.isPending}
                onClick={() => bundleMut.mutate()}
              >
                <Layers className="h-4 w-4" />
                {bundleMut.isPending ? t("action.importing") : t("action.importSource")}
              </Button>
            )}
            <Button
              type="button"
              size="sm"
              disabled={outlineMut.isPending || !project.sourceBundle}
              onClick={() => outlineMut.mutate({ startOrder: (episodes.length || 0) + 1, count: 12 })}
            >
              <Sparkles className="h-4 w-4" />
              {outlineMut.isPending ? t("common.generating") : t("episode.generateOutlineRange", { start: (episodes.length || 0) + 1, end: (episodes.length || 0) + 12 })}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={() => setShowPromptSettings((v) => !v)}
            >
              <FileText className="h-4 w-4" />
              {t("episode.scriptRequirements")}
            </Button>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs text-muted-foreground">{t("episode.infoDensity")}</span>
            <div className="flex rounded-md border bg-background p-0.5">
              {DENSITY_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  className={[
                    "rounded px-2.5 py-1 text-xs font-medium transition-colors",
                    densityMode === option.value ? "bg-primary text-primary-foreground" : "text-muted-foreground hover:bg-muted",
                  ].join(" ")}
                  onClick={() => setDensityMode(option.value)}
                  title={t(option.desc)}
                >
                  {t(option.label)}
                </button>
              ))}
            </div>
            <span className="text-xs text-muted-foreground">{t("episode.approxPanels", { count: targetPanelCount })}</span>
          </div>
        </div>

        {showPromptSettings && (
          <div className="mt-3 space-y-2">
            <textarea
              value={scriptPromptInstruction}
              maxLength={1000}
              onChange={(event) => setScriptPromptInstruction(event.target.value)}
              placeholder={t("episode.promptPlaceholder")}
              className="min-h-20 w-full resize-y rounded-md border bg-background px-3 py-2 text-xs leading-relaxed"
            />
            <div className="flex justify-between text-[11px] text-muted-foreground">
              <span>{t("episode.promptHint")}</span>
              <span>{scriptPromptInstruction.length}/1000</span>
            </div>
          </div>
        )}
      </div>

      {isLoading && <div className="py-8 text-center text-sm text-muted-foreground">{t("common.loading")}</div>}

      {!isLoading && episodes.length === 0 && (
        <div className="py-8 text-center text-sm text-muted-foreground">
          {t("episode.emptyOutline")}
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-2">
        {episodes.map((ep) => (
          <EpisodeCard
            key={ep.id}
            ep={ep}
            isBusy={busyEpId === ep.id}
            onGenerateScript={generateScript}
          />
        ))}
      </div>
    </div>
  );
}
