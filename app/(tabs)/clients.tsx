import { useState, useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getClients, deleteClient } from '@/hooks/db';

type ClientItem = {
  client_id: number;
  first_name: string;
  last_name: string | null;
  email_address: string;
};

export default function ClientsScreen() {
  const colorScheme = useColorScheme();
  const [clients, setClients] = useState<ClientItem[]>([]);
  const [search, setSearch] = useState('');

  const loadClients = async () => {
    try {
      const data = await getClients();
      console.log('Clients loaded in ClientsScreen:', data);
      setClients(data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadClients();
    }, [])
  );

  const filteredClients = clients.filter(
    (client) =>
      client.first_name.toLowerCase().includes(search.toLowerCase()) ||
      (client.last_name && client.last_name.toLowerCase().includes(search.toLowerCase())) ||
      client.email_address.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (clientId: number) => {
    try {
      await deleteClient(clientId);
      console.log('Client deleted in ClientsScreen:', clientId);
      loadClients();
    } catch (error) {
      console.error('Error deleting client:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TextInput
        style={[styles.searchInput, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
        placeholder="Search clients..."
        value={search}
        onChangeText={setSearch}
      />
      <Pressable
        style={[
          styles.createButton,
          { backgroundColor: colorScheme === 'dark' ? '#0A84FF' : '#007AFF' },
        ]}
        onPress={() => router.push('/(tabs)/client-form')}
      >
        <ThemedText style={styles.createButtonText}>Create Client</ThemedText>
      </Pressable>
      <FlatList
        data={filteredClients}
        keyExtractor={(item) => item.client_id.toString()}
        renderItem={({ item }) => (
          <ThemedView style={styles.clientItem}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/client-form',
                  params: { clientId: item.client_id.toString() },
                })
              }
              style={styles.clientInfo}
            >
              <ThemedText type="default">{`${item.first_name} ${item.last_name || ''}`}</ThemedText>
              <ThemedText type="default">{item.email_address}</ThemedText>
            </Pressable>
            <View style={styles.actions}>
              <Pressable onPress={() => handleDelete(item.client_id)}>
                <IconSymbol
                  name="trash"
                  size={24}
                  color={Colors[colorScheme ?? 'light'].tint}
                />
              </Pressable>
            </View>
          </ThemedView>
        )}
        ListEmptyComponent={<ThemedText>No clients found.</ThemedText>}
      />
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 60,
  },
  searchInput: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 16,
  },
  createButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginBottom: 16,
  },
  createButtonText: {
    color: '#F5F5F5',
    fontSize: 16,
    fontWeight: 'bold',
  },
  clientItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  clientInfo: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
});