import React, { useEffect, useState } from "react";
import { Link, NavLink, useNavigate } from "react-router-dom";
import { FaSignOutAlt } from "react-icons/fa";
import { signOut } from "firebase/auth";
import { Container, Navbar as BootstrapNavbar, Nav } from "react-bootstrap";
import { auth } from "../../firebase";
import db from "../../firebase";
import { doc, getDoc } from "firebase/firestore";
import useFirestoreDoc from "../../hooks/useFirestoreDoc";

function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const [expanded, setExpanded] = useState(false);
  const [fallbackPhoto, setFallbackPhoto] = useState(null);
  const { data: siteProfile } = useFirestoreDoc({ db, path: ['settings', 'profile'], defaultValue: null });
  const { data: heroSettings } = useFirestoreDoc({ db, path: ['settings', 'hero'], defaultValue: null });

  const DEFAULT_SITE_PROFILE = 'https://raw.githubusercontent.com/naveedabbassoftwareengineer/my_software_journey/main/afd3c37364e34fbbada4837633a5490b.jpg';
  const effectiveSiteProfile = heroSettings?.imageUrl || siteProfile?.imageUrl || DEFAULT_SITE_PROFILE;
  const siteName = siteProfile?.name || 'Naveed Abbas';

  const logout = async () => {
    setExpanded(false);
    await signOut(auth);
    setUser(null);
    navigate('/');
  };

  const closeMenu = () => setExpanded(false);

  useEffect(() => {
    let mounted = true;

    const loadFallback = async () => {
      try {
        if (user && !user.photoURL && user.uid) {
          const snap = await getDoc(doc(db, 'users', user.uid));
          if (snap.exists() && snap.data().photoURL && mounted) {
            setFallbackPhoto(snap.data().photoURL);
          }
        } else {
          setFallbackPhoto(null);
        }
      } catch (err) {
        console.warn('Navbar fallback photo load failed', err);
      }
    };

    loadFallback();
    return () => {
      mounted = false;
    };
  }, [user]);

  return (
    <BootstrapNavbar
      className="navbar"
      expand="lg"
      fixed="top"
      expanded={expanded}
      onToggle={(nextExpanded) => setExpanded(nextExpanded)}
    >
      <Container fluid className="px-4">
        <BootstrapNavbar.Brand as={Link} to="/" onClick={closeMenu} className="brand d-flex align-items-center gap-3">
          <span>{siteName}</span>
          {effectiveSiteProfile ? (
            <img
              src={effectiveSiteProfile}
              alt="site profile"
              className="avatar"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          ) : (user?.photoURL || fallbackPhoto) && (
            <img
              src={user?.photoURL || fallbackPhoto}
              alt="avatar"
              className="avatar"
              onError={(e) => { e.currentTarget.style.display = 'none'; }}
            />
          )}
        </BootstrapNavbar.Brand>

        <BootstrapNavbar.Toggle
          aria-controls="basic-navbar-nav"
          className="border-0 navbar-toggler-custom"
          aria-label="Toggle navigation menu"
          style={{ background: 'transparent', color: 'var(--text-primary)' }}
        >
          <span className="navbar-toggler-icon" />
          <span className="navbar-toggler-text">Menu</span>
        </BootstrapNavbar.Toggle>

        <BootstrapNavbar.Collapse id="basic-navbar-nav">
          <Nav className="ms-auto nav-links align-items-center">
            <Nav.Link as={NavLink} to="/" onClick={closeMenu}>Home</Nav.Link>
            <Nav.Link as={NavLink} to="/projects" onClick={closeMenu}>Projects</Nav.Link>
            <Nav.Link as={NavLink} to="/specialization" onClick={closeMenu}>Specialization</Nav.Link>
            <Nav.Link as={NavLink} to="/achievements" onClick={closeMenu}>Achievements</Nav.Link>
            <Nav.Link as={NavLink} to="/education" onClick={closeMenu}>Education</Nav.Link>
            <Nav.Link as={NavLink} to="/awards" onClick={closeMenu}>Awards</Nav.Link>
            <Nav.Link as={NavLink} to="/contact" onClick={closeMenu}>Contact</Nav.Link>
            {user ? (
              <button onClick={logout} className="btn ms-2" aria-label="Logout">
                <FaSignOutAlt /> Logout
              </button>
            ) : (
              <Nav.Link as={Link} to="/admin" className="btn ms-2" onClick={closeMenu}>Admin</Nav.Link>
            )}
          </Nav>
        </BootstrapNavbar.Collapse>
      </Container>
    </BootstrapNavbar>
  );
}

export default Navbar;
