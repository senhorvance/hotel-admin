import { useState, useEffect } from 'react';
import { StyleSheet, TextInput, Pressable, ScrollView, Alert } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';

import BackButton from '@/components/BackButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import { createClient, getClientById, updateClient } from '@/hooks/db';

export default function ClientFormScreen() {
  const { clientId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const [form, setForm] = useState({
    first_name: '',
    last_name: '',
    email_address: '',
    phone_number: '',
    company_name: '',
    company_address: '',
    company_vat_number: '',
    company_website: '',
  });
  const [errors, setErrors] = useState({
    first_name: '',
    email_address: '',
  });

  useEffect(() => {
    if (clientId) {
      loadClient(Number(clientId));
    }
  }, [clientId]);

  const loadClient = async (id: number) => {
    try {
      const client = await getClientById(id);
      if (client) {
        setForm({
          first_name: client.first_name,
          last_name: client.last_name || '',
          email_address: client.email_address,
          phone_number: client.phone_number || '',
          company_name: client.company_name || '',
          company_address: client.company_address || '',
          company_vat_number: client.company_vat_number || '',
          company_website: client.company_website || '',
        });
        console.log('Client loaded:', client);
      }
    } catch (error) {
      console.error('Error loading client:', error);
      Alert.alert('Error', 'Failed to load client data.');
    }
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      first_name: '',
      email_address: '',
    };

    if (!form.first_name) {
      newErrors.first_name = 'First name is required';
      valid = false;
    }
    if (!form.email_address || !/\S+@\S+\.\S+/.test(form.email_address)) {
      newErrors.email_address = 'Valid email is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const clientData = {
        first_name: form.first_name,
        last_name: form.last_name || undefined,
        email_address: form.email_address,
        phone_number: form.phone_number || undefined,
        company_name: form.company_name || undefined,
        company_address: form.company_address || undefined,
        company_vat_number: form.company_vat_number || undefined,
        company_website: form.company_website || undefined,
      };
      console.log('Submitting client:', clientData);

      if (clientId) {
        await updateClient(Number(clientId), clientData);
      } else {
        await createClient(clientData);
      }
      console.log('Client saved, navigating to Clients');
      router.replace('/(tabs)/clients');
    } catch (error) {
      console.error('Error saving client:', error);
      Alert.alert('Error', 'Failed to save client. Please try again.');
    }
  };

  return (
    <ThemedView style={styles.container}>
      <BackButton />
      <ThemedText type="title">{clientId ? 'Edit Client' : 'New Client'}</ThemedText>
      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.scrollContent}
      >
        <ThemedText type="default">First Name *</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.first_name}
          onChangeText={(text) => setForm((prev) => ({ ...prev, first_name: text }))}
        />
        {errors.first_name && <ThemedText style={styles.error}>{errors.first_name}</ThemedText>}

        <ThemedText type="default">Last Name</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.last_name}
          onChangeText={(text) => setForm((prev) => ({ ...prev, last_name: text }))}
        />

        <ThemedText type="default">Email Address *</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.email_address}
          onChangeText={(text) => setForm((prev) => ({ ...prev, email_address: text }))}
          keyboardType="email-address"
        />
        {errors.email_address && <ThemedText style={styles.error}>{errors.email_address}</ThemedText>}

        <ThemedText type="default">Phone Number</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.phone_number}
          onChangeText={(text) => setForm((prev) => ({ ...prev, phone_number: text }))}
          keyboardType="phone-pad"
        />

        <ThemedText type="default">Company Name</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.company_name}
          onChangeText={(text) => setForm((prev) => ({ ...prev, company_name: text }))}
        />

        <ThemedText type="default">Company Address</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.company_address}
          onChangeText={(text) => setForm((prev) => ({ ...prev, company_address: text }))}
        />

        <ThemedText type="default">Company VAT Number</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.company_vat_number}
          onChangeText={(text) => setForm((prev) => ({ ...prev, company_vat_number: text }))}
        />

        <ThemedText type="default">Company Website</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.company_website}
          onChangeText={(text) => setForm((prev) => ({ ...prev, company_website: text }))}
          keyboardType="url"
        />

        <Pressable
          style={[
            styles.submitButton,
            { backgroundColor: colorScheme === 'dark' ? '#0A84FF' : '#007AFF' },
          ]}
          onPress={handleSubmit}
        >
          <ThemedText style={styles.submitText}>Save</ThemedText>
        </Pressable>
      </ScrollView>
    </ThemedView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    padding: 16,
    paddingTop: 100, // Increased for better spacing below status bar
  },
  form: {
    marginTop: 16,
  },
  scrollContent: {
    paddingBottom: 100,
  },
  input: {
    borderWidth: 1,
    borderRadius: 8,
    padding: 8,
    marginBottom: 8,
  },
  error: {
    color: 'red',
    marginBottom: 8,
  },
  submitButton: {
    padding: 12,
    borderRadius: 8,
    alignItems: 'center',
    marginTop: 16,
  },
  submitText: {
    color: '#F5F5F5',
    fontSize: 16,
  },
});