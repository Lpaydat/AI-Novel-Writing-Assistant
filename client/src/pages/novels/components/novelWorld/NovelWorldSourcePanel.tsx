import { useState } from "react";
import { useTranslation } from "react-i18next";
import { BookOpen, Download, Sparkles } from "lucide-react";
import type {
  NovelWorldGenerateInput,
  NovelWorldImportInput,
  NovelWorldManualInput,
} from "@ai-novel/shared/types/novelWorld";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import SelectControl from "@/components/common/SelectControl";

export interface WorldOption {
  id: string;
  name: string;
}

interface NovelWorldSourcePanelProps {
  worldOptions: WorldOption[];
  selectedWorldId: string;
  isImporting: boolean;
  isGenerating: boolean;
  isCreatingManual: boolean;
  onImport: (payload: NovelWorldImportInput) => void;
  onCreateManual: (payload?: NovelWorldManualInput) => void;
  onGenerate: (payload: NovelWorldGenerateInput) => void;
}

type WorldSetupMode = "generate" | "import" | "manual";

function WorldSetupChoice({
  icon: Icon,
  title,
  description,
  selected,
  onSelect,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  selected: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      className={[
        "rounded-md border p-3 text-left transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border/70 bg-background hover:bg-muted/40",
      ].join(" ")}
      onClick={onSelect}
    >
      <div className="flex items-center gap-2 text-sm font-medium text-foreground">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        {title}
      </div>
      <div className="mt-2 text-xs leading-5 text-muted-foreground">{description}</div>
    </button>
  );
}

export default function NovelWorldSourcePanel(props: NovelWorldSourcePanelProps) {
  const { t } = useTranslation("novelsSetup");
  const [selectedImportWorldId, setSelectedImportWorldId] = useState(props.selectedWorldId);
  const [syncEnabled, setSyncEnabled] = useState(false);
  const [saveGeneratedToLibrary, setSaveGeneratedToLibrary] = useState(false);
  const [manualWorldTitle, setManualWorldTitle] = useState("");
  const [manualWorldSummary, setManualWorldSummary] = useState("");
  const [worldSetupMode, setWorldSetupMode] = useState<WorldSetupMode>("generate");

  return (
    <>
      <div id="novel-world-source" className="rounded-lg border border-border/70 bg-muted/20 p-4">
        <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">{t("worldSource.chooseTitle")}</div>
            <div className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("worldSource.chooseDescription")}
            </div>
          </div>
          <Badge variant="outline">{t("worldSource.bookCopyBadge")}</Badge>
        </div>
        <div className="mt-3 grid gap-3 lg:grid-cols-3">
          <WorldSetupChoice
            icon={Sparkles}
            title={t("worldSource.generate.title")}
            description={t("worldSource.generate.choiceDescription")}
            selected={worldSetupMode === "generate"}
            onSelect={() => setWorldSetupMode("generate")}
          />
          <WorldSetupChoice
            icon={Download}
            title={t("worldSource.import.title")}
            description={t("worldSource.import.choiceDescription")}
            selected={worldSetupMode === "import"}
            onSelect={() => setWorldSetupMode("import")}
          />
          <WorldSetupChoice
            icon={BookOpen}
            title={t("worldSource.manual.title")}
            description={t("worldSource.manual.choiceDescription")}
            selected={worldSetupMode === "manual"}
            onSelect={() => setWorldSetupMode("manual")}
          />
        </div>
      </div>

      {worldSetupMode === "import" ? (
        <div className="rounded-lg border border-border/70 bg-background p-4">
          <div className="text-sm font-medium text-foreground">{t("worldSource.import.title")}</div>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("worldSource.import.panelDescription")}
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-[minmax(0,1fr)_auto]">
            <SelectControl
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={selectedImportWorldId}
              onChange={(event) => setSelectedImportWorldId(event.target.value)}
            >
              <option value="">{t("worldSource.import.selectPlaceholder")}</option>
              {props.worldOptions.map((world) => (
                <option key={world.id} value={world.id}>{world.name}</option>
              ))}
            </SelectControl>
            <Button
              type="button"
              onClick={() => props.onImport({
                worldId: selectedImportWorldId,
                syncEnabled,
                syncDirection: syncEnabled ? "bidirectional" : "none",
              })}
              disabled={!selectedImportWorldId || props.isImporting}
            >
              <Download className="size-4" />
              {props.isImporting ? t("worldSource.import.importing") : t("worldSource.import.importButton")}
            </Button>
          </div>
          <label className="mt-3 flex items-start gap-3 text-sm text-muted-foreground">
            <input
              type="checkbox"
              className="mt-1"
              checked={syncEnabled}
              onChange={(event) => setSyncEnabled(event.target.checked)}
            />
            <span>{t("worldSource.import.keepSyncNote")}</span>
          </label>
        </div>
      ) : null}

      {worldSetupMode === "generate" ? (
        <div className="rounded-lg border border-border/70 bg-background p-4">
          <div className="text-sm font-medium text-foreground">{t("worldSource.generate.panelTitle")}</div>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("worldSource.generate.panelDescription")}
          </div>
          <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
            <label className="flex items-start gap-3 text-sm text-muted-foreground">
              <input
                type="checkbox"
                className="mt-1"
                checked={saveGeneratedToLibrary}
                onChange={(event) => setSaveGeneratedToLibrary(event.target.checked)}
              />
              <span>{t("worldSource.generate.saveToLibraryNote")}</span>
            </label>
            <Button
              type="button"
              variant="secondary"
              onClick={() => props.onGenerate({ saveToLibrary: saveGeneratedToLibrary })}
              disabled={props.isGenerating || props.isCreatingManual}
            >
              <Sparkles className="size-4" />
              {props.isGenerating ? t("worldSource.generate.generating") : t("worldSource.generate.generateButton")}
            </Button>
          </div>
        </div>
      ) : null}

      {worldSetupMode === "manual" ? (
        <div className="rounded-lg border border-border/70 bg-background p-4">
          <div className="text-sm font-medium text-foreground">{t("worldSource.manual.panelTitle")}</div>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("worldSource.manual.panelDescription")}
          </div>
          <div className="mt-3 grid gap-3 lg:grid-cols-2">
            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground">{t("worldSource.manual.nameLabel")}</span>
              <input
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={manualWorldTitle}
                maxLength={80}
                placeholder={t("worldSource.manual.namePlaceholder")}
                onChange={(event) => setManualWorldTitle(event.target.value)}
              />
            </label>
            <label className="space-y-1 text-sm">
              <span className="font-medium text-foreground">{t("worldSource.manual.summaryLabel")}</span>
              <input
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={manualWorldSummary}
                maxLength={300}
                placeholder={t("worldSource.manual.summaryPlaceholder")}
                onChange={(event) => setManualWorldSummary(event.target.value)}
              />
            </label>
          </div>
          <div className="mt-3 flex justify-end">
            <Button
              type="button"
              variant="outline"
              onClick={() => props.onCreateManual({
                title: manualWorldTitle.trim() || undefined,
                coverSummary: manualWorldSummary.trim() || undefined,
              })}
              disabled={props.isCreatingManual || props.isGenerating}
            >
              <BookOpen className="size-4" />
              {props.isCreatingManual ? t("worldSource.manual.creating") : t("worldSource.manual.panelTitle")}
            </Button>
          </div>
        </div>
      ) : null}
    </>
  );
}
