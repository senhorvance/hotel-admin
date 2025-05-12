import { useState, useEffect } from 'react';
import { StyleSheet, Pressable } from 'react-native';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getDb } from '@/hooks/db';

export default function HomeScreen() {
  const colorScheme = useColorScheme();
  const [weekStart, setWeekStart] = useState(getMonday(new Date()));
  const [weekOccupancy, setWeekOccupancy] = useState(0);
  const [todayOccupancy, setTodayOccupancy] = useState(0);
  const maxOccupancy = 15;

  // Get Monday of the current week
  function getMonday(date: Date): Date {
    const d = new Date(date);
    const day = d.getDay();
    const diff = day === 0 ? -6 : 1 - day; // Adjust to Monday
    d.setDate(d.getDate() + diff);
    d.setHours(0, 0, 0, 0);
    return d;
  }

  // Format date as YYYY-MM-DD
  function formatDate(date: Date): string {
    return date.toISOString().split('T')[0];
  }

  // Get week range for display
  function getWeekRange(start: Date): string {
    const end = new Date(start);
    end.setDate(start.getDate() + 6);
    return `${start.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })} - ${end.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}`;
  }

  // Load occupancy data
  const loadOccupancy = async () => {
    try {
      const db = getDb();
      const weekEnd = new Date(weekStart);
      weekEnd.setDate(weekStart.getDate() + 6);

      // Week occupancy: Sum guests where stay overlaps with week
      const weekResult = await db.getFirstAsync<{
        total_guests: number;
      }>(
        `SELECT COALESCE(SUM(number_of_guests), 0) AS total_guests
         FROM quotes
         WHERE invoice_status = 'invoiced'
         AND check_in_date <= ? AND check_out_date >= ?`,
        [formatDate(weekEnd), formatDate(weekStart)]
      );
      setWeekOccupancy(weekResult?.total_guests || 0);

      // Today occupancy: Sum guests where stay includes today
      const today = formatDate(new Date());
      const todayResult = await db.getFirstAsync<{
        total_guests: number;
      }>(
        `SELECT COALESCE(SUM(number_of_guests), 0) AS total_guests
         FROM quotes
         WHERE invoice_status = 'invoiced'
         AND check_in_date <= ? AND check_out_date >= ?`,
        [today, today]
      );
      setTodayOccupancy(todayResult?.total_guests || 0);

      console.log('Occupancy loaded:', {
        week: weekResult?.total_guests,
        today: todayResult?.total_guests,
      });
    } catch (error) {
      console.error('Error loading occupancy:', error);
    }
  };

  useEffect(() => {
    loadOccupancy();
  }, [weekStart]);

  // Navigate to previous/next week
  const goToPreviousWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() - 7);
    setWeekStart(getMonday(newStart));
  };

  const goToNextWeek = () => {
    const newStart = new Date(weekStart);
    newStart.setDate(weekStart.getDate() + 7);
    setWeekStart(getMonday(newStart));
  };

  return (
    <ThemedView style={styles.container}>
      <ThemedText type="title">Home</ThemedText>
      <ThemedText style={styles.weekRange}>Week: {getWeekRange(weekStart)}</ThemedText>
      <ThemedView style={styles.navigation}>
        <Pressable
          style={[
            styles.navButton,
            { backgroundColor: colorScheme === 'dark' ? '#0A84FF' : '#007AFF' },
          ]}
          onPress={goToPreviousWeek}
        >
          <ThemedText style={styles.navButtonText}>Previous Week</ThemedText>
        </Pressable>
        <Pressable
          style={[
            styles.navButton,
            { backgroundColor: colorScheme === 'dark' ? '#0A84FF' : '#007AFF' },
          ]}
          onPress={goToNextWeek}
        >
          <ThemedText style={styles.navButtonText}>Next Week</ThemedText>
        </Pressable>
      </ThemedView>
      <ThemedText style={styles.occupancyText}>
        Number of booked beds this week: {weekOccupancy}/{maxOccupancy}
      </ThemedText>
      <ThemedText style={styles.occupancyText}>
        Number of booked beds today: {todayOccupancy}/{maxOccupancy}
      </ThemedText>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60, // Extra top padding for status bar and notch
  },
  weekRange: {
    fontSize: 18,
    marginVertical: 16,
  },
  navigation: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  navButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    flex: 1,
    marginHorizontal: 8,
  },
  navButtonText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  occupancyText: {
    fontSize: 16,
    marginVertical: 8,
  },
});