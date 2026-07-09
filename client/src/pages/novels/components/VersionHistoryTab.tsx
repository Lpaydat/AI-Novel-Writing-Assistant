import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { TFunction } from "i18next";
import { createNovelSnapshot, listNovelSnapshots, restoreNovelSnapshot } from "@/api/novel";
import { queryKeys } from "@/api/queryKeys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatLocaleDateTime } from "@/i18n/format";

interface VersionHistoryTabProps {
  novelId: string;
}

function formatSnapshotTrigger(triggerType: string, t: TFunction): string {
  if (triggerType === "manual") {
    return t("versionHistory.trigger.manual");
  }
  if (triggerType === "auto_milestone") {
    return t("versionHistory.trigger.autoMilestone");
  }
  if (triggerType === "before_pipeline") {
    return t("versionHistory.trigger.beforePipeline");
  }
  return t("versionHistory.trigger.snapshot");
}

export default function VersionHistoryTab({ novelId }: VersionHistoryTabProps) {
  const { t } = useTranslation("novelsEditD");
  const queryClient = useQueryClient();
  const snapshotsQuery = useQuery({
    queryKey: queryKeys.novels.snapshots(novelId),
    queryFn: () => listNovelSnapshots(novelId),
    enabled: Boolean(novelId),
  });

  const createMutation = useMutation({
    mutationFn: () => createNovelSnapshot(novelId, {
      triggerType: "manual",
      label: `manual-${new Date().toLocaleString()}`,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.novels.snapshots(novelId) });
    },
  });

  const restoreMutation = useMutation({
    mutationFn: (snapshotId: string) => restoreNovelSnapshot(novelId, snapshotId),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.novels.detail(novelId) });
      await queryClient.invalidateQueries({ queryKey: queryKeys.novels.snapshots(novelId) });
    },
  });

  const snapshots = snapshotsQuery.data?.data ?? [];

  return (
    <div className="space-y-4">
      <div className="flex flex-col gap-3 rounded-2xl border border-border/70 bg-muted/15 p-4 md:flex-row md:items-center md:justify-between">
        <div>
          <div className="font-medium">{t("versionHistory.title")}</div>
          <div className="text-sm text-muted-foreground">
            {t("versionHistory.desc")}
          </div>
        </div>
        <Button onClick={() => createMutation.mutate()} disabled={createMutation.isPending}>
          {createMutation.isPending ? t("common.saving") : t("versionHistory.saveCurrent")}
        </Button>
      </div>

      <div className="space-y-3">
        {snapshots.map((snapshot) => {
          const isRestoringCurrent = restoreMutation.isPending && restoreMutation.variables === snapshot.id;

          return (
            <div key={snapshot.id} className="rounded-2xl border border-border/70 bg-background p-4 shadow-sm">
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div className="space-y-3">
                  <div className="space-y-1">
                    <div className="font-medium">{snapshot.label || t("versionHistory.unnamedVersion")}</div>
                    <div className="text-xs text-muted-foreground">
                      {formatSnapshotTrigger(snapshot.triggerType, t)} · {formatLocaleDateTime(snapshot.createdAt)}
                    </div>
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Badge variant={snapshot.triggerType === "manual" ? "secondary" : "outline"}>
                      {formatSnapshotTrigger(snapshot.triggerType, t)}
                    </Badge>
                    <Badge variant="outline">{new Date(snapshot.createdAt).toLocaleDateString()}</Badge>
                  </div>

                  <div className="text-sm leading-6 text-muted-foreground">
                    {t("versionHistory.snapshotDesc")}
                  </div>
                </div>

                <Button
                  variant="secondary"
                  size="sm"
                  onClick={() => {
                    const confirmed = window.confirm(t("versionHistory.restoreConfirm"));
                    if (confirmed) {
                      restoreMutation.mutate(snapshot.id);
                    }
                  }}
                  disabled={restoreMutation.isPending}
                >
                  {isRestoringCurrent ? t("versionHistory.restoring") : t("versionHistory.restore")}
                </Button>
              </div>
            </div>
          );
        })}
        {snapshots.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-6 text-sm text-muted-foreground">
            {t("versionHistory.empty")}
          </div>
        ) : null}
      </div>
    </div>
  );
}
