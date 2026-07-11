import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import db from "../firebase";
import useFirestoreDoc from "../hooks/useFirestoreDoc";
import useFirestoreCollection from "../hooks/useFirestoreCollection";

function Hero() {
  const [siteProfileImage, setSiteProfileImage] = useState(null);
  const { data: sectionVisibility = {} } = useFirestoreDoc({ db, path: ['settings', 'sectionVisibility'], defaultValue: {} });
  const { data: profile = null } = useFirestoreDoc({ db, path: ['settings', 'profile'], defaultValue: null });
  const { data: skills = [] } = useFirestoreCollection({ db, collectionPath: 'skills', orderField: 'order', defaultValue: [] });
  const { data: workExperience = [] } = useFirestoreCollection({ db, collectionPath: 'workExperience', orderField: 'order', defaultValue: [] });
  const { data: workExperienceFallback = [] } = useFirestoreCollection({ db, collectionPath: 'achievements', orderField: 'order', limitCount: 4, defaultValue: [] });
  const { data: recentProjects = [] } = useFirestoreCollection({ db, collectionPath: 'projects', orderField: 'order', limitCount: 5, defaultValue: [] });

  useEffect(() => {
    setSiteProfileImage(profile?.imageUrl || null);
  }, [profile]);

  const display = (value, fallback = '') => (value || fallback);
  const name = display(profile?.name, 'Naveed Abbas');
  const bio = display(profile?.bio, 'A passionate Software Engineer who thrives on crafting robust, high-performance applications. With real-world experience from internships and personal projects, I specialize in Flutter, MERN Stack, and Firebase—turning complex challenges into clean, scalable solutions.');
  const effectiveWorkExperience = workExperience.length > 0 ? workExperience : workExperienceFallback;

  const getSkillIcon = (skillName) => {
    const n = skillName.toLowerCase();
    if (n.includes('flutter') || n.includes('dart')) return '🎯';
    if (n.includes('react') || n.includes('mern')) return '⚛️';
    if (n.includes('firebase')) return '🔥';
    if (n.includes('javascript') || n.includes('js')) return '📜';
    if (n.includes('node') || n.includes('express')) return '🟢';
    if (n.includes('mongodb') || n.includes('database')) return '🍃';
    if (n.includes('sql')) return '🗄️';
    if (n.includes('api')) return '🔌';
    if (n.includes('automation') || n.includes('ai')) return '🤖';
    return '💻';
  };

  return (
    <section className="hero-three-column">
      <div className="hero-column hero-profile">
        <div className="glass hero-profile-card">
          {siteProfileImage && <img src={siteProfileImage} alt={name} className="hero-profile-image" />}
          <h1 className="hero-name">{name}</h1>
          <p className="hero-bio">{bio}</p>
        </div>
      </div>

      <div className="hero-column hero-middle">
        {(sectionVisibility.workExperience?.showOnSite ?? true) && (
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
        )}

        {(sectionVisibility.skills?.showOnSite ?? true) && (
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
        )}
      </div>

      <div className="hero-column hero-projects">
        {(sectionVisibility.projects?.showOnSite ?? true) && (
          <div className="glass hero-projects-wrapper">
            <div className="hero-projects-header">
              <h3 className="hero-section-title">Top Projects</h3>
              <Link to="/projects" className="hero-view-all">All Projects →</Link>
            </div>
            {recentProjects.length === 0 ? (
              <p className="hero-empty">No projects yet — add one from the Admin panel.</p>
            ) : (
              <div className="projects-list">
                {recentProjects.slice(0, 5).map((project) => (
                  <div key={project.id} className="project-preview-card">
                    {project.imageUrl && (
                      <div className="project-preview-image">
                        <img src={project.imageUrl} alt={project.title} />
                      </div>
                    )}
                    <div className="project-preview-content">
                      <h4 className="project-preview-title">{project.title}</h4>
                      {project.category && <p className="project-preview-category">{project.category}</p>}
                      {project.link ? (
                        <a href={project.link} target="_blank" rel="noreferrer" className="btn btn-sm project-preview-btn">
                          View Project →
                        </a>
                      ) : (
                        <span className="project-preview-no-link">No link</span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </section>
  );
}

export default Hero;
