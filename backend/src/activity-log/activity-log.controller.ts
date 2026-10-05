import {
  Controller,
  Get,
  Query,
  UseGuards,
  Request,
} from '@nestjs/common';
import { JwtAuthGuard } from '../auth/guards';
import { ActivityLogService, ActivityQueryDto } from './activity-log.service';

@Controller('api/activity-log')
@UseGuards(JwtAuthGuard)
export class ActivityLogController {
  constructor(private readonly activityService: ActivityLogService) {}

  /**
   * Get activity history according to the user's RBAC:
   * - Admin can view every section and module.
   * - Other users (invoice, gate, packing, box) see their own activity history.
   *
   * Note: The activity log is append-only and strictly immutable. No endpoints exist
   * to modify or delete historical records.
   */
  @Get()
  async getHistory(@Request() req: any, @Query() query: ActivityQueryDto) {
    return this.activityService.getHistory(req.user, query);
  }

  /**
   * Get summary statistics (INSERT, UPDATE, DELETE counts and module breakdown).
   */
  @Get('stats')
  async getStats(@Request() req: any) {
    return this.activityService.getStats(req.user);
  }
}
