import React, { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import Navbar from '../components/Navbar.jsx';
import Footer from '../components/Footer.jsx';
import AdminSidebar from '../components/AdminSidebar.jsx';
import StaffSidebar from '../components/StaffSidebar.jsx';
import RiderSidebar from '../components/RiderSidebar.jsx';
import AdminTopbar from '../components/AdminTopbar.jsx';
import { useAuth } from '../context/AuthContext.jsx';
import { apiService } from '../api/apiService.js';

const formatTime = (value) => {
  if (!value) return 'Just now';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return 'Just now';
  return date.toLocaleString();
};

const getDisplayName = (person) => {
  if (!person) return 'Unknown user';
  if (typeof person === 'string') return person;
  return person.name || person.email || 'Unknown user';
};

export default function Messages() {
  const { user, latestMessage, refreshUnreadMessageCount } = useAuth();
  const navigate = useNavigate();
  const canCompose = user?.role === 'admin' || user?.role === 'staff';

  const role = user?.role;
  const dashboardPath = role === 'admin'
    ? '/admin'
    : role === 'staff'
      ? '/staff'
      : role === 'rider'
        ? '/rider'
        : '/dashboard';

  const quickLinks = role === 'admin'
    ? [
      { label: 'Orders', to: '/admin/orders', icon: 'fas fa-receipt' },
      { label: 'Products', to: '/admin/products', icon: 'fas fa-box' },
      { label: 'Customers', to: '/admin/customers', icon: 'fas fa-users' }
    ]
    : role === 'staff'
      ? [
        { label: 'Orders', to: '/staff/orders', icon: 'fas fa-receipt' },
        { label: 'Products', to: '/staff/products', icon: 'fas fa-box' },
        { label: 'Delivery', to: '/staff/delivery', icon: 'fas fa-truck' }
      ]
      : role === 'rider'
        ? [
          { label: 'Orders', to: '/rider/orders', icon: 'fas fa-clipboard-check' },
          { label: 'History', to: '/rider/history', icon: 'fas fa-history' },
          { label: 'Profile', to: '/rider/profile', icon: 'fas fa-user-circle' }
        ]
        : [
          { label: 'Shop', to: '/products', icon: 'fas fa-store' },
          { label: 'My Orders', to: '/my-orders', icon: 'fas fa-box' },
          { label: 'Profile', to: '/profile', icon: 'fas fa-user' }
        ];

  const [conversations, setConversations] = useState([]);
  const [selectedConversationId, setSelectedConversationId] = useState('');
  const [messages, setMessages] = useState([]);
  const [inboxLoading, setInboxLoading] = useState(true);
  const [threadLoading, setThreadLoading] = useState(false);
  const [recipientsLoading, setRecipientsLoading] = useState(false);
  const [sending, setSending] = useState(false);
  const [composeMode, setComposeMode] = useState('role');
  const [recipientRole, setRecipientRole] = useState('customer');
  const [recipientCustomers, setRecipientCustomers] = useState([]);
  const [recipientRiders, setRecipientRiders] = useState([]);
  const [selectedRecipientIds, setSelectedRecipientIds] = useState([]);
  const [subject, setSubject] = useState('');
  const [body, setBody] = useState('');
  const [replyBody, setReplyBody] = useState('');
  const [messageStatus, setMessageStatus] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  const activeConversation = useMemo(() => {
    return conversations.find((conversation) => conversation.conversationId === selectedConversationId)
      || conversations[0]
      || null;
  }, [conversations, selectedConversationId]);

  const filteredConversations = useMemo(() => {
    const term = searchTerm.trim().toLowerCase();
    if (!term) return conversations;

    return conversations.filter((conversation) => {
      const pieces = [
        conversation.subject,
        conversation.lastMessage?.body,
        getDisplayName(conversation.sender),
        getDisplayName(conversation.recipient),
        conversation.lastSenderRole,
        conversation.conversationId
      ];
      return pieces.some((piece) => String(piece || '').toLowerCase().includes(term));
    });
  }, [conversations, searchTerm]);

  const recipientPool = recipientRole === 'delivery_rider' ? recipientRiders : recipientCustomers;

  const loadInbox = async () => {
    setInboxLoading(true);
    try {
      const response = await apiService.getMessageInbox();
      const nextConversations = response.conversations || [];
      setConversations(nextConversations);

      if (!selectedConversationId && nextConversations.length > 0) {
        setSelectedConversationId(nextConversations[0].conversationId);
      }
    } catch (error) {
      setMessageStatus(error.response?.data?.message || 'Failed to load messages.');
    } finally {
      setInboxLoading(false);
    }
  };

  const loadRecipients = async () => {
    if (!canCompose) return;

    setRecipientsLoading(true);
    try {
      const [customersResult, ridersResult] = await Promise.allSettled([
        apiService.getCustomers(300),
        apiService.getDeliveryRiders()
      ]);

      let loadedAny = false;

      if (customersResult.status === 'fulfilled') {
        const customersResponse = customersResult.value || {};
        if (customersResponse.status !== 'error') {
          setRecipientCustomers(customersResponse.customers || []);
          loadedAny = true;
        } else {
          setRecipientCustomers([]);
        }
      } else {
        setRecipientCustomers([]);
      }

      if (ridersResult.status === 'fulfilled') {
        const ridersResponse = ridersResult.value || {};
        if (ridersResponse.status !== 'error') {
          setRecipientRiders(ridersResponse.riders || []);
          loadedAny = true;
        } else {
          setRecipientRiders([]);
        }
      } else {
        setRecipientRiders([]);
      }

      if (!loadedAny) {
        setMessageStatus('Recipient lists are temporarily unavailable. You can still read and reply to messages.');
      }
    } catch (error) {
      setRecipientCustomers([]);
      setRecipientRiders([]);
      setMessageStatus('Recipient lists are temporarily unavailable. You can still read and reply to messages.');
    } finally {
      setRecipientsLoading(false);
    }
  };

  const loadConversation = async (conversationId) => {
    if (!conversationId) {
      setMessages([]);
      return;
    }

    setThreadLoading(true);
    try {
      const response = await apiService.getMessageConversation(conversationId);
      const nextMessages = response.messages || [];
      setMessages(nextMessages);
      await apiService.markConversationRead(conversationId);
      refreshUnreadMessageCount?.();
    } catch (error) {
      setMessageStatus(error.response?.data?.message || 'Failed to load conversation.');
    } finally {
      setThreadLoading(false);
    }
  };

  useEffect(() => {
    loadInbox();
    loadRecipients();
  }, []);

  useEffect(() => {
    if (selectedConversationId) {
      loadConversation(selectedConversationId);
    }
  }, [selectedConversationId]);

  useEffect(() => {
    if (latestMessage) {
      loadInbox();
      if (selectedConversationId) {
        loadConversation(selectedConversationId);
      }
    }
  }, [latestMessage]);

  useEffect(() => {
    if (!activeConversation) {
      setSelectedConversationId('');
      setMessages([]);
      return;
    }

    if (activeConversation.conversationId !== selectedConversationId) {
      setSelectedConversationId(activeConversation.conversationId);
    }
  }, [activeConversation, selectedConversationId]);

  useEffect(() => {
    if (composeMode === 'role') {
      setSelectedRecipientIds([]);
    }
  }, [composeMode, recipientRole]);

  const handleConversationSelect = (conversationId) => {
    setSelectedConversationId(conversationId);
    loadConversation(conversationId);
  };

  const handleRecipientSelection = (event) => {
    const values = Array.from(event.target.selectedOptions).map((option) => option.value);
    setSelectedRecipientIds(values);
  };

  const handleSend = async (event) => {
    event.preventDefault();
    setMessageStatus('');

    if (!subject.trim() || !body.trim()) {
      setMessageStatus('Subject and message body are required.');
      return;
    }

    if (composeMode === 'users' && selectedRecipientIds.length === 0) {
      setMessageStatus('Select at least one recipient.');
      return;
    }

    setSending(true);
    try {
      const response = await apiService.sendMessage({
        recipientType: composeMode,
        recipientRole,
        recipientUserIds: composeMode === 'users' ? selectedRecipientIds : undefined,
        subject: subject.trim(),
        body: body.trim()
      });

      const sentMessage = response.messages?.[0];
      setMessageStatus(response.message || 'Notification sent successfully.');
      setSubject('');
      setBody('');
      setSelectedRecipientIds([]);
      await loadInbox();
      if (sentMessage?.conversation_id) {
        handleConversationSelect(sentMessage.conversation_id);
      }
    } catch (error) {
      setMessageStatus(error.response?.data?.message || 'Failed to send notification.');
    } finally {
      setSending(false);
    }
  };

  const handleReply = async (event) => {
    event.preventDefault();
    setMessageStatus('');

    if (!selectedConversationId) {
      setMessageStatus('Select a conversation before replying.');
      return;
    }

    if (!replyBody.trim()) {
      setMessageStatus('Reply text is required.');
      return;
    }

    setSending(true);
    try {
      const response = await apiService.replyToConversation(selectedConversationId, { body: replyBody.trim() });
      setReplyBody('');
      setMessageStatus(response.message || 'Reply sent successfully.');
      await loadInbox();
      await loadConversation(selectedConversationId);
    } catch (error) {
      setMessageStatus(error.response?.data?.message || 'Failed to send reply.');
    } finally {
      setSending(false);
    }
  };

  const renderRecipientOptions = (items) => {
    return items.map((item) => (
      <option key={item._id} value={item._id}>
        {item.name || item.email || item.phone || item._id}
      </option>
    ));
  };

  const summaryPanel = (
    <div className="messages-toolbar mb-4">
      <div className="messages-toolbar-head">
        <div>
          <h2 className="mb-1">Messages</h2>
          <p className="mb-0 text-muted">Live notifications and threaded replies in one place.</p>
        </div>
        <div className="messages-toolbar-stats">
          <span className="message-stat-pill">
            <i className="fas fa-inbox"></i>
            {filteredConversations.length} conversations
          </span>
          <span className="message-stat-pill accent">
            <i className="fas fa-bell"></i>
            {conversations.reduce((count, conversation) => count + Number(conversation.unreadCount || 0), 0)} unread
          </span>
        </div>
      </div>

      <div className="messages-nav-strip">
        <button
          type="button"
          className="btn btn-outline-secondary action-pill"
          onClick={() => navigate(-1)}
        >
          <i className="fas fa-arrow-left"></i> Back
        </button>
        <Link className="btn btn-primary action-pill" to={dashboardPath}>
          <i className="fas fa-compass"></i> Dashboard
        </Link>
        {quickLinks.map((link) => (
          <Link key={link.to} className="btn btn-outline-primary action-pill" to={link.to}>
            <i className={link.icon}></i> {link.label}
          </Link>
        ))}
      </div>
    </div>
  );

  const messageWorkspace = (
    <>
      {summaryPanel}

      {messageStatus && (
        <div className="alert alert-info" role="alert">
          {messageStatus}
        </div>
      )}

      <div className="row g-4 align-items-start">
        {canCompose && (
          <div className="col-12 col-xl-4">
            <div className="dashboard-card message-compose-card h-100">
              <div className="card-body p-4">
                <div className="profile-section-head">
                  <div>
                    <h4 className="mb-1">Send notification</h4>
                    <p>Push a real message to customers or riders.</p>
                  </div>
                  <span className="profile-pill">{recipientsLoading ? 'Loading...' : 'Ready'}</span>
                </div>

                <form onSubmit={handleSend} className="d-grid gap-3">
                  <div>
                    <label className="form-label">Send to</label>
                    <select
                      className="form-select"
                      value={composeMode}
                      onChange={(event) => setComposeMode(event.target.value)}
                    >
                      <option value="role">Everyone in a role</option>
                      <option value="users">Specific users</option>
                    </select>
                  </div>

                  <div>
                    <label className="form-label">Target role</label>
                    <select
                      className="form-select"
                      value={recipientRole}
                      onChange={(event) => setRecipientRole(event.target.value)}
                    >
                      <option value="customer">Customers</option>
                      <option value="delivery_rider">Riders</option>
                    </select>
                  </div>

                  {composeMode === 'users' && (
                    <div>
                      <label className="form-label">Select recipients</label>
                      <select
                        multiple
                        className="form-select message-recipient-list"
                        value={selectedRecipientIds}
                        onChange={handleRecipientSelection}
                      >
                        {renderRecipientOptions(recipientPool)}
                      </select>
                      <small className="text-muted">Hold Ctrl or Command to select multiple users.</small>
                    </div>
                  )}

                  <div>
                    <label className="form-label">Subject</label>
                    <input
                      type="text"
                      className="form-control"
                      value={subject}
                      onChange={(event) => setSubject(event.target.value)}
                      placeholder="Fresh produce offer"
                    />
                  </div>

                  <div>
                    <label className="form-label">Message</label>
                    <textarea
                      className="form-control"
                      rows="5"
                      value={body}
                      onChange={(event) => setBody(event.target.value)}
                      placeholder="Write the update or announcement here..."
                    />
                  </div>

                  <button className="btn btn-success action-pill" type="submit" disabled={sending}>
                    {sending ? 'Sending...' : 'Send message'}
                  </button>
                </form>
              </div>
            </div>
          </div>
        )}

        <div className={canCompose ? 'col-12 col-xl-8' : 'col-12'}>
          <div className="dashboard-card message-shell h-100">
            <div className="card-body p-0">
              <div className="message-shell-header p-4 border-bottom">
                <div className="profile-section-head mb-0">
                  <div>
                    <h4 className="mb-1">Inbox</h4>
                    <p>Search a thread or open the most recent conversation.</p>
                  </div>
                  <div className="d-flex gap-2 flex-wrap align-items-center">
                    <input
                      type="search"
                      className="form-control message-search"
                      placeholder="Search conversations"
                      value={searchTerm}
                      onChange={(event) => setSearchTerm(event.target.value)}
                    />
                  </div>
                </div>
              </div>

              <div className="row g-0 message-layout">
                <div className="col-12 col-lg-5 message-list-pane">
                  {inboxLoading ? (
                    <div className="p-4 text-center text-muted">Loading conversations...</div>
                  ) : filteredConversations.length === 0 ? (
                    <div className="p-4 text-center text-muted">No conversations yet.</div>
                  ) : (
                    <div className="message-list">
                      {filteredConversations.map((conversation) => {
                        const isActive = conversation.conversationId === selectedConversationId;
                        const unreadCount = Number(conversation.unreadCount || 0);
                        return (
                          <button
                            key={conversation.conversationId}
                            type="button"
                            className={`message-list-item ${isActive ? 'active' : ''}`}
                            onClick={() => handleConversationSelect(conversation.conversationId)}
                          >
                            <div className="message-list-item-top">
                              <strong>{conversation.subject || 'Notification'}</strong>
                              <span>{formatTime(conversation.lastMessageAt)}</span>
                            </div>
                            <div className="message-list-item-body">
                              <span>{getDisplayName(conversation.sender)} to {getDisplayName(conversation.recipient)}</span>
                              {unreadCount > 0 && <span className="message-unread-pill">{unreadCount}</span>}
                            </div>
                            <p className="message-list-preview mb-0">
                              {conversation.lastMessage?.body || 'No message preview available.'}
                            </p>
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="col-12 col-lg-7 message-thread-pane">
                  {!selectedConversationId ? (
                    <div className="p-4 text-center text-muted">
                      Choose a thread to view the full conversation.
                    </div>
                  ) : threadLoading ? (
                    <div className="p-4 text-center text-muted">Loading thread...</div>
                  ) : (
                    <div className="message-thread">
                      <div className="message-thread-header">
                        <div>
                          <h5 className="mb-1">{activeConversation?.subject || 'Conversation'}</h5>
                          <p className="mb-0">
                            {getDisplayName(activeConversation?.sender)} → {getDisplayName(activeConversation?.recipient)}
                          </p>
                        </div>
                        <span className="profile-pill">{messages.length} messages</span>
                      </div>

                      <div className="message-thread-body">
                        {messages.map((message) => {
                          const mine = String(message.sender_id?._id || message.sender_id) === String(user?.id);
                          return (
                            <div key={message._id} className={`message-bubble ${mine ? 'mine' : 'theirs'}`}>
                              <div className="message-bubble-meta">
                                <strong>{getDisplayName(message.sender_id)}</strong>
                                <span>{formatTime(message.created_at || message.createdAt)}</span>
                              </div>
                              <h6>{message.subject}</h6>
                              <p>{message.body}</p>
                            </div>
                          );
                        })}
                      </div>

                      <form className="message-reply-form" onSubmit={handleReply}>
                        <label className="form-label">Reply</label>
                        <textarea
                          className="form-control"
                          rows="4"
                          value={replyBody}
                          onChange={(event) => setReplyBody(event.target.value)}
                          placeholder="Write a reply to this conversation..."
                        />
                        <div className="d-flex justify-content-end mt-3">
                          <button type="submit" className="btn btn-success action-pill" disabled={sending}>
                            {sending ? 'Sending...' : 'Send reply'}
                          </button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
  if (role === 'admin' || role === 'staff' || role === 'rider') {
    const SidebarComponent = role === 'admin' ? AdminSidebar : role === 'staff' ? StaffSidebar : RiderSidebar;
    const title = role === 'admin' ? 'Messages' : role === 'staff' ? 'Staff Messages' : 'Rider Messages';

    return (
      <div className="admin-container messages-admin-page">
        <SidebarComponent />
        <div className="admin-content">
          <AdminTopbar title={title} iconClass="fas fa-comments" />
          <div className="admin-page-content">
            <div className="container-fluid">
              {messageWorkspace}
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <>
      <Navbar />
      <div className="container py-4 py-md-5 customer-orders-page messages-customer-page">
        <div className="orders-header mb-4">
          <h1 className="mb-2">Messages</h1>
          <p className="mb-0">Stay in touch with staff and follow every update in one thread.</p>
        </div>
        {messageWorkspace}
      </div>
      <Footer />
    </>
  );
}
