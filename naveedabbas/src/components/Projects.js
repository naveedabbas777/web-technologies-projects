import { useEffect, useState } from "react";
import db from "../firebase.js";
import { collection, query, orderBy, onSnapshot } from "firebase/firestore";

function Projects() {
  const [projects, setProjects] = useState([]);

  useEffect(() => {
    const q = query(collection(db, "projects"), orderBy("title", "asc"));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setProjects(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });

    return () => unsubscribe();
  }, []);

  return (
    <section
      style={{
        padding: '32px 10% 40px',
        minHeight: 'calc(100vh - var(--nav-height) - 180px)',
        display: 'flex',
        flexDirection: 'column',
        gap: 16,
      }}
    >
      <div style={{ marginBottom: 8 }}>
        <h2 style={{ margin: 0, fontSize: '1.9rem' }}>My Projects</h2>
        <p className="lead" style={{ marginTop: 4 }}>A snapshot of the work I’ve built and shipped.</p>
      </div>

      {projects.length === 0 ? (
        <div className="glass" style={{ textAlign: 'center', padding: 24 }}>
          <p style={{ margin: 0 }}>No projects yet — add one from the Admin panel.</p>
        </div>
      ) : (
        <div
          style={{
            display: 'grid',
            gap: 18,
            gridTemplateColumns: 'repeat(auto-fit,minmax(240px,1fr))',
          }}
        >
          {projects.map(project => (
            <div key={project.id} className="glass project-card">
              <h3 style={{ marginTop: 0 }}>{project.title}</h3>
              {project.category && <p style={{ marginBottom: 0, opacity: 0.8 }}>{project.category}</p>}
            </div>
          ))}
        </div>
      )}
    </section>
  );
}

export default Projects;
