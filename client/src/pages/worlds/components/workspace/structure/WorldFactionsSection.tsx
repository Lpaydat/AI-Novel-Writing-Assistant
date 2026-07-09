import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type { WorldFaction, WorldForce, WorldStructuredData } from "@ai-novel/shared/types/world";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

function updateArrayItem<T>(items: T[], index: number, nextItem: T): T[] {
  return items.map((item, itemIndex) => (itemIndex === index ? nextItem : item));
}

function parseTextList(value: string): string[] {
  return value
    .split(/[\n,，;；、]/)
    .map((item) => item.trim())
    .filter(Boolean);
}

export default function WorldFactionsSection(props: {
  draftStructure: WorldStructuredData;
  setDraftStructure: Dispatch<SetStateAction<WorldStructuredData | null>>;
  factionNameById: Map<string, string>;
  forceNameById: Map<string, string>;
}) {
  const { draftStructure, setDraftStructure, factionNameById, forceNameById } = props;
  const { t } = useTranslation("worldsComponentsB");

  return (
    <div className="rounded-md border p-3 space-y-3">
      <div className="flex items-center justify-between">
        <div className="font-medium">{t("structure.section.factions")}</div>
        <div className="flex gap-2">
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setDraftStructure((prev) =>
                prev
                  ? {
                    ...prev,
                    factions: [
                      ...prev.factions,
                      {
                        id: `faction-${prev.factions.length + 1}`,
                        name: "",
                        position: "",
                        doctrine: "",
                        goals: [],
                        methods: [],
                        representativeForceIds: [],
                      },
                    ],
                  }
                  : prev,
              )
            }
          >
            {t("factions.addFaction")}
          </Button>
          <Button
            size="sm"
            variant="outline"
            onClick={() =>
              setDraftStructure((prev) =>
                prev
                  ? {
                    ...prev,
                    forces: [
                      ...prev.forces,
                      {
                        id: `force-${prev.forces.length + 1}`,
                        name: "",
                        type: "",
                        factionId: null,
                        summary: "",
                        baseOfPower: "",
                        currentObjective: "",
                        pressure: "",
                        leader: null,
                        narrativeRole: "",
                      },
                    ],
                  }
                  : prev,
              )
            }
          >
            {t("factions.addForce")}
          </Button>
        </div>
      </div>
      <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground space-y-1">
        <div>{t("factions.legend1")}</div>
        <div>{t("factions.legend2")}</div>
        <div>
          {t("factions.currentFactionIds")}{
            draftStructure.factions.length > 0
              ? draftStructure.factions.map((item) => t("factions.idNameEntry", { id: item.id, name: item.name || t("factions.unnamed") })).join(t("sep.comma"))
              : t("common.none")
          }
        </div>
        <div>
          {t("factions.currentForceIds")}{
            draftStructure.forces.length > 0
              ? draftStructure.forces.map((item) => t("factions.idNameEntry", { id: item.id, name: item.name || t("factions.unnamed") })).join(t("sep.comma"))
              : t("common.none")
          }
        </div>
      </div>
      <div className="space-y-3">
        {draftStructure.factions.map((faction, index) => (
          <div key={faction.id || index} className="rounded-md border p-3 space-y-2">
            <div className="text-xs text-muted-foreground">
              {t("factions.factionCardNote")}
            </div>
            <Input
              value={faction.name}
              onChange={(event) =>
                setDraftStructure((prev) =>
                  prev
                    ? {
                      ...prev,
                      factions: updateArrayItem<WorldFaction>(prev.factions, index, {
                        ...faction,
                        name: event.target.value,
                      }),
                    }
                    : prev,
                )
              }
              placeholder={t("factions.factionNamePlaceholder")}
            />
            <Input
              value={faction.position}
              onChange={(event) =>
                setDraftStructure((prev) =>
                  prev
                    ? {
                      ...prev,
                      factions: updateArrayItem<WorldFaction>(prev.factions, index, {
                        ...faction,
                        position: event.target.value,
                      }),
                    }
                    : prev,
                )
              }
              placeholder={t("factions.positionPlaceholder")}
            />
            <textarea
              className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
              value={faction.doctrine}
              onChange={(event) =>
                setDraftStructure((prev) =>
                  prev
                    ? {
                      ...prev,
                      factions: updateArrayItem<WorldFaction>(prev.factions, index, {
                        ...faction,
                        doctrine: event.target.value,
                      }),
                    }
                    : prev,
                )
              }
              placeholder={t("factions.doctrinePlaceholder")}
            />
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                value={faction.goals.join(t("sep.comma"))}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        factions: updateArrayItem<WorldFaction>(prev.factions, index, {
                          ...faction,
                          goals: parseTextList(event.target.value),
                        }),
                      }
                      : prev,
                  )
                }
                placeholder={t("factions.goalsPlaceholder")}
              />
              <Input
                value={faction.methods.join(t("sep.comma"))}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        factions: updateArrayItem<WorldFaction>(prev.factions, index, {
                          ...faction,
                          methods: parseTextList(event.target.value),
                        }),
                      }
                      : prev,
                  )
                }
                placeholder={t("factions.methodsPlaceholder")}
              />
            </div>
            <Input
              value={faction.representativeForceIds.join(t("sep.comma"))}
              onChange={(event) =>
                setDraftStructure((prev) =>
                  prev
                    ? {
                      ...prev,
                      factions: updateArrayItem<WorldFaction>(prev.factions, index, {
                        ...faction,
                        representativeForceIds: parseTextList(event.target.value),
                      }),
                    }
                    : prev,
                )
              }
              placeholder={t("factions.repForcesPlaceholder")}
            />
            {faction.representativeForceIds.length > 0 ? (
              <div className="text-xs text-muted-foreground">
                {t("factions.repForcesLabel")}{faction.representativeForceIds.map((id) => forceNameById.get(id) || id).join(t("sep.comma"))}
              </div>
            ) : null}
          </div>
        ))}
        {draftStructure.forces.map((force, index) => (
          <div key={force.id || index} className="rounded-md border p-3 space-y-2">
            <div className="text-xs text-muted-foreground">
              {t("factions.forceCardNote")}
            </div>
            <div className="grid gap-2 md:grid-cols-3">
              <Input
                value={force.name}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        forces: updateArrayItem<WorldForce>(prev.forces, index, {
                          ...force,
                          name: event.target.value,
                        }),
                      }
                      : prev,
                  )
                }
                placeholder={t("factions.forceNamePlaceholder")}
              />
              <Input
                value={force.type}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        forces: updateArrayItem<WorldForce>(prev.forces, index, {
                          ...force,
                          type: event.target.value,
                        }),
                      }
                      : prev,
                  )
                }
                placeholder={t("factions.forceTypePlaceholder")}
              />
              <Input
                value={force.factionId ?? ""}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        forces: updateArrayItem<WorldForce>(prev.forces, index, {
                          ...force,
                          factionId: event.target.value || null,
                        }),
                      }
                      : prev,
                  )
                }
                placeholder={t("factions.factionIdPlaceholder")}
              />
            </div>
            {force.factionId ? (
              <div className="text-xs text-muted-foreground">
                {t("factions.belongsToFactionLabel")}{factionNameById.get(force.factionId) || force.factionId}
              </div>
            ) : null}
            <textarea
              className="min-h-[80px] w-full rounded-md border bg-background p-2 text-sm"
              value={force.summary}
              onChange={(event) =>
                setDraftStructure((prev) =>
                  prev
                    ? {
                      ...prev,
                      forces: updateArrayItem<WorldForce>(prev.forces, index, {
                        ...force,
                        summary: event.target.value,
                      }),
                    }
                    : prev,
                )
              }
              placeholder={t("factions.forceSummaryPlaceholder")}
            />
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                value={force.baseOfPower}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        forces: updateArrayItem<WorldForce>(prev.forces, index, {
                          ...force,
                          baseOfPower: event.target.value,
                        }),
                      }
                      : prev,
                  )
                }
                placeholder={t("factions.baseOfPowerPlaceholder")}
              />
              <Input
                value={force.currentObjective}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        forces: updateArrayItem<WorldForce>(prev.forces, index, {
                          ...force,
                          currentObjective: event.target.value,
                        }),
                      }
                      : prev,
                  )
                }
                placeholder={t("factions.objectivePlaceholder")}
              />
            </div>
            <div className="grid gap-2 md:grid-cols-2">
              <Input
                value={force.leader ?? ""}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        forces: updateArrayItem<WorldForce>(prev.forces, index, {
                          ...force,
                          leader: event.target.value || null,
                        }),
                      }
                      : prev,
                  )
                }
                placeholder={t("factions.leaderPlaceholder")}
              />
              <Input
                value={force.pressure}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        forces: updateArrayItem<WorldForce>(prev.forces, index, {
                          ...force,
                          pressure: event.target.value,
                        }),
                      }
                      : prev,
                  )
                }
                placeholder={t("factions.pressurePlaceholder")}
              />
            </div>
            <div className="grid gap-2 md:grid-cols-1">
              <Input
                value={force.narrativeRole}
                onChange={(event) =>
                  setDraftStructure((prev) =>
                    prev
                      ? {
                        ...prev,
                        forces: updateArrayItem<WorldForce>(prev.forces, index, {
                          ...force,
                          narrativeRole: event.target.value,
                        }),
                      }
                      : prev,
                  )
                }
                placeholder={t("factions.narrativeRolePlaceholder")}
              />
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
