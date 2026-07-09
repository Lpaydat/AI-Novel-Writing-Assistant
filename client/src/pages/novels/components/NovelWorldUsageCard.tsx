import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { Castle, MapPinned, ShieldAlert, SlidersHorizontal } from "lucide-react";
import type { StoryWorldSliceOverrides, StoryWorldSliceView } from "@ai-novel/shared/types/storyWorldSlice";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { DetailDisclosure } from "./workspaceShell";

export interface NovelWorldUsageCardProps {
  view?: StoryWorldSliceView | null;
  message: string;
  isRefreshing: boolean;
  isSaving: boolean;
  onRefresh: () => void;
  onSave: (patch: StoryWorldSliceOverrides) => void;
}

export interface NovelWorldUsageDraftState {
  primaryLocationId: string;
  setPrimaryLocationId: (value: string) => void;
  requiredForceIds: string[];
  setRequiredForceIds: (updater: (prev: string[]) => string[]) => void;
  requiredLocationIds: string[];
  setRequiredLocationIds: (updater: (prev: string[]) => string[]) => void;
  requiredRuleIds: string[];
  setRequiredRuleIds: (updater: (prev: string[]) => string[]) => void;
  scopeNote: string;
  setScopeNote: (value: string) => void;
  savePayload: StoryWorldSliceOverrides;
}

function toggleId(ids: string[], id: string, checked: boolean): string[] {
  const set = new Set(ids);
  if (checked) {
    set.add(id);
  } else {
    set.delete(id);
  }
  return Array.from(set);
}

function labelStoryInputSource(t: TFunction, source: string | null | undefined): string {
  switch (source) {
    case "explicit":
      return t("worldUsage.storyInputSource.explicit");
    case "story_macro":
      return t("worldUsage.storyInputSource.storyMacro");
    case "novel_description":
      return t("worldUsage.storyInputSource.novelDescription");
    default:
      return t("common.none");
  }
}

function namesLine(items: Array<{ name: string }>, fallback: string): string {
  if (!items.length) {
    return fallback;
  }
  return items.slice(0, 3).map((item) => item.name).join(" · ");
}

function findPrimaryLocation(t: TFunction, view: StoryWorldSliceView | null | undefined, primaryLocationId: string): string {
  if (primaryLocationId === "__none__") {
    return view?.slice?.activeLocations[0]?.name ?? t("worldUsage.unspecified");
  }
  return view?.availableLocations.find((item) => item.id === primaryLocationId)?.name ?? t("worldUsage.unspecified");
}

function MetricItem(props: { label: string; value: string; detail: string }) {
  return (
    <div className="min-w-0">
      <div className="text-xs text-muted-foreground">{props.label}</div>
      <div className="mt-1 truncate text-sm font-semibold text-foreground">{props.value}</div>
      <div className="mt-1 line-clamp-1 text-xs text-muted-foreground">{props.detail}</div>
    </div>
  );
}

function OverrideGroup({
  icon: Icon,
  title,
  description,
  emptyText,
  items,
  selectedIds,
  onToggle,
}: {
  icon: typeof Castle;
  title: string;
  description: string;
  emptyText: string;
  items: Array<{ id: string; name: string; summary: string }>;
  selectedIds: string[];
  onToggle: (id: string, checked: boolean) => void;
}) {
  return (
    <div className="border-t border-border/60 pt-4">
      <div className="flex items-start gap-2">
        <Icon className="mt-0.5 h-4 w-4 text-primary" aria-hidden="true" />
        <div>
          <div className="text-sm font-medium text-foreground">{title}</div>
          <div className="mt-1 text-xs leading-5 text-muted-foreground">{description}</div>
        </div>
      </div>
      <div className="mt-3 grid gap-2">
        {items.length ? items.map((item) => (
          <label key={item.id} className="flex items-start gap-3 rounded-md bg-muted/20 px-3 py-2 text-sm">
            <input
              type="checkbox"
              checked={selectedIds.includes(item.id)}
              onChange={(event) => onToggle(item.id, event.target.checked)}
              className="mt-1"
            />
            <span>
              <span className="block font-medium text-foreground">{item.name}</span>
              <span className="block leading-6 text-muted-foreground">{item.summary}</span>
            </span>
          </label>
        )) : <div className="text-sm text-muted-foreground">{emptyText}</div>}
      </div>
    </div>
  );
}

export function useNovelWorldUsageDraft(props: NovelWorldUsageCardProps): NovelWorldUsageDraftState {
  const [primaryLocationId, setPrimaryLocationId] = useState<string>("__none__");
  const [requiredForceIds, setRequiredForceIds] = useState<string[]>([]);
  const [requiredLocationIds, setRequiredLocationIds] = useState<string[]>([]);
  const [requiredRuleIds, setRequiredRuleIds] = useState<string[]>([]);
  const [scopeNote, setScopeNote] = useState("");

  useEffect(() => {
    setPrimaryLocationId(props.view?.overrides.primaryLocationId ?? "__none__");
    setRequiredForceIds(props.view?.overrides.requiredForceIds ?? []);
    setRequiredLocationIds(props.view?.overrides.requiredLocationIds ?? []);
    setRequiredRuleIds(props.view?.overrides.requiredRuleIds ?? []);
    setScopeNote(props.view?.overrides.scopeNote ?? "");
  }, [props.view]);

  const savePayload = useMemo<StoryWorldSliceOverrides>(() => ({
    primaryLocationId: primaryLocationId === "__none__" ? null : primaryLocationId,
    requiredForceIds,
    requiredLocationIds,
    requiredRuleIds,
    scopeNote: scopeNote.trim() || null,
  }), [primaryLocationId, requiredForceIds, requiredLocationIds, requiredRuleIds, scopeNote]);

  return {
    primaryLocationId,
    setPrimaryLocationId,
    requiredForceIds,
    setRequiredForceIds,
    requiredLocationIds,
    setRequiredLocationIds,
    requiredRuleIds,
    setRequiredRuleIds,
    scopeNote,
    setScopeNote,
    savePayload,
  };
}

export function NovelWorldUsageSummary(props: NovelWorldUsageCardProps & {
  draft: NovelWorldUsageDraftState;
  onOpenDetails?: () => void;
}) {
  const { t } = useTranslation("novelsEditC");
  const slice = props.view?.slice ?? null;
  const hasWorld = props.view?.hasWorld ?? false;
  const primaryLocation = findPrimaryLocation(t, props.view, props.draft.primaryLocationId);
  const boundaryText = props.draft.scopeNote.trim() || slice?.storyScopeBoundary || t("worldUsage.boundaryPlaceholder");
  const canSave = hasWorld && Boolean(props.view);

  return (
    <section id="novel-world-usage" className="rounded-2xl bg-background/80 p-4 shadow-sm ring-1 ring-border/35">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0">
          <div className="flex items-center gap-2 text-xs text-muted-foreground">
            <span className="h-1.5 w-1.5 rounded-full bg-primary" />
            {t("worldUsage.usageScopeTitle")}
          </div>
          <div className="mt-2 text-sm leading-6 text-muted-foreground">
            {slice
              ? t("worldUsage.summaryHasSlice")
              : hasWorld
                ? t("worldUsage.summaryHasWorld")
                : t("worldUsage.summaryNoWorld")}
          </div>
        </div>
        <div className="flex shrink-0 flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={props.onRefresh} disabled={!hasWorld || props.isRefreshing}>
            {props.isRefreshing ? t("worldUsage.organizing") : t("worldUsage.organizeUsageScope")}
          </Button>
          <Button type="button" variant="ghost" onClick={props.onOpenDetails} disabled={!hasWorld}>
            <SlidersHorizontal className="size-4" />
            {t("worldUsage.adjustRetained")}
          </Button>
        </div>
      </div>

      {props.message ? (
        <div className="mt-3 rounded-md bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
          {props.message}
        </div>
      ) : null}

      <div className="mt-4 grid gap-4 md:grid-cols-4">
        <MetricItem label={t("worldUsage.metric.primaryStage")} value={primaryLocation} detail={props.view?.worldName ?? t("worldUsage.awaitingWorld")} />
        <MetricItem
          label={t("worldUsage.metric.activeForces")}
          value={t("worldUsage.countForces", { count: slice?.activeForces.length ?? 0 })}
          detail={namesLine(slice?.activeForces ?? [], t("worldUsage.shownAfterOrganize"))}
        />
        <MetricItem
          label={t("worldUsage.metric.storyLocations")}
          value={t("worldUsage.countLocations", { count: slice?.activeLocations.length ?? 0 })}
          detail={namesLine(slice?.activeLocations ?? [], t("worldUsage.shownAfterOrganize"))}
        />
        <MetricItem
          label={t("worldUsage.metric.hardRules")}
          value={t("worldUsage.countRules", { count: slice?.appliedRules.length ?? 0 })}
          detail={namesLine(slice?.appliedRules ?? [], t("worldUsage.shownAfterOrganize"))}
        />
      </div>

      <div className="mt-4 flex flex-col gap-3 border-t border-border/50 pt-3 lg:flex-row lg:items-center lg:justify-between">
        <div className="min-w-0 text-sm leading-6 text-muted-foreground">
          <span className="font-medium text-foreground">{t("worldUsage.boundaryLabel")}</span>
          <span className="line-clamp-2">{boundaryText}</span>
        </div>
        <Button
          type="button"
          size="sm"
          disabled={!canSave || props.isSaving}
          onClick={() => props.onSave(props.draft.savePayload)}
        >
          {props.isSaving ? t("common.saving") : t("worldUsage.saveRetained")}
        </Button>
      </div>
    </section>
  );
}

export function NovelWorldUsageDetails(props: NovelWorldUsageCardProps & {
  draft: NovelWorldUsageDraftState;
}) {
  const { t } = useTranslation("novelsEditC");
  const slice = props.view?.slice ?? null;
  const hasWorld = props.view?.hasWorld ?? false;
  const hasSlice = Boolean(slice);
  const canSave = hasWorld && Boolean(props.view);

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <div className="text-lg font-semibold text-foreground">{t("worldUsage.detailsTitle")}</div>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("worldUsage.detailsDesc")}
          </div>
        </div>
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={props.onRefresh} disabled={!hasWorld || props.isRefreshing}>
            {props.isRefreshing ? t("worldUsage.organizing") : t("worldUsage.reorganizeUsageScope")}
          </Button>
          <Button type="button" onClick={() => props.onSave(props.draft.savePayload)} disabled={!canSave || props.isSaving}>
            {props.isSaving ? t("common.saving") : t("worldUsage.saveRetained")}
          </Button>
        </div>
      </div>

      {props.message ? (
        <div className="rounded-md bg-muted/25 px-3 py-2 text-sm text-muted-foreground">
          {props.message}
        </div>
      ) : null}

      {!hasWorld ? (
        <div className="rounded-md border border-dashed border-border/70 px-4 py-4 text-sm leading-6 text-muted-foreground">
          {t("worldUsage.noWorldHint")}
        </div>
      ) : null}

      {hasWorld ? (
        <div className="grid gap-4 md:grid-cols-2">
          <MetricItem label={t("worldUsage.metric.bookWorld")} value={props.view?.worldName ?? t("worldUsage.unnamedWorld")} detail={t("worldUsage.bookWorldDetail")} />
          <MetricItem label={t("worldUsage.metric.storyInputSource")} value={labelStoryInputSource(t, props.view?.storyInputSource)} detail={t("worldUsage.storyInputSourceDetail")} />
        </div>
      ) : null}

      {slice ? (
        <div className="grid gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(360px,0.95fr)]">
          <section className="space-y-5">
            <div>
              <div className="text-sm font-medium text-foreground">{t("worldUsage.worldBase")}</div>
              <div className="mt-1 text-sm leading-6 text-muted-foreground">{slice.coreWorldFrame || t("common.none")}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{t("worldUsage.usedForces")}</div>
              <div className="mt-2 text-sm leading-6 text-muted-foreground">
                {namesLine(slice.activeForces, t("common.none"))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{t("worldUsage.usedLocations")}</div>
              <div className="mt-2 text-sm leading-6 text-muted-foreground">
                {namesLine(slice.activeLocations, t("common.none"))}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{t("worldUsage.coreRules")}</div>
              <div className="mt-2 space-y-3">
                {slice.appliedRules.length > 0 ? slice.appliedRules.map((item) => (
                  <div key={item.id} className="border-t border-border/50 pt-3 text-sm">
                    <div className="font-medium text-foreground">{item.name}</div>
                    <div className="mt-1 leading-6 text-muted-foreground">{item.summary}</div>
                  </div>
                )) : <div className="text-sm text-muted-foreground">{t("common.none")}</div>}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{t("worldUsage.pressureSources")}</div>
              <div className="mt-2 space-y-1 text-sm text-muted-foreground">
                {slice.pressureSources.length > 0 ? slice.pressureSources.map((item) => (
                  <div key={item}>{item}</div>
                )) : <div>{t("common.none")}</div>}
              </div>
            </div>
            <div>
              <div className="text-sm font-medium text-foreground">{t("worldUsage.boundaryNotToCross")}</div>
              <div className="mt-1 text-sm leading-6 text-muted-foreground">{slice.storyScopeBoundary || t("common.none")}</div>
            </div>
          </section>

          <section className="space-y-4 rounded-xl bg-muted/15 p-4">
            <div>
              <div className="text-sm font-medium text-foreground">{t("worldUsage.manualRetained")}</div>
              <div className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("worldUsage.manualRetainedDesc")}
              </div>
            </div>
            <div>
              <label className="text-sm font-medium text-foreground">{t("worldUsage.primaryStageLabel")}</label>
              <Select value={props.draft.primaryLocationId} onValueChange={props.draft.setPrimaryLocationId}>
                <SelectTrigger className="mt-2">
                  <SelectValue placeholder={t("worldUsage.selectPrimaryStage")} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="__none__">{t("worldUsage.noExtraSpecify")}</SelectItem>
                  {props.view?.availableLocations.map((item) => (
                    <SelectItem key={item.id} value={item.id}>{item.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <DetailDisclosure title={t("worldUsage.mustRetainTitle")} description={t("worldUsage.mustRetainDesc")}>
              <div className="space-y-4">
                <OverrideGroup
                  icon={Castle}
                  title={t("worldUsage.mustRetainForces")}
                  description={t("worldUsage.mustRetainForcesDesc")}
                  emptyText={t("worldUsage.noForcesAvailable")}
                  items={props.view?.availableForces ?? []}
                  selectedIds={props.draft.requiredForceIds}
                  onToggle={(id, checked) => props.draft.setRequiredForceIds((prev) => toggleId(prev, id, checked))}
                />
                <OverrideGroup
                  icon={MapPinned}
                  title={t("worldUsage.mustRetainLocations")}
                  description={t("worldUsage.mustRetainLocationsDesc")}
                  emptyText={t("worldUsage.noLocationsAvailable")}
                  items={props.view?.availableLocations ?? []}
                  selectedIds={props.draft.requiredLocationIds}
                  onToggle={(id, checked) => props.draft.setRequiredLocationIds((prev) => toggleId(prev, id, checked))}
                />
                <OverrideGroup
                  icon={ShieldAlert}
                  title={t("worldUsage.mustRetainRules")}
                  description={t("worldUsage.mustRetainRulesDesc")}
                  emptyText={t("worldUsage.noRulesAvailable")}
                  items={props.view?.availableRules ?? []}
                  selectedIds={props.draft.requiredRuleIds}
                  onToggle={(id, checked) => props.draft.setRequiredRuleIds((prev) => toggleId(prev, id, checked))}
                />
              </div>
            </DetailDisclosure>

            <div>
              <label className="text-sm font-medium text-foreground" htmlFor="story-world-scope-note">
                {t("worldUsage.scopeNoteLabel")}
              </label>
              <div className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("worldUsage.scopeNoteDesc")}
              </div>
              <textarea
                id="story-world-scope-note"
                value={props.draft.scopeNote}
                onChange={(event) => props.draft.setScopeNote(event.target.value)}
                rows={4}
                className="mt-2 w-full rounded-md border border-input bg-background px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring"
                placeholder={t("worldUsage.scopeNotePlaceholder")}
              />
            </div>
          </section>
        </div>
      ) : null}

      {hasWorld && !hasSlice ? (
        <div className="rounded-md border border-dashed border-border/70 px-4 py-4 text-sm leading-6 text-muted-foreground">
          {t("worldUsage.noSliceHint")}
        </div>
      ) : null}
    </div>
  );
}

export default function NovelWorldUsageCard(props: NovelWorldUsageCardProps) {
  const { t } = useTranslation("novelsEditC");
  const draft = useNovelWorldUsageDraft(props);

  return (
    <div className="space-y-4">
      <NovelWorldUsageSummary {...props} draft={draft} />
      <DetailDisclosure title={t("worldUsage.detailsDisclosureTitle")} description={t("worldUsage.detailsDisclosureDesc")}>
        <NovelWorldUsageDetails {...props} draft={draft} />
      </DetailDisclosure>
    </div>
  );
}
