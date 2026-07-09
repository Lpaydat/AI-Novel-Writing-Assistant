import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type {
  WorldBindingSupport,
  WorldFaction,
  WorldForce,
  WorldForceRelation,
  WorldLocation,
  WorldLocationControlRelation,
  WorldRule,
  WorldStructuredData,
  WorldStructureSectionKey,
} from "@ai-novel/shared/types/world";
import type { WorldStructurePayload } from "@/api/world";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import WorldFactionsSection from "./structure/WorldFactionsSection";
import WorldRelationsSection from "./structure/WorldRelationsSection";

const SECTION_OPTIONS: Array<{ value: WorldStructureSectionKey; label: string }> = [
  { value: "profile", label: "structure.section.profile" },
  { value: "rules", label: "structure.section.rules" },
  { value: "factions", label: "structure.section.factions" },
  { value: "locations", label: "structure.section.locations" },
  { value: "relations", label: "structure.section.relations" },
];

function updateArrayItem<T>(items: T[], index: number, nextItem: T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
}

function parseTextList(value: string): string[] {
  return value
    .split(/[\n,，;；、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function WorldStructureTab(props: {
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
}) {
  const { initialPayload, savePending, backfillPending, generatePending, onSave, onBackfill, onGenerate } = props;
  const { t } = useTranslation("worldsComponentsB");
  const [activeSection, setActiveSection] = useState<WorldStructureSectionKey>("profile");
  const [draftStructure, setDraftStructure] = useState<WorldStructuredData | null>(initialPayload?.structure ?? null);
  const [draftBindingSupport, setDraftBindingSupport] = useState<WorldBindingSupport | null>(
    initialPayload?.bindingSupport ?? null,
  );

  useEffect(() => {
    if (!initialPayload) {
      return;
    }
    setDraftStructure(initialPayload.structure);
    setDraftBindingSupport(initialPayload.bindingSupport);
  }, [initialPayload]);

  const hasStructuredData = Boolean(initialPayload?.hasStructuredData);
  const factionNameById = useMemo(
    () => new Map((draftStructure?.factions ?? []).map((item) => [item.id, item.name])),
    [draftStructure?.factions],
  );
  const forceNameById = useMemo(
    () => new Map((draftStructure?.forces ?? []).map((item) => [item.id, item.name])),
    [draftStructure?.forces],
  );
  const locationNameById = useMemo(
    () => new Map((draftStructure?.locations ?? []).map((item) => [item.id, item.name])),
    [draftStructure?.locations],
  );

  if (!draftStructure || !draftBindingSupport) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>{t("structure.title")}</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">{t("structure.loading")}</CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("structure.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="rounded-md border p-3 space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            {SECTION_OPTIONS.map((option) => (
              <Button
                key={option.value}
                size="sm"
                variant={activeSection === option.value ? "default" : "outline"}
                onClick={() => setActiveSection(option.value)}
              >
                {t(option.label)}
              </Button>
            ))}
          </div>
          <div className="flex flex-wrap gap-2">
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
              {backfillPending ? t("structure.extracting") : hasStructuredData ? t("structure.reExtract") : t("structure.extract")}
            </Button>
            <Button
              variant="outline"
              onClick={async () => {
                const result = await onGenerate(activeSection, draftStructure, draftBindingSupport);
                if (result) {
                  setDraftStructure(result.structure);
                  setDraftBindingSupport(result.bindingSupport);
                }
              }}
              disabled={generatePending}
            >
              {generatePending ? t("structure.completing") : t("structure.aiComplete")}
            </Button>
            <Button onClick={() => void onSave(draftStructure, draftBindingSupport)} disabled={savePending}>
              {savePending ? t("common.savingShort") : t("structure.save")}
            </Button>
          </div>
        </div>

        <div className={activeSection === "profile" ? "rounded-md border p-3 space-y-3" : "hidden"}>
          <div className="font-medium">{t("structure.section.profile")}</div>
          <Input
            value={draftStructure.profile.identity}
            onChange={(event) =>
              setDraftStructure((prev) =>
                prev
                  ? { ...prev, profile: { ...prev.profile, identity: event.target.value } }
                  : prev,
              )
            }
            placeholder={t("structure.profileIdentityPlaceholder")}
          />
          <Input
            value={draftStructure.profile.tone}
            onChange={(event) =>
              setDraftStructure((prev) =>
                prev
                  ? { ...prev, profile: { ...prev.profile, tone: event.target.value } }
                  : prev,
              )
            }
            placeholder={t("structure.profileTonePlaceholder")}
          />
          <textarea
            className="min-h-[100px] w-full rounded-md border bg-background p-2 text-sm"
            value={draftStructure.profile.summary}
            onChange={(event) =>
              setDraftStructure((prev) =>
                prev
                  ? { ...prev, profile: { ...prev.profile, summary: event.target.value } }
                  : prev,
              )
            }
            placeholder={t("structure.profileSummaryPlaceholder")}
          />
          <textarea
            className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
            value={draftStructure.profile.coreConflict}
            onChange={(event) =>
              setDraftStructure((prev) =>
                prev
                  ? { ...prev, profile: { ...prev.profile, coreConflict: event.target.value } }
                  : prev,
              )
            }
            placeholder={t("structure.profileConflictPlaceholder")}
          />
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
            placeholder={t("structure.profileThemesPlaceholder")}
          />
        </div>

        <div className={activeSection === "rules" ? "rounded-md border p-3 space-y-3" : "hidden"}>
          <div className="flex items-center justify-between">
            <div className="font-medium">{t("structure.section.rules")}</div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setDraftStructure((prev) =>
                  prev
                    ? {
                      ...prev,
                      rules: {
                        ...prev.rules,
                        axioms: [
                          ...prev.rules.axioms,
                          {
                            id: `rule-${prev.rules.axioms.length + 1}`,
                            name: "",
                            summary: "",
                            cost: "",
                            boundary: "",
                            enforcement: "",
                          },
                        ],
                      },
                    }
                    : prev,
                )
              }
            >
              {t("structure.addRule")}
            </Button>
          </div>
          <textarea
            className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
            value={draftStructure.rules.summary}
            onChange={(event) =>
              setDraftStructure((prev) =>
                prev
                  ? { ...prev, rules: { ...prev.rules, summary: event.target.value } }
                  : prev,
              )
            }
            placeholder={t("structure.rulesSummaryPlaceholder")}
          />
          {draftStructure.rules.axioms.map((rule, index) => (
            <div key={rule.id || index} className="rounded-md border p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={rule.name}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          rules: {
                            ...prev.rules,
                            axioms: updateArrayItem<WorldRule>(prev.rules.axioms, index, {
                              ...rule,
                              name: event.target.value,
                            }),
                          },
                        }
                        : prev,
                    )
                  }
                  placeholder={t("structure.ruleNamePlaceholder")}
                />
                <Input
                  value={rule.cost}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          rules: {
                            ...prev.rules,
                            axioms: updateArrayItem<WorldRule>(prev.rules.axioms, index, {
                              ...rule,
                              cost: event.target.value,
                            }),
                          },
                        }
                        : prev,
                    )
                  }
                  placeholder={t("structure.ruleCostPlaceholder")}
                />
              </div>
              <textarea
                className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
                value={rule.summary}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        rules: {
                          ...prev.rules,
                          axioms: updateArrayItem<WorldRule>(prev.rules.axioms, index, {
                            ...rule,
                            summary: event.target.value,
                          }),
                        },
                      }
                      : prev,
                  )
                }
                placeholder={t("structure.ruleSummaryPlaceholder")}
              />
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={rule.boundary}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          rules: {
                            ...prev.rules,
                            axioms: updateArrayItem<WorldRule>(prev.rules.axioms, index, {
                              ...rule,
                              boundary: event.target.value,
                            }),
                          },
                        }
                        : prev,
                    )
                  }
                  placeholder={t("structure.ruleBoundaryPlaceholder")}
                />
                <Input
                  value={rule.enforcement}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          rules: {
                            ...prev.rules,
                            axioms: updateArrayItem<WorldRule>(prev.rules.axioms, index, {
                              ...rule,
                              enforcement: event.target.value,
                            }),
                          },
                        }
                        : prev,
                    )
                  }
                  placeholder={t("structure.ruleEnforcementPlaceholder")}
                />
              </div>
            </div>
          ))}
        </div>

        {activeSection === "factions" ? (
          <WorldFactionsSection
            draftStructure={draftStructure}
            setDraftStructure={setDraftStructure}
            factionNameById={factionNameById}
            forceNameById={forceNameById}
          />
        ) : null}

        <div className={activeSection === "locations" ? "rounded-md border p-3 space-y-3" : "hidden"}>
          <div className="flex items-center justify-between">
            <div className="font-medium">{t("structure.section.locations")}</div>
            <Button
              size="sm"
              variant="outline"
              onClick={() =>
                setDraftStructure((prev) =>
                  prev
                    ? {
                      ...prev,
                      locations: [
                        ...prev.locations,
                        {
                          id: `location-${prev.locations.length + 1}`,
                          name: "",
                          terrain: "",
                          summary: "",
                          narrativeFunction: "",
                          risk: "",
                          entryConstraint: "",
                          exitCost: "",
                          controllingForceIds: [],
                        },
                      ],
                    }
                    : prev,
                )
              }
            >
              {t("structure.addLocation")}
            </Button>
          </div>
          {draftStructure.locations.map((location, index) => (
            <div key={location.id || index} className="rounded-md border p-3 space-y-2">
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={location.name}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          locations: updateArrayItem<WorldLocation>(prev.locations, index, {
                            ...location,
                            name: event.target.value,
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("structure.locationNamePlaceholder")}
                />
                <Input
                  value={location.terrain}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          locations: updateArrayItem<WorldLocation>(prev.locations, index, {
                            ...location,
                            terrain: event.target.value,
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("structure.locationTerrainPlaceholder")}
                />
              </div>
              <textarea
                className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
                value={location.summary}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        locations: updateArrayItem<WorldLocation>(prev.locations, index, {
                          ...location,
                          summary: event.target.value,
                        }),
                      }
                      : prev,
                  )
                }
                placeholder={t("structure.locationSummaryPlaceholder")}
              />
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={location.narrativeFunction}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          locations: updateArrayItem<WorldLocation>(prev.locations, index, {
                            ...location,
                            narrativeFunction: event.target.value,
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("structure.locationNarrativePlaceholder")}
                />
                <Input
                  value={location.risk}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          locations: updateArrayItem<WorldLocation>(prev.locations, index, {
                            ...location,
                            risk: event.target.value,
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("structure.locationRiskPlaceholder")}
                />
              </div>
              <div className="grid gap-2 md:grid-cols-2">
                <Input
                  value={location.entryConstraint}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          locations: updateArrayItem<WorldLocation>(prev.locations, index, {
                            ...location,
                            entryConstraint: event.target.value,
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("structure.locationEntryPlaceholder")}
                />
                <Input
                  value={location.exitCost}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          locations: updateArrayItem<WorldLocation>(prev.locations, index, {
                            ...location,
                            exitCost: event.target.value,
                          }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("structure.locationExitPlaceholder")}
                />
              </div>
            </div>
          ))}
        </div>

        {activeSection === "relations" ? (
          <WorldRelationsSection
            draftStructure={draftStructure}
            draftBindingSupport={draftBindingSupport}
            setDraftStructure={setDraftStructure}
            forceNameById={forceNameById}
            locationNameById={locationNameById}
          />
        ) : null}
      </CardContent>
    </Card>
  );
}
