import React, { useEffect, useRef, useState } from 'react';
import { Radio, Send, Sparkles, Loader2, AlertTriangle, ShieldQuestion, Trash2 } from 'lucide-react';
import { api } from '../api.js';

const SUGGESTED = [
  'What are the details of the FIR I just uploaded, and what should I do next?',
  'Explain the difference between Art. 308 (Theft) and Art. 294 (Robbery) RPC for a snatching case.',
  'Draft a next-steps checklist for referring this case to the City Prosecutor.',
  'Summarise the known offenders who match the Cubao bag-snatching pattern.',
];

export default function Chatbot({ context }) {
  const [messages, setMessages] = useState([
    {
      role: 'assistant',
      content:
        'Online. I am FIR-Copilot, your investigative assistant. Upload or parse an FIR first (Feature 1) and I\'ll answer questions about that specific complaint — victim, suspects, stolen items, likely RPC/RA sections, and next steps. I can also explain RPC/RA sections in general, or cross-reference offenders. I have read-only access to the in-house mock DB.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState(null);
  const scrollRef = useRef(null);

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [messages, busy]);

  const send = async (text) => {
    const content = (text ?? input).trim();
    if (!content || busy) return;
    const next = [...messages, { role: 'user', content }];
    setMessages(next);
    setInput('');
    setBusy(true); setErr(null);
    try {
      const history = next.slice(0, -1).map(({ role, content }) => ({ role, content }));
      const r = await api.chat(content, history, context || null);
      setMessages([...next, { role: 'assistant', content: r.reply }]);
    } catch (e) {
      setErr(e.message);
      setMessages([...next, { role: 'assistant', content: `⚠ ${e.message}` }]);
    } finally { setBusy(false); }
  };

  const reset = () => setMessages([messages[0]]);

  return (
    <div className="grid lg:grid-cols-[1fr_280px] gap-5 h-[calc(100vh-160px)] min-h-[560px]">
      {/* CHAT */}
      <section className="file-card flex flex-col overflow-hidden">
        <div className="px-5 py-3 border-b border-slate-200 bg-gradient-to-r from-cop-50 to-white flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-cop-700 text-white grid place-items-center shadow-pin">
            <Radio className="w-5 h-5" />
          </div>
          <div>
            <div className="font-disp font-bold">Copilot Chat</div>
            <div className="text-[11px] text-ink-500 flex items-center gap-2">
              <span className="w-2 h-2 rounded-full bg-siren-green animate-pulseRing" /> Groq · Channel 1
            </div>
          </div>
          <button onClick={reset} className="ml-auto btn-soft"><Trash2 className="w-4 h-4" />Clear</button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto scrollbar-thin p-5 space-y-3">
          {messages.map((m, i) => <Bubble key={i} role={m.role} content={m.content} />)}
          {busy && (
            <div className="flex items-center gap-2 text-ink-500 text-sm">
              <span className="w-2 h-2 rounded-full bg-siren-green animate-blink" />
              <span className="cursor font-mono">transmitting</span>
            </div>
          )}
          {err && <div className="text-sm text-siren-red flex items-center gap-1"><AlertTriangle className="w-4 h-4" />{err}</div>}
        </div>

        <form
          onSubmit={(e) => { e.preventDefault(); send(); }}
          className="border-t border-slate-200 p-3 flex items-center gap-2 bg-white"
        >
          <input
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Ask about legal procedure, evidence, suspect patterns…"
            className="flex-1 px-3 py-2.5 rounded-lg border border-slate-200 outline-none focus:border-cop-500"
          />
          <button type="submit" disabled={busy || !input.trim()} className="btn-primary">
            {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Send className="w-4 h-4" />} Send
          </button>
        </form>
      </section>

      {/* SIDE PANEL */}
      <aside className="space-y-3">
        <div className="file-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <Sparkles className="w-4 h-4 text-cop-800" />
            <span className="font-disp font-bold">Suggested</span>
          </div>
          <div className="space-y-1.5">
            {SUGGESTED.map((s, i) => (
              <button key={i} onClick={() => send(s)} className="w-full text-left text-[12.5px] rounded-md border border-slate-200 bg-white hover:bg-cop-50 px-2.5 py-2 transition">
                {s}
              </button>
            ))}
          </div>
        </div>

        <div className="file-card p-4">
          <div className="flex items-center gap-2 mb-2">
            <ShieldQuestion className="w-4 h-4 text-siren-red" />
            <span className="font-disp font-bold">Active context</span>
          </div>
          {context?.kind === 'fir' ? (
            <div className="text-[12.5px] text-ink-700 space-y-1">
              <div><b>Source:</b> FIR Parser result</div>
              <div><b>Language:</b> {context.entities?.language_detected || '—'}</div>
              <div><b>Suspects:</b> {(context.entities?.suspects || []).length}</div>
              <div><b>Stolen items:</b> {(context.entities?.stolen_items || []).length}</div>
            </div>
          ) : (
            <div className="text-[12.5px] text-ink-500">
              No active context. Run the <b>Parser</b> first to bring entities into the chat.
            </div>
          )}
        </div>

        <div className="file-card p-4">
          <div className="text-[12px] text-ink-500">
            Powered by <b className="text-ink-900">Groq</b> — switch the model any time by editing
            <code className="ml-1 font-mono text-[11px] bg-slate-100 px-1 rounded">GROQ_MODEL</code> in your <code className="font-mono text-[11px] bg-slate-100 px-1 rounded">.env</code>.
          </div>
        </div>
      </aside>
    </div>
  );
}

function Bubble({ role, content }) {
  const isUser = role === 'user';
  return (
    <div className={['flex gap-2', isUser ? 'justify-end' : 'justify-start'].join(' ')}>
      {!isUser && (
        <div className="w-8 h-8 shrink-0 rounded-lg bg-cop-700 text-white grid place-items-center">
          <Radio className="w-4 h-4" />
        </div>
      )}
      <div
        className={[
          'max-w-[78%] rounded-2xl px-3.5 py-2.5 text-sm leading-relaxed shadow-sm',
          isUser
            ? 'bg-cop-700 text-white rounded-tr-sm'
            : 'bg-white border border-slate-200 text-ink-900 rounded-tl-sm',
        ].join(' ')}
      >
        {isUser ? content : <MarkdownLite text={content} />}
      </div>
      {isUser && (
        <div className="w-8 h-8 shrink-0 rounded-lg bg-slate-200 text-ink-700 grid place-items-center font-bold text-[12px]">
          IO
        </div>
      )}
    </div>
  );
}

/** Lightweight markdown renderer — handles paragraphs, **bold**, lists, code. */
function MarkdownLite({ text }) {
  const blocks = String(text || '').split(/\n{2,}/);
  return (
    <div className="space-y-2">
      {blocks.map((b, i) => {
        const lines = b.split('\n');
        if (lines.every(l => /^\s*[-*]\s+/.test(l))) {
          return (
            <ul key={i} className="list-disc pl-5 space-y-1">
              {lines.map((l, j) => <li key={j} dangerouslySetInnerHTML={{ __html: inline(l.replace(/^\s*[-*]\s+/, '')) }} />)}
            </ul>
          );
        }
        if (lines.every(l => /^\s*\d+\.\s+/.test(l))) {
          return (
            <ol key={i} className="list-decimal pl-5 space-y-1">
              {lines.map((l, j) => <li key={j} dangerouslySetInnerHTML={{ __html: inline(l.replace(/^\s*\d+\.\s+/, '')) }} />)}
            </ol>
          );
        }
        return <p key={i} dangerouslySetInnerHTML={{ __html: inline(b) }} />;
      })}
    </div>
  );
}
function inline(s) {
  return String(s)
    .replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;')
    .replace(/\*\*([^*]+)\*\*/g, '<b>$1</b>')
    .replace(/`([^`]+)`/g, '<code class="font-mono text-[12px] bg-slate-100 px-1 rounded">$1</code>');
}
