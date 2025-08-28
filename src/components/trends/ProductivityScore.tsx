import React, { useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  Animated,
  Dimensions,
  TouchableOpacity
} from 'react-native';
import { Colors, Typography, Spacing } from '@/constants';
import { ProductivityScore as ProductivityScoreType } from '@/types';
import { getProductivityRating } from '@/services/trends/analyticsHelpers';

interface ProductivityScoreProps {
  score: ProductivityScoreType;
  focusColor?: string;
  showBreakdown?: boolean;
}

const { width: screenWidth } = Dimensions.get('window');

export const ProductivityScore: React.FC<ProductivityScoreProps> = ({
  score,
  focusColor = Colors.focus.work,
  showBreakdown = false
}) => {
  const animatedValue = useRef(new Animated.Value(0)).current;
  const [expanded, setExpanded] = React.useState(showBreakdown);

  useEffect(() => {
    Animated.timing(animatedValue, {
      toValue: score.score / 100,
      duration: 2000,
      useNativeDriver: false,
    }).start();
  }, [score.score, animatedValue]);

  const rating = getProductivityRating(score.score);
  
  // Calculate the circle parameters
  const size = 120;
  const strokeWidth = 8;
  const radius = (size - strokeWidth) / 2;
  const circumference = 2 * Math.PI * radius;

  // Animated stroke dash offset
  const strokeDashoffset = animatedValue.interpolate({
    inputRange: [0, 1],
    outputRange: [circumference, 0],
  });

  const getTrendIcon = () => {
    switch (score.trend) {
      case 'up': return '📈';
      case 'down': return '📉';
      default: return '➡️';
    }
  };

  const getTrendColor = () => {
    switch (score.trend) {
      case 'up': return Colors.status.success;
      case 'down': return Colors.status.error;
      default: return Colors.text.secondary;
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Productivity Score</Text>
        <TouchableOpacity
          onPress={() => setExpanded(!expanded)}
          style={styles.expandButton}
        >
          <Text style={styles.expandButtonText}>
            {expanded ? 'Less' : 'Details'}
          </Text>
        </TouchableOpacity>
      </View>

      <View style={styles.content}>
        {/* Circular Progress */}
        <View style={styles.circleContainer}>
          <Animated.View style={styles.circle}>
            {/* Background Circle */}
            <View style={[styles.circleBase, { borderColor: `${focusColor}20` }]} />
            
            {/* Progress Circle */}
            <Animated.View
              style={[
                styles.circleProgress,
                {
                  borderColor: focusColor,
                  transform: [{
                    rotateZ: animatedValue.interpolate({
                      inputRange: [0, 1],
                      outputRange: ['-90deg', `${(score.score / 100) * 360 - 90}deg`],
                    }),
                  }],
                },
              ]}
            />
            
            {/* Score Display */}
            <View style={styles.scoreContainer}>
              <Text style={[styles.scoreValue, { color: rating.color }]}>
                {score.score}
              </Text>
              <Text style={styles.scoreLabel}>/ 100</Text>
            </View>
          </Animated.View>
        </View>

        {/* Rating and Trend */}
        <View style={styles.ratingContainer}>
          <Text style={styles.ratingEmoji}>{rating.emoji}</Text>
          <Text style={[styles.ratingText, { color: rating.color }]}>
            {rating.rating}
          </Text>
          
          {score.trend && (
            <View style={styles.trendContainer}>
              <Text style={styles.trendEmoji}>{getTrendIcon()}</Text>
              <Text style={[styles.trendText, { color: getTrendColor() }]}>
                {score.trend === 'stable' ? 'Stable' : 
                 score.trend === 'up' ? 'Improving' : 'Declining'}
              </Text>
            </View>
          )}
        </View>

        {/* Comparison */}
        {score.comparison && (
          <View style={styles.comparisonContainer}>
            <Text style={styles.comparisonLabel}>vs Previous Period</Text>
            <Text style={[
              styles.comparisonValue,
              { color: score.comparison.change >= 0 ? Colors.status.success : Colors.status.error }
            ]}>
              {score.comparison.change >= 0 ? '+' : ''}{score.comparison.change.toFixed(1)}%
            </Text>
          </View>
        )}

        {/* Score Breakdown */}
        {expanded && (
          <View style={styles.breakdown}>
            <Text style={styles.breakdownTitle}>Score Breakdown</Text>
            
            <View style={styles.breakdownItems}>
              <View style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownLabel}>Consistency</Text>
                  <Text style={styles.breakdownValue}>
                    {score.consistency}/30
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${(score.consistency / 30) * 100}%`,
                        backgroundColor: focusColor
                      }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownLabel}>Task Completion</Text>
                  <Text style={styles.breakdownValue}>
                    {score.taskCompletion}/30
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${(score.taskCompletion / 30) * 100}%`,
                        backgroundColor: focusColor
                      }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownLabel}>Time Utilization</Text>
                  <Text style={styles.breakdownValue}>
                    {score.timeUtilization}/25
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${(score.timeUtilization / 25) * 100}%`,
                        backgroundColor: focusColor
                      }
                    ]} 
                  />
                </View>
              </View>

              <View style={styles.breakdownItem}>
                <View style={styles.breakdownHeader}>
                  <Text style={styles.breakdownLabel}>Category Balance</Text>
                  <Text style={styles.breakdownValue}>
                    {score.categoryBalance}/15
                  </Text>
                </View>
                <View style={styles.progressBar}>
                  <View 
                    style={[
                      styles.progressFill,
                      { 
                        width: `${(score.categoryBalance / 15) * 100}%`,
                        backgroundColor: focusColor
                      }
                    ]} 
                  />
                </View>
              </View>
            </View>

            {/* Tips for Improvement */}
            <View style={styles.tipsContainer}>
              <Text style={styles.tipsTitle}>Tips to Improve</Text>
              
              {score.consistency < 15 && (
                <View style={styles.tip}>
                  <Text style={styles.tipEmoji}>🔥</Text>
                  <Text style={styles.tipText}>
                    Build consistency by tracking daily activities
                  </Text>
                </View>
              )}
              
              {score.taskCompletion < 15 && (
                <View style={styles.tip}>
                  <Text style={styles.tipEmoji}>✅</Text>
                  <Text style={styles.tipText}>
                    Set realistic daily task goals to boost completion rates
                  </Text>
                </View>
              )}
              
              {score.timeUtilization < 12 && (
                <View style={styles.tip}>
                  <Text style={styles.tipEmoji}>⏱️</Text>
                  <Text style={styles.tipText}>
                    Use time tracking features to better understand your habits
                  </Text>
                </View>
              )}
              
              {score.categoryBalance < 8 && (
                <View style={styles.tip}>
                  <Text style={styles.tipEmoji}>⚖️</Text>
                  <Text style={styles.tipText}>
                    Try to balance activities across different categories
                  </Text>
                </View>
              )}
            </View>
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
  expandButton: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
    backgroundColor: Colors.background.light,
    borderRadius: Spacing.borderRadius.base,
  },
  expandButtonText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  content: {
    alignItems: 'center',
  },
  circleContainer: {
    marginBottom: Spacing.lg,
  },
  circle: {
    width: 120,
    height: 120,
    position: 'relative',
    justifyContent: 'center',
    alignItems: 'center',
  },
  circleBase: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
  },
  circleProgress: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderTopColor: 'transparent',
    borderRightColor: 'transparent',
    borderBottomColor: 'transparent',
  },
  scoreContainer: {
    alignItems: 'center',
  },
  scoreValue: {
    ...Typography.heading.h1,
    fontSize: 32,
    fontWeight: '700',
  },
  scoreLabel: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    marginTop: -4,
  },
  ratingContainer: {
    alignItems: 'center',
    marginBottom: Spacing.base,
  },
  ratingEmoji: {
    fontSize: 24,
    marginBottom: Spacing.xs,
  },
  ratingText: {
    ...Typography.body.medium,
    fontWeight: '600',
    marginBottom: Spacing.xs,
  },
  trendContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  trendEmoji: {
    fontSize: 16,
    marginRight: Spacing.xs,
  },
  trendText: {
    ...Typography.body.small,
    fontWeight: '500',
  },
  comparisonContainer: {
    alignItems: 'center',
    marginBottom: Spacing.lg,
    padding: Spacing.sm,
    backgroundColor: Colors.background.light,
    borderRadius: Spacing.borderRadius.base,
  },
  comparisonLabel: {
    ...Typography.caption,
    color: Colors.text.secondary,
    marginBottom: Spacing.xs,
  },
  comparisonValue: {
    ...Typography.body.medium,
    fontWeight: '700',
  },
  breakdown: {
    width: '100%',
    marginTop: Spacing.lg,
  },
  breakdownTitle: {
    ...Typography.body.medium,
    color: Colors.text.dark,
    fontWeight: '600',
    marginBottom: Spacing.base,
    textAlign: 'center',
  },
  breakdownItems: {
    marginBottom: Spacing.lg,
  },
  breakdownItem: {
    marginBottom: Spacing.base,
  },
  breakdownHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.xs,
  },
  breakdownLabel: {
    ...Typography.body.small,
    color: Colors.text.dark,
    fontWeight: '500',
  },
  breakdownValue: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    fontWeight: '600',
  },
  progressBar: {
    height: 4,
    backgroundColor: Colors.background.light,
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  tipsContainer: {
    marginTop: Spacing.base,
  },
  tipsTitle: {
    ...Typography.body.medium,
    color: Colors.text.dark,
    fontWeight: '600',
    marginBottom: Spacing.sm,
  },
  tip: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.background.light,
    borderRadius: Spacing.borderRadius.base,
    padding: Spacing.sm,
    marginBottom: Spacing.xs,
  },
  tipEmoji: {
    fontSize: 16,
    marginRight: Spacing.sm,
  },
  tipText: {
    ...Typography.body.small,
    color: Colors.text.secondary,
    flex: 1,
    lineHeight: 16,
  },
});