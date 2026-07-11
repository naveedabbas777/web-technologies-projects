import React, { useEffect, useState } from 'react';
import db from '../firebase';
import { collection, query, orderBy, onSnapshot } from 'firebase/firestore';

export default function About() {
  const [skills, setSkills] = useState([]);
  const [achievements, setAchievements] = useState([]);
  const [specialization, setSpecialization] = useState([]);
  const [education, setEducation] = useState([]);
  const [awards, setAwards] = useState([]);

  useEffect(() => {
    const q = query(collection(db, 'skills'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setSkills(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('skills onSnapshot', err));
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'achievements'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setAchievements(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('achievements onSnapshot', err));
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'specialization'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setSpecialization(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('specialization onSnapshot', err));
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'education'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setEducation(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('education onSnapshot', err));
    return () => unsub();
  }, []);

  useEffect(() => {
    const q = query(collection(db, 'awards'), orderBy('order', 'asc'));
    const unsub = onSnapshot(q, (snap) => {
      setAwards(snap.docs.map(d => ({ id: d.id, ...d.data() })));
    }, (err) => console.warn('awards onSnapshot', err));
    return () => unsub();
  }, []);

  return (
    <div className="about-page" style={{ padding: 20 }}>
      <h2>About — Skills, Specialization & Achievements</h2>

      <section style={{ marginTop: 18 }}>
        <h3>Skills</h3>
        <p>All skills (Home highlights the top 5)</p>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {skills.map(s => (
            <div key={s.id} className="skill-pill">
              <strong>{s.name}</strong>{s.level ? ` — ${s.level}` : ''}
            </div>
          ))}
        </div>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Specialization</h3>
        <p>Your main focus areas (shown in detail here and summarized on the Resume).</p>
        <ul>
          {specialization.map(item => (
            <li key={item.id}>{item.text}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Education</h3>
        <ul>
          {education.map(item => (
            <li key={item.id}>{item.text}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Achievements</h3>
        <p>All achievements (Home highlights the top 5)</p>
        <ul>
          {achievements.map(a => (
            <li key={a.id}>{a.title}{a.year ? ` — ${a.year}` : ''}</li>
          ))}
        </ul>
      </section>

      <section style={{ marginTop: 24 }}>
        <h3>Scholarships & Awards</h3>
        <ul>
          {awards.map(item => (
            <li key={item.id}>{item.text}</li>
          ))}
        </ul>
      </section>
    </div>
  );
}
