import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { getRagSettings } from "@/api/settings";
import { queryKeys } from "@/api/queryKeys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AUTO_DIRECTOR_MOBILE_CLASSES } from "@/mobile/autoDirector";

export default function SettingsNavigationCards(props: {
  mode?: "all" | "routes" | "knowledge";
}) {
  const { mode = "all" } = props;
  const { t } = useTranslation("settingsComponents");
  const ragSettingsQuery = useQuery({
    queryKey: queryKeys.settings.rag,
    queryFn: getRagSettings,
  });
  const ragSettings = ragSettingsQuery.data?.data;
  const ragProvider = useMemo(
    () => ragSettings?.providers.find((item) => item.provider === ragSettings.embeddingProvider),
    [ragSettings],
  );

  return (
    <>
      {mode === "all" || mode === "knowledge" ? (
        <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>{t("nav.knowledge.title")}</CardTitle>
          <CardDescription className={AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}>
            {t("nav.knowledge.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid min-w-0 gap-3 md:grid-cols-2">
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">{t("nav.knowledge.vectorProvider")}</div>
              <div className={`mt-1 font-medium ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{ragProvider?.name ?? ragSettings?.embeddingProvider ?? "-"}</div>
            </div>
            <div className="rounded-md border p-3">
              <div className="text-xs text-muted-foreground">{t("nav.knowledge.vectorModel")}</div>
              <div className={`mt-1 font-medium ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>{ragSettings?.embeddingModel ?? "-"}</div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 text-sm text-muted-foreground">
            <span>{t("nav.knowledge.connectionStatus")}</span>
            <Badge variant={ragProvider?.isConfigured ? "default" : "outline"}>
              {ragProvider?.isConfigured ? t("nav.knowledge.apiKeyAvailable") : t("nav.knowledge.apiKeyMissing")}
            </Badge>
            <Badge variant={ragProvider?.isActive ? "default" : "outline"}>
              {ragProvider?.isActive ? t("nav.knowledge.active") : t("nav.knowledge.inactive")}
            </Badge>
          </div>
          <Button asChild className={AUTO_DIRECTOR_MOBILE_CLASSES.fullWidthAction}>
            <Link to="/knowledge?tab=settings">{t("nav.knowledge.openSettings")}</Link>
          </Button>
        </CardContent>
        </Card>
      ) : null}

      {mode === "all" || mode === "routes" ? (
        <Card className="min-w-0 overflow-hidden">
        <CardHeader>
          <CardTitle>{t("nav.routes.title")}</CardTitle>
          <CardDescription className={AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}>
            {t("nav.routes.description")}
          </CardDescription>
        </CardHeader>
        <CardContent className={AUTO_DIRECTOR_MOBILE_CLASSES.settingsEntryActionRow}>
          <div className={`min-w-0 text-sm text-muted-foreground ${AUTO_DIRECTOR_MOBILE_CLASSES.wrapText}`}>
            {t("nav.routes.hint")}
          </div>
          <Button asChild className={AUTO_DIRECTOR_MOBILE_CLASSES.fullWidthAction}>
            <Link to="/settings/model-routes">{t("nav.routes.openManagement")}</Link>
          </Button>
        </CardContent>
        </Card>
      ) : null}
    </>
  );
}
