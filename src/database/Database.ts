import sqlite3 from 'sqlite3';
import { Contact, CreateContactData, LinkPrecedence } from '../models/Contact';

export class Database {
  private db: sqlite3.Database;

  constructor(dbPath: string = ':memory:') {
    this.db = new sqlite3.Database(dbPath);
    this.initializeDatabase();
  }

  private initializeDatabase(): void {
    const createTableQuery = `
      CREATE TABLE IF NOT EXISTS contacts (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        phoneNumber TEXT,
        email TEXT,
        linkedId INTEGER,
        linkPrecedence TEXT NOT NULL CHECK (linkPrecedence IN ('primary', 'secondary')),
        createdAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        updatedAt DATETIME DEFAULT CURRENT_TIMESTAMP,
        deletedAt DATETIME,
        FOREIGN KEY (linkedId) REFERENCES contacts(id)
      )
    `;

    const createIndexes = `
      CREATE INDEX IF NOT EXISTS idx_contacts_email ON contacts(email);
      CREATE INDEX IF NOT EXISTS idx_contacts_phoneNumber ON contacts(phoneNumber);
      CREATE INDEX IF NOT EXISTS idx_contacts_linkedId ON contacts(linkedId);
      CREATE INDEX IF NOT EXISTS idx_contacts_deletedAt ON contacts(deletedAt);
    `;

    this.db.exec(createTableQuery + '; ' + createIndexes);
  }

  public createContact(contactData: CreateContactData): Promise<Contact> {
    return new Promise((resolve, reject) => {
      const query = `
        INSERT INTO contacts (phoneNumber, email, linkedId, linkPrecedence, createdAt, updatedAt)
        VALUES (?, ?, ?, ?, datetime('now'), datetime('now'))
      `;

      const self = this;
      this.db.run(
        query,
        [contactData.phoneNumber, contactData.email, contactData.linkedId, contactData.linkPrecedence],
        function (err: any) {
          if (err) {
            reject(err);
            return;
          }

          // Fetch the created contact
          const selectQuery = `
            SELECT * FROM contacts WHERE id = ? AND deletedAt IS NULL
          `;

          const insertId = this.lastID;
          self.db.get(selectQuery, [insertId], (err: Error | null, row: any) => {
            if (err) {
              reject(err);
              return;
            }

            if (row) {
              resolve(Database.rowToContact(row));
            } else {
              reject(new Error('Failed to retrieve created contact'));
            }
          });
        }
      );
    });
  }

  public findContactsByEmailOrPhone(email?: string, phoneNumber?: string): Promise<Contact[]> {
    return new Promise((resolve, reject) => {
      let query = `SELECT * FROM contacts WHERE deletedAt IS NULL AND (`;
      const params: string[] = [];

      if (email) {
        query += `email = ?`;
        params.push(email);
      }

      if (phoneNumber) {
        if (email) query += ` OR `;
        query += `phoneNumber = ?`;
        params.push(phoneNumber);
      }

      query += `) ORDER BY createdAt ASC`;

      this.db.all(query, params, (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const contacts = rows.map(row => Database.rowToContact(row));
        resolve(contacts);
      });
    });
  }

  public findContactById(id: number): Promise<Contact | null> {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM contacts WHERE id = ? AND deletedAt IS NULL`;

      this.db.get(query, [id], (err, row: any) => {
        if (err) {
          reject(err);
          return;
        }

        if (row) {
          resolve(Database.rowToContact(row));
        } else {
          resolve(null);
        }
      });
    });
  }

  public updateContactToSecondary(contactId: number, primaryContactId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE contacts 
        SET linkedId = ?, linkPrecedence = 'secondary', updatedAt = datetime('now')
        WHERE id = ?
      `;

      this.db.run(query, [primaryContactId, contactId], (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  public findAllLinkedContacts(primaryContactId: number): Promise<Contact[]> {
    return new Promise((resolve, reject) => {
      const query = `
        SELECT * FROM contacts 
        WHERE (id = ? OR linkedId = ?) AND deletedAt IS NULL
        ORDER BY createdAt ASC
      `;

      this.db.all(query, [primaryContactId, primaryContactId], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const contacts = rows.map(row => Database.rowToContact(row));
        resolve(contacts);
      });
    });
  }

  public updateLinkedContactsPrimaryId(oldPrimaryId: number, newPrimaryId: number): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `
        UPDATE contacts 
        SET linkedId = ?, updatedAt = datetime('now')
        WHERE linkedId = ?
      `;

      this.db.run(query, [newPrimaryId, oldPrimaryId], (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }

  public close(): void {
    this.db.close();
  }

  private static rowToContact(row: any): Contact {
    const contact: Contact = {
      id: row.id,
      linkPrecedence: row.linkPrecedence as LinkPrecedence,
      createdAt: new Date(row.createdAt),
      updatedAt: new Date(row.updatedAt),
    };

    if (row.phoneNumber) {
      contact.phoneNumber = row.phoneNumber;
    }

    if (row.email) {
      contact.email = row.email;
    }

    if (row.linkedId) {
      contact.linkedId = row.linkedId;
    }

    if (row.deletedAt) {
      contact.deletedAt = new Date(row.deletedAt);
    }

    return contact;
  }

  // For testing purposes
  public getAllContacts(): Promise<Contact[]> {
    return new Promise((resolve, reject) => {
      const query = `SELECT * FROM contacts WHERE deletedAt IS NULL ORDER BY createdAt ASC`;

      this.db.all(query, [], (err, rows: any[]) => {
        if (err) {
          reject(err);
          return;
        }

        const contacts = rows.map(row => Database.rowToContact(row));
        resolve(contacts);
      });
    });
  }

  public clearAllContacts(): Promise<void> {
    return new Promise((resolve, reject) => {
      const query = `DELETE FROM contacts`;

      this.db.run(query, [], (err) => {
        if (err) {
          reject(err);
          return;
        }
        resolve();
      });
    });
  }
}