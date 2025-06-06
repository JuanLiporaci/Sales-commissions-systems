const isMobile = typeof window !== 'undefined' && window.innerWidth < 768;

<aside className={`dashboard-sidebar ${sidebarOpen ? 'open' : 'closed'}`} style={isMobile ? { width: sidebarOpen ? '80vw' : 0, zIndex: 2000, position: 'fixed', left: 0, top: 0, height: '100vh', background: '#1a237e', transition: 'width 0.3s' } : {}}>
  <div className="sidebar-header" style={{ position: 'relative' }}>
    <h2 className="sidebar-logo">Ventas MVP</h2>
    {isMobile && (
      <button
        onClick={toggleSidebar}
        style={{ position: 'absolute', top: 12, right: 12, background: 'none', border: 'none', color: '#fff', fontSize: 28, zIndex: 2100 }}
        aria-label="Cerrar menú"
      >
        {sidebarOpen ? '✖' : '☰'}
      </button>
    )}
  </div>
  {/* ...resto sidebar... */}
</aside>
{isMobile && sidebarOpen && (
  <div onClick={toggleSidebar} style={{ position: 'fixed', left: 0, top: 0, width: '100vw', height: '100vh', background: 'rgba(0,0,0,0.4)', zIndex: 1999 }} />
)} 