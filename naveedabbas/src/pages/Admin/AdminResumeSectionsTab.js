import { Link } from 'react-router-dom';

function ListSectionBlock({
  title,
  icon,
  badgeColor,
  items,
  newValue,
  setNewValue,
  editingId,
  editText,
  setEditText,
  onAdd,
  onSaveEdit,
  onCancelEdit,
  onEdit,
  onDelete,
  onDragStart,
  onDragOver,
  onDrop,
  placeholder,
  emptyMessage,
}) {
  return (
    <div className="glass admin-resume-block" style={{ marginBottom: 20, padding: 24 }}>
      <div className="admin-inline-row" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 700, color: '#fff' }}>
          {icon} {title}
        </h4>
        <span className="badge" style={badgeColor}>
          {items.length} {items.length === 1 ? 'item' : 'items'}
        </span>
      </div>
      <div className="admin-inline-row" style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 16, flexWrap: 'wrap' }}>
        <input value={newValue} placeholder={placeholder} onChange={(e) => setNewValue(e.target.value)} style={{ flex: 1 }} />
        <button className="btn" onClick={onAdd} disabled={!newValue.trim()}>
          Add Item
        </button>
      </div>
      <div style={{ marginTop: 12 }}>
        {items.length === 0 ? (
          <div
            style={{
              padding: 16,
              textAlign: 'center',
              background: 'rgba(255,255,255,0.01)',
              borderRadius: 8,
              border: '1px dashed rgba(255,255,255,0.1)',
            }}
          >
            <p className="muted" style={{ margin: 0 }}>
              {emptyMessage}
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
            {items.map((item, idx) => (
              <div
                key={item.id}
                className="admin-list-item"
                draggable
                onDragStart={(e) => onDragStart(e, item.id)}
                onDragOver={onDragOver}
                onDrop={(e) => onDrop(e, item.id)}
              >
                {editingId === item.id ? (
                  <div className="admin-inline-row" style={{ display: 'flex', gap: 8, alignItems: 'center', width: '100%', flexWrap: 'wrap' }}>
                    <input value={editText} onChange={(e) => setEditText(e.target.value)} style={{ flex: 1 }} />
                    <button className="btn" onClick={() => onSaveEdit(item.id)}>
                      Save
                    </button>
                    <button className="btn secondary" onClick={onCancelEdit}>
                      Cancel
                    </button>
                  </div>
                ) : (
                  <>
                    <div style={{ display: 'flex', gap: 12, alignItems: 'center', flex: 1 }}>
                      <span style={{ opacity: 0.5, fontSize: '1.2rem', cursor: 'grab' }}>☰</span>
                      <span style={{ fontSize: '0.85rem', color: 'var(--muted)', minWidth: 24 }}>#{idx + 1}</span>
                      <div style={{ flex: 1, fontWeight: 500 }}>{item.text}</div>
                    </div>
                    <div className="admin-inline-actions" style={{ display: 'flex', gap: 8 }}>
                      <button className="btn secondary" onClick={() => onEdit(item)}>
                        Edit
                      </button>
                      <button className="btn danger" onClick={() => onDelete(item.id)}>
                        Delete
                      </button>
                    </div>
                  </>
                )}
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

export default function AdminResumeSectionsTab({
  resumeVisibilityNode,
  specializationVisibilityNode,
  educationVisibilityNode,
  awardsVisibilityNode,
  specializationItems,
  newSpecialization,
  setNewSpecialization,
  editingSpecId,
  setEditingSpecId,
  editSpecText,
  setEditSpecText,
  educationItems,
  newEducation,
  setNewEducation,
  editingEduId,
  setEditingEduId,
  editEduText,
  setEditEduText,
  awardsItems,
  newAward,
  setNewAward,
  editingAwardId,
  setEditingAwardId,
  editAwardText,
  setEditAwardText,
  addListItem,
  saveEditedListItem,
  deleteListItem,
  onListDragStart,
  onListDragOver,
  onListDrop,
  fetchSpecialization,
  fetchEducation,
  fetchAwards,
  setSpecializationItems,
  setEducationItems,
  setAwardsItems,
}) {
  return (
    <div className="admin-tab-section admin-resume-tab">
      <div style={{ marginBottom: 24 }}>
        <h3 style={{ marginBottom: 8 }}>Resume Sections Management</h3>
        {resumeVisibilityNode}
        <p className="lead" style={{ marginBottom: 4 }}>
          Manage list items for Specialization, Education, and Scholarships/Awards. These collections are displayed on
          the <Link to="/resume" style={{ color: 'var(--accent-2)', textDecoration: 'none' }}>Resume</Link> page and{' '}
          <Link to="/about" style={{ color: 'var(--accent-2)', textDecoration: 'none' }}>About</Link> page.
        </p>
        <p style={{ fontSize: '0.85rem', color: 'var(--muted)', marginTop: 8 }}>
          💡 Drag items to reorder them. Changes appear instantly on your portfolio.
        </p>
      </div>

      <p style={{ margin: '8px 0', fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>
        Visibility Controls
      </p>
      {specializationVisibilityNode}
      <ListSectionBlock
        title="Specialization"
        icon="🎯"
        badgeColor={{ backgroundColor: 'rgba(16,185,129,0.2)', color: 'var(--accent)' }}
        items={specializationItems}
        newValue={newSpecialization}
        setNewValue={setNewSpecialization}
        editingId={editingSpecId}
        editText={editSpecText}
        setEditText={setEditSpecText}
        onAdd={() => addListItem('specialization', newSpecialization, specializationItems.length)}
        onSaveEdit={(id) => saveEditedListItem('specialization', id, editSpecText)}
        onCancelEdit={() => {
          setEditingSpecId(null);
          setEditSpecText('');
        }}
        onEdit={(item) => {
          setEditingSpecId(item.id);
          setEditSpecText(item.text || '');
        }}
        onDelete={(id) => deleteListItem('specialization', id)}
        onDragStart={onListDragStart}
        onDragOver={onListDragOver}
        onDrop={(e, id) =>
          onListDrop(e, id, 'specialization', specializationItems, setSpecializationItems, fetchSpecialization)
        }
        placeholder="e.g., Web development (HTML, CSS, JavaScript, Bootstrap, Laravel)"
        emptyMessage="No specialization items yet. Add your first item above."
      />

      <p style={{ margin: '8px 0', fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>
        Visibility Controls
      </p>
      {educationVisibilityNode}
      <ListSectionBlock
        title="Education"
        icon="🎓"
        badgeColor={{ backgroundColor: 'rgba(6,182,212,0.2)', color: 'var(--accent-2)' }}
        items={educationItems}
        newValue={newEducation}
        setNewValue={setNewEducation}
        editingId={editingEduId}
        editText={editEduText}
        setEditText={setEditEduText}
        onAdd={() => addListItem('education', newEducation, educationItems.length)}
        onSaveEdit={(id) => saveEditedListItem('education', id, editEduText)}
        onCancelEdit={() => {
          setEditingEduId(null);
          setEditEduText('');
        }}
        onEdit={(item) => {
          setEditingEduId(item.id);
          setEditEduText(item.text || '');
        }}
        onDelete={(id) => deleteListItem('education', id)}
        onDragStart={onListDragStart}
        onDragOver={onListDragOver}
        onDrop={(e, id) => onListDrop(e, id, 'education', educationItems, setEducationItems, fetchEducation)}
        placeholder="e.g., Bachelor in Software Engineering — COMSATS University Islamabad, 2026"
        emptyMessage="No education items yet. Add your first item above."
      />

      <p style={{ margin: '8px 0', fontSize: '0.85rem', color: 'var(--muted)', fontWeight: 600 }}>
        Visibility Controls
      </p>
      {awardsVisibilityNode}
      <ListSectionBlock
        title="Scholarships & Awards"
        icon="🏆"
        badgeColor={{ backgroundColor: 'rgba(249,115,22,0.2)', color: '#f97316' }}
        items={awardsItems}
        newValue={newAward}
        setNewValue={setNewAward}
        editingId={editingAwardId}
        editText={editAwardText}
        setEditText={setEditAwardText}
        onAdd={() => addListItem('awards', newAward, awardsItems.length)}
        onSaveEdit={(id) => saveEditedListItem('awards', id, editAwardText)}
        onCancelEdit={() => {
          setEditingAwardId(null);
          setEditAwardText('');
        }}
        onEdit={(item) => {
          setEditingAwardId(item.id);
          setEditAwardText(item.text || '');
        }}
        onDelete={(id) => deleteListItem('awards', id)}
        onDragStart={onListDragStart}
        onDragOver={onListDragOver}
        onDrop={(e, id) => onListDrop(e, id, 'awards', awardsItems, setAwardsItems, fetchAwards)}
        placeholder="e.g., Admission to Daanish school on merit with seven years scholarship"
        emptyMessage="No awards yet. Add your first item above."
      />
    </div>
  );
}
