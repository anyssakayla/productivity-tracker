import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView
} from 'react-native';
import { LineChart, BarChart } from 'react-native-chart-kit';
import { Colors, Typography, Spacing } from '@/constants';
import { formatDuration, formatDateForDisplay } from '@/services/trends/analyticsHelpers';

interface TimeVisualizationProps {
  data: {
    date: string;
    totalMinutes: number;
    categoriesActive: number;
    categories: {
      id: string;
      name: string;
      minutes: number;
      tasks: number;
    }[];
  }[];
  focusColor?: string;
}

const { width: screenWidth } = Dimensions.get('window');
const chartWidth = screenWidth - (Spacing.padding.screen * 2);

export const TimeVisualization: React.FC<TimeVisualizationProps> = ({
  data,
  focusColor = Colors.focus.work
}) => {
  const [chartType, setChartType] = useState<'line' | 'bar'>('line');
  const [selectedDataPoint, setSelectedDataPoint] = useState<number | null>(null);

  // Filter data to only include days with time tracking
  const activeData = data.filter(day => day.totalMinutes > 0);

  if (activeData.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Time Tracking</Text>
        </View>
        
        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No time data available</Text>
          <Text style={styles.emptySubtext}>
            Start using time tracking features to see your patterns
          </Text>
        </View>
      </View>
    );
  }

  // Prepare chart data
  const chartData = {
    labels: activeData.map(day => {
      const date = new Date(day.date);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    }),
    datasets: [{
      data: activeData.map(day => Math.round(day.totalMinutes / 60 * 10) / 10), // Convert to hours with 1 decimal
      strokeWidth: 3,
      color: (opacity = 1) => `rgba(102, 126, 234, ${opacity})`,
    }]
  };

  const chartConfig = {
    backgroundColor: 'transparent',
    backgroundGradientFrom: Colors.background.card,
    backgroundGradientTo: Colors.background.card,
    decimalPlaces: 1,
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

  const selectedDay = selectedDataPoint !== null ? activeData[selectedDataPoint] : null;
  
  // Calculate statistics
  const totalHours = activeData.reduce((sum, day) => sum + day.totalMinutes, 0) / 60;
  const avgHoursPerDay = totalHours / activeData.length;
  const maxDay = activeData.reduce((max, day) => day.totalMinutes > max.totalMinutes ? day : max, activeData[0]);
  const daysWithTracking = activeData.length;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Time Tracking</Text>
        
        <View style={styles.chartTypeSelector}>
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === 'line' && [
                styles.selectedChartType,
                { backgroundColor: `${focusColor}20` }
              ]
            ]}
            onPress={() => setChartType('line')}
          >
            <Text
              style={[
                styles.chartTypeText,
                chartType === 'line' && { color: focusColor }
              ]}
            >
              Line
            </Text>
          </TouchableOpacity>
          
          <TouchableOpacity
            style={[
              styles.chartTypeButton,
              chartType === 'bar' && [
                styles.selectedChartType,
                { backgroundColor: `${focusColor}20` }
              ]
            ]}
            onPress={() => setChartType('bar')}
          >
            <Text
              style={[
                styles.chartTypeText,
                chartType === 'bar' && { color: focusColor }
              ]}
            >
              Bar
            </Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Statistics Cards */}
      <ScrollView 
        horizontal 
        showsHorizontalScrollIndicator={false}
        style={styles.statsContainer}
        contentContainerStyle={styles.statsContent}
      >
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatDuration(Math.round(totalHours * 60))}</Text>
          <Text style={styles.statLabel}>Total Time</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{avgHoursPerDay.toFixed(1)}h</Text>
          <Text style={styles.statLabel}>Avg/Day</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{formatDuration(maxDay.totalMinutes)}</Text>
          <Text style={styles.statLabel}>Best Day</Text>
        </View>
        
        <View style={styles.statCard}>
          <Text style={styles.statValue}>{daysWithTracking}</Text>
          <Text style={styles.statLabel}>Days Active</Text>
        </View>
      </ScrollView>

      {/* Chart */}
      <View style={styles.chartContainer}>
        {chartType === 'line' ? (
          <LineChart
            data={chartData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            bezier
            onDataPointClick={handleDataPointClick}
            style={styles.chart}
          />
        ) : (
          <BarChart
            data={chartData}
            width={chartWidth}
            height={220}
            chartConfig={chartConfig}
            verticalLabelRotation={30}
            style={styles.chart}
          />
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
          
          <View style={styles.selectedDayStats}>
            <View style={styles.selectedDayStat}>
              <Text style={styles.selectedDayStatValue}>
                {formatDuration(selectedDay.totalMinutes)}
              </Text>
              <Text style={styles.selectedDayStatLabel}>Total Time</Text>
            </View>
            
            <View style={styles.selectedDayStat}>
              <Text style={styles.selectedDayStatValue}>
                {selectedDay.categoriesActive}
              </Text>
              <Text style={styles.selectedDayStatLabel}>Categories</Text>
            </View>
          </View>

          {/* Category breakdown for selected day */}
          {selectedDay.categories.length > 0 && (
            <View style={styles.categoryBreakdown}>
              <Text style={styles.categoryBreakdownTitle}>Category Breakdown:</Text>
              {selectedDay.categories
                .filter(cat => cat.minutes > 0)
                .sort((a, b) => b.minutes - a.minutes)
                .map((category) => (
                  <View key={category.id} style={styles.categoryItem}>
                    <Text style={styles.categoryName}>{category.name}</Text>
                    <Text style={styles.categoryTime}>
                      {formatDuration(category.minutes)} • {category.tasks} tasks
                    </Text>
                  </View>
                ))}
            </View>
          )}
        </View>
      )}

      {/* Time Pattern Insights */}
      <View style={styles.insightsContainer}>
        <Text style={styles.insightsTitle}>Patterns</Text>
        
        <View style={styles.insightItem}>
          <Text style={styles.insightText}>
            Your most productive day was {formatDateForDisplay(maxDay.date, 'medium')} with {formatDuration(maxDay.totalMinutes)} tracked
          </Text>
        </View>
        
        {avgHoursPerDay >= 2 && (
          <View style={styles.insightItem}>
            <Text style={styles.insightText}>
              Great consistency! You're averaging {avgHoursPerDay.toFixed(1)} hours of tracked time per day
            </Text>
          </View>
        )}
        
        {daysWithTracking > 7 && (
          <View style={styles.insightItem}>
            <Text style={styles.insightText}>
              You've been tracking time for {daysWithTracking} days - keep up the momentum!
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
  chartTypeSelector: {
    flexDirection: 'row',
    backgroundColor: Colors.background.light,
    borderRadius: Spacing.borderRadius.base,
    padding: 2,
  },
  chartTypeButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.small,
  },
  selectedChartType: {
    borderWidth: 1,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  chartTypeText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  statsContainer: {
    marginBottom: Spacing.lg,
  },
  statsContent: {
    paddingRight: Spacing.base,
  },
  statCard: {
    backgroundColor: Colors.background.light,
    borderRadius: Spacing.borderRadius.base,
    padding: Spacing.base,
    marginRight: Spacing.sm,
    minWidth: 80,
    alignItems: 'center',
  },
  statValue: {
    ...Typography.heading.h4,
    color: Colors.text.dark,
    fontSize: 16,
    marginBottom: Spacing.xs,
  },
  statLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
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
  selectedDayStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    marginBottom: Spacing.sm,
  },
  selectedDayStat: {
    alignItems: 'center',
  },
  selectedDayStatValue: {
    ...Typography.body.medium,
    color: Colors.text.dark,
    fontWeight: '700',
    marginBottom: Spacing.xs,
  },
  selectedDayStatLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
  },
  categoryBreakdown: {
    marginTop: Spacing.sm,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: 'rgba(0,0,0,0.1)',
  },
  categoryBreakdownTitle: {
    ...Typography.body.small,
    color: Colors.text.dark,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  categoryItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  categoryName: {
    ...Typography.body.small,
    color: Colors.text.dark,
    flex: 1,
  },
  categoryTime: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  insightsContainer: {
    marginTop: Spacing.base,
  },
  insightsTitle: {
    ...Typography.body.medium,
    color: Colors.text.dark,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  insightItem: {
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