export default function AdminAchievementsTab({
  visibilityNode,
  achievementTitle,
  setAchievementTitle,
  achievementYear,
  setAchievementYear,
  achievements,
  loading,
  editingAchievementId,
  editAchievementTitle,
  setEditAchievementTitle,
  editAchievementYear,
  setEditAchievementYear,
  addAchievement,
  startEditAchievement,
  cancelEditAchievement,
  saveEditedAchievement,
  deleteAchievement,
  onAchievementDragStart,
  onAchievementDragOver,
  onAchievementDrop,
}) {
  return (
    <div className="admin-tab-section admin-achievements-tab">
      <h3>Achievements</h3>
      {visibilityNode}
      <div className="admin-inline-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
        <input
          value={achievementTitle}
          placeholder="Achievement title"
          onChange={(e) => setAchievementTitle(e.target.value)}
        />
        <input
          value={achievementYear}
          placeholder="Year (optional)"
          onChange={(e) => setAchievementYear(e.target.value)}
          style={{ width: 120 }}
        />
        <button className="btn" onClick={addAchievement}>
          Add Achievement
        </button>
      </div>

      <hr />
      <h4 style={{ marginTop: 8 }}>Existing Achievements</h4>
      {loading ? (
        <p>Loading…</p>
      ) : achievements.length === 0 ? (
        <p>No achievements yet</p>
      ) : (
        achievements.map((a) => (
          <div
            key={a.id}
            className="admin-item-row"
            draggable
            onDragStart={(e) => onAchievementDragStart(e, a.id)}
            onDragOver={onAchievementDragOver}
            onDrop={(e) => onAchievementDrop(e, a.id)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
              cursor: 'grab',
            }}
          >
            {editingAchievementId === a.id ? (
              <div className="admin-inline-row" style={{ flex: 1, display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input
                  value={editAchievementTitle}
                  onChange={(e) => setEditAchievementTitle(e.target.value)}
                  style={{ flex: 1 }}
                />
                <input
                  value={editAchievementYear}
                  onChange={(e) => setEditAchievementYear(e.target.value)}
                  style={{ width: 120 }}
                />
                <div className="admin-inline-actions">
                  <button className="btn" onClick={saveEditedAchievement}>
                    Save
                  </button>
                  <button className="btn" onClick={cancelEditAchievement} style={{ marginLeft: 8 }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                  <span style={{ opacity: 0.6, marginRight: 8 }}>≡</span>
                  <div>
                    {a.title} {a.year ? `— ${a.year}` : ''}
                  </div>
                </div>
                <div className="admin-inline-actions">
                  <button className="btn" onClick={() => startEditAchievement(a)} style={{ marginLeft: 8 }}>
                    Edit
                  </button>
                  <button onClick={() => deleteAchievement(a.id)} style={{ marginLeft: 8 }}>
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
