import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useTranslation } from "react-i18next";
import type { UnifiedTaskDetail } from "@ai-novel/shared/types/task";
import { useNavigate } from "react-router-dom";
import { repairNovelWorkflowChapterTitles } from "@/api/novelWorkflow";
import { queryKeys } from "@/api/queryKeys";
import { toast } from "@/components/ui/toast";
import { resolveChapterTitleWarning } from "@/lib/directorTaskNotice";

interface DirectorChapterTitleRepairOptions {
  navigateOnSuccess?: boolean;
  onAfterStart?: (input: {
    task: UnifiedTaskDetail;
    warning: NonNullable<ReturnType<typeof resolveChapterTitleWarning>>;
  }) => void | Promise<void>;
}

export function useDirectorChapterTitleRepair(options: DirectorChapterTitleRepairOptions = {}) {
  const { t } = useTranslation("storeHooks");
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const mutation = useMutation({
    mutationFn: async (task: UnifiedTaskDetail) => {
      const warning = resolveChapterTitleWarning(task);
      if (!warning) {
        throw new Error(t("directorChapterTitleRepair.noRepairableWarning"));
      }
      const response = await repairNovelWorkflowChapterTitles(task.id, {
        volumeId: warning.volumeId ?? undefined,
      });
      return {
        response,
        task,
        warning,
      };
    },
    onSuccess: async ({ task, warning }) => {
      const novelId = task.sourceResource?.type === "novel"
        ? task.sourceResource.id
        : null;
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: queryKeys.tasks.detail(task.kind, task.id) }),
        queryClient.invalidateQueries({ queryKey: ["tasks"] }),
        novelId ? queryClient.invalidateQueries({ queryKey: queryKeys.novels.autoDirectorTask(novelId) }) : Promise.resolve(),
        novelId ? queryClient.invalidateQueries({ queryKey: queryKeys.novels.detail(novelId) }) : Promise.resolve(),
      ]);
      if (options.navigateOnSuccess !== false && warning.route) {
        navigate(warning.route);
      }
      if (options.onAfterStart) {
        await Promise.resolve(options.onAfterStart({
          task,
          warning,
        })).catch(() => {});
      }
      toast.success(t("directorChapterTitleRepair.repairStarted"));
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : t("directorChapterTitleRepair.repairFailed");
      toast.error(message);
    },
  });

  return {
    startRepair: (task: UnifiedTaskDetail | null | undefined) => {
      if (!task) {
        toast.error(t("directorChapterTitleRepair.noTask"));
        return;
      }
      mutation.mutate(task);
    },
    isPending: mutation.isPending,
    pendingTaskId: mutation.variables?.id ?? "",
  };
}
