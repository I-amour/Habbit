import { useColorScheme } from 'react-native';
import { Colors, ColorScheme } from '../constants/colors';

export function useTheme(): ColorScheme {
  const colorScheme = useColorScheme();
  return colorScheme === 'dark' ? Colors.dark : Colors.light;
}
