import type { StoryConflictLayers, StoryMacroField } from "@ai-novel/shared/types/storyMacro";
import { useTranslation } from "react-i18next";
import AiButton from "@/components/common/AiButton";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import type { StoryMacroTabProps } from "./NovelEditView.types";
import {
  ENGINE_TEXT_FIELDS,
  FieldActions,
  listToText,
  SUMMARY_FIELDS,
  textareaClassName,
} from "./StoryMacroPlanTab.shared";
import DirectorTakeoverEntryPanel from "./DirectorTakeoverEntryPanel";
import { DetailDisclosure, SectionBlock, StepHero } from "./workspaceShell";

const EMPTY_CONFLICT_LAYERS: StoryConflictLayers = {
  external: "",
  internal: "",
  relational: "",
};

export default function StoryMacroPlanTab(props: StoryMacroTabProps) {
  const { t } = useTranslation("novelsEditD");
  const expansion = props.expansion ?? {
    expanded_premise: "",
    protagonist_core: "",
    conflict_engine: "",
    conflict_layers: EMPTY_CONFLICT_LAYERS,
    mystery_box: "",
    emotional_line: "",
    setpiece_seeds: [],
    tone_reference: "",
  };

  return (
    <div className="space-y-4">
      <DirectorTakeoverEntryPanel
        title={t("macro.takeover.title")}
        description={t("macro.takeover.desc")}
        entry={props.directorTakeoverEntry}
      />
      <StepHero
        title={t("macro.hero.title")}
        description={t("macro.hero.desc")}
        actions={(
          <>
            <AiButton onClick={props.onDecompose} disabled={props.isDecomposing || !props.storyInput.trim()}>
              {props.isDecomposing ? t("common.generating") : props.hasPlan ? t("macro.decompose.regenerate") : t("macro.decompose.generate")}
            </AiButton>
            <AiButton
              variant="secondary"
              onClick={props.onBuildConstraintEngine}
              disabled={props.isBuilding || !props.decomposition.selling_point.trim()}
            >
              {props.isBuilding ? t("macro.build.loading") : t("macro.build.label")}
            </AiButton>
            <Button variant="outline" onClick={props.onSaveEdits} disabled={props.isSaving}>
              {props.isSaving ? t("common.saving") : t("macro.save")}
            </Button>
          </>
        )}
      >
        <div className="space-y-4">
          <div className="space-y-2">
            <div className="text-sm font-medium text-foreground">{t("macro.storyInput.label")}</div>
            <textarea
              value={props.storyInput}
              onChange={(event) => props.onStoryInputChange(event.target.value)}
              placeholder={t("macro.storyInput.placeholder")}
              className={textareaClassName("min-h-36")}
            />
          </div>
          {props.message ? (
            <div className="rounded-xl bg-background/70 px-3 py-2 text-sm text-muted-foreground">
              {props.message}
            </div>
          ) : null}
        </div>
      </StepHero>

      <SectionBlock
        title={t("macro.summary.title")}
        description={t("macro.summary.desc")}
        contentClassName="grid gap-4 xl:grid-cols-2"
      >
          {SUMMARY_FIELDS.map((item) => {
            const value = props.decomposition[item.field as keyof typeof props.decomposition];
            return (
              <div key={item.field} className="space-y-2 rounded-xl bg-muted/15 p-4">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div className="text-sm font-medium text-foreground">{t(item.label)}</div>
                  <FieldActions
                    field={item.field}
                    lockedFields={props.lockedFields}
                    regeneratingField={props.regeneratingField}
                    storyInput={props.storyInput}
                    onToggleLock={props.onToggleLock}
                    onRegenerateField={props.onRegenerateField}
                  />
                </div>
                {item.multiline ? (
                  <textarea
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) => props.onFieldChange(item.field, event.target.value)}
                    placeholder={t(item.placeholder)}
                    className={textareaClassName()}
                  />
                ) : (
                  <Input
                    value={typeof value === "string" ? value : ""}
                    onChange={(event) => props.onFieldChange(item.field, event.target.value)}
                    placeholder={t(item.placeholder)}
                  />
                )}
              </div>
            );
          })}

          <div className="space-y-2 rounded-xl bg-muted/15 p-4 xl:col-span-2">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="text-sm font-medium text-foreground">{t("macro.payoffs.label")}</div>
              <FieldActions
                field="major_payoffs"
                lockedFields={props.lockedFields}
                regeneratingField={props.regeneratingField}
                storyInput={props.storyInput}
                onToggleLock={props.onToggleLock}
                onRegenerateField={props.onRegenerateField}
              />
            </div>
            <textarea
              value={listToText(props.decomposition.major_payoffs)}
              onChange={(event) => props.onFieldChange(
                "major_payoffs",
                event.target.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
              )}
              placeholder={t("macro.payoffs.placeholder")}
              className={textareaClassName("min-h-32")}
            />
          </div>
      </SectionBlock>

      <DetailDisclosure
        title={t("macro.disclosure.title")}
        description={t("macro.disclosure.desc")}
      >
        <div className="space-y-4">
          {props.expansion ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("macro.engine.title")}</CardTitle>
                <CardDescription>
                  {t("macro.engine.desc")}
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid gap-4 xl:grid-cols-2">
                  {ENGINE_TEXT_FIELDS.map((item) => {
                    const value = expansion[item.field as keyof typeof expansion];
                    return (
                      <div key={item.field} className="space-y-2 rounded-xl border border-border/70 p-4">
                        <div className="flex flex-wrap items-center justify-between gap-2">
                          <div className="text-sm font-medium text-foreground">{t(item.label)}</div>
                          <FieldActions
                            field={item.field}
                            lockedFields={props.lockedFields}
                            regeneratingField={props.regeneratingField}
                            storyInput={props.storyInput}
                            onToggleLock={props.onToggleLock}
                            onRegenerateField={props.onRegenerateField}
                          />
                        </div>
                        {item.multiline ? (
                          <textarea
                            value={typeof value === "string" ? value : ""}
                            onChange={(event) => props.onFieldChange(item.field, event.target.value)}
                            placeholder={t(item.placeholder)}
                            className={textareaClassName()}
                          />
                        ) : (
                          <Input
                            value={typeof value === "string" ? value : ""}
                            onChange={(event) => props.onFieldChange(item.field, event.target.value)}
                            placeholder={t(item.placeholder)}
                          />
                        )}
                      </div>
                    );
                  })}
                </div>

                <div className="space-y-2 rounded-xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium text-foreground">{t("macro.conflictLayers.title")}</div>
                    <FieldActions
                      field="conflict_layers"
                      lockedFields={props.lockedFields}
                      regeneratingField={props.regeneratingField}
                      storyInput={props.storyInput}
                      onToggleLock={props.onToggleLock}
                      onRegenerateField={props.onRegenerateField}
                    />
                  </div>
                  <div className="grid gap-4 xl:grid-cols-3">
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">{t("macro.conflictLayers.externalLabel")}</div>
                      <textarea
                        value={expansion.conflict_layers.external}
                        onChange={(event) => props.onFieldChange("conflict_layers", {
                          ...expansion.conflict_layers,
                          external: event.target.value,
                        })}
                        placeholder={t("macro.conflictLayers.externalPlaceholder")}
                        className={textareaClassName("min-h-24")}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">{t("macro.conflictLayers.internalLabel")}</div>
                      <textarea
                        value={expansion.conflict_layers.internal}
                        onChange={(event) => props.onFieldChange("conflict_layers", {
                          ...expansion.conflict_layers,
                          internal: event.target.value,
                        })}
                        placeholder={t("macro.conflictLayers.internalPlaceholder")}
                        className={textareaClassName("min-h-24")}
                      />
                    </div>
                    <div className="space-y-2">
                      <div className="text-sm text-muted-foreground">{t("macro.conflictLayers.relationalLabel")}</div>
                      <textarea
                        value={expansion.conflict_layers.relational}
                        onChange={(event) => props.onFieldChange("conflict_layers", {
                          ...expansion.conflict_layers,
                          relational: event.target.value,
                        })}
                        placeholder={t("macro.conflictLayers.relationalPlaceholder")}
                        className={textareaClassName("min-h-24")}
                      />
                    </div>
                  </div>
                </div>

                <div className="space-y-2 rounded-xl border border-border/70 p-4">
                  <div className="flex flex-wrap items-center justify-between gap-2">
                    <div className="text-sm font-medium text-foreground">{t("macro.setpiece.title")}</div>
                    <FieldActions
                      field="setpiece_seeds"
                      lockedFields={props.lockedFields}
                      regeneratingField={props.regeneratingField}
                      storyInput={props.storyInput}
                      onToggleLock={props.onToggleLock}
                      onRegenerateField={props.onRegenerateField}
                    />
                  </div>
                  <textarea
                    value={listToText(expansion.setpiece_seeds)}
                    onChange={(event) => props.onFieldChange(
                      "setpiece_seeds",
                      event.target.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
                    )}
                    placeholder={t("macro.setpiece.placeholder")}
                    className={textareaClassName("min-h-32")}
                  />
                </div>
              </CardContent>
            </Card>
          ) : null}

          {props.issues.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle>{t("macro.issues.title")}</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {props.issues.map((issue, index) => (
                  <div key={`${issue.type}-${issue.field}-${index}`} className="rounded-lg border border-amber-300/60 bg-amber-50 px-3 py-2 text-sm text-amber-900">
                    <div className="font-medium">{issue.type === "conflict" ? t("macro.issues.conflict") : t("macro.issues.insufficient")}</div>
                    <div className="mt-1">{issue.message}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : null}

          <Card>
            <CardHeader>
              <CardTitle>{t("macro.hardConstraints.title")}</CardTitle>
              <CardDescription>
                {t("macro.hardConstraints.desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-2">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-sm font-medium text-foreground">{t("macro.narrativeRules.label")}</div>
                <FieldActions
                  field="constraints"
                  lockedFields={props.lockedFields}
                  regeneratingField={props.regeneratingField}
                  storyInput={props.storyInput}
                  onToggleLock={props.onToggleLock}
                  onRegenerateField={props.onRegenerateField}
                />
              </div>
              <textarea
                value={listToText(props.constraints)}
                onChange={(event) => props.onFieldChange(
                  "constraints",
                  event.target.value.split(/\r?\n/).map((line) => line.trim()).filter(Boolean),
                )}
                placeholder={t("macro.narrativeRules.placeholder")}
                className={textareaClassName("min-h-36")}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("macro.constraintEngine.title")}</CardTitle>
              <CardDescription>
                {t("macro.constraintEngine.desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {props.constraintEngine ? (
                <>
                  <div className="space-y-2 rounded-xl border border-border/70 p-4">
                    <div className="text-sm font-medium text-foreground">{t("macro.constraintEngine.premise")}</div>
                    <div className="text-sm leading-7 text-muted-foreground">{props.constraintEngine.premise}</div>
                  </div>
                  <div className="grid gap-4 xl:grid-cols-2">
                    <div className="space-y-2 rounded-xl border border-border/70 p-4">
                      <div className="text-sm font-medium text-foreground">{t("macro.constraintEngine.mysteryBox")}</div>
                      <div className="text-sm text-muted-foreground">{props.constraintEngine.mystery_box}</div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 p-4">
                      <div className="text-sm font-medium text-foreground">{t("macro.constraintEngine.conflictAxis")}</div>
                      <div className="text-sm text-muted-foreground">{props.constraintEngine.conflict_axis}</div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 p-4">
                      <div className="text-sm font-medium text-foreground">{t("macro.constraintEngine.pressureRoles")}</div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {props.constraintEngine.pressure_roles.map((item) => (
                          <div key={item}>{item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 p-4">
                      <div className="text-sm font-medium text-foreground">{t("macro.constraintEngine.growthPath")}</div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {props.constraintEngine.growth_path.map((item) => (
                          <div key={item}>{item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 p-4">
                      <div className="text-sm font-medium text-foreground">{t("macro.constraintEngine.phaseModel")}</div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {props.constraintEngine.phase_model.map((phase) => (
                          <div key={phase.name}>
                            <span className="font-medium text-foreground">{phase.name}</span>
                            {" · "}
                            {phase.goal}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 p-4">
                      <div className="text-sm font-medium text-foreground">{t("macro.constraintEngine.hardConstraintList")}</div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {props.constraintEngine.hard_constraints.map((item) => (
                          <div key={item}>{item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 p-4 xl:col-span-2">
                      <div className="text-sm font-medium text-foreground">{t("macro.constraintEngine.turningPoints")}</div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {props.constraintEngine.turning_points.map((item) => (
                          <div key={`${item.phase}-${item.title}`}>
                            <span className="font-medium text-foreground">{item.phase}</span>
                            {" · "}
                            {item.summary}
                          </div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 p-4">
                      <div className="text-sm font-medium text-foreground">{t("macro.constraintEngine.endingMustHave")}</div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {props.constraintEngine.ending_constraints.must_have.map((item) => (
                          <div key={item}>{item}</div>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2 rounded-xl border border-border/70 p-4">
                      <div className="text-sm font-medium text-foreground">{t("macro.constraintEngine.endingMustNotHave")}</div>
                      <div className="space-y-2 text-sm text-muted-foreground">
                        {props.constraintEngine.ending_constraints.must_not_have.map((item) => (
                          <div key={item}>{item}</div>
                        ))}
                      </div>
                    </div>
                  </div>
                </>
              ) : (
                <div className="rounded-xl border border-dashed border-border/70 px-4 py-6 text-sm text-muted-foreground">
                  {t("macro.constraintEngine.empty")}
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>{t("macro.state.title")}</CardTitle>
              <CardDescription>
                {t("macro.state.desc")}
              </CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 xl:grid-cols-[160px_160px_minmax(0,1fr)_auto]">
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">{t("macro.state.currentPhase")}</div>
                <Input
                  type="number"
                  value={props.state.currentPhase}
                  onChange={(event) => props.onStateChange("currentPhase", Number(event.target.value))}
                  min={0}
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">{t("macro.state.progress")}</div>
                <Input
                  type="number"
                  value={props.state.progress}
                  onChange={(event) => props.onStateChange("progress", Number(event.target.value))}
                  min={0}
                  max={100}
                />
              </div>
              <div className="space-y-2">
                <div className="text-sm font-medium text-foreground">{t("macro.state.protagonistState")}</div>
                <Input
                  value={props.state.protagonistState}
                  onChange={(event) => props.onStateChange("protagonistState", event.target.value)}
                  placeholder={t("macro.state.protagonistPlaceholder")}
                />
              </div>
              <div className="flex items-end">
                <Button variant="outline" onClick={props.onSaveState} disabled={props.isSavingState}>
                  {props.isSavingState ? t("common.saving") : t("macro.state.save")}
                </Button>
              </div>
            </CardContent>
          </Card>
        </div>
      </DetailDisclosure>
    </div>
  );
}
