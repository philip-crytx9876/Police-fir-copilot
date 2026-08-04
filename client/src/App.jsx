import React, { useState, useEffect } from 'react';
import {
  Shield, LayoutDashboard, FileText, Users, GitBranch, ClipboardList, Radio,
  Wifi, WifiOff, Cpu, CloudSnow,
} from 'lucide-react';

import Dashboard    from './components/Dashboard.jsx';
import FIRParser    from './components/FIRParser.jsx';
import OffenderMatcher from './components/OffenderMatcher.jsx';
import GraphView    from './components/GraphView.jsx';
import ActionPlan   from './components/ActionPlan.jsx';
import Chatbot      from './components/Chatbot.jsx';
import SnowflakeDemo from './components/SnowflakeDemo.jsx';
import { api } from './api.js';

const NAV = [
  { id: 'dashboard', label: 'Dashboard',       icon: LayoutDashboard, hint: 'Overview'    },
  { id: 'parser',    label: 'FIR Parser',      icon: FileText,        hint: 'Feature 1'  },
  { id: 'matcher',   label: 'Offender Match',  icon: Users,           hint: 'Feature 2'  },
  { id: 'graph',     label: 'Case Graph',      icon: GitBranch,       hint: 'Feature 3'  },
  { id: 'snowflake', label: 'Snowflake',       icon: CloudSnow,       hint: 'Warehouse'   },
  { id: 'action',    label: 'Action Plan',     icon: ClipboardList,   hint: 'Feature 4'  },
  { id: 'chat',      label: 'Copilot Chat',    icon: Radio,           hint: 'Q&A'        },
];

export default function App() {
  const [active, setActive] = useState('dashboard');
  const [health, setHealth] = useState(null);
  const [context, setContext] = useState(null);   // shared context for chat

  useEffect(() => {
    api.health().then(setHealth).catch((e) => setHealth({ ok: false, error: e.message }));
  }, []);

  return (
    <div className="h-full w-full flex">
      <Sidebar active={active} setActive={setActive} health={health} />
      <main className="flex-1 min-w-0 h-full overflow-y-auto scrollbar-thin">
        <TopBar active={active} health={health} />
        <div className="px-6 lg:px-10 pb-16 pt-2 max-w-[1500px] mx-auto">
          {active === 'dashboard' && <Dashboard go={setActive} health={health} />}
          {active === 'parser'    && <FIRParser setContext={setContext} />}
          {active === 'matcher'   && <OffenderMatcher />}
          {active === 'graph'     && <GraphView />}
          {active === 'snowflake' && <SnowflakeDemo />}
          {active === 'action'    && <ActionPlan context={context} />}
          {active === 'chat'      && <Chatbot context={context} />}
        </div>
      </main>
    </div>
  );
}

function Sidebar({ active, setActive, health }) {
  return (
    <aside className="hidden md:flex flex-col w-64 shrink-0 h-full bg-cop-900 text-white relative">
      {/* faint badge watermark */}
      <div className="absolute inset-0 opacity-[0.06] dotgrid pointer-events-none" />
      <div className="relative px-5 py-5 flex items-center gap-3 border-b border-white/10">
        <div className="w-10 h-10 rounded-lg bg-white/10 grid place-items-center">
          <Shield className="w-6 h-6 text-white" />
        </div>
        <div>
          <div className="font-disp font-bold leading-tight">FIR Copilot</div>
          <div className="text-[10px] uppercase tracking-[0.18em] text-cop-200">Investigation Intelligence</div>
        </div>
      </div>
      <nav className="relative flex-1 p-3 space-y-1">
        {NAV.map((n) => {
          const Icon = n.icon;
          const isActive = active === n.id;
          return (
            <button
              key={n.id}
              onClick={() => setActive(n.id)}
              className={[
                'w-full group flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition',
                isActive
                  ? 'bg-white text-cop-900 shadow-pin'
                  : 'text-cop-100 hover:bg-white/10',
              ].join(' ')}
            >
              <Icon className={['w-4 h-4', isActive ? 'text-cop-800' : 'text-cop-200 group-hover:text-white'].join(' ')} />
              <span className="font-semibold text-sm flex-1">{n.label}</span>
              <span className={['text-[10px] uppercase tracking-wider px-1.5 py-0.5 rounded',
                isActive ? 'bg-cop-100 text-cop-800' : 'bg-white/10 text-cop-200'].join(' ')}>
                {n.hint}
              </span>
            </button>
          );
        })}
      </nav>
      <div className="relative p-3 border-t border-white/10">
        <div className="rounded-lg bg-white/5 p-3">
          <div className="flex items-center gap-2 text-xs">
            <Cpu className="w-3.5 h-3.5 text-cop-200" />
            <span className="text-cop-100">AI Provider</span>
          </div>
          <div className="mt-1.5 text-[12px] font-mono text-white/90 truncate">
            {health?.ai?.model || 'openai/gpt-oss-120b'}
          </div>
          <div className="mt-1 flex items-center gap-1.5 text-[10px]">
            {health?.ok ? (
              <><Wifi className="w-3 h-3 text-green-400" /><span className="text-green-300">connected</span></>
            ) : (
              <><WifiOff className="w-3 h-3 text-red-400" /><span className="text-red-300">disconnected</span></>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}

function TopBar({ active, health }) {
  const label = NAV.find((n) => n.id === active)?.label || 'Dashboard';
  const hint  = NAV.find((n) => n.id === active)?.hint || '';
  return (
    <header className="sticky top-0 z-20 backdrop-blur bg-white/70 border-b border-slate-200/80 px-6 lg:px-10 py-3 flex items-center gap-4">
      <div className="md:hidden flex items-center gap-2">
        <Shield className="w-5 h-5 text-cop-800" />
        <span className="font-disp font-bold">FIR Copilot</span>
      </div>
      <div className="flex-1 flex items-center gap-3">
        <span className="eyebrow">{hint}</span>
        <h1 className="font-disp text-xl md:text-2xl font-bold text-ink-900">{label}</h1>
      </div>
      <div className="hidden md:flex items-center gap-2 text-xs">
        <span className="chip-blue">Light theme</span>
        <span className="chip-green">Groq</span>
        <span className="chip-red">v1.0</span>
      </div>
    </header>
  );
}
