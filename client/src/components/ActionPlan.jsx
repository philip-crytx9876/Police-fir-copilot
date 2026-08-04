import React, { useEffect, useState } from 'react';
import {
  ClipboardList, Sparkles, Loader2, AlertTriangle, ScrollText, Users,
  Camera, FileWarning, ShieldCheck, ArrowRight, BookOpen, Gavel, Stamp,
} from 'lucide-react';
import { api } from '../api.js';

export default function ActionPlan({ context }) {
  const [cases, setCases] = useState([]);
  const [caseId, setCaseId] = useState('');
  const [extra, setExtra] = useState('');
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState(null);

  useEffect(() => { api.actionCases().then((d) => setCases(d.cases)); }, []);

  const generate = async () => {
    setBusy(true); setErr(null);
    try {
      const payload = {
        case_id: caseId || null,
        summary: extra,
        entities: context?.kind === 'fir' ? context.entities : null,
      };
      const r = await api.actionPlan(payload);
      setOut(r);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <section className="file-card p-5">
        <div className="flex items-center gap-2">
          <ClipboardList className="w-5 h-5 text-cop-800" />
          <h2 className="font-disp font-bold text-lg">Investigative Action Plan</h2>
        </div>
        <p className="mt-1 text-sm text-ink-500">
          Pick an existing FIR (or paste extra notes). The plan will combine the FIR's narrative with any
          entities you already extracted on the <b>Parser</b> tab.
        </p>

        <div className="mt-3 grid md:grid-cols-[1fr_2fr_auto] gap-2">
          <select className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white text-sm" value={caseId} onChange={(e)=>setCaseId(e.target.value)}>
            <option value="">— Pick a case (optional) —</option>
            {cases.map(c => <option key={c.case_id} value={c.case_id}>{c.case_id} — {c.station}</option>)}
          </select>
          <input
            value={extra}
            onChange={(e)=>setExtra(e.target.value)}
            placeholder="Optional extra notes for the IO (e.g. 'witness lives in B-block, go after 6 PM')"
            className="px-3 py-2.5 rounded-lg border border-slate-200 bg-white outline-none focus:border-cop-500 text-sm"
          />
          <button onClick={generate} disabled={busy || (!caseId && !extra && !context)} className="btn-primary">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
            {busy ? 'Drafting…' : 'Draft plan'}
          </button>
        </div>

        {context?.kind === 'fir' && (
          <div className="mt-3 chip-blue"><FileWarning className="w-3 h-3" /> Using entities from your last Parser run</div>
        )}
        {err && <div className="mt-3 text-sm text-siren-red flex items-center gap-1"><AlertTriangle className="w-4 h-4" />{err}</div>}
      </section>

      {out && <PlanView plan={out.plan} />}
    </div>
  );
}

function PlanView({ plan }) {
  const p = plan || {};
  return (
    <div className="grid lg:grid-cols-[1fr_1.4fr] gap-5">
      {/* LEFT — case header + facts */}
      <section className="space-y-4">
        <div className="file-card p-5 relative">
          <div className="absolute top-3 right-3 stamp text-siren-red">FOR IO</div>
          <div className="eyebrow">Case Header</div>
          <h3 className="font-disp font-bold text-xl mt-1">{p.case_header?.fir_number || 'Untitled draft'}</h3>
          <div className="text-sm text-ink-500">{p.case_header?.police_station || '—'}</div>
          <div className="mt-3 grid sm:grid-cols-2 gap-2 text-sm">
            <KV k="Investigating Officer" v={p.case_header?.investigating_officer} />
            <KV k="Date Registered"      v={p.case_header?.date_registered} />
            <KV k="Sections"             v={(p.case_header?.sections || []).join(', ')} />
            <KV k="Confidence"           v={typeof p.confidence === 'number' ? `${(p.confidence*100).toFixed(0)}%` : null} />
          </div>
        </div>

        {p.brief_facts && (
          <div className="file-card p-5">
            <div className="eyebrow flex items-center gap-2"><ScrollText className="w-3.5 h-3.5" /> Brief Facts</div>
            <p className="mt-2 text-sm text-ink-700 leading-relaxed">{p.brief_facts}</p>
          </div>
        )}

        {p.elements_to_prove?.length > 0 && (
          <div className="file-card p-5">
            <div className="eyebrow flex items-center gap-2"><Gavel className="w-3.5 h-3.5" /> Elements to Prove</div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {p.elements_to_prove.map((x,i)=>(
                <li key={i} className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cop-700"/>{x}</li>
              ))}
            </ul>
          </div>
        )}

        {p.charge_sheet_outline?.length > 0 && (
          <div className="file-card p-5">
            <div className="eyebrow flex items-center gap-2"><BookOpen className="w-3.5 h-3.5" /> Charge-sheet Outline</div>
            <ol className="mt-2 space-y-1.5 text-sm list-decimal pl-5 text-ink-700">
              {p.charge_sheet_outline.map((x,i)=><li key={i}>{x}</li>)}
            </ol>
          </div>
        )}
      </section>

      {/* RIGHT — witnesses / evidence / next steps / risk */}
      <section className="space-y-4">
        <div className="file-card p-5">
          <div className="eyebrow flex items-center gap-2"><Users className="w-3.5 h-3.5" /> Witnesses to Examine</div>
          <div className="mt-2 space-y-2">
            {(p.witnesses_to_examine || []).map((w, i) => (
              <div key={i} className="rounded-md border border-slate-200 bg-white p-2.5 text-sm">
                <div className="flex items-center gap-2">
                  <span className={['chip',
                    w.type === 'eyewitness' ? 'chip-red' :
                    w.type === 'expert' ? 'chip-blue' :
                    w.type === 'informant' ? 'chip-amber' : 'chip-slate'
                  ].join(' ')}>{w.type}</span>
                  <span className="font-semibold text-ink-900">{w.name}</span>
                </div>
                {w.purpose && <div className="mt-1 text-ink-500 text-[12px]">{w.purpose}</div>}
              </div>
            ))}
          </div>
        </div>

        <div className="file-card p-5">
          <div className="eyebrow flex items-center gap-2"><Camera className="w-3.5 h-3.5" /> Evidence to Collect</div>
          <div className="mt-2 overflow-hidden rounded-md border border-slate-200">
            <table className="w-full text-sm">
              <thead className="bg-slate-50 text-[11px] uppercase tracking-wider text-ink-500">
                <tr>
                  <th className="text-left px-2 py-1.5">Item</th>
                  <th className="text-left px-2 py-1.5">Type</th>
                  <th className="text-left px-2 py-1.5">Source</th>
                  <th className="text-left px-2 py-1.5">Pri</th>
                </tr>
              </thead>
              <tbody>
                {(p.evidence_to_collect || []).map((e, i) => (
                  <tr key={i} className="border-t border-slate-200">
                    <td className="px-2 py-1.5">{e.item}</td>
                    <td className="px-2 py-1.5"><span className="chip-slate">{e.type}</span></td>
                    <td className="px-2 py-1.5 text-ink-500">{e.source_location || '—'}</td>
                    <td className="px-2 py-1.5">
                      <span className={['chip',
                        e.priority === 'high' ? 'chip-red' :
                        e.priority === 'medium' ? 'chip-amber' : 'chip-slate'
                      ].join(' ')}>{e.priority}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="file-card p-5">
          <div className="eyebrow flex items-center gap-2"><ArrowRight className="w-3.5 h-3.5" /> Next Steps</div>
          <ol className="mt-2 space-y-2">
            {(p.next_steps || []).map((s, i) => (
              <li key={i} className="rounded-md border border-cop-100 bg-cop-50/60 p-3">
                <div className="text-sm text-ink-900 font-semibold">{s.step}</div>
                <div className="mt-1 flex flex-wrap items-center gap-1.5 text-[11px]">
                  <span className="chip-blue">owner: {s.owner_role || 'IO'}</span>
                  <span className="chip-amber">⏱ {s.timeline || '—'}</span>
                  {s.legal_reference && <span className="chip-green">§ {s.legal_reference}</span>}
                </div>
              </li>
            ))}
          </ol>
        </div>

        {p.risk_flags?.length > 0 && (
          <div className="file-card p-5 border-red-200">
            <div className="eyebrow flex items-center gap-2 text-siren-red"><ShieldCheck className="w-3.5 h-3.5" /> Risk Flags</div>
            <ul className="mt-2 space-y-1.5 text-sm">
              {p.risk_flags.map((r,i)=>(
                <li key={i} className="flex items-start gap-2">
                  <AlertTriangle className="w-4 h-4 text-siren-red mt-0.5" />{r}
                </li>
              ))}
            </ul>
          </div>
        )}

        <div className="text-[11px] text-ink-500 flex items-center gap-1">
          <Stamp className="w-3 h-3" /> Drafted by Groq — review with your supervisory officer before action.
        </div>
      </section>
    </div>
  );
}

function KV({ k, v }) { return v != null && v !== '' ? <div><span className="text-ink-500">{k}: </span><span className="font-medium">{v}</span></div> : null; }
