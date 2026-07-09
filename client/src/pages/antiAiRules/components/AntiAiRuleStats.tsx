import { useTranslation } from "react-i18next";

interface StatTileProps {
  label: string;
  value: number;
  hint: string;
}

function StatTile(props: StatTileProps) {
  return (
    <div className="rounded-lg border bg-muted/20 p-4">
      <div className="text-xs font-medium text-muted-foreground">{props.label}</div>
      <div className="mt-2 text-2xl font-semibold text-foreground">{props.value}</div>
      <div className="mt-1 text-xs leading-5 text-muted-foreground">{props.hint}</div>
    </div>
  );
}

interface AntiAiRuleStatsProps {
  total: number;
  enabled: number;
  global: number;
  autoRewrite: number;
}

export default function AntiAiRuleStats(props: AntiAiRuleStatsProps) {
  const { t } = useTranslation("antiAiRules");
  return (
    <div className="grid gap-3 md:grid-cols-4">
      <StatTile label={t("stats.totalLabel")} value={props.total} hint={t("stats.totalHint")} />
      <StatTile label={t("stats.enabledLabel")} value={props.enabled} hint={t("stats.enabledHint")} />
      <StatTile label={t("stats.globalLabel")} value={props.global} hint={t("stats.globalHint")} />
      <StatTile label={t("stats.autoRewriteLabel")} value={props.autoRewrite} hint={t("stats.autoRewriteHint")} />
    </div>
  );
}
