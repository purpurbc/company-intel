type RawPayloadProps = {
  data: unknown;
};

export function RawPayload({ data }: RawPayloadProps) {
  return (
    <details className="border rounded p-4">
      <summary className="cursor-pointer font-semibold">Raw payload</summary>
      <pre className="mt-2 text-xs overflow-auto">
        {JSON.stringify(data, null, 2)}
      </pre>
    </details>
  );
}