import React, { useState, useMemo } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  ScrollView,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, Typography, Spacing } from '@/constants';
import { Button } from '@/components/common';
import { 
  generateCategoryPalette, 
  getColorRelationshipName,
  hexToHsl,
  hslToHex,
} from '@/utils/colorUtils';

interface CategoryColorPickerProps {
  focusColor: string;
  selectedColor: string;
  onColorSelect: (color: string) => void;
  showRelationship?: boolean;
}

interface ColorOptionProps {
  color: string;
  isSelected: boolean;
  onPress: () => void;
  label?: string;
  relationship?: string;
}

const ColorOption: React.FC<ColorOptionProps> = ({ 
  color, 
  isSelected, 
  onPress, 
  label,
  relationship 
}) => (
  <TouchableOpacity
    style={[
      styles.colorOption,
      { backgroundColor: color },
      isSelected && styles.colorOptionSelected
    ]}
    onPress={onPress}
    activeOpacity={0.7}
  />
);

interface CustomColorPickerProps {
  initialColor: string;
  onColorChange: (color: string) => void;
}

const CustomColorPicker: React.FC<CustomColorPickerProps> = ({ 
  initialColor, 
  onColorChange 
}) => {
  const [hsl, setHsl] = useState(() => {
    const initialHsl = hexToHsl(initialColor);
    return initialHsl || { h: 0, s: 50, l: 50 };
  });

  const currentColor = useMemo(() => hslToHex(hsl.h, hsl.s, hsl.l), [hsl]);

  const updateHue = (h: number) => {
    const newHsl = { ...hsl, h };
    setHsl(newHsl);
    onColorChange(hslToHex(newHsl.h, newHsl.s, newHsl.l));
  };

  const updateSaturation = (s: number) => {
    const newHsl = { ...hsl, s };
    setHsl(newHsl);
    onColorChange(hslToHex(newHsl.h, newHsl.s, newHsl.l));
  };

  const updateLightness = (l: number) => {
    const newHsl = { ...hsl, l };
    setHsl(newHsl);
    onColorChange(hslToHex(newHsl.h, newHsl.s, newHsl.l));
  };

  return (
    <View style={styles.customPicker}>
      <View style={[styles.colorPreview, { backgroundColor: currentColor }]} />
      
      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Hue</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.hueSlider}
          contentContainerStyle={styles.hueSliderContent}
        >
          {Array.from({ length: 36 }, (_, i) => i * 10).map((h) => (
            <TouchableOpacity
              key={h}
              style={[
                styles.hueOption,
                { backgroundColor: hslToHex(h, hsl.s, hsl.l) },
                Math.abs(hsl.h - h) < 5 && styles.selectedHue
              ]}
              onPress={() => updateHue(h)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Saturation</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.saturationSlider}
          contentContainerStyle={styles.sliderContent}
        >
          {[10, 25, 40, 55, 70, 85, 100].map((s) => (
            <TouchableOpacity
              key={s}
              style={[
                styles.saturationOption,
                { backgroundColor: hslToHex(hsl.h, s, hsl.l) },
                Math.abs(hsl.s - s) < 10 && styles.selectedOption
              ]}
              onPress={() => updateSaturation(s)}
            />
          ))}
        </ScrollView>
      </View>

      <View style={styles.sliderContainer}>
        <Text style={styles.sliderLabel}>Lightness</Text>
        <ScrollView 
          horizontal 
          showsHorizontalScrollIndicator={false}
          style={styles.lightnessSlider}
          contentContainerStyle={styles.sliderContent}
        >
          {[15, 25, 35, 45, 55, 65, 75, 85].map((l) => (
            <TouchableOpacity
              key={l}
              style={[
                styles.lightnessOption,
                { backgroundColor: hslToHex(hsl.h, hsl.s, l) },
                Math.abs(hsl.l - l) < 8 && styles.selectedOption
              ]}
              onPress={() => updateLightness(l)}
            />
          ))}
        </ScrollView>
      </View>
    </View>
  );
};

export const CategoryColorPicker: React.FC<CategoryColorPickerProps> = ({
  focusColor,
  selectedColor,
  onColorSelect,
  showRelationship = true,
}) => {
  const insets = useSafeAreaInsets();
  const [showCustomPicker, setShowCustomPicker] = useState(false);
  const [customColor, setCustomColor] = useState(selectedColor);

  const palette = useMemo(() => generateCategoryPalette(focusColor), [focusColor]);
  
  const relationship = useMemo(
    () => getColorRelationshipName(focusColor, selectedColor),
    [focusColor, selectedColor]
  );

  const handleCustomColorSave = () => {
    onColorSelect(customColor);
    setShowCustomPicker(false);
  };

  // Optimize palette to 6 colors
  const optimizedColors = [
    palette.suggested[0], // Original focus color
    palette.suggested[1], // Light shade
    palette.suggested[2], // Dark shade  
    palette.complementary, // Complementary
    palette.analogous[0], // Analogous 1
    palette.analogous[2], // Analogous 2
  ];

  return (
    <View style={styles.container}>
      <View style={styles.colorGrid}>
        {optimizedColors.map((color) => (
          <ColorOption
            key={color}
            color={color}
            isSelected={selectedColor === color}
            onPress={() => onColorSelect(color)}
          />
        ))}
        
        {/* Rainbow gradient custom color button */}
        <TouchableOpacity
          style={[
            styles.colorOption,
            styles.rainbowButton,
            !optimizedColors.includes(selectedColor) && styles.colorOptionSelected
          ]}
          onPress={() => setShowCustomPicker(true)}
          activeOpacity={0.7}
        >
          <View style={styles.rainbowGradient}>
            <View style={[styles.rainbowSegment, { backgroundColor: '#ff0000' }]} />
            <View style={[styles.rainbowSegment, { backgroundColor: '#ff8000' }]} />
            <View style={[styles.rainbowSegment, { backgroundColor: '#ffff00' }]} />
            <View style={[styles.rainbowSegment, { backgroundColor: '#80ff00' }]} />
            <View style={[styles.rainbowSegment, { backgroundColor: '#00ff80' }]} />
            <View style={[styles.rainbowSegment, { backgroundColor: '#0080ff' }]} />
            <View style={[styles.rainbowSegment, { backgroundColor: '#8000ff' }]} />
          </View>
        </TouchableOpacity>
      </View>

      <Modal
        visible={showCustomPicker}
        animationType="slide"
        transparent={true}
        onRequestClose={() => setShowCustomPicker(false)}
      >
        <View style={styles.modalOverlay}>
          <View style={[styles.modalContent, { paddingBottom: insets.bottom + 20 }]}>
            <Text style={styles.modalTitle}>Custom Color</Text>
            
            <CustomColorPicker
              initialColor={customColor}
              onColorChange={setCustomColor}
            />

            <View style={styles.modalActions}>
              <Button
                title="Cancel"
                onPress={() => setShowCustomPicker(false)}
                variant="secondary"
                size="large"
              />
              <Button
                title="Use Color"
                onPress={handleCustomColorSave}
                variant="primary"
                size="large"
              />
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: '100%',
  },
  colorGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.xs,
  },
  colorOption: {
    width: 36,
    height: 36,
    borderRadius: 18,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  colorOptionSelected: {
    borderColor: Colors.text.dark,
  },
  rainbowButton: {
    padding: 0,
    overflow: 'hidden',
  },
  rainbowGradient: {
    width: '100%',
    height: '100%',
    flexDirection: 'row',
  },
  rainbowSegment: {
    flex: 1,
    height: '100%',
  },
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'flex-end',
  },
  modalContent: {
    backgroundColor: Colors.background.primary,
    borderTopLeftRadius: Spacing.borderRadius.xl,
    borderTopRightRadius: Spacing.borderRadius.xl,
    padding: Spacing.padding.screen,
  },
  modalTitle: {
    ...Typography.heading.h3,
    color: Colors.text.dark,
    marginBottom: Spacing.xl,
    textAlign: 'center',
  },
  modalActions: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: Spacing.xl,
  },
  customPicker: {
    marginBottom: Spacing.xl,
  },
  colorPreview: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignSelf: 'center',
    marginBottom: Spacing.xl,
    borderWidth: 2,
    borderColor: Colors.ui.border,
  },
  sliderContainer: {
    marginBottom: Spacing.lg,
  },
  sliderLabel: {
    ...Typography.body.regular,
    color: Colors.text.dark,
    fontWeight: '500',
    marginBottom: Spacing.sm,
  },
  hueSlider: {
    flexDirection: 'row',
  },
  hueSliderContent: {
    paddingHorizontal: Spacing.sm,
  },
  saturationSlider: {
    flexDirection: 'row',
  },
  lightnessSlider: {
    flexDirection: 'row',
  },
  sliderContent: {
    paddingHorizontal: Spacing.sm,
  },
  hueOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: Spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedHue: {
    borderColor: Colors.text.dark,
  },
  saturationOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: Spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  lightnessOption: {
    width: 30,
    height: 30,
    borderRadius: 15,
    marginHorizontal: Spacing.xs,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedOption: {
    borderColor: Colors.text.dark,
  },
});