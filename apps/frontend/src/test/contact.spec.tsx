import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BrowserRouter } from 'react-router-dom';
import { ContactPage } from '../pages/public/ContactPage';
import { mockDb } from '../mock/mockDb';
import { STUDENT_RECIPIENT_EMAIL, ADMIN_RECIPIENT_EMAIL } from '../types/support';

describe('Contact & Archival Role-Based Routing', () => {
  beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
  });

  const renderComponent = () => {
    return render(
      <BrowserRouter>
        <ContactPage />
      </BrowserRouter>,
    );
  };

  it('renders contact page with official helpdesk title and dual-channel role options', () => {
    renderComponent();

    expect(screen.getByText(/Official Inquiry & Support Pavilion/i)).toBeInTheDocument();
    expect(screen.getByText(/Student \/ Patron Helpdesk/i)).toBeInTheDocument();
    expect(screen.getByText(/Administrator Escalation/i)).toBeInTheDocument();
    expect(screen.getAllByText(new RegExp(STUDENT_RECIPIENT_EMAIL, 'i')).length).toBeGreaterThan(0);
  });

  it('switches routing to super admin email when administrator option is selected', () => {
    renderComponent();

    // Default mode is Student -> librarian@delhi.library.gov.in
    const adminToggleBtn = screen.getByRole('button', { name: /Administrator Escalation/i });
    fireEvent.click(adminToggleBtn);

    // Should now display Yash Singh's email as target
    expect(screen.getAllByText(new RegExp(ADMIN_RECIPIENT_EMAIL, 'i')).length).toBeGreaterThan(0);
    expect(screen.getByRole('button', { name: /Escalate to Super Admin/i })).toBeInTheDocument();
  });

  it('successfully creates ticket and opens confirmation modal with ticket number', () => {
    renderComponent();

    // Fill form
    const nameInput = screen.getByPlaceholderText(/Arjun Sharma/i);
    const emailInput = screen.getByPlaceholderText(/scholar@university.edu/i);
    const messageInput = screen.getByPlaceholderText(/Please provide specific details/i);

    fireEvent.change(nameInput, { target: { value: 'Rohan Verma' } });
    fireEvent.change(emailInput, { target: { value: 'rohan.verma@iitb.ac.in' } });
    fireEvent.change(messageInput, {
      target: { value: 'Need research reservation hold for Aryabhatiya volume 2.' },
    });

    // Submit form
    const submitBtn = screen.getByRole('button', { name: /Dispatch to Library Admin/i });
    fireEvent.click(submitBtn);

    // Verify confirmation modal opened
    expect(screen.getByText(/ARCHIVAL DISPATCH CONFIRMED/i)).toBeInTheDocument();
    expect(screen.getAllByText(/TKT-2026-STU-/i).length).toBeGreaterThan(0);

    // Verify saved in mockDb
    const tickets = mockDb.getTickets();
    expect(tickets.length).toBe(1);
    const firstTicket = tickets[0];
    expect(firstTicket?.senderName).toBe('Rohan Verma');
    expect(firstTicket?.recipientEmail).toBe(STUDENT_RECIPIENT_EMAIL);
    expect(firstTicket?.role).toBe('STUDENT');
  });

  it('routes administrator issues directly to singhyash0706@gmail.com', () => {
    renderComponent();

    // Switch to Admin
    const adminToggleBtn = screen.getByRole('button', { name: /Administrator Escalation/i });
    fireEvent.click(adminToggleBtn);

    const nameInput = screen.getByPlaceholderText(/Arjun Sharma/i);
    const emailInput = screen.getByPlaceholderText(/scholar@university.edu/i);
    const messageInput = screen.getByPlaceholderText(/Please detail the infrastructure event/i);

    fireEvent.change(nameInput, { target: { value: 'Dr. Vikramaditya Sen' } });
    fireEvent.change(emailInput, { target: { value: 'librarian@delhi.library.gov.in' } });
    fireEvent.change(messageInput, {
      target: { value: 'Database replica synchronization timeout on cluster shard 2.' },
    });

    const submitBtn = screen.getByRole('button', { name: /Escalate to Super Admin/i });
    fireEvent.click(submitBtn);

    expect(screen.getByText(/ARCHIVAL DISPATCH CONFIRMED/i)).toBeInTheDocument();
    expect(screen.getAllByText(/TKT-2026-ADM-/i).length).toBeGreaterThan(0);

    const tickets = mockDb.getTickets();
    expect(tickets.length).toBe(1);
    const adminTicket = tickets[0];
    expect(adminTicket?.recipientEmail).toBe(ADMIN_RECIPIENT_EMAIL);
    expect(adminTicket?.role).toBe('ADMIN');
  });
});
