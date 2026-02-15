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

const CONFETTI_COLORS = ['#FF6B47', '#FFB09A', '#FFD700', '#2ECC71', '#FF8C6B', '#FFA07A'];
const PARTICLE_COUNT = 24;

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
    x: SCREEN_WIDTH * 0.1 + Math.random() * SCREEN_WIDTH * 0.8,
    y: -10,
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 5 + Math.random() * 5,
    delay: Math.random() * 350,
    driftX: (Math.random() - 0.5) * 100,
    fallDistance: 250 + Math.random() * 300,
  }));
}

function ConfettiPiece({ particle }: { particle: Particle }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(0);

  useEffect(() => {
    opacity.value = withDelay(
      particle.delay,
      withTiming(0.9, { duration: 120 })
    );
    translateY.value = withDelay(
      particle.delay,
      withTiming(particle.fallDistance, {
        duration: 1500,
        easing: Easing.out(Easing.quad),
      })
    );
    translateX.value = withDelay(
      particle.delay,
      withTiming(particle.driftX, { duration: 1500, easing: Easing.out(Easing.quad) })
    );
    rotate.value = withDelay(
      particle.delay,
      withTiming(particle.rotation + 240, { duration: 1500 })
    );
    opacity.value = withDelay(
      particle.delay + 1000,
      withTiming(0, { duration: 500 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: particle.x,
    top: particle.y,
    width: particle.size,
    height: particle.size * 0.55,
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
        const timer = setTimeout(() => runOnJS(onComplete)(), 2000);
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
