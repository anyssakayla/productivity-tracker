export interface TrendsPeriod {
  label: string;
  value: 'week' | 'month' | '3months' | 'year' | 'all';
  days: number | null; // null means all time
}

export interface DateRange {
  startDate: string;
  endDate: string;
  label: string;
}

export interface CategoryTrendData {
  categoryId: string;
  categoryName: string;
  categoryEmoji: string;
  categoryColor: string;
  totalEntries: number;
  totalTasks: number;
  totalMinutes: number;
  avgTasksPerDay: number;
  avgMinutesPerDay: number;
  daysActive: number;
  percentage: number; // of total activity
  growth?: number; // compared to previous period
}

export interface TimeSeriesData {
  date: string;
  value: number;
  categories?: {
    [categoryId: string]: number;
  };
}

export interface ProductivityScore {
  score: number; // 0-100
  consistency: number; // streak impact
  taskCompletion: number; // task quantity impact
  timeUtilization: number; // time tracking impact
  categoryBalance: number; // diversity impact
  trend: 'up' | 'down' | 'stable';
  comparison?: {
    previousPeriod: number;
    change: number;
  };
}

export interface InsightData {
  type: 'streak' | 'peak_day' | 'top_category' | 'improvement' | 'consistency';
  title: string;
  description: string;
  value?: string | number;
  trend?: 'up' | 'down' | 'stable';
  emoji?: string;
}

export interface CategoryComparison {
  categoryId: string;
  categoryName: string;
  categoryEmoji: string;
  categoryColor: string;
  currentPeriod: {
    tasks: number;
    minutes: number;
    daysActive: number;
  };
  previousPeriod: {
    tasks: number;
    minutes: number;
    daysActive: number;
  };
  growth: {
    tasks: number; // percentage
    minutes: number; // percentage
    daysActive: number; // percentage
  };
  rank: number;
}

export interface TopTaskData {
  taskId: string | null;
  taskName: string;
  categoryName: string;
  categoryEmoji: string;
  totalCompletions: number;
  avgCompletionsPerDay: number;
  isOtherTask: boolean;
  rank: number;
}

export interface StreakInfo {
  currentStreak: number;
  longestStreak: number;
  totalActiveDays: number;
  streakDates: string[];
  lastActiveDate: string | null;
  isActive: boolean; // current streak is active
}

export interface TrendsData {
  period: TrendsPeriod;
  dateRange: DateRange;
  categoryBreakdown: CategoryTrendData[];
  timeSeriesData: TimeSeriesData[];
  productivityScore: ProductivityScore;
  insights: InsightData[];
  categoryComparison?: CategoryComparison[];
  topTasks: TopTaskData[];
  streakInfo: StreakInfo;
  summary: {
    totalTasks: number;
    totalMinutes: number;
    totalDays: number;
    activeDays: number;
    avgTasksPerDay: number;
    avgMinutesPerDay: number;
    categoriesUsed: number;
  };
}

export interface ChartData {
  labels: string[];
  datasets: {
    data: number[];
    colors?: string[];
    strokeWidth?: number;
  }[];
}

export interface PieChartData {
  name: string;
  population: number;
  color: string;
  legendFontColor: string;
  legendFontSize: number;
}