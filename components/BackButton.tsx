import { Pressable, StyleSheet } from 'react-native';
import { router } from 'expo-router';

import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';

interface BackButtonProps {
  destination: string; // Route to navigate to
}

export default function BackButton({ destination }: BackButtonProps) {
  const colorScheme = useColorScheme();

  return (
    <Pressable
      style={styles.container}
      onPress={() => router.navigate(destination)}
    >
      <IconSymbol
        name="arrow.left"
        size={24}
        color={Colors[colorScheme ?? 'light'].tint}
      />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 60, // Adjusted to align with increased container paddingTop
    left: 16,
    zIndex: 10,
  },
});