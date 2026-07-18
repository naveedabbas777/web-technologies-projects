export default function AdminSkillsTab({
  visibilityNode,
  skillName,
  setSkillName,
  skillLevel,
  setSkillLevel,
  skillDetails,
  setSkillDetails,
  skills,
  loading,
  editingSkillId,
  editSkillName,
  setEditSkillName,
  editSkillLevel,
  setEditSkillLevel,
  editSkillDetails,
  setEditSkillDetails,
  addSkill,
  startEditSkill,
  cancelEditSkill,
  saveEditedSkill,
  deleteSkill,
  onSkillDragStart,
  onSkillDragOver,
  onSkillDrop,
}) {
  return (
    <div className="admin-tab-section admin-skills-tab">
      <h3>Skills</h3>
      {visibilityNode}
      <div className="admin-inline-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input value={skillName} placeholder="Skill name" onChange={(e) => setSkillName(e.target.value)} />
        <input
          value={skillLevel}
          placeholder="Level (e.g., Intermediate)"
          onChange={(e) => setSkillLevel(e.target.value)}
          style={{ width: 180 }}
        />
      </div>
      <textarea
        value={skillDetails}
        placeholder="Skill details / experience (optional)"
        rows={3}
        onChange={(e) => setSkillDetails(e.target.value)}
        style={{ marginTop: 8 }}
      />
      <div className="admin-inline-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap', marginTop: 8 }}>
        <button className="btn" onClick={addSkill}>
          Add Skill
        </button>
      </div>

      <hr />
      <h4 style={{ marginTop: 8 }}>Existing Skills</h4>
      {loading ? (
        <p>Loading…</p>
      ) : skills.length === 0 ? (
        <p>No skills yet</p>
      ) : (
        skills.map((s) => (
          <div
            key={s.id}
            className="admin-item-row"
            draggable
            onDragStart={(e) => onSkillDragStart(e, s.id)}
            onDragOver={onSkillDragOver}
            onDrop={(e) => onSkillDrop(e, s.id)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
              cursor: 'grab',
            }}
          >
            {editingSkillId === s.id ? (
              <div className="admin-edit-grid" style={{ flex: 1, display: 'grid', gap: 8 }}>
                <div className="admin-inline-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                  <input value={editSkillName} onChange={(e) => setEditSkillName(e.target.value)} style={{ flex: 1 }} />
                  <input
                    value={editSkillLevel}
                    onChange={(e) => setEditSkillLevel(e.target.value)}
                    style={{ width: 180 }}
                  />
                </div>
                <textarea
                  value={editSkillDetails}
                  onChange={(e) => setEditSkillDetails(e.target.value)}
                  placeholder="Skill details / experience"
                  rows={3}
                />
                <div className="admin-inline-actions">
                  <button className="btn" onClick={saveEditedSkill}>
                    Save
                  </button>
                  <button className="btn" onClick={cancelEditSkill} style={{ marginLeft: 8 }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ opacity: 0.6, marginRight: 8 }}>≡</span>
                  <div>
                    <div>
                      {s.name} {s.level ? <span style={{ color: '#9ca3af' }}>— {s.level}</span> : null}
                    </div>
                    {s.details ? <div style={{ fontSize: '0.85rem', color: '#94a3b8', marginTop: 4 }}>{s.details}</div> : null}
                  </div>
                </div>
                <div className="admin-inline-actions">
                  <button className="btn" onClick={() => startEditSkill(s)} style={{ marginLeft: 8 }}>
                    Edit
                  </button>
                  <button onClick={() => deleteSkill(s.id)} style={{ marginLeft: 8 }}>
                    Delete
                  </button>
                </div>
              </>
            )}
          </div>
        ))
      )}
    </div>
  );
}
