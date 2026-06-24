interface SparklineProps {
  values: number[];
  width?: number;
  height?: number;
  className?: string;
  /** When true, a rising line is treated as negative (e.g. growing debt). */
  invert?: boolean;
  strokeWidth?: number;
}

/** Tiny dependency-free trend line rendered as an inline SVG. */
export function Sparkline({
  values,
  width = 72,
  height = 24,
  className,
  invert = false,
  strokeWidth = 1.5,
}: SparklineProps) {
  if (!values || values.length < 2) return null;

  const min = Math.min(...values);
  const max = Math.max(...values);
  const range = max - min || 1;
  const stepX = width / (values.length - 1);
  const pad = strokeWidth;
  const usableH = height - pad * 2;

  const coords = values.map((v, i) => {
    const x = i * stepX;
    const y = pad + (1 - (v - min) / range) * usableH;
    return [x, y] as const;
  });

  const line = coords.map(([x, y]) => `${x.toFixed(1)},${y.toFixed(1)}`).join(" ");
  const area = `${coords[0][0].toFixed(1)},${height} ${line} ${coords[coords.length - 1][0].toFixed(1)},${height}`;

  const rising = values[values.length - 1] >= values[0];
  const positive = invert ? !rising : rising;
  const color = positive ? "#34d399" : "#fb7185";
  const gradientId = `spark-${color.slice(1)}-${Math.round(width)}x${Math.round(height)}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
      preserveAspectRatio="none"
      aria-hidden
    >
      <defs>
        <linearGradient id={gradientId} x1="0" y1="0" x2="0" y2="1">
          <stop offset="0%" stopColor={color} stopOpacity={0.25} />
          <stop offset="100%" stopColor={color} stopOpacity={0} />
        </linearGradient>
      </defs>
      <polygon points={area} fill={`url(#${gradientId})`} stroke="none" />
      <polyline
        points={line}
        fill="none"
        stroke={color}
        strokeWidth={strokeWidth}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}
