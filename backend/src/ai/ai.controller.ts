import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { GateRiskService } from './gate-risk.service';
import { DailySecurityBriefingService } from './daily-security-briefing.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';

@Controller('api/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly gateRiskService: GateRiskService,
    private readonly briefingService: DailySecurityBriefingService,
  ) {}

  @Get('stock-intelligence')
  @Roles('admin') // Restricted strictly to admin
  async getStockIntelligence() {
    return this.aiService.getStockIntelligence();
  }

  @Get('security-anomalies')
  @Roles('admin', 'gate') // Relevant for gate and admin
  async getSecurityAnomalies() {
    return this.aiService.getSecurityAnomalies();
  }

  // ----------------------------------------------------
  // AI GATE RISK ANALYSIS ENDPOINTS
  // ----------------------------------------------------

  @Post('gate-risk/analyze')
  @Roles('admin', 'gate')
  async analyzeGateRisk(
    @Body() body: { invoice_barcode?: string; invoice_number?: string; match_id?: number },
    @Request() req: any,
  ) {
    const invoiceBarcode = body.invoice_barcode || body.invoice_number;
    return this.gateRiskService.analyzeGateTransaction({
      invoice_barcode: invoiceBarcode,
      match_id: body.match_id ? Number(body.match_id) : undefined,
      user_id: req.user?.userId,
    });
  }

  @Get('gate-risk/match/:matchId')
  @Roles('admin', 'gate')
  async getRiskForMatch(@Param('matchId') matchId: string) {
    return this.gateRiskService.getRiskForMatch(Number(matchId));
  }

  @Get('gate-risk/dashboard')
  @Roles('admin', 'gate')
  async getGateRiskDashboard() {
    return this.gateRiskService.getDashboardSummary();
  }

  @Get('gate-risk/transactions')
  @Roles('admin', 'gate')
  async getGateRiskTransactions(
    @Query('risk_level') riskLevel?: string,
    @Query('review_status') reviewStatus?: string,
    @Query('search') search?: string,
    @Query('limit') limit?: string,
    @Query('page') page?: string,
  ) {
    return this.gateRiskService.getTransactions({
      risk_level: riskLevel,
      review_status: reviewStatus,
      search: search,
      limit: limit ? Number(limit) : 25,
      page: page ? Number(page) : 1,
    });
  }

  @Get('gate-risk/transaction/:id')
  @Roles('admin', 'gate')
  async getGateRiskTransactionDetail(@Param('id') id: string) {
    return this.gateRiskService.getTransactionById(Number(id));
  }

  @Post('gate-risk/review')
  @Roles('admin', 'gate')
  async reviewGateRisk(
    @Body()
    body: {
      analysis_id: number;
      decision: 'approved' | 'flagged' | 'rejected';
      note: string;
    },
    @Request() req: any,
  ) {
    return this.gateRiskService.reviewTransaction({
      analysis_id: Number(body.analysis_id),
      decision: body.decision,
      note: body.note,
      user_id: req.user?.userId,
    });
  }

  @Post('gate-risk/log-scan')
  @Roles('admin', 'gate')
  async logGateScan(
    @Body()
    body: {
      match_id?: number;
      invoice_barcode?: string;
      scanned_barcode: string;
      scan_type: string;
      is_valid: boolean;
      failure_reason?: string;
    },
    @Request() req: any,
  ) {
    return this.gateRiskService.logScan({
      match_id: body.match_id ? Number(body.match_id) : undefined,
      invoice_barcode: body.invoice_barcode,
      scanned_barcode: body.scanned_barcode,
      scan_type: body.scan_type || 'box',
      is_valid: body.is_valid,
      failure_reason: body.failure_reason,
      user_id: req.user?.userId,
    });
  }

  @Get('gate-risk/config')
  @Roles('admin')
  async getGateRiskConfig() {
    return this.gateRiskService.getConfigs();
  }

  @Post('gate-risk/config')
  @Roles('admin')
  async updateGateRiskConfig(@Body() body: { key: string; value: string }) {
    return this.gateRiskService.updateConfig(body.key, String(body.value));
  }

  // ----------------------------------------------------
  // AI DAILY SECURITY BRIEFING ENDPOINTS
  // ----------------------------------------------------

  @Get('security-briefing/today')
  @Roles('admin', 'gate')
  async getTodaySecurityBriefing() {
    return this.briefingService.getBriefingForDate();
  }

  @Get('security-briefing/history')
  @Roles('admin', 'gate')
  async getSecurityBriefingHistory() {
    return this.briefingService.getBriefingHistory();
  }

  @Get('security-briefing/:date')
  @Roles('admin', 'gate')
  async getSecurityBriefingByDate(@Param('date') date: string) {
    return this.briefingService.getBriefingForDate(date);
  }

  @Post('security-briefing/generate')
  @Roles('admin', 'gate')
  async generateSecurityBriefing(
    @Body('date') date: string,
    @Request() req: any,
  ) {
    const userName = req.user?.username || req.user?.email || 'admin';
    return this.briefingService.generateBriefing(date, userName);
  }

  @Get('security-briefing/:date/events/:eventId')
  @Roles('admin', 'gate')
  async getSecurityBriefingEventDetail(
    @Param('date') date: string,
    @Param('eventId') eventId: string,
  ) {
    return this.briefingService.getEventDetail(date, eventId);
  }
}
