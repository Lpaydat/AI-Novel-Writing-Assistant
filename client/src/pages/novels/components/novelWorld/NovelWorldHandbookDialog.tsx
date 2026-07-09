import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, GitCompareArrows, GitFork, Library, Map, Network, Workflow } from "lucide-react";
import type {
  NovelWorldAssetSummary,
  NovelWorldHandbook,
  NovelWorldSummary,
  NovelWorldSyncDiff,
  NovelWorldSyncInput,
  NovelWorldSyncRecordSummary,
} from "@ai-novel/shared/types/novelWorld";
import { Button } from "@/components/ui/button";
import { AppDialogContent, Dialog } from "@/components/ui/dialog";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { cn } from "@/lib/utils";
import i18n from "@/i18n";
import { DetailDisclosure } from "../workspaceShell";
import {
  NovelWorldUsageDetails,
  type NovelWorldUsageCardProps,
  type NovelWorldUsageDraftState,
} from "../NovelWorldUsageCard";
import NovelWorldSourcePanel, { type WorldOption } from "./NovelWorldSourcePanel";

export type NovelWorldDialogTab = "overview" | "rules" | "guidance" | "usage" | "sync";

interface NovelWorldHandbookDialogProps {
  open: boolean;
  activeTab: NovelWorldDialogTab;
  onOpenChange: (open: boolean) => void;
  onTabChange: (tab: NovelWorldDialogTab) => void;
  novelWorld: NovelWorldSummary | null;
  handbook: NovelWorldHandbook | null;
  worldAssets: NovelWorldAssetSummary[];
  syncHistory: NovelWorldSyncRecordSummary[];
  syncDiff: NovelWorldSyncDiff | null;
  activeWorldName: string;
  worldOptions: WorldOption[];
  selectedWorldId: string;
  isImporting: boolean;
  isGenerating: boolean;
  isCreatingManual: boolean;
  isSavingToLibrary: boolean;
  isLoadingSyncDiff: boolean;
  isSyncing: boolean;
  selectedSyncSections: NovelWorldSyncInput["sections"];
  onSelectedSyncSectionsChange: (sections: NovelWorldSyncInput["sections"]) => void;
  onImport: Parameters<typeof NovelWorldSourcePanel>[0]["onImport"];
  onCreateManual: Parameters<typeof NovelWorldSourcePanel>[0]["onCreateManual"];
  onGenerate: Parameters<typeof NovelWorldSourcePanel>[0]["onGenerate"];
  onSaveToLibrary: () => void;
  onSync: (payload: NovelWorldSyncInput) => void;
  usageProps: NovelWorldUsageCardProps;
  usageDraft: NovelWorldUsageDraftState;
}

const ASSET_ICON_BY_TYPE: Record<NovelWorldAssetSummary["assetType"], typeof BookOpen> = {
  map: Map,
  faction_diagram: Network,
  timeline: GitFork,
  character_network: GitCompareArrows,
  power_system_tree: Workflow,
};

function labelSourceType(sourceType: string | null | undefined): string {
  switch (sourceType) {
    case "imported":
      return i18n.t("worldDialog.sourceType.imported", { ns: "novelsSetup" });
    case "generated":
      return i18n.t("worldDialog.sourceType.generated", { ns: "novelsSetup" });
    case "manual":
      return i18n.t("worldDialog.sourceType.manual", { ns: "novelsSetup" });
    default:
      return i18n.t("worldDialog.sourceType.unset", { ns: "novelsSetup" });
  }
}

function labelSyncDirection(direction: string | null | undefined): string {
  switch (direction) {
    case "push":
      return i18n.t("worldDialog.syncDirection.push", { ns: "novelsSetup" });
    case "pull":
      return i18n.t("worldDialog.syncDirection.pull", { ns: "novelsSetup" });
    case "bidirectional":
      return i18n.t("worldDialog.syncDirection.bidirectional", { ns: "novelsSetup" });
    default:
      return i18n.t("worldDialog.syncDirection.none", { ns: "novelsSetup" });
  }
}

function sectionLabel(section: string): string {
  switch (section) {
    case "profile":
      return i18n.t("worldDialog.section.profile", { ns: "novelsSetup" });
    case "rules":
      return i18n.t("worldDialog.section.rules", { ns: "novelsSetup" });
    case "factions":
      return i18n.t("worldDialog.section.factions", { ns: "novelsSetup" });
    case "forces":
      return i18n.t("worldDialog.section.forces", { ns: "novelsSetup" });
    case "locations":
      return i18n.t("worldDialog.section.locations", { ns: "novelsSetup" });
    case "relations":
      return i18n.t("worldDialog.section.relations", { ns: "novelsSetup" });
    default:
      return section;
  }
}

function labelAssetStatus(status: string, hasRenderData: boolean): string {
  if (hasRenderData || status === "ready") {
    return i18n.t("worldDialog.assetStatus.viewable", { ns: "novelsSetup" });
  }
  switch (status) {
    case "draft":
      return i18n.t("worldDialog.assetStatus.draft", { ns: "novelsSetup" });
    case "archived":
      return i18n.t("worldDialog.assetStatus.archived", { ns: "novelsSetup" });
    default:
      return i18n.t("worldDialog.assetStatus.pending", { ns: "novelsSetup" });
  }
}

function assetReadinessHint(assetType: NovelWorldAssetSummary["assetType"]): string {
  switch (assetType) {
    case "map":
      return i18n.t("worldDialog.assetHint.map", { ns: "novelsSetup" });
    case "faction_diagram":
      return i18n.t("worldDialog.assetHint.factionDiagram", { ns: "novelsSetup" });
    case "timeline":
      return i18n.t("worldDialog.assetHint.timeline", { ns: "novelsSetup" });
    case "character_network":
      return i18n.t("worldDialog.assetHint.characterNetwork", { ns: "novelsSetup" });
    case "power_system_tree":
      return i18n.t("worldDialog.assetHint.powerSystemTree", { ns: "novelsSetup" });
    default:
      return i18n.t("worldDialog.assetHint.default", { ns: "novelsSetup" });
  }
}

function formatSyncTime(value: string | null | undefined): string | null {
  if (!value) {
    return null;
  }
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return null;
  }
  return date.toLocaleString("zh-CN", {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function InlineMeta(props: { items: Array<string | null | undefined> }) {
  const items = props.items.filter((item): item is string => Boolean(item));
  if (!items.length) {
    return null;
  }
  return <div className="mt-3 text-xs leading-5 text-muted-foreground">{items.join(" · ")}</div>;
}

function SectionTitle(props: { title: string; description?: string }) {
  return (
    <div>
      <div className="text-base font-semibold text-foreground">{props.title}</div>
      {props.description ? <div className="mt-1 text-sm leading-6 text-muted-foreground">{props.description}</div> : null}
    </div>
  );
}

function EmptyLine(props: { children: string }) {
  return <div className="rounded-md border border-dashed border-border/70 px-3 py-2 text-sm text-muted-foreground">{props.children}</div>;
}

function WorldOverviewTab(props: {
  novelWorld: NovelWorldSummary | null;
  handbook: NovelWorldHandbook | null;
  activeWorldName: string;
}) {
  const { novelWorld, handbook } = props;
  const { t } = useTranslation("novelsSetup");

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle title={t("worldDialog.overview.title")} description={t("worldDialog.overview.description")} />
        <div className="mt-4 rounded-2xl bg-muted/15 p-5">
          <div className="text-xs text-muted-foreground">
            {novelWorld ? labelSourceType(novelWorld.sourceType) : t("worldDialog.overview.sourceUnset")} · {novelWorld?.hasStorySlice ? t("worldDialog.overview.sliceReady") : t("worldDialog.overview.slicePending")}
          </div>
          <div className="mt-2 text-2xl font-semibold text-foreground">{props.activeWorldName}</div>
          <div className="mt-3 max-w-4xl text-base leading-8 text-muted-foreground">
            {handbook?.summary ?? novelWorld?.coverSummary ?? t("worldDialog.overview.summaryFallback")}
          </div>
          <InlineMeta items={[
            handbook?.identity ? t("worldDialog.overview.identity", { value: handbook.identity }) : null,
            handbook?.tone ? t("worldDialog.overview.tone", { value: handbook.tone }) : null,
            ...(handbook?.themes.slice(0, 4) ?? []),
          ]} />
        </div>
      </section>

      <section className="grid gap-5 lg:grid-cols-2">
        <div>
          <SectionTitle title={t("worldDialog.overview.mainForces")} />
          <div className="mt-3 space-y-3">
            {(handbook?.forces.length ? handbook.forces : handbook?.factions ?? []).slice(0, 8).map((item) => (
              <div key={item.name} className="border-t border-border/50 pt-3 text-sm">
                <div className="font-medium text-foreground">{item.name}</div>
                <div className="mt-1 leading-6 text-muted-foreground">
                  {"pressure" in item && item.pressure ? item.pressure : null}
                  {"doctrine" in item && item.doctrine ? item.doctrine : null}
                  {"summary" in item && item.summary ? item.summary : null}
                  {"narrativeRole" in item && item.narrativeRole ? ` · ${item.narrativeRole}` : null}
                </div>
              </div>
            ))}
            {(!handbook || (handbook.forces.length === 0 && handbook.factions.length === 0)) ? <EmptyLine>{t("worldDialog.overview.noForces")}</EmptyLine> : null}
          </div>
        </div>
        <div>
          <SectionTitle title={t("worldDialog.overview.stage")} />
          <div className="mt-3 space-y-3">
            {handbook?.locations.slice(0, 8).map((location) => (
              <div key={location.name} className="border-t border-border/50 pt-3 text-sm">
                <div className="font-medium text-foreground">{location.name}</div>
                <div className="mt-1 leading-6 text-muted-foreground">
                  {location.narrativeFunction || location.summary || t("worldDialog.common.noDescription")}
                  {location.risk ? t("worldDialog.overview.risk", { value: location.risk }) : null}
                </div>
              </div>
            ))}
            {!handbook?.locations.length ? <EmptyLine>{t("worldDialog.overview.noStage")}</EmptyLine> : null}
          </div>
        </div>
      </section>
    </div>
  );
}

function RulesTab(props: { handbook: NovelWorldHandbook | null }) {
  const handbook = props.handbook;
  const { t } = useTranslation("novelsSetup");

  return (
    <div className="space-y-8">
      <section>
        <SectionTitle title={t("worldDialog.rules.title")} description={t("worldDialog.rules.description")} />
        <div className="mt-4 space-y-4">
          {handbook?.coreRules.length ? handbook.coreRules.map((rule) => (
            <div key={`${rule.name}-${rule.summary}`} className="border-t border-border/60 pt-4">
              <div className="text-sm font-medium text-foreground">{rule.name}</div>
              <div className="mt-1 text-sm leading-6 text-muted-foreground">{rule.summary || t("worldDialog.common.noDescription")}</div>
              <InlineMeta items={[
                rule.cost ? t("worldDialog.rules.cost", { value: rule.cost }) : null,
                rule.boundary ? t("worldDialog.rules.boundary", { value: rule.boundary }) : null,
              ]} />
            </div>
          )) : <EmptyLine>{t("worldDialog.rules.noRules")}</EmptyLine>}
        </div>
      </section>

      <section>
        <SectionTitle title={t("worldDialog.rules.tensionsTitle")} description={t("worldDialog.rules.tensionsDescription")} />
        <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
          {handbook?.tensions.length ? handbook.tensions.map((tension) => (
            <div key={tension} className="border-t border-border/50 pt-2">{tension}</div>
          )) : <EmptyLine>{t("worldDialog.rules.noTensions")}</EmptyLine>}
        </div>
      </section>
    </div>
  );
}

function GuidanceTab(props: { handbook: NovelWorldHandbook | null }) {
  const guidance = props.handbook?.generationGuidance ?? null;
  const { t } = useTranslation("novelsSetup");
  const groups = [
    { title: t("worldDialog.guidance.characterUses"), items: guidance?.characterUses ?? [] },
    { title: t("worldDialog.guidance.outlineUses"), items: guidance?.outlineUses ?? [] },
    { title: t("worldDialog.guidance.chapterUses"), items: guidance?.chapterUses ?? [] },
    { title: t("worldDialog.guidance.avoidUses"), items: guidance?.avoidUses ?? [] },
  ];

  return (
    <div className="space-y-6">
      <SectionTitle title={t("worldDialog.guidance.title")} description={t("worldDialog.guidance.description")} />
      <div className="grid gap-4 md:grid-cols-2">
        {groups.map((group) => (
          <section key={group.title} className="rounded-xl bg-muted/15 p-4">
            <div className="text-sm font-medium text-foreground">{group.title}</div>
            <div className="mt-3 space-y-2">
              {group.items.length > 0 ? group.items.slice(0, 6).map((item) => (
                <div key={item} className="text-sm leading-6 text-muted-foreground">{item}</div>
              )) : (
                <div className="text-sm leading-6 text-muted-foreground">{t("worldDialog.guidance.noHint")}</div>
              )}
            </div>
          </section>
        ))}
      </div>
    </div>
  );
}

function AssetsPanel(props: { worldAssets: NovelWorldAssetSummary[] }) {
  const { t } = useTranslation("novelsSetup");
  return (
    <section>
      <SectionTitle title={t("worldDialog.assets.title")} description={t("worldDialog.assets.description")} />
      {props.worldAssets.length > 0 ? (
        <div className="mt-4 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
          {props.worldAssets.map((asset) => {
            const Icon = ASSET_ICON_BY_TYPE[asset.assetType] ?? BookOpen;
            return (
              <div key={asset.assetType} className="rounded-xl bg-muted/15 p-3">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
                  {asset.title}
                </div>
                <div className="mt-2 text-xs leading-5 text-muted-foreground">{asset.description}</div>
                <div className="mt-2 text-xs leading-5 text-muted-foreground">{assetReadinessHint(asset.assetType)}</div>
                <div className="mt-3 text-xs text-muted-foreground">{labelAssetStatus(asset.status, asset.hasRenderData)}</div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="mt-3">
          <EmptyLine>{t("worldDialog.assets.empty")}</EmptyLine>
        </div>
      )}
    </section>
  );
}

function SyncPanel(props: Pick<NovelWorldHandbookDialogProps,
  "novelWorld" | "syncDiff" | "syncHistory" | "isLoadingSyncDiff" | "isSyncing" |
  "selectedSyncSections" | "onSelectedSyncSectionsChange" | "onSync"
>) {
  const { novelWorld, syncDiff } = props;
  const { t } = useTranslation("novelsSetup");
  const hasSyncDiff = Boolean(syncDiff?.differences.length);
  const effectiveSyncSections = props.selectedSyncSections && props.selectedSyncSections.length > 0
    ? props.selectedSyncSections
    : syncDiff?.differences.map((item) => item.section);
  const selectedSectionCount = effectiveSyncSections?.length ?? 0;

  if (!novelWorld?.sourceWorldId) {
    return null;
  }

  return (
    <section id="novel-world-sync">
      <SectionTitle
        title={t("worldDialog.sync.title")}
        description={t("worldDialog.sync.description")}
      />
      <div className="mt-4 grid gap-3 md:grid-cols-3">
        <div className="rounded-xl bg-muted/15 p-3">
          <div className="text-xs text-muted-foreground">{t("worldDialog.sync.diffCheckLabel")}</div>
          <div className="mt-1 text-sm font-medium text-foreground">
            {props.isLoadingSyncDiff ? t("worldDialog.sync.checking") : syncDiff ? t("worldDialog.sync.checkDone") : t("worldDialog.sync.checkWaiting")}
          </div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">
            {syncDiff?.differenceCount ? t("worldDialog.sync.diffCount", { count: syncDiff.differenceCount }) : syncDiff ? t("worldDialog.sync.noDiff") : t("worldDialog.sync.diffOnOpen")}
          </div>
        </div>
        <div className="rounded-xl bg-muted/15 p-3">
          <div className="text-xs text-muted-foreground">{t("worldDialog.sync.selectSectionLabel")}</div>
          <div className="mt-1 text-sm font-medium text-foreground">{hasSyncDiff ? t("worldDialog.sync.sectionCount", { count: selectedSectionCount }) : t("worldDialog.sync.noSelectionNeeded")}</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">{t("worldDialog.sync.selectSectionHint")}</div>
        </div>
        <div className="rounded-xl bg-muted/15 p-3">
          <div className="text-xs text-muted-foreground">{t("worldDialog.sync.manualLabel")}</div>
          <div className="mt-1 text-sm font-medium text-foreground">{novelWorld.syncEnabled ? labelSyncDirection(novelWorld.syncDirection) : t("worldDialog.sync.independentCopy")}</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">{t("worldDialog.sync.manualHint")}</div>
        </div>
      </div>

      {!syncDiff?.differences.length && novelWorld.syncPendingSummary ? (
        <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground whitespace-pre-line">
          {novelWorld.syncPendingSummary}
        </div>
      ) : null}

      {!novelWorld.syncEnabled ? (
        <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          {t("worldDialog.sync.independentNote")}
        </div>
      ) : null}

      {syncDiff?.canSync === false ? (
        <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          {syncDiff.reason ?? t("worldDialog.sync.cannotSync")}
        </div>
      ) : syncDiff?.differences.length ? (
        <div className="mt-4 space-y-3">
          <div className="grid gap-2 md:grid-cols-2">
            {syncDiff.differences.map((item) => {
              const checked = !props.selectedSyncSections?.length || props.selectedSyncSections.includes(item.section);
              return (
                <label key={item.section} className="flex items-start gap-3 rounded-md bg-muted/20 p-3 text-sm">
                  <input
                    type="checkbox"
                    className="mt-1"
                    checked={checked}
                    onChange={(event) => {
                      const current = props.selectedSyncSections && props.selectedSyncSections.length > 0
                        ? props.selectedSyncSections
                        : syncDiff.differences.map((diff) => diff.section);
                      props.onSelectedSyncSectionsChange(event.target.checked
                        ? Array.from(new Set([...current, item.section]))
                        : current.filter((section) => section !== item.section));
                    }}
                  />
                  <span>
                    <span className="font-medium text-foreground">{item.label}</span>
                    <span className="mt-1 block text-muted-foreground">{item.summary}</span>
                  </span>
                </label>
              );
            })}
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" disabled={props.isSyncing || !effectiveSyncSections?.length} onClick={() => props.onSync({ direction: "pull", sections: effectiveSyncSections })}>
              {props.isSyncing ? t("worldDialog.sync.syncing") : t("worldDialog.sync.pullUpdates")}
            </Button>
            <Button type="button" variant="secondary" disabled={props.isSyncing || !effectiveSyncSections?.length} onClick={() => props.onSync({ direction: "push", sections: effectiveSyncSections })}>
              {props.isSyncing ? t("worldDialog.sync.syncing") : t("worldDialog.sync.pushChanges")}
            </Button>
            <Button type="button" variant="outline" disabled={props.isSyncing} onClick={() => props.onSync({ direction: "none" })}>
              {t("worldDialog.sync.disableSync")}
            </Button>
          </div>
        </div>
      ) : !novelWorld.syncEnabled ? (
        <div className="mt-3 flex flex-wrap gap-2">
          <Button type="button" variant="outline" disabled={props.isSyncing} onClick={() => props.onSync({ direction: "pull" })}>
            {props.isSyncing ? t("worldDialog.sync.syncing") : t("worldDialog.sync.pullContent")}
          </Button>
          <Button type="button" variant="secondary" disabled={props.isSyncing} onClick={() => props.onSync({ direction: "push" })}>
            {props.isSyncing ? t("worldDialog.sync.syncing") : t("worldDialog.sync.pushWorld")}
          </Button>
        </div>
      ) : (
        <div className="mt-3 rounded-md border border-dashed p-3 text-sm text-muted-foreground">
          {t("worldDialog.sync.inSync")}
        </div>
      )}

      {props.syncHistory.length > 0 ? (
        <DetailDisclosure title={t("worldDialog.sync.historyTitle")} description={t("worldDialog.sync.historyDescription")} className="mt-4">
          <div className="space-y-2">
            {props.syncHistory.map((record) => (
              <div key={record.id} className="text-xs leading-5 text-muted-foreground">
                <span className="font-medium text-foreground">{record.direction === "pull" ? t("worldDialog.sync.pull") : t("worldDialog.sync.push")}</span>
                <span> · {formatSyncTime(record.createdAt) ?? record.createdAt}</span>
                {record.syncedSections.length > 0 ? <span> · {record.syncedSections.map(sectionLabel).join(t("worldDialog.sync.sectionSeparator"))}</span> : null}
                {record.diffSummary ? <span className="block">{record.diffSummary}</span> : null}
              </div>
            ))}
          </div>
        </DetailDisclosure>
      ) : null}
    </section>
  );
}

function SourceAndLibraryPanel(props: Pick<NovelWorldHandbookDialogProps,
  "novelWorld" | "worldOptions" | "selectedWorldId" | "isImporting" | "isGenerating" |
  "isCreatingManual" | "isSavingToLibrary" | "onImport" | "onCreateManual" | "onGenerate" | "onSaveToLibrary"
>) {
  const { t } = useTranslation("novelsSetup");
  return (
    <section>
      <SectionTitle title={t("worldDialog.source.title")} description={t("worldDialog.source.description")} />
      {props.novelWorld && !props.novelWorld.sourceWorldId ? (
        <div className="mt-4 flex flex-col gap-3 rounded-xl bg-muted/15 p-4 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-medium text-foreground">{t("worldDialog.source.saveToLibrary")}</div>
            <div className="mt-1 text-sm leading-6 text-muted-foreground">
              {t("worldDialog.source.saveToLibraryDesc")}
            </div>
          </div>
          <Button type="button" variant="secondary" disabled={props.isSavingToLibrary} onClick={() => props.onSaveToLibrary()}>
            <Library className="size-4" />
            {props.isSavingToLibrary ? t("worldDialog.source.saving") : t("worldDialog.source.saveToLibrary")}
          </Button>
        </div>
      ) : null}

      <DetailDisclosure
        title={t("worldDialog.source.chooseTitle")}
        description={t("worldDialog.source.chooseDescription")}
        meta={props.novelWorld ? t("worldDialog.source.metaSwap") : t("worldDialog.source.metaPending")}
        defaultOpen={!props.novelWorld}
        className="mt-4"
      >
        <div id="novel-world-source">
          <NovelWorldSourcePanel
            worldOptions={props.worldOptions}
            selectedWorldId={props.selectedWorldId}
            isImporting={props.isImporting}
            isGenerating={props.isGenerating}
            isCreatingManual={props.isCreatingManual}
            onImport={props.onImport}
            onCreateManual={props.onCreateManual}
            onGenerate={props.onGenerate}
          />
        </div>
      </DetailDisclosure>
    </section>
  );
}

export function NovelWorldHandbookDialog(props: NovelWorldHandbookDialogProps) {
  const { t } = useTranslation("novelsSetup");
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <AppDialogContent
        title={props.activeWorldName}
        description={t("worldDialog.dialogDescription")}
        className="h-[calc(100dvh-2rem)] max-w-[calc(100vw-2rem)] xl:max-w-7xl"
        bodyClassName="overflow-hidden p-0"
      >
        <Tabs value={props.activeTab} onValueChange={(value) => props.onTabChange(value as NovelWorldDialogTab)} className="grid h-full min-h-0 lg:grid-cols-[220px_minmax(0,1fr)]">
          <TabsList className={cn(
            "m-0 h-auto justify-start gap-1 overflow-x-auto rounded-none border-b bg-transparent p-3",
            "lg:flex lg:flex-col lg:items-stretch lg:overflow-visible lg:border-b-0 lg:border-r",
          )}>
            {[
              ["overview", "worldDialog.tab.overview"],
              ["rules", "worldDialog.tab.rules"],
              ["guidance", "worldDialog.tab.guidance"],
              ["usage", "worldDialog.tab.usage"],
              ["sync", "worldDialog.tab.sync"],
            ].map(([value, labelKey]) => (
              <TabsTrigger key={value} value={value} className="justify-start data-[state=active]:bg-muted">
                {t(labelKey)}
              </TabsTrigger>
            ))}
          </TabsList>
          <div className="min-h-0 overflow-y-auto px-5 py-5">
            <TabsContent value="overview" className="mt-0">
              <WorldOverviewTab novelWorld={props.novelWorld} handbook={props.handbook} activeWorldName={props.activeWorldName} />
            </TabsContent>
            <TabsContent value="rules" className="mt-0">
              <RulesTab handbook={props.handbook} />
            </TabsContent>
            <TabsContent value="guidance" className="mt-0">
              <GuidanceTab handbook={props.handbook} />
            </TabsContent>
            <TabsContent value="usage" className="mt-0">
              <NovelWorldUsageDetails {...props.usageProps} draft={props.usageDraft} />
            </TabsContent>
            <TabsContent value="sync" className="mt-0 space-y-8">
              {props.novelWorld?.sourceWorldId ? (
                <Button asChild size="sm" variant="outline">
                  <Link to={`/worlds/${props.novelWorld.sourceWorldId}/workspace`}>{t("worldDialog.openSourceHandbook")}</Link>
                </Button>
              ) : null}
              <AssetsPanel worldAssets={props.worldAssets} />
              <SyncPanel
                novelWorld={props.novelWorld}
                syncDiff={props.syncDiff}
                syncHistory={props.syncHistory}
                isLoadingSyncDiff={props.isLoadingSyncDiff}
                isSyncing={props.isSyncing}
                selectedSyncSections={props.selectedSyncSections}
                onSelectedSyncSectionsChange={props.onSelectedSyncSectionsChange}
                onSync={props.onSync}
              />
              <SourceAndLibraryPanel
                novelWorld={props.novelWorld}
                worldOptions={props.worldOptions}
                selectedWorldId={props.selectedWorldId}
                isImporting={props.isImporting}
                isGenerating={props.isGenerating}
                isCreatingManual={props.isCreatingManual}
                isSavingToLibrary={props.isSavingToLibrary}
                onImport={props.onImport}
                onCreateManual={props.onCreateManual}
                onGenerate={props.onGenerate}
                onSaveToLibrary={props.onSaveToLibrary}
              />
            </TabsContent>
          </div>
        </Tabs>
      </AppDialogContent>
    </Dialog>
  );
}
