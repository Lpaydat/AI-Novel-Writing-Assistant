import { useTranslation } from "react-i18next";
import type { AutoDirectorFollowUpItem, AutoDirectorMutationActionCode } from "@ai-novel/shared/types/autoDirectorFollowUp";
import type { AutoDirectorFollowUpSection } from "@ai-novel/shared/types/autoDirectorValidation";
import i18n from "@/i18n";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { AUTO_DIRECTOR_MOBILE_CLASSES } from "@/mobile/autoDirector";

interface AutoDirectorFollowUpBatchBarProps {
  selectedItems: AutoDirectorFollowUpItem[];
  batchActionCode: AutoDirectorMutationActionCode | null;
  loading: boolean;
  onClear: () => void;
  onExecute: () => void | Promise<void>;
}

function formatBatchActionLabel(actionCode: AutoDirectorMutationActionCode | null): string {
  if (actionCode === "continue_auto_execution") {
    return i18n.t("batchBar.continueLowRisk", { ns: "autoDirectorFollowUps" });
  }
  if (actionCode === "retry_with_task_model") {
    return i18n.t("batchBar.retryException", { ns: "autoDirectorFollowUps" });
  }
  return i18n.t("batchBar.noCommonAction", { ns: "autoDirectorFollowUps" });
}

function getSelectedSection(items: AutoDirectorFollowUpItem[]): AutoDirectorFollowUpSection | null {
  const sections = Array.from(new Set(items.map((item) => item.section)));
  return sections.length === 1 ? sections[0] : null;
}

export function AutoDirectorFollowUpBatchBar({
  selectedItems,
  batchActionCode,
  loading,
  onClear,
  onExecute,
}: AutoDirectorFollowUpBatchBarProps) {
  const { t } = useTranslation("autoDirectorFollowUps");
  if (selectedItems.length === 0) {
    return null;
  }
  const selectedSection = getSelectedSection(selectedItems);

  return (
    <Card className={AUTO_DIRECTOR_MOBILE_CLASSES.followUpBatchBar}>
      <CardContent className="flex flex-col gap-3 pt-6 md:flex-row md:items-center md:justify-between">
        <div className={`min-w-0 text-sm ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
          {t("batchBar.selectedCount", { count: selectedItems.length })}
          <div className="text-xs text-muted-foreground">
            {selectedSection === "pending" || selectedSection === "exception"
              ? formatBatchActionLabel(batchActionCode)
              : t("batchBar.noBatchForSection")}
          </div>
        </div>
        <div className="grid grid-cols-2 gap-2 md:flex">
          <Button variant="outline" size="sm" className="w-full md:w-auto" onClick={onClear} disabled={loading}>
            {t("batchBar.clear")}
          </Button>
          <Button size="sm" className="w-full md:w-auto" onClick={() => void onExecute()} disabled={!batchActionCode || loading}>
            {t("batchBar.execute")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
