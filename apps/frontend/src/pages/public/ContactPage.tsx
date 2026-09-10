import React, { useState, useEffect } from 'react';
import {
  Mail,
  Send,
  ShieldCheck,
  Building2,
  Phone,
  Clock,
  Sparkles,
  CheckCircle2,
  Copy,
  ExternalLink,
  BookOpen,
  FileText,
  Compass,
} from 'lucide-react';
import { useAuth } from '../../hooks/useAuth';
import { UserRole } from '../../types/user';
import { mockDb } from '../../mock/mockDb';
import {
  SupportTicketRole,
  SupportTicketPriority,
  SupportCategory,
  ISupportTicket,
  STUDENT_RECIPIENT_EMAIL,
  ADMIN_RECIPIENT_EMAIL,
} from '../../types/support';
import { Button } from '../../components/common/Button';
import { Input } from '../../components/common/Input';

export const ContactPage: React.FC = () => {
  const { user, role } = useAuth();

  // Role toggle: 'STUDENT' or 'ADMIN'
  const [ticketRole, setTicketRole] = useState<SupportTicketRole>(
    role === UserRole.ADMIN ? 'ADMIN' : 'STUDENT',
  );

  // Form fields
  const [senderName, setSenderName] = useState(user ? `${user.firstName} ${user.lastName}` : '');
  const [senderEmail, setSenderEmail] = useState(user ? user.email : '');
  const [senderPhone, setSenderPhone] = useState(user?.phoneNumber || '');
  const [libraryCardId, setLibraryCardId] = useState(
    user?.id ? `LIB-${user.id.slice(-6).toUpperCase()}` : '',
  );
  const [category, setCategory] = useState<SupportCategory>(
    ticketRole === 'STUDENT' ? 'BOOK_BORROWING' : 'INFRASTRUCTURE_SERVER',
  );
  const [priority, setPriority] = useState<SupportTicketPriority>('NORMAL');
  const [subject, setSubject] = useState('');
  const [relatedBookTitle, setRelatedBookTitle] = useState('');
  const [message, setMessage] = useState('');

  // UI state
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submittedTicket, setSubmittedTicket] = useState<ISupportTicket | null>(null);
  const [showModal, setShowModal] = useState(false);
  const [hasCopied, setHasCopied] = useState(false);
  const [recentTickets, setRecentTickets] = useState<ISupportTicket[]>([]);

  // Update default category when ticketRole changes
  useEffect(() => {
    if (ticketRole === 'STUDENT') {
      setCategory('BOOK_BORROWING');
    } else {
      setCategory('INFRASTRUCTURE_SERVER');
    }
  }, [ticketRole]);

  // Load recent tickets
  useEffect(() => {
    setRecentTickets(mockDb.getTickets().slice(0, 4));
  }, [submittedTicket]);

  const recipientEmail = ticketRole === 'STUDENT' ? STUDENT_RECIPIENT_EMAIL : ADMIN_RECIPIENT_EMAIL;

  // Build structured mailto URL
  const generateMailtoUrl = (ticket: ISupportTicket) => {
    const emailSubject = encodeURIComponent(
      `[${ticket.ticketNumber}] [${ticket.priority}] ${ticket.subject || 'Support Ticket'}`,
    );

    const emailBody = encodeURIComponent(
      `--------------------------------------------------\n` +
        `NĀLANDĀ ARCHIVAL LIBRARY - SUPPORT DISPATCH LEDGER\n` +
        `--------------------------------------------------\n` +
        `TICKET NUMBER   : ${ticket.ticketNumber}\n` +
        `DISPATCH TYPE   : ${ticket.role === 'STUDENT' ? 'STUDENT / PATRON INQUIRY' : 'ADMINISTRATOR / INFRASTRUCTURE ESCALATION'}\n` +
        `TARGET RECIPIENT: ${ticket.recipientRoleTitle} <${ticket.recipientEmail}>\n` +
        `DATE & TIME     : ${new Date(ticket.createdAt).toLocaleString()}\n` +
        `PRIORITY LEVEL  : ${ticket.priority}\n` +
        `CATEGORY        : ${ticket.category}\n` +
        `--------------------------------------------------\n` +
        `SENDER DETAILS:\n` +
        `Name            : ${ticket.senderName}\n` +
        `Email           : ${ticket.senderEmail}\n` +
        (ticket.senderPhone ? `Phone / WA      : ${ticket.senderPhone}\n` : '') +
        (ticket.libraryCardId ? `Library Card ID : ${ticket.libraryCardId}\n` : '') +
        (ticket.relatedBookTitle ? `Related Volume  : ${ticket.relatedBookTitle}\n` : '') +
        `--------------------------------------------------\n` +
        `ISSUE NARRATIVE / MESSAGE:\n` +
        `${ticket.message}\n` +
        `--------------------------------------------------\n` +
        `Dispatched via Nālandā Digital Library Management System\n` +
        `Station 042-B // New Delhi Archival Repository`,
    );

    return `mailto:${ticket.recipientEmail}?subject=${emailSubject}&body=${emailBody}`;
  };

  const [formError, setFormError] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!senderName.trim() || !senderEmail.trim() || !message.trim()) {
      setFormError('Please fill out all required fields (Name, Email, and Message).');
      return;
    }

    setIsSubmitting(true);

    try {
      const resolvedSubject =
        subject.trim() ||
        `${ticketRole === 'STUDENT' ? 'Patron Inquiry' : 'Admin Escalation'}: ${category.replace(/_/g, ' ')}`;

      const ticket = mockDb.createTicket({
        role: ticketRole,
        senderName: senderName.trim(),
        senderEmail: senderEmail.trim(),
        senderPhone: senderPhone.trim() || undefined,
        libraryCardId: libraryCardId.trim() || undefined,
        category,
        priority,
        subject: resolvedSubject,
        relatedBookTitle: relatedBookTitle.trim() || undefined,
        message: message.trim(),
      });

      setSubmittedTicket(ticket);
      setShowModal(true);
      setIsSubmitting(false);

      // Trigger mail client safely
      try {
        const mailtoUri = generateMailtoUrl(ticket);
        const link = document.createElement('a');
        link.href = mailtoUri;
        link.target = '_blank';
        link.rel = 'noopener noreferrer';
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
      } catch {
        // Safe fallback in test or restricted environments
      }
    } catch {
      setIsSubmitting(false);
    }
  };

  const copyTicketDetails = () => {
    if (!submittedTicket) return;
    const details =
      `NĀLANDĀ LIBRARY SUPPORT TICKET\n` +
      `Ticket ID: ${submittedTicket.ticketNumber}\n` +
      `Recipient: ${submittedTicket.recipientEmail}\n` +
      `Role: ${submittedTicket.role}\n` +
      `Subject: ${submittedTicket.subject}\n` +
      `Message: ${submittedTicket.message}\n` +
      `Dispatched: ${new Date(submittedTicket.createdAt).toLocaleString()}`;

    navigator.clipboard.writeText(details);
    setHasCopied(true);
    setTimeout(() => setHasCopied(false), 2500);
  };

  return (
    <div
      style={{
        minHeight: '100vh',
        background: 'linear-gradient(180deg, #faf7f2 0%, #f4ede2 100%)',
        paddingTop: 'var(--space-8)',
        paddingBottom: 'var(--space-16)',
      }}
    >
      <div className="container">
        {/* ====================================================================
            Breadcrumb & Archival Header
            ==================================================================== */}
        <div style={{ marginBottom: 'var(--space-6)' }}>
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '6px',
              padding: '4px 12px',
              borderRadius: '999px',
              background: 'rgba(212, 175, 55, 0.12)',
              border: '1px solid rgba(212, 175, 55, 0.4)',
              color: '#8c6b12',
              fontSize: '11px',
              fontWeight: 700,
              letterSpacing: '0.1em',
              textTransform: 'uppercase',
              marginBottom: '10px',
            }}
          >
            <Sparkles size={12} />
            <span>National Archival Helpdesk • Station 042-B</span>
          </div>

          <h1
            style={{
              fontFamily: "'Cinzel', 'Cormorant Garamond', Georgia, serif",
              fontSize: 'clamp(2rem, 3.5vw, 2.75rem)',
              fontWeight: 800,
              color: '#1a1614',
              marginBottom: '8px',
              letterSpacing: '0.02em',
            }}
          >
            Official Inquiry & Support Pavilion
          </h1>

          <p
            style={{
              fontSize: '1.05rem',
              color: '#6b5e52',
              maxWidth: '720px',
              lineHeight: 1.6,
            }}
          >
            Seamless dual-channel liaison. Scholar inquiries are dispatched directly to the{' '}
            <strong>Delhi Library Administration</strong>, while administrative & system-level
            escalations route instantly to the{' '}
            <strong>Chief Systems Architect ({ADMIN_RECIPIENT_EMAIL})</strong>.
          </p>
        </div>

        {/* ====================================================================
            Interactive Dual-Role Dispatch Switcher
            ==================================================================== */}
        <div
          style={{
            background: '#ffffff',
            borderRadius: '16px',
            border: '1.5px solid rgba(212, 175, 55, 0.35)',
            boxShadow: '0 8px 24px rgba(28, 20, 14, 0.05)',
            padding: '8px',
            marginBottom: 'var(--space-8)',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
            gap: '10px',
          }}
        >
          {/* Option 1: Student / Patron */}
          <button
            type="button"
            onClick={() => setTicketRole('STUDENT')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px 20px',
              borderRadius: '12px',
              border: ticketRole === 'STUDENT' ? '2px solid #b38600' : '1px solid #e7ddc4',
              background:
                ticketRole === 'STUDENT'
                  ? 'linear-gradient(135deg, #fffbf0 0%, #fef7e0 100%)'
                  : 'transparent',
              boxShadow: ticketRole === 'STUDENT' ? '0 4px 12px rgba(179, 134, 0, 0.15)' : 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.25s ease',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: ticketRole === 'STUDENT' ? '#171412' : '#f4ecd8',
                color: ticketRole === 'STUDENT' ? '#ffd700' : '#8c6b12',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <BookOpen size={22} />
            </div>
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '2px',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#1a1614',
                  }}
                >
                  Student / Patron Helpdesk
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: '#16a34a',
                    color: '#ffffff',
                    letterSpacing: '0.05em',
                  }}
                >
                  LIBRARIAN DESK
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b5e52' }}>
                Issues route directly to <strong>{STUDENT_RECIPIENT_EMAIL}</strong>
              </p>
            </div>
          </button>

          {/* Option 2: Administrator & Systems */}
          <button
            type="button"
            onClick={() => setTicketRole('ADMIN')}
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '14px',
              padding: '16px 20px',
              borderRadius: '12px',
              border: ticketRole === 'ADMIN' ? '2px solid #b38600' : '1px solid #e7ddc4',
              background:
                ticketRole === 'ADMIN'
                  ? 'linear-gradient(135deg, #fffbf0 0%, #fef7e0 100%)'
                  : 'transparent',
              boxShadow: ticketRole === 'ADMIN' ? '0 4px 12px rgba(179, 134, 0, 0.15)' : 'none',
              cursor: 'pointer',
              textAlign: 'left',
              transition: 'all 0.25s ease',
            }}
          >
            <div
              style={{
                width: '44px',
                height: '44px',
                borderRadius: '10px',
                background: ticketRole === 'ADMIN' ? '#171412' : '#f4ecd8',
                color: ticketRole === 'ADMIN' ? '#ffd700' : '#8c6b12',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <ShieldCheck size={22} />
            </div>
            <div>
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  marginBottom: '2px',
                }}
              >
                <span
                  style={{
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontWeight: 700,
                    fontSize: '1rem',
                    color: '#1a1614',
                  }}
                >
                  Administrator Escalation
                </span>
                <span
                  style={{
                    fontSize: '9px',
                    fontWeight: 700,
                    padding: '2px 6px',
                    borderRadius: '4px',
                    background: '#dc2626',
                    color: '#ffffff',
                    letterSpacing: '0.05em',
                  }}
                >
                  SUPER ADMIN
                </span>
              </div>
              <p style={{ margin: 0, fontSize: '0.82rem', color: '#6b5e52' }}>
                Issues route directly to <strong>{ADMIN_RECIPIENT_EMAIL}</strong>
              </p>
            </div>
          </button>
        </div>

        {/* ====================================================================
            Main Content Grid: Form (Left) & Archival Info Cards (Right)
            ==================================================================== */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
            gap: 'var(--space-8)',
            alignItems: 'start',
          }}
        >
          {/* Left Column: The Form */}
          <div
            style={{
              background: '#ffffff',
              borderRadius: '18px',
              border: '1.5px solid rgba(212, 175, 55, 0.4)',
              boxShadow: '0 12px 36px rgba(28, 20, 14, 0.06)',
              padding: 'clamp(20px, 4vw, 36px)',
              position: 'relative',
              overflow: 'hidden',
            }}
          >
            {/* 24K Gold Decorative Top Accent Line */}
            <div
              style={{
                position: 'absolute',
                top: 0,
                left: 0,
                right: 0,
                height: '4px',
                background: 'linear-gradient(90deg, #b38600 0%, #ffd700 50%, #b38600 100%)',
              }}
            />

            {/* Active Destination Ribbon */}
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                padding: '10px 14px',
                borderRadius: '8px',
                background: ticketRole === 'STUDENT' ? '#f0fdf4' : '#fef2f2',
                border: ticketRole === 'STUDENT' ? '1px solid #bbf7d0' : '1px solid #fecaca',
                marginBottom: 'var(--space-6)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Mail size={16} color={ticketRole === 'STUDENT' ? '#16a34a' : '#dc2626'} />
                <span
                  style={{
                    fontSize: '0.82rem',
                    fontWeight: 600,
                    color: ticketRole === 'STUDENT' ? '#166534' : '#991b1b',
                  }}
                >
                  Direct Dispatch Target: <strong>{recipientEmail}</strong>
                </span>
              </div>
              <span
                style={{
                  fontSize: '0.75rem',
                  fontWeight: 700,
                  fontFamily: "'Cinzel', Georgia, serif",
                  color: ticketRole === 'STUDENT' ? '#15803d' : '#b91c1c',
                  textTransform: 'uppercase',
                }}
              >
                {ticketRole === 'STUDENT' ? 'Patron Channel' : 'Archival Lead Channel'}
              </span>
            </div>

            <form
              onSubmit={handleSubmit}
              style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}
            >
              {/* Row 1: Name & Email */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#292524',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Your Full Name *
                  </label>
                  <Input
                    type="text"
                    required
                    placeholder="e.g. Arjun Sharma"
                    value={senderName}
                    onChange={(e) => setSenderName(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#292524',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Your Email Address *
                  </label>
                  <Input
                    type="email"
                    required
                    placeholder="e.g. scholar@university.edu"
                    value={senderEmail}
                    onChange={(e) => setSenderEmail(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 2: Phone & Card ID */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#292524',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Phone / WhatsApp (Optional)
                  </label>
                  <Input
                    type="tel"
                    placeholder="+91 98765 43210"
                    value={senderPhone}
                    onChange={(e) => setSenderPhone(e.target.value)}
                  />
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#292524',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    {ticketRole === 'STUDENT' ? 'Library Card / Roll No.' : 'Admin Staff Badge ID'}
                  </label>
                  <Input
                    type="text"
                    placeholder={ticketRole === 'STUDENT' ? 'e.g. LIB-918234' : 'e.g. ADM-DELHI-01'}
                    value={libraryCardId}
                    onChange={(e) => setLibraryCardId(e.target.value)}
                  />
                </div>
              </div>

              {/* Row 3: Category & Priority */}
              <div
                style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                  gap: '16px',
                }}
              >
                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#292524',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Issue Category *
                  </label>
                  <select
                    value={category}
                    onChange={(e) => setCategory(e.target.value as SupportCategory)}
                    style={{
                      width: '100%',
                      padding: '10px 14px',
                      borderRadius: '8px',
                      border: '1px solid #ded5c7',
                      background: '#ffffff',
                      fontSize: '0.92rem',
                      color: '#1c1917',
                      fontFamily: 'inherit',
                      outline: 'none',
                    }}
                  >
                    {ticketRole === 'STUDENT' ? (
                      <>
                        <option value="BOOK_BORROWING">Book Circulation & Borrowing Issue</option>
                        <option value="RESERVATION_DELAY">Reservation / Hold Delay</option>
                        <option value="DAMAGED_VOLUME">Damaged Physical Volume / Binding</option>
                        <option value="DIGITAL_ACCESS">Digital Catalog & PDF Access</option>
                        <option value="FINE_DISPUTE">Overdue Fine or Ledger Dispute</option>
                        <option value="GENERAL_INQUIRY">General Archival & Research Inquiry</option>
                      </>
                    ) : (
                      <>
                        <option value="INFRASTRUCTURE_SERVER">
                          Server Outage / Cloud Infrastructure
                        </option>
                        <option value="DATABASE_SYNC">MongoDB Replica & Index Sync Error</option>
                        <option value="USER_ROLE_ESCALATION">
                          User Role & Permission Escalation
                        </option>
                        <option value="SYSTEM_BUG">Core System Bug / API Exception</option>
                        <option value="HARDWARE_INTEGRATION">Barcode Scanner / RFID Gateway</option>
                        <option value="SECURITY_ALERT">Security Policy & Audit Log Alert</option>
                      </>
                    )}
                  </select>
                </div>

                <div>
                  <label
                    style={{
                      display: 'block',
                      fontSize: '0.82rem',
                      fontWeight: 700,
                      color: '#292524',
                      marginBottom: '6px',
                      textTransform: 'uppercase',
                      letterSpacing: '0.04em',
                    }}
                  >
                    Priority Severity *
                  </label>
                  <div style={{ display: 'flex', gap: '6px' }}>
                    {(['LOW', 'NORMAL', 'URGENT', 'CRITICAL'] as SupportTicketPriority[]).map(
                      (p) => {
                        const isSel = priority === p;
                        const colors: Record<
                          SupportTicketPriority,
                          { bg: string; border: string; text: string }
                        > = {
                          LOW: { bg: '#f3f4f6', border: '#d1d5db', text: '#4b5563' },
                          NORMAL: { bg: '#eff6ff', border: '#bfdbfe', text: '#1d4ed8' },
                          URGENT: { bg: '#fff7ed', border: '#fed7aa', text: '#c2410c' },
                          CRITICAL: { bg: '#fef2f2', border: '#fecaca', text: '#b91c1c' },
                        };
                        const c = colors[p];
                        return (
                          <button
                            key={p}
                            type="button"
                            onClick={() => setPriority(p)}
                            style={{
                              flex: 1,
                              padding: '8px 4px',
                              fontSize: '0.72rem',
                              fontWeight: 700,
                              borderRadius: '6px',
                              border: isSel ? `2px solid ${c.text}` : `1px solid ${c.border}`,
                              background: isSel ? c.bg : '#ffffff',
                              color: c.text,
                              cursor: 'pointer',
                              textTransform: 'uppercase',
                              letterSpacing: '0.04em',
                              transition: 'all 0.15s ease',
                            }}
                          >
                            {p}
                          </button>
                        );
                      },
                    )}
                  </div>
                </div>
              </div>

              {/* Row 4: Subject Line */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#292524',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Subject / Summary Headline
                </label>
                <Input
                  type="text"
                  placeholder={
                    ticketRole === 'STUDENT'
                      ? 'e.g. Request renewal extension for Concepts of Physics Vol 1'
                      : 'e.g. Redis cache cluster degradation during peak catalog search'
                  }
                  value={subject}
                  onChange={(e) => setSubject(e.target.value)}
                />
              </div>

              {/* Row 5: Related Book / Catalog Title (Optional) */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#292524',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Related Book Title or Volume (Optional)
                </label>
                <Input
                  type="text"
                  placeholder="e.g. Aryabhatiya, Operating System Concepts, CLRS..."
                  value={relatedBookTitle}
                  onChange={(e) => setRelatedBookTitle(e.target.value)}
                />
              </div>

              {/* Row 6: Detailed Message */}
              <div>
                <label
                  style={{
                    display: 'block',
                    fontSize: '0.82rem',
                    fontWeight: 700,
                    color: '#292524',
                    marginBottom: '6px',
                    textTransform: 'uppercase',
                    letterSpacing: '0.04em',
                  }}
                >
                  Detailed Description / Inquiry *
                </label>
                <textarea
                  required
                  rows={5}
                  value={message}
                  onChange={(e) => setMessage(e.target.value)}
                  placeholder={
                    ticketRole === 'STUDENT'
                      ? 'Please provide specific details regarding your circulation, book return, shelf coordinate query, or account question...'
                      : 'Please detail the infrastructure event, logs, affected API endpoints, replica lag, or architectural inquiry...'
                  }
                  style={{
                    width: '100%',
                    padding: '12px 14px',
                    borderRadius: '8px',
                    border: '1px solid #ded5c7',
                    background: '#ffffff',
                    fontSize: '0.94rem',
                    color: '#1c1917',
                    fontFamily: 'inherit',
                    lineHeight: 1.5,
                    outline: 'none',
                    resize: 'vertical',
                    boxSizing: 'border-box',
                  }}
                />
              </div>

              {formError && (
                <div
                  style={{
                    color: '#b91c1c',
                    fontSize: '0.86rem',
                    fontWeight: 600,
                    background: '#fef2f2',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    border: '1px solid #fecaca',
                  }}
                >
                  {formError}
                </div>
              )}

              {/* Submit CTA Cluster */}
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '14px',
                  paddingTop: '8px',
                }}
              >
                <div
                  style={{
                    fontSize: '0.82rem',
                    color: '#78716c',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '6px',
                  }}
                >
                  <ShieldCheck size={16} color="#16a34a" />
                  <span>RFC 7807 Archival SLA • Direct Email Synchronization</span>
                </div>

                <Button
                  type="submit"
                  variant="primary"
                  size="lg"
                  disabled={isSubmitting}
                  style={{
                    background: 'linear-gradient(135deg, #b38600 0%, #ffd700 50%, #997014 100%)',
                    color: '#1a1405',
                    fontWeight: 700,
                    border: '1px solid rgba(255, 215, 0, 0.8)',
                    boxShadow: '0 4px 14px rgba(179, 134, 0, 0.35)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '8px',
                    padding: '12px 28px',
                    borderRadius: '999px',
                  }}
                >
                  <Send size={16} />
                  <span>
                    {isSubmitting
                      ? 'Dispatching...'
                      : ticketRole === 'STUDENT'
                        ? 'Dispatch to Library Admin'
                        : `Escalate to Super Admin (${ADMIN_RECIPIENT_EMAIL})`}
                  </span>
                </Button>
              </div>
            </form>
          </div>

          {/* Right Column: Thematic Archival Info & Helpdesk Contacts */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            {/* Direct Routing Verification Card */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1.5px solid rgba(212, 175, 55, 0.35)',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(28, 20, 14, 0.04)',
                position: 'relative',
              }}
            >
              <div
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '6px',
                  fontSize: '10px',
                  fontWeight: 800,
                  letterSpacing: '0.12em',
                  textTransform: 'uppercase',
                  color: '#b38600',
                  marginBottom: '12px',
                }}
              >
                <Compass size={14} />
                <span>Active Routing Matrix</span>
              </div>

              <h3
                style={{
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: '1.25rem',
                  fontWeight: 700,
                  color: '#1a1614',
                  marginBottom: '10px',
                }}
              >
                {ticketRole === 'STUDENT'
                  ? 'Student & Scholar Liaison'
                  : 'Super Admin Direct Channel'}
              </h3>

              <p
                style={{
                  fontSize: '0.88rem',
                  color: '#57534e',
                  lineHeight: 1.5,
                  marginBottom: '16px',
                }}
              >
                {ticketRole === 'STUDENT'
                  ? 'Every student inquiry is submitted directly into the Delhi Central Library administrative ledger and dispatched to the Chief Librarian desk.'
                  : `Administrative, architectural, and infrastructure escalations bypass local queues and deliver immediately to the Project Architect at ${ADMIN_RECIPIENT_EMAIL}.`}
              </p>

              <div
                style={{
                  padding: '12px 16px',
                  borderRadius: '10px',
                  background: ticketRole === 'STUDENT' ? '#f0fdf4' : '#fef2f2',
                  border: ticketRole === 'STUDENT' ? '1px solid #bbf7d0' : '1px solid #fecaca',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                }}
              >
                <div
                  style={{
                    width: '32px',
                    height: '32px',
                    borderRadius: '8px',
                    background: ticketRole === 'STUDENT' ? '#16a34a' : '#dc2626',
                    color: '#ffffff',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <Mail size={16} />
                </div>
                <div style={{ overflow: 'hidden' }}>
                  <div
                    style={{
                      fontSize: '0.72rem',
                      textTransform: 'uppercase',
                      letterSpacing: '0.06em',
                      color: '#78716c',
                    }}
                  >
                    Destination Mailbox
                  </div>
                  <div
                    style={{
                      fontSize: '0.92rem',
                      fontWeight: 700,
                      color: ticketRole === 'STUDENT' ? '#166534' : '#991b1b',
                      whiteSpace: 'nowrap',
                      textOverflow: 'ellipsis',
                      overflow: 'hidden',
                    }}
                  >
                    {recipientEmail}
                  </div>
                </div>
              </div>
            </div>

            {/* Archival Headquarters & Timings */}
            <div
              style={{
                background: '#ffffff',
                borderRadius: '16px',
                border: '1px solid #e7ddc4',
                padding: '24px',
                boxShadow: '0 4px 16px rgba(28, 20, 14, 0.04)',
              }}
            >
              <h4
                style={{
                  fontFamily: "'Cinzel', Georgia, serif",
                  fontSize: '1rem',
                  fontWeight: 700,
                  color: '#1a1614',
                  marginBottom: '14px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                }}
              >
                <Building2 size={18} color="#b38600" />
                <span>Central Archival Coordinates</span>
              </h4>

              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  gap: '14px',
                  fontSize: '0.86rem',
                  color: '#44403c',
                }}
              >
                <div style={{ display: 'flex', gap: '10px' }}>
                  <Building2
                    size={16}
                    color="#78716c"
                    style={{ flexShrink: 0, marginTop: '2px' }}
                  />
                  <div>
                    <strong>National Archival Central Library</strong>
                    <div>Station 042-B, Rajpath Heritage Wing, New Delhi - 110001</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Phone size={16} color="#78716c" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Direct Tele-Helpline</strong>
                    <div>+91 (011) 2338-4218 / +91 98111 22233</div>
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <Clock size={16} color="#78716c" style={{ flexShrink: 0, marginTop: '2px' }} />
                  <div>
                    <strong>Liaison Operating Hours</strong>
                    <div>Monday – Saturday: 08:00 to 20:00 IST</div>
                    <div style={{ fontSize: '0.78rem', color: '#16a34a' }}>
                      • 24/7 Digital Ticket Ingestion
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Recent Local Tickets Ledger (if any exist) */}
            {recentTickets.length > 0 && (
              <div
                style={{
                  background: '#ffffff',
                  borderRadius: '16px',
                  border: '1px solid #e7ddc4',
                  padding: '20px',
                  boxShadow: '0 4px 16px rgba(28, 20, 14, 0.04)',
                }}
              >
                <h4
                  style={{
                    fontFamily: "'Cinzel', Georgia, serif",
                    fontSize: '0.95rem',
                    fontWeight: 700,
                    color: '#1a1614',
                    marginBottom: '12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <FileText size={16} color="#b38600" />
                    <span>Your Recent Dispatches</span>
                  </span>
                  <span style={{ fontSize: '0.72rem', color: '#78716c' }}>
                    {recentTickets.length} logged
                  </span>
                </h4>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                  {recentTickets.map((t) => (
                    <div
                      key={t.id}
                      style={{
                        padding: '10px 12px',
                        borderRadius: '8px',
                        background: '#faf7f2',
                        border: '1px solid #ede5d8',
                        fontSize: '0.8rem',
                      }}
                    >
                      <div
                        style={{
                          display: 'flex',
                          justifyContent: 'space-between',
                          marginBottom: '4px',
                        }}
                      >
                        <strong style={{ fontFamily: 'monospace', color: '#1a1614' }}>
                          {t.ticketNumber}
                        </strong>
                        <span
                          style={{
                            fontSize: '9px',
                            fontWeight: 700,
                            padding: '1px 5px',
                            borderRadius: '4px',
                            background: t.role === 'STUDENT' ? '#dcfce7' : '#fee2e2',
                            color: t.role === 'STUDENT' ? '#166534' : '#991b1b',
                          }}
                        >
                          {t.role === 'STUDENT' ? 'ADMIN DISPATCH' : 'SUPER ADMIN'}
                        </span>
                      </div>
                      <div
                        style={{
                          color: '#57534e',
                          whiteSpace: 'nowrap',
                          overflow: 'hidden',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {t.subject}
                      </div>
                      <div style={{ fontSize: '0.72rem', color: '#a8a29e', marginTop: '3px' }}>
                        {new Date(t.createdAt).toLocaleDateString()} to {t.recipientEmail}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ====================================================================
          Nalanda Archival Wax Seal Dispatch Confirmation Modal
          ==================================================================== */}
      {showModal && submittedTicket && (
        <div
          style={{
            position: 'fixed',
            inset: 0,
            background: 'rgba(23, 20, 18, 0.75)',
            backdropFilter: 'blur(6px)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            zIndex: 9999,
            padding: '20px',
          }}
          onClick={() => setShowModal(false)}
        >
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: '#ffffff',
              maxWidth: '540px',
              width: '100%',
              borderRadius: '20px',
              border: '2px solid rgba(212, 175, 55, 0.65)',
              boxShadow: '0 24px 60px rgba(0, 0, 0, 0.35)',
              padding: 'clamp(24px, 5vw, 36px)',
              textAlign: 'center',
              position: 'relative',
              animation: 'fadeSlideUp 0.3s ease-out',
            }}
          >
            {/* Archival Gold Stamp Header */}
            <div
              style={{
                width: '64px',
                height: '64px',
                borderRadius: '50%',
                background: 'linear-gradient(135deg, #ffd700 0%, #b38600 100%)',
                color: '#1a1405',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                margin: '0 auto 16px',
                boxShadow: '0 6px 18px rgba(179, 134, 0, 0.4)',
                border: '3px solid #fffdf5',
              }}
            >
              <CheckCircle2 size={36} />
            </div>

            <div
              style={{
                fontSize: '11px',
                fontFamily: "'Cinzel', Georgia, serif",
                fontWeight: 700,
                letterSpacing: '0.15em',
                color: '#b38600',
                textTransform: 'uppercase',
                marginBottom: '4px',
              }}
            >
              ARCHIVAL DISPATCH CONFIRMED
            </div>

            <h3
              style={{
                fontFamily: "'Cinzel', Georgia, serif",
                fontSize: '1.5rem',
                fontWeight: 800,
                color: '#1a1614',
                marginBottom: '8px',
              }}
            >
              Ticket {submittedTicket.ticketNumber}
            </h3>

            <p
              style={{
                color: '#57534e',
                fontSize: '0.92rem',
                lineHeight: 1.5,
                marginBottom: '20px',
              }}
            >
              Your issue has been recorded in the central repository and formatted for direct
              transmission to{' '}
              <strong style={{ color: '#1a1614' }}>{submittedTicket.recipientEmail}</strong>.
            </p>

            {/* Ticket Summary Box */}
            <div
              style={{
                background: '#faf7f2',
                border: '1px solid #ede5d8',
                borderRadius: '12px',
                padding: '14px 16px',
                textAlign: 'left',
                marginBottom: '24px',
                fontSize: '0.84rem',
                display: 'flex',
                flexDirection: 'column',
                gap: '6px',
              }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#78716c' }}>Target Recipient:</span>
                <strong style={{ color: '#1a1614' }}>{submittedTicket.recipientEmail}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#78716c' }}>Channel:</span>
                <span
                  style={{
                    fontWeight: 600,
                    color: submittedTicket.role === 'STUDENT' ? '#16a34a' : '#dc2626',
                  }}
                >
                  {submittedTicket.role === 'STUDENT'
                    ? 'Student -> Library Admin'
                    : 'Admin -> Super Admin (Lead)'}
                </span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#78716c' }}>Priority:</span>
                <strong style={{ color: '#1a1614' }}>{submittedTicket.priority}</strong>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                <span style={{ color: '#78716c' }}>Subject:</span>
                <span
                  style={{
                    color: '#1a1614',
                    maxWidth: '240px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                  }}
                >
                  {submittedTicket.subject}
                </span>
              </div>
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <a
                href={generateMailtoUrl(submittedTicket)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '12px 20px',
                  borderRadius: '999px',
                  background: 'linear-gradient(135deg, #b38600 0%, #ffd700 50%, #997014 100%)',
                  color: '#1a1405',
                  fontWeight: 700,
                  fontSize: '0.95rem',
                  textDecoration: 'none',
                  boxShadow: '0 4px 14px rgba(179, 134, 0, 0.35)',
                }}
              >
                <ExternalLink size={16} />
                <span>Open in Email Client ({submittedTicket.recipientEmail})</span>
              </a>

              <button
                type="button"
                onClick={copyTicketDetails}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '8px',
                  padding: '10px 20px',
                  borderRadius: '999px',
                  background: '#ffffff',
                  border: '1.5px solid #ded5c7',
                  color: '#44403c',
                  fontWeight: 600,
                  fontSize: '0.88rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                {hasCopied ? <CheckCircle2 size={16} color="#16a34a" /> : <Copy size={16} />}
                <span>
                  {hasCopied ? 'Ticket Copied to Clipboard!' : 'Copy Formatted Ticket Details'}
                </span>
              </button>

              <button
                type="button"
                onClick={() => setShowModal(false)}
                style={{
                  background: 'transparent',
                  border: 'none',
                  color: '#78716c',
                  fontSize: '0.84rem',
                  cursor: 'pointer',
                  paddingTop: '6px',
                }}
              >
                Dismiss & Return to Portal
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
