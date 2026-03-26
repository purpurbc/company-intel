type DataRowProps = {
  label: string;
  value?: string | number | null;
};

export function DataRow({ label, value }: DataRowProps) {
  return (
    <>
      <dt>{label}</dt>
      <dd>{value ?? "-"}</dd>
    </>
  );
}