import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Alert,
  Modal,
  ScrollView,
} from 'react-native';
import { useTheme } from '../context/ThemeContext';
import ScrollableContainer from '../components/ScrollableContainer';

const ThemeSettingsScreen = ({ navigation }) => {
  const { currentTheme, setTheme, getThemeColors, THEME_TYPES, DEFAULT_THEMES } = useTheme();
  const [showColorPicker, setShowColorPicker] = useState(false);
  const [customColors, setCustomColors] = useState({
    primary: '#2196F3',
    secondary: '#FFC107',
    background: '#FFFFFF',
  });

  const colors = getThemeColors();

  const handleThemeSelect = async (themeType) => {
    try {
      await setTheme(themeType);
      Alert.alert('Theme Updated', `${themeType.charAt(0).toUpperCase() + themeType.slice(1)} theme applied successfully!`);
    } catch (error) {
      Alert.alert('Error', 'Failed to apply theme');
    }
  };

  const handleCustomTheme = async () => {
    try {
      await setTheme(THEME_TYPES.CUSTOM, customColors);
      Alert.alert('Custom Theme Applied', 'Your custom theme has been applied successfully!');
      setShowColorPicker(false);
    } catch (error) {
      Alert.alert('Error', 'Failed to apply custom theme');
    }
  };

  const renderThemeOption = (themeType, title, description, previewColors) => (
    <TouchableOpacity
      style={[
        styles.themeOption,
        { borderColor: colors.border },
        currentTheme.type === themeType && { borderColor: colors.primary, borderWidth: 2 }
      ]}
      onPress={() => handleThemeSelect(themeType)}
    >
      <View style={styles.themePreview}>
        <View style={[styles.colorPreview, { backgroundColor: previewColors.primary }]} />
        <View style={[styles.colorPreview, { backgroundColor: previewColors.secondary }]} />
        <View style={[styles.colorPreview, { backgroundColor: previewColors.background }]} />
      </View>
      <View style={styles.themeInfo}>
        <Text style={[styles.themeTitle, { color: colors.text }]}>{title}</Text>
        <Text style={[styles.themeDescription, { color: colors.textSecondary }]}>{description}</Text>
      </View>
      {currentTheme.type === themeType && (
        <View style={[styles.selectedIndicator, { backgroundColor: colors.primary }]} />
      )}
    </TouchableOpacity>
  );

  const renderColorPicker = () => (
    <Modal
      visible={showColorPicker}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View style={[styles.modalContainer, { backgroundColor: colors.background }]}>
        <View style={[styles.modalHeader, { borderBottomColor: colors.border }]}>
          <Text style={[styles.modalTitle, { color: colors.text }]}>Custom Theme Colors</Text>
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => setShowColorPicker(false)}
          >
            <Text style={[styles.closeButtonText, { color: colors.text }]}>✕</Text>
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.colorPickerContent}>
          <View style={styles.colorSection}>
            <Text style={[styles.colorLabel, { color: colors.text }]}>Primary Color</Text>
            <View style={styles.colorRow}>
              {['#2196F3', '#E91E63', '#9C27B0', '#673AB7', '#3F51B5', '#FF5722'].map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    customColors.primary === color && styles.selectedColor
                  ]}
                  onPress={() => setCustomColors({ ...customColors, primary: color })}
                />
              ))}
            </View>
          </View>

          <View style={styles.colorSection}>
            <Text style={[styles.colorLabel, { color: colors.text }]}>Secondary Color</Text>
            <View style={styles.colorRow}>
              {['#FFC107', '#FF9800', '#FF5722', '#4CAF50', '#8BC34A', '#CDDC39'].map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    customColors.secondary === color && styles.selectedColor
                  ]}
                  onPress={() => setCustomColors({ ...customColors, secondary: color })}
                />
              ))}
            </View>
          </View>

          <View style={styles.colorSection}>
            <Text style={[styles.colorLabel, { color: colors.text }]}>Background Color</Text>
            <View style={styles.colorRow}>
              {['#FFFFFF', '#F5F5F5', '#E8F5E8', '#FFF8E1', '#F3E5F5', '#E1F5FE'].map(color => (
                <TouchableOpacity
                  key={color}
                  style={[
                    styles.colorOption,
                    { backgroundColor: color },
                    customColors.background === color && styles.selectedColor
                  ]}
                  onPress={() => setCustomColors({ ...customColors, background: color })}
                />
              ))}
            </View>
          </View>

          <View style={styles.previewSection}>
            <Text style={[styles.colorLabel, { color: colors.text }]}>Preview</Text>
            <View style={[styles.themePreviewPanel, { backgroundColor: customColors.background }]}>
              <View style={[styles.previewButton, { backgroundColor: customColors.primary }]}>
                <Text style={styles.previewButtonText}>Button</Text>
              </View>
              <Text style={[styles.previewText, { color: colors.text }]}>Sample Text</Text>
            </View>
          </View>
        </ScrollView>

        <View style={[styles.modalFooter, { borderTopColor: colors.border }]}>
          <TouchableOpacity
            style={[styles.cancelButton, { borderColor: colors.border }]}
            onPress={() => setShowColorPicker(false)}
          >
            <Text style={[styles.cancelButtonText, { color: colors.text }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.applyButton, { backgroundColor: colors.primary }]}
            onPress={handleCustomTheme}
          >
            <Text style={styles.applyButtonText}>Apply Theme</Text>
          </TouchableOpacity>
        </View>
      </View>
    </Modal>
  );

  return (
    <ScrollableContainer style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { backgroundColor: colors.primary }]}>
        <Text style={styles.headerTitle}>Theme Settings</Text>
        <Text style={styles.headerSubtitle}>Choose your preferred theme</Text>
      </View>

      <View style={styles.content}>
        <Text style={[styles.sectionTitle, { color: colors.text }]}>Available Themes</Text>

        {renderThemeOption(
          THEME_TYPES.LIGHT,
          'Light Mode',
          'Clean and bright interface',
          DEFAULT_THEMES.light.colors
        )}

        {renderThemeOption(
          THEME_TYPES.DARK,
          'Dark Mode',
          'Easy on the eyes in low light',
          DEFAULT_THEMES.dark.colors
        )}

        {renderThemeOption(
          THEME_TYPES.LIGHT_ROOM,
          'Light Room',
          'Soft and comfortable colors',
          DEFAULT_THEMES.light_room.colors
        )}

        <TouchableOpacity
          style={[styles.customThemeButton, { backgroundColor: colors.surface, borderColor: colors.border }]}
          onPress={() => setShowColorPicker(true)}
        >
          <Text style={[styles.customThemeText, { color: colors.text }]}>Custom Theme</Text>
          <Text style={[styles.customThemeSubtext, { color: colors.textSecondary }]}>
            Create your own color scheme
          </Text>
        </TouchableOpacity>

        <View style={styles.currentThemeInfo}>
          <Text style={[styles.infoTitle, { color: colors.text }]}>Current Theme</Text>
          <Text style={[styles.infoText, { color: colors.textSecondary }]}>
            {currentTheme.type.charAt(0).toUpperCase() + currentTheme.type.slice(1).replace('_', ' ')}
          </Text>
        </View>
      </View>

      {renderColorPicker()}
    </ScrollableContainer>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  header: {
    padding: 20,
    paddingTop: 40,
  },
  headerTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    color: '#fff',
    marginBottom: 5,
  },
  headerSubtitle: {
    fontSize: 14,
    color: '#e3f2fd',
  },
  content: {
    padding: 20,
  },
  sectionTitle: {
    fontSize: 18,
    fontWeight: '600',
    marginBottom: 20,
  },
  themeOption: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 15,
    marginBottom: 10,
    borderRadius: 10,
    borderWidth: 1,
    backgroundColor: '#fff',
  },
  themePreview: {
    flexDirection: 'row',
    marginRight: 15,
  },
  colorPreview: {
    width: 20,
    height: 20,
    borderRadius: 10,
    marginRight: 5,
  },
  themeInfo: {
    flex: 1,
  },
  themeTitle: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 2,
  },
  themeDescription: {
    fontSize: 14,
  },
  selectedIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  customThemeButton: {
    padding: 20,
    borderRadius: 10,
    borderWidth: 1,
    marginBottom: 20,
    alignItems: 'center',
  },
  customThemeText: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 5,
  },
  customThemeSubtext: {
    fontSize: 14,
  },
  currentThemeInfo: {
    padding: 15,
    backgroundColor: '#f8f9fa',
    borderRadius: 10,
    alignItems: 'center',
  },
  infoTitle: {
    fontSize: 14,
    fontWeight: '500',
    marginBottom: 5,
  },
  infoText: {
    fontSize: 16,
    fontWeight: '600',
  },
  // Modal styles
  modalContainer: {
    flex: 1,
  },
  modalHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 20,
    borderBottomWidth: 1,
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  closeButton: {
    padding: 5,
  },
  closeButtonText: {
    fontSize: 20,
    fontWeight: 'bold',
  },
  colorPickerContent: {
    flex: 1,
    padding: 20,
  },
  colorSection: {
    marginBottom: 30,
  },
  colorLabel: {
    fontSize: 16,
    fontWeight: '500',
    marginBottom: 10,
  },
  colorRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 10,
  },
  colorOption: {
    width: 40,
    height: 40,
    borderRadius: 20,
    borderWidth: 2,
    borderColor: 'transparent',
  },
  selectedColor: {
    borderColor: '#333',
    borderWidth: 3,
  },
  previewSection: {
    marginTop: 20,
  },
  themePreviewPanel: {
    padding: 20,
    borderRadius: 10,
    alignItems: 'center',
  },
  previewButton: {
    paddingHorizontal: 20,
    paddingVertical: 10,
    borderRadius: 5,
    marginBottom: 10,
  },
  previewButtonText: {
    color: '#fff',
    fontWeight: '500',
  },
  previewText: {
    fontSize: 16,
  },
  modalFooter: {
    flexDirection: 'row',
    padding: 20,
    borderTopWidth: 1,
    gap: 10,
  },
  cancelButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    borderWidth: 1,
    alignItems: 'center',
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '500',
  },
  applyButton: {
    flex: 1,
    padding: 15,
    borderRadius: 8,
    alignItems: 'center',
  },
  applyButtonText: {
    color: '#fff',
    fontSize: 16,
    fontWeight: '500',
  },
});

export default ThemeSettingsScreen;

