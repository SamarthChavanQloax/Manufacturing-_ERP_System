import { Controller, Get, Post, Body, Param, Query, UseGuards, Request } from '@nestjs/common';
import { AiService } from './ai.service';
import { GateRiskService } from './gate-risk.service';
import { DailySecurityBriefingService } from './daily-security-briefing.service';
import { AskErpService } from './ask-erp.service';
import { GeminiService } from './gemini.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';

@Controller('api/ai')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AiController {
  constructor(
    private readonly aiService: AiService,
    private readonly gateRiskService: GateRiskService,
    private readonly briefingService: DailySecurityBriefingService,
    private readonly askErpService: AskErpService,
    private readonly geminiService: GeminiService,
  ) {}

  @Get('stock-intelligence')
  @Roles('admin') // Restricted strictly to admin
  async getStockIntelligence() {
    return this.aiService.getStockIntelligence();
  }

  @Get('security-anomalies')
  @Roles('admin') // Restricted strictly to admin
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
  @Roles('admin')
  async getGateRiskDashboard() {
    return this.gateRiskService.getDashboardSummary();
  }

  @Get('gate-risk/transactions')
  @Roles('admin')
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
  @Roles('admin')
  async getGateRiskTransactionDetail(@Param('id') id: string) {
    return this.gateRiskService.getTransactionById(Number(id));
  }

  @Post('gate-risk/review')
  @Roles('admin')
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
  @Roles('admin')
  async getTodaySecurityBriefing() {
    return this.briefingService.getBriefingForDate();
  }

  @Get('security-briefing/history')
  @Roles('admin')
  async getSecurityBriefingHistory() {
    return this.briefingService.getBriefingHistory();
  }

  @Get('security-briefing/:date')
  @Roles('admin')
  async getSecurityBriefingByDate(@Param('date') date: string) {
    return this.briefingService.getBriefingForDate(date);
  }

  @Post('security-briefing/generate')
  @Roles('admin')
  async generateSecurityBriefing(
    @Body('date') date: string,
    @Request() req: any,
  ) {
    const userName = req.user?.username || req.user?.email || 'admin';
    return this.briefingService.generateBriefing(date, userName);
  }

  @Get('security-briefing/:date/events/:eventId')
  @Roles('admin')
  async getSecurityBriefingEventDetail(
    @Param('date') date: string,
    @Param('eventId') eventId: string,
  ) {
    return this.briefingService.getEventDetail(date, eventId);
  }

  @Post('security-briefing/:date/sign-off')
  @Roles('admin')
  async signOffSecurityBriefing(
    @Param('date') date: string,
    @Body('note') note: string,
    @Request() req: any,
  ) {
    const userName = req.user?.username || req.user?.email || 'admin';
    return this.briefingService.signOffBriefing(date, userName, note);
  }

  @Post('security-briefing/:date/events/:eventId/review')
  @Roles('admin')
  async reviewSecurityBriefingEvent(
    @Param('date') date: string,
    @Param('eventId') eventId: string,
    @Body('decision') decision: string,
    @Body('note') note: string,
    @Request() req: any,
  ) {
    const userName = req.user?.username || req.user?.email || 'admin';
    return this.briefingService.reviewEvent(date, eventId, userName, decision, note);
  }

  // ----------------------------------------------------
  // ASK ERP AI ASSISTANT ENDPOINTS (Role-Aware)
  // ----------------------------------------------------

  @Post('ask')
  @Roles('admin', 'gate', 'packing', 'box', 'invoice')
  async askErp(
    @Body() body: { query?: string; context?: any },
    @Request() req: any,
  ) {
    return this.askErpService.processQuery(body.query || '', req.user, body.context);
  }

  @Get('ask/suggestions')
  @Roles('admin', 'gate', 'packing', 'box', 'invoice')
  async getAskSuggestions(@Request() req: any) {
    const role = req.user?.type || 'gate';
    return {
      role,
      suggestions: this.askErpService.getSuggestedPrompts(role),
    };
  }

  @Get('status')
  @Roles('admin', 'gate', 'packing', 'box', 'invoice')
  async getAiStatus() {
    const isGeminiAvailable = this.geminiService.isAvailable();
    return {
      status: 'operational',
      provider: isGeminiAvailable ? 'google_gemini' : 'internal_rule_engine',
      gemini_connected: isGeminiAvailable,
      model: isGeminiAvailable ? this.geminiService.getModelName() : 'offline_rule_engine',
      features: {
        natural_language_understanding: isGeminiAvailable,
        semantic_query_parsing: true,
        role_based_access_control: true,
        audit_evidence_trail: true,
      },
    };
  }

  @Post('test-gemini')
  @Roles('admin')
  async testGemini() {
    return this.geminiService.testConnection();
  }
}


