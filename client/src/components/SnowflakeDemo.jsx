import React, { useEffect, useState } from 'react';
import {
  CloudSnow,
  Database,
  ShieldCheck,
  Loader2,
  ArrowUpRight,
  Activity,
} from 'lucide-react';
import { api } from '../api.js';

export default function SnowflakeDemo() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    let active = true;

    api.snowflakeDemo()
      .then((result) => {
        if (active) {
          setData(result);
          setLoading(false);
        }
      })
      .catch((e) => {
        if (active) {
          setError(e.message || 'Unable to load Snowflake demo data');
          setLoading(false);
        }
      });

    return () => {
      active = false;
    };
  }, []);

  if (loading) {
    return (
      <div className="file-card p-10 flex items-center justify-center gap-3 text-ink-600">
        <Loader2 className="w-5 h-5 animate-spin" />
        Loading Snowflake intelligence…
      </div>
    );
  }

  if (error || !data) {
    return (
      <div className="file-card p-6 text-siren-red">
        Snowflake demo could not be loaded. {error || 'Please try again.'}
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <section className="file-card p-5">
        <div className="flex items-start justify-between gap-4">
          <div>
            <div className="eyebrow">Warehouse analytics · Snowflake</div>
            <h2 className="mt-2 font-disp text-3xl font-bold text-ink-900">Snowflake demo case intelligence</h2>
          </div>
          <div className="rounded-xl bg-cop-50 text-cop-800 p-3 border border-cop-200">
            <CloudSnow className="w-7 h-7" />
          </div>
        </div>

        <p className="mt-3 max-w-3xl text-ink-600">
          Snowflake is a cloud data warehouse optimized for secure analytics, cross-table joins, and role-based access.
          In this demo, the app exposes a dynamic warehouse view of investigation data so case clusters can be monitored,
          scored, and reviewed without leaving the front end.
        </p>

        <div className="mt-4 grid md:grid-cols-4 gap-3">
          <Metric label="Cases" value={data.summary.totalCases} icon={Database} />
          <Metric label="Open" value={data.summary.openCases} icon={ShieldCheck} />
          <Metric label="Alerts" value={data.summary.totalAlerts} icon={Activity} />
          <Metric label="Avg risk" value={data.summary.avgRisk} icon={ArrowUpRight} />
        </div>

        <div className="mt-5 rounded-xl border border-slate-200 bg-slate-50 p-4">
          <div className="text-[11px] uppercase tracking-[0.18em] text-ink-500">Warehouse profile</div>
          <div className="mt-2 flex flex-wrap gap-2 text-sm text-ink-700">
            <span className="chip-blue">{data.warehouse}</span>
            <span className="chip-green">{data.environment}</span>
            <span className="chip-slate">{data.region}</span>
          </div>
          <div className="mt-4 space-y-2">
            {data.notes.map((note) => (
              <div key={note} className="text-sm text-ink-600 flex items-start gap-2">
                <span className="mt-1 h-2 w-2 rounded-full bg-cop-700" />
                <span>{note}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section className="grid xl:grid-cols-3 gap-4">
        {data.cases.map((caseItem) => (
          <article key={caseItem.case_id} className="file-card p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <div className="text-[11px] uppercase tracking-[0.18em] text-ink-500">{caseItem.case_id}</div>
                <h3 className="mt-2 font-disp text-xl font-bold text-ink-900">{caseItem.title}</h3>
              </div>
              <span className={`chip-${caseItem.risk === 'Critical' ? 'red' : caseItem.risk === 'High' ? 'amber' : caseItem.risk === 'Medium' ? 'green' : 'blue'}`}>
                {caseItem.risk}
              </span>
            </div>

            <div className="mt-3 space-y-2 text-sm text-ink-600">
              <Row label="Status" value={caseItem.status} />
              <Row label="Location" value={caseItem.location} />
              <Row label="Lead" value={caseItem.lead_officer} />
              <Row label="Updated" value={new Date(caseItem.updated_at).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })} />
            </div>

            <div className="mt-4 grid grid-cols-2 gap-2 text-sm">
              <SmallStat label="Matches" value={caseItem.metrics.matched_offenders} />
              <SmallStat label="Alerts" value={caseItem.metrics.alerts} />
              <SmallStat label="Evidence" value={caseItem.metrics.evidence_items} />
              <SmallStat label="Watchlist" value={caseItem.metrics.watchlist_hits} />
            </div>

            <p className="mt-4 text-sm text-ink-600">{caseItem.summary}</p>

            <div className="mt-4">
              <div className="text-[11px] uppercase tracking-[0.18em] text-ink-500 mb-2">Warehouse timeline</div>
              <ul className="space-y-2">
                {caseItem.timeline.map((event) => (
                  <li key={event} className="flex gap-2 text-sm text-ink-600">
                    <span className="mt-1 h-2 w-2 rounded-full bg-cop-700" />
                    <span>{event}</span>
                  </li>
                ))}
              </ul>
            </div>
          </article>
        ))}
      </section>
    </div>
  );
}

function Metric({ label, value, icon: Icon }) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-4">
      <div className="flex items-center justify-between text-ink-500">
        <span className="text-[11px] uppercase tracking-[0.16em]">{label}</span>
        <Icon className="w-4 h-4" />
      </div>
      <div className="mt-3 font-disp text-3xl font-bold text-ink-900">{value}</div>
    </div>
  );
}

function Row({ label, value }) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span className="text-ink-500">{label}</span>
      <span className="font-medium text-ink-800 text-right">{value}</span>
    </div>
  );
}

function SmallStat({ label, value }) {
  return (
    <div className="rounded-lg bg-slate-50 border border-slate-200 p-2 text-center">
      <div className="text-[10px] uppercase tracking-[0.16em] text-ink-500">{label}</div>
      <div className="mt-1 font-disp text-xl font-bold text-ink-900">{value}</div>
    </div>
  );
}
