import i18n from "@/i18n";
import type { TensionCurvePoint } from "./tensionCurveTypes";

export interface TensionCurveShapeHint {
  key: string;
  label: string;
  detail: string;
}

export interface TensionCurveReferenceTemplate {
  key: string;
  label: string;
  values: number[];
}

export const tensionCurveReferenceTemplates: TensionCurveReferenceTemplate[] = [
  {
    key: "escalation",
    label: "referenceTemplate.escalation",
    values: [22, 30, 42, 38, 56, 66, 62, 82, 72],
  },
  {
    key: "suspense",
    label: "referenceTemplate.suspense",
    values: [35, 46, 40, 58, 52, 68, 64, 78, 88],
  },
];

function numericPoints(points: TensionCurvePoint[]): Array<TensionCurvePoint & { value: number }> {
  return points.filter((point): point is TensionCurvePoint & { value: number } => typeof point.value === "number");
}

export function buildReferenceCurveValues(template: TensionCurveReferenceTemplate, pointCount: number): number[] {
  if (pointCount <= 0) {
    return [];
  }
  if (pointCount === 1) {
    return [template.values[0] ?? 50];
  }
  const maxIndex = template.values.length - 1;
  return Array.from({ length: pointCount }, (_, index) => {
    const position = (index / (pointCount - 1)) * maxIndex;
    const left = Math.floor(position);
    const right = Math.min(maxIndex, Math.ceil(position));
    const ratio = position - left;
    const leftValue = template.values[left] ?? 50;
    const rightValue = template.values[right] ?? leftValue;
    return Math.round(leftValue + (rightValue - leftValue) * ratio);
  });
}

export function analyzeTensionCurveShape(points: TensionCurvePoint[]): TensionCurveShapeHint[] {
  const values = numericPoints(points);
  if (values.length < 3) {
    return [];
  }

  const hints: TensionCurveShapeHint[] = [];
  let flatStartIndex = 0;
  for (let index = 1; index < values.length; index += 1) {
    if (Math.abs(values[index].value - values[index - 1].value) <= 3) {
      if (index - flatStartIndex >= 2) {
        hints.push({
          key: `flat-${values[flatStartIndex].id}-${values[index].id}`,
          label: i18n.t("shapeHint.flatPlateauLabel", { ns: "componentsTension" }),
          detail: i18n.t("shapeHint.flatPlateauDetail", {
            ns: "componentsTension",
            start: values[flatStartIndex].chapterOrder,
            end: values[index].chapterOrder,
          }),
        });
        break;
      }
    } else {
      flatStartIndex = index;
    }
  }

  const peak = values.reduce((best, point) => (point.value > best.value ? point : best), values[0]);
  const finalWindowStart = Math.max(0, Math.floor(values.length * 0.75));
  const finalPeak = values.slice(finalWindowStart).reduce((best, point) => (point.value > best.value ? point : best), values[finalWindowStart]);
  if (peak && finalPeak && finalPeak.value < peak.value - 8) {
    hints.push({
      key: "late-peak-missing",
      label: i18n.t("shapeHint.weakFinalPeakLabel", { ns: "componentsTension" }),
      detail: i18n.t("shapeHint.weakFinalPeakDetail", {
        ns: "componentsTension",
        peak: peak.chapterOrder,
      }),
    });
  }

  const beatGroups = new Map<string, Array<TensionCurvePoint & { value: number }>>();
  values.forEach((point) => {
    if (!point.beatKey) {
      return;
    }
    const group = beatGroups.get(point.beatKey) ?? [];
    group.push(point);
    beatGroups.set(point.beatKey, group);
  });
  for (const group of beatGroups.values()) {
    if (group.length < 3) {
      continue;
    }
    const min = Math.min(...group.map((point) => point.value));
    const max = Math.max(...group.map((point) => point.value));
    if (max - min <= 5) {
      hints.push({
        key: `beat-flat-${group[0].beatKey}`,
        label: i18n.t("shapeHint.beatFlatLabel", { ns: "componentsTension" }),
        detail: i18n.t("shapeHint.beatFlatDetail", {
          ns: "componentsTension",
          start: group[0].chapterOrder,
          end: group[group.length - 1].chapterOrder,
        }),
      });
      break;
    }
  }

  return hints.slice(0, 3);
}
