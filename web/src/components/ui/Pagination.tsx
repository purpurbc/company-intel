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
    <div className="flex gap-2">
      <button
        className="border rounded px-3 py-2"
        disabled={!canPrev || loading}
        onClick={onPrev}
      >
        Föregående
      </button>

      <button
        className="border rounded px-3 py-2"
        disabled={!canNext || loading}
        onClick={onNext}
      >
        Nästa
      </button>
    </div>
  );
}