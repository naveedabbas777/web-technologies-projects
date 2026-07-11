import React, { useEffect, useState } from "react";
import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import { onAuthStateChanged, onIdTokenChanged } from "firebase/auth";
import { auth } from "./firebase";

import { Navbar, Footer, ParticlesBackground } from "./components/layout";
import { Hero, About, Projects, Contact, Resume, Login, Admin } from "./pages";

import "bootstrap/dist/css/bootstrap.min.css";
import "./App.css";

function App() {
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubAuth = onAuthStateChanged(auth, (currentUser) => setUser(currentUser));
    const unsubId = onIdTokenChanged(auth, (currentUser) => setUser(currentUser));
    return () => { unsubAuth(); unsubId(); };
  }, []);

  return (
    <Router>
      <AppRoutes user={user} setUser={setUser} />
    </Router>
  );
}

function AppRoutes({ user, setUser }) {
  return (
    <>
      <ParticlesBackground />
      <Navbar user={user} setUser={setUser} />
      <Routes>
        <Route path="/" element={<Hero />} />
        <Route path="/projects" element={<Projects />} />
        <Route path="/contact" element={<Contact />} />
        <Route path="/about" element={<About />} />
        <Route path="/resume" element={<Resume />} />
        <Route path="/admin" element={user ? <Admin /> : <Login />} />
        <Route path="*" element={<Hero />} />
      </Routes>
      <Footer />
    </>
  );
}

export default App;
