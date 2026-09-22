type SearchExamplesProps = {
  examples: readonly string[];
  onSelect: (example: string) => void;
  label?: string;
  className?: string;
};

/** Text-only search suggestions that fill a controlled search field. */
export function SearchExamples({
  examples,
  onSelect,
  label = "Exempel:",
  className = "",
}: SearchExamplesProps) {
  if (examples.length === 0) return null;

  return (
    <div
      className={[
        "flex flex-wrap items-baseline justify-center gap-x-3 gap-y-1 text-xs",
        className,
      ].join(" ")}
      aria-label="Exempelsökningar"
    >
      <span className="text-app-text-subtle">{label}</span>
      {examples.map((example) => (
        <button
          key={example}
          type="button"
          onClick={() => onSelect(example)}
          className="text-app-text-muted underline decoration-app-border-strong underline-offset-2 transition-colors hover:text-app-text focus-visible:rounded-sm focus-visible:outline focus-visible:outline-2 focus-visible:outline-app-focus"
        >
          {example}
        </button>
      ))}
    </div>
  );
}
