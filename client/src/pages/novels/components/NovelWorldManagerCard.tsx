import { useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { ArrowRight, BookOpen, Map, Network, Workflow } from "lucide-react";
import type {
  NovelWorldSyncDiff,
  NovelWorldSyncInput,
  NovelWorldView,
} from "@ai-novel/shared/types/novelWorld";
import type { StoryWorldSliceOverrides, StoryWorldSliceView } from "@ai-novel/shared/types/storyWorldSlice";
import { Button } from "@/components/ui/button";
import NovelWorldSourcePanel, { type WorldOption } from "./novelWorld/NovelWorldSourcePanel";
import { formatLocaleDateTime } from "@/i18n/format";
import {
  NovelWorldHandbookDialog,
  type NovelWorldDialogTab,
} from "./novelWorld/NovelWorldHandbookDialog";
import {
  NovelWorldUsageSummary,
  useNovelWorldUsageDraft,
  type NovelWorldUsageCardProps,
} from "./NovelWorldUsageCard";
import { DetailDisclosure } from "./workspaceShell";

interface NovelWorldManagerCardProps {
  view?: NovelWorldView | null;
  syncDiff?: NovelWorldSyncDiff | null;
  worldOptions: WorldOption[];
  selectedWorldId: string;
  isLoading: boolean;
  isImporting: boolean;
  isGenerating: boolean;
  isCreatingManual: boolean;
  isSavingToLibrary: boolean;
  isLoadingSyncDiff: boolean;
  isSyncing: boolean;
  usageView?: StoryWorldSliceView | null;
  usageMessage: string;
  isRefreshingWorldSlice: boolean;
  isSavingWorldSliceOverrides: boolean;
  onImport: Parameters<typeof NovelWorldSourcePanel>[0]["onImport"];
  onCreateManual: Parameters<typeof NovelWorldSourcePanel>[0]["onCreateManual"];
  onGenerate: Parameters<typeof NovelWorldSourcePanel>[0]["onGenerate"];
  onSaveToLibrary: () => void;
  onSync: (payload: NovelWorldSyncInput) => void;
  onRefreshWorldSlice: () => void;
  onSaveWorldSliceOverrides: (patch: StoryWorldSliceOverrides) => void;
}

function labelSourceType(t: TFunction, sourceType: string | null | undefined): string {
  switch (sourceType) {
    case "imported":
      return t("worldManager.sourceType.imported");
    case "generated":
      return t("worldManager.sourceType.generated");
    case "manual":
      return t("worldManager.sourceType.manual");
    default:
      return t("worldManager.sourceType.unset");
  }
}

function labelSyncDirection(t: TFunction, direction: string | null | undefined): string {
  switch (direction) {
    case "push":
      return t("worldManager.syncDirection.push");
    case "pull":
      return t("worldManager.syncDirection.pull");
    case "bidirectional":
      return t("worldManager.syncDirection.bidirectional");
    default:
      return t("worldManager.syncDirection.none");
  }
}

function sectionLabel(t: TFunction, section: string): string {
  switch (section) {
    case "profile":
      return t("worldManager.section.profile");
    case "rules":
      return t("worldManager.section.rules");
    case "factions":
      return t("worldManager.section.factions");
    case "forces":
      return t("worldManager.section.forces");
    case "locations":
      return t("worldManager.section.locations");
    case "relations":
      return t("worldManager.section.relations");
    default:
      return section;
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
  return formatLocaleDateTime(date, undefined, {
    month: "2-digit",
    day: "2-digit",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function firstText(items: Array<string | null | undefined>, fallback: string): string {
  return items.find((item) => Boolean(item)) ?? fallback;
}

function inlineText(items: Array<string | null | undefined>): string | null {
  const compact = items.filter((item): item is string => Boolean(item));
  return compact.length ? compact.join(" · ") : null;
}

function WorldSignal(props: {
  icon: typeof BookOpen;
  label: string;
  count: number;
  sample: string;
}) {
  const Icon = props.icon;

  return (
    <div className="rounded-xl bg-background/75 p-3 shadow-sm ring-1 ring-border/30">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="h-3.5 w-3.5 text-primary" aria-hidden="true" />
        {props.label}
      </div>
      <div className="mt-2 text-xl font-semibold text-foreground">{props.count}</div>
      <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{props.sample}</div>
    </div>
  );
}

function GenerationChain() {
  const { t } = useTranslation("novelsEditC");
  const chain = [
    t("worldManager.chain.bookWorld"),
    t("worldManager.chain.character"),
    t("worldManager.chain.outline"),
    t("worldManager.chain.chapter"),
  ];
  return (
    <div className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
      {chain.map((item, index, array) => (
        <span key={item} className="flex items-center gap-2">
          <span className="rounded-full bg-background/80 px-2 py-1 shadow-sm ring-1 ring-border/25">{item}</span>
          {index < array.length - 1 ? <ArrowRight className="h-3.5 w-3.5" aria-hidden="true" /> : null}
        </span>
      ))}
    </div>
  );
}

export default function NovelWorldManagerCard(props: NovelWorldManagerCardProps) {
  const { t } = useTranslation("novelsEditC");
  const [selectedSyncSections, setSelectedSyncSections] = useState<NovelWorldSyncInput["sections"]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [dialogTab, setDialogTab] = useState<NovelWorldDialogTab>("overview");
  const novelWorld = props.view?.novelWorld ?? null;
  const handbook = props.view?.handbook ?? null;
  const worldAssets = props.view?.assets ?? [];
  const syncHistory = props.view?.syncHistory ?? [];
  const syncDiff = props.syncDiff ?? null;
  const usageProps = useMemo<NovelWorldUsageCardProps>(() => ({
    view: props.usageView,
    message: props.usageMessage,
    isRefreshing: props.isRefreshingWorldSlice,
    isSaving: props.isSavingWorldSliceOverrides,
    onRefresh: props.onRefreshWorldSlice,
    onSave: props.onSaveWorldSliceOverrides,
  }), [
    props.usageView,
    props.usageMessage,
    props.isRefreshingWorldSlice,
    props.isSavingWorldSliceOverrides,
    props.onRefreshWorldSlice,
    props.onSaveWorldSliceOverrides,
  ]);
  const usageDraft = useNovelWorldUsageDraft(usageProps);

  const activeWorldName = useMemo(() => {
    const id = novelWorld?.sourceWorldId ?? props.selectedWorldId;
    return props.worldOptions.find((item) => item.id === id)?.name ?? novelWorld?.title ?? t("worldManager.noWorldSelected");
  }, [novelWorld?.sourceWorldId, novelWorld?.title, props.selectedWorldId, props.worldOptions, t]);
  const writingStatus = novelWorld
    ? novelWorld.hasStorySlice
      ? t("worldManager.writingStatus.organized")
      : t("worldManager.writingStatus.needsOrganize")
    : t("worldManager.writingStatus.noWorld");
  const syncStatus = novelWorld?.syncEnabled
    ? labelSyncDirection(t, novelWorld.syncDirection)
    : novelWorld?.sourceWorldId
      ? t("worldManager.syncStatus.bookCopy")
      : t("worldManager.syncStatus.internal");
  const lastSyncedAtText = formatSyncTime(novelWorld?.lastSyncedAt);
  const pendingSections = syncDiff?.differences.length
    ? syncDiff.differences.map((item) => item.section)
    : novelWorld?.syncPendingSections ?? [];
  const pendingSectionText = pendingSections.length > 0 ? pendingSections.map((section) => sectionLabel(t, section)).join(t("worldManager.listSeparator")) : null;
  const hasSyncDiff = Boolean(syncDiff?.differences.length);
  const forces = handbook?.forces.length ? handbook.forces : handbook?.factions ?? [];
  const summaryText = handbook?.summary
    ?? novelWorld?.coverSummary
    ?? (novelWorld ? t("worldManager.summaryOrganizing") : t("worldManager.summaryNoWorld"));
  const themeLine = inlineText([
    handbook?.identity ? t("worldManager.identityLine", { value: handbook.identity }) : null,
    handbook?.tone ? t("worldManager.toneLine", { value: handbook.tone }) : null,
    ...(handbook?.themes.slice(0, 4) ?? []),
  ]);

  const openDialog = (tab: NovelWorldDialogTab) => {
    setDialogTab(tab);
    setDialogOpen(true);
  };

  return (
    <section className="space-y-5">
      <section className="overflow-hidden rounded-2xl bg-muted/10 shadow-sm ring-1 ring-border/35">
        <div className="grid gap-5 p-5 xl:grid-cols-[minmax(0,1.25fr)_420px]">
          <div className="min-w-0">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 text-xs text-muted-foreground">
              {props.isLoading ? <span>{t("worldManager.loading")}</span> : null}
              <span>{novelWorld ? labelSourceType(t, novelWorld.sourceType) : t("worldManager.sourceUnset")}</span>
              <span>{writingStatus}</span>
              <span>{syncStatus}</span>
              {lastSyncedAtText ? <span>{t("worldManager.syncedAt", { value: lastSyncedAtText })}</span> : null}
              {pendingSectionText ? <span>{t("worldManager.pendingText", { value: pendingSectionText })}</span> : null}
            </div>
            <div className="mt-3 flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="min-w-0">
                <div className="text-sm text-muted-foreground">{t("worldManager.bookWorld")}</div>
                <h2 className="mt-1 truncate text-3xl font-semibold tracking-normal text-foreground">{activeWorldName}</h2>
              </div>
              <div className="flex shrink-0 flex-wrap gap-2">
                {novelWorld ? (
                  <>
                    <Button type="button" onClick={() => openDialog("overview")}>
                      {t("worldManager.openHandbook")}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => openDialog("usage")}>
                      {t("worldManager.organizeUsage")}
                    </Button>
                  </>
                ) : (
                  <Button asChild>
                    <a href="#novel-world-source">{t("worldManager.selectOrGenerate")}</a>
                  </Button>
                )}
                {hasSyncDiff ? (
                  <Button type="button" variant="outline" onClick={() => openDialog("sync")}>
                    {t("worldManager.handleSyncDiff")}
                  </Button>
                ) : null}
              </div>
            </div>

            <div className="mt-5 max-w-4xl text-lg leading-8 text-foreground/85">
              {summaryText}
            </div>
            {themeLine ? <div className="mt-3 text-sm leading-6 text-muted-foreground">{themeLine}</div> : null}

            <div className="mt-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-4">
              <WorldSignal
                icon={BookOpen}
                label={t("worldManager.signal.coreRules")}
                count={handbook?.coreRules.length ?? 0}
                sample={handbook?.coreRules[0]?.name ?? t("worldManager.signal.awaitingRules")}
              />
              <WorldSignal
                icon={Network}
                label={t("worldManager.signal.mainForces")}
                count={forces.length}
                sample={forces[0]?.name ?? t("worldManager.signal.awaitingForces")}
              />
              <WorldSignal
                icon={Map}
                label={t("worldManager.signal.storyStage")}
                count={handbook?.locations.length ?? 0}
                sample={handbook?.locations[0]?.name ?? t("worldManager.signal.awaitingLocations")}
              />
              <WorldSignal
                icon={Workflow}
                label={t("worldManager.signal.keyTensions")}
                count={handbook?.tensions.length ?? 0}
                sample={handbook?.tensions[0] ?? t("worldManager.signal.awaitingTensions")}
              />
            </div>

            <div className="mt-6 flex flex-col gap-3 rounded-xl bg-background/70 px-4 py-3 lg:flex-row lg:items-center lg:justify-between">
              <div>
                <div className="text-sm font-medium text-foreground">{t("worldManager.chainReadsWorld")}</div>
                <div className="mt-1 text-xs leading-5 text-muted-foreground">
                  {novelWorld?.hasStorySlice
                    ? t("worldManager.chainHasSlice")
                    : t("worldManager.chainNoSlice")}
                </div>
              </div>
              <GenerationChain />
            </div>
          </div>

          <aside className="space-y-4 rounded-2xl bg-background/65 p-4 shadow-sm ring-1 ring-border/30">
            <div>
              <div className="text-sm font-medium text-foreground">{t("worldManager.constraintBar")}</div>
              <div className="mt-1 text-sm leading-6 text-muted-foreground">
                {firstText([
                  props.usageView?.slice?.coreWorldFrame,
                  handbook?.generationGuidance?.chapterUses[0],
                  novelWorld?.hasStorySlice ? t("worldManager.chapterReadsScope") : null,
                ], t("worldManager.constraintPlaceholder"))}
              </div>
            </div>
            <div className="grid gap-3 text-sm">
              {[
                { label: t("worldManager.miniStat.rules"), value: props.usageView?.slice?.appliedRules.length ?? handbook?.coreRules.length ?? 0 },
                { label: t("worldManager.miniStat.forces"), value: props.usageView?.slice?.activeForces.length ?? forces.length },
                { label: t("worldManager.miniStat.locations"), value: props.usageView?.slice?.activeLocations.length ?? handbook?.locations.length ?? 0 },
                { label: t("worldManager.miniStat.pressure"), value: props.usageView?.slice?.pressureSources.length ?? handbook?.tensions.length ?? 0 },
              ].map((item) => (
                <div key={item.label} className="flex items-center justify-between border-t border-border/45 pt-2">
                  <span className="text-muted-foreground">{item.label}</span>
                  <span className="font-semibold text-foreground">{item.value}</span>
                </div>
              ))}
            </div>
          </aside>
        </div>
      </section>

      {novelWorld ? (
        <NovelWorldUsageSummary
          {...usageProps}
          draft={usageDraft}
          onOpenDetails={() => openDialog("usage")}
        />
      ) : (
        <DetailDisclosure
          title={t("worldManager.selectOrGenerate")}
          description={t("worldManager.selectOrGenerateDesc")}
          meta={t("worldManager.pendingSelection")}
          defaultOpen
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
      )}

      <NovelWorldHandbookDialog
        open={dialogOpen}
        activeTab={dialogTab}
        onOpenChange={setDialogOpen}
        onTabChange={setDialogTab}
        novelWorld={novelWorld}
        handbook={handbook}
        worldAssets={worldAssets}
        syncHistory={syncHistory}
        syncDiff={syncDiff}
        activeWorldName={activeWorldName}
        worldOptions={props.worldOptions}
        selectedWorldId={props.selectedWorldId}
        isImporting={props.isImporting}
        isGenerating={props.isGenerating}
        isCreatingManual={props.isCreatingManual}
        isSavingToLibrary={props.isSavingToLibrary}
        isLoadingSyncDiff={props.isLoadingSyncDiff}
        isSyncing={props.isSyncing}
        selectedSyncSections={selectedSyncSections}
        onSelectedSyncSectionsChange={setSelectedSyncSections}
        onImport={props.onImport}
        onCreateManual={props.onCreateManual}
        onGenerate={props.onGenerate}
        onSaveToLibrary={props.onSaveToLibrary}
        onSync={props.onSync}
        usageProps={usageProps}
        usageDraft={usageDraft}
      />
    </section>
  );
}
