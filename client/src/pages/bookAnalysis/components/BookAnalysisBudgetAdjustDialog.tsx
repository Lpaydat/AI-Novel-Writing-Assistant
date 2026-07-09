import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import type { BookAnalysisDetail } from "@ai-novel/shared/types/bookAnalysis";
import { Button } from "@/components/ui/button";
import { AppDialogContent, Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";

type BudgetDialogMode = "adjust" | "resume";

const MIN_BUDGET_TOKENS = 1_000;
const MAX_BUDGET_TOKENS = 10_000_000;

function formatTokenCount(value: number | null | undefined): string {
  if (typeof value !== "number" || !Number.isFinite(value)) {
    return "0";
  }
  return new Intl.NumberFormat("zh-CN").format(Math.max(0, Math.round(value)));
}

function normalizeBudgetInput(value: string, allowUnlimited: boolean): number | null {
  const trimmed = value.trim();
  if (!trimmed) {
    return allowUnlimited ? null : Number.NaN;
  }
  const parsed = Number(trimmed);
  if (!Number.isFinite(parsed)) {
    return Number.NaN;
  }
  return Math.floor(parsed);
}

function buildRecommendedResumeBudget(analysis: BookAnalysisDetail): number {
  const usedTokens = analysis.usedTokens ?? 0;
  const succeededCount = analysis.sections.filter((section) => section.status === "succeeded").length;
  const remainingCount = analysis.sections.filter(
    (section) => !section.frozen && section.status !== "succeeded",
  ).length;
  const averageFinishedSectionCost = succeededCount > 0
    ? Math.ceil(usedTokens / succeededCount)
    : 25_000;
  const estimatedNeed = usedTokens + Math.max(1, remainingCount) * averageFinishedSectionCost * 1.2;
  return Math.min(
    MAX_BUDGET_TOKENS,
    Math.max(MIN_BUDGET_TOKENS, Math.ceil(estimatedNeed / 1_000) * 1_000),
  );
}

interface BookAnalysisBudgetAdjustDialogProps {
  open: boolean;
  mode: BudgetDialogMode;
  analysis: BookAnalysisDetail;
  pending: boolean;
  onOpenChange: (open: boolean) => void;
  onSubmit: (budgetTokens: number | null) => Promise<void>;
}

export default function BookAnalysisBudgetAdjustDialog(props: BookAnalysisBudgetAdjustDialogProps) {
  const {
    open,
    mode,
    analysis,
    pending,
    onOpenChange,
    onSubmit,
  } = props;
  const { t } = useTranslation("bookAnalysisComponents");
  const [budgetInput, setBudgetInput] = useState("");
  const usedTokens = analysis.usedTokens ?? 0;
  const currentBudget = analysis.budgetTokens ?? null;
  const allowUnlimited = mode === "adjust";
  const parsedBudget = normalizeBudgetInput(budgetInput, allowUnlimited);
  const recommendedResumeBudget = useMemo(() => buildRecommendedResumeBudget(analysis), [analysis]);
  const retrySectionCount = analysis.sections.filter(
    (section) => !section.frozen && section.status !== "succeeded",
  ).length;
  const succeededSectionCount = analysis.sections.filter((section) => section.status === "succeeded").length;
  const frozenSectionCount = analysis.sections.filter((section) => section.frozen).length;
  const remainingTokens = typeof parsedBudget === "number" && Number.isFinite(parsedBudget)
    ? parsedBudget - usedTokens
    : null;
  const budgetIsFinite = typeof parsedBudget === "number" && Number.isFinite(parsedBudget);
  const hasValidBudget = parsedBudget === null || (
    budgetIsFinite &&
    parsedBudget >= MIN_BUDGET_TOKENS &&
    parsedBudget <= MAX_BUDGET_TOKENS
  );
  const canSubmit = hasValidBudget && (mode === "adjust" || budgetIsFinite) && !pending;

  useEffect(() => {
    if (!open) {
      return;
    }
    if (mode === "resume") {
      setBudgetInput(String(recommendedResumeBudget));
      return;
    }
    setBudgetInput(currentBudget ? String(currentBudget) : "");
  }, [currentBudget, mode, open, recommendedResumeBudget]);

  const handleSubmit = async () => {
    if (!canSubmit) {
      return;
    }
    await onSubmit(parsedBudget);
    onOpenChange(false);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <AppDialogContent
        title={mode === "resume" ? t("budgetAdjust.titleResume") : t("budgetAdjust.titleAdjust")}
        description={mode === "resume"
          ? t("budgetAdjust.descriptionResume")
          : t("budgetAdjust.descriptionAdjust")}
        className="max-w-xl"
        footer={
          <div className="flex w-full justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={pending}>
              {t("budgetAdjust.cancel")}
            </Button>
            <Button type="button" onClick={handleSubmit} disabled={!canSubmit}>
              {pending ? t("budgetAdjust.submitting") : mode === "resume" ? t("budgetAdjust.submitResume") : t("budgetAdjust.submitAdjust")}
            </Button>
          </div>
        }
      >
        <div className="space-y-4">
          {mode === "resume" ? (
            <div className="rounded-md border border-amber-300 bg-amber-50 p-3 text-sm leading-6 text-amber-900">
              {frozenSectionCount > 0
                ? t("budgetAdjust.resumeSummaryWithFrozen", {
                    retry: retrySectionCount,
                    succeeded: succeededSectionCount,
                    frozen: frozenSectionCount,
                  })
                : t("budgetAdjust.resumeSummary", {
                    retry: retrySectionCount,
                    succeeded: succeededSectionCount,
                  })}
            </div>
          ) : null}

          <div className="grid gap-2 rounded-md border bg-muted/20 p-3 text-sm sm:grid-cols-3">
            <div>
              <div className="text-xs text-muted-foreground">{t("budgetAdjust.usedTokensLabel")}</div>
              <div className="mt-1 font-mono tabular-nums">{formatTokenCount(usedTokens)}</div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("budgetAdjust.budgetLimitLabel")}</div>
              <div className="mt-1 font-mono tabular-nums">
                {currentBudget ? formatTokenCount(currentBudget) : t("budgetAdjust.unlimited")}
              </div>
            </div>
            <div>
              <div className="text-xs text-muted-foreground">{t("budgetAdjust.remainingAfterLabel")}</div>
              <div className="mt-1 font-mono tabular-nums">
                {parsedBudget === null
                  ? t("budgetAdjust.unlimited")
                  : remainingTokens === null
                    ? "-"
                    : formatTokenCount(remainingTokens)}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <div className="flex items-center justify-between gap-3">
              <label htmlFor="book-analysis-budget-input" className="text-sm font-medium">
                {t("budgetAdjust.newBudgetLabel")}
              </label>
              {mode === "resume" ? (
                <button
                  type="button"
                  className="text-xs text-primary underline-offset-4 hover:underline"
                  onClick={() => setBudgetInput(String(recommendedResumeBudget))}
                >
                  {t("budgetAdjust.useSuggested", { value: formatTokenCount(recommendedResumeBudget) })}
                </button>
              ) : null}
            </div>
            <div className="flex items-center gap-2">
              <Input
                id="book-analysis-budget-input"
                type="number"
                min={MIN_BUDGET_TOKENS}
                max={MAX_BUDGET_TOKENS}
                step={1_000}
                value={budgetInput}
                onChange={(event) => setBudgetInput(event.target.value)}
                placeholder={allowUnlimited ? t("budgetAdjust.placeholderUnlimited") : String(recommendedResumeBudget)}
                className="text-right font-mono tabular-nums"
              />
              <span className="shrink-0 text-xs text-muted-foreground">tokens</span>
            </div>
            {!hasValidBudget ? (
              <div className="text-xs text-destructive">
                {t("budgetAdjust.rangeError", {
                  min: formatTokenCount(MIN_BUDGET_TOKENS),
                  max: formatTokenCount(MAX_BUDGET_TOKENS),
                })}
              </div>
            ) : null}
            {mode === "adjust" && analysis.status === "running" ? (
              <div className="text-xs leading-5 text-muted-foreground">
                {t("budgetAdjust.lowerBudgetHint")}
              </div>
            ) : null}
            {budgetIsFinite && remainingTokens !== null && remainingTokens < 0 ? (
              <div className="text-xs leading-5 text-amber-700">
                {t("budgetAdjust.belowUsedHint")}
              </div>
            ) : null}
          </div>
        </div>
      </AppDialogContent>
    </Dialog>
  );
}
