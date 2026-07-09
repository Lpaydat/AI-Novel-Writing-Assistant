import i18n from "@/i18n";
import type { AutoDirectorChannelSettings } from "@/api/settings";

export interface AutoDirectorEventOption {
  code: string;
  // Locale-aware: `settings` namespace translation keys, resolved with t()/i18n.t
  // at call time (module-load i18n.t would freeze the locale).
  labelKey: string;
  descriptionKey: string;
}

export interface AutoDirectorChannelDraft {
  baseUrl: string;
  dingtalk: {
    webhookUrl: string;
    callbackToken: string;
    operatorMapJson: string;
    eventTypes: string[];
  };
  wecom: {
    webhookUrl: string;
    callbackToken: string;
    operatorMapJson: string;
    eventTypes: string[];
  };
}

export const AUTO_DIRECTOR_EVENT_OPTIONS: AutoDirectorEventOption[] = [
  {
    code: "auto_director.approval_required",
    labelKey: "shared.autoDirectorEventApprovalRequiredLabel",
    descriptionKey: "shared.autoDirectorEventApprovalRequiredDescription",
  },
  {
    code: "auto_director.auto_approved",
    labelKey: "shared.autoDirectorEventAutoApprovedLabel",
    descriptionKey: "shared.autoDirectorEventAutoApprovedDescription",
  },
  {
    code: "auto_director.exception",
    labelKey: "shared.autoDirectorEventExceptionLabel",
    descriptionKey: "shared.autoDirectorEventExceptionDescription",
  },
  {
    code: "auto_director.recovered",
    labelKey: "shared.autoDirectorEventRecoveredLabel",
    descriptionKey: "shared.autoDirectorEventRecoveredDescription",
  },
  {
    code: "auto_director.completed",
    labelKey: "shared.autoDirectorEventCompletedLabel",
    descriptionKey: "shared.autoDirectorEventCompletedDescription",
  },
  {
    code: "auto_director.progress_changed",
    labelKey: "shared.autoDirectorEventProgressChangedLabel",
    descriptionKey: "shared.autoDirectorEventProgressChangedDescription",
  },
];

const AUTO_DIRECTOR_EVENT_LABEL_KEY_MAP = new Map(
  AUTO_DIRECTOR_EVENT_OPTIONS.map((item) => [item.code, item.labelKey]),
);

export function buildAutoDirectorChannelDraft(
  settings?: AutoDirectorChannelSettings | null,
): AutoDirectorChannelDraft {
  return settings ? {
    baseUrl: settings.baseUrl,
    dingtalk: {
      webhookUrl: settings.dingtalk.webhookUrl,
      callbackToken: settings.dingtalk.callbackToken,
      operatorMapJson: settings.dingtalk.operatorMapJson,
      eventTypes: settings.dingtalk.eventTypes,
    },
    wecom: {
      webhookUrl: settings.wecom.webhookUrl,
      callbackToken: settings.wecom.callbackToken,
      operatorMapJson: settings.wecom.operatorMapJson,
      eventTypes: settings.wecom.eventTypes,
    },
  } : {
    baseUrl: "",
    dingtalk: {
      webhookUrl: "",
      callbackToken: "",
      operatorMapJson: "",
      eventTypes: [],
    },
    wecom: {
      webhookUrl: "",
      callbackToken: "",
      operatorMapJson: "",
      eventTypes: [],
    },
  };
}

export function summarizeSelectedAutoDirectorEvents(codes: string[]): string {
  const labels = codes
    .map((code) => AUTO_DIRECTOR_EVENT_LABEL_KEY_MAP.get(code))
    .filter((labelKey): labelKey is string => Boolean(labelKey))
    .map((labelKey) => i18n.t(labelKey, { ns: "settings" }));
  const separator = i18n.t("channel.events.separator", { ns: "settings" });
  if (labels.length === 0) {
    return i18n.t("channel.events.none", { ns: "settings" });
  }
  if (labels.length <= 2) {
    return labels.join(separator);
  }
  return i18n.t("channel.events.summaryMore", {
    ns: "settings",
    items: labels.slice(0, 2).join(separator),
    count: labels.length,
  });
}
