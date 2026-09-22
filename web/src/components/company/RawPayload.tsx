type RawPayloadProps = {
  data: unknown;
};

export function RawPayload({ data }: RawPayloadProps) {
  return (
    <Surface as="details" className="text-app-text">
      <summary className="cursor-pointer text-sm font-semibold text-app-text">
        Rådata
      </summary>
      <pre className="mt-3 max-h-96 overflow-auto rounded-md bg-app-panel-soft p-3 text-xs text-app-text-muted">
        {JSON.stringify(data, null, 2)}
      </pre>
    </Surface>
  );
}
import { Surface } from "@/src/components/ui/Surface";
