import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { cn } from "@/lib/utils";
import i18n from "@/i18n";
import type {
  PayoffLedgerItem,
  PayoffLedgerResponse,
  StoryStateSnapshot,
} from "@ai-novel/shared/types/novel";
import CollapsibleSummary from "./CollapsibleSummary";

interface BookPayoffLedgerCardProps {
  latestStateSnapshot?: StoryStateSnapshot | null;
  payoffLedger?: PayoffLedgerResponse | null;
}

function payoffStatusLabel(status: string): string {
  switch (status) {
    case "setup":
      return i18n.t("payoff.status.setup", { ns: "novelsEditA" });
    case "hinted":
      return i18n.t("payoff.status.hinted", { ns: "novelsEditA" });
    case "pending_payoff":
      return i18n.t("payoff.status.pendingPayoff", { ns: "novelsEditA" });
    case "paid_off":
      return i18n.t("payoff.status.paidOff", { ns: "novelsEditA" });
    case "failed":
      return i18n.t("payoff.status.failed", { ns: "novelsEditA" });
    case "overdue":
      return i18n.t("payoff.status.overdue", { ns: "novelsEditA" });
    default:
      return status || i18n.t("payoff.status.unknown", { ns: "novelsEditA" });
  }
}

function payoffStatusVariant(status: string): "default" | "secondary" | "outline" {
  switch (status) {
    case "paid_off":
      return "default";
    case "failed":
      return "secondary";
    default:
      return "outline";
  }
}

function payoffStatusTone(status: string): string {
  if (status === "overdue") {
    return "border-amber-300 bg-amber-50 text-amber-900";
  }
  if (status === "paid_off") {
    return "border-emerald-300 bg-emerald-50 text-emerald-900";
  }
  if (status === "failed") {
    return "border-slate-300 bg-slate-100 text-slate-700";
  }
  return "";
}

function formatWindow(item: PayoffLedgerItem): string {
  if (
    typeof item.targetStartChapterOrder === "number"
    && typeof item.targetEndChapterOrder === "number"
  ) {
    return i18n.t("payoff.window.range", {
      ns: "novelsEditA",
      start: item.targetStartChapterOrder,
      end: item.targetEndChapterOrder,
    });
  }
  if (typeof item.targetEndChapterOrder === "number") {
    return i18n.t("payoff.window.latest", { ns: "novelsEditA", end: item.targetEndChapterOrder });
  }
  if (typeof item.targetStartChapterOrder === "number") {
    return i18n.t("payoff.window.from", { ns: "novelsEditA", start: item.targetStartChapterOrder });
  }
  return i18n.t("payoff.window.unbounded", { ns: "novelsEditA" });
}

function scopeLabel(scopeType: PayoffLedgerItem["scopeType"]): string {
  if (scopeType === "book") {
    return i18n.t("payoff.scope.book", { ns: "novelsEditA" });
  }
  if (scopeType === "volume") {
    return i18n.t("payoff.scope.volume", { ns: "novelsEditA" });
  }
  return i18n.t("payoff.scope.chapter", { ns: "novelsEditA" });
}

function sourceSummary(item: PayoffLedgerItem): string {
  const labels = item.sourceRefs
    .map((source) => source.refLabel?.trim())
    .filter(Boolean)
    .slice(0, 3);
  return labels.length > 0 ? labels.join(" / ") : i18n.t("payoff.noSourceSummary", { ns: "novelsEditA" });
}

export default function BookPayoffLedgerCard(props: BookPayoffLedgerCardProps) {
  const { t } = useTranslation("novelsEditA");
  const { latestStateSnapshot, payoffLedger } = props;
  const ledgerItems = payoffLedger?.items ?? [];
  const ledgerSummary = payoffLedger?.summary;
  const snapshotForeshadows = latestStateSnapshot?.foreshadowStates ?? [];
  const pendingForeshadows = snapshotForeshadows.filter(
    (item) => item.status !== "paid_off" && item.status !== "failed",
  );
  const paidOffForeshadows = snapshotForeshadows.filter((item) => item.status === "paid_off");
  const failedForeshadows = snapshotForeshadows.filter((item) => item.status === "failed");
  const hasCanonicalLedgerContent = ledgerItems.length > 0;
  const hasSnapshotContent = snapshotForeshadows.length > 0 || Boolean(latestStateSnapshot?.summary?.trim());

  return (
    <Card>
      <CardContent className="p-0">
        <details className="group">
          <summary className="cursor-pointer list-none p-5">
            <CollapsibleSummary
              title={t("payoff.card.title")}
              description={t("payoff.card.description")}
              collapsedLabel={t("payoff.card.collapsedLabel")}
              expandedLabel={t("payoff.card.expandedLabel")}
              meta={(
                <>
                  <Badge variant="outline">{t("payoff.meta.pending", { count: ledgerSummary?.pendingCount ?? 0 })}</Badge>
                  <Badge variant={ledgerSummary?.urgentCount ? "secondary" : "outline"}>
                    {t("payoff.meta.urgent", { count: ledgerSummary?.urgentCount ?? 0 })}
                  </Badge>
                  <Badge variant={ledgerSummary?.overdueCount ? "secondary" : "outline"}>
                    {t("payoff.meta.overdue", { count: ledgerSummary?.overdueCount ?? 0 })}
                  </Badge>
                  <Badge variant="outline">{t("payoff.meta.paidOff", { count: ledgerSummary?.paidOffCount ?? 0 })}</Badge>
                </>
              )}
            />
          </summary>

          <div className="space-y-3 border-t border-border/70 px-5 pb-5 pt-4">
            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-foreground">{t("payoff.canonicalTitle")}</div>
                <Badge variant="outline">{ledgerItems.length}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("payoff.canonicalHint")}
              </div>
              <div className="mt-3 space-y-2 text-sm">
                {hasCanonicalLedgerContent ? (
                  ledgerItems.map((item) => (
                    <div
                      key={item.id}
                      className="rounded-lg border border-border/70 bg-background p-3"
                    >
                      <div className="flex flex-wrap items-center gap-2">
                        <div className="font-medium text-foreground">{item.title}</div>
                        <Badge
                          variant={payoffStatusVariant(item.currentStatus)}
                          className={cn(payoffStatusTone(item.currentStatus))}
                        >
                          {payoffStatusLabel(item.currentStatus)}
                        </Badge>
                        <Badge variant="outline">{scopeLabel(item.scopeType)}</Badge>
                        <Badge variant="outline">{formatWindow(item)}</Badge>
                      </div>
                      <div className="mt-2 text-xs text-muted-foreground">{item.summary}</div>
                      <div className="mt-2 grid gap-2 text-xs text-muted-foreground sm:grid-cols-3">
                        <div>
                          {t("payoff.item.lastTouched")}
                          {typeof item.lastTouchedChapterOrder === "number"
                            ? t("payoff.item.chapterOrder", { order: item.lastTouchedChapterOrder })
                            : t("common.none")}
                        </div>
                        <div>{t("payoff.item.sourceSummary", { summary: sourceSummary(item) })}</div>
                        <div>
                          {t("payoff.item.riskLabel")}
                          {item.riskSignals.length > 0
                            ? t("payoff.item.riskValue", {
                              signals: item.riskSignals
                                .slice(0, 2)
                                .map((signal) => signal.summary)
                                .join(t("common.sepSemicolon")),
                            })
                            : t("payoff.item.riskNone")}
                        </div>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="rounded-lg border border-dashed border-border/70 bg-background p-3 text-xs text-muted-foreground">
                    {t("payoff.emptyLedger")}
                  </div>
                )}
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-muted/20 p-4">
              <div className="flex items-center justify-between gap-2">
                <div className="font-medium text-foreground">{t("payoff.snapshotTitle")}</div>
                <Badge variant="outline">{snapshotForeshadows.length}</Badge>
              </div>
              <div className="mt-1 text-xs text-muted-foreground">
                {t("payoff.snapshotHint")}
              </div>
              {latestStateSnapshot?.summary ? (
                <div className="mt-3 rounded-lg border border-border/70 bg-background p-3 text-xs text-muted-foreground">
                  {latestStateSnapshot.summary}
                </div>
              ) : null}
              <div className="mt-3 space-y-3 text-sm">
                {hasSnapshotContent ? (
                  <>
                    <div className="space-y-2">
                      <div className="text-xs font-medium text-muted-foreground">{t("payoff.pendingSection")}</div>
                      {pendingForeshadows.length > 0 ? (
                        pendingForeshadows.slice(0, 5).map((item) => (
                          <div
                            key={item.id}
                            className="rounded-lg border border-border/70 bg-background p-3"
                          >
                            <div className="flex flex-wrap items-center gap-2">
                              <div className="font-medium text-foreground">{item.title}</div>
                              <Badge variant={payoffStatusVariant(item.status)}>
                                {payoffStatusLabel(item.status)}
                              </Badge>
                            </div>
                            {item.summary ? (
                              <div className="mt-1 text-xs text-muted-foreground">{item.summary}</div>
                            ) : null}
                          </div>
                        ))
                      ) : (
                        <div className="rounded-lg border border-dashed border-border/70 bg-background p-3 text-xs text-muted-foreground">
                          {t("payoff.pendingEmpty")}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-2 sm:grid-cols-2">
                      <div className="rounded-lg border border-border/70 bg-background p-3">
                        <div className="text-xs text-muted-foreground">{t("payoff.status.paidOff")}</div>
                        <div className="mt-1 text-lg font-semibold text-foreground">
                          {paidOffForeshadows.length}
                        </div>
                      </div>
                      <div className="rounded-lg border border-border/70 bg-background p-3">
                        <div className="text-xs text-muted-foreground">{t("payoff.status.failed")}</div>
                        <div className="mt-1 text-lg font-semibold text-foreground">
                          {failedForeshadows.length}
                        </div>
                      </div>
                    </div>
                  </>
                ) : (
                  <div className="rounded-lg border border-dashed border-border/70 bg-background p-3 text-xs text-muted-foreground">
                    {t("payoff.emptySnapshot")}
                  </div>
                )}
              </div>
            </div>
          </div>
        </details>
      </CardContent>
    </Card>
  );
}
