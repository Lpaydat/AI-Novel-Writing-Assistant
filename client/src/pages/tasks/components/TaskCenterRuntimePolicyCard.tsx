import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import type {
  DirectorPolicyMode,
  DirectorRuntimeSnapshot,
} from "@ai-novel/shared/types/directorRuntime";
import { updateDirectorRuntimePolicy } from "@/api/novelDirector";
import { queryKeys } from "@/api/queryKeys";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { toast } from "@/components/ui/toast";
import SelectControl from "@/components/common/SelectControl";

interface TaskCenterRuntimePolicyCardProps {
  taskId: string;
  snapshot: DirectorRuntimeSnapshot | null | undefined;
}

const POLICY_OPTIONS: Array<{ value: DirectorPolicyMode; labelKey: string; descriptionKey: string }> = [
  {
    value: "suggest_only",
    labelKey: "policy.suggestOnly.label",
    descriptionKey: "policy.suggestOnly.description",
  },
  {
    value: "run_next_step",
    labelKey: "policy.runNextStep.label",
    descriptionKey: "policy.runNextStep.description",
  },
  {
    value: "run_until_gate",
    labelKey: "policy.runUntilGate.label",
    descriptionKey: "policy.runUntilGate.description",
  },
  {
    value: "auto_safe_scope",
    labelKey: "policy.autoSafeScope.label",
    descriptionKey: "policy.autoSafeScope.description",
  },
];

function formatPolicyModeKey(mode: DirectorPolicyMode): string {
  return POLICY_OPTIONS.find((item) => item.value === mode)?.labelKey ?? mode;
}

export default function TaskCenterRuntimePolicyCard({
  taskId,
  snapshot,
}: TaskCenterRuntimePolicyCardProps) {
  const { t } = useTranslation("tasks");
  const queryClient = useQueryClient();
  const currentMode = snapshot?.policy.mode ?? "run_until_gate";
  const [selectedMode, setSelectedMode] = useState<DirectorPolicyMode>(currentMode);
  const [allowExpensiveReview, setAllowExpensiveReview] = useState(false);
  const [mayOverwriteUserContent, setMayOverwriteUserContent] = useState(false);
  const selectedOption = useMemo(
    () => POLICY_OPTIONS.find((item) => item.value === selectedMode) ?? POLICY_OPTIONS[2],
    [selectedMode],
  );
  const mutation = useMutation({
    mutationFn: () => updateDirectorRuntimePolicy(taskId, {
      mode: selectedMode,
      allowExpensiveReview,
      mayOverwriteUserContent,
    }),
    onSuccess: async () => {
      await queryClient.invalidateQueries({ queryKey: queryKeys.tasks.directorRuntime(taskId) });
      toast.success(t("policy.toast.updated"));
    },
    onError: (error) => {
      toast.error(error instanceof Error ? error.message : t("policy.toast.updateFailed"));
    },
  });

  useEffect(() => {
    setSelectedMode(currentMode);
    setAllowExpensiveReview(Boolean(snapshot?.policy.allowExpensiveReview));
    setMayOverwriteUserContent(Boolean(snapshot?.policy.mayOverwriteUserContent));
  }, [currentMode, snapshot?.policy.allowExpensiveReview, snapshot?.policy.mayOverwriteUserContent]);

  if (!snapshot) {
    return null;
  }

  return (
    <div className="rounded-md border bg-muted/20 p-3">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <div className="font-medium">{t("policy.title")}</div>
          <div className="mt-1 text-sm leading-6 text-muted-foreground">
            {t("policy.subtitle")}
          </div>
        </div>
        <Badge variant="outline">{t(formatPolicyModeKey(snapshot.policy.mode))}</Badge>
      </div>
      <div className="mt-3 space-y-2">
        <SelectControl
          className="w-full rounded-md border bg-background px-3 py-2 text-sm"
          value={selectedMode}
          onChange={(event) => setSelectedMode(event.target.value as DirectorPolicyMode)}
        >
          {POLICY_OPTIONS.map((option) => (
            <option key={option.value} value={option.value}>{t(option.labelKey)}</option>
          ))}
        </SelectControl>
        <div className="text-xs leading-5 text-muted-foreground">{t(selectedOption.descriptionKey)}</div>
      </div>
      <div className="mt-3 space-y-2 rounded-md border bg-background/70 p-3">
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={allowExpensiveReview}
            onChange={(event) => setAllowExpensiveReview(event.target.checked)}
          />
          <span>
            <span className="block font-medium">{t("policy.allowExpensiveReview.label")}</span>
            <span className="block text-xs leading-5 text-muted-foreground">
              {t("policy.allowExpensiveReview.description")}
            </span>
          </span>
        </label>
        <label className="flex items-start gap-2 text-sm">
          <input
            type="checkbox"
            className="mt-1"
            checked={mayOverwriteUserContent}
            onChange={(event) => setMayOverwriteUserContent(event.target.checked)}
          />
          <span>
            <span className="block font-medium">{t("policy.mayOverwriteUserContent.label")}</span>
            <span className="block text-xs leading-5 text-muted-foreground">
              {t("policy.mayOverwriteUserContent.description")}
            </span>
          </span>
        </label>
      </div>
      <div className="mt-3 flex flex-wrap gap-2">
        <Button
          size="sm"
          onClick={() => mutation.mutate()}
          disabled={
            mutation.isPending
            || (
              selectedMode === snapshot.policy.mode
              && allowExpensiveReview === Boolean(snapshot.policy.allowExpensiveReview)
              && mayOverwriteUserContent === Boolean(snapshot.policy.mayOverwriteUserContent)
            )
          }
        >
          {mutation.isPending ? t("policy.saving") : t("policy.save")}
        </Button>
      </div>
    </div>
  );
}
