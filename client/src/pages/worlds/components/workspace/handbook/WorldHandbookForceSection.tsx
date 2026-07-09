import { useMemo } from "react";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import { Castle, Plus } from "lucide-react";
import type { WorldForce, WorldStructuredData } from "@ai-novel/shared/types/world";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HandbookField, HandbookTextarea, SectionHeader } from "./HandbookPrimitives";
import { makeId, removeItem, updateItem } from "./handbookEditorUtils";

export default function WorldHandbookForceSection(props: {
  draftStructure: WorldStructuredData;
  setDraftStructure: Dispatch<SetStateAction<WorldStructuredData | null>>;
}) {
  const { draftStructure, setDraftStructure } = props;
  const { t } = useTranslation("worldsComponentsB");
  const forceSummary = useMemo(() => {
    const forceNames = draftStructure.forces.map((force) => force.name).filter(Boolean).slice(0, 4);
    return forceNames.length > 0 ? forceNames.join(" / ") : t("handbookForce.summaryFallback");
  }, [draftStructure.forces, t]);

  const addForce = () => {
    setDraftStructure((prev) =>
      prev
        ? {
          ...prev,
          forces: [
            ...prev.forces,
            {
              id: makeId("force", prev.forces.length),
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
    );
  };

  return (
    <section className="rounded-md border p-4">
      <SectionHeader
        icon={Castle}
        title={t("handbookForce.title")}
        description={t("handbookForce.description", { summary: forceSummary })}
        count={draftStructure.forces.length}
      />
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {draftStructure.forces.map((force: WorldForce, index) => (
          <div key={force.id || index} className="rounded-md border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium">{t("handbookForce.cardTitle", { index: index + 1 })}</div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setDraftStructure((prev) => (prev ? { ...prev, forces: removeItem(prev.forces, index) } : prev))
                }
              >
                {t("common.remove")}
              </Button>
            </div>
            <div className="mt-3 grid gap-3">
              <HandbookField title={t("handbookForce.nameTitle")} hint={t("handbookForce.nameHint")}>
                <Input
                  value={force.name}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev ? { ...prev, forces: updateItem(prev.forces, index, { name: event.target.value }) } : prev,
                    )
                  }
                  placeholder={t("handbookForce.namePlaceholder")}
                />
              </HandbookField>
              <HandbookField title={t("handbookForce.typeTitle")} hint={t("handbookForce.typeHint")}>
                <Input
                  value={force.type}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev ? { ...prev, forces: updateItem(prev.forces, index, { type: event.target.value }) } : prev,
                    )
                  }
                  placeholder={t("handbookForce.typePlaceholder")}
                />
              </HandbookField>
              <HandbookField title={t("handbookForce.summaryTitle")} hint={t("handbookForce.summaryHint")}>
                <HandbookTextarea
                  value={force.summary}
                  onChange={(value) =>
                    setDraftStructure((prev) =>
                      prev ? { ...prev, forces: updateItem(prev.forces, index, { summary: value }) } : prev,
                    )
                  }
                  placeholder={t("handbookForce.summaryPlaceholder")}
                  minRows={3}
                />
              </HandbookField>
              <HandbookField title={t("handbookForce.objectiveTitle")} hint={t("handbookForce.objectiveHint")}>
                <Input
                  value={force.currentObjective}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? { ...prev, forces: updateItem(prev.forces, index, { currentObjective: event.target.value }) }
                        : prev,
                    )
                  }
                  placeholder={t("handbookForce.objectivePlaceholder")}
                />
              </HandbookField>
              <HandbookField title={t("handbookForce.pressureTitle")} hint={t("handbookForce.pressureHint")}>
                <Input
                  value={force.pressure}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev ? { ...prev, forces: updateItem(prev.forces, index, { pressure: event.target.value }) } : prev,
                    )
                  }
                  placeholder={t("handbookForce.pressurePlaceholder")}
                />
              </HandbookField>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" className="mt-3" variant="outline" onClick={addForce}>
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        {t("handbookForce.add")}
      </Button>
    </section>
  );
}
