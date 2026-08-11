import React from 'react';
import { Container, Row, Col } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { FaGithub, FaLinkedin, FaDownload, FaEnvelope } from 'react-icons/fa';
import db from '../../firebase';
import useFirestoreDoc from '../../hooks/useFirestoreDoc';

export default function Footer() {
  const { data: resumeDoc } = useFirestoreDoc({ db, path: ['settings', 'resume'], defaultValue: null });
  const { data: sectionVisibility = {} } = useFirestoreDoc({ db, path: ['settings', 'sectionVisibility'], defaultValue: {} });
  const resumeUrl = resumeDoc?.fileUrl || '/resume.pdf';
  const showResumeOnSite = sectionVisibility.resume?.showOnSite ?? true;

  return (
    <footer className="site-footer">
      <Container fluid className="px-4 px-md-5">
        <Row className="align-items-center g-4">
          <Col xs={12} md={4}>
            <div className="d-flex flex-column">
              <strong style={{ fontSize: '1.1rem', fontWeight: 700, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
                Naveed Abbas
              </strong>
              <span className="muted mt-1">Software Engineer • Flutter / MERN / Firebase</span>
            </div>
          </Col>

          <Col xs={12} md={4}>
            <nav className="footer-links d-flex flex-wrap justify-content-center gap-3" aria-label="Footer navigation">
              <Link to="/" className="text-decoration-none text-secondary">Home</Link>
              <Link to="/projects" className="text-decoration-none text-secondary">Projects</Link>
              <Link to="/contact" className="text-decoration-none text-secondary">Contact</Link>
            </nav>
          </Col>

          <Col xs={12} md={4}>
            <div className="d-flex flex-wrap justify-content-center justify-content-md-end align-items-center gap-2 gap-md-3">
              {showResumeOnSite && (
                <>
                  <Link to="/resume" className="btn secondary">
                    <FaDownload /> Resume
                  </Link>
                  {resumeUrl && resumeUrl !== '/resume.pdf' && (
                    <a href={resumeUrl} className="btn" target="_blank" rel="noreferrer" style={{ padding: '8px 16px', fontSize: '0.9rem' }}>
                      Open PDF
                    </a>
                  )}
                </>
              )}
              <a href="mailto:naveedabbas.softwareengineer@gmail.com" className="icon-link" aria-label="email">
                <FaEnvelope />
              </a>
              <a href="https://github.com/naveedabbas777" target="_blank" rel="noreferrer" className="icon-link" aria-label="github">
                <FaGithub />
              </a>
              <a href="https://www.linkedin.com/in/naveedabbas-softwareengineer" target="_blank" rel="noreferrer" className="icon-link" aria-label="linkedin">
                <FaLinkedin />
              </a>
            </div>
          </Col>
        </Row>

        <Row>
          <Col>
            <div className="text-center mt-4 pt-3" style={{ borderTop: '1px solid var(--border-color)', fontSize: '0.9rem', color: 'var(--text-muted)' }}>
              © {new Date().getFullYear()} Naveed Abbas — Built with React & Firebase
            </div>
          </Col>
        </Row>
      </Container>
    </footer>
  );
}
