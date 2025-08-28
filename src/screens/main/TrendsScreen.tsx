import React, { useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  RefreshControl,
  ActivityIndicator,
  Alert
} from 'react-native';
import { TopBar } from '@/components/common';
import {
  PeriodSelector,
  CategoryBreakdown,
  TimeVisualization,
  TaskTrends,
  ProductivityScore
} from '@/components/trends';
import { Colors, Typography, Spacing } from '@/constants';
import { useFocusStore } from '@/store';
import { useTrendsStore, useTrendsPeriod } from '@/store/trendsStore';
import { generateThemeFromFocus, DEFAULT_THEME_COLORS } from '@/utils/colorUtils';

export const TrendsScreen: React.FC = () => {
  const { activeFocus } = useFocusStore();
  const { currentPeriod, setPeriod } = useTrendsPeriod();
  const {
    trendsData,
    isLoading,
    isRefreshing,
    error,
    loadTrendsData,
    refreshTrendsData,
    clearError,
    getTrendsData
  } = useTrendsStore();

  // Generate theme colors from focus color
  const themeColors = activeFocus?.color 
    ? generateThemeFromFocus(activeFocus.color)
    : DEFAULT_THEME_COLORS;

  const data = activeFocus ? getTrendsData(activeFocus.id, currentPeriod) : null;

  // Load trends data when component mounts or focus changes
  useEffect(() => {
    if (activeFocus) {
      loadTrendsData(activeFocus.id, currentPeriod);
    }
  }, [activeFocus?.id, currentPeriod]);

  // Clear error after showing it
  useEffect(() => {
    if (error) {
      Alert.alert(
        'Error Loading Trends',
        error,
        [
          { text: 'OK', onPress: clearError }
        ]
      );
    }
  }, [error, clearError]);

  const handlePeriodChange = (period: any) => {
    setPeriod(period);
    if (activeFocus) {
      loadTrendsData(activeFocus.id, period);
    }
  };

  const handleRefresh = async () => {
    if (activeFocus) {
      await refreshTrendsData(activeFocus.id, currentPeriod);
    }
  };

  if (!activeFocus) {
    return (
      <View style={styles.container}>
        <TopBar 
          title="Trends"
          gradient={true}
          focusColor={Colors.focus.work}
        />
        
        <View style={styles.emptyState}>
          <Text style={styles.emptyTitle}>No Focus Selected</Text>
          <Text style={styles.emptySubtitle}>
            Switch to a focus area to see your trends and analytics
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <TopBar 
        title={`${activeFocus.name} Trends`}
        emoji={activeFocus.emoji}
        gradient={true}
        focusColor={activeFocus.color}
      />

      {/* Period Selector */}
      <PeriodSelector
        selectedPeriod={currentPeriod}
        onPeriodChange={handlePeriodChange}
        focusColor={activeFocus.color}
      />

      <ScrollView 
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={isRefreshing}
            onRefresh={handleRefresh}
            colors={[activeFocus.color]}
            tintColor={activeFocus.color}
          />
        }
      >
        {isLoading && !data ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator 
              size="large" 
              color={activeFocus.color}
              style={styles.loadingIndicator}
            />
            <Text style={styles.loadingText}>Loading trends data...</Text>
          </View>
        ) : data ? (
          <>
            {/* Productivity Score */}
            <ProductivityScore
              score={data.productivityScore}
              focusColor={activeFocus.color}
            />

            {/* Task Completion Trends */}
            <TaskTrends
              data={data.timeSeriesData}
              focusColor={activeFocus.color}
            />

            {/* Category Breakdown */}
            <CategoryBreakdown
              data={data.categoryBreakdown}
              focusColor={activeFocus.color}
              showTimeData={true}
            />

            {/* Time Tracking Visualization */}
            {data.summary.totalMinutes > 0 && (
              <TimeVisualization
                data={[]} // This would need time tracking stats from the service
                focusColor={activeFocus.color}
              />
            )}

            {/* Summary Statistics */}
            <View style={styles.summaryContainer}>
              <Text style={styles.summaryTitle}>Period Summary</Text>
              <Text style={styles.summaryPeriod}>
                {data.dateRange.label} • {data.period.label}
              </Text>
              
              <View style={styles.summaryGrid}>
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{data.summary.totalTasks}</Text>
                  <Text style={styles.summaryLabel}>Total Tasks</Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{data.summary.activeDays}</Text>
                  <Text style={styles.summaryLabel}>Active Days</Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>{data.summary.categoriesUsed}</Text>
                  <Text style={styles.summaryLabel}>Categories</Text>
                </View>
                
                <View style={styles.summaryItem}>
                  <Text style={styles.summaryValue}>
                    {data.summary.avgTasksPerDay.toFixed(1)}
                  </Text>
                  <Text style={styles.summaryLabel}>Avg/Day</Text>
                </View>
              </View>

              {/* Insights */}
              {data.insights.length > 0 && (
                <View style={styles.insightsContainer}>
                  <Text style={styles.insightsTitle}>Key Insights</Text>
                  {data.insights.map((insight, index) => (
                    <View key={index} style={styles.insightItem}>
                      <Text style={styles.insightEmoji}>{insight.emoji}</Text>
                      <View style={styles.insightContent}>
                        <Text style={styles.insightTitle}>{insight.title}</Text>
                        <Text style={styles.insightDescription}>
                          {insight.description}
                        </Text>
                      </View>
                    </View>
                  ))}
                </View>
              )}

              {/* Streak Info */}
              <View style={styles.streakContainer}>
                <Text style={styles.streakTitle}>Consistency</Text>
                <View style={styles.streakStats}>
                  <View style={styles.streakStat}>
                    <Text style={[
                      styles.streakValue,
                      { color: data.streakInfo.isActive ? Colors.status.success : Colors.text.secondary }
                    ]}>
                      {data.streakInfo.currentStreak}
                    </Text>
                    <Text style={styles.streakLabel}>Current Streak</Text>
                  </View>
                  
                  <View style={styles.streakStat}>
                    <Text style={styles.streakValue}>{data.streakInfo.longestStreak}</Text>
                    <Text style={styles.streakLabel}>Best Streak</Text>
                  </View>
                  
                  <View style={styles.streakStat}>
                    <Text style={styles.streakValue}>{data.streakInfo.totalActiveDays}</Text>
                    <Text style={styles.streakLabel}>Total Days</Text>
                  </View>
                </View>
              </View>
            </View>
          </>
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyTitle}>No Data Available</Text>
            <Text style={styles.emptySubtitle}>
              Start tracking activities in this focus to see trends and analytics
            </Text>
          </View>
        )}

        <View style={styles.bottomPadding} />
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.background.primary,
  },
  scrollView: {
    flex: 1,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xl * 2,
  },
  loadingIndicator: {
    marginBottom: Spacing.base,
  },
  loadingText: {
    ...Typography.body.regular,
    color: Colors.text.secondary,
  },
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: Spacing.padding.screen,
    paddingVertical: Spacing.xl * 2,
  },
  emptyTitle: {
    ...Typography.heading.h3,
    color: Colors.text.light,
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  emptySubtitle: {
    ...Typography.body.regular,
    color: Colors.text.light,
    textAlign: 'center',
    lineHeight: 22,
  },
  summaryContainer: {
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
  summaryTitle: {
    ...Typography.heading.h4,
    color: Colors.text.dark,
    marginBottom: Spacing.xs,
  },
  summaryPeriod: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginBottom: Spacing.lg,
  },
  summaryGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
  },
  summaryItem: {
    alignItems: 'center',
    flex: 1,
  },
  summaryValue: {
    ...Typography.heading.h4,
    color: Colors.text.dark,
    fontSize: 20,
    marginBottom: Spacing.xs,
  },
  summaryLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  insightsContainer: {
    marginBottom: Spacing.lg,
  },
  insightsTitle: {
    ...Typography.body.medium,
    color: Colors.text.dark,
    fontWeight: '600',
    marginBottom: Spacing.base,
  },
  insightItem: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    backgroundColor: Colors.background.light,
    borderRadius: Spacing.borderRadius.base,
    padding: Spacing.base,
    marginBottom: Spacing.sm,
  },
  insightEmoji: {
    fontSize: 18,
    marginRight: Spacing.sm,
    marginTop: 2,
  },
  insightContent: {
    flex: 1,
  },
  insightTitle: {
    ...Typography.body.medium,
    color: Colors.text.dark,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  insightDescription: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    lineHeight: 18,
  },
  streakContainer: {
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.base,
  },
  streakTitle: {
    ...Typography.body.medium,
    color: Colors.text.dark,
    fontWeight: '600',
    marginBottom: Spacing.base,
  },
  streakStats: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  streakStat: {
    alignItems: 'center',
    flex: 1,
  },
  streakValue: {
    ...Typography.heading.h4,
    color: Colors.text.dark,
    fontSize: 18,
    marginBottom: Spacing.xs,
  },
  streakLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    textAlign: 'center',
  },
  bottomPadding: {
    height: Spacing.xl,
  },
});