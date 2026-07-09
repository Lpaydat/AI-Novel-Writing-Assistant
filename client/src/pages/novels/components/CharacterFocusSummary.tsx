import type { Character } from "@ai-novel/shared/types/novel";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { getCastRoleLabel, getCharacterGenderLabel, isProtagonistCharacter } from "./characterAssetWorkspace.helpers";

interface CharacterFocusSummaryProps {
  selectedCharacter: Character;
  lastAppearanceChapter?: number | null;
}

export default function CharacterFocusSummary(props: CharacterFocusSummaryProps) {
  const { t } = useTranslation("novelsEditB");
  const { selectedCharacter, lastAppearanceChapter } = props;
  const isProtagonist = isProtagonistCharacter(selectedCharacter);
  const focusTitle = isProtagonist
    ? t("characterFocus.focusTitleProtagonist", { name: selectedCharacter.name })
    : t("characterFocus.focusTitleSupporting", { name: selectedCharacter.name });
  const primaryLine = isProtagonist
    ? selectedCharacter.currentGoal || selectedCharacter.storyFunction || t("characterFocus.primaryLineProtagonistFallback")
    : selectedCharacter.relationToProtagonist || selectedCharacter.role || t("characterFocus.primaryLineSupportingFallback");

  return (
    <div className={`rounded-xl border p-4 ${isProtagonist ? "border-primary/30 bg-primary/5" : "bg-muted/10"}`}>
      <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
        <div className="min-w-0 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <div className="text-base font-semibold">{focusTitle}</div>
            {isProtagonist ? (
              <Badge variant="secondary">{t("characterFocus.protagonistBadge")}</Badge>
            ) : (
              <Badge variant="outline">{getCastRoleLabel(selectedCharacter.castRole)}</Badge>
            )}
            <Badge variant="secondary">{getCharacterGenderLabel(selectedCharacter.gender)}</Badge>
          </div>
          <div className="text-sm leading-6 text-muted-foreground">
            {isProtagonist
              ? t("characterFocus.currentGoalLine", { value: primaryLine })
              : t("characterFocus.relationLine", { value: primaryLine })}
          </div>
        </div>
        <div className="grid gap-1 text-xs text-muted-foreground sm:grid-cols-2 lg:min-w-[320px]">
          <div>{t("characterFocus.identityLine", { value: selectedCharacter.role || t("characterFocus.identityFallback") })}</div>
          <div>{t("characterFocus.lastAppearanceLine", { value: lastAppearanceChapter ? t("characterFocus.chapterNumber", { chapter: lastAppearanceChapter }) : t("characterFocus.none") })}</div>
          <div>{t("characterFocus.storyFunctionLine", { value: selectedCharacter.storyFunction || t("characterFocus.toBeCompleted") })}</div>
          <div>{t("characterFocus.currentStateLine", { value: selectedCharacter.currentState || t("characterFocus.toBeCompleted") })}</div>
        </div>
      </div>
    </div>
  );
}
