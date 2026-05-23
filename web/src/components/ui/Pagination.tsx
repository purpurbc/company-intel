import { Button } from "@/src/components/ui/Button";

type PaginationProps = {
  canPrev: boolean;
  canNext: boolean;
  loading?: boolean;
  onPrev: () => void;
  onNext: () => void;
};

export function Pagination({
  canPrev,
  canNext,
  loading = false,
  onPrev,
  onNext,
}: PaginationProps) {
  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button
        variant="secondary"
        disabled={!canPrev || loading}
        onClick={onPrev}
        type="button"
      >
        Föregående
      </Button>

      <Button
        variant="secondary"
        disabled={!canNext || loading}
        onClick={onNext}
        type="button"
      >
        Nästa
      </Button>
    </div>
  );
}
