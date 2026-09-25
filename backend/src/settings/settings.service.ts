import { Injectable, ForbiddenException } from '@nestjs/common';

@Injectable()
export class SettingsService {
  // Master In-Memory & Default Config Store
  private globalSettings = {
    // 1. Company Profile (Admin only)
    company: {
      companyName: 'Talbros Automotive Components Ltd',
      plantLocation: 'Plant 2 - Gasket & Sealing Division',
      address: 'Plot No. 14, Industrial Area, Sector 7, Faridabad, Haryana 121006',
      gstin: '06AAACT2845L1Z8',
      contactEmail: 'dispatch@talbros.com',
      contactPhone: '+91 129 406 7800',
    },

    // 2. Barcode & Numbering Rules (Admin only)
    barcode: {
      packingPrefix: '100000',
      boxPrefix: '200000',
      invoicePrefix: '300000',
      clearanceCodeFormula: '${invoice_number}4000${match_id}',
      barcodeStandard: 'Code 128 (High Density)',
      autoIncrement: true,
      duplicateScanPrevention: true,
    },

    // 3. Packing Station Defaults (Admin, Packing)
    packing: {
      defaultPackQty: 50,
      defaultPackMode: 'Single Packing',
      stickerSize: '4" x 2" (Standard Industrial Thermal)',
      autoPrintOnCreate: true,
      printerName: 'TVS RP-3150 Thermal Sticker Printer',
    },

    // 4. Box Packing Defaults (Admin, Box)
    box: {
      defaultBoxType: 'Corrugated Master Box (Heavy Duty)',
      defaultBoxCapacity: 500,
      boxLabelSize: '4" x 3" Master Label',
      requireLockConfirmation: true,
      printerName: 'Zebra ZT411 Industrial Label Printer',
    },

    // 5. Invoice & Billing Defaults (Admin, Invoice)
    invoice: {
      invoiceFormat: 'Standard GST Commercial Dispatch Invoice',
      autoPrintInvoiceDoc: true,
      requireFullBoxAllocation: true,
      printerName: 'HP LaserJet Pro M404dn (A4 Document)',
    },

    // 6. Security Gate Defaults (Admin, Gate)
    gate: {
      requireFullBoxScan: true,
      autoIssuePassOnMatch: true,
      autoPrintPass: true,
      printerName: 'Epson TM-T82X Gate Pass Slip Printer',
    },

    // 7. System Health & Database (Admin only)
    system: {
      databaseEngine: 'MySQL 8.0 / TiDB Cloud Enterprise',
      systemHealth: 'Healthy (Operational)',
      uptime: '99.98%',
      lastBackupDate: new Date().toISOString().split('T')[0] + ' 04:00 AM (Automated)',
      jwtSessionExpiry: '24 Hours',
    },
  };

  async getSettingsForRole(role: string) {
    const r = role.toLowerCase();

    // Universal settings for all users
    const userCommon = {
      role: r,
      allowedSections: this.getAllowedSections(r),
    };

    if (r === 'admin') {
      return {
        ...userCommon,
        company: this.globalSettings.company,
        barcode: this.globalSettings.barcode,
        packing: this.globalSettings.packing,
        box: this.globalSettings.box,
        invoice: this.globalSettings.invoice,
        gate: this.globalSettings.gate,
        system: this.globalSettings.system,
      };
    }

    if (r === 'packing') {
      return {
        ...userCommon,
        packing: this.globalSettings.packing,
      };
    }

    if (r === 'box') {
      return {
        ...userCommon,
        box: this.globalSettings.box,
      };
    }

    if (r === 'invoice') {
      return {
        ...userCommon,
        invoice: this.globalSettings.invoice,
      };
    }

    if (r === 'gate') {
      return {
        ...userCommon,
        gate: this.globalSettings.gate,
      };
    }

    return userCommon;
  }

  private getAllowedSections(role: string): string[] {
    const common = ['preferences', 'appearance', 'sound', 'notifications'];
    if (role === 'admin') {
      return [
        ...common,
        'company',
        'barcode',
        'packing',
        'box',
        'invoice',
        'gate',
        'scanner',
        'printers',
        'audit',
        'system',
      ];
    }
    if (role === 'packing') return [...common, 'scanner', 'packing', 'printers'];
    if (role === 'box') return [...common, 'scanner', 'box', 'printers'];
    if (role === 'invoice') return [...common, 'invoice', 'printers'];
    if (role === 'gate') return [...common, 'scanner', 'gate', 'printers'];
    return common;
  }

  async updateSettings(role: string, body: any) {
    const r = role.toLowerCase();

    // Guard: Normal workers cannot modify admin-restricted configurations
    if (body.company || body.barcode || body.system) {
      if (r !== 'admin') {
        throw new ForbiddenException(
          'Access Denied: Only System Administrators can configure Master Company and Barcode rules.',
        );
      }
    }

    if (r === 'admin') {
      if (body.company) this.globalSettings.company = { ...this.globalSettings.company, ...body.company };
      if (body.barcode) this.globalSettings.barcode = { ...this.globalSettings.barcode, ...body.barcode };
      if (body.packing) this.globalSettings.packing = { ...this.globalSettings.packing, ...body.packing };
      if (body.box) this.globalSettings.box = { ...this.globalSettings.box, ...body.box };
      if (body.invoice) this.globalSettings.invoice = { ...this.globalSettings.invoice, ...body.invoice };
      if (body.gate) this.globalSettings.gate = { ...this.globalSettings.gate, ...body.gate };
    } else if (r === 'packing' && body.packing) {
      this.globalSettings.packing = { ...this.globalSettings.packing, ...body.packing };
    } else if (r === 'box' && body.box) {
      this.globalSettings.box = { ...this.globalSettings.box, ...body.box };
    } else if (r === 'invoice' && body.invoice) {
      this.globalSettings.invoice = { ...this.globalSettings.invoice, ...body.invoice };
    } else if (r === 'gate' && body.gate) {
      this.globalSettings.gate = { ...this.globalSettings.gate, ...body.gate };
    }

    return {
      success: true,
      message: 'Settings updated successfully',
      settings: await this.getSettingsForRole(r),
    };
  }
}
