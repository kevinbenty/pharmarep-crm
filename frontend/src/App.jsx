import { useState } from 'react';
import { Provider } from 'react-redux';
import { store } from './store';
import InteractionsPage from './components/InteractionsPage';
import ChatInterface from './components/ChatInterface';
import { LayoutDashboard, MessageSquare } from 'lucide-react';

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
          <div style={{ fontSize: 12, color: 'var(--text-muted)', padding: '0 12px' }}>LangGraph · Groq · gemma2-9b-it</div>
        </div>
      </div>
      <div className="main">
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
