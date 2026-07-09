import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";

interface BookAnalysisDiagnosisTipBannerProps {
  documentTitle: string;
}

export default function BookAnalysisDiagnosisTipBanner({ documentTitle }: BookAnalysisDiagnosisTipBannerProps) {
  const { t } = useTranslation("bookAnalysisComponents");
  return (
    <div className="rounded-md border border-primary/20 bg-primary/5 p-3 text-sm">
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{t("diagnosisTip.badge")}</Badge>
        <span className="font-medium">{documentTitle}</span>
      </div>
      <div className="mt-2 leading-6 text-muted-foreground">
        {t("diagnosisTip.description")}
      </div>
    </div>
  );
}
