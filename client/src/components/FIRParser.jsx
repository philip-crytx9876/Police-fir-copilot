import React, { useEffect, useState } from 'react';
import {
  FileText, Sparkles, Loader2, Copy, Languages, Mic, FileUp, Tag,
  MapPin, Clock, User, Phone, Car, Scale, AlertTriangle, CheckCircle2,
} from 'lucide-react';
import { api } from '../api.js';

const LANG_OPTIONS = [
  { v: 'auto',     l: 'Auto-detect' },
  { v: 'English',  l: 'English' },
  { v: 'Filipino', l: 'Filipino (Tagalog)' },
  { v: 'Taglish',  l: 'Taglish' },
  { v: 'Cebuano',  l: 'Cebuano (Bisaya)' },
  { v: 'Ilocano',  l: 'Ilocano' },
];

export default function FIRParser({ setContext }) {
  const [text, setText] = useState('');
  const [lang, setLang] = useState('auto');
  const [busy, setBusy]   = useState(false);
  const [pdfBusy, setPdfBusy] = useState(false);
  const [pdfName, setPdfName] = useState(null);
  const [out, setOut]     = useState(null);
  const [err, setErr]     = useState(null);
  const [samples, setSamples] = useState([]);

  useEffect(() => { api.samples().then((d) => setSamples(d.samples || [])); }, []);

  const run = async (overrideText) => {
    const source = overrideText ?? text;
    if (!source.trim()) return;
    setBusy(true); setErr(null);
    try {
      const r = await api.parse(source, lang, pdfName ? 'pdf' : 'text');
      setOut(r);
      setContext?.({ kind: 'fir', entities: r.entities, raw: source, filename: pdfName || undefined });
    } catch (e) { setErr(e.message); }
    finally { setBusy(false); }
  };

  const onUploadPdf = async (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    setPdfBusy(true); setErr(null); setOut(null);
    try {
      const r = await api.extractPdf(f);
      setText(r.text);
      setPdfName(r.filename);
      // Auto-run the parser right after extraction so the officer can jump
      // straight into Copilot Chat with this FIR already in context.
      await run(r.text);
    } catch (err) {
      setErr(err.message);
    } finally {
      setPdfBusy(false);
      e.target.value = '';
    }
  };

  const loadSample = (s) => {
    setPdfName(null);
    setText(s.text);
    setLang(s.label.startsWith('Filipino') ? 'Filipino' : s.label.startsWith('Taglish') ? 'Taglish' : 'English');
  };

  return (
    <div className="grid lg:grid-cols-[1.05fr_1fr] gap-5">
      {/* INPUT */}
      <section className="file-card p-5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <FileText className="w-5 h-5 text-cop-800" />
            <h2 className="font-disp font-bold text-lg">Raw Complaint Input</h2>
          </div>
          <div className="flex items-center gap-2">
            <span className="chip-blue"><Languages className="w-3 h-3" />{LANG_OPTIONS.find(x=>x.v===lang)?.l}</span>
          </div>
        </div>

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <label className="btn-soft cursor-pointer">
            {pdfBusy ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            {pdfBusy ? 'Reading PDF…' : 'Upload PDF'}
            <input type="file" accept="application/pdf" className="hidden" disabled={pdfBusy} onChange={onUploadPdf} />
          </label>
          {pdfName && <span className="chip-slate"><FileText className="w-3 h-3" />{pdfName}</span>}
          <button className="btn-soft" onClick={() => setText(t => t + '\n[Voice recording — 0:42] ')}>
            <Mic className="w-4 h-4" /> Voice Note
          </button>
          <div className="ml-auto flex items-center gap-2">
            <select className="text-sm border border-slate-200 rounded-lg px-2 py-2 bg-white" value={lang} onChange={(e)=>setLang(e.target.value)}>
              {LANG_OPTIONS.map(o => <option key={o.v} value={o.v}>{o.l}</option>)}
            </select>
          </div>
        </div>

        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          placeholder="Paste the FIR / complaint narrative here — English, Filipino (Tagalog), Taglish, Cebuano, Ilocano — or upload a PDF above. Handwriting OCR, voice transcript, or typed — all welcome."
          className="mt-3 w-full h-72 rounded-lg border border-slate-200 bg-paper ruled-paper p-4 text-[15px] leading-[32px] font-mono text-ink-900 outline-none focus:border-cop-500"
        />

        <div className="mt-3 flex flex-wrap items-center gap-2">
          <span className="text-[12px] text-ink-500 mr-1">Try a sample:</span>
          {samples.map((s) => (
            <button key={s.label} onClick={() => loadSample(s)} className="chip-blue hover:bg-cop-200">
              {s.label}
            </button>
          ))}
        </div>

        <div className="mt-4 flex items-center gap-2">
          <button onClick={() => run()} disabled={busy || pdfBusy || !text.trim()} className="btn-primary">
            {busy ? <><Loader2 className="w-4 h-4 animate-spin" />Extracting…</> : <><Sparkles className="w-4 h-4" />Parse with Llama-4</>}
          </button>
          {err && <span className="text-sm text-siren-red flex items-center gap-1"><AlertTriangle className="w-4 h-4" />{err}</span>}
        </div>

        {out && (
          <div className="mt-3 text-[12px] text-ink-500 bg-cop-50 border border-cop-100 rounded-md px-3 py-2">
            This FIR is now loaded as the active context — switch to <b>Copilot Chat</b> to ask questions about it
            (e.g. "what's the solution / next steps for this case?") or check <b>Offender Match</b> for known suspects.
          </div>
        )}
      </section>

      {/* OUTPUT */}
      <section className="file-card p-5 min-h-[420px]">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <CheckCircle2 className="w-5 h-5 text-siren-green" />
            <h2 className="font-disp font-bold text-lg">Structured Entities (JSON)</h2>
          </div>
          {out && (
            <button className="btn-ghost" onClick={() => navigator.clipboard.writeText(JSON.stringify(out.entities, null, 2))}>
              <Copy className="w-4 h-4" /> Copy JSON
            </button>
          )}
        </div>

        {!out && !busy && (
          <div className="mt-4 text-sm text-ink-500">
            Upload a PDF or paste a complaint on the left and hit <b>Parse</b>. The model returns a typed JSON object with suspects, victim,
            stolen items, locations, timestamps, vehicles, phone numbers and suggested RPC / RA sections.
          </div>
        )}

        {busy && (
          <div className="mt-6 flex items-center gap-3 text-ink-500">
            <Loader2 className="w-5 h-5 animate-spin text-cop-700" />
            <span>Reading the FIR… extracting entities with Groq…</span>
          </div>
        )}

        {out && <ExtractedView data={out.entities} />}
      </section>
    </div>
  );
}

function ExtractedView({ data }) {
  const e = data || {};
  return (
    <div className="mt-3 space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <span className="chip-blue"><Languages className="w-3 h-3" />{e.language_detected || '—'}</span>
        {e.fir_number && <span className="chip-slate"><Tag className="w-3 h-3" />{e.fir_number}</span>}
        {e.police_station && <span className="chip-slate"><MapPin className="w-3 h-3" />{e.police_station}</span>}
        {e.date_time_mentioned && <span className="chip-amber"><Clock className="w-3 h-3" />{e.date_time_mentioned}</span>}
        {typeof e.confidence === 'number' && (
          <span className={['chip', e.confidence > 0.7 ? 'bg-green-100 text-green-800' : 'bg-amber-100 text-amber-800'].join(' ')}>
            confidence {(e.confidence*100).toFixed(0)}%
          </span>
        )}
      </div>

      {e.narrative_summary && (
        <p className="text-sm bg-cop-50 border-l-4 border-cop-700 p-3 rounded-r-md text-ink-700">
          {e.narrative_summary}
        </p>
      )}

      {e.victim && (e.victim.name || e.victim.age) && (
        <Block title="Victim" icon={User}>
          <KV k="Name"   v={e.victim.name} />
          <KV k="Age"    v={e.victim.age} />
          <KV k="Gender" v={e.victim.gender} />
        </Block>
      )}

      <Block title={`Suspects (${(e.suspects||[]).length})`} icon={User} accent="red">
        <div className="space-y-2">
          {(e.suspects || []).map((s, i) => (
            <div key={i} className="rounded-md border border-red-100 bg-red-50/40 p-2.5 text-sm">
              <div className="font-semibold text-ink-900">{s.description}</div>
              <div className="mt-1 flex flex-wrap gap-1.5 text-[11px]">
                {s.height && <span className="chip-slate">H: {s.height}</span>}
                {s.build && <span className="chip-slate">build: {s.build}</span>}
                {s.estimated_age && <span className="chip-slate">age: {s.estimated_age}</span>}
                {s.alias && <span className="chip-amber">aka {s.alias}</span>}
              </div>
              {s.identifying_marks?.length > 0 && (
                <div className="mt-1 text-[12px] text-ink-500">
                  marks: {s.identifying_marks.join(' · ')}
                </div>
              )}
            </div>
          ))}
        </div>
      </Block>

      <Block title={`Stolen Items (${(e.stolen_items||[]).length})`} icon={Tag} accent="red">
        <ul className="text-sm space-y-1">
          {(e.stolen_items || []).map((it, i) => (
            <li key={i} className="flex items-center gap-2">
              <span className="w-1.5 h-1.5 rounded-full bg-siren-red" />
              <span className="font-semibold">{it.item}</span>
              {it.qty && <span className="text-ink-500">× {it.qty}</span>}
              {it.value_php && <span className="text-ink-500">~ ₱{it.value_php}</span>}
              {it.serial_or_desc && <span className="text-ink-500">— {it.serial_or_desc}</span>}
            </li>
          ))}
        </ul>
      </Block>

      <div className="grid sm:grid-cols-2 gap-3">
        <Block title="Locations" icon={MapPin} compact>
          <Pills items={e.locations || []} tone="blue" />
        </Block>
        <Block title="Phone Numbers" icon={Phone} compact>
          <Pills items={e.phone_numbers || []} tone="slate" mono />
        </Block>
        <Block title="Vehicles" icon={Car} compact>
          {(e.vehicles_mentioned || []).length === 0 ? <Empty/> :
            <ul className="text-sm space-y-1">{(e.vehicles_mentioned || []).map((v,i)=>(
              <li key={i}>{[v.color, v.type].filter(Boolean).join(' ')}{v.plate_partial?` • plate: ${v.plate_partial}`:''}</li>
            ))}</ul>}
        </Block>
        <Block title="Timestamps" icon={Clock} compact>
          <ul className="text-sm space-y-1">{(e.timestamps_mentioned || []).map((t,i)=><li key={i}>{t}</li>)}</ul>
        </Block>
      </div>

      <Block title="RPC / RA Sections" icon={Scale} accent="green">
        <Pills items={e.law_sections_suggested || e.ipc_sections_suggested || []} tone="green" />
      </Block>
    </div>
  );
}

function Block({ title, icon: Icon, children, accent, compact }) {
  const ring = accent === 'red' ? 'border-red-200' : accent === 'green' ? 'border-green-200' : 'border-slate-200';
  return (
    <div className={['rounded-lg border bg-white', ring, compact ? 'p-3' : 'p-3.5'].join(' ')}>
      <div className="flex items-center gap-2 mb-2">
        <Icon className="w-4 h-4 text-ink-700" />
        <span className="text-[12px] font-semibold uppercase tracking-wider text-ink-700">{title}</span>
      </div>
      {children}
    </div>
  );
}
function KV({ k, v }) { return v != null && v !== '' ? <div className="text-sm"><span className="text-ink-500">{k}:</span> <span className="font-medium">{String(v)}</span></div> : null; }
function Pills({ items, tone = 'slate', mono }) {
  if (!items?.length) return <Empty/>;
  const cls = tone === 'blue' ? 'chip-blue' : tone === 'green' ? 'chip-green' : 'chip-slate';
  return <div className="flex flex-wrap gap-1.5">{items.map((x,i)=> <span key={i} className={[cls, mono?'font-mono text-[11px]':''].join(' ')}>{x}</span>)}</div>;
}
function Empty() { return <div className="text-[12px] text-ink-500">— none —</div>; }
