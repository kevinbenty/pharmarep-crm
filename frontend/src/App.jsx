import { useState } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store, fetchInteractions, clearChat } from './store';
import { DEMO_MODE, resetDemoData } from './api';
import InteractionsPage from './components/InteractionsPage';
import ChatInterface from './components/ChatInterface';
import { LayoutDashboard, MessageSquare, Info, RotateCcw } from 'lucide-react';

function DemoBanner() {
  const dispatch = useDispatch();
  const reset = () => {
    resetDemoData();
    dispatch(clearChat());
    dispatch(fetchInteractions());
  };
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '8px 20px', background: 'var(--primary-light)', borderBottom: '1px solid var(--border)', fontSize: 12.5 }}>
      <Info size={14} color="var(--primary)" style={{ flexShrink: 0 }} />
      <span style={{ flex: 1 }}>
        <strong>Demo mode:</strong> sample data saved only in your browser, and the AI assistant is simulated.
        The full version uses a FastAPI backend, PostgreSQL and a LangGraph agent on Groq.
      </span>
      <button className="btn btn-secondary btn-sm" onClick={reset}>
        <RotateCcw size={12} /> Reset demo
      </button>
    </div>
  );
}

function AppInner() {
  const [page, setPage] = useState('interactions');
  const navItems = [
    { id: 'interactions', label: 'Interactions', icon: <LayoutDashboard size={16} /> },
    { id: 'chat', label: 'AI Assistant', icon: <MessageSquare size={16} /> },
  ];
  return (
    <div className="app-layout">
      <div className="sidebar">
        <div className="sidebar-logo">
          <h1>PharmaRep CRM</h1>
          <p>HCP Interaction Manager</p>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(n => (
            <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`} onClick={() => setPage(n.id)}>
              {n.icon} {n.label}
            </button>
          ))}
        </nav>
        <div style={{ padding: '12px 10px', borderTop: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', padding: '0 12px', marginBottom: 4, fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.4px' }}>Powered by</div>
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 12px' }}>
            {DEMO_MODE ? 'Simulated assistant (demo)' : 'LangGraph · Groq · gemma2-9b-it'}
          </div>
        </div>
      </div>
      <div className="main">
        {DEMO_MODE && <DemoBanner />}
        <div className="topbar">
          <h2>{{ interactions: 'HCP Interactions', chat: 'AI Assistant' }[page]}</h2>
        </div>
        <div className="content" style={page === 'chat' ? { padding: 0, display: 'flex', flexDirection: 'column' } : {}}>
          {page === 'interactions' && <InteractionsPage />}
          {page === 'chat' && <ChatInterface />}
        </div>
      </div>
    </div>
  );
}

export default function App() {
  return <Provider store={store}><AppInner /></Provider>;
}
