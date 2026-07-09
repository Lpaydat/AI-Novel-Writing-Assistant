import { FormEvent } from "react";
import type { AntiAiRule } from "@ai-novel/shared/types/styleEngine";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { Button } from "@/components/ui/button";
import { AppDialogContent, Dialog } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import type { RuleFormState } from "../antiAiRulesPage.shared";
import AntiAiToggleLine from "./AntiAiToggleLine";

interface AntiAiRuleDialogProps {
  open: boolean;
  editingRule: AntiAiRule | null;
  form: RuleFormState;
  aiInstruction: string;
  isSaving: boolean;
  isAiDrafting: boolean;
  onOpenChange: (open: boolean) => void;
  onFormChange: (patch: Partial<RuleFormState>) => void;
  onAiInstructionChange: (value: string) => void;
  onGenerateDraft: () => void;
  onSubmit: (event: FormEvent) => void;
}

export default function AntiAiRuleDialog(props: AntiAiRuleDialogProps) {
  const { t } = useTranslation("antiAiRules");
  return (
    <Dialog open={props.open} onOpenChange={props.onOpenChange}>
      <AppDialogContent
        className="max-w-4xl"
        title={props.editingRule ? t("dialog.editTitle") : t("dialog.createTitle")}
        description={t("dialog.description")}
        footer={(
          <>
            <Button type="button" variant="outline" onClick={() => props.onOpenChange(false)}>{t("dialog.cancel")}</Button>
            <Button type="submit" form="anti-ai-rule-form" disabled={props.isSaving}>
              {props.isSaving ? t("dialog.saving") : t("dialog.save")}
            </Button>
          </>
        )}
      >
        <form id="anti-ai-rule-form" className="space-y-4" onSubmit={props.onSubmit}>
          <div className="rounded-lg border bg-muted/20 p-4">
            <div className="flex flex-col gap-3 lg:flex-row lg:items-start lg:justify-between">
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground">
                  <Sparkles className="h-4 w-4" />
                  {t("dialog.aiAssist")}
                </div>
                <div className="text-sm leading-6 text-muted-foreground">
                  {props.editingRule
                    ? t("dialog.aiHintEdit")
                    : t("dialog.aiHintCreate")}
                </div>
              </div>
              <Button
                type="button"
                variant="secondary"
                disabled={!props.aiInstruction.trim() || props.isAiDrafting}
                onClick={props.onGenerateDraft}
              >
                <Sparkles className="h-4 w-4" />
                {props.isAiDrafting ? t("dialog.aiDrafting") : props.editingRule ? t("dialog.aiOptimizeDraft") : t("dialog.aiGenerateDraft")}
              </Button>
            </div>
            <textarea
              className="mt-3 min-h-[84px] w-full rounded-md border bg-background p-3 text-sm"
              value={props.aiInstruction}
              placeholder={props.editingRule
                ? t("dialog.aiPlaceholderEdit")
                : t("dialog.aiPlaceholderCreate")}
              onChange={(event) => props.onAiInstructionChange(event.target.value)}
            />
          </div>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">{t("dialog.keyLabel")}</span>
              <Input
                value={props.form.key}
                placeholder={t("dialog.keyPlaceholder")}
                onChange={(event) => props.onFormChange({ key: event.target.value })}
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">{t("dialog.nameLabel")}</span>
              <Input
                value={props.form.name}
                placeholder={t("dialog.namePlaceholder")}
                onChange={(event) => props.onFormChange({ name: event.target.value })}
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">{t("dialog.typeLabel")}</span>
              <Select value={props.form.type} onValueChange={(value) => props.onFormChange({ type: value as AntiAiRule["type"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="forbidden">{t("dialog.typeForbidden")}</SelectItem>
                  <SelectItem value="risk">{t("dialog.typeRisk")}</SelectItem>
                  <SelectItem value="encourage">{t("dialog.typeEncourage")}</SelectItem>
                </SelectContent>
              </Select>
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">{t("dialog.severityLabel")}</span>
              <Select value={props.form.severity} onValueChange={(value) => props.onFormChange({ severity: value as AntiAiRule["severity"] })}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t("dialog.severityLow")}</SelectItem>
                  <SelectItem value="medium">{t("dialog.severityMedium")}</SelectItem>
                  <SelectItem value="high">{t("dialog.severityHigh")}</SelectItem>
                </SelectContent>
              </Select>
            </label>
          </div>

          <label className="space-y-1.5 text-sm">
            <span className="font-medium">{t("dialog.descriptionLabel")}</span>
            <textarea
              className="min-h-[76px] w-full rounded-md border bg-background p-3 text-sm"
              value={props.form.description}
              placeholder={t("dialog.descriptionPlaceholder")}
              onChange={(event) => props.onFormChange({ description: event.target.value })}
            />
          </label>

          <label className="space-y-1.5 text-sm">
            <span className="font-medium">{t("dialog.detectLabel")}</span>
            <textarea
              className="min-h-[80px] w-full rounded-md border bg-background p-3 text-sm"
              value={props.form.detectPatternsText}
              placeholder={t("dialog.detectPlaceholder")}
              onChange={(event) => props.onFormChange({ detectPatternsText: event.target.value })}
            />
          </label>

          <div className="grid gap-3 md:grid-cols-2">
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">{t("dialog.promptLabel")}</span>
              <textarea
                className="min-h-[120px] w-full rounded-md border bg-background p-3 text-sm"
                value={props.form.promptInstruction}
                placeholder={t("dialog.promptPlaceholder")}
                onChange={(event) => props.onFormChange({ promptInstruction: event.target.value })}
              />
            </label>
            <label className="space-y-1.5 text-sm">
              <span className="font-medium">{t("dialog.rewriteLabel")}</span>
              <textarea
                className="min-h-[120px] w-full rounded-md border bg-background p-3 text-sm"
                value={props.form.rewriteSuggestion}
                placeholder={t("dialog.rewritePlaceholder")}
                onChange={(event) => props.onFormChange({ rewriteSuggestion: event.target.value })}
              />
            </label>
          </div>

          <div className="grid gap-3 md:grid-cols-3">
            <AntiAiToggleLine
              label={t("dialog.toggleEnabled")}
              checked={props.form.enabled}
              onCheckedChange={(checked) => props.onFormChange({ enabled: checked })}
            />
            <AntiAiToggleLine
              label={t("dialog.toggleGlobal")}
              checked={props.form.globalBaselineEnabled}
              onCheckedChange={(checked) => props.onFormChange({ globalBaselineEnabled: checked })}
            />
            <AntiAiToggleLine
              label={t("dialog.toggleAutoRewrite")}
              checked={props.form.autoRewrite}
              onCheckedChange={(checked) => props.onFormChange({ autoRewrite: checked })}
            />
          </div>
        </form>
      </AppDialogContent>
    </Dialog>
  );
}
