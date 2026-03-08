import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react";

interface TablePaginationProps {
  page: number;
  totalPages: number;
  totalItems: number;
  hasNext: boolean;
  hasPrev: boolean;
  nextPage: () => void;
  prevPage: () => void;
  goToPage: (p: number) => void;
  language: string;
}

export function TablePagination({ page, totalPages, totalItems, hasNext, hasPrev, nextPage, prevPage, goToPage, language }: TablePaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex items-center justify-between gap-2 pt-4 flex-wrap">
      <p className="text-sm text-muted-foreground">
        {language === "ar" ? `${totalItems} عنصر — صفحة ${page} من ${totalPages}` : `${totalItems} items — Page ${page} of ${totalPages}`}
      </p>
      <div className="flex items-center gap-1">
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(1)} disabled={!hasPrev}>
          {language === "ar" ? <ChevronsRight className="h-4 w-4" /> : <ChevronsLeft className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={prevPage} disabled={!hasPrev}>
          {language === "ar" ? <ChevronRight className="h-4 w-4" /> : <ChevronLeft className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={nextPage} disabled={!hasNext}>
          {language === "ar" ? <ChevronLeft className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
        </Button>
        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => goToPage(totalPages)} disabled={!hasNext}>
          {language === "ar" ? <ChevronsLeft className="h-4 w-4" /> : <ChevronsRight className="h-4 w-4" />}
        </Button>
      </div>
    </div>
  );
}
