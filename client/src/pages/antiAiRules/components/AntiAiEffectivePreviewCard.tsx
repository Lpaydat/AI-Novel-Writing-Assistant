import type { AntiAiEffectiveRulesResult, StyleProfile } from "@ai-novel/shared/types/styleEngine";
import { useTranslation } from "react-i18next";
import { SlidersHorizontal } from "lucide-react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import EffectiveRuleList from "./EffectiveRuleList";

interface AntiAiEffectivePreviewCardProps {
  profiles: StyleProfile[];
  styleProfileId: string;
  effective?: AntiAiEffectiveRulesResult;
  loading: boolean;
  onStyleProfileChange: (styleProfileId: string) => void;
}

export default function AntiAiEffectivePreviewCard(props: AntiAiEffectivePreviewCardProps) {
  const { t } = useTranslation("antiAiRules");
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-xl">
          <SlidersHorizontal className="h-5 w-5" />
          {t("preview.title")}
        </CardTitle>
        <CardDescription>
          {t("preview.description")}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <Select
          value={props.styleProfileId || "__global__"}
          onValueChange={(value) => props.onStyleProfileChange(value === "__global__" ? "" : value)}
        >
          <SelectTrigger>
            <SelectValue placeholder={t("preview.selectPlaceholder")} />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="__global__">{t("preview.onlyGlobal")}</SelectItem>
            {props.profiles.map((profile) => (
              <SelectItem key={profile.id} value={profile.id}>{profile.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        {props.loading ? (
          <div className="text-sm text-muted-foreground">{t("preview.calculating")}</div>
        ) : null}

        {props.effective ? (
          <div className="space-y-4">
            <div className="grid gap-2 text-sm sm:grid-cols-2">
              <div className="rounded-md border bg-muted/20 p-3">
                <div className="text-xs text-muted-foreground">{t("preview.globalBaseline")}</div>
                <div className="mt-1 font-semibold">{props.effective.usesGlobalAntiAiBaseline ? t("preview.applied") : t("preview.notApplied")}</div>
              </div>
              <div className="rounded-md border bg-muted/20 p-3">
                <div className="text-xs text-muted-foreground">{t("preview.effectiveRules")}</div>
                <div className="mt-1 font-semibold">{props.effective.effectiveRules.length}</div>
              </div>
            </div>
            <EffectiveRuleList
              title={t("preview.globalRulesTitle")}
              rules={props.effective.globalBaselineRules}
              empty={t("preview.globalRulesEmpty")}
            />
            <EffectiveRuleList
              title={t("preview.styleRulesTitle")}
              rules={props.effective.styleSpecificRules}
              empty={t("preview.styleRulesEmpty")}
            />
          </div>
        ) : null}
      </CardContent>
    </Card>
  );
}
