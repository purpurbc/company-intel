type MaskedIconProps = {
  src: string;
  className?: string;
};

export function MaskedIcon({ src, className = "h-4 w-4" }: MaskedIconProps) {
  return (
    <span
      aria-hidden="true"
      className={["inline-block shrink-0 bg-current", className].join(" ")}
      style={{
        mask: `url('${src}') center / contain no-repeat`,
        WebkitMask: `url('${src}') center / contain no-repeat`,
      }}
    />
  );
}
