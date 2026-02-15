import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH } = Dimensions.get('window');

// Muted, on-brand palette — coral tones + gold
const CONFETTI_COLORS = ['#FF6B47', '#FFB09A', '#FFD700', '#FFD4C4', '#FF8C6B', '#FFA07A'];
const PARTICLE_COUNT = 18;

interface Particle {
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
  driftX: number;
  fallDistance: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    x: SCREEN_WIDTH * 0.15 + Math.random() * SCREEN_WIDTH * 0.7,
    y: -10,
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 4 + Math.random() * 4,
    delay: Math.random() * 300,
    driftX: (Math.random() - 0.5) * 80,
    fallDistance: 200 + Math.random() * 250,
  }));
}

function ConfettiPiece({ particle }: { particle: Particle }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    // Fade in gently
    opacity.value = withDelay(
      particle.delay,
      withTiming(0.8, { duration: 150 })
    );
    // Gentle fall
    translateY.value = withDelay(
      particle.delay,
      withTiming(particle.fallDistance, {
        duration: 1400,
        easing: Easing.out(Easing.quad),
      })
    );
    translateX.value = withDelay(
      particle.delay,
      withTiming(particle.driftX, { duration: 1400, easing: Easing.out(Easing.quad) })
    );
    rotate.value = withDelay(
      particle.delay,
      withTiming(particle.rotation + 180, { duration: 1400 })
    );
    // Fade out
    opacity.value = withDelay(
      particle.delay + 900,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: particle.x,
    top: particle.y,
    width: particle.size,
    height: particle.size * 0.5,
    borderRadius: particle.size / 4,
    backgroundColor: particle.color,
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
    ],
  }));

  return <Animated.View style={style} />;
}

interface ConfettiCannonProps {
  active: boolean;
  onComplete?: () => void;
}

export function ConfettiCannon({ active, onComplete }: ConfettiCannonProps) {
  const [particles, setParticles] = React.useState<Particle[]>([]);

  useEffect(() => {
    if (active) {
      setParticles(generateParticles());
      if (onComplete) {
        const timer = setTimeout(() => runOnJS(onComplete)(), 1800);
        return () => clearTimeout(timer);
      }
    } else {
      setParticles([]);
    }
  }, [active]);

  if (!active || particles.length === 0) return null;

  return (
    <Animated.View style={styles.container} pointerEvents="none">
      {particles.map((p, i) => (
        <ConfettiPiece key={i} particle={p} />
      ))}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 999,
  },
});
