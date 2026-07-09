import { useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import {
  Image as ImageIcon,
  Loader2,
  MapPin,
  Plus,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  comicSceneImageUrl,
  createComicScene,
  deleteComicScene,
  generateComicSceneImage,
  listComicScenes,
  prepareComicSceneImage,
  updateComicScene,
  uploadComicSceneImage,
  type ComicScene,
  type SceneBible,
  type SceneSheetData,
  type SceneType,
} from "@/api/comic";
import { ImageGenerationConfirmDialog } from "@/components/image/ImageGenerationConfirmDialog";
import { useImageGenerationFlow } from "@/components/image/useImageGenerationFlow";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import SelectControl from "@/components/common/SelectControl";

const SCENE_TYPE_LABELS: Record<SceneType, string> = {
  interior: "sceneType.interior",
  exterior: "sceneType.exterior",
  landscape: "sceneType.landscape",
  abstract: "sceneType.abstract",
  other: "sceneType.other",
};

const BIBLE_FIELDS: Array<{ key: keyof SceneBible; label: string; placeholder: string }> = [
  { key: "palette", label: "bible.palette.label", placeholder: "bible.palette.placeholder" },
  { key: "keyElements", label: "bible.keyElements.label", placeholder: "bible.keyElements.placeholder" },
  { key: "materials", label: "bible.materials.label", placeholder: "bible.materials.placeholder" },
  { key: "ambiance", label: "bible.ambiance.label", placeholder: "bible.ambiance.placeholder" },
  { key: "layout", label: "bible.layout.label", placeholder: "bible.layout.placeholder" },
];

function parseBible(raw: string | null): SceneBible {
  if (!raw) return {};
  try { return JSON.parse(raw) as SceneBible; } catch { return {}; }
}

function parseSheetData(raw: string | null): SceneSheetData {
  if (!raw) return { status: "idle" };
  try { return JSON.parse(raw) as SceneSheetData; } catch { return { status: "idle" }; }
}

function SceneList({
  scenes,
  selectedId,
  onSelect,
}: {
  scenes: ComicScene[];
  selectedId: string;
  onSelect: (id: string) => void;
}) {
  const { t } = useTranslation("comic");
  return (
    <aside className="overflow-hidden rounded-lg border bg-background">
      <div className="border-b px-3 py-3">
        <p className="text-sm font-semibold">{t("sceneList.title")}</p>
        <p className="mt-0.5 text-xs text-muted-foreground">{t("sceneList.count", { count: scenes.length })}</p>
      </div>
      <div className="max-h-[640px] overflow-y-auto p-2">
        <div className="space-y-1">
          {scenes.map((scene) => {
            const sheet = parseSheetData(scene.sheetData);
            const hasSheet = sheet.status === "done";
            const isSelected = scene.id === selectedId;
            return (
              <button
                key={scene.id}
                type="button"
                className={[
                  "group w-full rounded-md border px-3 py-2 text-left transition-colors",
                  isSelected ? "border-primary bg-primary/10" : "border-transparent hover:border-border hover:bg-muted/60",
                ].join(" ")}
                onClick={() => onSelect(scene.id)}
              >
                <div className="flex items-start gap-2">
                  <div className="relative mt-0.5 flex h-8 w-10 shrink-0 items-center justify-center overflow-hidden rounded border bg-muted text-muted-foreground">
                    <MapPin className="h-4 w-4" />
                    {hasSheet && (
                      <img
                        src={comicSceneImageUrl(scene.id)}
                        alt={scene.name}
                        className="absolute inset-0 h-full w-full object-cover"
                        loading="lazy"
                        onError={(e) => { e.currentTarget.style.display = "none"; }}
                      />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-medium">{scene.name}</p>
                    <p className="mt-0.5 text-[10px] text-muted-foreground">
                      {t(SCENE_TYPE_LABELS[scene.sceneType])}
                      {hasSheet && <span className="ml-1.5 text-primary">{t("scene.hasSheet")}</span>}
                    </p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </aside>
  );
}

function SceneDetail({
  scene,
  projectId,
  provider,
  onChanged,
}: {
  scene: ComicScene;
  projectId: string;
  provider: string;
  onChanged: () => void;
}) {
  const { t } = useTranslation("comic");
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [name, setName] = useState(scene.name);
  const [sceneType, setSceneType] = useState<SceneType>(scene.sceneType);
  const [bible, setBible] = useState<SceneBible>(parseBible(scene.bible));
  const flow = useImageGenerationFlow();

  const sheet = parseSheetData(scene.sheetData);
  const hasSheet = sheet.status === "done";
  const isGenerating = sheet.status === "generating";

  const saveMut = useMutation({
    mutationFn: () => updateComicScene(scene.id, { name: name.trim(), sceneType, bible }),
    onSuccess: () => { onChanged(); toast.success(t("toast.sceneSaved")); },
    onError: (e) => toast.error(String(e)),
  });

  const startGenerate = () => {
    flow.start({
      prepare: () => prepareComicSceneImage(scene.id, provider || undefined),
      generate: (overrides) => generateComicSceneImage(scene.id, provider || undefined, overrides),
      onSuccess: () => onChanged(),
      onError: () => onChanged(),
    });
  };

  const uploadMut = useMutation({
    mutationFn: (file: File) => uploadComicSceneImage(scene.id, file),
    onSuccess: () => onChanged(),
    onError: (e) => toast.error(String(e)),
  });

  const deleteMut = useMutation({
    mutationFn: () => deleteComicScene(scene.id),
    onSuccess: () => onChanged(),
    onError: (e) => toast.error(String(e)),
  });

  const generatingBusy = flow.dialogProps.loading || flow.dialogProps.submitting || isGenerating;

  return (
    <>
      <ImageGenerationConfirmDialog {...flow.dialogProps} />
      <section className="min-w-0 overflow-hidden rounded-lg border bg-background">
      <div className="flex items-start justify-between gap-3 border-b px-4 py-4">
        <div className="min-w-0 flex-1 space-y-2">
          <input
            className="w-full rounded-md border bg-background px-3 py-1.5 text-base font-semibold"
            value={name}
            onChange={(e) => setName(e.target.value)}
          />
          <SelectControl
            className="rounded-md border bg-background px-2 py-1 text-xs"
            value={sceneType}
            onChange={(e) => setSceneType(e.target.value as SceneType)}
          >
            {Object.entries(SCENE_TYPE_LABELS).map(([v, l]) => (
              <option key={v} value={v}>{t(l)}</option>
            ))}
          </SelectControl>
        </div>
        <button
          type="button"
          title={t("scene.deleteTitle")}
          disabled={deleteMut.isPending}
          className="shrink-0 rounded border p-1.5 text-muted-foreground/50 hover:bg-destructive/10 hover:text-destructive disabled:opacity-50"
          onClick={() => deleteMut.mutate()}
        >
          <Trash2 className="h-4 w-4" />
        </button>
      </div>

      <div className="grid lg:grid-cols-[minmax(0,1fr)_minmax(280px,0.7fr)]">
        {/* Scene bible editor */}
        <div className="min-w-0 space-y-3 border-b p-4 lg:border-b-0 lg:border-r">
          <p className="text-sm font-medium">{t("scene.bibleTitle")}</p>
          <p className="text-xs text-muted-foreground">
            {t("scene.bibleHint")}
          </p>
          {BIBLE_FIELDS.map((field) => (
            <div key={field.key} className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">{t(field.label)}</label>
              <input
                className="w-full rounded-md border bg-background px-2.5 py-1.5 text-xs"
                placeholder={t(field.placeholder)}
                value={bible[field.key] ?? ""}
                onChange={(e) => setBible((b) => ({ ...b, [field.key]: e.target.value }))}
              />
            </div>
          ))}
          <Button
            type="button"
            size="sm"
            disabled={saveMut.isPending || !name.trim()}
            onClick={() => saveMut.mutate()}
          >
            {saveMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {t("scene.saveBible")}
          </Button>
        </div>

        {/* Concept art */}
        <aside className="min-w-0 p-4">
          <div className="mb-2 flex items-center justify-between">
            <p className="text-sm font-medium">{t("scene.sheetTitle")}</p>
            {sheet.origin && hasSheet && (
              <span className="text-[10px] text-muted-foreground">
                {sheet.origin === "uploaded" ? t("scene.uploaded") : t("scene.aiGenerated")}
              </span>
            )}
          </div>
          <div className="flex min-h-[180px] items-center justify-center overflow-hidden rounded-md border bg-muted/30">
            {hasSheet ? (
              <img
                src={comicSceneImageUrl(scene.id)}
                alt={scene.name}
                className="max-h-[280px] w-full object-contain"
                loading="lazy"
              />
            ) : generatingBusy ? (
              <div className="flex flex-col items-center gap-2 text-muted-foreground">
                <Loader2 className="h-7 w-7 animate-spin" />
                <span className="text-xs">{t("scene.sheetGenerating")}</span>
              </div>
            ) : (
              <div className="flex flex-col items-center gap-1.5 text-muted-foreground">
                <ImageIcon className="h-8 w-8 opacity-30" />
                <span className="text-xs">{t("scene.noSheet")}</span>
              </div>
            )}
          </div>
          {sheet.status === "error" && (
            <p className="mt-1.5 text-[11px] text-destructive">{sheet.error}</p>
          )}
          <p className="mt-2 text-[11px] text-muted-foreground">
            {t("scene.sheetHint")}
          </p>
          <div className="mt-2 flex gap-2">
            <Button
              type="button"
              size="sm"
              variant="outline"
              className="flex-1"
              disabled={generatingBusy || uploadMut.isPending}
              onClick={startGenerate}
            >
              {generatingBusy ? <Loader2 className="h-4 w-4 animate-spin" /> : <Sparkles className="h-4 w-4" />}
              {hasSheet ? t("scene.regenerate") : t("scene.aiGenerated")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              disabled={generatingBusy || uploadMut.isPending}
              onClick={() => fileInputRef.current?.click()}
            >
              {uploadMut.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Upload className="h-4 w-4" />}
              {t("common.upload")}
            </Button>
          </div>
          <input
            ref={fileInputRef}
            type="file"
            accept="image/png,image/jpeg,image/webp"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0];
              if (file) uploadMut.mutate(file);
              e.target.value = "";
            }}
          />
        </aside>
      </div>
      </section>
    </>
  );
}

export function ScenesPanel({
  project,
  provider,
}: {
  project: { id: string };
  provider: string;
}) {
  const { t } = useTranslation("comic");
  const queryClient = useQueryClient();
  const [selectedId, setSelectedId] = useState("");
  const [newName, setNewName] = useState("");
  const [showAdd, setShowAdd] = useState(false);

  const scenesKey = ["comic", "scenes", project.id];
  const { data: scenes = [], isLoading } = useQuery({
    queryKey: scenesKey,
    queryFn: () => listComicScenes(project.id),
  });

  const refresh = () => queryClient.invalidateQueries({ queryKey: scenesKey });

  const createMut = useMutation({
    mutationFn: () => createComicScene({ projectId: project.id, name: newName.trim() }),
    onSuccess: (scene) => {
      refresh();
      setSelectedId(scene.id);
      setNewName("");
      setShowAdd(false);
    },
    onError: (e) => toast.error(String(e)),
  });

  const selected = scenes.find((s) => s.id === selectedId) ?? scenes[0];

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">
          {t("scene.panelHint")}
        </p>
        <Button type="button" size="sm" variant="outline" onClick={() => setShowAdd((v) => !v)}>
          <Plus className="h-4 w-4" />
          {t("scene.addScene")}
        </Button>
      </div>

      {showAdd && (
        <div className="flex gap-2 rounded-md border bg-muted/20 p-3">
          <input
            className="flex-1 rounded border bg-background px-2 py-1 text-sm"
            placeholder={t("scene.namePlaceholder")}
            value={newName}
            onChange={(e) => setNewName(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter" && newName.trim()) createMut.mutate(); }}
          />
          <Button type="button" size="sm" disabled={!newName.trim() || createMut.isPending} onClick={() => createMut.mutate()}>
            {t("common.confirm")}
          </Button>
          <Button type="button" size="sm" variant="outline" onClick={() => { setShowAdd(false); setNewName(""); }}>
            {t("common.cancel")}
          </Button>
        </div>
      )}

      {isLoading ? (
        <div className="py-12 text-center text-sm text-muted-foreground">{t("common.loading")}</div>
      ) : scenes.length === 0 ? (
        <div className="space-y-2 py-12 text-center text-sm text-muted-foreground">
          <MapPin className="mx-auto h-10 w-10 opacity-30" />
          <p>{t("scene.empty")}</p>
          <p className="text-xs">{t("scene.emptyHint")}</p>
        </div>
      ) : (
        <div className="grid gap-4 lg:grid-cols-[240px_minmax(0,1fr)]">
          <SceneList scenes={scenes} selectedId={selected?.id ?? ""} onSelect={setSelectedId} />
          {selected && (
            <SceneDetail
              key={selected.id}
              scene={selected}
              projectId={project.id}
              provider={provider}
              onChanged={refresh}
            />
          )}
        </div>
      )}
    </div>
  );
}
