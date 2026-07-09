import { useTranslation } from "react-i18next";
import type { StyleBinding } from "@ai-novel/shared/types/styleEngine";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import SelectControl from "@/components/common/SelectControl";

interface BindingFormState {
  targetType: StyleBinding["targetType"];
  novelId: string;
  chapterId: string;
  taskTargetId: string;
  priority: number;
  weight: number;
}

interface TestWriteFormState {
  mode: "generate" | "rewrite";
  topic: string;
  sourceText: string;
  targetLength: number;
}

interface WritingFormulaWorkbenchPanelProps {
  selectedProfileId: string;
  bindingForm: BindingFormState;
  bindings: StyleBinding[];
  novelOptions: Array<{ id: string; title: string }>;
  chapterOptions: Array<{ id: string; order: number; title: string }>;
  createBindingPending: boolean;
  onBindingFormChange: (patch: Partial<BindingFormState>) => void;
  onCreateBinding: () => void;
  onDeleteBinding: (bindingId: string) => void;
  testWriteForm: TestWriteFormState;
  testWriteOutput: string;
  testWritePending: boolean;
  onTestWriteFormChange: (patch: Partial<TestWriteFormState>) => void;
  onRunTestWrite: () => void;
}

export default function WritingFormulaWorkbenchPanel(props: WritingFormulaWorkbenchPanelProps) {
  const { t } = useTranslation("writingFormula");
  const {
    selectedProfileId,
    bindingForm,
    bindings,
    novelOptions,
    chapterOptions,
    createBindingPending,
    onBindingFormChange,
    onCreateBinding,
    onDeleteBinding,
    testWriteForm,
    testWriteOutput,
    testWritePending,
    onTestWriteFormChange,
    onRunTestWrite,
  } = props;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("workbench.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-5">
        <div className="rounded-2xl border bg-slate-50/70 px-4 py-3 text-sm leading-7 text-slate-700">
          {t("workbench.intro")}
        </div>

        <div className="space-y-4 rounded-2xl border p-4">
          <div className="space-y-1">
            <div className="text-base font-semibold text-slate-950">{t("workbench.bindTargetTitle")}</div>
            <div className="text-sm leading-6 text-slate-500">
              {t("workbench.bindTargetHint")}
            </div>
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-2">
              <div className="text-sm font-medium text-slate-900">{t("workbench.bindLevelLabel")}</div>
              <SelectControl
                className="w-full rounded-md border p-2 text-sm"
                value={bindingForm.targetType}
                onChange={(event) => onBindingFormChange({ targetType: event.target.value as StyleBinding["targetType"] })}
              >
                <option value="novel">{t("workbench.targetNovel")}</option>
                <option value="chapter">{t("workbench.targetChapter")}</option>
                <option value="task">{t("workbench.targetTask")}</option>
              </SelectControl>
            </label>

            <label className="space-y-2">
              <div className="text-sm font-medium text-slate-900">{t("workbench.novelLabel")}</div>
              <SelectControl
                className="w-full rounded-md border p-2 text-sm"
                value={bindingForm.novelId}
                onChange={(event) => onBindingFormChange({ novelId: event.target.value, chapterId: "" })}
              >
                {novelOptions.map((novel) => <option key={novel.id} value={novel.id}>{novel.title}</option>)}
              </SelectControl>
            </label>

            {bindingForm.targetType === "chapter" ? (
              <label className="space-y-2">
                <div className="text-sm font-medium text-slate-900">{t("workbench.chapterLabel")}</div>
                <SelectControl
                  className="w-full rounded-md border p-2 text-sm"
                  value={bindingForm.chapterId}
                  onChange={(event) => onBindingFormChange({ chapterId: event.target.value })}
                >
                  <option value="">{t("workbench.chapterLabel")}</option>
                  {chapterOptions.map((chapter) => (
                    <option key={chapter.id} value={chapter.id}>
                      {chapter.order}. {chapter.title}
                    </option>
                  ))}
                </SelectControl>
              </label>
            ) : null}

            {bindingForm.targetType === "task" ? (
              <label className="space-y-2">
                <div className="text-sm font-medium text-slate-900">{t("workbench.taskIdLabel")}</div>
                <input
                  className="w-full rounded-md border p-2 text-sm"
                  placeholder={t("workbench.taskIdPlaceholder")}
                  value={bindingForm.taskTargetId}
                  onChange={(event) => onBindingFormChange({ taskTargetId: event.target.value })}
                />
              </label>
            ) : null}

            <label className="space-y-2">
              <div className="text-sm font-medium text-slate-900">{t("workbench.priorityLabel")}</div>
              <input
                className="w-full rounded-md border p-2 text-sm"
                type="number"
                min={0}
                max={99}
                value={bindingForm.priority}
                onChange={(event) => onBindingFormChange({ priority: Number(event.target.value) || 1 })}
              />
            </label>

            <label className="space-y-2">
              <div className="text-sm font-medium text-slate-900">{t("workbench.weightLabel")}</div>
              <input
                className="w-full rounded-md border p-2 text-sm"
                type="number"
                min={0.3}
                max={1}
                step={0.1}
                value={bindingForm.weight}
                onChange={(event) => onBindingFormChange({ weight: Number(event.target.value) || 1 })}
              />
            </label>
          </div>

          <Button onClick={onCreateBinding} disabled={createBindingPending || !selectedProfileId}>
            {t("workbench.createBinding")}
          </Button>

          <div className="space-y-2">
            {bindings.length > 0 ? (
              bindings.map((binding) => (
                <div key={binding.id} className="flex items-center justify-between gap-3 rounded-xl border p-3 text-sm">
                  <span>{binding.targetType} / {binding.targetId} / P{binding.priority} / W{binding.weight}</span>
                  <Button size="sm" variant="ghost" onClick={() => onDeleteBinding(binding.id)}>{t("common.delete")}</Button>
                </div>
              ))
            ) : (
              <div className="rounded-xl border border-dashed px-3 py-3 text-sm leading-6 text-slate-500">
                {t("workbench.bindingEmpty")}
              </div>
            )}
          </div>
        </div>

        <div className="space-y-4 rounded-2xl border p-4">
          <div className="space-y-1">
            <div className="text-base font-semibold text-slate-950">{t("workbench.testWriteTitle")}</div>
            <div className="text-sm leading-6 text-slate-500">
              {t("workbench.testWriteHint")}
            </div>
          </div>

          <label className="space-y-2">
            <div className="text-sm font-medium text-slate-900">{t("workbench.testModeLabel")}</div>
            <SelectControl
              className="w-full rounded-md border p-2 text-sm"
              value={testWriteForm.mode}
              onChange={(event) => onTestWriteFormChange({ mode: event.target.value as "generate" | "rewrite" })}
            >
              <option value="generate">{t("workbench.modeGenerate")}</option>
              <option value="rewrite">{t("workbench.modeRewrite")}</option>
            </SelectControl>
          </label>

          {testWriteForm.mode === "generate" ? (
            <label className="space-y-2">
              <div className="text-sm font-medium text-slate-900">{t("workbench.topicLabel")}</div>
              <input
                className="w-full rounded-md border p-2 text-sm"
                placeholder={t("workbench.topicPlaceholder")}
                value={testWriteForm.topic}
                onChange={(event) => onTestWriteFormChange({ topic: event.target.value })}
              />
            </label>
          ) : (
            <label className="space-y-2">
              <div className="text-sm font-medium text-slate-900">{t("workbench.sourceTextLabel")}</div>
              <textarea
                className="min-h-[140px] w-full rounded-md border p-2 text-sm"
                placeholder={t("workbench.sourceTextPlaceholder")}
                value={testWriteForm.sourceText}
                onChange={(event) => onTestWriteFormChange({ sourceText: event.target.value })}
              />
            </label>
          )}

          <Button onClick={onRunTestWrite} disabled={testWritePending || !selectedProfileId}>
            {t("workbench.runTestWrite")}
          </Button>

          {testWriteOutput ? (
            <pre className="max-h-[320px] overflow-auto whitespace-pre-wrap rounded-xl border bg-muted/20 p-4 text-sm">
              {testWriteOutput}
            </pre>
          ) : (
            <div className="rounded-xl border border-dashed px-3 py-3 text-sm leading-6 text-slate-500">
              {t("workbench.testWriteEmpty")}
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
