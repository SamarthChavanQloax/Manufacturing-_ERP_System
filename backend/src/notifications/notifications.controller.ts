import {
  Controller,
  Get,
  Post,
  Patch,
  Param,
  Query,
  Body,
  UseGuards,
  Request,
  ForbiddenException,
} from '@nestjs/common';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { NotificationService, CreateNotificationDto } from './notifications.service';

@Controller('api/notifications')
@UseGuards(JwtAuthGuard)
export class NotificationsController {
  constructor(private readonly notificationService: NotificationService) {}

  // Get paginated notifications for current user/role
  @Get()
  async getNotifications(
    @Request() req: any,
    @Query('page') page?: number,
    @Query('limit') limit?: number,
    @Query('type') type?: string,
    @Query('priority') priority?: string,
    @Query('is_read') is_read?: string,
    @Query('search') search?: string,
    @Query('entity_type') entity_type?: string,
  ) {
    return this.notificationService.getNotifications(req.user, {
      page,
      limit,
      type,
      priority,
      is_read,
      search,
      entity_type,
    });
  }

  // Fast unread count for top header bell badge
  @Get('unread-count')
  async getUnreadCount(@Request() req: any) {
    return this.notificationService.getUnreadCount(req.user);
  }

  // Summary breakdown for Admin Overview
  @Get('summary')
  async getSummary(@Request() req: any) {
    return this.notificationService.getSummary(req.user);
  }

  // Mark single notification as read
  @Patch(':id/read')
  async markAsRead(@Param('id') id: string, @Request() req: any) {
    return this.notificationService.markAsRead(Number(id), req.user);
  }

  // Mark all notifications as read
  @Post('mark-all-read')
  async markAllRead(@Request() req: any) {
    return this.notificationService.markAllAsRead(req.user);
  }

  // Resolve an alert (Supervisor/Admin action)
  @Post(':id/resolve')
  async resolveNotification(
    @Param('id') id: string,
    @Body() body: { note?: string },
    @Request() req: any,
  ) {
    const userRole = (req.user?.role || req.user?.type || 'admin').toLowerCase();
    if (userRole !== 'admin' && userRole !== 'gate') {
      throw new ForbiddenException('Only Admin or Gate Supervisors can resolve security alerts.');
    }
    return this.notificationService.resolveNotification(Number(id), body, req.user);
  }

  // Test notification trigger endpoint (Admin only)
  @Post('trigger-test')
  async triggerTestNotification(
    @Body() body: CreateNotificationDto,
    @Request() req: any,
  ) {
    const userRole = (req.user?.role || req.user?.type || 'admin').toLowerCase();
    if (userRole !== 'admin') {
      throw new ForbiddenException('Only Admin can trigger test notifications.');
    }
    return this.notificationService.createNotification(body);
  }
}
