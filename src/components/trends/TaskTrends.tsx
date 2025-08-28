import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors, Typography, Spacing } from '@/constants';
import { TimeSeriesData } from '@/types';
import { formatDateForDisplay } from '@/services/trends/analyticsHelpers';

interface TaskTrendsProps {
  data: TimeSeriesData[];
  focusColor?: string;
  showMovingAverage?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - (Spacing.padding.screen * 2);

export const TaskTrends: React.FC<TaskTrendsProps> = ({
  data,
  focusColor = Colors.focus.work,
  showMovingAverage = true
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [selectedDataPoint, setSelectedDataPoint] = useState<number | null>(null);

  if (data.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Task Completion Trends</Text>
        </View>
        
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No task data available</Text>
          <Text style={styles.emptySubtext}>
            Start completing tasks to see your trends
          </Text>
        </View>
      </View>
    );
  }

  // Calculate moving average if enabled
  const calculateMovingAverage = (data: number[], window: number = 3): number[] => {
    if (data.length < window) return data;
    
    return data.map((_, index) => {
      const start = Math.max(0, index - Math.floor(window / 2));
      const end = Math.min(data.length, start + window);
      const subset = data.slice(start, end);
      return Math.round(subset.reduce((sum, val) => sum + val, 0) / subset.length);
    });
  };

  const taskValues = data.map(d => d.value);
  const movingAverageValues = showMovingAverage ? calculateMovingAverage(taskValues) : taskValues;

  // Prepare chart data
  const chartData = {
    labels: data.map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric' 
      });
    }),
    datasets: [
      {
        data: taskValues,
        strokeWidth: 2,
        color: (opacity = 1) => `${focusColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
        withDots: chartType === 'line',
      },
      ...(showMovingAverage && chartType === 'line' ? [{
        data: movingAverageValues,
        strokeWidth: 3,
        color: (opacity = 1) => `rgba(255, 165, 0, ${opacity})`,
        withDots: false,
      }] : [])
    ]
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: Colors.background.card,
    backgroundGradientTo: Colors.background.card,
    decimalPlaces: 0,
    color: (opacity = 1) => `${focusColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}`,
    labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity * 0.7})`,
    style: {
      borderRadius: Spacing.borderRadius.base,
    },
    propsForDots: {
      r: "4",
      strokeWidth: "2",
      stroke: focusColor
    },
    propsForBackgroundLines: {
      strokeOpacity: 0.1
    }
  };

  const handleDataPointClick = (data: any) => {
    const { index } = data;
    setSelectedDataPoint(selectedDataPoint === index ? null : index);
  };

  const selectedDay = selectedDataPoint !== null ? data[selectedDataPoint] : null;

  // Calculate statistics
  const totalTasks = data.reduce((sum, day) => sum + day.value, 0);
  const avgTasksPerDay = totalTasks / data.length;
  const maxDay = data.reduce((max, day) => day.value > max.value ? day : max, data[0]);
  const minDay = data.reduce((min, day) => day.value < min.value ? day : min, data[0]);
  const activeDays = data.filter(day => day.value > 0).length;

  // Calculate trend
  const firstHalf = data.slice(0, Math.floor(data.length / 2));
  const secondHalf = data.slice(Math.floor(data.length / 2));
  const firstHalfAvg = firstHalf.reduce((sum, day) => sum + day.value, 0) / firstHalf.length;
  const secondHalfAvg = secondHalf.reduce((sum, day) => sum + day.value, 0) / secondHalf.length;
  const trendPercentage = firstHalfAvg > 0 ? ((secondHalfAvg - firstHalfAvg) / firstHalfAvg) * 100 : 0;

  const getTrendColor = () => {
    if (trendPercentage > 10) return Colors.status.success;
    if (trendPercentage < -10) return Colors.status.error;
    return Colors.text.secondary;
  };

  const getTrendIndicator = () => {
    if (trendPercentage > 10) return '📈';
    if (trendPercentage < -10) return '📉';
    return '➡️';
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Task Completion Trends</Text>
        
        <View style={styles.controls}>
          <TouchableOpacity
            style={[
              styles.controlButton,
              chartType === 'line' && [
                styles.selectedControl,
                { backgroundColor: `${focusColor}20` }
              ]
            ]}
            onPress={() => setChartType('line')}
          >
            <Text
              style={[
                styles.controlText,
                chartType === 'line' && { color: focusColor }
              ]}
            >
              Line
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.controlButton,
              chartType === 'bar' && [
                styles.selectedControl,
                { backgroundColor: `${focusColor}20` }
              ]
            ]}
            onPress={() => setChartType('bar')}
          >
            <Text
              style={[
                styles.controlText,
                chartType === 'bar' && { color: focusColor }
              ]}
            >
              Bar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics */}
      <View style={styles.statsGrid}>
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{totalTasks}</Text>
          <Text style={styles.statLabel}>Total Tasks</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{avgTasksPerDay.toFixed(1)}</Text>
          <Text style={styles.statLabel}>Avg/Day</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={styles.statValue}>{maxDay.value}</Text>
          <Text style={styles.statLabel}>Best Day</Text>
        </View>
        
        <View style={styles.statItem}>
          <Text style={[styles.statValue, { color: getTrendColor() }]}>
            {getTrendIndicator()} {Math.abs(trendPercentage).toFixed(0)}%
          </Text>
          <Text style={styles.statLabel}>Trend</Text>
        </View>
      </View>

      {/* Chart */}
      <View style={styles.chartContainer}>
        {chartType === 'line' ? (
          <LineChart
            data={chartData}
            width={chartWidth}
            height={200}
            chartConfig={chartConfig}
            bezier
            onDataPointClick={handleDataPointClick}
            style={styles.chart}
          />
        ) : (
          <BarChart
            data={{ 
              ...chartData, 
              datasets: [chartData.datasets[0]] // Only show main data for bar chart
            }}
            width={chartWidth}
            height={200}
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            style={styles.chart}
          />
        )}
        
        {/* Legend */}
        {showMovingAverage && chartType === 'line' && (
          <View style={styles.legend}>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: focusColor }]} />
              <Text style={styles.legendText}>Daily Tasks</Text>
            </View>
            <View style={styles.legendItem}>
              <View style={[styles.legendDot, { backgroundColor: '#FFA500' }]} />
              <Text style={styles.legendText}>3-Day Average</Text>
            </View>
          </View>
        )}
      </View>

      {/* Selected Day Details */}
      {selectedDay && (
        <View style={[
          styles.selectedDayContainer,
          { backgroundColor: `${focusColor}10` }
        ]}>
          <View style={styles.selectedDayHeader}>
            <Text style={styles.selectedDayTitle}>
              {formatDateForDisplay(selectedDay.date, 'long')}
            </Text>
            <TouchableOpacity 
              onPress={() => setSelectedDataPoint(null)}
              style={styles.closeButton}
            >
              <Text style={styles.closeButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
          
          <View style={styles.selectedDayContent}>
            <Text style={styles.selectedDayTasks}>
              {selectedDay.value} tasks completed
            </Text>
            
            {selectedDay.categories && (
              <View style={styles.categoryBreakdown}>
                <Text style={styles.categoryTitle}>By Category:</Text>
                {Object.entries(selectedDay.categories)
                  .filter(([_, count]) => count > 0)
                  .sort(([, a], [, b]) => (b as number) - (a as number))
                  .map(([categoryId, count]) => (
                    <Text key={categoryId} style={styles.categoryItem}>
                      • {count} tasks
                    </Text>
                  ))}
              </View>
            )}
          </View>
        </View>
      )}

      {/* Performance Insights */}
      <View style={styles.insights}>
        <Text style={styles.insightsTitle}>Insights</Text>
        
        <View style={styles.insight}>
          <Text style={styles.insightText}>
            Your best day was {formatDateForDisplay(maxDay.date, 'medium')} with {maxDay.value} tasks
          </Text>
        </View>
        
        <View style={styles.insight}>
          <Text style={styles.insightText}>
            You've been active for {activeDays} out of {data.length} days ({Math.round((activeDays / data.length) * 100)}% consistency)
          </Text>
        </View>
        
        {trendPercentage > 10 && (
          <View style={styles.insight}>
            <Text style={[styles.insightText, { color: Colors.status.success }]}>
              Great momentum! Your task completion has increased by {trendPercentage.toFixed(0)}% 📈
            </Text>
          </View>
        )}
        
        {trendPercentage < -10 && (
          <View style={styles.insight}>
            <Text style={[styles.insightText, { color: Colors.status.warning }]}>
              Consider reviewing your goals - activity has decreased by {Math.abs(trendPercentage).toFixed(0)}%
            </Text>
          </View>
        )}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: Colors.background.card,
    borderRadius: Spacing.borderRadius.large,
    padding: Spacing.lg,
    marginHorizontal: Spacing.padding.screen,
    marginBottom: Spacing.base,
    shadowColor: Colors.shadow,
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 3.84,
    elevation: 5,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.heading.h4,
    color: Colors.text.dark,
  },
  controls: {
    flexDirection: 'row',
    backgroundColor: Colors.background.light,
    borderRadius: Spacing.borderRadius.base,
    padding: 2,
  },
  controlButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.small,
  },
  selectedControl: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  controlText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  statsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    backgroundColor: Colors.background.light,
    borderRadius: Spacing.borderRadius.base,
    padding: Spacing.base,
  },
  statItem: {
    alignItems: 'center',
    flex: 1,
  },
  statValue: {
    ...Typography.heading.h4,
    color: Colors.text.dark,
    fontSize: 18,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
    fontSize: 10,
  },
  chartContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    overflow: 'hidden',
    borderRadius: Spacing.borderRadius.base,
  },
  chart: {
    marginVertical: 8,
    borderRadius: Spacing.borderRadius.base,
  },
  legend: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginTop: Spacing.sm,
    gap: Spacing.lg,
  },
  legendItem: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  legendDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: Spacing.xs,
  },
  legendText: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  selectedDayContainer: {
    borderRadius: Spacing.borderRadius.base,
    padding: Spacing.base,
    marginBottom: Spacing.base,
  },
  selectedDayHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  selectedDayTitle: {
    ...Typography.body.medium,
    color: Colors.text.dark,
    fontWeight: '600',
  },
  closeButton: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.background.light,
    justifyContent: 'center',
    alignItems: 'center',
  },
  closeButtonText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontSize: 12,
  },
  selectedDayContent: {
    alignItems: 'center',
  },
  selectedDayTasks: {
    ...Typography.body.medium,
    color: Colors.text.dark,
    fontWeight: '700',
    marginBottom: Spacing.sm,
  },
  categoryBreakdown: {
    alignItems: 'center',
  },
  categoryTitle: {
    ...Typography.body.small,
    color: Colors.text.dark,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  categoryItem: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: 2,
  },
  insights: {
    marginTop: Spacing.base,
  },
  insightsTitle: {
    ...Typography.body.medium,
    color: Colors.text.dark,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  insight: {
    backgroundColor: Colors.background.light,
    borderRadius: Spacing.borderRadius.base,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  insightText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  emptyText: {
    ...Typography.heading.h4,
    color: Colors.text.light,
    marginBottom: Spacing.xs,
  },
  emptySubtext: {
    ...Typography.body.regular,
    color: Colors.text.light,
    textAlign: 'center',
  },
});