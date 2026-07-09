import type { DramaSourceType } from "@/api/drama";
import i18n from "@/i18n";

export const DRAMA_TRACK_OPTIONS = [
  { value: "counterattack", labelKey: "track.counterattack" },
  { value: "rebirth_revenge", labelKey: "track.rebirthRevenge" },
  { value: "war_god", labelKey: "track.warGod" },
  { value: "live_in_son", labelKey: "track.liveInSon" },
  { value: "miracle_doctor", labelKey: "track.miracleDoctor" },
  { value: "rich_family", labelKey: "track.richFamily" },
  { value: "sweet_love", labelKey: "track.sweetLove" },
  { value: "hidden_identity", labelKey: "track.hiddenIdentity" },
] as const;

const DRAMA_SOURCE_LABEL_KEYS: Record<DramaSourceType, string> = {
  novel_import: "sourceType.novelImport",
  original: "sourceType.original",
  text_import: "sourceType.textImport",
};

export function dramaSourceLabel(source: DramaSourceType): string {
  return i18n.t(DRAMA_SOURCE_LABEL_KEYS[source], { ns: "drama" });
}

export function dramaTrackLabel(track?: string | null): string {
  if (!track) {
    return i18n.t("track.none", { ns: "drama" });
  }
  const option = DRAMA_TRACK_OPTIONS.find((item) => item.value === track);
  return option ? i18n.t(option.labelKey, { ns: "drama" }) : track;
}
