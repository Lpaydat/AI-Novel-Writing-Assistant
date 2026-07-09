import type { StoryMacroField } from "@ai-novel/shared/types/storyMacro";
import { useTranslation } from "react-i18next";
import AiButton from "@/components/common/AiButton";
import { Button } from "@/components/ui/button";

export const ENGINE_TEXT_FIELDS: Array<{
  field: StoryMacroField;
  label: string;
  placeholder: string;
  multiline?: boolean;
}> = [
  { field: "expanded_premise", label: "macroField.expanded_premise.label", placeholder: "macroField.expanded_premise.placeholder", multiline: true },
  { field: "protagonist_core", label: "macroField.protagonist_core.label", placeholder: "macroField.protagonist_core.placeholder", multiline: true },
  { field: "conflict_engine", label: "macroField.conflict_engine.label", placeholder: "macroField.conflict_engine.placeholder", multiline: true },
  { field: "mystery_box", label: "macroField.mystery_box.label", placeholder: "macroField.mystery_box.placeholder", multiline: true },
  { field: "emotional_line", label: "macroField.emotional_line.label", placeholder: "macroField.emotional_line.placeholder", multiline: true },
  { field: "tone_reference", label: "macroField.tone_reference.label", placeholder: "macroField.tone_reference.placeholder", multiline: true },
];

export const SUMMARY_FIELDS: Array<{
  field: StoryMacroField;
  label: string;
  placeholder: string;
  multiline?: boolean;
}> = [
  { field: "selling_point", label: "macroField.selling_point.label", placeholder: "macroField.selling_point.placeholder" },
  { field: "core_conflict", label: "macroField.core_conflict.label", placeholder: "macroField.core_conflict.placeholder" },
  { field: "main_hook", label: "macroField.main_hook.label", placeholder: "macroField.main_hook.placeholder" },
  { field: "progression_loop", label: "macroField.progression_loop.label", placeholder: "macroField.progression_loop.placeholder", multiline: true },
  { field: "growth_path", label: "macroField.growth_path.label", placeholder: "macroField.growth_path.placeholder", multiline: true },
  { field: "ending_flavor", label: "macroField.ending_flavor.label", placeholder: "macroField.ending_flavor.placeholder" },
];

export function listToText(value: string[]): string {
  return value.join("\n");
}

export function textareaClassName(minHeight = "min-h-28") {
  return `${minHeight} w-full rounded-md border border-input bg-transparent px-3 py-2 text-sm outline-none ring-offset-background placeholder:text-muted-foreground focus-visible:ring-2 focus-visible:ring-ring`;
}

export function FieldActions(props: {
  field: StoryMacroField;
  lockedFields: Partial<Record<StoryMacroField, boolean>>;
  regeneratingField: StoryMacroField | "";
  storyInput: string;
  onToggleLock: (field: StoryMacroField) => void;
  onRegenerateField: (field: StoryMacroField) => void;
}) {
  const { t } = useTranslation("novelsEditD");
  const isLocked = Boolean(props.lockedFields[props.field]);
  return (
    <div className="flex flex-wrap gap-2">
      <Button
        size="sm"
        variant={isLocked ? "secondary" : "outline"}
        onClick={() => props.onToggleLock(props.field)}
      >
        {isLocked ? t("fieldActions.locked") : t("fieldActions.lock")}
      </Button>
      <AiButton
        size="sm"
        variant="outline"
        onClick={() => props.onRegenerateField(props.field)}
        disabled={props.regeneratingField === props.field || isLocked || !props.storyInput.trim()}
      >
        {props.regeneratingField === props.field ? t("fieldActions.regenerating") : t("fieldActions.regenerate")}
      </AiButton>
    </div>
  );
}
