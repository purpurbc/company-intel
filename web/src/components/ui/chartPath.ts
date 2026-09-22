export type ChartPoint = { x: number; y: number };

/** Monotone cubic interpolation keeps each segment within its observed values. */
function segmentPath(points: ChartPoint[], smooth: boolean) {
  if (!points.length) return "";
  const slopes = points.slice(1).map((point, index) =>
    (point.y - points[index].y) / (point.x - points[index].x),
  );
  const tangents = points.map((_, index) => {
    if (index === 0) return slopes[0] ?? 0;
    if (index === points.length - 1) return slopes[index - 1];
    const before = slopes[index - 1];
    const after = slopes[index];
    return before * after <= 0 ? 0 : 2 * before * after / (before + after);
  });
  return points.map((point, index) => {
    if (index === 0) return `M${point.x},${point.y}`;
    if (!smooth) return `L${point.x},${point.y}`;
    const previous = points[index - 1];
    const third = (point.x - previous.x) / 3;
    return `C${previous.x + third},${previous.y + third * tangents[index - 1]} ${point.x - third},${point.y - third * tangents[index]} ${point.x},${point.y}`;
  }).join(" ");
}

/** Missing observations break the curve instead of implying an observation. */
export function chartPath(points: (ChartPoint | null)[], smooth: boolean) {
  const segments: ChartPoint[][] = [[]];
  for (const point of points) {
    if (point) segments[segments.length - 1].push(point);
    else if (segments[segments.length - 1].length) segments.push([]);
  }
  return segments.map((segment) => segmentPath(segment, smooth)).join(" ");
}
