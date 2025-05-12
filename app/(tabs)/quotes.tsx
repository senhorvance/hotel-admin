import { useState } from 'react';
import { FlatList, Pressable, StyleSheet, TextInput, View } from 'react-native';
import { router, useFocusEffect } from 'expo-router';
import { useCallback } from 'react';

import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { IconSymbol } from '@/components/ui/IconSymbol';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { getQuotes, deleteQuote, invoiceQuote } from '@/hooks/db';

type QuoteItem = {
  quote_id: number;
  client_name: string;
  quote_number: string;
  last_modified: string;
  invoice_status: string;
};

export default function QuotesScreen() {
  const colorScheme = useColorScheme();
  const [quotes, setQuotes] = useState<QuoteItem[]>([]);
  const [search, setSearch] = useState('');

  const loadQuotes = async () => {
    try {
      const data = await getQuotes();
      console.log('Quotes loaded in QuotesScreen:', data);
      setQuotes(data);
    } catch (error) {
      console.error('Error loading quotes:', error);
    }
  };

  useFocusEffect(
    useCallback(() => {
      loadQuotes();
    }, [])
  );

  const filteredQuotes = quotes.filter(
    (quote) =>
      quote.client_name.toLowerCase().includes(search.toLowerCase()) ||
      quote.quote_number.toLowerCase().includes(search.toLowerCase())
  );

  const handleDelete = async (quoteId: number) => {
    try {
      await deleteQuote(quoteId);
      console.log('Quote deleted in QuotesScreen:', quoteId);
      loadQuotes();
    } catch (error) {
      console.error('Error deleting quote:', error);
    }
  };

  const handleInvoice = async (quoteId: number) => {
    try {
      await invoiceQuote(quoteId);
      console.log('Quote invoiced in QuotesScreen:', quoteId);
      loadQuotes();
    } catch (error) {
      console.error('Error invoicing quote:', error);
    }
  };

  return (
    <ThemedView style={styles.container}>
      <TextInput
        style={[styles.searchInput, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
        placeholder="Search quotes..."
        value={search}
        onChangeText={setSearch}
      />
      <Pressable
        style={[
          styles.createButton,
          { backgroundColor: colorScheme === 'dark' ? '#0A84FF' : '#007AFF' },
        ]}
        onPress={() => router.push('/(tabs)/quote-form')}
      >
        <ThemedText style={styles.createButtonText}>Create Quote</ThemedText>
      </Pressable>
      <FlatList
        data={filteredQuotes}
        keyExtractor={(item) => item.quote_id.toString()}
        renderItem={({ item }) => (
          <ThemedView style={styles.quoteItem}>
            <Pressable
              onPress={() =>
                router.push({
                  pathname: '/(tabs)/quote-form',
                  params: { quoteId: item.quote_id.toString() },
                })
              }
              style={styles.quoteInfo}
            >
              <ThemedText type="default">{item.client_name}</ThemedText>
              <ThemedText type="defaultSemiBold">Quote #{item.quote_number}</ThemedText>
              <ThemedText type="default">{new Date(item.last_modified).toLocaleDateString()}</ThemedText>
            </Pressable>
            <View style={styles.actions}>
              {item.invoice_status !== 'invoiced' && (
                <Pressable onPress={() => handleInvoice(item.quote_id)}>
                  <IconSymbol
                    name="creditcard"
                    size={24}
                    color={Colors[colorScheme ?? 'light'].tint}
                  />
                </Pressable>
              )}
            </View>
          </ThemedView>
        )}
        ListEmptyComponent={<ThemedText>No quotes found.</ThemedText>}
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
  quoteItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 12,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  quoteInfo: {
    flex: 1,
  },
  actions: {
    flexDirection: 'row',
    gap: 16,
  },
});