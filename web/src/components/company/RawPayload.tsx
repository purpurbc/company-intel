type RawPayloadProps = {
  data: unknown;
};

export function RawPayload({ data }: RawPayloadProps) {
  return (
    <details className="rounded-lg border border-slate-800 bg-slate-900 p-5 text-slate-200">
      <summary className="cursor-pointer text-sm font-semibold text-slate-100">
        Raw payload
      </summary>
      <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-slate-950/70 p-4 text-xs text-slate-300">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}
