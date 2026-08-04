import React, { useState } from 'react';
import {
  Users, Search, Loader2, Sparkles, AlertTriangle, Ruler, Eye, MapPin,
  Phone, User, ShieldAlert, BadgeCheck, BadgeX, Network, ChevronDown,
} from 'lucide-react';
import { api } from '../api.js';

const SUGGESTIONS = [
  { label: 'Tall man, 5\'10", skull tattoo on right wrist, operating near Cubao', q: '5\'10" skull tattoo on right wrist operating near Cubao necklace snatching' },
  { label: 'Stocky, limping left leg, Bacoor morning necklace snatching', q: '5\'5" stocky man limping left leg Bacoor morning necklace snatching' },
  { label: 'Lanky suspect, dragon tattoo, Cubao bag/laptop snatching', q: 'lanky man dragon tattoo left forearm Cubao bag laptop snatching motorcycle' },
];

export default function OffenderMatcher() {
  const [q, setQ] = useState('');
  const [min, setMin] = useState(20);
  const [busy, setBusy] = useState(false);
  const [out, setOut] = useState(null);
  const [err, setErr] = useState(null);
  const [open, setOpen] = useState(null);

  const run = async (query) => {
    const text = (query ?? q).trim();
    if (!text) return;
    setBusy(true); setErr(null);
    try {
      const r = await api.match(text, null, Number(min));
      setOut(r);
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  return (
    <div className="space-y-5">
      <section className="file-card p-5">
        <div className="flex items-center gap-2">
          <Users className="w-5 h-5 text-siren-red" />
          <h2 className="font-disp font-bold text-lg">Repeat Offender Matcher</h2>
        </div>
        <p className="mt-1 text-sm text-ink-500">
          Type a natural-language description — physical traits, MO, area. The engine scores the
          criminal-history DB and asks Llama-4 to give an investigative rationale per match.
        </p>

        <div className="mt-3 flex flex-col md:flex-row gap-2">
          <div className="flex-1 relative">
            <Search className="w-4 h-4 text-ink-500 absolute left-3 top-1/2 -translate-y-1/2" />
            <input
              value={q}
              onChange={(e) => setQ(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && run()}
              placeholder="e.g. Show active suspects matching 5'10, tattoo on right wrist, operating near Cubao"
              className="w-full pl-9 pr-3 py-3 rounded-lg border border-slate-200 bg-white outline-none focus:border-cop-500"
            />
          </div>
          <div className="flex items-center gap-2">
            <label className="text-[12px] text-ink-500">min score</label>
            <input type="number" min="0" max="100" value={min} onChange={(e)=>setMin(e.target.value)} className="w-20 px-2 py-2 border border-slate-200 rounded-lg bg-white text-sm" />
            <button onClick={() => run()} disabled={busy || !q.trim()} className="btn-primary">
              {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />} Match
            </button>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-ink-500 mr-1">Try:</span>
          {SUGGESTIONS.map((s) => (
            <button key={s.label} onClick={() => { setQ(s.q); run(s.q); }} className="chip-blue hover:bg-cop-200">
              {s.label}
            </button>
          ))}
        </div>

        {err && <div className="mt-3 text-sm text-siren-red flex items-center gap-1"><AlertTriangle className="w-4 h-4" />{err}</div>}
      </section>

      {/* RESULTS */}
      {out && (
        <section className="space-y-3">
          <div className="flex items-center justify-between">
            <div className="text-sm text-ink-500">
              <b className="text-ink-900">{out.matches.length}</b> matches in {out.total_in_db} records
            </div>
            <span className="chip-slate">threshold ≥ {min}</span>
          </div>
          {out.matches.length === 0 && (
            <div className="file-card p-6 text-center text-ink-500">
              No offenders scored above the threshold. Try lowering the min-score or adding more descriptors.
            </div>
          )}
          {out.matches.map((m) => (
            <OffenderRow key={m.offender.id} m={m} open={open===m.offender.id} onToggle={() => setOpen(open===m.offender.id?null:m.offender.id)} />
          ))}
        </section>
      )}
    </div>
  );
}

function OffenderRow({ m, open, onToggle }) {
  const o = m.offender;
  return (
    <div className="file-card">
      <div className="p-4 flex items-start gap-4">
        <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cop-700 to-cop-900 text-white grid place-items-center font-disp font-bold">
          {o.name.split(' ').map(s => s[0]).slice(0,2).join('')}
        </div>
        <div className="flex-1 min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <h3 className="font-disp font-bold text-ink-900">{o.name}</h3>
            {o.alias?.length > 0 && <span className="chip-amber">aka {o.alias.join(', ')}</span>}
            <span className={['chip', o.status === 'active' ? 'chip-red' : 'chip-slate'].join(' ')}>
              {o.status === 'active' ? <ShieldAlert className="w-3 h-3" /> : <BadgeX className="w-3 h-3" />}{o.status}
            </span>
            <span className="chip-slate">ID {o.id}</span>
          </div>
          <div className="mt-1 text-sm text-ink-500">{o.why}</div>
          <div className="mt-2 flex flex-wrap gap-1.5">
            {m.reasons.map((r, i) => <span key={i} className="chip-blue">{r}</span>)}
          </div>
        </div>
        <div className="hidden md:flex flex-col items-end gap-1">
          <div className="text-[11px] uppercase tracking-wider text-ink-500">match score</div>
          <div className={['font-disp font-extrabold text-3xl leading-none',
            m.score >= 60 ? 'text-siren-red' : m.score >= 40 ? 'text-amber-600' : 'text-ink-700'
          ].join(' ')}>
            {m.score}
          </div>
          <RiskBar value={o.risk_score} />
        </div>
        <button onClick={onToggle} className="ml-1 btn-soft"><ChevronDown className={['w-4 h-4 transition', open?'rotate-180':''].join(' ')}/></button>
      </div>

      {open && (
        <div className="border-t border-slate-200 p-4 grid md:grid-cols-3 gap-4 bg-slate-50/60">
          <Detail icon={Ruler} label="Physical">
            <KV k="Height" v={`${o.height_cm} cm`} />
            <KV k="Build"  v={o.build} />
            <KV k="Complexion" v={o.complexion} />
            <KV k="Weight" v={`${o.weight_kg} kg`} />
          </Detail>
          <Detail icon={Eye} label="Identifying Marks">
            <ul className="text-sm space-y-1">
              {(o.identifying_marks||[]).map((x,i)=>(
                <li key={i} className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-siren-red"/>{x}</li>
              ))}
            </ul>
          </Detail>
          <Detail icon={MapPin} label="Operating Areas">
            <Pills items={o.operating_areas||[]} tone="blue" />
            <div className="mt-2 text-[12px] text-ink-500">Address: {o.address}</div>
          </Detail>

          <Detail icon={Network} label="Modus Operandi" wide>
            <ul className="text-sm space-y-1">
              {(o.modus_operandi||[]).map((x,i)=>(
                <li key={i} className="flex items-start gap-2"><span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-cop-700"/>{x}</li>
              ))}
            </ul>
          </Detail>

          <Detail icon={User} label="Known Associates" wide>
            <div className="flex flex-wrap gap-1.5">
              {(o.known_associates||[]).length === 0
                ? <span className="text-ink-500 text-sm">— none on file —</span>
                : o.known_associates.map((a,i)=> <span key={i} className="chip-blue">{a}</span>)
              }
            </div>
            <div className="mt-2 flex flex-wrap gap-1.5">
              <Phone className="w-3.5 h-3.5 text-ink-500 mt-0.5" />
              {(o.phone_numbers||[]).map((p,i)=> <span key={i} className="chip-slate font-mono text-[11px]">{p}</span>)}
            </div>
          </Detail>

          <Detail icon={BadgeCheck} label="Prior Offences" wide>
            <table className="w-full text-sm">
              <thead className="text-[11px] uppercase tracking-wider text-ink-500">
                <tr><th className="text-left py-1">FIR</th><th className="text-left">Section</th><th className="text-left">Year</th><th className="text-left">Status</th></tr>
              </thead>
              <tbody>
                {(o.previous_offences||[]).map((p,i)=>(
                  <tr key={i} className="border-t border-slate-200">
                    <td className="py-1.5 font-mono text-[12px]">{p.fir_no}</td>
                    <td>{p.section}</td>
                    <td>{p.year}</td>
                    <td><span className={['chip', p.status==='convicted'?'chip-red':p.status==='absconding'?'chip-amber':'chip-slate'].join(' ')}>{p.status}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Detail>
        </div>
      )}
    </div>
  );
}

function RiskBar({ value }) {
  const color = value >= 80 ? 'bg-siren-red' : value >= 60 ? 'bg-amber-500' : 'bg-siren-green';
  return (
    <div className="w-28">
      <div className="text-[10px] uppercase tracking-wider text-ink-500">risk {value}</div>
      <div className="mt-1 h-1.5 rounded-full bg-slate-200 overflow-hidden">
        <div className={['h-full', color].join(' ')} style={{ width: `${value}%` }}/>
      </div>
    </div>
  );
}
function Detail({ icon: Icon, label, children, wide }) {
  return (
    <div className={['rounded-lg border border-slate-200 bg-white p-3', wide?'md:col-span-3':''].join(' ')}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-cop-800" />
        <span className="text-[12px] font-semibold uppercase tracking-wider text-ink-700">{label}</span>
      </div>
      <div className="space-y-1">{children}</div>
    </div>
  );
}
function KV({ k, v }) { return <div className="text-sm"><span className="text-ink-500">{k}:</span> <span className="font-medium">{v}</span></div>; }
function Pills({ items, tone = 'slate' }) {
  const cls = tone === 'blue' ? 'chip-blue' : 'chip-slate';
  return <div className="flex flex-wrap gap-1.5">{items.map((x,i)=> <span key={i} className={cls}>{x}</span>)}</div>;
}
