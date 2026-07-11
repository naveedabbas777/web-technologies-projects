export default function AdminMessagesTab({
  messages,
  messageFilter,
  setMessageFilter,
  loading,
  exportMessagesCSV,
  markAllRead,
  toggleMessageRead,
  deleteMessage,
}) {
  const filtered = messages.filter((m) => {
    if (!messageFilter) return true;
    const q = messageFilter.toLowerCase();
    return (
      (m.name || '').toLowerCase().includes(q) ||
      (m.email || '').toLowerCase().includes(q) ||
      (m.message || '').toLowerCase().includes(q)
    );
  });

  const sorted = [...filtered].sort((a, b) => {
    if (!!a.read !== !!b.read) return a.read ? 1 : -1;
    const aTime = a.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
    const bTime = b.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
    return bTime - aTime;
  });

  const unreadCount = sorted.filter((m) => !m.read).length;

  const getInitials = (name) => {
    const n = (name || '').trim();
    if (!n) return 'NA';
    return n
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0]?.toUpperCase())
      .join('');
  };

  return (
    <div className="admin-tab-section admin-messages-tab">
      <h3>Contact messages</h3>
      <p className="muted" style={{ marginBottom: 6 }}>
        Prioritized by unread first for faster response workflow.
      </p>

      <div className="admin-message-summary">
        <span className="admin-message-pill">Total: {sorted.length}</span>
        <span className="admin-message-pill unread">Unread: {unreadCount}</span>
      </div>

      <div className="admin-inline-row admin-message-toolbar" style={{ display: 'flex', gap: 8, marginBottom: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          placeholder="Search by name, email, or message"
          value={messageFilter}
          onChange={(e) => setMessageFilter(e.target.value)}
          style={{ flex: 1 }}
        />
        <button className="btn secondary admin-msg-btn" onClick={exportMessagesCSV}>
          Export CSV
        </button>
        <button className="btn admin-msg-btn" onClick={markAllRead}>
          Mark all read
        </button>
      </div>

      {loading ? (
        <div className="message-card admin-message-empty">Loading messages…</div>
      ) : sorted.length === 0 ? (
        <div className="message-card admin-message-empty">
          No messages match your search.
        </div>
      ) : (
        sorted.map((m) => (
          <div key={m.id} className={`message-card ${m.read ? 'read' : 'unread'}`}>
            <div className="admin-message-card-row" style={{ display: 'flex', justifyContent: 'space-between', gap: 12 }}>
              <div className="admin-message-main" style={{ flex: 1 }}>
                <div className="admin-message-head">
                  <div className="admin-message-avatar">{getInitials(m.name)}</div>
                  <div>
                    <div className="admin-message-name">{m.name || 'Unknown sender'}</div>
                    <a
                      className="admin-message-email"
                      href={m.email ? `mailto:${m.email}` : undefined}
                      onClick={(e) => {
                        if (!m.email) e.preventDefault();
                      }}
                    >
                      {m.email || 'No email provided'}
                    </a>
                  </div>
                </div>

                <div className="admin-message-meta">
                  <span className={`admin-message-state ${m.read ? 'read' : 'unread'}`}>
                    {m.read ? 'Read' : 'Unread'}
                  </span>
                  <span className="admin-message-time">
                  {m.createdAt?.toDate ? m.createdAt.toDate().toLocaleString() : ''}
                  </span>
                </div>

                <div className="admin-message-body" style={{ marginTop: 8, whiteSpace: 'pre-wrap' }}>
                  {m.message || '—'}
                </div>
              </div>
              <div className="admin-inline-actions" style={{ display: 'flex', alignItems: 'start', flexDirection: 'column', gap: 8 }}>
                <button onClick={() => toggleMessageRead(m.id, !m.read)} className="btn secondary admin-msg-btn">
                  {m.read ? 'Mark unread' : 'Mark read'}
                </button>
                <button onClick={() => deleteMessage(m.id)} className="btn danger admin-msg-btn">
                  Delete
                </button>
              </div>
            </div>
          </div>
        ))
      )}
    </div>
  );
}
