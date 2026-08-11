import { useRef, useState } from "react";
import emailjs from "@emailjs/browser";
import { FaEnvelope, FaPhone, FaGithub, FaLinkedin } from "react-icons/fa";
import db from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

function Contact() {
  const form = useRef();
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  // EmailJS config (set in .env when you want emails delivered)
  const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
  const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
  const emailjsConfigured = !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);

  const sendEmail = async (e) => {
    e.preventDefault();
    setSending(true);

    // capture form values now (form may be reset after successful send)
    const formData = new FormData(form.current);
    const name = formData.get('user_name');
    const email = formData.get('user_email');
    const messageText = formData.get('message');

    const emailResult = { success: false, response: null, error: null };

    if (emailjsConfigured) {
      try {
        const resp = await emailjs.sendForm(
          EMAILJS_SERVICE_ID,
          EMAILJS_TEMPLATE_ID,
          form.current,
          EMAILJS_PUBLIC_KEY
        );
        emailResult.success = true;
        emailResult.response = resp;
        console.log('EmailJS response', resp);
        alert('Message sent — thank you!');
        e.target.reset();
      } catch (err) {
        emailResult.error = err?.toString();
        console.error('EmailJS send error', err);
        alert('Email delivery failed — your message was saved and I will check it. Or email directly at naveedabbas.softwareengineer@gmail.com');
      }
    } else {
      // EmailJS not configured: still persist the message so you don't lose it
      emailResult.error = 'EmailJS not configured';
      console.warn('EmailJS not configured. Skipping email send.');
      alert('Email delivery is not configured — your message will be saved and I will check it.');
      e.target.reset();
    }

    // always persist the submission to Firestore so you keep a copy
    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        name: name || null,
        email: email || null,
        message: messageText || null,
        createdAt: serverTimestamp(),
        read: false,
        emailSent: emailResult.success,
        emailResponse: emailResult.response ? JSON.stringify(emailResult.response) : null,
        emailError: emailResult.error || null
      });
      console.log('Saved message to Firestore:', docRef.id);
      setStatusMessage('Saved to Firestore');
    } catch (saveErr) {
      console.error('Failed to save message to Firestore', saveErr);
      const isPermission = saveErr && saveErr.code && saveErr.code.includes('permission');
      const saveMsg = isPermission
        ? 'Failed to save message: permission denied (check Firestore security rules for `messages` collection).'
        : 'Failed to save message: ' + (saveErr.message || String(saveErr));
      setStatusMessage(saveMsg);
      // always notify user when saving fails so they know the message wasn't persisted
      alert(saveMsg + '\n\nYou can fix this in Firebase console → Firestore → Rules (allow create on `messages`).');
    } finally {
      setSending(false);
    }
  };

  return (
    <section style={{ padding: '24px 10%' }}>
      <h2>Contact Me</h2>

      <div className="glass" style={{ display: 'grid', gap: 12, maxWidth: 700, margin: '0 auto' }}>
        <div style={{ textAlign: 'center' }}>
          <p><FaEnvelope /> naveedabbas.softwareengineer@gmail.com</p>
          <p><FaPhone /> +92 315 0397917</p>
          <p><FaGithub /> <a href="https://github.com/naveedabbas777" target="_blank" rel="noreferrer">github.com/naveedabbas777</a></p>
          <p><FaLinkedin /> <a href="https://www.linkedin.com/in/naveedabbas-softwareengineer" target="_blank" rel="noreferrer">linkedin.com/in/naveedabbas-softwareengineer</a></p>
        </div>

        {!emailjsConfigured && (
          <p style={{ color: '#f59e0b', marginBottom: 8 }}>
            Email delivery is not configured — submissions will be saved to Firestore only. Add EmailJS keys to <code>.env</code> to enable email delivery.
          </p>
        )}

        <form ref={form} onSubmit={sendEmail} style={{ display: 'grid', gap: 8 }}>
          <input name="user_name" placeholder="Your Name" required />
          <input name="user_email" placeholder="Your Email" required />
          <textarea name="message" placeholder="Message" required />
          <button type="submit" className="btn" disabled={sending}>{sending ? 'Sending…' : 'Send Message'}</button>
          {statusMessage && (
            <div style={{ marginTop: 10, color: statusMessage.startsWith('Failed') ? '#fca5a5' : '#a3e635' }}>{statusMessage}</div>
          )}
        </form>
      </div>
    </section>
  );
}

export default Contact;
