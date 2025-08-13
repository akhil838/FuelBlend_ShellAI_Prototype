import React from 'react';

// Simple SVG Radar Chart
// props:
// - values: number[] in [0,1] for each axis (length N)
// - labels: string[] (optional, length N)
// - size: number (px)
// - rings: number (grid ring count)
export default function RadarPlot({ values = [], labels = [], size = 280, rings = 4, axesCount, hideData = false }) {
  const N = (labels && labels.length) || (values && values.length) || axesCount || 10;
  const cx = size / 2;
  const cy = size / 2;
  const radius = (size / 2) - 20; // padding

  if (!N) return null;

  const angleFor = (i) => (-Math.PI / 2) + (2 * Math.PI * i) / N; // start at top

  const pointAt = (i, r01) => {
    const a = angleFor(i);
    const r = Math.max(0, Math.min(1, r01)) * radius;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };

  const gridPolylines = Array.from({ length: rings }, (_, k) => {
    const ratio = (k + 1) / rings;
    const pts = Array.from({ length: N }, (_, i) => pointAt(i, ratio)).map(([x, y]) => `${x},${y}`).join(' ');
    return <polygon key={k} points={pts} fill="none" stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth={0.8} />;
  });

  const axes = Array.from({ length: N }, (_, i) => {
    const [x, y] = pointAt(i, 1);
    return <line key={i} x1={cx} y1={cy} x2={x} y2={y} stroke="currentColor" className="text-slate-300 dark:text-slate-600" strokeWidth={0.6} />;
  });

  const hasData = Array.isArray(values) && values.length === N && !hideData;
  const dataPts = hasData ? values.map((v, i) => pointAt(i, v)).map(([x, y]) => `${x},${y}`).join(' ') : '';

  return (
    <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`} role="img">
      <g>
        {/* Grid */}
        {gridPolylines}
        {axes}
        {/* Data area */}
        {hasData && (
          <polygon points={dataPts} fill="rgba(234,179,8,0.25)" stroke="#eab308" strokeWidth={2} />
        )}
        {/* Labels */}
        {labels && labels.length === N && labels.map((lbl, i) => {
          const [lx, ly] = pointAt(i, 1.08);
          return (
            <text key={i} x={lx} y={ly} textAnchor={lx < cx - 1 ? 'end' : lx > cx + 1 ? 'start' : 'middle'} dominantBaseline={ly < cy - 1 ? 'auto' : 'hanging'} className="fill-slate-600 dark:fill-slate-300 text-[10px]">
              {lbl}
            </text>
          );
        })}
      </g>
    </svg>
  );
}
