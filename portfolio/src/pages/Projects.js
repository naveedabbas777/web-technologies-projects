import { useState } from "react";
import { Container, Row, Col, Card } from "react-bootstrap";
import db from "../firebase";
import useFirestoreDoc from "../hooks/useFirestoreDoc";
import useFirestoreCollection from "../hooks/useFirestoreCollection";
import { getTextPreview } from "../utils/textUtils";

function Projects() {
  const [expandedProjectIds, setExpandedProjectIds] = useState({});
  const { data: sectionVisibility = {} } = useFirestoreDoc({ db, path: ['settings', 'sectionVisibility'], defaultValue: {} });
  const { data: projects = [] } = useFirestoreCollection({ db, collectionPath: 'projects', orderField: 'order', defaultValue: [] });

  const showOnSite = sectionVisibility.projects?.showOnSite ?? true;

  return (
    <Container fluid className="py-5 px-4 px-md-5" style={{ minHeight: 'calc(100vh - var(--nav-height) - 180px)' }}>
      <div className="mb-4 fade-in">
        <h2 className="mb-3" style={{ fontSize: '2.5rem', fontWeight: 700, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          My Projects
        </h2>
        <p className="lead">A snapshot of the work I've built and shipped.</p>
      </div>

      {!showOnSite ? (
        <div className="glass text-center p-5 fade-in">
          <p className="mb-0 text-muted">This section is currently hidden.</p>
        </div>
      ) : projects.length === 0 ? (
        <div className="glass text-center p-5 fade-in">
          <p className="mb-0 text-muted">No projects yet — add one from the Admin panel.</p>
        </div>
      ) : (
        <Row className="g-4 fade-in">
          {projects.map(project => {
            const previewInfo = getTextPreview(project.description, 2);
            const previewText = previewInfo.preview;
            const isExpanded = expandedProjectIds[project.id];

            return (
              <Col key={project.id} xs={12} sm={6} md={6} lg={4} xl={3}>
                <Card className="glass project-card h-100 border-0 overflow-hidden">
                  <div
                    className="project-card-hero"
                    style={project.imageUrl ? { backgroundImage: `url(${project.imageUrl})` } : {}}
                  >
                    <div className="project-card-hero-overlay">
                      <div className="project-card-hero-title">
                        {project.title}
                      </div>
                      {project.category && (
                        <div className="project-card-hero-category">
                          {project.category}
                        </div>
                      )}
                      {(project.liveUrl || project.link) && (
                        <a
                          href={project.liveUrl || project.link}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm project-card-hero-button"
                        >
                          View Project →
                        </a>
                      )}
                      {project.repoUrl && (
                        <a
                          href={project.repoUrl}
                          target="_blank"
                          rel="noreferrer"
                          className="btn btn-sm project-card-hero-button"
                          style={{ marginLeft: 8 }}
                        >
                          View Code
                        </a>
                      )}
                    </div>
                  </div>
                  <Card.Body>
                    {project.description ? (
                      <>
                        <p className="project-preview-desc" style={{ whiteSpace: 'pre-line' }}>
                          {isExpanded ? project.description : previewText}
                        </p>
                        {previewInfo.isTruncated && (
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
                    {project.technologies ? (
                      <p className="text-muted mb-0" style={{ fontSize: '0.95rem' }}>
                        <strong>Tech:</strong> {project.technologies}
                      </p>
                    ) : null}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      )}
    </Container>
  );
}

export default Projects;
