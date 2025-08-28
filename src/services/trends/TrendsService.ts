import DatabaseService from '../database/DatabaseService';
import {
  TrendsPeriod,
  DateRange,
  TrendsData,
  CategoryTrendData,
  TimeSeriesData,
  ProductivityScore,
  InsightData,
  CategoryComparison,
  TopTaskData,
  StreakInfo,
  ChartData,
  PieChartData
} from '@/types';
import { addDays, subDays, format, startOfWeek, startOfMonth, startOfYear } from 'date-fns';

export const TRENDS_PERIODS: TrendsPeriod[] = [
  { label: 'Week', value: 'week', days: 7 },
  { label: 'Month', value: 'month', days: 30 },
  { label: '3 Months', value: '3months', days: 90 },
  { label: 'Year', value: 'year', days: 365 },
  { label: 'All Time', value: 'all', days: null }
];

class TrendsService {
  
  /**
   * Generate date range for a given period
   */
  getDateRange(period: TrendsPeriod, customEndDate?: Date): DateRange {
    const endDate = customEndDate || new Date();
    let startDate: Date;
    let label: string;

    switch (period.value) {
      case 'week':
        startDate = startOfWeek(subDays(endDate, 6));
        label = 'Last 7 days';
        break;
      case 'month':
        startDate = subDays(endDate, 29);
        label = 'Last 30 days';
        break;
      case '3months':
        startDate = subDays(endDate, 89);
        label = 'Last 3 months';
        break;
      case 'year':
        startDate = subDays(endDate, 364);
        label = 'Last year';
        break;
      case 'all':
        startDate = new Date('2020-01-01'); // Far enough back
        label = 'All time';
        break;
      default:
        startDate = subDays(endDate, 29);
        label = 'Last 30 days';
    }

    return {
      startDate: format(startDate, 'yyyy-MM-dd'),
      endDate: format(endDate, 'yyyy-MM-dd'),
      label
    };
  }

  /**
   * Get previous period for comparison
   */
  getPreviousPeriodRange(currentRange: DateRange, period: TrendsPeriod): DateRange {
    const currentStart = new Date(currentRange.startDate);
    const currentEnd = new Date(currentRange.endDate);
    const duration = currentEnd.getTime() - currentStart.getTime();
    
    const previousEnd = new Date(currentStart.getTime() - 24 * 60 * 60 * 1000); // Day before current start
    const previousStart = new Date(previousEnd.getTime() - duration);

    return {
      startDate: format(previousStart, 'yyyy-MM-dd'),
      endDate: format(previousEnd, 'yyyy-MM-dd'),
      label: `Previous ${period.label.toLowerCase()}`
    };
  }

  /**
   * Get comprehensive trends data for a focus
   */
  async getTrendsData(focusId: string, period: TrendsPeriod): Promise<TrendsData> {
    const dateRange = this.getDateRange(period);
    const previousRange = this.getPreviousPeriodRange(dateRange, period);

    // Fetch all required data in parallel
    const [
      categoryData,
      previousCategoryData,
      taskCompletionStats,
      timeTrackingStats,
      topTasks,
      streakData
    ] = await Promise.all([
      DatabaseService.getAggregatedCategoryData(focusId, dateRange.startDate, dateRange.endDate),
      DatabaseService.getAggregatedCategoryData(focusId, previousRange.startDate, previousRange.endDate),
      DatabaseService.getTaskCompletionStats(focusId, dateRange.startDate, dateRange.endDate),
      DatabaseService.getTimeTrackingStats(focusId, dateRange.startDate, dateRange.endDate),
      DatabaseService.getTopTasks(focusId, dateRange.startDate, dateRange.endDate, 10),
      DatabaseService.getStreakData(focusId)
    ]);

    // Process category breakdown with growth calculations
    const categoryBreakdown = this.processCategoryBreakdown(categoryData, previousCategoryData);
    
    // Generate time series data
    const timeSeriesData = this.generateTimeSeriesData(taskCompletionStats, timeTrackingStats);
    
    // Calculate productivity score
    const productivityScore = this.calculateProductivityScore(
      categoryData,
      previousCategoryData,
      streakData,
      timeTrackingStats
    );
    
    // Generate insights
    const insights = this.generateInsights(
      categoryBreakdown,
      streakData,
      timeTrackingStats,
      topTasks
    );
    
    // Process category comparison
    const categoryComparison = this.processCategoryComparison(categoryData, previousCategoryData);
    
    // Process top tasks
    const processedTopTasks = this.processTopTasks(topTasks);
    
    // Calculate summary statistics
    const summary = this.calculateSummary(categoryData, timeTrackingStats, dateRange);

    return {
      period,
      dateRange,
      categoryBreakdown,
      timeSeriesData,
      productivityScore,
      insights,
      categoryComparison,
      topTasks: processedTopTasks,
      streakInfo: this.processStreakInfo(streakData),
      summary
    };
  }

  /**
   * Process category breakdown data with growth calculations
   */
  private processCategoryBreakdown(
    currentData: any[], 
    previousData: any[]
  ): CategoryTrendData[] {
    const totalTasks = currentData.reduce((sum, cat) => sum + cat.totalTasks, 0);
    const totalMinutes = currentData.reduce((sum, cat) => sum + cat.totalMinutes, 0);

    return currentData.map(cat => {
      const previous = previousData.find(prev => prev.categoryId === cat.categoryId);
      let growth = 0;
      
      if (previous && previous.totalTasks > 0) {
        growth = ((cat.totalTasks - previous.totalTasks) / previous.totalTasks) * 100;
      } else if (cat.totalTasks > 0 && !previous) {
        growth = 100; // New category
      }

      const percentage = totalTasks > 0 ? (cat.totalTasks / totalTasks) * 100 : 0;

      return {
        ...cat,
        percentage: Math.round(percentage * 100) / 100,
        growth: Math.round(growth * 100) / 100
      };
    }).sort((a, b) => b.totalTasks - a.totalTasks);
  }

  /**
   * Generate time series data for charts
   */
  private generateTimeSeriesData(
    taskStats: any[],
    timeStats: any[]
  ): TimeSeriesData[] {
    // Create a map of all dates in the range
    const dateMap: Record<string, TimeSeriesData> = {};
    
    // Process task completion data
    taskStats.forEach(stat => {
      if (!dateMap[stat.date]) {
        dateMap[stat.date] = {
          date: stat.date,
          value: 0,
          categories: {}
        };
      }
      dateMap[stat.date].value += stat.taskCompletions;
      dateMap[stat.date].categories![stat.categoryId] = stat.taskCompletions;
    });

    // Sort by date
    return Object.values(dateMap).sort((a, b) => a.date.localeCompare(b.date));
  }

  /**
   * Calculate productivity score based on various factors
   */
  private calculateProductivityScore(
    currentData: any[],
    previousData: any[],
    streakData: any,
    timeStats: any[]
  ): ProductivityScore {
    // Consistency score (0-30) - based on streak and active days
    const maxStreak = Math.max(streakData.longestStreak, 1);
    const consistencyScore = Math.min(30, (streakData.currentStreak / maxStreak) * 30);

    // Task completion score (0-30) - based on task quantity and regularity
    const totalTasks = currentData.reduce((sum, cat) => sum + cat.totalTasks, 0);
    const activeDays = Math.max(1, currentData.reduce((max, cat) => Math.max(max, cat.daysActive), 1));
    const avgTasksPerDay = totalTasks / activeDays;
    const taskScore = Math.min(30, avgTasksPerDay * 3); // Assuming 10 tasks/day is excellent

    // Time utilization score (0-25) - based on time tracking usage
    const daysWithTime = timeStats.filter(day => day.totalMinutes > 0).length;
    const timeUtilizationScore = Math.min(25, (daysWithTime / activeDays) * 25);

    // Category balance score (0-15) - diversity of category usage
    const activeCategories = currentData.filter(cat => cat.totalTasks > 0).length;
    const totalCategories = Math.max(1, currentData.length);
    const balanceScore = Math.min(15, (activeCategories / totalCategories) * 15);

    const totalScore = Math.round(consistencyScore + taskScore + timeUtilizationScore + balanceScore);

    // Calculate trend
    const previousTotalTasks = previousData.reduce((sum, cat) => sum + cat.totalTasks, 0);
    let trend: 'up' | 'down' | 'stable' = 'stable';
    let comparison;
    
    if (previousTotalTasks > 0) {
      const change = ((totalTasks - previousTotalTasks) / previousTotalTasks) * 100;
      if (change > 5) trend = 'up';
      else if (change < -5) trend = 'down';
      
      comparison = {
        previousPeriod: totalScore, // Simplified - would need historical score storage
        change: Math.round(change * 100) / 100
      };
    }

    return {
      score: Math.min(100, totalScore),
      consistency: Math.round(consistencyScore),
      taskCompletion: Math.round(taskScore),
      timeUtilization: Math.round(timeUtilizationScore),
      categoryBalance: Math.round(balanceScore),
      trend,
      comparison
    };
  }

  /**
   * Generate insights based on data analysis
   */
  private generateInsights(
    categoryData: CategoryTrendData[],
    streakData: any,
    timeStats: any[],
    topTasks: any[]
  ): InsightData[] {
    const insights: InsightData[] = [];

    // Streak insight
    if (streakData.currentStreak > 0) {
      insights.push({
        type: 'streak',
        title: 'Current Streak',
        description: `You're on a ${streakData.currentStreak}-day streak! Keep it up!`,
        value: streakData.currentStreak,
        trend: 'up',
        emoji: '🔥'
      });
    }

    // Peak day insight
    const peakDay = timeStats.reduce((max, day) => 
      day.totalMinutes > max.totalMinutes ? day : max, 
      { date: '', totalMinutes: 0, categoriesActive: 0 }
    );
    
    if (peakDay.totalMinutes > 0) {
      const dayName = new Date(peakDay.date).toLocaleDateString('en-US', { weekday: 'long' });
      insights.push({
        type: 'peak_day',
        title: 'Most Productive Day',
        description: `${dayName} was your most productive day with ${Math.round(peakDay.totalMinutes)} minutes of tracked time`,
        value: dayName,
        emoji: '⚡'
      });
    }

    // Top category insight
    const topCategory = categoryData.find(cat => cat.totalTasks > 0);
    if (topCategory) {
      insights.push({
        type: 'top_category',
        title: 'Top Category',
        description: `${topCategory.categoryEmoji} ${topCategory.categoryName} was your most active category with ${topCategory.totalTasks} tasks completed`,
        value: topCategory.categoryName,
        emoji: topCategory.categoryEmoji
      });
    }

    // Improvement insight
    const improvedCategory = categoryData.find(cat => cat.growth && cat.growth > 20);
    if (improvedCategory) {
      insights.push({
        type: 'improvement',
        title: 'Great Progress!',
        description: `${improvedCategory.categoryEmoji} ${improvedCategory.categoryName} improved by ${Math.round(improvedCategory.growth!)}%`,
        value: `+${Math.round(improvedCategory.growth!)}%`,
        trend: 'up',
        emoji: '📈'
      });
    }

    return insights.slice(0, 4); // Limit to 4 insights
  }

  /**
   * Process category comparison data
   */
  private processCategoryComparison(
    currentData: any[],
    previousData: any[]
  ): CategoryComparison[] {
    return currentData.map((cat, index) => {
      const previous = previousData.find(prev => prev.categoryId === cat.categoryId) || {
        totalTasks: 0,
        totalMinutes: 0,
        daysActive: 0
      };

      const taskGrowth = previous.totalTasks > 0 
        ? ((cat.totalTasks - previous.totalTasks) / previous.totalTasks) * 100
        : cat.totalTasks > 0 ? 100 : 0;

      const minuteGrowth = previous.totalMinutes > 0 
        ? ((cat.totalMinutes - previous.totalMinutes) / previous.totalMinutes) * 100
        : cat.totalMinutes > 0 ? 100 : 0;

      const daysGrowth = previous.daysActive > 0 
        ? ((cat.daysActive - previous.daysActive) / previous.daysActive) * 100
        : cat.daysActive > 0 ? 100 : 0;

      return {
        categoryId: cat.categoryId,
        categoryName: cat.categoryName,
        categoryEmoji: cat.categoryEmoji,
        categoryColor: cat.categoryColor,
        currentPeriod: {
          tasks: cat.totalTasks,
          minutes: cat.totalMinutes,
          daysActive: cat.daysActive
        },
        previousPeriod: {
          tasks: previous.totalTasks,
          minutes: previous.totalMinutes,
          daysActive: previous.daysActive
        },
        growth: {
          tasks: Math.round(taskGrowth * 100) / 100,
          minutes: Math.round(minuteGrowth * 100) / 100,
          daysActive: Math.round(daysGrowth * 100) / 100
        },
        rank: index + 1
      };
    });
  }

  /**
   * Process top tasks data
   */
  private processTopTasks(tasksData: any[]): TopTaskData[] {
    return tasksData.map((task, index) => ({
      ...task,
      rank: index + 1
    }));
  }

  /**
   * Process streak information
   */
  private processStreakInfo(streakData: any): StreakInfo {
    const today = new Date().toISOString().split('T')[0];
    const yesterday = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    const isActive = streakData.streakDates.includes(today) || 
                    (streakData.streakDates.includes(yesterday) && streakData.currentStreak > 0);

    return {
      ...streakData,
      isActive
    };
  }

  /**
   * Calculate summary statistics
   */
  private calculateSummary(
    categoryData: any[],
    timeStats: any[],
    dateRange: DateRange
  ) {
    const totalTasks = categoryData.reduce((sum, cat) => sum + cat.totalTasks, 0);
    const totalMinutes = categoryData.reduce((sum, cat) => sum + cat.totalMinutes, 0);
    const activeDays = Math.max(...categoryData.map(cat => cat.daysActive), 0);
    const categoriesUsed = categoryData.filter(cat => cat.totalTasks > 0).length;
    
    const totalDays = Math.ceil(
      (new Date(dateRange.endDate).getTime() - new Date(dateRange.startDate).getTime()) 
      / (1000 * 60 * 60 * 24)
    ) + 1;

    return {
      totalTasks,
      totalMinutes,
      totalDays,
      activeDays,
      avgTasksPerDay: Math.round((totalTasks / totalDays) * 100) / 100,
      avgMinutesPerDay: Math.round((totalMinutes / totalDays) * 100) / 100,
      categoriesUsed
    };
  }

  /**
   * Convert category data to pie chart format
   */
  toPieChartData(categoryData: CategoryTrendData[]): PieChartData[] {
    const activeCategories = categoryData.filter(cat => cat.totalTasks > 0);
    
    return activeCategories.map(cat => ({
      name: cat.categoryName,
      population: cat.totalTasks,
      color: cat.categoryColor,
      legendFontColor: '#7F7F7F',
      legendFontSize: 12
    }));
  }

  /**
   * Convert time series data to line chart format
   */
  toLineChartData(timeSeriesData: TimeSeriesData[]): ChartData {
    return {
      labels: timeSeriesData.map(data => {
        const date = new Date(data.date);
        return format(date, 'MM/dd');
      }),
      datasets: [{
        data: timeSeriesData.map(data => data.value),
        strokeWidth: 2
      }]
    };
  }

  /**
   * Convert time tracking data to bar chart format
   */
  toBarChartData(timeStats: any[]): ChartData {
    return {
      labels: timeStats.map(stat => {
        const date = new Date(stat.date);
        return format(date, 'MM/dd');
      }),
      datasets: [{
        data: timeStats.map(stat => Math.round(stat.totalMinutes / 60 * 10) / 10) // Convert to hours
      }]
    };
  }
}

export default new TrendsService();