import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Part, Invoice, Box, Packing, UserInfo, InvoiceMatch } from '../entities';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(Part)
    private partsRepo: Repository<Part>,
    @InjectRepository(Invoice)
    private invoicesRepo: Repository<Invoice>,
    @InjectRepository(Box)
    private boxesRepo: Repository<Box>,
    @InjectRepository(Packing)
    private packingRepo: Repository<Packing>,
    @InjectRepository(UserInfo)
    private usersRepo: Repository<UserInfo>,
    @InjectRepository(InvoiceMatch)
    private verificationRepo: Repository<InvoiceMatch>,
  ) {}

  async getStockIntelligence() {
    const parts = await this.partsRepo.find();
    const invoices = await this.invoicesRepo.find();

    const today = new Date();
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(today.getDate() - 30);
    const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];

    const getInvDate = (inv: Invoice): string => {
      const d1 = inv.created_time || '';
      const d2 = inv.created_date || '';
      if (d1.includes('-')) return d1.trim().split(' ')[0];
      if (d2.includes('-')) return d2.trim().split(' ')[0];
      return '';
    };

    const insights = parts.map((part) => {
      const partInvoices = invoices.filter((inv) => Number(inv.part_id) === Number(part.id));
      const historicalDemand = partInvoices.reduce((sum, inv) => sum + Number(inv.qty || 0), 0);
      const currentStock = Number(part.qty || 0);

      // Daily consumption based on historical invoices
      const dailyConsumption = historicalDemand > 0 ? historicalDemand / 90 : 0;

      // Calculate trend from recent invoices
      const recentInvoices = partInvoices.filter((inv) => {
        const d = getInvDate(inv);
        return d && d >= thirtyDaysAgoStr;
      });
      const recentDemand = recentInvoices.reduce((sum, inv) => sum + Number(inv.qty || 0), 0);
      const recentDaily = recentDemand / 30;

      let trendMultiplier = 1;
      let trendReason = 'Stable demand';

      if (dailyConsumption > 0) {
        if (recentDaily > dailyConsumption * 1.2) {
          trendMultiplier = 1.3;
          trendReason = 'Recent customer demand increased significantly';
        } else if (recentDaily < dailyConsumption * 0.8 && recentDaily > 0) {
          trendMultiplier = 0.8;
          trendReason = 'Recent consumption decreased';
        }
      }

      // Forecast next 30 days
      let forecastedDemand = 0;
      if (historicalDemand > 0) {
        forecastedDemand = Math.max(10, Math.ceil(dailyConsumption * 30 * trendMultiplier * 1.15));
      }

      let projectedShortage = 0;
      let depletionDays = -1;
      let riskLevel: 'HIGH' | 'MEDIUM' | 'LOW' = 'LOW';
      let confidence = 85;

      if (dailyConsumption > 0) {
        depletionDays = Math.floor(currentStock / (dailyConsumption * trendMultiplier));
      }

      // Risk & Shortage calculation
      if (currentStock <= 0) {
        riskLevel = 'HIGH';
        confidence = 90;
        forecastedDemand = Math.max(forecastedDemand, 50);
        projectedShortage = forecastedDemand;
        trendReason = historicalDemand > 0 ? 'Critical 0 stock with active customer demand' : 'Out of stock - safety restock needed';
      } else if (forecastedDemand > currentStock) {
        riskLevel = 'HIGH';
        confidence = 90;
        projectedShortage = forecastedDemand - currentStock;
        if (depletionDays === 0 || currentStock <= 5) {
          trendReason = 'High demand - stock depletes immediately (critical)';
        } else if (depletionDays > 0 && depletionDays <= 15) {
          trendReason = `High demand - depletes within ${depletionDays} days`;
        } else {
          trendReason = 'High demand exceeds current warehouse stock';
        }
      } else if (currentStock <= 20) {
        riskLevel = 'MEDIUM';
        confidence = 80;
        projectedShortage = Math.max(0, 50 - currentStock);
        trendReason = 'Low safety buffer (<= 20 pcs)';
      } else if (depletionDays > 0 && depletionDays <= 45) {
        riskLevel = 'MEDIUM';
        confidence = 80;
        trendReason = `Moderate demand - depletes within ${depletionDays} days`;
      } else if (historicalDemand === 0) {
        confidence = 60;
        trendReason = 'No past invoice dispatch history';
      }

      return {
        part_id: part.id,
        part_number: (part.part_number || '').trim(),
        part_description: (part.part_description || '').trim(),
        current_stock: currentStock,
        historical_demand_90d: historicalDemand,
        forecasted_demand_30d: forecastedDemand,
        projected_shortage: projectedShortage,
        depletion_days: depletionDays,
        trend_reason: trendReason,
        risk_level: riskLevel,
        confidence_score: confidence,
      };
    });

    // Sort by Risk (HIGH -> MEDIUM -> LOW)
    const riskOrder: Record<string, number> = { 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    insights.sort((a, b) => {
      return riskOrder[a.risk_level] - riskOrder[b.risk_level] || a.depletion_days - b.depletion_days;
    });

    return insights;
  }

  async getSecurityAnomalies() {
    const anomalies = [];
    const today = new Date();
    
    // Look back 7 days for anomalies to avoid huge DB scans
    const sevenDaysAgo = new Date();
    sevenDaysAgo.setDate(today.getDate() - 7);
    const sevenDaysAgoStr = sevenDaysAgo.toISOString().split('T')[0];

    // 1. Off-Hours Activity (Gate / Verification)
    const recentVerifications = await this.verificationRepo.find({
      where: { created_time: Between(sevenDaysAgoStr, today.toISOString().split('T')[0]) },
    });
    
    for (const verif of recentVerifications) {
      if (!verif.created_date) continue; // created_date stores time in this legacy DB
      // Parse time (e.g. "23:45:12")
      const hour = parseInt(verif.created_date.split(':')[0], 10);
      if (hour >= 22 || hour < 6) { // Between 10 PM and 6 AM
        anomalies.push({
          id: `off_hours_${verif.id}`,
          type: 'Off-Hours Dispatch',
          severity: 'HIGH',
          description: `Invoice ${verif.invoice_number} was verified at the gate at ${verif.created_date}, which is outside normal operating hours.`,
          timestamp: `${verif.created_time} ${verif.created_date}`,
          entity_id: verif.invoice_number,
          actor_id: verif.created_by,
        });
      }
    }

    // 2. Workflow Bypass (Time-Delta Anomaly)
    // Find recent boxes
    const recentBoxes = await this.boxesRepo.find({
      where: { created_time: Between(sevenDaysAgoStr, today.toISOString().split('T')[0]) },
    });

    const recentInvoices = await this.invoicesRepo.find({
      where: { created_time: Between(sevenDaysAgoStr, today.toISOString().split('T')[0]) },
    });

    for (const inv of recentInvoices) {
      // Find boxes associated with this invoice (in our simplified logic, we just find boxes created by same user on same day)
      // Ideally we would join InvoiceBox, but since we are detecting anomalies on metadata:
      // Note: created_time stores Date (YYYY-MM-DD), created_date stores Time (HH:MM:SS)
      const invDateTime = new Date(`${inv.created_time}T${inv.created_date}`);
      
      // Look for a box created exactly within 2 minutes before the invoice
      const suspiciouslyFastBoxes = recentBoxes.filter(b => {
        if (b.created_by !== inv.created_by) return false;
        if (b.created_time !== inv.created_time) return false;
        const boxDateTime = new Date(`${b.created_time}T${b.created_date}`);
        const diffMs = invDateTime.getTime() - boxDateTime.getTime();
        return diffMs >= 0 && diffMs < 120000; // less than 2 minutes
      });

      if (suspiciouslyFastBoxes.length > 5) { // e.g. 5 boxes packed and invoiced in 2 minutes
        anomalies.push({
          id: `workflow_bypass_${inv.id}`,
          type: 'Workflow Bypass',
          severity: 'CRITICAL',
          description: `Invoice ${inv.invoice_number} generated within 2 minutes of packing ${suspiciouslyFastBoxes.length} boxes. Physically impossible to verify correctly.`,
          timestamp: `${inv.created_time} ${inv.created_date}`,
          entity_id: inv.invoice_number,
          actor_id: inv.created_by,
        });
      }
    }

    // 3. Suspiciously Large Invoice Quantity
    for (const inv of recentInvoices) {
      if (inv.qty > 5000) {
        anomalies.push({
          id: `large_qty_${inv.id}`,
          type: 'Anomalous Quantity',
          severity: 'MEDIUM',
          description: `Invoice ${inv.invoice_number} generated for unusually high quantity (${inv.qty} items).`,
          timestamp: `${inv.created_time} ${inv.created_date}`,
          entity_id: inv.invoice_number,
          actor_id: inv.created_by,
        });
      }
    }

    // Fetch user names for actors
    const users = await this.usersRepo.find();
    const userMap = new Map();
    users.forEach(u => userMap.set(u.id, u.user_name || 'Unknown'));

    anomalies.forEach(a => {
      a.actor_name = userMap.get(a.actor_id) || `User ID ${a.actor_id}`;
    });

    // Sort anomalies by timestamp descending (newest first)
    anomalies.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

    return anomalies;
  }
}
