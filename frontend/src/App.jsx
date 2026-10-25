import { useState } from 'react';
import { Provider, useDispatch } from 'react-redux';
import { store, fetchInteractions, clearChat, clearSelected } from './store';
import { DEMO_MODE, resetDemoData } from './api';
import InteractionsPage from './components/InteractionsPage';
import ChatInterface from './components/ChatInterface';
import { LayoutDashboard, MessageSquare, RotateCcw } from 'lucide-react';

const PAGES = {
  interactions: { title: 'HCP interactions', sub: 'Every visit, call and email with healthcare professionals in one place.' },
  chat: { title: 'AI assistant', sub: 'Log, look up and analyse interactions by typing a request.' },
};

function DemoNote() {
  const dispatch = useDispatch();
  const reset = () => {
    resetDemoData();
    dispatch(clearChat());
    dispatch(clearSelected());
    dispatch(fetchInteractions());
  };
  return (
    <div className="demo-note">
      <strong>Live demo</strong>
      Sample data is saved only in your browser, and the assistant is simulated.
      <button type="button" onClick={reset}>
        <RotateCcw size={12} /> Reset sample data
      </button>
    </div>
  );
}

function AppInner() {
  const [page, setPage] = useState('interactions');
  const navItems = [
    { id: 'interactions', label: 'Interactions', icon: <LayoutDashboard size={16} /> },
    { id: 'chat', label: 'AI assistant', icon: <MessageSquare size={16} /> },
  ];
  return (
    <div className="app-layout">
      <aside className="sidebar">
        <div className="sidebar-logo">
          <div className="brand">
            <span className="brand-mark" aria-hidden="true" />
            <div>
              <h1>PharmaRep CRM</h1>
              <p>HCP interaction manager</p>
            </div>
          </div>
        </div>
        <nav className="sidebar-nav">
          {navItems.map(n => (
            <button key={n.id} className={`nav-item ${page === n.id ? 'active' : ''}`}
              aria-current={page === n.id ? 'page' : undefined} onClick={() => setPage(n.id)}>
              {n.icon} {n.label}
            </button>
          ))}
        </nav>
        <div className="sidebar-foot">
          {DEMO_MODE && <DemoNote />}
          <div className="built-with">Built with React, FastAPI and LangGraph</div>
        </div>
      </aside>
      <main className="main">
        <div className="topbar">
          <div>
            <h2>{PAGES[page].title}</h2>
            <div className="topbar-sub">{PAGES[page].sub}</div>
          </div>
        </div>
        <div className="content" style={page === 'chat' ? { padding: 0, display: 'flex', flexDirection: 'column' } : {}}>
          {page === 'interactions' && <InteractionsPage />}
          {page === 'chat' && <ChatInterface />}
        </div>
      </main>
    </div>
  );
}

export default function App() {
  return <Provider store={store}><AppInner /></Provider>;
}
