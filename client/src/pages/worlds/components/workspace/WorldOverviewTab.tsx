import {
  BookOpen,
  Castle,
  Clock3,
  GitBranch,
  Map,
  MapPinned,
  Network,
  Pencil,
  ShieldAlert,
  Sparkles,
  WandSparkles,
  Workflow,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import type { WorldStructuredData, WorldVisualizationPayload } from "@ai-novel/shared/types/world";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { featureFlags } from "@/config/featureFlags";
import WorldVisualizationBoard from "../WorldVisualizationBoard";

interface WorldOverviewTabProps {
  summary?: string;
  sections: Array<{ key: string; title: string; content: string }>;
  structure?: WorldStructuredData;
  visualization?: WorldVisualizationPayload;
  onOpenStructure?: () => void;
  onOpenLayers?: () => void;
}

function compactText(value: string | null | undefined, fallback: string, limit = 120) {
  const text = value?.replace(/\s+/g, " ").trim();
  if (!text) {
    return fallback;
  }
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function listText(items: Array<string | null | undefined>, fallback: string, limit = 3) {
  const visible = items.map((item) => compactText(item, "", 96)).filter(Boolean).slice(0, limit);
  return visible.length > 0 ? visible : [fallback];
}

function HandbookBlock({
  icon: Icon,
  title,
  items,
  accent = "default",
}: {
  icon: typeof BookOpen;
  title: string;
  items: string[];
  accent?: "default" | "primary";
}) {
  return (
    <div className={accent === "primary" ? "rounded-md border border-primary/30 bg-primary/5 p-3" : "rounded-md border bg-background p-3"}>
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        {title}
      </div>
      <div className="mt-2 space-y-2 text-sm leading-6 text-muted-foreground">
        {items.map((item) => (
          <div key={item} className="line-clamp-3">
            {item}
          </div>
        ))}
      </div>
    </div>
  );
}

function EmptyHandbookBlock({
  icon: Icon,
  title,
  description,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
}) {
  return (
    <div className="rounded-md border border-dashed bg-background p-3">
      <div className="flex items-center gap-2 text-sm font-medium">
        <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
        {title}
      </div>
      <div className="mt-2 text-sm leading-6 text-muted-foreground">{description}</div>
    </div>
  );
}

function WorldAssetPreviewBlock({
  icon: Icon,
  title,
  description,
  status,
}: {
  icon: typeof BookOpen;
  title: string;
  description: string;
  status: string;
}) {
  return (
    <div className="rounded-md border border-dashed bg-background p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2 text-sm font-medium">
          <Icon className="h-4 w-4 text-primary" aria-hidden="true" />
          {title}
        </div>
        <Badge variant="outline">{status}</Badge>
      </div>
      <div className="mt-2 text-xs leading-5 text-muted-foreground">{description}</div>
    </div>
  );
}

export default function WorldOverviewTab(props: WorldOverviewTabProps) {
  const { summary, sections, structure, visualization, onOpenStructure, onOpenLayers } = props;
  const { t } = useTranslation("worldsComponentsB");
  const colon = t("sep.colon");
  const profile = structure?.profile;
  const hasHandbook = Boolean(structure);
  const worldPromise = compactText(
    profile?.identity || profile?.summary,
    summary ?? t("overview.worldPromiseFallback"),
    120,
  );
  const coreRules = listText(
    structure?.rules?.axioms.map((rule) => [rule.name, rule.summary].filter(Boolean).join(colon)) ?? [],
    t("overview.coreRulesFallback"),
  );
  const majorForces = listText(
    [
      ...(structure?.forces ?? []).map((force) => [force.name, force.summary || force.currentObjective].filter(Boolean).join(colon)),
      ...(structure?.factions ?? []).map((faction) => [faction.name, faction.position || faction.doctrine].filter(Boolean).join(colon)),
    ],
    t("overview.majorForcesFallback"),
  );
  const storyLocations = listText(
    structure?.locations.map((location) =>
      [location.name, location.narrativeFunction || location.risk || location.summary].filter(Boolean).join(colon),
    ) ?? [],
    t("overview.storyLocationsFallback"),
  );
  const tensions = listText(
    [
      profile?.coreConflict,
      ...(structure?.relations.forceRelations ?? []).map((relation) =>
        [relation.relation, relation.tension || relation.detail].filter(Boolean).join(colon),
      ),
      ...(structure?.rules.sharedConsequences ?? []),
    ],
    t("overview.tensionsFallback"),
  );

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <CardTitle>{featureFlags.worldVisEnabled ? t("overview.titleWithVis") : t("overview.title")}</CardTitle>
          <div className="flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="secondary" onClick={onOpenStructure}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
              {t("overview.editHandbook")}
            </Button>
            <Button type="button" size="sm" variant="outline" onClick={onOpenLayers}>
              <WandSparkles className="mr-2 h-4 w-4" aria-hidden="true" />
              {t("overview.aiBuild")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {hasHandbook ? (
          <>
            <div className="grid gap-4 lg:grid-cols-[1.4fr_0.8fr]">
              <div className="rounded-md border-l-2 border-primary bg-muted/30 p-4">
                <div className="flex flex-wrap items-center gap-2">
                  <Badge variant="secondary">{t("overview.worldSampleBadge")}</Badge>
                  {profile?.tone ? <Badge variant="outline">{profile.tone}</Badge> : null}
                  {profile?.themes?.slice(0, 4).map((theme) => (
                    <Badge key={theme} variant="outline">
                      {theme}
                    </Badge>
                  ))}
                </div>
                <div className="mt-3 text-lg font-semibold leading-7">
                  {worldPromise}
                </div>
                <div className="mt-2 text-sm leading-6 text-muted-foreground">
                  {compactText(profile?.summary, summary ?? t("overview.summaryFallback"), 180)}
                </div>
                <div className="mt-3 text-sm leading-6">
                  {compactText(profile?.coreConflict, t("overview.coreConflictFallback"), 160)}
                </div>
              </div>

              <div className="rounded-md border bg-background p-4">
                <div className="text-sm font-medium">{t("overview.provideTitle")}</div>
                <div className="mt-3 space-y-2 text-sm leading-6 text-muted-foreground">
                  <div>{t("overview.provide1")}</div>
                  <div>{t("overview.provide2")}</div>
                  <div>{t("overview.provide3")}</div>
                </div>
              </div>
            </div>

            <div className="grid gap-3 md:grid-cols-4">
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="text-lg font-semibold">{structure?.rules.axioms.length ?? 0}</div>
                <div className="text-muted-foreground">{t("overview.statCoreRules")}</div>
              </div>
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="text-lg font-semibold">{(structure?.forces.length ?? 0) + (structure?.factions.length ?? 0)}</div>
                <div className="text-muted-foreground">{t("overview.statForcesFactions")}</div>
              </div>
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="text-lg font-semibold">{structure?.locations.length ?? 0}</div>
                <div className="text-muted-foreground">{t("overview.statLocations")}</div>
              </div>
              <div className="rounded-md border bg-muted/30 p-3 text-sm">
                <div className="text-lg font-semibold">
                  {(structure?.relations.forceRelations.length ?? 0) + (structure?.relations.locationControls.length ?? 0)}
                </div>
                <div className="text-muted-foreground">{t("overview.statRelations")}</div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <HandbookBlock icon={Sparkles} title={t("overview.blockRules")} items={coreRules} accent="primary" />
              <HandbookBlock icon={Castle} title={t("overview.blockForces")} items={majorForces} />
              <HandbookBlock icon={MapPinned} title={t("overview.blockStage")} items={storyLocations} />
              <HandbookBlock icon={GitBranch} title={t("overview.blockTension")} items={tensions} />
            </div>

            <HandbookBlock
              icon={ShieldAlert}
              title={t("overview.priorityTitle")}
              items={[
                compactText(structure?.rules.summary, t("overview.rulesSummaryFallback"), 150),
                ...listText(structure?.rules.taboo ?? [], t("overview.tabooFallback"), 2),
              ]}
            />
          </>
        ) : (
          <div className="space-y-4">
            <div className="grid gap-4 lg:grid-cols-[1.35fr_0.85fr]">
              <div className="rounded-md border-l-2 border-primary bg-muted/30 p-4">
                <Badge variant="secondary">{t("overview.emptyBadge")}</Badge>
                <div className="mt-3 text-lg font-semibold leading-7">
                  {compactText(summary, t("overview.emptySummaryFallback"), 160)}
                </div>
                <div className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t("overview.emptyDesc")}
                </div>
              </div>

              <div className="rounded-md border bg-background p-4">
                <div className="text-sm font-medium">{t("overview.nextStepTitle")}</div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <Button type="button" size="sm" onClick={onOpenLayers}>
                    <WandSparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                    {t("overview.aiBuildWorld")}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={onOpenStructure}>
                    <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
                    {t("overview.editHandbook")}
                  </Button>
                </div>
              </div>
            </div>

            <div className="grid gap-3 lg:grid-cols-2">
              <EmptyHandbookBlock icon={Sparkles} title={t("overview.blockRules")} description={t("overview.emptyBlockRulesDesc")} />
              <EmptyHandbookBlock icon={Castle} title={t("overview.blockForces")} description={t("overview.emptyBlockForcesDesc")} />
              <EmptyHandbookBlock icon={MapPinned} title={t("overview.blockStage")} description={t("overview.emptyBlockStageDesc")} />
              <EmptyHandbookBlock icon={GitBranch} title={t("overview.blockTension")} description={t("overview.emptyBlockTensionDesc")} />
            </div>

            {sections.length > 0 ? (
              <div className="rounded-md border p-3">
                <div className="mb-2 text-sm font-medium">{t("overview.existingSectionsTitle")}</div>
                <div className="grid gap-3 lg:grid-cols-2">
                  {sections.map((section) => (
                    <div key={section.key} className="rounded-md border bg-background p-3 text-sm">
                      <div className="mb-1 font-medium">{section.title}</div>
                      <div className="line-clamp-4 whitespace-pre-wrap text-muted-foreground">{section.content}</div>
                    </div>
                  ))}
                </div>
              </div>
            ) : null}
          </div>
        )}
        {featureFlags.worldVisEnabled ? (
          <WorldVisualizationBoard payload={visualization} />
        ) : (
          <div className="rounded-md border p-4">
            <div className="flex flex-col gap-2 lg:flex-row lg:items-start lg:justify-between">
              <div>
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <Map className="h-4 w-4 text-primary" aria-hidden="true" />
                  {t("overview.assetEntryTitle")}
                </div>
                <div className="mt-1 text-sm leading-6 text-muted-foreground">
                  {t("overview.assetEntryDesc")}
                </div>
              </div>
              <Badge variant="outline">{t("overview.reservedEntry")}</Badge>
            </div>
            <div className="mt-3 grid gap-3 md:grid-cols-2 xl:grid-cols-4">
              <WorldAssetPreviewBlock
                icon={MapPinned}
                title={t("overview.assetMapTitle")}
                description={t("overview.assetMapDesc")}
                status={(structure?.locations.length ?? 0) > 0 ? t("overview.statusReady") : t("overview.statusNeedLocations")}
              />
              <WorldAssetPreviewBlock
                icon={Network}
                title={t("overview.assetForceTitle")}
                description={t("overview.assetForceDesc")}
                status={(structure?.forces.length ?? 0) + (structure?.factions.length ?? 0) > 0 ? t("overview.statusReady") : t("overview.statusNeedForces")}
              />
              <WorldAssetPreviewBlock
                icon={Clock3}
                title={t("overview.assetTimelineTitle")}
                description={t("overview.assetTimelineDesc")}
                status={profile?.coreConflict ? t("overview.statusReady") : t("overview.statusNeedTension")}
              />
              <WorldAssetPreviewBlock
                icon={Workflow}
                title={t("overview.assetPowerTitle")}
                description={t("overview.assetPowerDesc")}
                status={(structure?.rules.axioms.length ?? 0) > 0 ? t("overview.statusReady") : t("overview.statusNeedRules")}
              />
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
