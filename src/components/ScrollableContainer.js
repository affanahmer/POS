import React from 'react';
import { ScrollView, StyleSheet } from 'react-native';

const ScrollableContainer = ({
  children,
  style,
  contentContainerStyle,
  showsVerticalScrollIndicator = true,
  showsHorizontalScrollIndicator = false,
  bounces = true,
  nestedScrollEnabled = true,
  scrollEventThrottle = 16,
  ...props
}) => {
  return (
    <ScrollView
      style={[styles.container, style]}
      contentContainerStyle={[styles.contentContainer, contentContainerStyle]}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      showsHorizontalScrollIndicator={showsHorizontalScrollIndicator}
      bounces={bounces}
      nestedScrollEnabled={nestedScrollEnabled}
      scrollEventThrottle={scrollEventThrottle}
      {...props}
    >
      {children}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  contentContainer: {
    flexGrow: 1,
  },
});

export default ScrollableContainer;
