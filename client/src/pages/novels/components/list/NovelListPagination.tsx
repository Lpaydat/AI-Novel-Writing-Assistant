import { useTranslation } from "react-i18next";
import { Button } from "@/components/ui/button";

export function NovelListPagination(props: {
  page: number;
  totalPages: number;
  isFetching: boolean;
  onPageChange: (page: number) => void;
}) {
  const { t } = useTranslation("novelsList");
  if (props.totalPages <= 1) {
    return null;
  }
  return (
    <nav className="flex flex-wrap items-center justify-end gap-2" aria-label={t("pagination.ariaLabel")}>
      <Button
        type="button"
        variant="outline"
        disabled={props.page <= 1 || props.isFetching}
        onClick={() => props.onPageChange(Math.max(1, props.page - 1))}
      >
        {t("pagination.prev")}
      </Button>
      <div
        className="flex h-9 min-w-28 items-center justify-center px-3 text-sm text-muted-foreground"
        aria-live="polite"
      >
        {t("pageIndicator", { page: props.page, totalPages: props.totalPages })}
      </div>
      <Button
        type="button"
        variant="outline"
        disabled={props.page >= props.totalPages || props.isFetching}
        onClick={() => props.onPageChange(Math.min(props.totalPages, props.page + 1))}
      >
        {t("pagination.next")}
      </Button>
    </nav>
  );
}
