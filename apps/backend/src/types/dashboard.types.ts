/**
 * Cloud-Native Library Management System (LMS)
 * Administrative Dashboard Domain Types
 *
 * Governed by Phase 1 (FR-ADMIN-001) and Phase 4 Section 12.5.
 */

export interface ICatalogKpis {
  totalTitles: number;
  totalCopies: number;
  availableCopies: number;
}

export interface ICirculationKpis {
  activeLoans: number;
  overdueLoans: number;
}

export interface IUserKpis {
  totalRegisteredUsers: number;
  activePatrons: number;
  suspendedPatrons: number;
}

export interface IDashboardKpis {
  catalog: ICatalogKpis;
  circulation: ICirculationKpis;
  users: IUserKpis;
  calculatedAt: string;
}
