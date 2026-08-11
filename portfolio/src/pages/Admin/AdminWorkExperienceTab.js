export default function AdminWorkExperienceTab({
  visibilityNode,
  workExpTitle,
  setWorkExpTitle,
  workExpPeriod,
  setWorkExpPeriod,
  workExpCompany,
  setWorkExpCompany,
  workExperience,
  loading,
  editingWorkExpId,
  editWorkExpTitle,
  setEditWorkExpTitle,
  editWorkExpPeriod,
  setEditWorkExpPeriod,
  editWorkExpCompany,
  setEditWorkExpCompany,
  addWorkExperience,
  startEditWorkExperience,
  cancelEditWorkExperience,
  saveEditedWorkExperience,
  deleteWorkExperience,
  onWorkExpDragStart,
  onWorkExpDragOver,
  onWorkExpDrop,
}) {
  return (
    <div className="admin-tab-section admin-work-tab">
      <h3>Work Experience</h3>
      {visibilityNode}
      <div className="admin-inline-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={workExpTitle}
          placeholder="Job title / Position"
          onChange={(e) => setWorkExpTitle(e.target.value)}
          style={{ flex: 1, minWidth: 200 }}
        />
        <input
          value={workExpPeriod}
          placeholder="Period (e.g., 2023-2024)"
          onChange={(e) => setWorkExpPeriod(e.target.value)}
          style={{ width: 180 }}
        />
        <input
          value={workExpCompany}
          placeholder="Company (optional)"
          onChange={(e) => setWorkExpCompany(e.target.value)}
          style={{ width: 220 }}
        />
        <button className="btn" onClick={addWorkExperience}>Add Work Experience</button>
      </div>

      <hr />
      <h4 style={{ marginTop: 8 }}>Existing Work Experience</h4>
      {loading ? (
        <p>Loading…</p>
      ) : workExperience.length === 0 ? (
        <p>No work experience yet</p>
      ) : (
        workExperience.map((we) => (
          <div
            key={we.id}
            className="admin-item-row"
            draggable
            onDragStart={(e) => onWorkExpDragStart(e, we.id)}
            onDragOver={onWorkExpDragOver}
            onDrop={(e) => onWorkExpDrop(e, we.id)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
              cursor: 'grab',
            }}
          >
            {editingWorkExpId === we.id ? (
              <div className="admin-inline-row" style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  value={editWorkExpTitle}
                  onChange={(e) => setEditWorkExpTitle(e.target.value)}
                  placeholder="Title"
                  style={{ flex: 1, minWidth: 200 }}
                />
                <input
                  value={editWorkExpPeriod}
                  onChange={(e) => setEditWorkExpPeriod(e.target.value)}
                  placeholder="Period"
                  style={{ width: 180 }}
                />
                <input
                  value={editWorkExpCompany}
                  onChange={(e) => setEditWorkExpCompany(e.target.value)}
                  placeholder="Company"
                  style={{ width: 220 }}
                />
                <div className="admin-inline-actions">
                  <button className="btn" onClick={saveEditedWorkExperience}>Save</button>
                  <button className="btn secondary" onClick={cancelEditWorkExperience} style={{ marginLeft: 8 }}>Cancel</button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ opacity: 0.6, marginRight: 8 }}>≡</span>
                  <div>
                    {we.title || we.name || we.text}
                    {we.period ? ` — ${we.period}` : we.year ? ` — ${we.year}` : ''}
                    {we.company ? ` @ ${we.company}` : ''}
                  </div>
                </div>
                <div className="admin-inline-actions">
                  <button className="btn" onClick={() => startEditWorkExperience(we)} style={{ marginLeft: 8 }}>Edit</button>
                  <button onClick={() => deleteWorkExperience(we.id)} style={{ marginLeft: 8 }}>Delete</button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
