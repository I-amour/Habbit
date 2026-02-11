import React, { useState, useRef } from 'react';
import {
  View, Text, Pressable, Image, StyleSheet, FlatList, Dimensions, ViewToken,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { router } from 'expo-router';
import Animated, { FadeInDown, FadeInUp } from 'react-native-reanimated';
import { useSettingsStore } from '../src/store/settingsStore';
import { useTheme } from '../src/hooks/useTheme';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

interface OnboardingSlide {
  icon?: string;
  useLogo?: boolean;
  title: string;
  subtitle: string;
  color: string;
}

const SLIDES: OnboardingSlide[] = [
  {
    useLogo: true,
    title: 'Welcome to Habbit',
    subtitle: 'Build positive routines by checking off daily habits. Simple taps with satisfying animations make it fun.',
    color: '#FF6B47',
  },
  {
    icon: 'fire',
    title: 'Build Streaks',
    subtitle: "Don't break the chain! Watch your streak grow day by day. One free streak freeze per week keeps you safe.",
    color: '#FF8C42',
  },
  {
    icon: 'trophy',
    title: 'Earn Badges & XP',
    subtitle: 'Level up as you build consistency. Unlock badges for milestones and climb the ranks!',
    color: '#FFD700',
  },
  {
    icon: 'calendar-month',
    title: 'See Your Progress',
    subtitle: 'A beautiful calendar heatmap shows your history at a glance. Watch the colors fill in over time.',
    color: '#2ECC71',
  },
];

export default function OnboardingScreen() {
  const theme = useTheme();
  const completeOnboarding = useSettingsStore(s => s.completeOnboarding);
  const [currentIndex, setCurrentIndex] = useState(0);
  const flatListRef = useRef<FlatList>(null);

  const isLast = currentIndex === SLIDES.length - 1;

  const handleNext = async () => {
    if (isLast) {
      await completeOnboarding();
      router.replace('/(tabs)');
    } else {
      flatListRef.current?.scrollToIndex({ index: currentIndex + 1 });
    }
  };

  const handleSkip = async () => {
    await completeOnboarding();
    router.replace('/(tabs)');
  };

  const onViewableItemsChanged = useRef(({ viewableItems }: { viewableItems: ViewToken[] }) => {
    if (viewableItems.length > 0 && viewableItems[0].index !== null) {
      setCurrentIndex(viewableItems[0].index);
    }
  }).current;

  const renderSlide = ({ item }: { item: OnboardingSlide }) => (
    <View style={[styles.slide, { width: SCREEN_WIDTH }]}>
      {item.useLogo ? (
        <Animated.View entering={FadeInUp.delay(200)}>
          <Image
            source={require('../assets/logo.png')}
            style={styles.logoImage}
            resizeMode="contain"
          />
        </Animated.View>
      ) : (
        <Animated.View entering={FadeInUp.delay(200)} style={[styles.iconCircle, { backgroundColor: item.color + '20' }]}>
          <MaterialCommunityIcons
            name={item.icon as keyof typeof MaterialCommunityIcons.glyphMap}
            size={64}
            color={item.color}
          />
        </Animated.View>
      )}
      <Animated.Text entering={FadeInDown.delay(300)} style={[styles.slideTitle, { color: theme.text }]}>
        {item.title}
      </Animated.Text>
      <Animated.Text entering={FadeInDown.delay(400)} style={[styles.slideSubtitle, { color: theme.textSecondary }]}>
        {item.subtitle}
      </Animated.Text>
    </View>
  );

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: theme.background }]}>
      {/* Skip button */}
      <View style={styles.skipRow}>
        {!isLast && (
          <Pressable onPress={handleSkip} hitSlop={12}>
            <Text style={[styles.skipText, { color: theme.textSecondary }]}>Skip</Text>
          </Pressable>
        )}
      </View>

      {/* Slides */}
      <FlatList
        ref={flatListRef}
        data={SLIDES}
        renderItem={renderSlide}
        horizontal
        pagingEnabled
        showsHorizontalScrollIndicator={false}
        keyExtractor={(_, i) => i.toString()}
        onViewableItemsChanged={onViewableItemsChanged}
        viewabilityConfig={{ viewAreaCoveragePercentThreshold: 50 }}
      />

      {/* Dots + Button */}
      <View style={styles.bottomSection}>
        <View style={styles.dots}>
          {SLIDES.map((_, i) => (
            <View
              key={i}
              style={[
                styles.dot,
                {
                  backgroundColor: i === currentIndex ? theme.primary : theme.border,
                  width: i === currentIndex ? 24 : 8,
                },
              ]}
            />
          ))}
        </View>

        <Pressable
          onPress={handleNext}
          style={[styles.nextButton, { backgroundColor: theme.primary }]}
        >
          <Text style={styles.nextText}>
            {isLast ? "Let's Go!" : 'Next'}
          </Text>
          {!isLast && (
            <MaterialCommunityIcons name="arrow-right" size={20} color="#FFFFFF" />
          )}
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  skipRow: {
    flexDirection: 'row',
    justifyContent: 'flex-end',
    paddingHorizontal: 20,
    paddingVertical: 12,
    minHeight: 44,
  },
  skipText: {
    fontSize: 16,
    fontWeight: '500',
  },
  slide: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 40,
  },
  logoImage: {
    width: 160,
    height: 160,
    marginBottom: 24,
  },
  iconCircle: {
    width: 128,
    height: 128,
    borderRadius: 64,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 32,
  },
  slideTitle: {
    fontSize: 28,
    fontWeight: '800',
    textAlign: 'center',
    marginBottom: 12,
  },
  slideSubtitle: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
  },
  bottomSection: {
    paddingHorizontal: 20,
    paddingBottom: 20,
    gap: 24,
    alignItems: 'center',
  },
  dots: {
    flexDirection: 'row',
    gap: 8,
    alignItems: 'center',
  },
  dot: {
    height: 8,
    borderRadius: 4,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 16,
    paddingHorizontal: 40,
    borderRadius: 28,
    width: '100%',
    gap: 8,
  },
  nextText: {
    color: '#FFFFFF',
    fontSize: 18,
    fontWeight: '700',
  },
});
