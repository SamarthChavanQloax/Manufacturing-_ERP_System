import { Controller, Get, Post, Body, Param, UseGuards, Request } from '@nestjs/common';
import { VerificationService } from './verification.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';

@Controller('api/verification')
@UseGuards(JwtAuthGuard, RolesGuard)
export class VerificationController {
  constructor(private verificationService: VerificationService) {}

  @Post('start')
  @Roles('admin', 'gate')
  async start(@Body() body: { invoice_barcode?: string; invoice_number?: string }, @Request() req: any) {
    const barcode = body.invoice_barcode || body.invoice_number || '';
    return this.verificationService.startVerification(String(barcode), req.user.userId);
  }

  @Get()
  @Roles('admin', 'gate')
  async getAll() {
    return this.verificationService.findAll();
  }

  @Get(':id')
  @Roles('admin', 'gate')
  async getOne(@Param('id') id: string) {
    return this.verificationService.findOne(Number(id));
  }

  @Post('scan-box')
  @Roles('admin', 'gate')
  async scanBox(
    @Body() body: { match_id?: number; invoice_match_id?: number; box_barcode?: string; box_id?: string },
    @Request() req: any,
  ) {
    const matchId = body.match_id || body.invoice_match_id || 0;
    const boxBarcode = body.box_barcode || body.box_id || '';
    return this.verificationService.scanBox(Number(matchId), String(boxBarcode), req.user.userId);
  }

  @Post('return')
  @Roles('admin', 'gate')
  async returnInvoice(@Body() body: { match_id?: number; invoice_match_id?: number; invoice_barcode?: string }) {
    const matchId = body.match_id || body.invoice_match_id || 0;
    return this.verificationService.returnInvoice(Number(matchId), body.invoice_barcode);
  }
}
