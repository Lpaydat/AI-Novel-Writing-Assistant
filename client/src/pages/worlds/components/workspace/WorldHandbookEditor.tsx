import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { AlertTriangle, BookOpen, Castle, GitBranch, MapPinned, Pencil, Save, ScrollText, WandSparkles } from "lucide-react";
import type {
  WorldBindingSupport,
  WorldStructuredData,
  WorldStructureSectionKey,
} from "@ai-novel/shared/types/world";
import type { WorldStructurePayload } from "@/api/world";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import {
  HandbookField,
  HandbookPreviewCard,
  HandbookPreviewLine,
  HandbookTextarea,
} from "./handbook/HandbookPrimitives";
import WorldHandbookForceSection from "./handbook/WorldHandbookForceSection";
import WorldHandbookLocationSection from "./handbook/WorldHandbookLocationSection";
import WorldHandbookRuleSection from "./handbook/WorldHandbookRuleSection";
import WorldHandbookTensionSection from "./handbook/WorldHandbookTensionSection";

type EditableHandbookSection = "profile" | "rules" | "forces" | "locations" | "relations";

function compactText(value: string | null | undefined, fallback: string, limit = 120): string {
  const text = value?.replace(/\s+/g, " ").trim();
  if (!text) {
    return fallback;
  }
  return text.length > limit ? `${text.slice(0, limit)}...` : text;
}

function joinPreview(items: Array<string | null | undefined>, fallback: string): string {
  const text = items
    .map((item) => item?.replace(/\s+/g, " ").trim())
    .filter((item): item is string => Boolean(item))
    .slice(0, 3)
    .join(" / ");
  return text || fallback;
}

export default function WorldHandbookEditor(props: {
  initialPayload?: WorldStructurePayload;
  savePending: boolean;
  backfillPending: boolean;
  generatePending: boolean;
  onSave: (structure: WorldStructuredData, bindingSupport: WorldBindingSupport) => Promise<void>;
  onBackfill: () => Promise<{ structure: WorldStructuredData; bindingSupport: WorldBindingSupport } | undefined>;
  onGenerate: (
    section: WorldStructureSectionKey,
    structure: WorldStructuredData,
    bindingSupport: WorldBindingSupport,
  ) => Promise<{ structure: WorldStructuredData; bindingSupport: WorldBindingSupport } | undefined>;
  onOpenDeepening: () => void;
  onOpenLayers: () => void;
  onOpenOverview: () => void;
  onOpenAdvanced: () => void;
}) {
  const {
    initialPayload,
    savePending,
    backfillPending,
    generatePending,
    onSave,
    onBackfill,
    onGenerate,
    onOpenDeepening,
    onOpenLayers,
    onOpenOverview,
    onOpenAdvanced,
  } = props;
  const { t } = useTranslation("worldsComponentsB");
  const [draftStructure, setDraftStructure] = useState<WorldStructuredData | null>(initialPayload?.structure ?? null);
  const [draftBindingSupport, setDraftBindingSupport] = useState<WorldBindingSupport | null>(
    initialPayload?.bindingSupport ?? null,
  );
  const [activeAiSection, setActiveAiSection] = useState<WorldStructureSectionKey>("profile");
  const [editingSection, setEditingSection] = useState<EditableHandbookSection | null>(null);

  useEffect(() => {
    if (!initialPayload) {
      return;
    }
    setDraftStructure(initialPayload.structure);
    setDraftBindingSupport(initialPayload.bindingSupport);
  }, [initialPayload]);

  if (!draftStructure || !draftBindingSupport) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("handbook.title")}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="text-sm leading-6 text-muted-foreground">{t("handbook.reading")}</div>
          <Button
            variant="secondary"
            onClick={async () => {
              const result = await onBackfill();
              if (result) {
                setDraftStructure(result.structure);
                setDraftBindingSupport(result.bindingSupport);
              }
            }}
            disabled={backfillPending}
          >
            {backfillPending ? t("common.organizing") : t("handbook.letAiOrganize")}
          </Button>
        </CardContent>
      </Card>
    );
  }

  const saveDraft = async () => {
    await onSave(draftStructure, draftBindingSupport);
  };

  const generateSection = async () => {
    const result = await onGenerate(activeAiSection, draftStructure, draftBindingSupport);
    if (result) {
      setDraftStructure(result.structure);
      setDraftBindingSupport(result.bindingSupport);
    }
  };

  return (
    <Card>
      <CardHeader>
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <CardTitle>{t("handbook.title")}</CardTitle>
            <div className="mt-2 text-sm leading-6 text-muted-foreground">
              {t("handbook.headerDesc")}
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button type="button" variant="outline" onClick={onOpenOverview}>
              <BookOpen className="mr-2 h-4 w-4" aria-hidden="true" />
              {t("handbook.viewHandbook")}
            </Button>
            <Button type="button" onClick={saveDraft} disabled={savePending}>
              <Save className="mr-2 h-4 w-4" aria-hidden="true" />
              {savePending ? t("common.savingShort") : t("handbook.save")}
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-md border-l-2 border-primary bg-muted/30 p-4">
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{t("handbook.worldSampleBadge")}</Badge>
            {draftStructure.profile.tone ? <Badge variant="outline">{draftStructure.profile.tone}</Badge> : null}
            {draftStructure.profile.themes.slice(0, 4).map((theme) => (
              <Badge key={theme} variant="outline">
                {theme}
              </Badge>
            ))}
          </div>
          <div className="mt-4 grid gap-3 lg:grid-cols-[0.75fr_1.25fr]">
            <HandbookPreviewLine
              label={t("handbook.previewImpressionLabel")}
              value={draftStructure.profile.identity}
              fallback={t("handbook.previewImpressionFallback")}
            />
            <HandbookPreviewLine
              label={t("handbook.previewFirstLookLabel")}
              value={draftStructure.profile.summary}
              fallback={t("handbook.previewFirstLookFallback")}
            />
            <HandbookPreviewLine
              label={t("handbook.previewToneLabel")}
              value={draftStructure.profile.tone || draftStructure.profile.themes.join(t("sep.comma"))}
              fallback={t("handbook.previewToneFallback")}
            />
            <HandbookPreviewLine
              label={t("handbook.previewConflictLabel")}
              value={draftStructure.profile.coreConflict}
              fallback={t("handbook.previewConflictFallback")}
            />
          </div>
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" size="sm" variant="outline" onClick={() => setEditingSection("profile")}>
              <Pencil className="mr-2 h-4 w-4" aria-hidden="true" />
              {t("handbook.editProfile")}
            </Button>
          </div>
          {editingSection === "profile" ? (
            <div className="mt-4 grid gap-3 lg:grid-cols-[0.8fr_1.4fr]">
            <div className="space-y-3">
              <HandbookField title={t("handbook.previewImpressionLabel")} hint={t("handbook.field.impressionHint")}>
                <Input
                  value={draftStructure.profile.identity}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev ? { ...prev, profile: { ...prev.profile, identity: event.target.value } } : prev,
                    )
                  }
                  placeholder={t("handbook.field.impressionPlaceholder")}
                />
              </HandbookField>
              <HandbookField title={t("handbook.previewToneLabel")} hint={t("handbook.field.toneHint")}>
                <Input
                  value={draftStructure.profile.tone}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev ? { ...prev, profile: { ...prev.profile, tone: event.target.value } } : prev,
                    )
                  }
                  placeholder={t("handbook.field.tonePlaceholder")}
                />
              </HandbookField>
              <HandbookField title={t("handbook.field.themesTitle")} hint={t("handbook.field.themesHint")}>
                <Input
                  value={draftStructure.profile.themes.join(t("sep.comma"))}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          profile: {
                            ...prev.profile,
                            themes: event.target.value.split(/[、,，]/).map((item) => item.trim()).filter(Boolean),
                          },
                        }
                        : prev,
                    )
                  }
                  placeholder={t("handbook.field.themesPlaceholder")}
                />
              </HandbookField>
            </div>
            <div className="space-y-3">
              <HandbookField title={t("handbook.field.summaryTitle")} hint={t("handbook.field.summaryHint")}>
                <HandbookTextarea
                  value={draftStructure.profile.summary}
                  onChange={(value) =>
                    setDraftStructure((prev) => (prev ? { ...prev, profile: { ...prev.profile, summary: value } } : prev))
                  }
                  placeholder={t("handbook.field.summaryPlaceholder")}
                />
              </HandbookField>
              <HandbookField title={t("handbook.field.conflictTitle")} hint={t("handbook.field.conflictHint")}>
                <HandbookTextarea
                  value={draftStructure.profile.coreConflict}
                  onChange={(value) =>
                    setDraftStructure((prev) =>
                      prev ? { ...prev, profile: { ...prev.profile, coreConflict: value } } : prev,
                    )
                  }
                  placeholder={t("handbook.field.conflictPlaceholder")}
                  minRows={3}
                />
              </HandbookField>
            </div>
            </div>
          ) : null}
        </div>

        <div className="rounded-md border bg-background p-4">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <div className="text-sm font-medium">{t("handbook.aiAssistTitle")}</div>
              <div className="mt-1 text-sm leading-6 text-muted-foreground">
                {t("handbook.aiAssistDesc")}
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {[
                { key: "profile", label: "structure.section.profile" },
                { key: "rules", label: "handbook.aiSection.rules" },
                { key: "factions", label: "handbook.aiSection.factions" },
                { key: "locations", label: "handbook.aiSection.locations" },
                { key: "relations", label: "handbook.aiSection.relations" },
              ].map((item) => (
                <Button
                  key={item.key}
                  type="button"
                  size="sm"
                  variant={activeAiSection === item.key ? "default" : "outline"}
                  onClick={() => setActiveAiSection(item.key as WorldStructureSectionKey)}
                >
                  {t(item.label)}
                </Button>
              ))}
              <Button type="button" size="sm" variant="secondary" onClick={generateSection} disabled={generatePending}>
                <WandSparkles className="mr-2 h-4 w-4" aria-hidden="true" />
                {generatePending ? t("handbook.completing") : t("handbook.completeSelected")}
              </Button>
            </div>
          </div>
        </div>

        <div className="grid gap-4 xl:grid-cols-2">
          <HandbookPreviewCard
            icon={ScrollText}
            title={t("handbook.card.rulesTitle")}
            description={t("handbook.card.rulesDesc", { count: draftStructure.rules.axioms.length })}
            action={
              <Button type="button" size="sm" variant="outline" onClick={() => setEditingSection("rules")}>
                {t("handbook.card.organizeRules")}
              </Button>
            }
          >
            <div className="space-y-3">
              <HandbookPreviewLine
                label={t("handbook.previewRuleSummaryLabel")}
                value={draftStructure.rules.summary}
                fallback={t("handbook.previewRuleSummaryFallback")}
              />
              <HandbookPreviewLine
                label={t("handbook.previewRepresentativeLabel")}
                value={joinPreview(
                  draftStructure.rules.axioms.map((rule) => [rule.name, rule.summary].filter(Boolean).join(t("sep.colon"))),
                  t("handbook.rulesJoinFallback"),
                )}
                fallback={t("handbook.rulesJoinFallback")}
              />
            </div>
          </HandbookPreviewCard>

          <HandbookPreviewCard
            icon={Castle}
            title={t("handbook.card.forcesTitle")}
            description={t("handbook.card.forcesDesc", { count: draftStructure.forces.length })}
            action={
              <Button type="button" size="sm" variant="outline" onClick={() => setEditingSection("forces")}>
                {t("handbook.card.organizeForces")}
              </Button>
            }
          >
            <div className="space-y-3">
              <HandbookPreviewLine
                label={t("handbook.previewActiveForcesLabel")}
                value={joinPreview(
                  draftStructure.forces.map((force) => [force.name, force.currentObjective].filter(Boolean).join(t("sep.colon"))),
                  t("handbook.forcesJoinFallback"),
                )}
                fallback={t("handbook.forcesJoinFallback")}
              />
              <HandbookPreviewLine
                label={t("handbook.previewStoryPressureLabel")}
                value={joinPreview(
                  draftStructure.forces.map((force) => force.pressure),
                  t("handbook.pressureJoinFallback"),
                )}
                fallback={t("handbook.pressureJoinFallback")}
              />
            </div>
          </HandbookPreviewCard>

          <HandbookPreviewCard
            icon={MapPinned}
            title={t("handbook.card.locationsTitle")}
            description={t("handbook.card.locationsDesc", { count: draftStructure.locations.length })}
            action={
              <Button type="button" size="sm" variant="outline" onClick={() => setEditingSection("locations")}>
                {t("handbook.card.organizeLocations")}
              </Button>
            }
          >
            <div className="space-y-3">
              <HandbookPreviewLine
                label={t("handbook.previewAvailableLocationsLabel")}
                value={joinPreview(
                  draftStructure.locations.map((location) =>
                    [location.name, location.narrativeFunction || location.terrain].filter(Boolean).join(t("sep.colon")),
                  ),
                  t("handbook.locationsJoinFallback"),
                )}
                fallback={t("handbook.locationsJoinFallback")}
              />
              <HandbookPreviewLine
                label={t("handbook.previewEntryRiskLabel")}
                value={joinPreview(
                  draftStructure.locations.map((location) => location.risk),
                  t("handbook.entryRiskJoinFallback"),
                )}
                fallback={t("handbook.entryRiskJoinFallback")}
              />
            </div>
          </HandbookPreviewCard>

          <HandbookPreviewCard
            icon={GitBranch}
            title={t("handbook.card.tensionTitle")}
            description={t("handbook.card.tensionDesc")}
            action={
              <Button type="button" size="sm" variant="outline" onClick={() => setEditingSection("relations")}>
                {t("handbook.card.organizeTension")}
              </Button>
            }
          >
            <div className="space-y-3">
              <HandbookPreviewLine
                label={t("handbook.previewForceRelationsLabel")}
                value={joinPreview(
                  draftStructure.relations.forceRelations.map((relation) =>
                    [relation.relation, relation.tension || relation.detail].filter(Boolean).join(t("sep.colon")),
                  ),
                  t("handbook.forceRelationsJoinFallback"),
                )}
                fallback={t("handbook.forceRelationsJoinFallback")}
              />
              <HandbookPreviewLine
                label={t("handbook.previewSharedConsequencesLabel")}
                value={joinPreview(
                  draftStructure.rules.sharedConsequences,
                  t("handbook.sharedConsequencesJoinFallback"),
                )}
                fallback={t("handbook.sharedConsequencesJoinFallback")}
              />
            </div>
          </HandbookPreviewCard>
        </div>

        {editingSection ? (
          <div className="rounded-md border border-primary/30 bg-primary/5 p-4">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-2 text-sm font-medium">
                <AlertTriangle className="h-4 w-4 text-primary" aria-hidden="true" />
                {t("handbook.editingBanner")}
              </div>
              <Button type="button" size="sm" variant="outline" onClick={() => setEditingSection(null)}>
                {t("handbook.collapseEdit")}
              </Button>
            </div>
          </div>
        ) : null}

        {editingSection === "rules" ? (
          <WorldHandbookRuleSection draftStructure={draftStructure} setDraftStructure={setDraftStructure} />
        ) : null}
        {editingSection === "forces" ? (
          <WorldHandbookForceSection draftStructure={draftStructure} setDraftStructure={setDraftStructure} />
        ) : null}
        {editingSection === "locations" ? (
          <WorldHandbookLocationSection draftStructure={draftStructure} setDraftStructure={setDraftStructure} />
        ) : null}
        {editingSection === "relations" ? (
          <WorldHandbookTensionSection
            draftStructure={draftStructure}
            setDraftStructure={setDraftStructure}
            onOpenDeepening={onOpenDeepening}
            onOpenLayers={onOpenLayers}
            onOpenAdvanced={onOpenAdvanced}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
