import { PredictionsPanel } from "@/components/admin/predictions-panel";

export default function AdminPredictionsPage() {
  return (
    <>
      <h2 className="font-display text-2xl font-bold">Prediction history</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Every custom prediction generated platform-wide — filter by user or
        date range.
      </p>
      <div className="mt-6">
        <PredictionsPanel />
      </div>
    </>
  );
}
