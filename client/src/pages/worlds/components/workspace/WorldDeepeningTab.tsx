import { useMemo, useState, type Dispatch, type SetStateAction } from "react";
import { useTranslation } from "react-i18next";
import type { WorldDeepeningQuestion } from "@ai-novel/shared/types/world";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface WorldDeepeningTabProps {
  questions: WorldDeepeningQuestion[];
  answerDrafts: Record<string, string>;
  setAnswerDrafts: Dispatch<SetStateAction<Record<string, string>>>;
  llmQuickOptions: Record<string, string[]>;
  generatePending: boolean;
  submitPending: boolean;
  onGenerate: () => void;
  onSubmit: () => void;
}

export default function WorldDeepeningTab(props: WorldDeepeningTabProps) {
  const {
    questions,
    answerDrafts,
    setAnswerDrafts,
    llmQuickOptions,
    generatePending,
    submitPending,
    onGenerate,
    onSubmit,
  } = props;
  const { t } = useTranslation("worldsComponentsB");
  const [activeQuestionId, setActiveQuestionId] = useState<string | null>(null);
  const activeQuestion = useMemo(() => {
    if (questions.length === 0) {
      return null;
    }
    return questions.find((question) => question.id === activeQuestionId) ?? questions[0];
  }, [activeQuestionId, questions]);
  const activeQuickOptions = activeQuestion
    ? (activeQuestion.quickOptions ?? llmQuickOptions[activeQuestion.id] ?? [])
      .map((option) => option.trim())
      .filter(Boolean)
      .slice(0, 4)
    : [];
  const answeredCount = questions.filter((question) => answerDrafts[question.id]?.trim()).length;

  return (
    <Card>
      <CardHeader>
        <CardTitle>{t("deepening.title")}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex flex-col gap-3 rounded-md border p-3 lg:flex-row lg:items-center lg:justify-between">
          <div>
            <div className="text-sm font-medium">{t("deepening.subtitle")}</div>
            <div className="mt-1 text-xs leading-5 text-muted-foreground">
              {t("deepening.desc")}
            </div>
          </div>
          <Button onClick={onGenerate} disabled={generatePending}>
            {generatePending ? t("deepening.generating") : t("deepening.generate")}
          </Button>
        </div>

        {questions.length > 0 ? (
          <div className="grid gap-3 lg:grid-cols-[260px_minmax(0,1fr)]">
            <div className="space-y-2 rounded-md border p-3">
              <div className="flex items-center justify-between gap-2">
                <div className="text-sm font-medium">{t("deepening.pendingTitle")}</div>
                <div className="text-xs text-muted-foreground">{answeredCount}/{questions.length}</div>
              </div>
              {questions.map((question, index) => {
                const answered = Boolean(answerDrafts[question.id]?.trim());
                const selected = activeQuestion?.id === question.id;
                return (
                  <button
                    key={question.id}
                    type="button"
                    className={[
                      "w-full rounded-md border p-2 text-left text-sm transition-colors",
                      selected ? "border-primary bg-primary/5" : "border-border/70 bg-background hover:bg-muted/40",
                    ].join(" ")}
                    onClick={() => setActiveQuestionId(question.id)}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-medium text-foreground">{t("deepening.questionLabel", { index: index + 1 })}</span>
                      <span className={answered ? "text-xs text-primary" : "text-xs text-muted-foreground"}>
                        {answered ? t("deepening.answered") : t("deepening.unanswered")}
                      </span>
                    </div>
                    <div className="mt-1 line-clamp-2 text-xs leading-5 text-muted-foreground">
                      {question.question}
                    </div>
                  </button>
                );
              })}
            </div>

            {activeQuestion ? (
              <div className="rounded-md border p-3 space-y-3">
                <div>
                  <div className="text-sm font-medium text-foreground">{activeQuestion.question}</div>
                  <div className="mt-1 text-xs text-muted-foreground">
                    {t("deepening.answerNote")}
                  </div>
                </div>
                {activeQuickOptions.length > 0 ? (
                  <div className="space-y-2">
                    <div className="text-xs text-muted-foreground">{t("deepening.quickOptionsLabel")}</div>
                    <div className="flex flex-wrap gap-2">
                      {activeQuickOptions.map((option) => (
                        <Button
                          key={`${activeQuestion.id}-${option}`}
                          size="sm"
                          variant={answerDrafts[activeQuestion.id] === option ? "default" : "outline"}
                          className="h-auto whitespace-normal text-left"
                          onClick={() =>
                            setAnswerDrafts((prev) => ({ ...prev, [activeQuestion.id]: option }))
                          }
                        >
                          {option}
                        </Button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="rounded-md border border-dashed p-3 text-xs text-muted-foreground">
                    {t("deepening.noQuickOptions")}
                  </div>
                )}
                <textarea
                  className="min-h-[100px] w-full rounded-md border bg-background p-2 text-sm"
                  value={answerDrafts[activeQuestion.id] ?? ""}
                  onChange={(event) =>
                    setAnswerDrafts((prev) => ({ ...prev, [activeQuestion.id]: event.target.value }))
                  }
                  placeholder={t("deepening.answerPlaceholder")}
                />
              </div>
            ) : null}
          </div>
        ) : (
          <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
            {t("deepening.emptyState")}
          </div>
        )}
        <div className="flex justify-end">
          <Button
            onClick={onSubmit}
            disabled={submitPending || answeredCount === 0 || questions.length === 0}
          >
            {submitPending ? t("deepening.submitting") : t("deepening.submit")}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
