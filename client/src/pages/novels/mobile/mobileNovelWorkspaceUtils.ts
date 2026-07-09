import i18n from "@/i18n";
import type { NovelWorkspaceTab } from "../novelWorkspaceNavigation";
import type { NovelEditViewProps } from "../components/NovelEditView.types";

export interface MobileSaveState {
  visible: boolean;
  label: string;
  savingLabel: string;
  isSaving: boolean;
  onSave: () => void;
}

export function getMobileNovelWorkspaceStatusText(input: {
  activeLabel: string;
  workflowLabel: string;
}): string {
  if (input.activeLabel === input.workflowLabel) {
    return i18n.t("status.currentStep", { ns: "novelsMobile", label: input.activeLabel });
  }

  return i18n.t("status.currentStepWithRecommended", {
    ns: "novelsMobile",
    activeLabel: input.activeLabel,
    workflowLabel: input.workflowLabel,
  });
}

export function getMobileNovelSaveState(
  tab: NovelWorkspaceTab,
  props: NovelEditViewProps,
): MobileSaveState {
  switch (tab) {
    case "basic":
      return {
        visible: true,
        label: i18n.t("save.basic", { ns: "novelsMobile" }),
        savingLabel: i18n.t("save.saving", { ns: "novelsMobile" }),
        isSaving: props.basicTab.isSaving,
        onSave: props.basicTab.onSave,
      };
    case "story_macro":
      return {
        visible: true,
        label: i18n.t("save.storyMacro", { ns: "novelsMobile" }),
        savingLabel: i18n.t("save.saving", { ns: "novelsMobile" }),
        isSaving: props.storyMacroTab.isSaving,
        onSave: props.storyMacroTab.onSaveEdits,
      };
    case "character":
      return {
        visible: true,
        label: i18n.t("save.character", { ns: "novelsMobile" }),
        savingLabel: i18n.t("save.saving", { ns: "novelsMobile" }),
        isSaving: props.characterTab.isSavingCharacter,
        onSave: props.characterTab.onSaveCharacter,
      };
    case "outline":
      return {
        visible: true,
        label: i18n.t("save.outline", { ns: "novelsMobile" }),
        savingLabel: i18n.t("save.saving", { ns: "novelsMobile" }),
        isSaving: props.outlineTab.isSaving,
        onSave: props.outlineTab.onSave,
      };
    case "structured":
      return {
        visible: true,
        label: i18n.t("save.structured", { ns: "novelsMobile" }),
        savingLabel: i18n.t("save.saving", { ns: "novelsMobile" }),
        isSaving: props.structuredTab.isSaving,
        onSave: props.structuredTab.onSave,
      };
    default:
      return {
        visible: false,
        label: "",
        savingLabel: "",
        isSaving: false,
        onSave: () => undefined,
      };
  }
}
