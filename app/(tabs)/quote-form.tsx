import { useState, useEffect } from 'react';
import {
  StyleSheet,
  TextInput,
  Pressable,
  ScrollView,
  View,
  Alert,
  Switch,
} from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import DateTimePickerModal from 'react-native-modal-datetime-picker';
import * as FileSystem from 'expo-file-system';
import { Picker } from '@react-native-picker/picker';

import BackButton from '@/components/BackButton';
import { ThemedText } from '@/components/ThemedText';
import { ThemedView } from '@/components/ThemedView';
import { Colors } from '@/constants/Colors';
import { useColorScheme } from '@/hooks/useColorScheme';
import {
  createQuote,
  getQuoteById,
  updateQuote,
  getClients,
  getLatestQuoteForClient,
  generateQuoteNumber,
} from '@/hooks/db';

export default function QuoteFormScreen() {
  const { quoteId } = useLocalSearchParams();
  const colorScheme = useColorScheme();
  const [form, setForm] = useState({
    client_id: 0,
    quote_number: '',
    number_of_beds: '',
    number_of_guests: '',
    unit_bed_cost: '',
    unit_breakfast_cost: '',
    unit_lunch_cost: '',
    unit_dinner_cost: '',
    unit_laundry_cost: '',
    guest_details: '',
    check_in_date: new Date().toISOString().split('T')[0],
    check_out_date: new Date().toISOString().split('T')[0],
    breakfast_dates: [] as string[],
    lunch_dates: [] as string[],
    dinner_dates: [] as string[],
    laundry_dates: [] as string[],
    discount_percentage: '',
    discount_amount: '',
    subtotal: 0,
    vat: 0,
    total: 0,
    document_type: 'detailed',
    invoice_status: 'unpaid',
    attached_files: [] as string[],
  });
  const [clients, setClients] = useState<any[]>([]);
  const [errors, setErrors] = useState({
    client_id: '',
    number_of_beds: '',
    number_of_guests: '',
    unit_bed_cost: '',
    check_in_date: '',
    check_out_date: '',
  });
  const [showDatePicker, setShowDatePicker] = useState({
    check_in: false,
    check_out: false,
    breakfast: false,
    lunch: false,
    dinner: false,
    laundry: false,
  });
  const [isDiscountPercentage, setIsDiscountPercentage] = useState(true);

  useEffect(() => {
    loadClients();
    if (quoteId) {
      loadQuote(Number(quoteId));
    } else {
      generateNewQuoteNumber();
    }
  }, [quoteId]);

  const loadClients = async () => {
    try {
      const data = await getClients();
      setClients(data);
      console.log('Clients loaded for quote form:', data);
    } catch (error) {
      console.error('Error loading clients:', error);
    }
  };

  const loadQuote = async (id: number) => {
    try {
      const quote = await getQuoteById(id);
      if (quote) {
        setForm({
          client_id: quote.client_id,
          quote_number: quote.quote_number,
          number_of_beds: quote.number_of_beds.toString(),
          number_of_guests: quote.number_of_guests.toString(),
          unit_bed_cost: quote.unit_bed_cost.toString(),
          unit_breakfast_cost: quote.unit_breakfast_cost?.toString() || '',
          unit_lunch_cost: quote.unit_lunch_cost?.toString() || '',
          unit_dinner_cost: quote.unit_dinner_cost?.toString() || '',
          unit_laundry_cost: quote.unit_laundry_cost?.toString() || '',
          guest_details: quote.guest_details || '',
          check_in_date: quote.check_in_date,
          check_out_date: quote.check_out_date,
          breakfast_dates: quote.breakfast_dates ? JSON.parse(quote.breakfast_dates) : [],
          lunch_dates: quote.lunch_dates ? JSON.parse(quote.lunch_dates) : [],
          dinner_dates: quote.dinner_dates ? JSON.parse(quote.dinner_dates) : [],
          laundry_dates: quote.laundry_dates ? JSON.parse(quote.laundry_dates) : [],
          discount_percentage: quote.discount_percentage?.toString() || '',
          discount_amount: quote.discount_amount?.toString() || '',
          subtotal: quote.subtotal,
          vat: quote.vat,
          total: quote.total,
          document_type: quote.document_type,
          invoice_status: quote.invoice_status,
          attached_files: [],
        });
        console.log('Quote loaded:', quote);
      }
    } catch (error) {
      console.error('Error loading quote:', error);
      Alert.alert('Error', 'Failed to load quote data.');
    }
  };

  const generateNewQuoteNumber = async () => {
    try {
      const number = await generateQuoteNumber();
      setForm((prev) => ({ ...prev, quote_number: number }));
      console.log('New quote number set:', number);
    } catch (error) {
      console.error('Error generating quote number:', error);
    }
  };

  const preloadClientCosts = async (clientId: number) => {
    try {
      const latestQuote = await getLatestQuoteForClient(clientId);
      if (latestQuote) {
        setForm((prev) => ({
          ...prev,
          unit_bed_cost: latestQuote.unit_bed_cost.toString(),
          unit_breakfast_cost: latestQuote.unit_breakfast_cost?.toString() || '',
          unit_lunch_cost: latestQuote.unit_lunch_cost?.toString() || '',
          unit_dinner_cost: latestQuote.unit_dinner_cost?.toString() || '',
          unit_laundry_cost: latestQuote.unit_laundry_cost?.toString() || '',
        }));
        console.log('Client costs preloaded:', latestQuote);
      }
    } catch (error) {
      console.error('Error preloading client costs:', error);
    }
  };

  const calculateTotals = () => {
    const beds = parseInt(form.number_of_beds) || 0;
    const guests = parseInt(form.number_of_guests) || 0;
    const bedCost = parseFloat(form.unit_bed_cost) || 0;
    const breakfastCost = parseFloat(form.unit_breakfast_cost) || 0;
    const lunchCost = parseFloat(form.unit_lunch_cost) || 0;
    const dinnerCost = parseFloat(form.unit_dinner_cost) || 0;
    const laundryCost = parseFloat(form.unit_laundry_cost) || 0;

    const checkIn = new Date(form.check_in_date);
    const checkOut = new Date(form.check_out_date);
    const nights = Math.ceil((checkOut.getTime() - checkIn.getTime()) / (1000 * 60 * 60 * 24));

    const breakfastDays = form.breakfast_dates.length;
    const lunchDays = form.lunch_dates.length;
    const dinnerDays = form.dinner_dates.length;
    const laundryDays = form.laundry_dates.length;

    const bedTotal = beds * nights * bedCost;
    const breakfastTotal = guests * breakfastDays * breakfastCost;
    const lunchTotal = guests * lunchDays * lunchCost;
    const dinnerTotal = guests * dinnerDays * dinnerCost;
    const laundryTotal = guests * laundryDays * laundryCost;

    let subtotal = bedTotal + breakfastTotal + lunchTotal + dinnerTotal + laundryTotal;
    subtotal = parseFloat(subtotal.toFixed(2));

    const vat = subtotal * 0.15;
    let total = subtotal + vat;

    if (isDiscountPercentage) {
      const discount = parseFloat(form.discount_percentage) || 0;
      total -= (subtotal * discount) / 100;
    } else {
      const discount = parseFloat(form.discount_amount) || 0;
      total -= discount;
    }

    total = parseFloat(total.toFixed(2));

    setForm((prev) => ({ ...prev, subtotal, vat, total }));
  };

  const validateForm = () => {
    let valid = true;
    const newErrors = {
      client_id: '',
      number_of_beds: '',
      number_of_guests: '',
      unit_bed_cost: '',
      check_in_date: '',
      check_out_date: '',
    };

    if (!form.client_id) {
      newErrors.client_id = 'Client is required';
      valid = false;
    }
    if (!form.number_of_beds || parseInt(form.number_of_beds) <= 0) {
      newErrors.number_of_beds = 'Number of beds is required';
      valid = false;
    }
    if (!form.number_of_guests || parseInt(form.number_of_guests) <= 0) {
      newErrors.number_of_guests = 'Number of guests is required';
      valid = false;
    }
    if (!form.unit_bed_cost || parseFloat(form.unit_bed_cost) <= 0) {
      newErrors.unit_bed_cost = 'Bed cost is required';
      valid = false;
    }
    if (!form.check_in_date) {
      newErrors.check_in_date = 'Check-in date is required';
      valid = false;
    }
    if (!form.check_out_date) {
      newErrors.check_out_date = 'Check-out date is required';
      valid = false;
    }

    setErrors(newErrors);
    return valid;
  };

  const handleSubmit = async () => {
    if (!validateForm()) return;

    try {
      const quoteData = {
        client_id: form.client_id,
        quote_number: form.quote_number,
        number_of_beds: parseInt(form.number_of_beds),
        number_of_guests: parseInt(form.number_of_guests),
        unit_bed_cost: parseFloat(form.unit_bed_cost),
        unit_breakfast_cost: form.unit_breakfast_cost ? parseFloat(form.unit_breakfast_cost) : undefined,
        unit_lunch_cost: form.unit_lunch_cost ? parseFloat(form.unit_lunch_cost) : undefined,
        unit_dinner_cost: form.unit_dinner_cost ? parseFloat(form.unit_dinner_cost) : undefined,
        unit_laundry_cost: form.unit_laundry_cost ? parseFloat(form.unit_laundry_cost) : undefined,
        guest_details: form.guest_details || undefined,
        check_in_date: form.check_in_date,
        check_out_date: form.check_out_date,
        breakfast_dates: form.breakfast_dates.length ? JSON.stringify(form.breakfast_dates) : undefined,
        lunch_dates: form.lunch_dates.length ? JSON.stringify(form.lunch_dates) : undefined,
        dinner_dates: form.dinner_dates.length ? JSON.stringify(form.dinner_dates) : undefined,
        laundry_dates: form.laundry_dates.length ? JSON.stringify(form.laundry_dates) : undefined,
        discount_percentage: form.discount_percentage ? parseFloat(form.discount_percentage) : undefined,
        discount_amount: form.discount_amount ? parseFloat(form.discount_amount) : undefined,
        subtotal: form.subtotal,
        vat: form.vat,
        total: form.total,
        document_type: form.document_type,
        invoice_status: form.invoice_status,
      };
      console.log('Submitting quote:', quoteData);

      if (quoteId) {
        await updateQuote(Number(quoteId), quoteData);
      } else {
        await createQuote(quoteData);
      }
      console.log('Quote saved, navigating to Quotes');
      router.replace('/(tabs)/quotes');
    } catch (error) {
      console.error('Error saving quote:', error);
      Alert.alert('Error', 'Failed to save quote. Please try again.');
    }
  };

  const handleFileAttach = async () => {
    Alert.alert('Info', 'File attachment not implemented yet.');
  };

  const handleDateConfirm = (date: Date, field: keyof typeof showDatePicker) => {
    const dateStr = date.toISOString().split('T')[0];
    if (field === 'check_in' || field === 'check_out') {
      setForm((prev) => ({ ...prev, [`${field}_date`]: dateStr }));
    } else {
      const fieldName = `${field}_dates` as keyof typeof form;
      setForm((prev) => ({
        ...prev,
        [fieldName]: [...(prev[fieldName] as string[]), dateStr].sort(),
      }));
    }
    setShowDatePicker((prev) => ({ ...prev, [field]: false }));
    calculateTotals();
  };

  return (
    <ThemedView style={styles.container}>
      <BackButton destination="/(tabs)/quotes" />
      <ThemedText type="title">{quoteId ? 'Edit Quote' : 'New Quote'}</ThemedText>
      <ScrollView
        style={styles.form}
        contentContainerStyle={styles.scrollContent}
      >
        <ThemedText type="default">Client *</ThemedText>
        <Picker
          selectedValue={form.client_id}
          onValueChange={(value) => {
            setForm((prev) => ({ ...prev, client_id: value }));
            preloadClientCosts(value);
            calculateTotals();
          }}
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
        >
          <Picker.Item label="Select a client" value={0} />
          {clients.map((client) => (
            <Picker.Item
              key={client.client_id}
              label={`${client.first_name} ${client.last_name || ''}`}
              value={client.client_id}
            />
          ))}
        </Picker>
        {errors.client_id && <ThemedText style={styles.error}>{errors.client_id}</ThemedText>}

        <ThemedText type="default">Quote Number</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.quote_number}
          editable={false}
        />

        <ThemedText type="default">Number of Beds *</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.number_of_beds}
          onChangeText={(text) => {
            setForm((prev) => ({ ...prev, number_of_beds: text }));
            calculateTotals();
          }}
          keyboardType="numeric"
        />
        {errors.number_of_beds && <ThemedText style={styles.error}>{errors.number_of_beds}</ThemedText>}

        <ThemedText type="default">Number of Guests *</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.number_of_guests}
          onChangeText={(text) => {
            setForm((prev) => ({ ...prev, number_of_guests: text }));
            calculateTotals();
          }}
          keyboardType="numeric"
        />
        {errors.number_of_guests && <ThemedText style={styles.error}>{errors.number_of_guests}</ThemedText>}

        <ThemedText type="default">Bed Cost (R) *</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.unit_bed_cost}
          onChangeText={(text) => {
            setForm((prev) => ({ ...prev, unit_bed_cost: text }));
            calculateTotals();
          }}
          keyboardType="decimal-pad"
        />
        {errors.unit_bed_cost && <ThemedText style={styles.error}>{errors.unit_bed_cost}</ThemedText>}

        <ThemedText type="default">Breakfast Cost (R)</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.unit_breakfast_cost}
          onChangeText={(text) => {
            setForm((prev) => ({ ...prev, unit_breakfast_cost: text }));
            calculateTotals();
          }}
          keyboardType="decimal-pad"
        />

        <ThemedText type="default">Lunch Cost (R)</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.unit_lunch_cost}
          onChangeText={(text) => {
            setForm((prev) => ({ ...prev, unit_lunch_cost: text }));
            calculateTotals();
          }}
          keyboardType="decimal-pad"
        />

        <ThemedText type="default">Dinner Cost (R)</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.unit_dinner_cost}
          onChangeText={(text) => {
            setForm((prev) => ({ ...prev, unit_dinner_cost: text }));
            calculateTotals();
          }}
          keyboardType="decimal-pad"
        />

        <ThemedText type="default">Laundry Cost (R)</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.unit_laundry_cost}
          onChangeText={(text) => {
            setForm((prev) => ({ ...prev, unit_laundry_cost: text }));
            calculateTotals();
          }}
          keyboardType="decimal-pad"
        />

        <ThemedText type="default">Guest Details</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint, height: 100 }]}
          value={form.guest_details}
          onChangeText={(text) => setForm((prev) => ({ ...prev, guest_details: text }))}
          multiline
        />

        <ThemedText type="default">Check-in Date *</ThemedText>
        <Pressable
          onPress={() => setShowDatePicker((prev) => ({ ...prev, check_in: true }))}
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
        >
          <ThemedText>{form.check_in_date}</ThemedText>
        </Pressable>
        <DateTimePickerModal
          isVisible={showDatePicker.check_in}
          mode="date"
          onConfirm={(date) => handleDateConfirm(date, 'check_in')}
          onCancel={() => setShowDatePicker((prev) => ({ ...prev, check_in: false }))}
        />
        {errors.check_in_date && <ThemedText style={styles.error}>{errors.check_in_date}</ThemedText>}

        <ThemedText type="default">Check-out Date *</ThemedText>
        <Pressable
          onPress={() => setShowDatePicker((prev) => ({ ...prev, check_out: true }))}
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
        >
          <ThemedText>{form.check_out_date}</ThemedText>
        </Pressable>
        <DateTimePickerModal
          isVisible={showDatePicker.check_out}
          mode="date"
          onConfirm={(date) => handleDateConfirm(date, 'check_out')}
          onCancel={() => setShowDatePicker((prev) => ({ ...prev, check_out: false }))}
        />
        {errors.check_out_date && <ThemedText style={styles.error}>{errors.check_out_date}</ThemedText>}

        <ThemedText type="default">Breakfast Dates</ThemedText>
        <Pressable
          onPress={() => setShowDatePicker((prev) => ({ ...prev, breakfast: true }))}
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
        >
          <ThemedText>{form.breakfast_dates.join(', ') || 'Select dates'}</ThemedText>
        </Pressable>
        <DateTimePickerModal
          isVisible={showDatePicker.breakfast}
          mode="date"
          onConfirm={(date) => handleDateConfirm(date, 'breakfast')}
          onCancel={() => setShowDatePicker((prev) => ({ ...prev, breakfast: false }))}
        />

        <ThemedText type="default">Lunch Dates</ThemedText>
        <Pressable
          onPress={() => setShowDatePicker((prev) => ({ ...prev, lunch: true }))}
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
        >
          <ThemedText>{form.lunch_dates.join(', ') || 'Select dates'}</ThemedText>
        </Pressable>
        <DateTimePickerModal
          isVisible={showDatePicker.lunch}
          mode="date"
          onConfirm={(date) => handleDateConfirm(date, 'lunch')}
          onCancel={() => setShowDatePicker((prev) => ({ ...prev, lunch: false }))}
        />

        <ThemedText type="default">Dinner Dates</ThemedText>
        <Pressable
          onPress={() => setShowDatePicker((prev) => ({ ...prev, dinner: true }))}
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
        >
          <ThemedText>{form.dinner_dates.join(', ') || 'Select dates'}</ThemedText>
        </Pressable>
        <DateTimePickerModal
          isVisible={showDatePicker.dinner}
          mode="date"
          onConfirm={(date) => handleDateConfirm(date, 'dinner')}
          onCancel={() => setShowDatePicker((prev) => ({ ...prev, dinner: false }))}
        />

        <ThemedText type="default">Laundry Dates</ThemedText>
        <Pressable
          onPress={() => setShowDatePicker((prev) => ({ ...prev, laundry: true }))}
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
        >
          <ThemedText>{form.laundry_dates.join(', ') || 'Select dates'}</ThemedText>
        </Pressable>
        <DateTimePickerModal
          isVisible={showDatePicker.laundry}
          mode="date"
          onConfirm={(date) => handleDateConfirm(date, 'laundry')}
          onCancel={() => setShowDatePicker((prev) => ({ ...prev, laundry: false }))}
        />

        <ThemedText type="default">Discount Type</ThemedText>
        <View style={styles.switchContainer}>
          <ThemedText>Percentage</ThemedText>
          <Switch
            value={isDiscountPercentage}
            onValueChange={(value) => {
              setIsDiscountPercentage(value);
              calculateTotals();
            }}
          />
          <ThemedText>Amount</ThemedText>
        </View>

        <ThemedText type="default">{isDiscountPercentage ? 'Discount (%)' : 'Discount (R)'}</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={isDiscountPercentage ? form.discount_percentage : form.discount_amount}
          onChangeText={(text) => {
            setForm((prev) => ({
              ...prev,
              [isDiscountPercentage ? 'discount_percentage' : 'discount_amount']: text,
            }));
            calculateTotals();
          }}
          keyboardType="decimal-pad"
        />

        <ThemedText type="default">Subtotal (R)</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.subtotal.toFixed(2)}
          editable={false}
        />

        <ThemedText type="default">VAT (15%) (R)</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.vat.toFixed(2)}
          editable={false}
        />

        <ThemedText type="default">Total (R)</ThemedText>
        <TextInput
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          value={form.total.toFixed(2)}
          editable={false}
        />

        <ThemedText type="default">Document Type</ThemedText>
        <Picker
          selectedValue={form.document_type}
          onValueChange={(value) => setForm((prev) => ({ ...prev, document_type: value }))}
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
        >
          <Picker.Item label="Detailed" value="detailed" />
          <Picker.Item label="Summarized" value="summarized" />
        </Picker>

        <ThemedText type="default">Attach Files</ThemedText>
        <Pressable
          style={[styles.input, { borderColor: Colors[colorScheme ?? 'light'].tint }]}
          onPress={handleFileAttach}
        >
          <ThemedText>{form.attached_files.length ? form.attached_files.join(', ') : 'No files attached'}</ThemedText>
        </Pressable>

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
  switchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 8,
  },
});