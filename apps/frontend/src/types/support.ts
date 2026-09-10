/**
 * Cloud-Native Library Management System (LMS)
 * Archival Helpdesk & Role-Based Support Types
 */

export type SupportTicketRole = 'STUDENT' | 'ADMIN';

export type SupportTicketPriority = 'LOW' | 'NORMAL' | 'URGENT' | 'CRITICAL';

export type StudentIssueCategory =
  | 'BOOK_BORROWING'
  | 'RESERVATION_DELAY'
  | 'DAMAGED_VOLUME'
  | 'DIGITAL_ACCESS'
  | 'FINE_DISPUTE'
  | 'GENERAL_INQUIRY';

export type AdminIssueCategory =
  | 'INFRASTRUCTURE_SERVER'
  | 'DATABASE_SYNC'
  | 'USER_ROLE_ESCALATION'
  | 'SYSTEM_BUG'
  | 'HARDWARE_INTEGRATION'
  | 'SECURITY_ALERT';

export type SupportCategory = StudentIssueCategory | AdminIssueCategory;

export interface ISupportTicket {
  id: string;
  ticketNumber: string;
  role: SupportTicketRole;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  libraryCardId?: string;
  recipientEmail: string;
  recipientRoleTitle: string;
  category: SupportCategory;
  priority: SupportTicketPriority;
  subject: string;
  relatedBookTitle?: string;
  message: string;
  status: 'DISPATCHED' | 'ACKNOWLEDGED' | 'IN_REVIEW' | 'RESOLVED';
  createdAt: string;
  resolvedAt?: string | null;
}

export interface CreateSupportTicketDto {
  role: SupportTicketRole;
  senderName: string;
  senderEmail: string;
  senderPhone?: string;
  libraryCardId?: string;
  category: SupportCategory;
  priority: SupportTicketPriority;
  subject: string;
  relatedBookTitle?: string;
  message: string;
}

export const STUDENT_RECIPIENT_EMAIL = 'librarian@delhi.library.gov.in';
export const ADMIN_RECIPIENT_EMAIL = 'singhyash0706@gmail.com';
