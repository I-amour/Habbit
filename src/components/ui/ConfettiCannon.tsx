import React, { useEffect } from 'react';
import { StyleSheet, Dimensions } from 'react-native';
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withTiming,
  withDelay,
  withSequence,
  Easing,
  runOnJS,
} from 'react-native-reanimated';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');

const CONFETTI_COLORS = ['#FF6B47', '#FFD700', '#2ECC71', '#3498DB', '#9B59B6', '#FF8C42', '#E91E63', '#00BCD4'];
const PARTICLE_COUNT = 40;

interface Particle {
  x: number;
  y: number;
  rotation: number;
  color: string;
  size: number;
  delay: number;
  driftX: number;
}

function generateParticles(): Particle[] {
  return Array.from({ length: PARTICLE_COUNT }, (_, i) => ({
    x: SCREEN_WIDTH * 0.2 + Math.random() * SCREEN_WIDTH * 0.6,
    y: -20,
    rotation: Math.random() * 360,
    color: CONFETTI_COLORS[i % CONFETTI_COLORS.length],
    size: 6 + Math.random() * 6,
    delay: Math.random() * 400,
    driftX: (Math.random() - 0.5) * 120,
  }));
}

function ConfettiPiece({ particle }: { particle: Particle }) {
  const translateY = useSharedValue(0);
  const translateX = useSharedValue(0);
  const rotate = useSharedValue(0);
  const opacity = useSharedValue(1);
  const scale = useSharedValue(0);

  useEffect(() => {
    scale.value = withDelay(
      particle.delay,
      withSequence(
        withTiming(1, { duration: 100 }),
        withTiming(1, { duration: 1200 }),
        withTiming(0, { duration: 300 }),
      )
    );
    translateY.value = withDelay(
      particle.delay,
      withTiming(SCREEN_HEIGHT * 0.7 + Math.random() * 200, {
        duration: 1600,
        easing: Easing.bezier(0.25, 0.1, 0.25, 1),
      })
    );
    translateX.value = withDelay(
      particle.delay,
      withTiming(particle.driftX, { duration: 1600, easing: Easing.out(Easing.quad) })
    );
    rotate.value = withDelay(
      particle.delay,
      withTiming(particle.rotation + 360 + Math.random() * 360, { duration: 1600 })
    );
    opacity.value = withDelay(
      particle.delay + 1200,
      withTiming(0, { duration: 400 })
    );
  }, []);

  const style = useAnimatedStyle(() => ({
    position: 'absolute',
    left: particle.x,
    top: particle.y,
    width: particle.size,
    height: particle.size * 0.6,
    borderRadius: 2,
    backgroundColor: particle.color,
    opacity: opacity.value,
    transform: [
      { translateX: translateX.value },
      { translateY: translateY.value },
      { rotate: `${rotate.value}deg` },
      { scale: scale.value },
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
