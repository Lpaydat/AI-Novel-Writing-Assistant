import { BookOpen, Users } from "lucide-react";
import { useTranslation } from "react-i18next";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import type { BookAnalysisActiveView } from "../hooks/useBookAnalysisActiveView";

interface BookAnalysisWorkbenchViewTabsProps {
  activeView: BookAnalysisActiveView;
  onActiveViewChange: (view: BookAnalysisActiveView) => void;
  generatedCharacterCount: number;
  candidateCharacterCount: number;
}

export default function BookAnalysisWorkbenchViewTabs(props: BookAnalysisWorkbenchViewTabsProps) {
  const { activeView, onActiveViewChange, generatedCharacterCount, candidateCharacterCount } = props;
  const { t } = useTranslation("bookAnalysisComponents");

  return (
    <Tabs
      value={activeView}
      onValueChange={(value) => onActiveViewChange(value as BookAnalysisActiveView)}
    >
      <TabsList>
        <TabsTrigger value="sections" className="gap-1.5">
          <BookOpen className="h-3.5 w-3.5" />
          <span>{t("viewTabs.sections")}</span>
        </TabsTrigger>
        <TabsTrigger value="characters" className="gap-1.5">
          <Users className="h-3.5 w-3.5" />
          <span>{t("viewTabs.characters")}</span>
          {generatedCharacterCount > 0 ? (
            <Badge variant="secondary" className="ml-1 h-5 px-1.5 text-xs">
              {generatedCharacterCount}
            </Badge>
          ) : null}
          {candidateCharacterCount > 0 ? (
            <Badge variant="outline" className="ml-1 h-5 px-1.5 text-xs">
              {t("viewTabs.candidateCount", { count: candidateCharacterCount })}
            </Badge>
          ) : null}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
}
