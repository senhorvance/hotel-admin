import { useState, useEffect } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getInvoices, deleteQuote } from '@/hooks/db';

type InvoiceItem = {
  quote_id: number;
  client_name: string;
  quote_number: string;
  last_modified: string;
  invoice_status: string;
};

export default function InvoicesScreen() {
  const colorScheme = useColorScheme();
  const [invoices, setInvoices] = useState<InvoiceItem[]>([]);
  const [search, setSearch] = useState('');

  const loadInvoices = async () => {
    try {
      const data = await getInvoices();
      console.log('Invoices loaded in InvoicesScreen:', data);
      setInvoices(data);
    } catch (error) {
      console.error('Error loading invoices:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadInvoices();
    }, [])
  );

  const filteredInvoices = invoices.filter(
    (invoice) =>
      invoice.client_name.toLowerCase().includes(search.toLowerCase()) ||
      invoice.quote_number.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (quoteId: number) => {
    try {
      await deleteQuote(quoteId);
      console.log('Invoice deleted in InvoicesScreen:', quoteId);
      loadInvoices();
    } catch (error) {
      console.error('Error deleting invoice:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TextInput
        style={[styles.searchInput, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
        placeholder="Search invoices..."
        value={search}
        onChangeText={setSearch}
      />
      <FlatList
        data={filteredInvoices}
        keyExtractor={(item) => item.quote_id.toString()}
        renderItem={({ item }) => (
          <ThemedView style={styles.invoiceItem}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/quote-form',
                  params: { quoteId: item.quote_id.toString() },
                })
              }
              style={styles.invoiceInfo}
            >
              <ThemedText type="default">{item.client_name}</ThemedText>
              <ThemedText type="defaultSemiBold">Invoice #{item.quote_number}</ThemedText>
              <ThemedText type="default">{new Date(item.last_modified).toLocaleDateString()}</ThemedText>
            </Pressable>
            <View style={styles.actions}>
              <Pressable onPress={() => handleDelete(item.quote_id)}>
                <IconSymbol
                  name="trash"
                  size={24}
                  color={Colors[colorScheme ?? 'light'].tint}
                />
              </Pressable>
            </View>
          </ThemedView>
        )}
        ListEmptyComponent={<ThemedText>No invoices found.</ThemedText>}
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
  invoiceItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  invoiceInfo: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
});