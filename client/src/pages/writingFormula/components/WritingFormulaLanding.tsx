import type { KeyboardEvent, ReactNode } from "react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import type { LandingProfileItem } from "../writingFormulaLandingItems";

interface WritingFormulaLandingProps {
  onOpenCreate: () => void;
  onSelectProfile: (profileId: string) => void;
  onEditProfile: (profileId: string) => void;
  onOpenWorkbench: (profileId: string) => void;
  onUseProfileForClean: (profileId: string) => void;
  onDeleteProfile: (profileId: string) => void;
  deletePending: boolean;
  profileItems: LandingProfileItem[];
  selectedProfileId: string;
}

function truncateText(value: string | null | undefined, maxLength: number): string {
  const text = value?.trim() ?? "";
  if (!text) {
    return "";
  }
  return text.length > maxLength ? `${text.slice(0, maxLength)}...` : text;
}

function handleSelectableKeyDown(event: KeyboardEvent<HTMLDivElement>, onSelect: () => void): void {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }
  event.preventDefault();
  onSelect();
}

function DetailPanel(props: { title: string; description?: string; children: ReactNode }) {
  return (
    <div className="space-y-3 rounded-2xl border bg-white/80 p-4">
      <div className="space-y-1">
        <div className="text-xs font-medium uppercase tracking-[0.18em] text-slate-500">{props.title}</div>
        {props.description ? (
          <div className="text-xs leading-6 text-slate-500">{props.description}</div>
        ) : null}
      </div>
      {props.children}
    </div>
  );
}

function DetailStatRow(props: { label: string; value: string }) {
  return (
    <div className="flex items-start justify-between gap-3 text-sm leading-6">
      <div className="text-slate-500">{props.label}</div>
      <div className="text-right text-slate-800">{props.value}</div>
    </div>
  );
}

function SummaryCard(props: { title: string; summary: string }) {
  return (
    <div className="rounded-xl border bg-slate-50/80 p-3">
      <div className="text-sm font-medium text-slate-900">{props.title}</div>
      <div className="mt-2 text-sm leading-6 text-slate-600">{props.summary}</div>
    </div>
  );
}

export default function WritingFormulaLanding(props: WritingFormulaLandingProps) {
  const { t } = useTranslation("writingFormula");
  const {
    onOpenCreate,
    onSelectProfile,
    onEditProfile,
    onOpenWorkbench,
    onUseProfileForClean,
    onDeleteProfile,
    deletePending,
    profileItems,
    selectedProfileId,
  } = props;

  const customProfiles = profileItems.filter((item) => !item.isStarter);
  const starterProfiles = profileItems.filter((item) => item.isStarter);

  const renderProfileCard = (profile: LandingProfileItem) => {
    const isSelected = profile.id === selectedProfileId;
    const selectedStyle = profile.isStarter
      ? "border-sky-500 bg-sky-50/80 shadow-[0_8px_24px_rgba(14,165,233,0.12)]"
      : "border-slate-950 bg-[linear-gradient(135deg,rgba(15,23,42,0.04),rgba(14,165,233,0.06))] shadow-[0_8px_24px_rgba(15,23,42,0.06)]";
    const idleStyle = profile.isStarter
      ? "border-slate-200 bg-white hover:border-sky-300"
      : "border-slate-200 bg-slate-50/80 hover:border-slate-300";
    const badgeClassName = profile.isStarter
      ? "h-6 border-sky-200 bg-white text-sky-700"
      : "h-6";

    return (
      <div
        key={profile.id}
        role="button"
        tabIndex={0}
        onClick={() => onSelectProfile(profile.id)}
        onKeyDown={(event) => handleSelectableKeyDown(event, () => onSelectProfile(profile.id))}
        className={`rounded-2xl border px-4 py-4 text-left transition ${isSelected ? selectedStyle : idleStyle}`}
      >
        <div className="flex flex-col gap-3 xl:flex-row xl:items-start xl:justify-between">
          <div className="min-w-0 flex-1 space-y-2">
            <div className="flex flex-wrap items-center gap-2">
              <div className="text-base font-semibold text-slate-950">{profile.name}</div>
              <Badge variant={profile.isStarter ? "outline" : (isSelected ? "default" : "secondary")} className={badgeClassName}>
                {profile.originLabel}
              </Badge>
              {profile.category ? (
                <Badge variant="outline" className="h-6 border-slate-200 text-slate-600">
                  {profile.category}
                </Badge>
              ) : null}
              <Badge variant="outline" className="h-6 border-slate-200 text-slate-600">
                {profile.sourceTypeLabel}
              </Badge>
            </div>
            <div className="text-sm leading-6 text-slate-600">
              {truncateText(profile.summaryLine, 120) || t("summary.noSummary")}
            </div>
            <div className="flex flex-wrap gap-2">
              {profile.tags.slice(0, 4).map((tag) => (
                <Badge key={`${profile.id}-${tag}`} variant="outline" className="h-6 border-slate-200 text-slate-600">
                  {tag}
                </Badge>
              ))}
              {profile.recentNovelTitle ? (
                <Badge variant="secondary" className="h-6 bg-amber-50 text-amber-800">
                  {t("landing.recentBinding", { title: profile.recentNovelTitle })}
                </Badge>
              ) : null}
            </div>
          </div>

          <div className="flex flex-wrap gap-2 xl:justify-end">
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                onEditProfile(profile.id);
              }}
            >
              {t("landing.editSettings")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="outline"
              onClick={(event) => {
                event.stopPropagation();
                onOpenWorkbench(profile.id);
              }}
            >
              {t("landing.applyTest")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="secondary"
              onClick={(event) => {
                event.stopPropagation();
                onUseProfileForClean(profile.id);
              }}
            >
              {t("clean.title")}
            </Button>
            <Button
              type="button"
              size="sm"
              variant="destructive"
              disabled={deletePending}
              onClick={(event) => {
                event.stopPropagation();
                onDeleteProfile(profile.id);
              }}
            >
              {deletePending ? t("common.deleting") : t("common.delete")}
            </Button>
          </div>
        </div>

        {isSelected ? (
          <div className="mt-4 space-y-4 border-t border-slate-200/80 pt-4">
            <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(0,1fr)_280px]">
              <DetailPanel
                title={t("landing.detailPanel.readingTitle")}
                description={t("landing.detailPanel.readingDesc")}
              >
                <div className="rounded-xl border bg-slate-50/80 p-4 text-sm leading-7 text-slate-700">
                  {profile.description}
                </div>
                {profile.detailLines.length > 0 ? (
                  <div className="grid gap-2">
                    {profile.detailLines.map((line) => (
                      <div key={`${profile.id}-${line}`} className="rounded-xl border bg-white px-3 py-3 text-sm leading-6 text-slate-700">
                        {line}
                      </div>
                    ))}
                  </div>
                ) : null}
                {profile.sourceContentPreview ? (
                  <div className="rounded-xl border bg-slate-950 px-4 py-4 text-sm leading-7 text-slate-100">
                    <div className="mb-2 text-xs font-medium uppercase tracking-[0.18em] text-slate-400">{t("landing.sourceSnippetLabel")}</div>
                    <div>{profile.sourceContentPreview}</div>
                  </div>
                ) : null}
              </DetailPanel>

              <div className="space-y-4">
                <DetailPanel
                  title={t("landing.detailPanel.rulesTitle")}
                  description={t("landing.detailPanel.rulesDesc")}
                >
                  <div className="grid gap-3 md:grid-cols-2">
                    <SummaryCard title={t("landing.summary.narrative")} summary={profile.narrativeSummary} />
                    <SummaryCard title={t("landing.summary.character")} summary={profile.characterSummary} />
                    <SummaryCard title={t("landing.summary.language")} summary={profile.languageSummary} />
                    <SummaryCard title={t("landing.summary.rhythm")} summary={profile.rhythmSummary} />
                  </div>
                </DetailPanel>

                <DetailPanel
                  title={t("landing.detailPanel.antiAiTitle")}
                  description={t("landing.detailPanel.antiAiDesc")}
                >
                  {profile.antiAiFocus.length > 0 || profile.antiAiRuleNames.length > 0 || profile.extractionAntiAiRecommendationCount > 0 ? (
                    <div className="space-y-3">
                      {profile.antiAiFocus.length > 0 ? (
                        <div className="grid gap-2">
                          {profile.antiAiFocus.map((line) => (
                            <div key={`${profile.id}-${line}`} className="rounded-xl border bg-amber-50/80 px-3 py-3 text-sm leading-6 text-amber-900">
                              {line}
                            </div>
                          ))}
                        </div>
                      ) : null}
                      {profile.antiAiRuleNames.length > 0 ? (
                        <div className="flex flex-wrap gap-2">
                          {profile.antiAiRuleNames.map((ruleName) => (
                            <Badge key={`${profile.id}-${ruleName}`} variant="secondary" className="bg-slate-100 text-slate-700">
                              {ruleName}
                            </Badge>
                          ))}
                        </div>
                      ) : null}
                      {profile.extractionAntiAiRecommendationCount > 0 ? (
                        <div className="rounded-xl border bg-slate-50/80 px-3 py-3 text-sm leading-6 text-slate-600">
                          {t("landing.extraAntiAiRecommend", { count: profile.extractionAntiAiRecommendationCount })}
                        </div>
                      ) : null}
                    </div>
                  ) : (
                    <div className="rounded-xl border border-dashed px-3 py-3 text-sm leading-6 text-slate-500">
                      {t("landing.antiAiEmpty")}
                    </div>
                  )}
                </DetailPanel>
              </div>

              <div className="space-y-4">
                <DetailPanel
                  title={t("landing.detailPanel.assetTitle")}
                  description={t("landing.detailPanel.assetDesc")}
                >
                  <div className="space-y-2">
                    <DetailStatRow label={t("landing.stat.source")} value={profile.sourceTypeLabel} />
                    <DetailStatRow label={t("landing.stat.updated")} value={profile.updatedAtLabel} />
                    <DetailStatRow label={t("landing.stat.enabledFeatures")} value={t("landing.stat.itemCount", { count: profile.extractedFeatureCount })} />
                    <DetailStatRow label={t("landing.stat.highRiskFingerprint")} value={t("landing.stat.itemCount", { count: profile.highRiskFeatureCount })} />
                    <DetailStatRow
                      label={t("landing.stat.currentPreset")}
                      value={profile.selectedPresetLabel || t("landing.stat.notLocked")}
                    />
                    <DetailStatRow
                      label={t("landing.stat.optionalPreset")}
                      value={profile.presetLabels.length > 0 ? profile.presetLabels.join(" / ") : t("landing.stat.none")}
                    />
                    <DetailStatRow label={t("landing.stat.boundTargets")} value={t("landing.stat.countUnit", { count: profile.bindingCount })} />
                    <DetailStatRow
                      label={t("landing.stat.recentNovel")}
                      value={profile.recentNovelTitle || t("landing.stat.noNovelBound")}
                    />
                    <DetailStatRow
                      label={t("landing.stat.applicableGenres")}
                      value={profile.applicableGenres.length > 0 ? profile.applicableGenres.join(" / ") : t("landing.stat.notFilled")}
                    />
                  </div>
                </DetailPanel>

                <DetailPanel
                  title={t("common.nextStep")}
                  description={t("landing.detailPanel.nextStepDesc")}
                >
                  <div className="space-y-2 text-sm leading-6 text-slate-700">
                    <div>{t("landing.nextStep.edit")}</div>
                    <div>{t("landing.nextStep.apply")}</div>
                    <div>{t("landing.nextStep.clean")}</div>
                  </div>
                </DetailPanel>
              </div>
            </div>
          </div>
        ) : null}
      </div>
    );
  };

  return (
    <div className="space-y-6">
      <Card className="overflow-hidden border-slate-200/80 bg-white/90 shadow-[0_18px_50px_rgba(15,23,42,0.06)]">
        <CardContent className="space-y-5 p-5 md:p-6">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="space-y-2">
              <Badge variant="outline" className="border-slate-200 bg-slate-50 text-slate-700">
                {t("landing.myAssets")}
              </Badge>
              <div className="space-y-2">
                <h1 className="text-3xl font-semibold tracking-tight text-slate-950">
                  {t("landing.heroTitle")}
                </h1>
                <p className="max-w-3xl text-sm leading-7 text-slate-600">
                  {t("landing.heroSubtitle")}
                </p>
              </div>
            </div>

            <Button type="button" onClick={onOpenCreate}>
              {t("common.createFormula")}
            </Button>
          </div>

          <div className="rounded-2xl border border-slate-200 bg-[linear-gradient(135deg,rgba(241,245,249,0.9),rgba(248,250,252,0.95))] px-4 py-3 text-sm leading-7 text-slate-700">
            {t("landing.bookLevelHint")}
          </div>

          {profileItems.length === 0 ? (
            <div className="rounded-3xl border border-dashed border-slate-300 bg-slate-50/80 p-6">
              <div className="text-lg font-semibold text-slate-950">{t("landing.emptyTitle")}</div>
              <div className="mt-2 text-sm leading-7 text-slate-600">
                {t("landing.emptyDesc")}
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button type="button" onClick={onOpenCreate}>
                  {t("landing.emptyCreateBtn")}
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6">
              {customProfiles.length > 0 ? (
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">{t("landing.customTitle")}</div>
                      <div className="text-xs leading-6 text-slate-500">
                        {t("landing.customDesc")}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                      {t("landing.suiteCount", { count: customProfiles.length })}
                    </Badge>
                  </div>
                  <div className="grid gap-3">
                    {customProfiles.map(renderProfileCard)}
                  </div>
                </section>
              ) : null}

              {starterProfiles.length > 0 ? (
                <section className="space-y-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <div className="text-sm font-semibold text-slate-950">{t("landing.starterTitle")}</div>
                      <div className="text-xs leading-6 text-slate-500">
                        {t("landing.starterDesc")}
                      </div>
                    </div>
                    <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                      {t("landing.suiteCount", { count: starterProfiles.length })}
                    </Badge>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    {starterProfiles.map(renderProfileCard)}
                  </div>
                </section>
              ) : null}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
