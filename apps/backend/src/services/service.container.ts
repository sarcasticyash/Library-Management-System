/**
 * Cloud-Native Library Management System (LMS)
 * Application Service Container & Dependency Injection Wiring
 *
 * Enforces strict Clean Architecture dependency boundaries by assembling
 * repository implementations, security utilities, and business services.
 */

import { IAuthService } from './auth.service.interface';
import { AuthService, authService } from './auth.service';
import { IUserService } from './user.service.interface';
import { UserService, userService } from './user.service';
import { ICatalogService } from './catalog.service.interface';
import { CatalogService, catalogService } from './catalog.service';
import { ICirculationService } from './circulation.service.interface';
import { CirculationService, circulationService } from './circulation.service';
import {
  IAdminBookService,
  IAdminCirculationService,
  IAdminDashboardService,
} from './admin.service.interface';
import { AdminService, adminService } from './admin.service';
import { IAuditService } from './audit.service.interface';
import { auditService } from './audit.service';
import { IPasswordService, passwordService } from '../utils/password.service';
import { IJwtService, jwtService } from '../utils/jwt.service';
import {
  userRepository,
  sessionRepository,
  bookRepository,
  borrowingRepository,
  transactionManager,
} from '../repositories';

export interface IServiceContainer {
  authService: IAuthService;
  userService: IUserService;
  catalogService: ICatalogService;
  circulationService: ICirculationService;
  adminService: IAdminBookService & IAdminCirculationService & IAdminDashboardService;
  auditService: IAuditService;
  passwordService: IPasswordService;
  jwtService: IJwtService;
}

/**
 * Creates a fully wired service container with explicit dependency injection.
 */
export function createServiceContainer(
  overrides: Partial<IServiceContainer> = {},
): IServiceContainer {
  const pass = overrides.passwordService || passwordService;
  const jwt = overrides.jwtService || jwtService;
  const audit = overrides.auditService || auditService;

  const auth =
    overrides.authService || new AuthService(userRepository, sessionRepository, pass, jwt, audit);

  const user =
    overrides.userService ||
    new UserService(userRepository, sessionRepository, transactionManager, pass, audit);

  const catalog = overrides.catalogService || new CatalogService(bookRepository);

  const circulation =
    overrides.circulationService ||
    new CirculationService(
      borrowingRepository,
      bookRepository,
      userRepository,
      transactionManager,
      audit,
    );

  const admin =
    overrides.adminService ||
    new AdminService(
      bookRepository,
      borrowingRepository,
      userRepository,
      transactionManager,
      audit,
    );

  return {
    authService: auth,
    userService: user,
    catalogService: catalog,
    circulationService: circulation,
    adminService: admin,
    auditService: audit,
    passwordService: pass,
    jwtService: jwt,
  };
}

/**
 * Default application service container singleton.
 */
export const serviceContainer: IServiceContainer = {
  authService,
  userService,
  catalogService,
  circulationService,
  adminService,
  auditService,
  passwordService,
  jwtService,
};
