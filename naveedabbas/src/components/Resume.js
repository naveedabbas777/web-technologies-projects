import React, { useRef } from 'react';
import db from '../firebase';
import html2canvas from 'html2canvas';
import jsPDF from 'jspdf';
import useFirestoreCollection from '../hooks/useFirestoreCollection';
import useFirestoreDoc from '../hooks/useFirestoreDoc';

export default function Resume() {
  const { data: skills = [] } = useFirestoreCollection({ db, collectionPath: 'skills', orderField: 'order', defaultValue: [] });
  const { data: achievements = [] } = useFirestoreCollection({ db, collectionPath: 'achievements', orderField: 'order', defaultValue: [] });
  const { data: projects = [] } = useFirestoreCollection({ db, collectionPath: 'projects', orderField: 'order', defaultValue: [] });
  const { data: specialization = [] } = useFirestoreCollection({ db, collectionPath: 'specialization', orderField: 'order', defaultValue: [] });
  const { data: education = [] } = useFirestoreCollection({ db, collectionPath: 'education', orderField: 'order', defaultValue: [] });
  const { data: awards = [] } = useFirestoreCollection({ db, collectionPath: 'awards', orderField: 'order', defaultValue: [] });
  const { data: profile = null } = useFirestoreDoc({ db, path: ['settings', 'profile'], defaultValue: null });
  const { data: sectionVisibility = {} } = useFirestoreDoc({ db, path: ['settings', 'sectionVisibility'], defaultValue: {} });
  const resumeRef = useRef(null);
  const showResumeOnSite = sectionVisibility.resume?.showOnSite ?? true;

  if (!showResumeOnSite) {
    return (
      <section style={{ padding: '40px 10%' }}>
        <div className="glass" style={{ textAlign: 'center' }}>
          <h2 style={{ marginTop: 0 }}>Resume is hidden</h2>
          <p className="muted" style={{ marginBottom: 0 }}>
            This section is currently hidden by the site admin.
          </p>
        </div>
      </section>
    );
  }

  // Utility to show value or fallback
  const display = (value, fallback = '') => (value || fallback);

  // Clean (header-free) PDF export using html2canvas + jsPDF
  const exportCleanPdf = async (fileName = 'resume.pdf') => {
    const el = resumeRef.current;
    if (!el) return;

    // hide interactive elements that should not appear in the exported PDF
    const hiddenNodes = [];
    el.querySelectorAll('.btn, button').forEach(n => { hiddenNodes.push({ node: n, display: n.style.display }); n.style.display = 'none'; });

    // preserve original inline styles and apply compact print-like styles for export
    const original = { padding: el.style.padding, margin: el.style.margin, maxWidth: el.style.maxWidth, background: el.style.background };
    el.style.background = '#ffffff';
    el.style.color = '#111';
    el.style.padding = '12px';
    el.style.maxWidth = '760px';
    el.style.margin = '0 auto';

    // allow styles to apply
    await new Promise(r => setTimeout(r, 120));

    // capture link positions (used to add clickable annotations to the PDF)
    const elRect = el.getBoundingClientRect();
    const anchors = Array.from(el.querySelectorAll('a[href]')).map(a => {
      const r = a.getBoundingClientRect();
      return { href: a.href, left: r.left - elRect.left, top: r.top - elRect.top, width: r.width, height: r.height };
    });

    try {
      // render DOM to canvas (keep high resolution)
      const canvas = await html2canvas(el, { scale: 2, useCORS: true, backgroundColor: '#ffffff' });

      const pdf = new jsPDF({ unit: 'mm', format: 'a4', orientation: 'portrait' });
      const pageWidth = pdf.internal.pageSize.getWidth();
      const pageHeight = pdf.internal.pageSize.getHeight();
      const margin = 8; // mm
      const pdfWidth = pageWidth - margin * 2;
      const pdfPageHeight = pageHeight - margin * 2;

      // slice the canvas into page-sized chunks so we DON'T scale the whole document to a single page
      const canvasWidth = canvas.width;
      const canvasHeight = canvas.height;
      const pageCanvasHeight = Math.floor((canvasWidth * pdfPageHeight) / pdfWidth);

      let renderedHeight = 0;
      while (renderedHeight < canvasHeight) {
        const sliceHeight = Math.min(pageCanvasHeight, canvasHeight - renderedHeight);
        // create a temporary canvas to hold one page portion
        const tmpCanvas = document.createElement('canvas');
        tmpCanvas.width = canvasWidth;
        tmpCanvas.height = sliceHeight;
        const ctx = tmpCanvas.getContext('2d');
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, tmpCanvas.width, tmpCanvas.height);
        ctx.drawImage(canvas, 0, renderedHeight, canvasWidth, sliceHeight, 0, 0, canvasWidth, sliceHeight);

        const imgData = tmpCanvas.toDataURL('image/png');
        const imgHeightMm = (sliceHeight * pdfWidth) / canvasWidth; // maintain scale (width -> pdfWidth)

        pdf.addImage(imgData, 'PNG', margin, margin, pdfWidth, imgHeightMm);

        // add clickable link annotations for anchors that appear on this page slice
        if (anchors && anchors.length) {
          const scaleX = canvas.width / elRect.width;
          const scaleY = canvas.height / elRect.height;
          for (let i = 0; i < anchors.length; i++) {
            const a = anchors[i];
            const anchorLeftCanvas = a.left * scaleX;
            const anchorTopCanvas = a.top * scaleY;
            const anchorWidthCanvas = a.width * scaleX;
            const anchorHeightCanvas = a.height * scaleY;
            const anchorBottom = anchorTopCanvas + anchorHeightCanvas;
            if (anchorBottom > renderedHeight && anchorTopCanvas < renderedHeight + sliceHeight) {
              const yOnPageCanvas = Math.max(0, anchorTopCanvas - renderedHeight);
              const visibleHeightCanvas = Math.min(anchorBottom, renderedHeight + sliceHeight) - Math.max(anchorTopCanvas, renderedHeight);

              const x_mm = margin + (anchorLeftCanvas / canvasWidth) * pdfWidth;
              const y_mm = margin + (yOnPageCanvas / pageCanvasHeight) * pdfPageHeight;
              const w_mm = (anchorWidthCanvas / canvasWidth) * pdfWidth;
              const h_mm = (visibleHeightCanvas / pageCanvasHeight) * pdfPageHeight;

              try { pdf.link(x_mm, y_mm, w_mm, h_mm, { url: a.href }); } catch (e) { /* ignore annotation errors */ }
            }
          }
        }

        renderedHeight += sliceHeight;
        if (renderedHeight < canvasHeight) pdf.addPage();
      }

      pdf.save(fileName);
    } catch (err) {
      console.error('Export PDF failed', err);
      // fallback to native print if canvas/pdf fails
      window.print();
    } finally {
      // restore original styles
      el.style.padding = original.padding;
      el.style.margin = original.margin;
      el.style.maxWidth = original.maxWidth;
      el.style.background = original.background;
      hiddenNodes.forEach(h => { h.node.style.display = h.display; });
    }
  };

  // Auto-download removed — export now only happens on explicit button click


  return (
    <div ref={resumeRef} className="resume-page" style={{ position: 'relative' }}>
      <div style={{ position: 'absolute', right: 18, top: 18 }}>
        <button className="btn secondary" onClick={() => exportCleanPdf(`${(profile?.name || 'resume').replace(/\s+/g, '_')}.pdf`)} aria-label="Download as PDF">Download as PDF</button>
      </div>

      <header style={{ display: 'flex', justifyContent: 'center', alignItems: 'flex-start', gap: 16 }}>
        <div style={{flex:1, textAlign: 'center'}}>
          <h1 style={{ margin: 0, fontSize: '12pt', fontWeight:700 }}>{display(profile?.name, 'Naveed Abbas')}</h1>
          <div style={{ marginTop: 2, color: '#444', fontSize:'10pt' }}>{display(profile?.title, 'Software Engineer • Flutter / MERN / Firebase')}</div>

          <div style={{ marginTop: 4, color: '#444', fontSize:'9pt' }} className="contact-line">
            <span>{display(profile?.location, 'District Rajanpur Punjab Pakistan')}</span>
          </div>

          <div style={{ marginTop: 2, color: '#444', fontSize:'9pt' }} className="contact-line">
            <span>Phone: </span>
            <a href={`tel:${(profile?.phone || '+923150397917')}`} rel="nofollow">{display(profile?.phone, '+923150397917')}</a>
          </div>

          <div style={{ marginTop: 2, color: '#444', fontSize:'9pt' }} className="contact-line">
            <span>E-mail: </span>
            <a href={`mailto:${(profile?.email || 'naveedabbas.softwareengineer@gmail.com')}`}>{display(profile?.email, 'naveedabbas.softwareengineer@gmail.com')}</a>
          </div>

          <div style={{ marginTop: 2, color: '#444', fontSize:'9pt' }} className="contact-line">
            <a href={`https://${(profile?.github || 'github.com/naveedabbas777')}`}>{display(profile?.github, 'github.com/naveedabbas777')}</a>
          </div>
          <div style={{ marginTop: 2, color: '#444', fontSize:'9pt' }} className="contact-line">
            <a href={`https://${(profile?.linkedin || 'www.linkedin.com/in/naveedabbas-softwareengineer')}`}>{display(profile?.linkedin, 'www.linkedin.com/in/naveedabbas-softwareengineer')}</a>
          </div>
        </div>


      </header>

      <section style={{textAlign:'left', marginTop:8}}>
        <div style={{fontWeight:700, textTransform:'uppercase', fontSize:'10pt'}}>JOB OBJECTIVE</div>
        <p style={{marginTop:6, textAlign:'left', fontSize:'10pt', color:'#333'}}>{display(profile?.objective, 'To work as a software engineer trainee in an industry that uses my education in management and software engineering, with the opportunity to eventually be a senior executive.')}</p>
      </section>

      <hr style={{ margin: '4px 0', borderColor:'#ddd' }} />

      {(sectionVisibility.specialization?.showOnResume ?? true) && (
      <section>
        <h2 className="resume-section-title">SPECIALIZATION</h2>
        {specialization.length === 0 ? (
          <p className="muted">No specialization items added yet.</p>
        ) : (
          <ul className="resume-list">
            {specialization.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        )}
      </section>
      )}

      {(sectionVisibility.skills?.showOnResume ?? true) && (
      <section>
        <h2 className="resume-section-title" style={{textTransform:'none', fontWeight:700}}>Skills</h2>
        {skills.length === 0 ? (
          <p className="muted">No skills added yet.</p>
        ) : (
          <ul className="resume-list">
            {skills.map(s => (
              <li key={s.id}>{s.name}{s.level ? ` — ${s.level}` : ''}</li>
            ))}
          </ul>
        )}
      </section>
      )}

      {(sectionVisibility.projects?.showOnResume ?? true) && (
      <section>
        <h2 className="resume-section-title">PROJECTS</h2>
        {projects.length === 0 ? (
          <p className="muted">No projects published yet.</p>
        ) : (
          <ul className="resume-list">
            {projects.map(p => (
              <li key={p.id}><strong>{p.title}</strong>{p.category ? ` — ${p.category}` : ''}{p.summary ? ` — ${p.summary}` : ''}</li>
            ))}
          </ul>
        )}
      </section>
      )}

      {(sectionVisibility.education?.showOnResume ?? true) && (
      <section>
        <h2 className="resume-section-title">EDUCATION</h2>
        {education.length === 0 ? (
          <p className="muted">No education items added yet.</p>
        ) : (
          <ul className="resume-list">
            {education.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        )}
      </section>
      )}

      {(sectionVisibility.awards?.showOnResume ?? true) && (
      <section>
        <h2 className="resume-section-title">SCHOLARSHIPS & AWARDS</h2>
        {awards.length === 0 ? (
          <p className="muted">No awards added yet.</p>
        ) : (
          <ul className="resume-list">
            {awards.map((item) => (
              <li key={item.id}>{item.text}</li>
            ))}
          </ul>
        )}
      </section>
      )}

      {(sectionVisibility.achievements?.showOnResume ?? true) && (
      <section>
        <h2 className="resume-section-title">ACHIEVEMENTS</h2>
        {achievements.length === 0 ? (
          <p className="muted">No achievements added yet.</p>
        ) : (
          <ul className="resume-list">
            {achievements.map(a => (
              <li key={a.id}>{a.title}{a.year ? ` — ${a.year}` : ''}</li>
            ))}
          </ul>
        )}
      </section>
      )}

      <section>
        <h2 className="resume-section-title">REFERENCES</h2>
        <p>Available on request.</p>
      </section>

      <div style={{ marginTop: 10, display: 'flex', justifyContent: 'space-between', color: '#444' }}>
        <div style={{fontSize:'9pt'}}>Location: {display(profile?.location, 'Rajanpur, Punjab, Pakistan')}</div>
        <div style={{fontSize:'9pt'}}>Phone: {display(profile?.phone, '+92 315 0397917')}</div>
      </div>

      <div style={{ marginTop: 12, textAlign: 'center', fontSize: '9pt', color: '#777' }}>
        This CV is generated from live site data — changes made in Admin appear here immediately.
      </div>
    </div>
  );
}
