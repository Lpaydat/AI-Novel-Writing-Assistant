import { Plus, WandSparkles } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type { WorldRule, WorldStructuredData } from "@ai-novel/shared/types/world";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { HandbookField, HandbookTextarea, SectionHeader } from "./HandbookPrimitives";
import { makeId, removeItem, updateItem } from "./handbookEditorUtils";

export default function WorldHandbookRuleSection(props: {
  draftStructure: WorldStructuredData;
  setDraftStructure: Dispatch<SetStateAction<WorldStructuredData | null>>;
}) {
  const { draftStructure, setDraftStructure } = props;
  const { t } = useTranslation("worldsComponentsB");

  const addRule = () => {
    setDraftStructure((prev) =>
      prev
        ? {
          ...prev,
          rules: {
            ...prev.rules,
            axioms: [
              ...prev.rules.axioms,
              {
                id: makeId("rule", prev.rules.axioms.length),
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
    );
  };

  return (
    <section className="rounded-md border p-4">
      <SectionHeader
        icon={WandSparkles}
        title={t("handbookRule.title")}
        description={t("handbookRule.description")}
        count={draftStructure.rules.axioms.length}
      />
      <div className="mt-4 space-y-3">
        <HandbookField title={t("handbookRule.summaryTitle")} hint={t("handbookRule.summaryHint")}>
          <HandbookTextarea
            value={draftStructure.rules.summary}
            onChange={(value) =>
              setDraftStructure((prev) => (prev ? { ...prev, rules: { ...prev.rules, summary: value } } : prev))
            }
            placeholder={t("handbookRule.summaryPlaceholder")}
            minRows={3}
          />
        </HandbookField>
        <div className="grid gap-3 lg:grid-cols-2">
          {draftStructure.rules.axioms.map((rule: WorldRule, index) => (
            <div key={rule.id || index} className="rounded-md border bg-muted/20 p-3">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium">{t("handbookRule.cardTitle", { index: index + 1 })}</div>
                <Button
                  type="button"
                  size="sm"
                  variant="ghost"
                  onClick={() =>
                    setDraftStructure((prev) =>
                      prev ? { ...prev, rules: { ...prev.rules, axioms: removeItem(prev.rules.axioms, index) } } : prev,
                    )
                  }
                >
                  {t("common.remove")}
                </Button>
              </div>
              <div className="mt-3 grid gap-3">
                <HandbookField title={t("handbookRule.nameTitle")} hint={t("handbookRule.nameHint")}>
                  <Input
                    value={rule.name}
                    onChange={(event) =>
                      setDraftStructure((prev) =>
                        prev
                          ? {
                            ...prev,
                            rules: {
                              ...prev.rules,
                              axioms: updateItem(prev.rules.axioms, index, { name: event.target.value }),
                            },
                          }
                          : prev,
                      )
                    }
                    placeholder={t("handbookRule.namePlaceholder")}
                  />
                </HandbookField>
                <HandbookField title={t("handbookRule.meaningTitle")} hint={t("handbookRule.meaningHint")}>
                  <HandbookTextarea
                    value={rule.summary}
                    onChange={(value) =>
                      setDraftStructure((prev) =>
                        prev
                          ? {
                            ...prev,
                            rules: { ...prev.rules, axioms: updateItem(prev.rules.axioms, index, { summary: value }) },
                          }
                          : prev,
                      )
                    }
                    placeholder={t("handbookRule.meaningPlaceholder")}
                    minRows={3}
                  />
                </HandbookField>
                <HandbookField title={t("handbookRule.costTitle")} hint={t("handbookRule.costHint")}>
                  <Input
                    value={rule.cost}
                    onChange={(event) =>
                      setDraftStructure((prev) =>
                        prev
                          ? {
                            ...prev,
                            rules: {
                              ...prev.rules,
                              axioms: updateItem(prev.rules.axioms, index, { cost: event.target.value }),
                            },
                          }
                          : prev,
                      )
                    }
                    placeholder={t("handbookRule.costPlaceholder")}
                  />
                </HandbookField>
                <HandbookField title={t("handbookRule.boundaryTitle")} hint={t("handbookRule.boundaryHint")}>
                  <Input
                    value={rule.boundary}
                    onChange={(event) =>
                      setDraftStructure((prev) =>
                        prev
                          ? {
                            ...prev,
                            rules: {
                              ...prev.rules,
                              axioms: updateItem(prev.rules.axioms, index, { boundary: event.target.value }),
                            },
                          }
                          : prev,
                      )
                    }
                    placeholder={t("handbookRule.boundaryPlaceholder")}
                  />
                </HandbookField>
              </div>
            </div>
          ))}
        </div>
        <Button type="button" variant="outline" onClick={addRule}>
          <Plus className="mr-2 h-4 w-4" aria-hidden="true" />
          {t("handbookRule.add")}
        </Button>
      </div>
    </section>
  );
}
