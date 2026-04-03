import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useLocation, useNavigate } from 'react-router-dom';
import api from '../api';

const QUICK_ACTIONS = [
  { label: 'How to export PDF/CSV?', prompt: 'How to export PDF and CSV reports?' },
  { label: 'Low stock meaning?', prompt: 'What is low stock and how is it calculated?' },
  { label: 'Add purchase/sale', prompt: 'How do I record a purchase or sale transaction?' },
  { label: 'Reorder point help', prompt: 'Explain reorder point, min stock, max stock.' },
];

function buildLocalAnswer(text, { path }) {
  const q = (text || '').toLowerCase();

  if (q.includes('export') && (q.includes('pdf') || q.includes('csv'))) {
    return {
      answer:
        'Go to Reports → choose Report Type and Date Range → click Export CSV or Export PDF. If PDF fails, restart backend and ensure reportlab is installed.',
      suggestions: [{ label: 'Open Reports', to: '/reports' }],
    };
  }

  if (q.includes('purchase') || q.includes('sale') || q.includes('transaction')) {
    return {
      answer:
        'Open Transactions → Add Transaction → choose Purchase (stock in) or Sale (stock out), select product, quantity, optional price/notes → Add Transaction. Stock updates automatically and the history is saved.',
      suggestions: [{ label: 'Open Transactions', to: '/transactions' }],
    };
  }

  if (q.includes('reorder') || q.includes('min stock') || q.includes('max stock')) {
    return {
      answer:
        'Reorder Point = when the system marks an item as Low Stock. Min Stock is your minimum safe buffer. Max Stock is your preferred upper limit. Low-stock alerts use Reorder Point (fallback: Min Stock).',
      suggestions: [{ label: 'Open Inventory', to: '/inventory' }],
    };
  }

  if (q.includes('low stock') || q.includes('alert')) {
    return {
      answer:
        'Low Stock is shown when Quantity < Reorder Point (fallback: Min Stock). You can set these values in Inventory when adding/editing a product.',
      suggestions: [{ label: 'Open Inventory', to: '/inventory?filter=low-stock' }],
    };
  }

  if (q.includes('login') || q.includes('password')) {
    return {
      answer:
        'Login uses your email and password. If you forgot your password, use “Forgot Password” to request a reset link.',
      suggestions: [{ label: 'Open Login', to: '/login' }],
    };
  }

  return {
    answer:
      `I can help with Reports, Inventory, Users, and Transactions. Tell me what you want to do (you’re currently on "${path}").`,
    suggestions: [
      { label: 'Inventory', to: '/inventory' },
      { label: 'Reports', to: '/reports' },
      { label: 'Transactions', to: '/transactions' },
    ],
  };
}

export default function SmartAssistant() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([
    {
      id: 'm0',
      role: 'assistant',
      content: 'Hi! I’m Smart Assistant. Ask me anything about using this inventory system.',
    },
  ]);
  const [input, setInput] = useState('');
  const [busy, setBusy] = useState(false);
  const location = useLocation();
  const navigate = useNavigate();
  const listRef = useRef(null);

  const context = useMemo(
    () => ({
      path: location.pathname,
      role: localStorage.getItem('role') || 'user',
    }),
    [location.pathname]
  );

  useEffect(() => {
    if (!open) return;
    const el = listRef.current;
    if (el) el.scrollTop = el.scrollHeight;
  }, [open, messages.length]);

  const send = async (text) => {
    const trimmed = (text || '').trim();
    if (!trimmed) return;

    const userMsg = { id: `u_${Date.now()}`, role: 'user', content: trimmed };
    setMessages((m) => [...m, userMsg]);
    setInput('');

    setBusy(true);
    try {
      // Try backend assistant endpoint if present; fallback to local intent matching.
      const res = await api.post('/assistant/chat', {
        message: trimmed,
        context,
      });

      const answer = res?.data?.answer;
      const suggestions = Array.isArray(res?.data?.suggestions) ? res.data.suggestions : [];
      if (answer) {
        setMessages((m) => [
          ...m,
          {
            id: `a_${Date.now()}`,
            role: 'assistant',
            content: answer,
            suggestions,
          },
        ]);
      } else {
        const local = buildLocalAnswer(trimmed, context);
        setMessages((m) => [
          ...m,
          { id: `a_${Date.now()}`, role: 'assistant', content: local.answer, suggestions: local.suggestions },
        ]);
      }
    } catch (e) {
      const local = buildLocalAnswer(trimmed, context);
      setMessages((m) => [
        ...m,
        { id: `a_${Date.now()}`, role: 'assistant', content: local.answer, suggestions: local.suggestions },
      ]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="sa-root" aria-live="polite">
      {!open && (
        <button className="sa-fab" onClick={() => setOpen(true)} aria-label="Open smart assistant">
          <span className="sa-fab-dot" />
          Assistant
        </button>
      )}

      {open && (
        <div className="sa-panel" role="dialog" aria-label="Smart assistant">
          <div className="sa-header">
            <div>
              <div className="sa-title">Smart Assistant</div>
              <div className="sa-subtitle">Ask anything about this system</div>
            </div>
            <button className="sa-close" onClick={() => setOpen(false)} aria-label="Close assistant">
              ×
            </button>
          </div>

          <div className="sa-quick">
            {QUICK_ACTIONS.map((a) => (
              <button key={a.label} className="sa-chip" onClick={() => send(a.prompt)} disabled={busy}>
                {a.label}
              </button>
            ))}
          </div>

          <div className="sa-messages" ref={listRef}>
            {messages.map((m) => (
              <div key={m.id} className={`sa-msg ${m.role === 'user' ? 'user' : 'assistant'}`}>
                <div className="sa-bubble">
                  {m.content}
                  {Array.isArray(m.suggestions) && m.suggestions.length > 0 && (
                    <div className="sa-suggestions">
                      {m.suggestions.map((s) => (
                        <button
                          key={`${m.id}_${s.to || s.label}`}
                          className="sa-suggestion"
                          onClick={() => {
                            if (s.to) navigate(s.to);
                          }}
                        >
                          {s.label}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            ))}
            {busy && (
              <div className="sa-msg assistant">
                <div className="sa-bubble">Typing…</div>
              </div>
            )}
          </div>

          <form
            className="sa-inputRow"
            onSubmit={(e) => {
              e.preventDefault();
              send(input);
            }}
          >
            <input
              className="sa-input"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask for help…"
            />
            <button className="sa-send" type="submit" disabled={busy || !input.trim()}>
              Send
            </button>
          </form>
        </div>
      )}
    </div>
  );
}

