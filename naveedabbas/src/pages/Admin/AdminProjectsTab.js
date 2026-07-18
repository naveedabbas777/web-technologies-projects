import { Link } from 'react-router-dom';
import { normalizeImageUrl } from '../../utils';

export default function AdminProjectsTab({
  visibilityNode,
  title,
  setTitle,
  category,
  setCategory,
  projectImageUrl,
  setProjectImageUrl,
  projectImageFile,
  setProjectImageFile,
  projectDescription,
  setProjectDescription,
  projectTechnologies,
  setProjectTechnologies,
  projectLink,
  setProjectLink,
  projectRepoLink,
  setProjectRepoLink,
  projects,
  loading,
  editingProjectId,
  editTitle,
  setEditTitle,
  editCategory,
  setEditCategory,
  editProjectImageUrl,
  setEditProjectImageUrl,
  editProjectImageFile,
  setEditProjectImageFile,
  editProjectDescription,
  setEditProjectDescription,
  editProjectTechnologies,
  setEditProjectTechnologies,
  editProjectLink,
  setEditProjectLink,
  editProjectRepoLink,
  setEditProjectRepoLink,
  addProject,
  startEditProject,
  cancelEditProject,
  saveEditedProject,
  deleteProject,
}) {
  return (
    <div className="admin-tab-section admin-projects-tab">
      <h3>Projects</h3>
      {visibilityNode}
      <input value={title} placeholder="Project Title" onChange={(e) => setTitle(e.target.value)} />
      <input value={category} placeholder="Category" onChange={(e) => setCategory(e.target.value)} />
      <input
        value={projectImageUrl}
        placeholder="Image URL (optional)"
        onChange={(e) => setProjectImageUrl(e.target.value)}
      />
      <input type="file" accept="image/*" onChange={(e) => setProjectImageFile && setProjectImageFile(e.target.files[0])} />
      <textarea
        value={projectDescription}
        placeholder="Project description (use multiple lines for details)"
        rows={4}
        onChange={(e) => setProjectDescription(e.target.value)}
      />
      <input
        value={projectTechnologies}
        placeholder="Tools / Technologies (comma-separated)"
        onChange={(e) => setProjectTechnologies(e.target.value)}
      />
      <input
        value={projectRepoLink}
        placeholder="GitHub repo link (optional)"
        onChange={(e) => setProjectRepoLink(e.target.value)}
      />
      <input
        value={projectLink}
        placeholder="Project link (optional)"
        onChange={(e) => setProjectLink(e.target.value)}
      />
      <div className="admin-project-actions" style={{ marginTop: 12 }}>
        <button onClick={addProject} className="btn">
          Add Project
        </button>
        <Link to="/projects" style={{ marginLeft: 12 }} className="btn">
          View Projects
        </Link>
      </div>

      <hr />

      <h4 style={{ marginTop: 8 }}>Existing Projects</h4>
      {loading ? (
        <p>Loading…</p>
      ) : projects.length === 0 ? (
        <p>No projects yet</p>
      ) : (
        projects.map((p) => (
          <div
            key={p.id}
            className="admin-item-row"
            draggable
            onDragStart={(e) => onProjectDragStart(e, p.id)}
            onDragOver={onProjectDragOver}
            onDrop={(e) => onProjectDrop(e, p.id)}
            style={{
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center',
              marginTop: 8,
              cursor: 'grab',
            }}
          >
            {editingProjectId === p.id ? (
              <div className="admin-edit-grid" style={{ flex: 1, display: 'grid', gap: 8 }}>
                <div className="admin-inline-row" style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
                <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)} style={{ flex: 1 }} />
                <input value={editCategory} onChange={(e) => setEditCategory(e.target.value)} style={{ width: 140 }} />
                </div>
                <input
                  value={editProjectImageUrl}
                  onChange={(e) => setEditProjectImageUrl(e.target.value)}
                  placeholder="Image URL"
                />
                <input type="file" accept="image/*" onChange={(e) => setEditProjectImageFile && setEditProjectImageFile(e.target.files[0])} />
                <textarea
                  value={editProjectDescription}
                  onChange={(e) => setEditProjectDescription(e.target.value)}
                  placeholder="Project description"
                  rows={4}
                />
                <input
                  value={editProjectTechnologies}
                  onChange={(e) => setEditProjectTechnologies(e.target.value)}
                  placeholder="Tools / Technologies"
                />
                <input
                  value={editProjectRepoLink}
                  onChange={(e) => setEditProjectRepoLink(e.target.value)}
                  placeholder="GitHub repo link"
                />
                <input
                  value={editProjectLink}
                  onChange={(e) => setEditProjectLink(e.target.value)}
                  placeholder="Project link"
                />
                <div className="admin-inline-actions">
                  <button onClick={saveEditedProject} className="btn">
                    Save
                  </button>
                  <button onClick={cancelEditProject} className="btn" style={{ marginLeft: 8 }}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                  {p.imageUrl ? (
                    <img
                      src={normalizeImageUrl(p.imageUrl)}
                      alt={p.title}
                      style={{ width: 56, height: 40, objectFit: 'cover', borderRadius: 6 }}
                    />
                  ) : null}
                  <div>
                    {p.title} — {p.category} {(p.liveUrl || p.link) ? <span className="muted">— 🔗</span> : null} {p.repoUrl ? <span className="muted"> — GH</span> : null}
                  </div>
                </div>
                <div className="admin-inline-actions">
                  <button onClick={() => startEditProject(p)} style={{ marginLeft: 8 }}>
                    Edit
                  </button>
                  <button onClick={() => deleteProject(p.id)} style={{ marginLeft: 8 }}>
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
