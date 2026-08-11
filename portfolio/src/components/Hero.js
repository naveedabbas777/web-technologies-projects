import { useEffect, useMemo, useState } from "react";
import { Link } from "react-router-dom";
import db from "../firebase";
import { doc, onSnapshot, collection, query, orderBy, limit } from "firebase/firestore";
import { getTextPreview } from "../utils/textUtils";

function Hero() {
  const [siteProfileImage, setSiteProfileImage] = useState(null);
  const [profile, setProfile] = useState(null);
  const [skills, setSkills] = useState([]);
  const [workExperience, setWorkExperience] = useState([]);
  const [workExperienceFallback, setWorkExperienceFallback] = useState([]);
  const [recentProjects, setRecentProjects] = useState([]);
  const [expandedProjectIds, setExpandedProjectIds] = useState({});

  useEffect(() => {
    const ref = doc(db, 'settings', 'profile');
    const unsub = onSnapshot(ref, (snap) => {
      if (!snap.exists()) {
        setSiteProfileImage(null);
        setProfile(null);
        return;
      }
      const data = snap.data();
      setSiteProfileImage(data.imageUrl || null);
      setProfile(data);
    }, (err) => console.warn('profile onSnapshot error', err));
    return () => unsub();
  }, []);

  useEffect(() => {
    // Get all skills (ordered by `order`)
    const q = query(collection(db, 'skills'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('skills onSnapshot error', err));
    return () => unsub();
  }, []);

  useEffect(() => {
    // Prefer /workExperience. If empty, show /achievements as a fallback so Home isn't blank.
    const q = query(collection(db, 'workExperience'), orderBy('order', 'asc'));
    const unsub = onSnapshot(
      q,
      (snap) => setWorkExperience(snap.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err) => {
        console.warn('workExperience onSnapshot error', err);
        setWorkExperience([]);
      }
    );

    const q2 = query(collection(db, 'achievements'), orderBy('order', 'asc'), limit(4));
    const unsub2 = onSnapshot(
      q2,
      (snap2) => setWorkExperienceFallback(snap2.docs.map(d => ({ id: d.id, ...d.data() }))),
      (err2) => console.warn('achievements fallback onSnapshot error', err2)
    );

    return () => { unsub(); unsub2(); };
  }, []);

  useEffect(() => {
    // Get recent 3 projects
    const q = query(collection(db, 'projects'), orderBy('order', 'asc'), limit(3));
    const unsub = onSnapshot(q, (snap) => {
      setRecentProjects(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('projects onSnapshot error', err));
    return () => unsub();
  }, []);

  const display = (value, fallback = '') => (value || fallback);
  const name = display(profile?.name, 'Naveed Abbas');
  const bio = display(profile?.bio, 'A passionate Software Engineer who thrives on crafting robust, high-performance applications. With real-world experience from internships and personal projects, I specialize in Flutter, MERN Stack, and Firebase—turning complex challenges into clean, scalable solutions.');
  const effectiveWorkExperience = workExperience.length > 0 ? workExperience : workExperienceFallback;

  // Skill icons mapping (you can customize these)
  const getSkillIcon = (skillName) => {
    const name = skillName.toLowerCase();
    if (name.includes('flutter') || name.includes('dart')) return '🎯';
    if (name.includes('react') || name.includes('mern')) return '⚛️';
    if (name.includes('firebase')) return '🔥';
    if (name.includes('javascript') || name.includes('js')) return '📜';
    if (name.includes('node') || name.includes('express')) return '🟢';
    if (name.includes('mongodb') || name.includes('database')) return '🍃';
    if (name.includes('sql')) return '🗄️';
    if (name.includes('api')) return '🔌';
    if (name.includes('automation') || name.includes('ai')) return '🤖';
    return '💻';
  };

  return (
    <section className="hero-three-column">
      {/* Left Column - Profile */}
      <div className="hero-column hero-profile">
        <div className="glass hero-profile-card">
          {siteProfileImage && (
            <img 
              src={siteProfileImage} 
              alt={name} 
              className="hero-profile-image"
            />
          )}
          <h1 className="hero-name">{name}</h1>
          <p className="hero-bio">{bio}</p>
        </div>
      </div>

      {/* Middle Column - Work Experience & Skills */}
      <div className="hero-column hero-middle">
        {/* Work Experience */}
        <div className="glass hero-section-card">
          <h3 className="hero-section-title">Work Experience</h3>
          {effectiveWorkExperience.length === 0 ? (
            <p className="hero-empty">No work experience added yet.</p>
          ) : (
            <div className="work-experience-list">
              {effectiveWorkExperience.map((exp, idx) => (
                <div key={exp.id || idx} className="work-experience-item">
                  <div className="work-exp-bullet" style={{ backgroundColor: idx % 2 === 0 ? '#f97316' : '#06b6d4' }}></div>
                  <div className="work-exp-content">
                    <div className="work-exp-period">{display(exp.period, exp.year || '')}</div>
                    <div className="work-exp-title">{display(exp.title, exp.name, exp.text)}</div>
                    {exp.company && <div className="work-exp-company">{exp.company}</div>}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* My Expert Area (Skills) */}
        <div className="glass hero-section-card">
          <h3 className="hero-section-title">My Expert Area</h3>
          {skills.length === 0 ? (
            <p className="hero-empty">No skills added yet.</p>
          ) : (
            <div className="skills-grid">
              {skills.slice(0, 8).map((skill) => (
                <div key={skill.id} className="skill-badge">
                  <span className="skill-icon">{getSkillIcon(skill.name)}</span>
                  <span className="skill-name">{skill.name}</span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Right Column - Recent Projects */}
      <div className="hero-column hero-projects">
        <div className="glass hero-projects-header">
          <h3 className="hero-section-title">Recent Projects</h3>
          <Link to="/projects" className="hero-view-all">All Projects →</Link>
        </div>
        {recentProjects.length === 0 ? (
          <div className="glass hero-section-card">
            <p className="hero-empty">No projects yet — add one from the Admin panel.</p>
          </div>
        ) : (
          <div className="projects-list">
            {recentProjects.map((project) => {
              const previewInfo = getTextPreview(project.description, 2);
              const previewText = previewInfo.preview;
              const isTruncated = previewInfo.isTruncated;
              const isExpanded = expandedProjectIds[project.id];

              return (
                <div key={project.id} className="glass project-preview-card">
                  {project.imageUrl && (
                    <div className="project-preview-image">
                      <img src={project.imageUrl} alt={project.title} />
                    </div>
                  )}
                  <div className="project-preview-content">
                    <h4 className="project-preview-title">{project.title}</h4>
                    {project.category && <p className="project-preview-category">{project.category}</p>}
                    {project.description ? (
                      <>
                        <p className="project-preview-desc" style={{ whiteSpace: 'pre-line' }}>
                          {isExpanded ? project.description : previewText}
                        </p>
                        {isTruncated && (
                          <button
                            type="button"
                            className="link-button"
                            onClick={() => setExpandedProjectIds((prev) => ({ ...prev, [project.id]: !prev[project.id] }))}
                            style={{ padding: 0, border: 'none', background: 'none', color: 'var(--primary)', cursor: 'pointer' }}
                          >
                            {isExpanded ? 'Show less' : 'Read more'}
                          </button>
                        )}
                      </>
                    ) : null}
                    {project.link && (
                      <a href={project.link} target="_blank" rel="noreferrer" className="project-preview-link">
                        View Project →
                      </a>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </section>
  );
}

export default Hero;
