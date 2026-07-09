import { useTranslation } from "react-i18next";
import type {
  WorldSkeletonGenerationCounts,
  WorldSkeletonPreset,
} from "@ai-novel/shared/types/worldWizard";
import {
  WORLD_SKELETON_COUNT_LIMITS,
  WORLD_SKELETON_PRESET_COUNTS,
} from "@ai-novel/shared/types/worldWizard";
import { Button } from "@/components/ui/button";

const PRESET_CARDS: Array<{
  value: WorldSkeletonPreset;
  title: string;
  description: string;
}> = [
  {
    value: "light",
    title: "stepTwo.preset.light.title",
    description: "stepTwo.preset.light.desc",
  },
  {
    value: "standard",
    title: "stepTwo.preset.standard.title",
    description: "stepTwo.preset.standard.desc",
  },
  {
    value: "epic",
    title: "stepTwo.preset.epic.title",
    description: "stepTwo.preset.epic.desc",
  },
];

const COUNT_LABELS: Record<keyof WorldSkeletonGenerationCounts, string> = {
  rules: "stepTwo.count.rules",
  factionGroups: "stepTwo.count.factionGroups",
  forces: "stepTwo.count.forces",
  locations: "stepTwo.count.locations",
  conflicts: "stepTwo.count.conflicts",
  storyEntrySuggestions: "stepTwo.count.storyEntrySuggestions",
};

interface WorldGeneratorStepTwoProps {
  preset: WorldSkeletonPreset;
  counts: WorldSkeletonGenerationCounts;
  generating: boolean;
  onPresetChange: (preset: WorldSkeletonPreset) => void;
  onCountChange: (key: keyof WorldSkeletonGenerationCounts, value: number) => void;
  onGenerateSkeleton: () => void;
}

export default function WorldGeneratorStepTwo(props: WorldGeneratorStepTwoProps) {
  const {
    preset,
    counts,
    generating,
    onPresetChange,
    onCountChange,
    onGenerateSkeleton,
  } = props;
  const { t } = useTranslation("worldsComponentsB");

  return (
    <div className="space-y-4">
      <div className="rounded-md border bg-background p-4">
        <div className="text-sm font-medium">{t("stepTwo.scaleTitle")}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {t("stepTwo.scaleHint")}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-3">
        {PRESET_CARDS.map((item) => (
          <button
            key={item.value}
            type="button"
            className={`rounded-md border p-4 text-left transition ${
              preset === item.value ? "border-primary bg-primary/5" : "bg-background hover:border-primary/60"
            }`}
            onClick={() => onPresetChange(item.value)}
          >
            <div className="text-sm font-semibold">{t(item.title)}</div>
            <div className="mt-2 text-xs leading-5 text-muted-foreground">{t(item.description)}</div>
            <div className="mt-3 grid grid-cols-2 gap-1 text-xs text-muted-foreground">
              <span>{t("stepTwo.stat.forces", { count: WORLD_SKELETON_PRESET_COUNTS[item.value].forces })}</span>
              <span>{t("stepTwo.stat.locations", { count: WORLD_SKELETON_PRESET_COUNTS[item.value].locations })}</span>
              <span>{t("stepTwo.stat.conflicts", { count: WORLD_SKELETON_PRESET_COUNTS[item.value].conflicts })}</span>
              <span>{t("stepTwo.stat.entries", { count: WORLD_SKELETON_PRESET_COUNTS[item.value].storyEntrySuggestions })}</span>
            </div>
          </button>
        ))}
      </div>

      <div className="rounded-md border p-4">
        <div className="text-sm font-medium">{t("stepTwo.adjustTitle")}</div>
        <div className="mt-1 text-xs text-muted-foreground">
          {t("stepTwo.adjustHint")}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {(Object.keys(COUNT_LABELS) as Array<keyof WorldSkeletonGenerationCounts>).map((key) => {
            const limit = WORLD_SKELETON_COUNT_LIMITS[key];
            return (
              <label key={key} className="rounded-md border p-3 text-sm">
                <div className="flex items-center justify-between gap-3">
                  <span className="font-medium">{t(COUNT_LABELS[key])}</span>
                  <span className="text-xs text-muted-foreground">{counts[key]}</span>
                </div>
                <input
                  className="mt-3 w-full"
                  type="range"
                  min={limit.min}
                  max={limit.max}
                  step={1}
                  value={counts[key]}
                  onChange={(event) => onCountChange(key, Number(event.target.value))}
                />
              </label>
            );
          })}
        </div>
      </div>

      <Button onClick={onGenerateSkeleton} disabled={generating}>
        {generating ? t("stepTwo.generating") : t("stepTwo.generate")}
      </Button>
    </div>
  );
}
