import React, { useEffect, useMemo, useState } from 'react';
import {
  GitBranch, Network, Clock, Loader2, AlertTriangle, ChevronRight, Link2,
} from 'lucide-react';
import { api } from '../api.js';

/**
 * Custom lightweight node-graph renderer (SVG, no external graph lib).
 * Nodes are positioned on concentric rings by type for a stable "evidence board" look.
 */

const TYPE_RING = { case: 0, location: 1, person: 2, phone: 3, item: 3 };
const TYPE_COLOR = {
  case:     { fill: '#1d4ed8', text: '#ffffff', border: '#1e3a8a' },
  location: { fill: '#0f766e', text: '#ffffff', border: '#0b5e58' },
  person:   { fill: '#dc2626', text: '#ffffff', border: '#7f1d1d' },
  phone:    { fill: '#f59e0b', text: '#0b1220', border: '#b45309' },
  item:     { fill: '#7c3aed', text: '#ffffff', border: '#5b21b6' },
};
const TYPE_LABEL = { case: 'CASE', location: 'LOC', person: 'PERSON', phone: 'PHONE', item: 'ITEM' };

export default function GraphView() {
  const [cases, setCases] = useState([]);
  const [selected, setSelected] = useState([]);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => { api.cases().then((d) => {
    setCases(d.cases);
    setSelected(d.cases.map(c => c.case_id));
  }); }, []);

  const build = async () => {
    setBusy(true); setErr(null);
    try { const r = await api.buildGraph(selected); setOut(r); }
    catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  useEffect(() => { if (selected.length > 0) build(); /* eslint-disable-next-line */ }, [selected.length === 0]);

  return (
    <div className="space-y-5">
      <section className="file-card p-5">
        <div className="flex items-center gap-2">
          <Network className="w-5 h-5 text-siren-green" />
          <h2 className="font-disp font-bold text-lg">Cross-case Intelligence</h2>
        </div>
        <p className="mt-1 text-sm text-ink-500">
          Select FIRs to merge into a single investigation board. The engine builds a unified timeline
          plus a node graph (cases, persons, phones, locations, items) and asks Llama-4 to infer cross-case relationships.
        </p>

        <div className="mt-3 flex flex-wrap gap-2">
          {cases.map((c) => {
            const on = selected.includes(c.case_id);
            return (
              <button
                key={c.case_id}
                onClick={() => setSelected(s => on ? s.filter(x => x !== c.case_id) : [...s, c.case_id])}
                className={[
                  'px-3 py-2 rounded-lg border text-left text-sm transition',
                  on ? 'bg-cop-700 text-white border-cop-800' : 'bg-white text-ink-900 border-slate-200 hover:bg-cop-50',
                ].join(' ')}
              >
                <div className="font-mono text-[11px] opacity-80">{c.case_id}</div>
                <div className="font-semibold leading-snug">{c.summary.slice(0, 70)}{c.summary.length>70?'…':''}</div>
              </button>
            );
          })}
        </div>

        <div className="mt-3 flex items-center gap-2">
          <button onClick={build} disabled={busy || selected.length === 0} className="btn-primary">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <GitBranch className="w-4 h-4" />}
            {busy ? 'Building…' : 'Build graph & timeline'}
          </button>
          {err && <span className="text-sm text-siren-red flex items-center gap-1"><AlertTriangle className="w-4 h-4" />{err}</span>}
        </div>
      </section>

      {out && (
        <>
          <Timeline data={out.timeline} />
          <NodeGraph graph={out.graph} inferred={out.inferred_relationships} />
        </>
      )}
    </div>
  );
}

/* ====================== TIMELINE ====================== */
function Timeline({ data }) {
  if (!data?.length) return null;
  return (
    <section className="file-card p-5">
      <div className="flex items-center gap-2 mb-2">
        <Clock className="w-5 h-5 text-cop-800" />
        <h3 className="font-disp font-bold text-lg">Unified Timeline</h3>
        <span className="chip-slate ml-2">{data.length} events</span>
      </div>
      <div className="ruled-paper rounded-md p-5 border border-slate-200">
        <ol className="relative">
          <span className="absolute left-[110px] top-0 bottom-0 w-px bg-cop-200" />
          {data.map((e, i) => (
            <li key={i} className="relative pl-[140px] py-2.5">
              <span className="absolute left-[106px] top-3.5 w-2.5 h-2.5 rounded-full bg-cop-700 ring-4 ring-white" />
              <span className="absolute left-0 top-3 w-[96px] text-right font-mono text-[12px] text-ink-500">
                {new Date(e.ts).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })}
              </span>
              <div className="text-[15px] text-ink-900 leading-[20px]">{e.label}</div>
              <div className="text-[11px] text-ink-500">
                <span className="font-mono">{e.case_id}</span> · {e.station}
              </div>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

/* ====================== NODE GRAPH ====================== */
function NodeGraph({ graph, inferred }) {
  const layout = useMemo(() => layoutRadial(graph.nodes, graph.edges), [graph]);

  return (
    <section className="file-card p-5">
      <div className="flex items-center gap-2 mb-3">
        <Network className="w-5 h-5 text-siren-green" />
        <h3 className="font-disp font-bold text-lg">Relationship Graph</h3>
        <span className="chip-slate ml-2">{graph.nodes.length} nodes · {graph.edges.length} edges</span>
        <span className="chip-green ml-1">+ {inferred.length} inferred</span>
      </div>

      <div className="grid lg:grid-cols-[1.4fr_1fr] gap-4">
        <div className="pinboard rounded-lg border border-slate-200 overflow-hidden">
          <svg viewBox="0 0 720 540" className="w-full h-[540px]">
            <defs>
              <marker id="arrow" viewBox="0 -5 10 10" refX="10" refY="0" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,-5L10,0L0,5" fill="#1e40af" />
              </marker>
              <marker id="arrowInfer" viewBox="0 -5 10 10" refX="10" refY="0" markerWidth="6" markerHeight="6" orient="auto">
                <path d="M0,-5L10,0L0,5" fill="#16a34a" />
              </marker>
            </defs>

            {/* edges */}
            {graph.edges.map((e) => {
              const a = layout.pos.get(e.source);
              const b = layout.pos.get(e.target);
              if (!a || !b) return null;
              const inferredMatch = inferred.some(r => (r.from === e.source || layout.pos.has(r.from) && layout.labelToId.get(r.from) === e.source) && (r.to === e.target || layout.labelToId.get(r.to) === e.target));
              const isInfer = e.label && e.label.length > 0 && e.type !== 'suspect_in' && e.type !== 'victim_of' && e.type !== 'investigates' && e.type !== 'registered_at' && e.type !== 'mentions_phone' && e.type !== 'stolen_item';
              return (
                <g key={e.id}>
                  <line x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke={isInfer ? '#16a34a' : '#1e40af'}
                    strokeOpacity={isInfer ? 0.7 : 0.35}
                    strokeDasharray={isInfer ? '4 3' : '0'}
                    strokeWidth={isInfer ? 1.4 : 1}
                    markerEnd={`url(#${isInfer ? 'arrowInfer' : 'arrow'})`} />
                </g>
              );
            })}

            {/* nodes */}
            {graph.nodes.map((n) => {
              const p = layout.pos.get(n.id);
              if (!p) return null;
              const c = TYPE_COLOR[n.type] || TYPE_COLOR.case;
              const w = Math.max(70, Math.min(180, n.label.length * 7 + 24));
              return (
                <g key={n.id} transform={`translate(${p.x - w/2}, ${p.y - 16})`}>
                  <rect width={w} height={32} rx={6} fill={c.fill} stroke={c.border} strokeWidth={1} />
                  <text x={10} y={13} fill={c.text} fontSize={9} fontWeight={700} letterSpacing={1}>{TYPE_LABEL[n.type]||'NODE'}</text>
                  <text x={10} y={26} fill={c.text} fontSize={11} fontWeight={600}>
                    {n.label.length > (w-20)/6.2 ? n.label.slice(0, Math.floor((w-20)/6.2)-1)+'…' : n.label}
                  </text>
                </g>
              );
            })}
          </svg>
        </div>

        <div className="space-y-3">
          <div className="rounded-lg border border-slate-200 bg-white p-3">
            <div className="text-[12px] font-semibold uppercase tracking-wider text-ink-700 mb-2">Legend</div>
            <div className="grid grid-cols-2 gap-2 text-[12px]">
              {Object.entries(TYPE_COLOR).map(([k,c])=>(
                <div key={k} className="flex items-center gap-2">
                  <span className="w-3.5 h-3.5 rounded-sm" style={{ background: c.fill, border: `1px solid ${c.border}` }} />
                  <span className="text-ink-700">{k}</span>
                </div>
              ))}
              <div className="flex items-center gap-2 col-span-2">
                <span className="w-6 h-0.5 bg-cop-800" /> structural edge
                <span className="w-6 h-0.5 ml-3" style={{ background:'#16a34a', borderTop:'1.5px dashed #16a34a' }} /> inferred (AI)
              </div>
            </div>
          </div>

          {inferred?.length > 0 && (
            <div className="rounded-lg border border-green-200 bg-green-50/50 p-3">
              <div className="text-[12px] font-semibold uppercase tracking-wider text-green-800 mb-2 flex items-center gap-2">
                <Link2 className="w-3.5 h-3.5" /> Inferred relationships
              </div>
              <ul className="space-y-2">
                {inferred.map((r,i)=>(
                  <li key={i} className="text-sm flex items-start gap-2">
                    <ChevronRight className="w-4 h-4 text-siren-green mt-0.5" />
                    <div>
                      <div className="font-semibold text-ink-900">{r.from} <span className="text-ink-500">↔</span> {r.to}</div>
                      <div className="text-ink-500 text-[12px]"><span className="chip-green mr-1">{r.type}</span>{r.evidence}</div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}

function layoutRadial(nodes, edges) {
  // group by type
  const buckets = {};
  for (const n of nodes) {
    (buckets[n.type] = buckets[n.type] || []).push(n);
  }
  const pos = new Map();
  const labelToId = new Map();
  const W = 720, H = 540;
  const cx = W / 2, cy = H / 2;
  const order = ['case','location','person','phone','item'];
  let ringIdx = 0;
  for (const t of order) {
    const arr = buckets[t] || [];
    if (!arr.length) continue;
    const r = 60 + ringIdx * 95;
    const n = arr.length;
    arr.forEach((node, i) => {
      const angle = (i / n) * Math.PI * 2 - Math.PI/2;
      const x = cx + Math.cos(angle) * r;
      const y = cy + Math.sin(angle) * r;
      pos.set(node.id, { x, y });
      labelToId.set(node.label, node.id);
    });
    ringIdx++;
  }
  return { pos, labelToId };
}
