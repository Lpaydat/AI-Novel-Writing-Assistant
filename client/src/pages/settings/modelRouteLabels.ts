import type { ModelRouteTaskType } from "@ai-novel/shared/types/novel";

// Locale-aware: `titleKey`/`descriptionKey` are `settings` namespace translation
// keys, resolved with t() at React call sites (module-load i18n.t would freeze the
// locale).
export const MODEL_ROUTE_LABELS: Record<ModelRouteTaskType, { titleKey: string; descriptionKey: string }> = {
  planner: {
    titleKey: "shared.modelRoutePlannerTitle",
    descriptionKey: "shared.modelRoutePlannerDescription",
  },
  writer: {
    titleKey: "shared.modelRouteWriterTitle",
    descriptionKey: "shared.modelRouteWriterDescription",
  },
  review: {
    titleKey: "shared.modelRouteReviewTitle",
    descriptionKey: "shared.modelRouteReviewDescription",
  },
  light_review: {
    titleKey: "shared.modelRouteLightReviewTitle",
    descriptionKey: "shared.modelRouteLightReviewDescription",
  },
  critical_review: {
    titleKey: "shared.modelRouteCriticalReviewTitle",
    descriptionKey: "shared.modelRouteCriticalReviewDescription",
  },
  repair: {
    titleKey: "shared.modelRouteRepairTitle",
    descriptionKey: "shared.modelRouteRepairDescription",
  },
  replan: {
    titleKey: "shared.modelRouteReplanTitle",
    descriptionKey: "shared.modelRouteReplanDescription",
  },
  state_resolution: {
    titleKey: "shared.modelRouteStateResolutionTitle",
    descriptionKey: "shared.modelRouteStateResolutionDescription",
  },
  summary: {
    titleKey: "shared.modelRouteSummaryTitle",
    descriptionKey: "shared.modelRouteSummaryDescription",
  },
  fact_extraction: {
    titleKey: "shared.modelRouteFactExtractionTitle",
    descriptionKey: "shared.modelRouteFactExtractionDescription",
  },
  chat: {
    titleKey: "shared.modelRouteChatTitle",
    descriptionKey: "shared.modelRouteChatDescription",
  },
};
