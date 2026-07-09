import { useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { GitCompareArrows, GitFork, Map, Network, Workflow } from "lucide-react";
import type { World, WorldSnapshot } from "@ai-novel/shared/types/world";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import KnowledgeBindingPanel from "@/components/knowledge/KnowledgeBindingPanel";
import SelectControl from "@/components/common/SelectControl";

interface WorldLibraryItem {
  id: string;
  name: string;
  description?: string | null;
  category: string;
  worldType?: string | null;
  usageCount: number;
  sourceWorldId?: string | null;
}

interface WorldAssetsTabProps {
  worldId: string;
  world?: World;
  selectedLayerPrimaryField: "background" | "magicSystem" | "politics" | "cultures" | "history" | "conflicts";
  libraryKeyword: string;
  setLibraryKeyword: Dispatch<SetStateAction<string>>;
  libraryCategory: string;
  setLibraryCategory: Dispatch<SetStateAction<string>>;
  publishName: string;
  setPublishName: Dispatch<SetStateAction<string>>;
  publishCategory: string;
  setPublishCategory: Dispatch<SetStateAction<string>>;
  publishDescription: string;
  setPublishDescription: Dispatch<SetStateAction<string>>;
  snapshotLabel: string;
  setSnapshotLabel: Dispatch<SetStateAction<string>>;
  diffFrom: string;
  setDiffFrom: Dispatch<SetStateAction<string>>;
  diffTo: string;
  setDiffTo: Dispatch<SetStateAction<string>>;
  importFormat: "json" | "markdown" | "text";
  setImportFormat: Dispatch<SetStateAction<"json" | "markdown" | "text">>;
  importContent: string;
  setImportContent: Dispatch<SetStateAction<string>>;
  libraryItems: WorldLibraryItem[];
  snapshots: WorldSnapshot[];
  diffChanges: Array<{ field: string; before: string | null; after: string | null }>;
  createSnapshotPending: boolean;
  publishPending: boolean;
  importPending: boolean;
  onRefreshLibrary: () => void;
  onInjectLibraryField: (libraryId: string) => void;
  onInjectLibraryStructure: (libraryId: string, targetCollection: "forces" | "locations") => void;
  onPublishLibrary: () => void;
  onCreateSnapshot: () => void;
  onRestoreSnapshot: (snapshotId: string) => void;
  onDiffSnapshots: () => void;
  onExport: (format: "markdown" | "json") => Promise<void>;
  onImport: () => void;
}

type AssetTool = "visualAssets" | "references" | "library" | "snapshots" | "export" | "import";

const WORLD_ASSET_PRESETS = [
  {
    icon: Map,
    title: "assets.preset.mapTitle",
    description: "assets.preset.mapDesc",
    readiness: "assets.preset.mapReadiness",
  },
  {
    icon: Network,
    title: "assets.preset.forceTitle",
    description: "assets.preset.forceDesc",
    readiness: "assets.preset.forceReadiness",
  },
  {
    icon: GitFork,
    title: "assets.preset.timelineTitle",
    description: "assets.preset.timelineDesc",
    readiness: "assets.preset.timelineReadiness",
  },
  {
    icon: GitCompareArrows,
    title: "assets.preset.relationTitle",
    description: "assets.preset.relationDesc",
    readiness: "assets.preset.relationReadiness",
  },
  {
    icon: Workflow,
    title: "assets.preset.powerTitle",
    description: "assets.preset.powerDesc",
    readiness: "assets.preset.powerReadiness",
  },
];

function AssetToolButton({
  label,
  description,
  selected,
  onClick,
}: {
  label: string;
  description: string;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      className={[
        "rounded-md border p-3 text-left transition-colors",
        selected ? "border-primary bg-primary/5" : "border-border/70 bg-background hover:bg-muted/40",
      ].join(" ")}
      onClick={onClick}
    >
      <div className="text-sm font-medium text-foreground">{label}</div>
      <div className="mt-1 text-xs leading-5 text-muted-foreground">{description}</div>
    </button>
  );
}

export default function WorldAssetsTab(props: WorldAssetsTabProps) {
  const { t } = useTranslation("worldsComponentsB");
  const [activeTool, setActiveTool] = useState<AssetTool>("visualAssets");
  const {
    selectedLayerPrimaryField,
    libraryKeyword,
    setLibraryKeyword,
    libraryCategory,
    setLibraryCategory,
    publishName,
    setPublishName,
    publishCategory,
    setPublishCategory,
    publishDescription,
    setPublishDescription,
    snapshotLabel,
    setSnapshotLabel,
    diffFrom,
    setDiffFrom,
    diffTo,
    setDiffTo,
    importFormat,
    setImportFormat,
    importContent,
    setImportContent,
    libraryItems,
    snapshots,
    diffChanges,
    createSnapshotPending,
    publishPending,
    importPending,
    onRefreshLibrary,
    onInjectLibraryField,
    onInjectLibraryStructure,
    onPublishLibrary,
    onCreateSnapshot,
    onRestoreSnapshot,
    onDiffSnapshots,
    onExport,
    onImport,
  } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("assets.cardTitle")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid gap-3 md:grid-cols-3 xl:grid-cols-6">
          <AssetToolButton
            label={t("assets.tool.visualLabel")}
            description={t("assets.tool.visualDesc")}
            selected={activeTool === "visualAssets"}
            onClick={() => setActiveTool("visualAssets")}
          />
          <AssetToolButton
            label={t("assets.tool.referencesLabel")}
            description={t("assets.tool.referencesDesc")}
            selected={activeTool === "references"}
            onClick={() => setActiveTool("references")}
          />
          <AssetToolButton
            label={t("assets.tool.libraryLabel")}
            description={t("assets.tool.libraryDesc")}
            selected={activeTool === "library"}
            onClick={() => setActiveTool("library")}
          />
          <AssetToolButton
            label={t("assets.tool.snapshotsLabel")}
            description={t("assets.tool.snapshotsDesc")}
            selected={activeTool === "snapshots"}
            onClick={() => setActiveTool("snapshots")}
          />
          <AssetToolButton
            label={t("assets.tool.exportLabel")}
            description={t("assets.tool.exportDesc")}
            selected={activeTool === "export"}
            onClick={() => setActiveTool("export")}
          />
          <AssetToolButton
            label={t("assets.tool.importLabel")}
            description={t("assets.tool.importDesc")}
            selected={activeTool === "import"}
            onClick={() => setActiveTool("import")}
          />
        </div>

        {activeTool === "visualAssets" ? (
          <div className="rounded-md border p-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="font-medium">{t("assets.planningTitle")}</div>
                <div className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t("assets.planningDesc")}
                </div>
              </div>
              <Badge variant="outline">{t("assets.reservedCapability")}</Badge>
            </div>
            <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-3">
              {WORLD_ASSET_PRESETS.map((asset) => {
                const Icon = asset.icon;
                return (
                  <div key={asset.title} className="rounded-md border border-dashed border-border/80 bg-muted/20 p-3">
                    <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                      <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                      {t(asset.title)}
                    </div>
                    <div className="mt-2 text-xs leading-5 text-muted-foreground">{t(asset.description)}</div>
                    <div className="mt-3 rounded-md bg-background p-2 text-xs leading-5 text-muted-foreground">
                      {t(asset.readiness)}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        ) : null}

        {activeTool === "references" ? (
          <div className="rounded-md border p-3">
            <div className="mb-3 font-medium">{t("assets.tool.referencesLabel")}</div>
            <KnowledgeBindingPanel targetType="world" targetId={props.worldId} title={t("assets.tool.referencesLabel")} />
          </div>
        ) : null}

        {activeTool === "library" ? (
          <div className="rounded-md border p-3 space-y-2">
            <div className="font-medium">{t("assets.tool.libraryLabel")}</div>
            <div className="grid gap-2 md:grid-cols-3">
              <Input
                placeholder={t("assets.keywordPlaceholder")}
                value={libraryKeyword}
                onChange={(event) => setLibraryKeyword(event.target.value)}
              />
              <SelectControl
                className="w-full rounded-md border bg-background p-2 text-sm"
                value={libraryCategory}
                onChange={(event) => setLibraryCategory(event.target.value)}
              >
                <option value="all">{t("assets.category.all")}</option>
                <option value="terrain">{t("assets.category.terrain")}</option>
                <option value="race">{t("assets.category.race")}</option>
                <option value="power_system">{t("assets.category.powerSystem")}</option>
                <option value="organization">{t("assets.category.organization")}</option>
                <option value="resource">{t("assets.category.resource")}</option>
                <option value="event">{t("assets.category.event")}</option>
                <option value="artifact">{t("assets.category.artifact")}</option>
                <option value="custom">{t("assets.category.custom")}</option>
              </SelectControl>
              <Button variant="outline" onClick={onRefreshLibrary}>
                {t("assets.refresh")}
              </Button>
            </div>
            <div className="rounded-md border p-2 space-y-2">
              <div className="text-xs font-semibold text-muted-foreground">
                {t("assets.saveCurrentAsAsset")}
              </div>
              <div className="grid gap-2 md:grid-cols-3">
                <Input
                  placeholder={t("assets.assetNamePlaceholder")}
                  value={publishName}
                  onChange={(event) => setPublishName(event.target.value)}
                />
                <SelectControl
                  className="w-full rounded-md border bg-background p-2 text-sm"
                  value={publishCategory}
                  onChange={(event) => setPublishCategory(event.target.value)}
                >
                  <option value="custom">{t("assets.category.custom")}</option>
                  <option value="terrain">{t("assets.category.terrain")}</option>
                  <option value="race">{t("assets.category.race")}</option>
                  <option value="power_system">{t("assets.category.powerSystem")}</option>
                  <option value="organization">{t("assets.category.organization")}</option>
                  <option value="resource">{t("assets.category.resource")}</option>
                  <option value="event">{t("assets.category.event")}</option>
                  <option value="artifact">{t("assets.category.artifact")}</option>
                </SelectControl>
                <Button onClick={onPublishLibrary} disabled={publishPending}>
                  {publishPending ? t("common.savingShort") : t("assets.saveAsset")}
                </Button>
              </div>
              <textarea
                className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
                value={publishDescription}
                onChange={(event) => setPublishDescription(event.target.value)}
                placeholder={t("assets.publishDescPlaceholder")}
              />
            </div>
            {libraryItems.map((item) => (
              <div key={item.id} className="rounded border p-3 text-sm space-y-2">
                <div className="flex items-center justify-between gap-2">
                  <div>
                    <div>{item.name}</div>
                    <div className="text-xs text-muted-foreground">
                      {t("assets.itemMeta", { category: item.category, count: item.usageCount })}
                    </div>
                  </div>
                </div>
                <div className="flex flex-wrap gap-2">
                  <Button size="sm" onClick={() => onInjectLibraryField(item.id)}>
                    {t("assets.injectField", { field: selectedLayerPrimaryField })}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onInjectLibraryStructure(item.id, "forces")}>
                    {t("assets.injectForces")}
                  </Button>
                  <Button size="sm" variant="outline" onClick={() => onInjectLibraryStructure(item.id, "locations")}>
                    {t("assets.injectLocations")}
                  </Button>
                </div>
              </div>
            ))}
          </div>
        ) : null}

        {activeTool === "snapshots" ? (
          <div className="rounded-md border p-3 space-y-2">
          <div className="font-medium">{t("assets.tool.snapshotsLabel")}</div>
          <div className="flex gap-2">
            <Input
              placeholder={t("assets.snapshotLabelPlaceholder")}
              value={snapshotLabel}
              onChange={(event) => setSnapshotLabel(event.target.value)}
            />
            <Button onClick={onCreateSnapshot} disabled={createSnapshotPending}>
              {t("assets.createSnapshot")}
            </Button>
          </div>
          {snapshots.map((snapshot) => (
            <div key={snapshot.id} className="flex items-center justify-between rounded border p-2 text-sm">
              <div>
                {snapshot.label ?? snapshot.id.slice(0, 8)} / {new Date(snapshot.createdAt).toLocaleString()}
              </div>
              <Button size="sm" variant="outline" onClick={() => onRestoreSnapshot(snapshot.id)}>
                {t("assets.restore")}
              </Button>
            </div>
          ))}
          <div className="grid gap-2 md:grid-cols-3">
            <SelectControl
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={diffFrom}
              onChange={(event) => setDiffFrom(event.target.value)}
            >
              <option value="">{t("assets.fromSnapshot")}</option>
              {snapshots.map((snapshot) => (
                <option key={`from-${snapshot.id}`} value={snapshot.id}>
                  {snapshot.label ?? snapshot.id.slice(0, 8)}
                </option>
              ))}
            </SelectControl>
            <SelectControl
              className="w-full rounded-md border bg-background p-2 text-sm"
              value={diffTo}
              onChange={(event) => setDiffTo(event.target.value)}
            >
              <option value="">{t("assets.toSnapshot")}</option>
              {snapshots.map((snapshot) => (
                <option key={`to-${snapshot.id}`} value={snapshot.id}>
                  {snapshot.label ?? snapshot.id.slice(0, 8)}
                </option>
              ))}
            </SelectControl>
            <Button onClick={onDiffSnapshots} disabled={!diffFrom || !diffTo}>
              {t("assets.diff")}
            </Button>
          </div>
          {diffChanges.map((change) => (
            <div key={change.field} className="rounded border p-2 text-xs">
              {change.field}: {change.before ?? t("assets.emptyValue")} {"->"} {change.after ?? t("assets.emptyValue")}
            </div>
          ))}
          </div>
        ) : null}

        {activeTool === "export" ? (
          <div className="rounded-md border p-3 space-y-2">
          <div className="font-medium">{t("assets.tool.exportLabel")}</div>
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => void onExport("markdown")}>
              {t("assets.exportMarkdown")}
            </Button>
            <Button variant="secondary" onClick={() => void onExport("json")}>
              {t("assets.exportJson")}
            </Button>
          </div>
          </div>
        ) : null}

        {activeTool === "import" ? (
          <div className="rounded-md border p-3 space-y-2">
          <div className="font-medium">{t("assets.tool.importLabel")}</div>
          <SelectControl
            className="w-full rounded-md border bg-background p-2 text-sm"
            value={importFormat}
            onChange={(event) => setImportFormat(event.target.value as "json" | "markdown" | "text")}
          >
            <option value="text">{t("assets.importFormat.text")}</option>
            <option value="markdown">Markdown</option>
            <option value="json">JSON</option>
          </SelectControl>
          <textarea
            className="min-h-[160px] w-full rounded-md border bg-background p-2 text-sm"
            value={importContent}
            onChange={(event) => setImportContent(event.target.value)}
            placeholder={t("assets.importContentPlaceholder")}
          />
          <Button onClick={onImport} disabled={importPending || !importContent.trim()}>
            {importPending ? t("assets.importing") : t("assets.import")}
          </Button>
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
