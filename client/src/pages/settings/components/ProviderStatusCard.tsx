import { useState } from "react";
import { useTranslation } from "react-i18next";
import { ChevronDown } from "lucide-react";
import type { LLMProvider } from "@ai-novel/shared/types/llm";
import type { APIKeyStatus, ProviderBalanceStatus } from "@/api/settings";
import i18n from "@/i18n";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { cn } from "@/lib/utils";
import { AUTO_DIRECTOR_MOBILE_CLASSES } from "@/mobile/autoDirector";
import { ProviderRequestLimitSummary } from "./ProviderRequestLimitFields";
import { formatBalanceAmount, formatBalanceTime } from "../settingsFormatters";

export interface ProviderCardViewModel {
  provider: APIKeyStatus;
  balance?: ProviderBalanceStatus;
  isBalanceLoading: boolean;
  isBalanceRefreshing: boolean;
  canRefreshBalance: boolean;
  isReasoningUpdating: boolean;
  isTesting: boolean;
  testResult?: string;
}

function getBalanceSummary(input: {
  provider: APIKeyStatus;
  balance?: ProviderBalanceStatus;
  isBalanceLoading: boolean;
}) {
  const { provider, balance, isBalanceLoading } = input;
  if (provider.kind === "custom") {
    return i18n.t("statusCard.balanceCustomNotSupported", { ns: "settingsComponents" });
  }
  if (isBalanceLoading) {
    return i18n.t("statusCard.balanceLoading", { ns: "settingsComponents" });
  }
  if (balance?.status === "available") {
    return i18n.t("statusCard.balanceAvailable", {
      ns: "settingsComponents",
      amount: formatBalanceAmount(balance.availableBalance, balance.currency),
    });
  }
  return balance?.error ?? balance?.message ?? (provider.isConfigured
    ? i18n.t("statusCard.balanceNoInfo", { ns: "settingsComponents" })
    : i18n.t("statusCard.balanceNeedConfig", { ns: "settingsComponents" }));
}

export default function ProviderStatusCard(props: {
  item: ProviderCardViewModel;
  onOpenConfig: (provider: LLMProvider) => void;
  onTest: (provider: APIKeyStatus) => void;
  onRefreshModels: (provider: LLMProvider) => void;
  onRefreshBalance: (provider: LLMProvider) => void;
  onToggleReasoning: (provider: LLMProvider, reasoningEnabled: boolean) => void;
  isRefreshingModels: boolean;
}) {
  const {
    item,
    onOpenConfig,
    onTest,
    onRefreshModels,
    onRefreshBalance,
    onToggleReasoning,
    isRefreshingModels,
  } = props;
  const { t } = useTranslation("settingsComponents");
  const { provider, balance } = item;
  const [advancedOpen, setAdvancedOpen] = useState(false);
  const [modelsOpen, setModelsOpen] = useState(false);
  const imageModelLabel = provider.supportsImageGeneration
    ? provider.currentImageModel || provider.defaultImageModel || t("statusCard.imageModelNotSet")
    : t("statusCard.imageModelUnsupported");
  const visibleModels = modelsOpen ? provider.models : provider.models.slice(0, 8);
  const canUseProvider = provider.isConfigured && provider.isActive && Boolean(provider.currentModel);
  const testDisabledReason = provider.isConfigured ? "" : t("statusCard.testDisabledReason");
  const refreshDisabledReason = provider.isConfigured ? "" : t("statusCard.refreshDisabledReason");

  return (
    <div
      className={cn(
        "min-w-0 rounded-md border p-3 transition-colors",
        canUseProvider ? "border-emerald-500/40 bg-emerald-50/50 dark:bg-emerald-950/20" : "border-border",
      )}
    >
      <div className="mb-3 flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
        <div className="min-w-0 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-2">
            <div className={`font-medium ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{provider.name}</div>
            {provider.kind === "custom" ? <Badge variant="outline">{t("statusCard.customBadge")}</Badge> : null}
          </div>
          <div className={`text-xs text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
            {canUseProvider ? t("statusCard.usableForTasks") : t("statusCard.usableAfterConfig")}
          </div>
        </div>
        <Badge
          variant={canUseProvider ? "default" : "outline"}
          className={canUseProvider ? "bg-emerald-600 text-white hover:bg-emerald-600" : ""}
        >
          {canUseProvider ? t("statusCard.statusUsable") : provider.isConfigured ? t("statusCard.statusConfigured") : t("statusCard.statusNotConfigured")}
        </Badge>
      </div>

      <div className="mb-3 grid min-w-0 gap-2 text-sm md:grid-cols-2">
        <div className="min-w-0 rounded-md border bg-background/70 p-2">
          <div className="text-xs text-muted-foreground">{t("statusCard.textModelLabel")}</div>
          <div className={`mt-1 font-medium ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
            {provider.currentModel || "-"}
          </div>
        </div>
        <div className="min-w-0 rounded-md border bg-background/70 p-2">
          <div className="text-xs text-muted-foreground">{t("statusCard.imageModelLabel")}</div>
          <div className={`mt-1 font-medium ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
            {imageModelLabel}
          </div>
        </div>
      </div>

      <div className={`mb-3 rounded-md border border-dashed bg-background/70 p-3 text-sm text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
        {getBalanceSummary({
          provider,
          balance,
          isBalanceLoading: item.isBalanceLoading,
        })}
      </div>

      {item.testResult ? (
        <div className={`mb-3 rounded-md border bg-background/70 p-3 text-sm text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
          {item.testResult}
        </div>
      ) : null}

      <div className="grid grid-cols-2 gap-2 sm:flex sm:flex-wrap">
        <Button size="sm" className="w-full sm:w-auto" onClick={() => onOpenConfig(provider.provider)}>
          {provider.kind === "custom" ? t("statusCard.edit") : t("statusCard.config")}
        </Button>
        <Button
          size="sm"
          variant="secondary"
          className="w-full sm:w-auto"
          title={testDisabledReason}
          onClick={() => onTest(provider)}
          disabled={!provider.isConfigured || item.isTesting}
        >
          {item.isTesting ? t("statusCard.testing") : t("statusCard.testConnection")}
        </Button>
        <Button
          size="sm"
          variant="outline"
          className="w-full sm:w-auto"
          title={refreshDisabledReason}
          onClick={() => onRefreshModels(provider.provider)}
          disabled={!provider.isConfigured || isRefreshingModels}
        >
          {isRefreshingModels ? t("statusCard.refreshing") : t("statusCard.refreshModels")}
        </Button>
        {provider.kind === "builtin" ? (
          <Button
            size="sm"
            variant="outline"
            className="w-full sm:w-auto"
            title={item.canRefreshBalance ? "" : t("statusCard.refreshBalanceDisabledReason")}
            onClick={() => onRefreshBalance(provider.provider)}
            disabled={!item.canRefreshBalance || item.isBalanceRefreshing}
          >
            {item.isBalanceRefreshing ? t("statusCard.balanceRefreshing") : t("statusCard.refreshBalance")}
          </Button>
        ) : null}
      </div>

      <div className="mt-3 border-t pt-3">
        <button
          type="button"
          className="flex w-full items-center justify-between gap-2 text-left text-sm font-medium text-primary"
          aria-expanded={advancedOpen}
          onClick={() => setAdvancedOpen((prev) => !prev)}
        >
          <span>{t("statusCard.advancedDetails")}</span>
          <ChevronDown className={cn("h-4 w-4 transition-transform duration-200", advancedOpen ? "rotate-180" : "")} />
        </button>
      </div>

      {advancedOpen ? (
        <div className="mt-3 space-y-3">
          <div className={`text-xs text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
            {t("statusCard.baseUrlDisplay", { url: provider.currentBaseURL || "-" })}
          </div>
          <ProviderRequestLimitSummary
            concurrencyLimit={provider.concurrencyLimit}
            requestIntervalMs={provider.requestIntervalMs}
          />
          <div className="flex flex-col gap-3 rounded-md border bg-background/60 px-3 py-2 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0 space-y-1">
              <div className="text-xs font-medium text-muted-foreground">{t("statusCard.reasoningLabel")}</div>
              <div className={`text-xs text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                {provider.reasoningEnabled
                  ? t("statusCard.reasoningOn")
                  : t("statusCard.reasoningOff")}
              </div>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <span className="text-xs text-muted-foreground">{provider.reasoningEnabled ? t("statusCard.reasoningEnabledLabel") : t("statusCard.reasoningDisabledLabel")}</span>
              <Switch
                checked={provider.reasoningEnabled}
                disabled={item.isReasoningUpdating}
                onCheckedChange={(checked) => onToggleReasoning(provider.provider, checked)}
              />
            </div>
          </div>

          <div className="rounded-md border border-dashed bg-background/60 p-3">
            <div className="mb-2 flex flex-wrap items-center justify-between gap-2">
              <div className="text-xs font-medium text-muted-foreground">{t("statusCard.balanceDetails")}</div>
              {balance?.status === "available" ? (
                <Badge variant="outline">{t("statusCard.lastRefreshed", { time: formatBalanceTime(balance.fetchedAt) })}</Badge>
              ) : null}
            </div>
            {provider.kind === "custom" ? (
              <div className={`text-sm text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                {t("statusCard.customBalanceNotSupported")}
              </div>
            ) : balance?.status === "available" ? (
              <div className="grid gap-2 text-xs text-muted-foreground sm:grid-cols-2">
                {balance.cashBalance !== null ? <div>{t("statusCard.cashBalance", { amount: formatBalanceAmount(balance.cashBalance, balance.currency) })}</div> : null}
                {balance.voucherBalance !== null ? <div>{t("statusCard.voucherBalance", { amount: formatBalanceAmount(balance.voucherBalance, balance.currency) })}</div> : null}
                {balance.chargeBalance !== null ? <div>{t("statusCard.chargeBalance", { amount: formatBalanceAmount(balance.chargeBalance, balance.currency) })}</div> : null}
                {balance.toppedUpBalance !== null ? <div>{t("statusCard.toppedUpBalance", { amount: formatBalanceAmount(balance.toppedUpBalance, balance.currency) })}</div> : null}
                {balance.grantedBalance !== null ? <div>{t("statusCard.grantedBalance", { amount: formatBalanceAmount(balance.grantedBalance, balance.currency) })}</div> : null}
              </div>
            ) : (
              <div className={`text-sm text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
                {balance?.error ?? balance?.message ?? (provider.isConfigured ? t("statusCard.balanceNoInfo") : t("statusCard.balanceNeedConfig"))}
              </div>
            )}
          </div>

          <div className="space-y-2">
            <div className="flex min-w-0 flex-wrap gap-1">
              {visibleModels.map((model) => (
                <Badge
                  key={model}
                  variant={model === provider.currentModel ? "default" : "outline"}
                  className={model === provider.currentModel
                    ? "max-w-full whitespace-normal break-words bg-primary text-left [overflow-wrap:anywhere]"
                    : "max-w-full whitespace-normal break-words text-left [overflow-wrap:anywhere]"}
                >
                  {model}
                </Badge>
              ))}
            </div>
            {provider.models.length > 8 ? (
              <button
                type="button"
                className="text-xs font-medium text-primary transition-opacity hover:opacity-80"
                onClick={() => setModelsOpen((prev) => !prev)}
              >
                {modelsOpen ? t("statusCard.collapseModels") : t("statusCard.expandAllModels", { count: provider.models.length })}
              </button>
            ) : null}
          </div>
        </div>
      ) : null}
    </div>
  );
}
