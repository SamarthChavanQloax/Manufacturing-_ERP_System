import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, Between } from 'typeorm';
import { Part, Invoice } from '../entities';

@Injectable()
export class AiService {
  constructor(
    @InjectRepository(Part)
    private partsRepo: Repository<Part>,
    @InjectRepository(Invoice)
    private invoicesRepo: Repository<Invoice>,
  ) {}

  async getStockIntelligence() {
    const parts = await this.partsRepo.find();
    
    // Look back 90 days for historical consumption
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];
    
    const ninetyDaysAgo = new Date();
    ninetyDaysAgo.setDate(today.getDate() - 90);
    const ninetyDaysAgoStr = ninetyDaysAgo.toISOString().split('T')[0];

    const invoices = await this.invoicesRepo.find({
      where: {
        created_date: Between(ninetyDaysAgoStr, todayStr)
      },
    });

    const insights = parts.map((part) => {
      const partInvoices = invoices.filter(inv => inv.part_id === part.id);
      
      const historicalDemand = partInvoices.reduce((sum, inv) => sum + Number(inv.qty), 0);
      const dailyConsumption = historicalDemand / 90;
      
      // Calculate trend (last 30 days vs previous 60 days)
      const thirtyDaysAgo = new Date();
      thirtyDaysAgo.setDate(today.getDate() - 30);
      const thirtyDaysAgoStr = thirtyDaysAgo.toISOString().split('T')[0];
      
      const recentInvoices = partInvoices.filter(inv => inv.created_date >= thirtyDaysAgoStr);
      const recentDemand = recentInvoices.reduce((sum, inv) => sum + Number(inv.qty), 0);
      const recentDaily = recentDemand / 30;
      
      let trendMultiplier = 1;
      let trendReason = 'Stable';
      
      if (dailyConsumption > 0) {
        if (recentDaily > dailyConsumption * 1.2) {
          trendMultiplier = 1.3; // Upward trend
          trendReason = 'Recent consumption increased significantly';
        } else if (recentDaily < dailyConsumption * 0.8) {
          trendMultiplier = 0.8; // Downward trend
          trendReason = 'Recent consumption decreased';
        }
      }

      // Forecast next 30 days with a 15% safety buffer and trend applied
      let forecastedDemand = Math.ceil((dailyConsumption * 30) * trendMultiplier * 1.15);
      
      if (historicalDemand === 0) {
        forecastedDemand = 0; // No data to forecast
        trendReason = 'No historical consumption data';
      }

      const currentStock = Number(part.qty || 0);
      const projectedShortage = Math.max(0, forecastedDemand - currentStock);
      
      let depletionDays = -1;
      if (dailyConsumption > 0) {
        depletionDays = Math.floor(currentStock / (dailyConsumption * trendMultiplier));
      }

      let riskLevel = 'LOW';
      let confidence = 85;

      if (historicalDemand === 0) {
        confidence = 0;
      } else if (projectedShortage > 0) {
        riskLevel = 'HIGH';
        confidence = 90; // High confidence if we're actively depleting stock rapidly
      } else if (depletionDays > 0 && depletionDays <= 45) {
        riskLevel = 'MEDIUM';
        confidence = 80;
      }

      return {
        part_id: part.id,
        part_number: part.part_number,
        part_description: part.part_description,
        current_stock: currentStock,
        historical_demand_90d: historicalDemand,
        forecasted_demand_30d: forecastedDemand,
        projected_shortage: projectedShortage,
        depletion_days: depletionDays,
        trend_reason: trendReason,
        risk_level: riskLevel,
        confidence_score: confidence
      };
    });

    // Sort by Risk (HIGH -> MEDIUM -> LOW)
    const riskOrder: Record<string, number> = { 'HIGH': 1, 'MEDIUM': 2, 'LOW': 3 };
    insights.sort((a, b) => {
      return riskOrder[a.risk_level] - riskOrder[b.risk_level] || a.depletion_days - b.depletion_days;
    });

    return insights;
  }
}
