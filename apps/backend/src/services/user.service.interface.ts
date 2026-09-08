/**
 * Cloud-Native Library Management System (LMS)
 * User Service Application Boundary Interface
 *
 * Governed by Phase 1 (FR-USER-001, FR-USER-002, FR-ADMIN-005)
 * and Phase 4 Section 4.3 & 12.2.
 */

import { ChangePasswordDto, UpdateUserStatusDto } from '../schemas/user.schema';
import { AuthUserContext, IUserPublic } from '../types/user.types';

export interface IUserService {
  /**
   * Retrieves user profile details and current active loan quota counter.
   * Throws 404 RESOURCE_NOT_FOUND if user does not exist.
   */
  getProfile(userId: string): Promise<IUserPublic>;

  /**
   * Updates user password and revokes all active session tokens in a Multi-Doc ACID Tx.
   * Throws 401 INVALID_CREDENTIALS if currentPassword is incorrect.
   */
  changePassword(userId: string, dto: ChangePasswordDto): Promise<void>;

  /**
   * Administratively toggles user status between ACTIVE and SUSPENDED.
   * Executes inside a Tier 1 Multi-Document ACID Transaction with unified audit log.
   */
  updateUserStatus(
    userId: string,
    dto: UpdateUserStatusDto,
    actorContext: AuthUserContext,
  ): Promise<IUserPublic>;
}
