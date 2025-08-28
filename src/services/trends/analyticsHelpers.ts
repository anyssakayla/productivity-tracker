import { format, differenceInDays, parseISO } from 'date-fns';

/**
 * Format time duration to human readable string
 */
export const formatDuration = (minutes: number): string => {
  if (minutes < 60) {
    return `${minutes}m`;
  }
  
  const hours = Math.floor(minutes / 60);
  const remainingMinutes = minutes % 60;
  
  if (remainingMinutes === 0) {
    return `${hours}h`;
  }
  
  return `${hours}h ${remainingMinutes}m`;
};

/**
 * Format large numbers with appropriate suffixes
 */
export const formatNumber = (num: number): string => {
  if (num >= 1000000) {
    return (num / 1000000).toFixed(1) + 'M';
  }
  if (num >= 1000) {
    return (num / 1000).toFixed(1) + 'K';
  }
  return num.toString();
};

/**
 * Calculate percentage change between two values
 */
export const calculatePercentageChange = (current: number, previous: number): number => {
  if (previous === 0) {
    return current > 0 ? 100 : 0;
  }
  return ((current - previous) / previous) * 100;
};

/**
 * Generate trend indicator based on percentage change
 */
export const getTrendIndicator = (change: number): 'up' | 'down' | 'stable' => {
  if (change > 5) return 'up';
  if (change < -5) return 'down';
  return 'stable';
};

/**
 * Format date for display in different contexts
 */
export const formatDateForDisplay = (dateStr: string, context: 'short' | 'medium' | 'long' = 'medium'): string => {
  const date = parseISO(dateStr);
  
  switch (context) {
    case 'short':
      return format(date, 'M/d');
    case 'medium':
      return format(date, 'MMM d');
    case 'long':
      return format(date, 'MMMM d, yyyy');
    default:
      return format(date, 'MMM d');
  }
};

/**
 * Calculate days between two dates
 */
export const getDaysBetween = (startDate: string, endDate: string): number => {
  return differenceInDays(parseISO(endDate), parseISO(startDate)) + 1;
};

/**
 * Generate color palette for categories
 */
export const generateColorPalette = (count: number): string[] => {
  const colors = [
    '#667eea', '#764ba2', '#f093fb', '#f5576c',
    '#4facfe', '#00f2fe', '#43e97b', '#38f9d7',
    '#ffeaa7', '#fab1a0', '#fd79a8', '#e17055',
    '#74b9ff', '#0984e3', '#a29bfe', '#6c5ce7'
  ];
  
  // If we need more colors than available, generate variations
  if (count > colors.length) {
    const additionalColors = [];
    for (let i = 0; i < count - colors.length; i++) {
      const baseColor = colors[i % colors.length];
      // Create variations by adjusting brightness
      const variation = adjustColorBrightness(baseColor, 0.2);
      additionalColors.push(variation);
    }
    return [...colors, ...additionalColors];
  }
  
  return colors.slice(0, count);
};

/**
 * Adjust color brightness
 */
const adjustColorBrightness = (color: string, amount: number): string => {
  const usePound = color[0] === '#';
  const col = usePound ? color.slice(1) : color;
  const num = parseInt(col, 16);
  let r = (num >> 16) + amount * 255;
  let g = (num >> 8 & 0x00FF) + amount * 255;
  let b = (num & 0x0000FF) + amount * 255;
  r = r > 255 ? 255 : r < 0 ? 0 : r;
  g = g > 255 ? 255 : g < 0 ? 0 : g;
  b = b > 255 ? 255 : b < 0 ? 0 : b;
  return (usePound ? '#' : '') + ((r << 16) | (g << 8) | b).toString(16).padStart(6, '0');
};

/**
 * Calculate productivity rating based on score
 */
export const getProductivityRating = (score: number): {
  rating: string;
  emoji: string;
  color: string;
} => {
  if (score >= 90) {
    return { rating: 'Exceptional', emoji: '🏆', color: '#00b894' };
  } else if (score >= 80) {
    return { rating: 'Excellent', emoji: '🌟', color: '#00cec9' };
  } else if (score >= 70) {
    return { rating: 'Very Good', emoji: '👍', color: '#fdcb6e' };
  } else if (score >= 60) {
    return { rating: 'Good', emoji: '👌', color: '#fd79a8' };
  } else if (score >= 50) {
    return { rating: 'Average', emoji: '💪', color: '#e17055' };
  } else if (score >= 30) {
    return { rating: 'Below Average', emoji: '📈', color: '#ffeaa7' };
  } else {
    return { rating: 'Needs Improvement', emoji: '🎯', color: '#ddd' };
  }
};

/**
 * Generate insights based on data patterns
 */
export const generateDataInsights = (data: any[]): string[] => {
  const insights: string[] = [];
  
  // Check for consistency patterns
  const hasData = data.some(item => item.value > 0);
  if (!hasData) {
    insights.push("Start tracking activities to see trends and insights");
    return insights;
  }
  
  // Check for growth patterns
  if (data.length >= 7) {
    const firstWeekAvg = data.slice(0, 7).reduce((sum, item) => sum + item.value, 0) / 7;
    const lastWeekAvg = data.slice(-7).reduce((sum, item) => sum + item.value, 0) / 7;
    const growth = ((lastWeekAvg - firstWeekAvg) / Math.max(firstWeekAvg, 1)) * 100;
    
    if (growth > 20) {
      insights.push(`Your productivity has increased by ${Math.round(growth)}% this week!`);
    } else if (growth < -20) {
      insights.push(`Consider reviewing your goals - activity decreased by ${Math.round(Math.abs(growth))}%`);
    }
  }
  
  // Check for peak days
  const maxValue = Math.max(...data.map(item => item.value));
  const peakDays = data.filter(item => item.value === maxValue);
  if (peakDays.length > 0) {
    const dayName = format(parseISO(peakDays[0].date), 'EEEE');
    insights.push(`${dayName}s tend to be your most productive days`);
  }
  
  return insights;
};

/**
 * Calculate streak bonus for productivity score
 */
export const calculateStreakBonus = (currentStreak: number, longestStreak: number): number => {
  const streakRatio = Math.min(currentStreak / Math.max(longestStreak, 1), 1);
  return Math.round(streakRatio * 15); // Max 15 points for streak
};

/**
 * Smooth data for better visualization
 */
export const smoothData = (data: number[], windowSize: number = 3): number[] => {
  if (data.length <= windowSize) return data;
  
  return data.map((_, index) => {
    const start = Math.max(0, index - Math.floor(windowSize / 2));
    const end = Math.min(data.length, start + windowSize);
    const window = data.slice(start, end);
    return Math.round(window.reduce((sum, val) => sum + val, 0) / window.length);
  });
};

/**
 * Detect patterns in time series data
 */
export const detectPatterns = (data: { date: string; value: number }[]): {
  trend: 'increasing' | 'decreasing' | 'stable';
  volatility: 'high' | 'medium' | 'low';
  bestDay: string;
  worstDay: string;
} => {
  if (data.length < 3) {
    return {
      trend: 'stable',
      volatility: 'low',
      bestDay: '',
      worstDay: ''
    };
  }
  
  // Calculate trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  
  const firstHalfAvg = firstHalf.reduce((sum, item) => sum + item.value, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, item) => sum + item.value, 0) / secondHalf.length;
  
  const trendChange = (secondHalfAvg - firstHalfAvg) / Math.max(firstHalfAvg, 1);
  let trend: 'increasing' | 'decreasing' | 'stable' = 'stable';
  
  if (trendChange > 0.1) trend = 'increasing';
  else if (trendChange < -0.1) trend = 'decreasing';
  
  // Calculate volatility
  const values = data.map(item => item.value);
  const mean = values.reduce((sum, val) => sum + val, 0) / values.length;
  const variance = values.reduce((sum, val) => sum + Math.pow(val - mean, 2), 0) / values.length;
  const standardDeviation = Math.sqrt(variance);
  const coefficientOfVariation = mean > 0 ? standardDeviation / mean : 0;
  
  let volatility: 'high' | 'medium' | 'low' = 'low';
  if (coefficientOfVariation > 0.5) volatility = 'high';
  else if (coefficientOfVariation > 0.3) volatility = 'medium';
  
  // Find best and worst days
  const maxItem = data.reduce((max, item) => item.value > max.value ? item : max, data[0]);
  const minItem = data.reduce((min, item) => item.value < min.value ? item : min, data[0]);
  
  return {
    trend,
    volatility,
    bestDay: format(parseISO(maxItem.date), 'EEEE'),
    worstDay: format(parseISO(minItem.date), 'EEEE')
  };
};