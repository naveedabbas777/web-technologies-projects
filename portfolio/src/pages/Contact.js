import { useRef, useState } from "react";
import { Container, Row, Col, Card, Form, Button, Alert } from "react-bootstrap";
import emailjs from "@emailjs/browser";
import { FaEnvelope, FaPhone, FaGithub, FaLinkedin } from "react-icons/fa";
import db from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

function Contact() {
  const form = useRef();
  const [sending, setSending] = useState(false);
  const [statusMessage, setStatusMessage] = useState(null);

  const EMAILJS_SERVICE_ID = process.env.REACT_APP_EMAILJS_SERVICE_ID;
  const EMAILJS_TEMPLATE_ID = process.env.REACT_APP_EMAILJS_TEMPLATE_ID;
  const EMAILJS_PUBLIC_KEY = process.env.REACT_APP_EMAILJS_PUBLIC_KEY;
  const emailjsConfigured = !!(EMAILJS_SERVICE_ID && EMAILJS_TEMPLATE_ID && EMAILJS_PUBLIC_KEY);

  const sendEmail = async (e) => {
    e.preventDefault();
    setSending(true);

    const formData = new FormData(form.current);
    const name = formData.get('user_name');
    const email = formData.get('user_email');
    const messageText = formData.get('message');

    const emailResult = { success: false, response: null, error: null };

    if (emailjsConfigured) {
      try {
        const resp = await emailjs.sendForm(EMAILJS_SERVICE_ID, EMAILJS_TEMPLATE_ID, form.current, EMAILJS_PUBLIC_KEY);
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
      emailResult.error = 'EmailJS not configured';
      console.warn('EmailJS not configured. Skipping email send.');
      alert('Email delivery is not configured — your message will be saved and I will check it.');
      e.target.reset();
    }

    try {
      await addDoc(collection(db, 'messages'), {
        name: name || null,
        email: email || null,
        message: messageText || null,
        createdAt: serverTimestamp(),
        read: false,
        emailSent: emailResult.success,
        emailResponse: emailResult.response ? JSON.stringify(emailResult.response) : null,
        emailError: emailResult.error || null
      });
      setStatusMessage('Saved to Firestore');
    } catch (saveErr) {
      console.error('Failed to save message to Firestore', saveErr);
      const isPermission = saveErr?.code?.includes('permission');
      const saveMsg = isPermission
        ? 'Failed to save message: permission denied (check Firestore security rules for `messages` collection).'
        : 'Failed to save message: ' + (saveErr.message || String(saveErr));
      setStatusMessage(saveMsg);
      alert(saveMsg + '\n\nYou can fix this in Firebase console → Firestore → Rules (allow create on `messages`).');
    } finally {
      setSending(false);
    }
  };

  return (
    <Container fluid className="py-5 px-4 px-md-5">
      <div className="mb-5 fade-in">
        <h2 className="mb-3" style={{ fontSize: '2.5rem', fontWeight: 700, background: 'var(--primary-gradient)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>
          Contact Me
        </h2>
        <p className="lead">Get in touch — I'd love to hear from you!</p>
      </div>

      <Row className="justify-content-center">
        <Col xs={12} md={10} lg={8}>
          <Card className="glass border-0 fade-in">
            <Card.Body className="p-4 p-md-5">
              <div className="text-center mb-4">
                <div className="d-flex flex-column flex-md-row justify-content-center align-items-center gap-3 mb-3">
                  <a href="mailto:naveedabbas.softwareengineer@gmail.com" className="d-flex align-items-center gap-2 text-decoration-none text-secondary">
                    <FaEnvelope className="fs-5" style={{ color: 'var(--primary)' }} />
                    <span>naveedabbas.softwareengineer@gmail.com</span>
                  </a>
                </div>
                <div className="d-flex flex-column flex-md-row justify-content-center align-items-center gap-3 mb-3">
                  <a href="tel:+923150397917" className="d-flex align-items-center gap-2 text-decoration-none text-secondary">
                    <FaPhone className="fs-5" style={{ color: 'var(--secondary)' }} />
                    <span>+92 315 0397917</span>
                  </a>
                </div>
                <div className="d-flex flex-wrap justify-content-center gap-4">
                  <a href="https://github.com/naveedabbas777" target="_blank" rel="noreferrer" className="d-flex align-items-center gap-2 text-decoration-none text-secondary">
                    <FaGithub className="fs-4" style={{ color: 'var(--text-primary)' }} />
                    <span>GitHub</span>
                  </a>
                  <a href="https://www.linkedin.com/in/naveedabbas-softwareengineer" target="_blank" rel="noreferrer" className="d-flex align-items-center gap-2 text-decoration-none text-secondary">
                    <FaLinkedin className="fs-4" style={{ color: 'var(--secondary)' }} />
                    <span>LinkedIn</span>
                  </a>
                </div>
              </div>

              {!emailjsConfigured && (
                <Alert variant="warning" className="mb-4">
                  Email delivery is not configured — submissions will be saved to Firestore only. Add EmailJS keys to <code>.env</code> to enable email delivery.
                </Alert>
              )}

              <Form ref={form} onSubmit={sendEmail}>
                <Form.Group className="mb-3">
                  <Form.Control
                    name="user_name"
                    type="text"
                    placeholder="Your Name"
                    required
                    className="border-0"
                    style={{ background: 'var(--bg-glass)', color: 'var(--text-primary)', border: '2px solid var(--border-color)' }}
                  />
                </Form.Group>

                <Form.Group className="mb-3">
                  <Form.Control
                    name="user_email"
                    type="email"
                    placeholder="Your Email"
                    required
                    className="border-0"
                    style={{ background: 'var(--bg-glass)', color: 'var(--text-primary)', border: '2px solid var(--border-color)' }}
                  />
                </Form.Group>

                <Form.Group className="mb-4">
                  <Form.Control
                    name="message"
                    as="textarea"
                    rows={5}
                    placeholder="Your Message"
                    required
                    className="border-0"
                    style={{ background: 'var(--bg-glass)', color: 'var(--text-primary)', border: '2px solid var(--border-color)' }}
                  />
                </Form.Group>

                <div className="d-grid">
                  <Button type="submit" className="btn" disabled={sending} size="lg">
                    {sending ? 'Sending…' : 'Send Message'}
                  </Button>
                </div>

                {statusMessage && (
                  <Alert 
                    variant={statusMessage.startsWith('Failed') ? 'danger' : 'success'} 
                    className="mt-3 mb-0"
                  >
                    {statusMessage}
                  </Alert>
                )}
              </Form>
            </Card.Body>
          </Card>
        </Col>
      </Row>
    </Container>
  );
}

export default Contact;
