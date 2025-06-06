import { DashboardMetrics } from '../types';
import { salesService } from './sales';
import { deliveriesService } from './deliveries';

export const dashboardService = {
  async getDashboardMetrics(): Promise<DashboardMetrics> {
    try {
      // Get all sales
      const sales = await salesService.getSales();
      
      // Calculate sales metrics
      const totalSales = sales.length;
      const codSales = sales.filter(sale => sale.type === 'COD');
      const creditSales = sales.filter(sale => sale.type === 'CREDIT');
      
      const codPercentage = totalSales > 0 
        ? (codSales.length / totalSales) * 100 
        : 0;
      
      const creditPercentage = totalSales > 0 
        ? (creditSales.length / totalSales) * 100 
        : 0;

      // Get delivery metrics
      const deliveryMetrics = await deliveriesService.getDeliveryMetrics();
      
      return {
        totalSales,
        codPercentage,
        creditPercentage,
        deliveriesThisMonth: deliveryMetrics.totalDeliveries,
        averageDollarsPerDelivery: deliveryMetrics.averageAmount,
        deliveriesPerArea: deliveryMetrics.deliveriesPerArea,
      };
    } catch (error) {
      console.error('Error getting dashboard metrics:', error);
      throw error;
    }
  },
}; 