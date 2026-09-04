/**
 * Gráficos simples em SVG puro (sem dependências), tema-aware via currentColor.
 * "gráficos simples e claros" — spec §8.
 */

export function DonutProgress({
  value,
  size = 132,
  label,
  sublabel,
}: {
  value: number;
  size?: number;
  label?: string;
  sublabel?: string;
}) {
  const v = Math.max(0, Math.min(100, value));
  const stroke = 12;
  const r = (size - stroke) / 2;
  const c = 2 * Math.PI * r;
  const offset = c * (1 - v / 100);

  return (
    <div
      className="relative shrink-0 text-primary"
      style={{ width: size, height: size }}
    >
      <svg width={size} height={size} className="-rotate-90">
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          className="stroke-white/[0.06]"
        />
        <circle
          cx={size / 2}
          cy={size / 2}
          r={r}
          fill="none"
          strokeWidth={stroke}
          stroke="currentColor"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
        />
      </svg>
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-xl font-semibold text-foreground">
          {label ?? `${v}%`}
        </span>
        {sublabel && (
          <span className="text-[11px] text-muted">{sublabel}</span>
        )}
      </div>
    </div>
  );
}

export function BarChart({
  data,
  height = 120,
  unit = "",
}: {
  data: { label: string; value: number }[];
  height?: number;
  unit?: string;
}) {
  const max = Math.max(1, ...data.map((d) => d.value));
  return (
    <div className="flex items-end gap-2" style={{ height: height + 22 }}>
      {data.map((d) => (
        <div key={d.label} className="flex flex-1 flex-col items-center gap-1">
          <span className="text-[10px] text-muted">
            {d.value > 0 ? `${d.value}${unit}` : ""}
          </span>
          <div
            className="w-full rounded-t bg-primary/70"
            style={{ height: Math.max(2, (d.value / max) * height) }}
            title={`${d.label}: ${d.value}${unit}`}
          />
          <span className="w-full truncate text-center text-[10px] text-muted">
            {d.label}
          </span>
        </div>
      ))}
    </div>
  );
}

export function Sparkline({
  values,
  width = 260,
  height = 56,
}: {
  values: number[];
  width?: number;
  height?: number;
}) {
  if (values.length < 2) {
    return (
      <div className="text-xs text-muted" style={{ height }}>
        Sem dados suficientes ainda.
      </div>
    );
  }
  const max = Math.max(1, ...values);
  const step = width / (values.length - 1);
  const pts = values.map((v, i) => [
    i * step,
    height - (v / max) * (height - 6) - 3,
  ]);
  const line = pts.map((p) => `${p[0].toFixed(1)},${p[1].toFixed(1)}`).join(" ");
  const area = `0,${height} ${line} ${width},${height}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className="w-full text-primary"
      preserveAspectRatio="none"
    >
      <polygon points={area} fill="currentColor" fillOpacity="0.12" />
      <polyline
        points={line}
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinejoin="round"
        strokeLinecap="round"
      />
      <circle
        cx={pts[pts.length - 1][0]}
        cy={pts[pts.length - 1][1]}
        r="3"
        fill="currentColor"
      />
    </svg>
  );
}
