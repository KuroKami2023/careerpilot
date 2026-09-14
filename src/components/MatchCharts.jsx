import { useMemo } from 'react';
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  Radar,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Cell,
} from 'recharts';

const BAR_COLORS = ['#1a2e22', '#b48327', '#527856', '#b4552d', '#8a8571'];

export function MatchRadar({ breakdown }) {
  const data = useMemo(
    () =>
      ['technical', 'experience', 'projects', 'education', 'keywords'].map((k) => ({
        axis: k[0].toUpperCase() + k.slice(1),
        score: breakdown?.[k] ?? 0,
      })),
    [breakdown],
  );
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <RadarChart data={data} outerRadius="75%">
          <PolarGrid stroke="#ddd2ba" />
          <PolarAngleAxis dataKey="axis" tick={{ fontSize: 12, fill: '#5c6f62', fontFamily: 'Georgia, serif' }} />
          <Radar dataKey="score" stroke="#1a2e22" fill="#1a2e22" fillOpacity={0.22} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function MatchBars({ breakdown, weights }) {
  const data = useMemo(
    () =>
      ['technical', 'experience', 'projects', 'education', 'keywords'].map((k) => ({
        name: `${k[0].toUpperCase() + k.slice(1)} (${weights?.[k] ?? 0}%)`,
        score: breakdown?.[k] ?? 0,
      })),
    [breakdown, weights],
  );
  return (
    <div className="h-64 w-full">
      <ResponsiveContainer>
        <BarChart data={data} layout="vertical" margin={{ left: 90, right: 20 }}>
          <XAxis type="number" domain={[0, 100]} tick={{ fontSize: 12, fill: '#78716c' }} axisLine={{ stroke: '#ddd2ba' }} tickLine={{ stroke: '#ddd2ba' }} />
          <YAxis type="category" dataKey="name" width={130} tick={{ fontSize: 12, fill: '#44403c' }} axisLine={{ stroke: '#ddd2ba' }} tickLine={false} />
          <Tooltip
            formatter={(v) => [`${v}/100`, 'Score']}
            contentStyle={{ background: '#fffdf9', border: '1px solid #e7dfcf', borderRadius: 10, fontSize: 12 }}
          />
          <Bar dataKey="score" radius={[0, 6, 6, 0]}>
            {data.map((_, i) => (
              <Cell key={i} fill={BAR_COLORS[i % BAR_COLORS.length]} />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

export function ScoreDonut({ overall }) {
  const pct = Math.min(100, Math.max(0, overall ?? 0));
  const color = pct >= 75 ? '#2f5d3f' : pct >= 50 ? '#8a6d1f' : pct >= 30 ? '#b4552d' : '#a33b3b';
  const r = 54;
  const circ = 2 * Math.PI * r;
  return (
    <div className="flex items-center gap-4">
      <svg width="140" height="140" viewBox="0 0 140 140" role="img" aria-label={`Overall match ${pct} out of 100`}>
        <circle cx="70" cy="70" r={r} fill="none" stroke="#e9e1cf" strokeWidth="14" />
        <circle
          cx="70"
          cy="70"
          r={r}
          fill="none"
          stroke={color}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={circ}
          strokeDashoffset={circ - (pct / 100) * circ}
          transform="rotate(-90 70 70)"
        />
        <text x="70" y="66" textAnchor="middle" fontSize="28" fontWeight="800" fill="#1a2e22" style={{ fontVariantNumeric: 'tabular-nums', fontFamily: "Georgia, 'Times New Roman', serif" }}>
          {pct}
        </text>
        <text x="70" y="86" textAnchor="middle" fontSize="12" fill="#78716c" fontStyle="italic" fontFamily="Georgia, serif">
          / 100 match
        </text>
      </svg>
      <p className="max-w-xs text-xs leading-relaxed text-stone-500">
        Transparent overlap score across 5 fixed dimensions. This is <strong>not</strong> a probability of getting
        hired.
      </p>
    </div>
  );
}
