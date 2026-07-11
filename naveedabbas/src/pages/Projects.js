import { Container, Row, Col, Card } from "react-bootstrap";
import db from "../firebase";
import useFirestoreDoc from "../hooks/useFirestoreDoc";
import useFirestoreCollection from "../hooks/useFirestoreCollection";

function Projects() {
  const { data: sectionVisibility = {} } = useFirestoreDoc({ db, path: ['settings', 'sectionVisibility'], defaultValue: {} });
  const { data: projects = [] } = useFirestoreCollection({ db, collectionPath: 'projects', orderField: 'title', defaultValue: [] });

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
          {projects.map(project => (
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
                    {project.link && (
                      <a
                        href={project.link}
                        target="_blank"
                        rel="noreferrer"
                        className="btn btn-sm project-card-hero-button"
                      >
                        View Project →
                      </a>
                    )}
                  </div>
                </div>
              </Card>
            </Col>
          ))}
        </Row>
      )}
    </Container>
  );
}

export default Projects;
