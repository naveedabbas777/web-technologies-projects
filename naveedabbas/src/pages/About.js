import React from 'react';
import { Container, Row, Col, Card } from 'react-bootstrap';
import db from '../firebase';
import useFirestoreDoc from '../hooks/useFirestoreDoc';
import useFirestoreCollection from '../hooks/useFirestoreCollection';

export default function About() {
  const { data: sectionVisibility = {} } = useFirestoreDoc({ db, path: ['settings', 'sectionVisibility'], defaultValue: {} });
  const { data: skills = [] } = useFirestoreCollection({ db, collectionPath: 'skills', orderField: 'order', defaultValue: [] });
  const { data: achievements = [] } = useFirestoreCollection({ db, collectionPath: 'achievements', orderField: 'order', defaultValue: [] });
  const { data: specialization = [] } = useFirestoreCollection({ db, collectionPath: 'specialization', orderField: 'order', defaultValue: [] });
  const { data: education = [] } = useFirestoreCollection({ db, collectionPath: 'education', orderField: 'order', defaultValue: [] });
  const { data: awards = [] } = useFirestoreCollection({ db, collectionPath: 'awards', orderField: 'order', defaultValue: [] });

  return (
    <Container fluid className="py-5 px-4 px-md-5">
      <div className="mb-5 fade-in">
        <h2 className="mb-3" style={{ fontSize: '2.5rem', fontWeight: 700, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          About Me
        </h2>
        <p className="lead">Skills, Specialization & Achievements</p>
      </div>

      <Row className="g-4">
        {(sectionVisibility.skills?.showOnSite ?? true) && (
        <Col xs={12} lg={6}>
          <Card className="glass border-0 mb-4 fade-in">
            <Card.Body>
              <h3 className="mb-3" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Skills</h3>
              <p className="text-muted mb-3">All skills (Home highlights the top 8)</p>
              <div className="d-flex flex-wrap gap-2">
                {skills.map(s => (
                  <span key={s.id} className="skill-pill">
                    <strong>{s.name}</strong>{s.level ? ` — ${s.level}` : ''}
                  </span>
                ))}
              </div>
            </Card.Body>
          </Card>
        </Col>
        )}

        {(sectionVisibility.specialization?.showOnSite ?? true) && (
        <Col xs={12} lg={6}>
          <Card className="glass border-0 mb-4 fade-in">
            <Card.Body>
              <h3 className="mb-3" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Specialization</h3>
              <p className="text-muted mb-3">Main focus areas (shown in detail here and summarized on the Resume)</p>
              <ul className="list-unstyled">
                {specialization.map(item => (
                  <li key={item.id} className="mb-2 text-secondary">
                    <span className="me-2" style={{ color: 'var(--primary)' }}>▸</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </Col>
        )}

        {(sectionVisibility.education?.showOnSite ?? true) && (
        <Col xs={12} lg={6}>
          <Card className="glass border-0 mb-4 fade-in">
            <Card.Body>
              <h3 className="mb-3" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Education</h3>
              <ul className="list-unstyled">
                {education.map(item => (
                  <li key={item.id} className="mb-2 text-secondary">
                    <span className="me-2" style={{ color: 'var(--secondary)' }}>🎓</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </Col>
        )}

        {(sectionVisibility.achievements?.showOnSite ?? true) && (
        <Col xs={12} lg={6}>
          <Card className="glass border-0 mb-4 fade-in">
            <Card.Body>
              <h3 className="mb-3" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Achievements</h3>
              <p className="text-muted mb-3">All achievements (Home highlights the top 4)</p>
              <ul className="list-unstyled">
                {achievements.map(a => (
                  <li key={a.id} className="mb-2 text-secondary">
                    <span className="me-2" style={{ color: 'var(--accent-orange)' }}>🏆</span>
                    {a.title}{a.year ? ` — ${a.year}` : ''}
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </Col>
        )}

        {(sectionVisibility.awards?.showOnSite ?? true) && (
        <Col xs={12}>
          <Card className="glass border-0 fade-in">
            <Card.Body>
              <h3 className="mb-3" style={{ color: 'var(--text-primary)', fontWeight: 700 }}>Scholarships & Awards</h3>
              <ul className="list-unstyled">
                {awards.map(item => (
                  <li key={item.id} className="mb-2 text-secondary">
                    <span className="me-2" style={{ color: 'var(--accent-purple)' }}>⭐</span>
                    {item.text}
                  </li>
                ))}
              </ul>
            </Card.Body>
          </Card>
        </Col>
        )}
      </Row>
    </Container>
  );
}
