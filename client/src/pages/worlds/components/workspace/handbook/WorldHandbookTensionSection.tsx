import { GitBranch } from "lucide-react";
import type { Dispatch, SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type { WorldStructuredData } from "@ai-novel/shared/types/world";
import { Button } from "@/components/ui/button";
import { HandbookField, HandbookTextarea, SectionHeader } from "./HandbookPrimitives";
import { listToText, textToList } from "./handbookEditorUtils";

export default function WorldHandbookTensionSection(props: {
  draftStructure: WorldStructuredData;
  setDraftStructure: Dispatch<SetStateAction<WorldStructuredData | null>>;
  onOpenDeepening: () => void;
  onOpenLayers: () => void;
  onOpenAdvanced: () => void;
}) {
  const { draftStructure, setDraftStructure, onOpenDeepening, onOpenLayers, onOpenAdvanced } = props;
  const { t } = useTranslation("worldsComponentsB");

  return (
    <section className="rounded-md border p-4">
      <SectionHeader
        icon={GitBranch}
        title={t("handbookTension.title")}
        description={t("handbookTension.description")}
      />
      <div className="mt-4 grid gap-3 lg:grid-cols-2">
        <HandbookField title={t("handbookTension.conflictTitle")} hint={t("handbookTension.conflictHint")}>
          <HandbookTextarea
            value={draftStructure.profile.coreConflict}
            onChange={(value) =>
              setDraftStructure((prev) => (prev ? { ...prev, profile: { ...prev.profile, coreConflict: value } } : prev))
            }
            placeholder={t("handbookTension.conflictPlaceholder")}
          />
        </HandbookField>
        <HandbookField title={t("handbookTension.consequencesTitle")} hint={t("handbookTension.consequencesHint")}>
          <HandbookTextarea
            value={listToText(draftStructure.rules.sharedConsequences)}
            onChange={(value) =>
              setDraftStructure((prev) =>
                prev ? { ...prev, rules: { ...prev.rules, sharedConsequences: textToList(value) } } : prev,
              )
            }
            placeholder={t("handbookTension.consequencesPlaceholder")}
          />
        </HandbookField>
        <HandbookField title={t("handbookTension.tabooTitle")} hint={t("handbookTension.tabooHint")}>
          <HandbookTextarea
            value={listToText(draftStructure.rules.taboo)}
            onChange={(value) =>
              setDraftStructure((prev) => (prev ? { ...prev, rules: { ...prev.rules, taboo: textToList(value) } } : prev))
            }
            placeholder={t("handbookTension.tabooPlaceholder")}
          />
        </HandbookField>
        <div className="rounded-md border border-dashed p-3 text-sm leading-6 text-muted-foreground">
          {t("handbookTension.advancedNote")}
          <div className="mt-3 flex flex-wrap gap-2">
            <Button type="button" variant="outline" size="sm" onClick={onOpenDeepening}>
              {t("handbookTension.openDeepening")}
            </Button>
            <Button type="button" variant="outline" size="sm" onClick={onOpenLayers}>
              {t("handbookTension.openLayers")}
            </Button>
            <Button type="button" variant="ghost" size="sm" onClick={onOpenAdvanced}>
              {t("handbookTension.openAdvanced")}
            </Button>
          </div>
        </div>
      </div>
    </section>
  );
}
