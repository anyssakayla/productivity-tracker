import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Dimensions
} from 'react-native';
import { Colors, Typography, Spacing } from '@/constants';
import { TrendsPeriod } from '@/types';
import { TRENDS_PERIODS } from '@/services/trends/TrendsService';

interface PeriodSelectorProps {
  selectedPeriod: TrendsPeriod;
  onPeriodChange: (period: TrendsPeriod) => void;
  focusColor?: string;
}

const { width: screenWidth } = Dimensions.get('window');

export const PeriodSelector: React.FC<PeriodSelectorProps> = ({
  selectedPeriod,
  onPeriodChange,
  focusColor = Colors.focus.work
}) => {
  const scrollViewRef = React.useRef<ScrollView>(null);

  const handlePeriodPress = (period: TrendsPeriod) => {
    onPeriodChange(period);
  };

  React.useEffect(() => {
    // Auto-scroll to selected period
    const selectedIndex = TRENDS_PERIODS.findIndex(
      period => period.value === selectedPeriod.value
    );
    
    if (selectedIndex !== -1 && scrollViewRef.current) {
      const scrollPosition = selectedIndex * (ITEM_WIDTH + ITEM_SPACING) - (screenWidth / 2) + (ITEM_WIDTH / 2);
      scrollViewRef.current.scrollTo({ x: Math.max(0, scrollPosition), animated: true });
    }
  }, [selectedPeriod]);

  return (
    <View style={styles.container}>
      <ScrollView
        ref={scrollViewRef}
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        decelerationRate="fast"
        snapToInterval={ITEM_WIDTH + ITEM_SPACING}
        snapToAlignment="center"
      >
        {TRENDS_PERIODS.map((period) => {
          const isSelected = period.value === selectedPeriod.value;
          
          return (
            <TouchableOpacity
              key={period.value}
              style={[
                styles.periodItem,
                isSelected && [
                  styles.selectedItem,
                  { backgroundColor: `${focusColor}20` }
                ]
              ]}
              onPress={() => handlePeriodPress(period)}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.periodText,
                  isSelected && [
                    styles.selectedText,
                    { color: focusColor }
                  ]
                ]}
              >
                {period.label}
              </Text>
              {period.days && (
                <Text
                  style={[
                    styles.daysText,
                    isSelected && { color: `${focusColor}80` }
                  ]}
                >
                  {period.days}d
                </Text>
              )}
            </TouchableOpacity>
          );
        })}
      </ScrollView>
      
      {/* Selection Indicator */}
      <View style={[styles.indicator, { backgroundColor: focusColor }]} />
    </View>
  );
};

const ITEM_WIDTH = 80;
const ITEM_SPACING = 12;

const styles = StyleSheet.create({
  container: {
    height: 80,
    backgroundColor: Colors.background.card,
    borderRadius: Spacing.borderRadius.large,
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
  scrollContent: {
    paddingHorizontal: screenWidth / 2 - ITEM_WIDTH / 2,
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  periodItem: {
    width: ITEM_WIDTH,
    height: 56,
    marginHorizontal: ITEM_SPACING / 2,
    borderRadius: Spacing.borderRadius.base,
    backgroundColor: 'transparent',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xs,
  },
  selectedItem: {
    borderWidth: 2,
    borderColor: 'rgba(0,0,0,0.1)',
  },
  periodText: {
    ...Typography.body.medium,
    color: Colors.text.secondary,
    fontSize: 14,
    fontWeight: '600',
    textAlign: 'center',
  },
  selectedText: {
    fontWeight: '700',
  },
  daysText: {
    ...Typography.caption,
    color: Colors.text.light,
    fontSize: 10,
    marginTop: 2,
  },
  indicator: {
    position: 'absolute',
    bottom: 8,
    left: '50%',
    marginLeft: -12,
    width: 24,
    height: 3,
    borderRadius: 1.5,
  }
});