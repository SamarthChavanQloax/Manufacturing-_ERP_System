import { Controller, Post, Body, UseGuards, Request } from '@nestjs/common';
import { BarcodeService } from './barcode.service';
import { JwtAuthGuard, RolesGuard } from '../auth/guards';
import { Roles } from '../auth/roles.decorator';

@Controller('api/barcode')
@UseGuards(JwtAuthGuard, RolesGuard)
export class BarcodeController {
  constructor(private readonly barcodeService: BarcodeService) {}

  /**
   * Validate a single detected/scanned barcode against the ERP database.
   * Role-aware: Enforces packing/box/invoice/gate permissions.
   */
  @Post('validate')
  @Roles('admin', 'gate', 'packing', 'box', 'invoice')
  async validate(
    @Body() body: { barcode: string; scan_type?: string; match_id?: number },
    @Request() req: any,
  ) {
    return this.barcodeService.validateBarcode(
      body.barcode,
      req.user,
      body.scan_type,
      body.match_id ? Number(body.match_id) : undefined,
    );
  }

  /**
   * Bulk scan validation assistance with duplicate filtering.
   */
  @Post('bulk-validate')
  @Roles('admin', 'gate', 'packing', 'box', 'invoice')
  async bulkValidate(
    @Body() body: { barcodes: string[]; scan_type?: string },
    @Request() req: any,
  ) {
    return this.barcodeService.bulkValidate(body.barcodes, req.user, body.scan_type);
  }
}
