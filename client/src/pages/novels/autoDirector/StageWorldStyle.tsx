import { useTranslation } from "react-i18next";
import type { DirectorWorldSetupMode } from "@ai-novel/shared/types/novelDirector";
import type { StyleIntentSummary } from "@ai-novel/shared/types/styleEngine";
import { Button } from "@/components/ui/button";
import { AUTO_DIRECTOR_MOBILE_CLASSES } from "@/mobile/autoDirector";
import type { NovelBasicFormState } from "../novelBasicInfo.shared";
import { BASIC_INFO_FIELD_HINTS } from "../novelBasicInfo.shared";
import { FieldLabel } from "../components/basicInfoForm/BasicInfoFormPrimitives";
import SelectControl from "@/components/common/SelectControl";

interface StageWorldStyleProps {
  basicForm: NovelBasicFormState;
  worldOptions: Array<{ id: string; name: string }>;
  worldSetupMode: DirectorWorldSetupMode;
  onWorldSetupModeChange: (value: DirectorWorldSetupMode) => void;
  styleProfileOptions: Array<{ id: string; name: string }>;
  selectedStyleProfileId: string;
  selectedStyleSummary: StyleIntentSummary | null;
  onStyleProfileChange: (value: string) => void;
  onBasicFormChange: (patch: Partial<NovelBasicFormState>) => void;
  onBack: () => void;
  onConfirm: () => void;
}

export default function StageWorldStyle({
  basicForm,
  worldOptions,
  worldSetupMode,
  onWorldSetupModeChange,
  styleProfileOptions,
  selectedStyleProfileId,
  selectedStyleSummary,
  onStyleProfileChange,
  onBasicFormChange,
  onBack,
  onConfirm,
}: StageWorldStyleProps) {
  const { t } = useTranslation("novelsAutoDirector");
  const selectedWorld = worldOptions.find((world) => world.id === basicForm.worldId) ?? null;
  const controlClassName = "w-full rounded-lg border-0 bg-muted/40 px-3 py-2.5 text-sm outline-none ring-1 ring-transparent transition hover:bg-muted/55 focus:bg-background focus:ring-2 focus:ring-primary/25";

  return (
    <section className="mx-auto w-full max-w-5xl space-y-7 py-4">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <div className="text-2xl font-semibold tracking-normal text-foreground">{t("worldStyle.heading")}</div>
          <div className={`mt-2 max-w-2xl text-sm leading-6 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
            {t("worldStyle.description")}
          </div>
        </div>
        <div className="rounded-full bg-muted/55 px-3 py-1 text-xs text-muted-foreground">
          {t("worldStyle.optionalBadge")}
        </div>
      </div>

      <div className="space-y-5">
        <div className="space-y-2">
          <FieldLabel htmlFor="director-basic-world" hint={BASIC_INFO_FIELD_HINTS.worldId}>{t("worldStyle.worldField.label")}</FieldLabel>
          <SelectControl
            id="director-basic-world"
            className={controlClassName}
            value={basicForm.worldId}
            onChange={(event) => onBasicFormChange({ worldId: event.target.value })}
          >
            <option value="">{t("worldStyle.worldField.none")}</option>
            {worldOptions.length === 0 ? (
              <option value="" disabled>{t("worldStyle.worldField.empty")}</option>
            ) : null}
            {worldOptions.map((world) => (
              <option key={world.id} value={world.id}>{world.name}</option>
            ))}
          </SelectControl>
          <div className={`text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
            {worldOptions.length > 0
              ? t("worldStyle.worldField.hasWorldsHint")
              : t("worldStyle.worldField.noWorldsHint")}
          </div>
        </div>

        <div className="space-y-3 pt-2">
          <div className="text-sm font-medium text-foreground">{t("worldStyle.processing.heading")}</div>
          {selectedWorld ? (
            <div className={`text-sm leading-6 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
              {t("worldStyle.processing.selectedWorld", { name: selectedWorld.name })}
            </div>
          ) : (
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                type="button"
                className={`rounded-lg px-4 py-4 text-left transition ring-1 ${
                  worldSetupMode === "auto_generate"
                    ? "bg-foreground text-background ring-foreground shadow-sm"
                    : "bg-background/60 text-foreground ring-border/25 hover:bg-background"
                }`}
                onClick={() => onWorldSetupModeChange("auto_generate")}
              >
                <div className="text-sm font-medium">{t("worldStyle.mode.autoGenerate.title")}</div>
                <div className={`mt-2 text-xs leading-5 ${worldSetupMode === "auto_generate" ? "text-background/70" : "text-muted-foreground"} ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                  {t("worldStyle.mode.autoGenerate.description")}
                </div>
              </button>
              <button
                type="button"
                className={`rounded-lg px-4 py-4 text-left transition ring-1 ${
                  worldSetupMode === "skip"
                    ? "bg-foreground text-background ring-foreground shadow-sm"
                    : "bg-background/60 text-foreground ring-border/25 hover:bg-background"
                }`}
                onClick={() => onWorldSetupModeChange("skip")}
              >
                <div className="text-sm font-medium">{t("worldStyle.mode.skip.title")}</div>
                <div className={`mt-2 text-xs leading-5 ${worldSetupMode === "skip" ? "text-background/70" : "text-muted-foreground"} ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                  {t("worldStyle.mode.skip.description")}
                </div>
              </button>
            </div>
          )}
        </div>

        <div className="space-y-2">
          <FieldLabel htmlFor="director-basic-style-profile" hint={t("worldStyle.styleField.hint")}>
            {t("worldStyle.styleField.label")}
          </FieldLabel>
          <SelectControl
            id="director-basic-style-profile"
            className={controlClassName}
            value={selectedStyleProfileId}
            onChange={(event) => onStyleProfileChange(event.target.value)}
          >
            <option value="">{t("worldStyle.styleField.keywordsOnly")}</option>
            {styleProfileOptions.map((option) => (
              <option key={option.id} value={option.id}>{option.name}</option>
            ))}
          </SelectControl>
          <div className={`text-xs leading-5 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
            {selectedStyleSummary?.stageSummaryLines[0] ?? t("worldStyle.styleField.defaultHint")}
          </div>
          {selectedStyleSummary?.stageSummaryLines.length ? (
            <div className={`pt-1 text-xs leading-6 text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
              {t("worldStyle.styleField.summaryPrefix")}{selectedStyleSummary.stageSummaryLines.join(t("worldStyle.styleField.summaryJoiner"))}
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-col gap-2 pt-2 sm:flex-row sm:justify-between">
        <Button type="button" variant="ghost" onClick={onBack}>{t("worldStyle.back")}</Button>
        <Button type="button" onClick={onConfirm}>{t("worldStyle.confirm")}</Button>
      </div>
    </section>
  );
}
