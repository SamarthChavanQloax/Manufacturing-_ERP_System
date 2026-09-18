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
  async start(@Body('invoice_barcode') invoiceBarcode: string, @Request() req: any) {
    return this.verificationService.startVerification(invoiceBarcode, req.user.userId);
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
    @Body() body: { match_id: number; box_barcode: string },
    @Request() req: any,
  ) {
    return this.verificationService.scanBox(Number(body.match_id), String(body.box_barcode), req.user.userId);
  }

  @Post('return')
  @Roles('admin', 'gate')
  async returnInvoice(@Body() body: { match_id: number; invoice_barcode: string }) {
    return this.verificationService.returnInvoice(Number(body.match_id), String(body.invoice_barcode));
  }
}
