type Point = { label: string; value: number };

type LineChartProps = {
  points: Point[];
  /** Formats a value for the axis, tooltips, and the sr-only table. */
  format: (value: number) => string;
  caption: string;
  valueLabel: string;
};

const W = 600;
const H = 180;
const PAD = { top: 12, right: 12, bottom: 24, left: 12 };

/**
 * Server-rendered SVG line chart. No client JS; hover detail via <title>,
 * screen readers get a table.
 */
export function LineChart({ points, format, caption, valueLabel }: LineChartProps) {
  if (points.length === 0) return null;

  const values = points.map((p) => p.value);
  const min = Math.min(...values);
  const max = Math.max(...values);
  const span = max - min || Math.max(1, max * 0.1);
  const lo = min - span * 0.15;
  const hi = max + span * 0.15;

  const x = (i: number) =>
    points.length === 1 ? W / 2 : PAD.left + (i / (points.length - 1)) * (W - PAD.left - PAD.right);
  const y = (v: number) => PAD.top + (1 - (v - lo) / (hi - lo)) * (H - PAD.top - PAD.bottom);

  const path = points.map((p, i) => `${i === 0 ? "M" : "L"}${x(i).toFixed(1)},${y(p.value).toFixed(1)}`).join(" ");
  const area = `${path} L${x(points.length - 1).toFixed(1)},${H - PAD.bottom} L${x(0).toFixed(1)},${H - PAD.bottom} Z`;
  const maxIndex = values.indexOf(max);

  return (
    <figure>
      <figcaption className="sr-only">{caption}</figcaption>
      <svg viewBox={`0 0 ${W} ${H}`} className="h-auto w-full" aria-hidden="true">
        <defs>
          <linearGradient id="lc-fill" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="var(--color-accent)" stopOpacity="0.18" />
            <stop offset="100%" stopColor="var(--color-accent)" stopOpacity="0" />
          </linearGradient>
        </defs>
        <line x1={PAD.left} x2={W - PAD.right} y1={H - PAD.bottom} y2={H - PAD.bottom} stroke="var(--color-border)" />
        {points.length > 1 && <path d={area} fill="url(#lc-fill)" />}
        <path d={path} fill="none" stroke="var(--color-accent)" strokeWidth="2" strokeLinejoin="round" strokeLinecap="round" />
        {points.map((p, i) => (
          <circle
            key={i}
            cx={x(i)}
            cy={y(p.value)}
            r={i === points.length - 1 || i === maxIndex ? 4 : 2.5}
            fill={i === maxIndex ? "var(--color-accent)" : "var(--color-surface)"}
            stroke="var(--color-accent)"
            strokeWidth="1.5"
          >
            <title>{`${p.label} · ${format(p.value)}`}</title>
          </circle>
        ))}
        <text x={PAD.left} y={H - 6} fill="var(--color-faint)" fontSize="11">
          {points[0].label}
        </text>
        {points.length > 1 && (
          <text x={W - PAD.right} y={H - 6} fill="var(--color-faint)" fontSize="11" textAnchor="end">
            {points.at(-1)!.label}
          </text>
        )}
      </svg>
      <table className="sr-only">
        <thead>
          <tr>
            <th scope="col">Date</th>
            <th scope="col">{valueLabel}</th>
          </tr>
        </thead>
        <tbody>
          {points.map((p, i) => (
            <tr key={i}>
              <td>{p.label}</td>
              <td>{format(p.value)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}
