import { StyleSheet } from 'react-native';

import BackButton from '@/components/BackButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';

export default function ProfileScreen() {
  return (
    <ThemedView style={styles.container}>
      <BackButton />
      <ThemedText type="title">Profile</ThemedText>
      <ThemedText>This screen has not been implemented yet.</ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
});