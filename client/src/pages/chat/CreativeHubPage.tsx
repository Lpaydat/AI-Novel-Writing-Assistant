import { useMemo } from "react";
import { useQuery } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import { useSearchParams } from "react-router-dom";
import { getAgentCatalog } from "@/api/agentCatalog";
import { queryKeys } from "@/api/queryKeys";
import i18n from "@/i18n";
import ChatPage from "./ChatPage";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

function toCategoryLabel(category: string): string {
  if (category === "read") return i18n.t("category.read", { ns: "chat" });
  if (category === "inspect") return i18n.t("category.inspect", { ns: "chat" });
  if (category === "mutate") return i18n.t("category.mutate", { ns: "chat" });
  if (category === "run") return i18n.t("category.run", { ns: "chat" });
  return category;
}

export default function CreativeHubPage() {
  const { t } = useTranslation("chat");
  const [searchParams] = useSearchParams();
  const boundNovelId = searchParams.get("novelId")?.trim() ?? "";
  const boundRunId = searchParams.get("runId")?.trim() ?? "";
  const catalogQuery = useQuery({
    queryKey: queryKeys.agentCatalog,
    queryFn: getAgentCatalog,
    staleTime: 60_000,
  });

  const catalog = catalogQuery.data?.data;
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const tool of catalog?.tools ?? []) {
      counts.set(tool.category, (counts.get(tool.category) ?? 0) + 1);
    }
    return [...counts.entries()];
  }, [catalog?.tools]);

  return (
    <div className="space-y-4">
      <Card className="border-slate-200 bg-gradient-to-r from-slate-50 to-white">
        <CardHeader className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
          <div className="space-y-1">
            <CardTitle>{t("hub.title")}</CardTitle>
            <CardDescription>
              {t("hub.description")}
            </CardDescription>
          </div>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">Agent {catalog?.agents.length ?? 0}</Badge>
            <Badge variant="secondary">Tools {catalog?.tools.length ?? 0}</Badge>
            {boundNovelId ? <Badge variant="outline">{t("hub.novel", { id: boundNovelId })}</Badge> : null}
            {boundRunId ? <Badge variant="outline">{t("hub.run", { id: boundRunId.slice(0, 8) })}</Badge> : null}
          </div>
        </CardHeader>
        <CardContent className="flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
          {categoryCounts.map(([category, count]) => (
            <Badge key={category} variant="outline">
              {toCategoryLabel(category)} {count}
            </Badge>
          ))}
          {catalogQuery.isLoading ? <span>{t("hub.loadingCatalog")}</span> : null}
        </CardContent>
      </Card>

      <ChatPage />
    </div>
  );
}
