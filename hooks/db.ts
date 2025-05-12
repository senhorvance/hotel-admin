import * as SQLite from 'expo-sqlite';

const db = SQLite.openDatabaseSync('vance.db');

export interface Client {
  client_id: number;
  first_name: string;
  last_name: string | null;
  email_address: string;
  phone_number: string | null;
  company_name: string | null;
  company_address: string | null;
  company_vat_number: string | null;
  company_website: string | null;
  created_at: string;
  last_modified: string;
}

export interface Quote {
  quote_id: number;
  client_id: number;
  quote_number: string;
  number_of_beds: number;
  number_of_guests: number;
  unit_bed_cost: number;
  unit_breakfast_cost: number | null;
  unit_lunch_cost: number | null;
  unit_dinner_cost: number | null;
  unit_laundry_cost: number | null;
  guest_details: string | null;
  check_in_date: string;
  check_out_date: string;
  breakfast_dates: string | null;
  lunch_dates: string | null;
  dinner_dates: string | null;
  laundry_dates: string | null;
  discount_percentage: number | null;
  discount_amount: number | null;
  subtotal: number;
  vat: number;
  total: number;
  document_type: string;
  invoice_status: string;
  created_at: string;
  last_modified: string;
}

export const initDatabase = async () => {
  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    PRAGMA foreign_keys = ON;

    CREATE TABLE IF NOT EXISTS clients (
      client_id INTEGER PRIMARY KEY AUTOINCREMENT,
      first_name TEXT NOT NULL,
      last_name TEXT,
      email_address TEXT NOT NULL,
      phone_number TEXT,
      company_name TEXT,
      company_address TEXT,
      company_vat_number TEXT,
      company_website TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_modified TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS quotes (
      quote_id INTEGER PRIMARY KEY AUTOINCREMENT,
      client_id INTEGER NOT NULL,
      quote_number TEXT NOT NULL,
      number_of_beds INTEGER NOT NULL,
      number_of_guests INTEGER NOT NULL,
      unit_bed_cost REAL NOT NULL,
      unit_breakfast_cost REAL,
      unit_lunch_cost REAL,
      unit_dinner_cost REAL,
      unit_laundry_cost REAL,
      guest_details TEXT,
      check_in_date TEXT NOT NULL,
      check_out_date TEXT NOT NULL,
      breakfast_dates TEXT,
      lunch_dates TEXT,
      dinner_dates TEXT,
      laundry_dates TEXT,
      discount_percentage REAL,
      discount_amount REAL,
      subtotal REAL NOT NULL,
      vat REAL NOT NULL,
      total REAL NOT NULL,
      document_type TEXT DEFAULT 'detailed',
      invoice_status TEXT NOT NULL DEFAULT 'unpaid',
      created_at TEXT NOT NULL DEFAULT (datetime('now')),
      last_modified TEXT NOT NULL DEFAULT (datetime('now')),
      FOREIGN KEY (client_id) REFERENCES clients(client_id) ON DELETE RESTRICT
    );

    CREATE TABLE IF NOT EXISTS deleted_clients (
      client_id INTEGER,
      first_name TEXT,
      last_name TEXT,
      email_address TEXT,
      phone_number TEXT,
      company_name TEXT,
      company_address TEXT,
      company_vat_number TEXT,
      company_website TEXT,
      created_at TEXT,
      last_modified TEXT,
      deleted_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS deleted_quotes (
      quote_id INTEGER,
      client_id INTEGER,
      quote_number TEXT,
      number_of_beds INTEGER,
      number_of_guests INTEGER,
      unit_bed_cost REAL,
      unit_breakfast_cost REAL,
      unit_lunch_cost REAL,
      unit_dinner_cost REAL,
      unit_laundry_cost REAL,
      guest_details TEXT,
      check_in_date TEXT,
      check_out_date TEXT,
      breakfast_dates TEXT,
      lunch_dates TEXT,
      dinner_dates TEXT,
      laundry_dates TEXT,
      discount_percentage REAL,
      discount_amount REAL,
      subtotal REAL,
      vat REAL,
      total REAL,
      document_type TEXT,
      invoice_status TEXT,
      created_at TEXT,
      last_modified TEXT,
      deleted_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TRIGGER IF NOT EXISTS update_clients_last_modified
    AFTER UPDATE ON clients
    FOR EACH ROW
    BEGIN
      UPDATE clients SET last_modified = datetime('now') WHERE client_id = OLD.client_id;
    END;

    CREATE TRIGGER IF NOT EXISTS update_quotes_last_modified
    AFTER UPDATE ON quotes
    FOR EACH ROW
    BEGIN
      UPDATE quotes SET last_modified = datetime('now') WHERE quote_id = OLD.quote_id;
    END;

    CREATE TRIGGER IF NOT EXISTS log_deleted_clients
    AFTER DELETE ON clients
    FOR EACH ROW
    BEGIN
      INSERT INTO deleted_clients (
        client_id, first_name, last_name, email_address, phone_number,
        company_name, company_address, company_vat_number, company_website,
        created_at, last_modified
      ) VALUES (
        OLD.client_id, OLD.first_name, OLD.last_name, OLD.email_address, OLD.phone_number,
        OLD.company_name, OLD.company_address, OLD.company_vat_number, OLD.company_website,
        OLD.created_at, OLD.last_modified
      );
    END;

    CREATE TRIGGER IF NOT EXISTS log_deleted_quotes
    AFTER DELETE ON quotes
    FOR EACH ROW
    BEGIN
      INSERT INTO deleted_quotes (
        quote_id, client_id, quote_number, number_of_beds, number_of_guests,
        unit_bed_cost, unit_breakfast_cost, unit_lunch_cost, unit_dinner_cost,
        unit_laundry_cost, guest_details, check_in_date, check_out_date,
        breakfast_dates, lunch_dates, dinner_dates, laundry_dates,
        discount_percentage, discount_amount, subtotal, vat, total,
        document_type, invoice_status, created_at, last_modified
      ) VALUES (
        OLD.quote_id, OLD.client_id, OLD.quote_number, OLD.number_of_beds, OLD.number_of_guests,
        OLD.unit_bed_cost, OLD.unit_breakfast_cost, OLD.unit_lunch_cost, OLD.unit_dinner_cost,
        OLD.unit_laundry_cost, OLD.guest_details, OLD.check_in_date, OLD.check_out_date,
        OLD.breakfast_dates, OLD.lunch_dates, OLD.dinner_dates, OLD.laundry_dates,
        OLD.discount_percentage, OLD.discount_amount, OLD.subtotal, OLD.vat, OLD.total,
        OLD.document_type, OLD.invoice_status, OLD.created_at, OLD.last_modified
      );
    END;

    CREATE TABLE IF NOT EXISTS quote_number_sequence (
      last_number INTEGER NOT NULL DEFAULT 149
    );
    INSERT OR IGNORE INTO quote_number_sequence (last_number) VALUES (149);
  `);
  console.log('Database initialized');
};

export const getDb = () => db;

export const getClients = async (): Promise<Client[]> => {
  try {
    const clients = await db.getAllAsync('SELECT * FROM clients ORDER BY first_name, last_name');
    console.log('Clients retrieved:', clients);
    return clients;
  } catch (error) {
    console.error('Error retrieving clients:', error);
    throw error;
  }
};

export const getClientById = async (clientId: number): Promise<Client | null> => {
  try {
    const client = await db.getFirstAsync('SELECT * FROM clients WHERE client_id = ?', [clientId]);
    console.log('Client retrieved by ID:', clientId, client);
    return client;
  } catch (error) {
    console.error('Error retrieving client by ID:', error);
    throw error;
  }
};

export const createClient = async (client: {
  first_name: string;
  last_name?: string;
  email_address: string;
  phone_number?: string;
  company_name?: string;
  company_address?: string;
  company_vat_number?: string;
  company_website?: string;
}): Promise<void> => {
  try {
    await db.runAsync(
      `INSERT INTO clients (
        first_name, last_name, email_address, phone_number,
        company_name, company_address, company_vat_number, company_website
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        client.first_name,
        client.last_name || null,
        client.email_address,
        client.phone_number || null,
        client.company_name || null,
        client.company_address || null,
        client.company_vat_number || null,
        client.company_website || null,
      ]
    );
    console.log('Client created:', client);
  } catch (error) {
    console.error('Error creating client:', error);
    throw error;
  }
};

export const updateClient = async (
  clientId: number,
  client: {
    first_name: string;
    last_name?: string;
    email_address: string;
    phone_number?: string;
    company_name?: string;
    company_address?: string;
    company_vat_number?: string;
    company_website?: string;
  }
): Promise<void> => {
  try {
    await db.runAsync(
      `UPDATE clients SET
        first_name = ?,
        last_name = ?,
        email_address = ?,
        phone_number = ?,
        company_name = ?,
        company_address = ?,
        company_vat_number = ?,
        company_website = ?
      WHERE client_id = ?`,
      [
        client.first_name,
        client.last_name || null,
        client.email_address,
        client.phone_number || null,
        client.company_name || null,
        client.company_address || null,
        client.company_vat_number || null,
        client.company_website || null,
        clientId,
      ]
    );
    console.log('Client updated:', clientId);
  } catch (error) {
    console.error('Error updating client:', error);
    throw error;
  }
};

export const deleteClient = async (clientId: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM clients WHERE client_id = ?', [clientId]);
    console.log('Client deleted:', clientId);
  } catch (error) {
    console.error('Error deleting client:', error);
    throw error;
  }
};

export const getQuotes = async (): Promise<(Quote & { client_name: string })[]> => {
  try {
    const quotes = await db.getAllAsync(`
      SELECT q.*, c.first_name || ' ' || coalesce(c.last_name, '') AS client_name
      FROM quotes q
      LEFT JOIN clients c ON q.client_id = c.client_id
      WHERE q.invoice_status != 'invoiced'
      ORDER BY q.last_modified DESC
    `);
    console.log('Quotes retrieved:', quotes);
    return quotes;
  } catch (error) {
    console.error('Error retrieving quotes:', error);
    throw error;
  }
};

export const getInvoices = async (): Promise<(Quote & { client_name: string })[]> => {
  try {
    const invoices = await db.getAllAsync(`
      SELECT q.*, c.first_name || ' ' || coalesce(c.last_name, '') AS client_name
      FROM quotes q
      LEFT JOIN clients c ON q.client_id = c.client_id
      WHERE q.invoice_status = 'invoiced'
      ORDER BY q.last_modified DESC
    `);
    console.log('Invoices retrieved:', invoices);
    return invoices;
  } catch (error) {
    console.error('Error retrieving invoices:', error);
    throw error;
  }
};

export const getQuoteById = async (quoteId: number): Promise<Quote | null> => {
  try {
    const quote = await db.getFirstAsync('SELECT * FROM quotes WHERE quote_id = ?', [quoteId]);
    console.log('Quote retrieved by ID:', quoteId, quote);
    return quote;
  } catch (error) {
    console.error('Error retrieving quote by ID:', error);
    throw error;
  }
};

export const getLatestQuoteForClient = async (clientId: number): Promise<Quote | null> => {
  try {
    const quote = await db.getFirstAsync(
      'SELECT * FROM quotes WHERE client_id = ? ORDER BY created_at DESC LIMIT 1',
      [clientId]
    );
    console.log('Latest quote for client:', clientId, quote);
    return quote;
  } catch (error) {
    console.error('Error retrieving latest quote:', error);
    throw error;
  }
};

export const createQuote = async (quote: {
  client_id: number;
  quote_number: string;
  number_of_beds: number;
  number_of_guests: number;
  unit_bed_cost: number;
  unit_breakfast_cost?: number;
  unit_lunch_cost?: number;
  unit_dinner_cost?: number;
  unit_laundry_cost?: number;
  guest_details?: string;
  check_in_date: string;
  check_out_date: string;
  breakfast_dates?: string;
  lunch_dates?: string;
  dinner_dates?: string;
  laundry_dates?: string;
  discount_percentage?: number;
  discount_amount?: number;
  subtotal: number;
  vat: number;
  total: number;
  document_type?: string;
  invoice_status?: string;
}): Promise<void> => {
  try {
    await db.runAsync(
      `INSERT INTO quotes (
        client_id, quote_number, number_of_beds, number_of_guests,
        unit_bed_cost, unit_breakfast_cost, unit_lunch_cost, unit_dinner_cost,
        unit_laundry_cost, guest_details, check_in_date, check_out_date,
        breakfast_dates, lunch_dates, dinner_dates, laundry_dates,
        discount_percentage, discount_amount, subtotal, vat, total,
        document_type, invoice_status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        quote.client_id,
        quote.quote_number,
        quote.number_of_beds,
        quote.number_of_guests,
        quote.unit_bed_cost,
        quote.unit_breakfast_cost || null,
        quote.unit_lunch_cost || null,
        quote.unit_dinner_cost || null,
        quote.unit_laundry_cost || null,
        quote.guest_details || null,
        quote.check_in_date,
        quote.check_out_date,
        quote.breakfast_dates || null,
        quote.lunch_dates || null,
        quote.dinner_dates || null,
        quote.laundry_dates || null,
        quote.discount_percentage || null,
        quote.discount_amount || null,
        quote.subtotal,
        quote.vat,
        quote.total,
        quote.document_type || 'detailed',
        quote.invoice_status || 'unpaid',
      ]
    );
    console.log('Quote created:', quote);
  } catch (error) {
    console.error('Error creating quote:', error);
    throw error;
  }
};

export const updateQuote = async (
  quoteId: number,
  quote: {
    client_id: number;
    quote_number: string;
    number_of_beds: number;
    number_of_guests: number;
    unit_bed_cost: number;
    unit_breakfast_cost?: number;
    unit_lunch_cost?: number;
    unit_dinner_cost?: number;
    unit_laundry_cost?: number;
    guest_details?: string;
    check_in_date: string;
    check_out_date: string;
    breakfast_dates?: string;
    lunch_dates?: string;
    dinner_dates?: string;
    laundry_dates?: string;
    discount_percentage?: number;
    discount_amount?: number;
    subtotal: number;
    vat: number;
    total: number;
    document_type?: string;
    invoice_status?: string;
  }
): Promise<void> => {
  try {
    await db.runAsync(
      `UPDATE quotes SET
        client_id = ?,
        quote_number = ?,
        number_of_beds = ?,
        number_of_guests = ?,
        unit_bed_cost = ?,
        unit_breakfast_cost = ?,
        unit_lunch_cost = ?,
        unit_dinner_cost = ?,
        unit_laundry_cost = ?,
        guest_details = ?,
        check_in_date = ?,
        check_out_date = ?,
        breakfast_dates = ?,
        lunch_dates = ?,
        dinner_dates = ?,
        laundry_dates = ?,
        discount_percentage = ?,
        discount_amount = ?,
        subtotal = ?,
        vat = ?,
        total = ?,
        document_type = ?,
        invoice_status = ?
      WHERE quote_id = ?`,
      [
        quote.client_id,
        quote.quote_number,
        quote.number_of_beds,
        quote.number_of_guests,
        quote.unit_bed_cost,
        quote.unit_breakfast_cost || null,
        quote.unit_lunch_cost || null,
        quote.unit_dinner_cost || null,
        quote.unit_laundry_cost || null,
        quote.guest_details || null,
        quote.check_in_date,
        quote.check_out_date,
        quote.breakfast_dates || null,
        quote.lunch_dates || null,
        quote.dinner_dates || null,
        quote.laundry_dates || null,
        quote.discount_percentage || null,
        quote.discount_amount || null,
        quote.subtotal,
        quote.vat,
        quote.total,
        quote.document_type || 'detailed',
        quote.invoice_status || 'unpaid',
        quoteId,
      ]
    );
    console.log('Quote updated:', quoteId);
  } catch (error) {
    console.error('Error updating quote:', error);
    throw error;
  }
};

export const deleteQuote = async (quoteId: number): Promise<void> => {
  try {
    await db.runAsync('DELETE FROM quotes WHERE quote_id = ?', [quoteId]);
    console.log('Quote deleted:', quoteId);
  } catch (error) {
    console.error('Error deleting quote:', error);
    throw error;
  }
};

export const invoiceQuote = async (quoteId: number): Promise<void> => {
  try {
    await db.runAsync(
      "UPDATE quotes SET invoice_status = 'invoiced', last_modified = datetime('now') WHERE quote_id = ?",
      [quoteId]
    );
    console.log('Quote invoiced:', quoteId);
  } catch (error) {
    console.error('Error invoicing quote:', error);
    throw error;
  }
};

export const generateQuoteNumber = async (): Promise<string> => {
  try {
    await db.runAsync(
      'UPDATE quote_number_sequence SET last_number = last_number + 1'
    );
    const result = await db.getFirstAsync<{ last_number: number }>(
      'SELECT last_number FROM quote_number_sequence'
    );
    if (!result) {
      throw new Error('Failed to retrieve last_number');
    }
    console.log('Generated quote number:', result.last_number);
    return result.last_number.toString().padStart(3, '0');
  } catch (error) {
    console.error('Error generating quote number:', error);
    throw error;
  }
};