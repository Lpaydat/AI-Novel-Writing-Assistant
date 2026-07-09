import { MapPinned, Plus } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type { WorldLocation, WorldStructuredData } from "@ai-novel/shared/types/world";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HandbookField, HandbookTextarea, SectionHeader } from "./HandbookPrimitives";
import { makeId, removeItem, updateItem } from "./handbookEditorUtils";

export default function WorldHandbookLocationSection(props: {
  draftStructure: WorldStructuredData;
  setDraftStructure: Dispatch<SetStateAction<WorldStructuredData | null>>;
}) {
  const { draftStructure, setDraftStructure } = props;
  const { t } = useTranslation("worldsComponentsB");

  const addLocation = () => {
    setDraftStructure((prev) =>
      prev
        ? {
          ...prev,
          locations: [
            ...prev.locations,
            {
              id: makeId("location", prev.locations.length),
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
    );
  };

  return (
    <section className="rounded-md border p-4">
      <SectionHeader
        icon={MapPinned}
        title={t("handbookLocation.title")}
        description={t("handbookLocation.description")}
        count={draftStructure.locations.length}
      />
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        {draftStructure.locations.map((location: WorldLocation, index) => (
          <div key={location.id || index} className="rounded-md border bg-muted/20 p-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium">{t("handbookLocation.cardTitle", { index: index + 1 })}</div>
              <Button
                type="button"
                size="sm"
                variant="ghost"
                onClick={() =>
                  setDraftStructure((prev) =>
                    prev ? { ...prev, locations: removeItem(prev.locations, index) } : prev,
                  )
                }
              >
                {t("common.remove")}
              </Button>
            </div>
            <div className="mt-3 grid gap-3">
              <HandbookField title={t("handbookLocation.nameTitle")} hint={t("handbookLocation.nameHint")}>
                <Input
                  value={location.name}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev ? { ...prev, locations: updateItem(prev.locations, index, { name: event.target.value }) } : prev,
                    )
                  }
                  placeholder={t("handbookLocation.namePlaceholder")}
                />
              </HandbookField>
              <HandbookField title={t("handbookLocation.terrainTitle")} hint={t("handbookLocation.terrainHint")}>
                <Input
                  value={location.terrain}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? { ...prev, locations: updateItem(prev.locations, index, { terrain: event.target.value }) }
                        : prev,
                    )
                  }
                  placeholder={t("handbookLocation.terrainPlaceholder")}
                />
              </HandbookField>
              <HandbookField title={t("handbookLocation.summaryTitle")} hint={t("handbookLocation.summaryHint")}>
                <HandbookTextarea
                  value={location.summary}
                  onChange={(value) =>
                    setDraftStructure((prev) =>
                      prev ? { ...prev, locations: updateItem(prev.locations, index, { summary: value }) } : prev,
                    )
                  }
                  placeholder={t("handbookLocation.summaryPlaceholder")}
                  minRows={3}
                />
              </HandbookField>
              <HandbookField title={t("handbookLocation.narrativeTitle")} hint={t("handbookLocation.narrativeHint")}>
                <Input
                  value={location.narrativeFunction}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev
                        ? {
                          ...prev,
                          locations: updateItem(prev.locations, index, { narrativeFunction: event.target.value }),
                        }
                        : prev,
                    )
                  }
                  placeholder={t("handbookLocation.narrativePlaceholder")}
                />
              </HandbookField>
              <HandbookField title={t("handbookLocation.riskTitle")} hint={t("handbookLocation.riskHint")}>
                <Input
                  value={location.risk}
                  onChange={(event) =>
                    setDraftStructure((prev) =>
                      prev ? { ...prev, locations: updateItem(prev.locations, index, { risk: event.target.value }) } : prev,
                    )
                  }
                  placeholder={t("handbookLocation.riskPlaceholder")}
                />
              </HandbookField>
            </div>
          </div>
        ))}
      </div>
      <Button type="button" className="mt-3" variant="outline" onClick={addLocation}>
        <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
        {t("handbookLocation.add")}
      </Button>
    </section>
  );
}
