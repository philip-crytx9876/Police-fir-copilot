import React, { useEffect, useState } from 'react';
import {
  FileText, Users, GitBranch, ClipboardList, ArrowRight, Sparkles, Shield,
  Activity, Database, Cpu, Download,
} from 'lucide-react';
import { api } from '../api.js';

const FEATURES = [
  {
    id: 'parser', label: 'Multi-Lingual FIR Parser',
    sub: 'Feature 1',
    icon: FileText,
    color: 'cop',
    text: 'Turn messy, multi-lingual FIR narratives — uploaded PDFs, voice notes, or typed complaints — into clean JSON: suspects, stolen items, timestamps, RPC/RA sections.',
  },
  {
    id: 'matcher', label: 'Repeat Offender Matcher',
    sub: 'Feature 2',
    icon: Users,
    color: 'red',
    text: 'Search the criminal history DB by Modus Operandi, physical descriptors & operating area. Get ranked suspects with AI-generated rationale.',
  },
  {
    id: 'graph', label: 'Timeline & Relationship Graph',
    sub: 'Feature 3',
    icon: GitBranch,
    color: 'green',
    text: 'Cross-link multiple FIRs. A detective\'s evidence-board view of phones, associates, co-accused and locations — plus a unified timeline.',
  },
  {
    id: 'action', label: 'Investigative Action Plan',
    sub: 'Feature 4',
    icon: ClipboardList,
    color: 'cop',
    text: 'Referral outline, witnesses to examine, CCTV retrieval, evidence preservation, and RPC/RA-grounded next steps.',
  },
];

export default function Dashboard({ go, health }) {
  const [stats, setStats] = useState({ cases: 0, offenders: 0 });

  useEffect(() => {
    Promise.all([api.cases(), api.offenders()])
      .then(([c, o]) => setStats({ cases: c.total, offenders: o.total }))
      .catch(() => {});
  }, []);

  return (
    <div className="space-y-8">
      {/* HERO */}
      <section className="file-card overflow-hidden">
        <div className="grid md:grid-cols-[1.6fr_1fr] gap-0">
          <div className="p-6 md:p-8">
            <div className="eyebrow">Investigation Intelligence · v1.0</div>
            <h2 className="mt-2 font-disp text-3xl md:text-4xl font-bold text-ink-900 leading-tight">
              From a raw FIR to a ranked suspect list — in one desk.
            </h2>
            <p className="mt-3 text-ink-500 max-w-xl">
              FIR Copilot reads your messy complaints, extracts entities, cross-references criminal
              records, links cases together, and drafts the next investigative steps — powered by{' '}
              <span className="font-semibold text-cop-800">Groq</span> ({health?.ai?.model || 'openai/gpt-oss-120b'}).
            </p>
            <div className="mt-5 flex flex-wrap gap-2">
              <button onClick={() => go('parser')} className="btn-primary">
                <FileText className="w-4 h-4" /> Try the FIR Parser
                <ArrowRight className="w-4 h-4" />
              </button>
              <button onClick={() => go('chat')} className="btn-ghost">
                <Sparkles className="w-4 h-4" /> Open Copilot Chat
              </button>
              <a href="/demo/demo-fir-cubao-bag-snatching.pdf" download className="btn-soft">
                <Download className="w-4 h-4" /> Download demo FIR PDF
              </a>
            </div>
            <div className="mt-5 flex flex-wrap gap-2 text-[12px]">
              <span className="chip-blue"><Shield className="w-3 h-3" /> Read-only mock DB</span>
              <span className="chip-green"><Cpu className="w-3 h-3" /> Groq GPT-OSS-120B</span>
              <span className="chip-amber">+ optional GPT-4o / Claude 3.5</span>
            </div>
          </div>
          {/* Badge art */}
          <div className="relative bg-cop-50 grid place-items-center p-6">
            <div className="absolute inset-0 dotgrid opacity-50" />
            <div className="relative w-44 h-44 rounded-full bg-gradient-to-b from-cop-700 to-cop-900 grid place-items-center shadow-pin">
              <div className="w-32 h-32 rounded-full bg-white grid place-items-center">
                <div className="text-center">
                  <div className="font-disp font-extrabold text-cop-900 text-2xl leading-none">FIR</div>
                  <div className="text-[10px] tracking-[0.3em] text-cop-700 mt-1">COPILOT</div>
                </div>
              </div>
            </div>
            <div className="absolute top-3 right-3 stamp text-siren-red">CLASSIFIED · INTEL</div>
          </div>
        </div>
      </section>

      {/* STATS */}
      <section className="grid sm:grid-cols-3 gap-4">
        <StatCard icon={Database} label="Cases in DB" value={stats.cases} sub="mock FIR records" tone="blue" />
        <StatCard icon={Users}     label="Known Offenders" value={stats.offenders} sub="with MO & priors" tone="red" />
        <StatCard icon={Activity}  label="AI Model" value="Groq" sub={health?.ok ? 'connected' : 'disconnected'} tone="green" />
      </section>

      {/* FEATURE GRID */}
      <section>
        <div className="eyebrow mb-3">Capabilities</div>
        <div className="grid md:grid-cols-2 gap-4">
          {FEATURES.map((f) => {
            const Icon = f.icon;
            return (
              <button
                key={f.id}
                onClick={() => go(f.id)}
                className="file-card text-left p-5 hover:-translate-y-0.5 transition group"
              >
                <div className="flex items-start gap-4">
                  <div
                    className={[
                      'w-11 h-11 rounded-lg grid place-items-center shrink-0',
                      f.color === 'cop' ? 'bg-cop-100 text-cop-800' :
                      f.color === 'red' ? 'bg-red-100 text-siren-red' :
                      'bg-green-100 text-siren-green',
                    ].join(' ')}
                  >
                    <Icon className="w-5 h-5" />
                  </div>
                  <div className="min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="chip-slate">{f.sub}</span>
                      <h3 className="font-disp font-bold text-ink-900">{f.label}</h3>
                    </div>
                    <p className="mt-1.5 text-sm text-ink-500">{f.text}</p>
                    <div className="mt-3 inline-flex items-center gap-1 text-cop-800 text-sm font-semibold group-hover:gap-2 transition-all">
                      Open <ArrowRight className="w-4 h-4" />
                    </div>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>
    </div>
  );
}

function StatCard({ icon: Icon, label, value, sub, tone }) {
  const ring = tone === 'red' ? 'text-siren-red' : tone === 'green' ? 'text-siren-green' : 'text-cop-800';
  const bg   = tone === 'red' ? 'bg-red-50'    : tone === 'green' ? 'bg-green-50'    : 'bg-cop-50';
  return (
    <div className="file-card p-4 flex items-center gap-4">
      <div className={['w-12 h-12 rounded-lg grid place-items-center', bg, ring].join(' ')}>
        <Icon className="w-6 h-6" />
      </div>
      <div className="min-w-0">
        <div className="text-[11px] uppercase tracking-wider text-ink-500 font-semibold">{label}</div>
        <div className="font-disp font-bold text-2xl text-ink-900 leading-tight">{value}</div>
        <div className="text-[12px] text-ink-500">{sub}</div>
      </div>
    </div>
  );
}
