import { useTranslation } from "react-i18next";
import { Input } from "@/components/ui/input";

interface ProviderRequestLimitFieldsProps {
  concurrencyLimit: string;
  requestIntervalMs: string;
  onChange: (value: {
    concurrencyLimit?: string;
    requestIntervalMs?: string;
  }) => void;
}

export default function ProviderRequestLimitFields({
  concurrencyLimit,
  requestIntervalMs,
  onChange,
}: ProviderRequestLimitFieldsProps) {
  const { t } = useTranslation("settingsComponents");
  return (
    <div className="grid gap-3 rounded-md border bg-muted/20 p-3 sm:grid-cols-2">
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">{t("requestLimit.concurrencyLabel")}</div>
        <Input
          type="number"
          min={0}
          step={1}
          value={concurrencyLimit}
          placeholder="0"
          onChange={(event) => onChange({ concurrencyLimit: event.target.value })}
        />
        <div className="break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
          {t("requestLimit.concurrencyHint")}
        </div>
      </div>
      <div className="space-y-1">
        <div className="text-xs text-muted-foreground">{t("requestLimit.intervalLabel")}</div>
        <Input
          type="number"
          min={0}
          step={100}
          value={requestIntervalMs}
          placeholder="0"
          onChange={(event) => onChange({ requestIntervalMs: event.target.value })}
        />
        <div className="break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
          {t("requestLimit.intervalHint")}
        </div>
      </div>
    </div>
  );
}

export function ProviderRequestLimitSummary({
  concurrencyLimit,
  requestIntervalMs,
}: {
  concurrencyLimit: number;
  requestIntervalMs: number;
}) {
  const { t } = useTranslation("settingsComponents");
  return (
    <div className="mb-2 break-words text-xs text-muted-foreground [overflow-wrap:anywhere]">
      {t("requestLimit.summary", {
        concurrency: concurrencyLimit || t("requestLimit.unlimited"),
        interval: requestIntervalMs ? `${requestIntervalMs}ms` : t("requestLimit.unlimited"),
      })}
    </div>
  );
}
