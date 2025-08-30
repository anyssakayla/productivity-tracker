import React, { useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  ScrollView,
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import { Colors, Typography, Spacing } from "@/constants";
import { CategoryTrendData } from "@/types";
import TrendsService from "@/services/trends/TrendsService";
import { formatDuration } from "@/services/trends/analyticsHelpers";

interface CategoryBreakdownProps {
  data: CategoryTrendData[];
  focusColor?: string;
  showTimeData?: boolean;
}

const { width: screenWidth } = Dimensions.get("window");
const chartWidth = screenWidth - Spacing.padding.screen * 2;

export const CategoryBreakdown: React.FC<CategoryBreakdownProps> = ({
  data,
  focusColor = Colors.focus.work,
  showTimeData = false,
}) => {
  const [selectedMetric, setSelectedMetric] = useState<"tasks" | "time">(
    "tasks"
  );
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  // Filter out categories with no data
  const activeCategories = data.filter((cat) =>
    selectedMetric === "tasks" ? cat.totalTasks > 0 : cat.totalMinutes > 0
  );

  if (activeCategories.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Category Breakdown</Text>

          {showTimeData && (
            <View style={styles.metricSelector}>
              <TouchableOpacity
                style={[
                  styles.metricButton,
                  selectedMetric === "tasks" && [
                    styles.selectedMetric,
                    { backgroundColor: `${focusColor}20` },
                  ],
                ]}
                onPress={() => setSelectedMetric("tasks")}
              >
                <Text
                  style={[
                    styles.metricText,
                    selectedMetric === "tasks" && { color: focusColor },
                  ]}
                >
                  Tasks
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={[
                  styles.metricButton,
                  selectedMetric === "time" && [
                    styles.selectedMetric,
                    { backgroundColor: `${focusColor}20` },
                  ],
                ]}
                onPress={() => setSelectedMetric("time")}
              >
                <Text
                  style={[
                    styles.metricText,
                    selectedMetric === "time" && { color: focusColor },
                  ]}
                >
                  Time
                </Text>
              </TouchableOpacity>
            </View>
          )}
        </View>

        <View style={styles.emptyState}>
          <Text style={styles.emptyText}>No data available</Text>
          <Text style={styles.emptySubtext}>
            Start tracking activities to see your category breakdown
          </Text>
        </View>
      </View>
    );
  }

  // Prepare chart data
  const pieData = activeCategories.map((cat) => ({
    name: cat.categoryName,
    population: selectedMetric === "tasks" ? cat.totalTasks : cat.totalMinutes,
    color: cat.categoryColor,
    legendFontColor: Colors.text.secondary,
    legendFontSize: 12,
  }));

  const handleCategoryPress = (categoryId: string) => {
    setSelectedCategory(selectedCategory === categoryId ? null : categoryId);
  };

  const selectedCategoryData = selectedCategory
    ? activeCategories.find((cat) => cat.categoryId === selectedCategory)
    : null;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Category Breakdown</Text>

        {showTimeData && (
          <View style={styles.metricSelector}>
            <TouchableOpacity
              style={[
                styles.metricButton,
                selectedMetric === "tasks" && [
                  styles.selectedMetric,
                  { backgroundColor: `${focusColor}20` },
                ],
              ]}
              onPress={() => setSelectedMetric("tasks")}
            >
              <Text
                style={[
                  styles.metricText,
                  selectedMetric === "tasks" && { color: focusColor },
                ]}
              >
                Tasks
              </Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[
                styles.metricButton,
                selectedMetric === "time" && [
                  styles.selectedMetric,
                  { backgroundColor: `${focusColor}20` },
                ],
              ]}
              onPress={() => setSelectedMetric("time")}
            >
              <Text
                style={[
                  styles.metricText,
                  selectedMetric === "time" && { color: focusColor },
                ]}
              >
                Time
              </Text>
            </TouchableOpacity>
          </View>
        )}
      </View>

      {/* Pie Chart */}
      <View style={styles.chartContainer}>
        <PieChart
          data={pieData}
          width={chartWidth}
          height={220}
          chartConfig={{
            color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            labelColor: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
          }}
          accessor="population"
          backgroundColor="transparent"
          paddingLeft="15"
          absolute
        />
      </View>

      {/* Category List */}
      <ScrollView
        style={styles.categoryList}
        showsVerticalScrollIndicator={false}
      >
        {activeCategories.map((category, index) => {
          const isSelected = selectedCategory === category.categoryId;
          const value =
            selectedMetric === "tasks"
              ? category.totalTasks
              : category.totalMinutes;
          const percentage = category.percentage;

          return (
            <TouchableOpacity
              key={category.categoryId}
              style={[
                styles.categoryItem,
                { backgroundColor: `${category.categoryColor}15` },
                isSelected && [
                  styles.selectedCategoryItem,
                  { borderColor: category.categoryColor },
                ],
              ]}
              onPress={() => handleCategoryPress(category.categoryId)}
              activeOpacity={0.7}
            >
              <View style={styles.categoryHeader}>
                <View style={styles.categoryInfo}>
                  <Text style={styles.categoryEmoji}>
                    {category.categoryEmoji}
                  </Text>
                  <View style={styles.categoryNameContainer}>
                    <Text style={styles.categoryName}>
                      {category.categoryName}
                    </Text>
                  </View>
                </View>

                <View style={styles.categoryStats}>
                  <Text style={styles.categoryPercentage}>
                    {percentage.toFixed(1)}%
                  </Text>
                </View>
              </View>

              {/* Expanded Details */}
              {isSelected && (
                <View style={styles.categoryDetails}>
                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Tasks:</Text>
                    <Text style={styles.detailValue}>
                      {category.totalTasks}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Total Time:</Text>
                    <Text style={styles.detailValue}>
                      {formatDuration(category.totalMinutes)}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Active Days:</Text>
                    <Text style={styles.detailValue}>
                      {category.daysActive}
                    </Text>
                  </View>

                  <View style={styles.detailRow}>
                    <Text style={styles.detailLabel}>Avg Tasks/Day:</Text>
                    <Text style={styles.detailValue}>
                      {category.avgTasksPerDay.toFixed(1)}
                    </Text>
                  </View>
                </View>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>

      {/* Selected Category Summary */}
      {selectedCategoryData && (
        <View
          style={[
            styles.selectedSummary,
            { backgroundColor: `${selectedCategoryData.categoryColor}10` },
          ]}
        >
          <Text style={styles.selectedSummaryTitle}>
            {selectedCategoryData.categoryEmoji}{" "}
            {selectedCategoryData.categoryName}
          </Text>
          <Text style={styles.selectedSummaryText}>
            {selectedCategoryData.totalTasks} tasks •{" "}
            {formatDuration(selectedCategoryData.totalMinutes)} •{" "}
            {selectedCategoryData.daysActive} days active
          </Text>
        </View>
      )}
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
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  title: {
    ...Typography.heading.h4,
    color: Colors.text.dark,
  },
  metricSelector: {
    flexDirection: "row",
    backgroundColor: Colors.background.light,
    borderRadius: Spacing.borderRadius.base,
    padding: 2,
  },
  metricButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    borderRadius: Spacing.borderRadius.small,
  },
  selectedMetric: {
    borderWidth: 1,
    borderColor: "rgba(0,0,0,0.1)",
  },
  metricText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontWeight: "600",
  },
  chartContainer: {
    alignItems: "center",
    marginBottom: Spacing.lg,
  },
  categoryList: {
    maxHeight: 300,
  },
  categoryItem: {
    borderRadius: Spacing.borderRadius.base,
    padding: Spacing.base,
    marginBottom: 4,
    borderWidth: 1,
    borderColor: "transparent",
  },
  selectedCategoryItem: {
    borderWidth: 1,
    backgroundColor: Colors.background.card,
  },
  categoryHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  categoryInfo: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryEmoji: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  categoryNameContainer: {
    flexDirection: "row",
    alignItems: "center",
    flex: 1,
  },
  categoryName: {
    ...Typography.body.medium,
    color: Colors.text.dark,
    flex: 1,
  },
  categoryStats: {
    alignItems: "flex-end",
  },
  categoryPercentage: {
    ...Typography.caption,
    color: Colors.text.dark,
  },
  categoryDetails: {
    marginTop: Spacing.base,
    paddingTop: Spacing.base,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  detailRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: Spacing.xs,
  },
  detailLabel: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  detailValue: {
    ...Typography.body.small,
    color: Colors.text.dark,
    fontWeight: "600",
  },
  selectedSummary: {
    marginTop: Spacing.base,
    padding: Spacing.base,
    borderRadius: Spacing.borderRadius.base,
  },
  selectedSummaryTitle: {
    ...Typography.body.medium,
    color: Colors.text.dark,
    fontWeight: "600",
    marginBottom: Spacing.xs,
  },
  selectedSummaryText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
  },
  emptyState: {
    alignItems: "center",
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
    textAlign: "center",
  },
});
