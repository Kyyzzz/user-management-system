import { Injectable, CanActivate, ExecutionContext } from '@nestjs/common';
import { UserRole } from '../../users/entities/user.entity';

@Injectable()
export class SelfOrAdminGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    const request = context.switchToHttp().getRequest();
    const user = request.user;
    const targetUserId = parseInt(request.params.id, 10);

    // Allow if admin
    if (user.role === UserRole.ADMIN) {
      return true;
    }

    // Allow if user is updating their own profile
    if (user.id === targetUserId) {
      return true;
    }

    return false;
  }
}
