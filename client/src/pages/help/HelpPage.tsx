import {
  BookOpenText,
  CheckCircle2,
  CircleHelp,
  ClipboardList,
  Compass,
  KeyRound,
  ListTodo,
  Route,
  Sparkles,
  WandSparkles,
  Workflow,
} from "lucide-react";
import type { LucideIcon } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

const DIRECTOR_CREATE_LINK = "/novels/auto-director";

interface GuideStep {
  id: string;
  icon: LucideIcon;
}

interface GoalEntry {
  id: string;
  href: string;
  icon: LucideIcon;
}

interface FaqItem {
  id: string;
}

const guideSteps: GuideStep[] = [
  { id: "configureModel", icon: KeyRound },
  { id: "inputInspiration", icon: Sparkles },
  { id: "autoDirector", icon: Compass },
  { id: "confirmDirection", icon: CheckCircle2 },
  { id: "advanceToWritable", icon: Workflow },
  { id: "enterChapterExecution", icon: BookOpenText },
  { id: "viewTasks", icon: ListTodo },
];

const goalEntries: GoalEntry[] = [
  { id: "fromScratch", href: DIRECTOR_CREATE_LINK, icon: Sparkles },
  { id: "continueProject", href: "/novels", icon: BookOpenText },
  { id: "configureVendor", href: "/settings", icon: Route },
  { id: "handleTasks", href: "/tasks", icon: ClipboardList },
  { id: "directorFollowUp", href: "/auto-director/follow-ups", icon: Workflow },
  { id: "adjustStyle", href: "/style-engine", icon: WandSparkles },
];

const faqItems: FaqItem[] = [
  { id: "needOutline" },
  { id: "knowledgeRequired" },
  { id: "taskFailed" },
  { id: "qualityPending" },
];

export default function HelpPage() {
  const { t } = useTranslation("misc");
  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-4">
      <section className="rounded-xl border bg-gradient-to-br from-primary/10 via-background to-emerald-500/10 p-6 shadow-sm">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="max-w-3xl space-y-3">
            <div className="flex flex-wrap items-center gap-2">
              <Badge>{t("help.badge.newbie")}</Badge>
              <Badge variant="outline">{t("help.badge.recommendedRoute")}</Badge>
            </div>
            <h1 className="text-3xl font-semibold tracking-normal text-foreground sm:text-4xl">
              {t("help.hero.title")}
            </h1>
            <p className="text-sm leading-6 text-muted-foreground sm:text-base">
              {t("help.hero.subtitle")}
            </p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link to={DIRECTOR_CREATE_LINK}>{t("help.hero.startFirstNovel")}</Link>
            </Button>
            <Button asChild size="lg" variant="outline">
              <Link to="/settings">{t("help.hero.configureModel")}</Link>
            </Button>
          </div>
        </div>
      </section>

      <Card className="border-amber-300 bg-amber-50/80">
        <CardHeader className="pb-3">
          <div className="flex flex-wrap items-center gap-2">
            <KeyRound className="h-5 w-5 text-amber-700" />
            <CardTitle className="text-lg text-amber-950">{t("help.modelCard.title")}</CardTitle>
          </div>
          <CardDescription className="text-amber-900/80">
            {t("help.modelCard.description")}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Button asChild variant="outline">
            <Link to="/settings">{t("help.modelCard.action")}</Link>
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("help.recommended.title")}</CardTitle>
          <CardDescription>{t("help.recommended.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {guideSteps.map((step, index) => {
              const Icon = step.icon;
              return (
                <div key={step.id} className="rounded-lg border bg-background p-4">
                  <div className="flex items-start gap-3">
                    <div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-primary/10 text-primary">
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="min-w-0 space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <Badge variant="outline">{index + 1}</Badge>
                        <div className="font-semibold">{t(`help.guide.${step.id}.title`)}</div>
                      </div>
                      <p className="text-sm leading-6 text-muted-foreground">
                        {t(`help.guide.${step.id}.description`)}
                      </p>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>{t("help.goalSection.title")}</CardTitle>
          <CardDescription>{t("help.goalSection.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-3">
            {goalEntries.map((entry) => {
              const Icon = entry.icon;
              return (
                <div key={entry.id} className="flex flex-col justify-between gap-4 rounded-lg border bg-background p-4">
                  <div className="space-y-3">
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-md bg-secondary text-secondary-foreground">
                        <Icon className="h-5 w-5" />
                      </div>
                      <div className="font-semibold">{t(`help.goal.${entry.id}.title`)}</div>
                    </div>
                    <p className="text-sm leading-6 text-muted-foreground">
                      {t(`help.goal.${entry.id}.description`)}
                    </p>
                  </div>
                  <Button asChild variant="outline" className="w-full justify-center">
                    <Link to={entry.href}>{t(`help.goal.${entry.id}.action`)}</Link>
                  </Button>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <div className="flex flex-wrap items-center gap-2">
            <CircleHelp className="h-5 w-5 text-primary" />
            <CardTitle>{t("help.faqSection.title")}</CardTitle>
          </div>
          <CardDescription>{t("help.faqSection.description")}</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid gap-3 md:grid-cols-2">
            {faqItems.map((item) => (
              <div key={item.id} className="rounded-lg border bg-background p-4">
                <div className="font-semibold">{t(`help.faq.${item.id}.question`)}</div>
                <p className="mt-2 text-sm leading-6 text-muted-foreground">
                  {t(`help.faq.${item.id}.answer`)}
                </p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
