import { useState, useRef, useEffect } from 'react';
import { useDispatch, useSelector } from 'react-redux';
import { sendChatMessage, addUserMessage, fetchInteractions } from '../store';
import { Send, Bot, Trash2 } from 'lucide-react';
import { clearChat } from '../store';
import { DEMO_MODE } from '../api';

export default function ChatInterface() {
  const dispatch = useDispatch();
  const { messages, loading } = useSelector(s => s.chat);
  const [input, setInput] = useState('');
  const bottomRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const send = async () => {
    if (!input.trim() || loading) return;
    const msg = input.trim();
    setInput('');
    dispatch(addUserMessage(msg));
    const history = messages.map(m => ({ role: m.role, content: m.content }));
    await dispatch(sendChatMessage({ message: msg, history }));
    // Refresh interactions after AI may have logged/edited
    dispatch(fetchInteractions());
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); send(); }
  };

  const suggestions = [
    "Log a meeting with Dr. Patel about CardioMax",
    "Show me all recent interactions",
    "Analyze engagement with Dr. Singh",
    "Schedule a follow-up for interaction #1",
  ];

  return (
    <div className="chat-container" style={{ height: '100%' }}>
      {/* Header */}
      <div style={{ padding: '14px 20px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'space-between', background: 'white' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 8, background: 'var(--primary-light)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={18} color="var(--primary)" />
          </div>
          <div>
            <div style={{ fontWeight: 600, fontSize: 14 }}>CRM AI Assistant</div>
            <div style={{ fontSize: 11, color: 'var(--text-muted)' }}>{DEMO_MODE ? 'Simulated for this demo' : 'Powered by Groq · gemma2-9b-it'}</div>
          </div>
        </div>
        <button className="btn btn-secondary btn-sm" onClick={() => dispatch(clearChat())}>
          <Trash2 size={12} /> Clear
        </button>
      </div>

      {/* Messages */}
      <div className="chat-messages">
        {messages.length === 0 && (
          <div style={{ textAlign: 'center', marginTop: 20 }}>
            <Bot size={40} color="var(--border)" style={{ margin: '0 auto 12px' }} />
            <div style={{ fontWeight: 600, marginBottom: 6 }}>How can I help you today?</div>
            <div style={{ fontSize: 12.5, color: 'var(--text-muted)', marginBottom: 20 }}>
              I can log interactions, edit records, retrieve history, and analyze HCP engagement.
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, maxWidth: 400, margin: '0 auto' }}>
              {suggestions.map((s, i) => (
                <button key={i} onClick={() => setInput(s)}
                  style={{ background: 'var(--neutral-light)', border: '1px solid var(--border)', borderRadius: 8, padding: '8px 14px', fontSize: 12.5, cursor: 'pointer', textAlign: 'left', fontFamily: 'Inter', color: 'var(--text)' }}>
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {messages.map((m, i) => (
          <div key={i} className={`chat-message ${m.role}`}>
            <div className="chat-bubble">{m.content}</div>
          </div>
        ))}

        {loading && (
          <div className="chat-message assistant">
            <div className="chat-bubble" style={{ padding: '6px 10px' }}>
              <div className="typing-dots">
                <div className="typing-dot" />
                <div className="typing-dot" />
                <div className="typing-dot" />
              </div>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="chat-input-area">
        <textarea
          className="chat-input"
          rows={1}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKey}
          placeholder="Ask me to log, edit, or analyze interactions..."
        />
        <button className="chat-send-btn" onClick={send} disabled={!input.trim() || loading}>
          <Send size={16} />
        </button>
      </div>
    </div>
  );
}
