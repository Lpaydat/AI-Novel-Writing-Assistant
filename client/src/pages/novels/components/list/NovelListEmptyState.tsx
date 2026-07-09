import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";
import {
  DIRECTOR_CREATE_LINK,
  MANUAL_CREATE_LINK,
} from "./novelListViewModel";

export function NovelListEmptyState(props: {
  hasAnyNovel: boolean;
}) {
  const { t } = useTranslation("novelsList");
  return (
    <section className="py-12 text-center">
      <h2 className="text-xl font-semibold tracking-normal">
        {props.hasAnyNovel ? t("emptyState.noMatch") : t("emptyState.noNovels")}
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm leading-6 text-muted-foreground">
        {props.hasAnyNovel
          ? t("emptyState.noMatchHint")
          : t("emptyState.firstTimeHint")}
      </p>
      <div className="mt-5 flex flex-wrap justify-center gap-2">
        <Button asChild>
          <Link to={DIRECTOR_CREATE_LINK}>{t("cta.director")}</Link>
        </Button>
        <Button asChild variant="outline">
          <Link to={MANUAL_CREATE_LINK}>{t("cta.manual")}</Link>
        </Button>
      </div>
    </section>
  );
}
