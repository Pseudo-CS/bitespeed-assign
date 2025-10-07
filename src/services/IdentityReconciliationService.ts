import { Database } from '../database/connection';
import { Contact, CreateContactData, LinkPrecedence, IdentifyRequest, IdentifyResponse, ContactGroup } from '../types';

export class IdentityReconciliationService {
  private database: Database;

  constructor(database: Database) {
    this.database = database;
  }

  public async identify(request: IdentifyRequest): Promise<IdentifyResponse> {
    const { email, phoneNumber } = request;

    // Find existing contacts that match the email or phone number
    const existingContacts = await this.database.findContactsByEmailOrPhone(email, phoneNumber);

    if (!existingContacts || existingContacts.length === 0) {
      // Scenario 1: No existing contacts - create new primary contact
      return await this.createNewPrimaryContact(email, phoneNumber);
    }

    // Get all primary contacts from the existing matches
    const primaryContacts = this.findPrimaryContacts(existingContacts);

    if (primaryContacts.length === 1) {
      // Scenario 2: One primary contact found
      const primaryContact = primaryContacts[0];
      
      if (!primaryContact) {
        throw new Error('Primary contact not found');
      }
      
      // Check if we need to create a secondary contact
      const needsSecondaryContact = this.needsSecondaryContact(primaryContact, email, phoneNumber);
      
      if (needsSecondaryContact) {
        await this.createSecondaryContact(email, phoneNumber, primaryContact.id);
      }

      return await this.buildResponseForPrimary(primaryContact.id);
    }

    // Scenario 3: Multiple primary contacts found - merge them
    return await this.mergePrimaryContacts(primaryContacts, email, phoneNumber);
  }

  private async createNewPrimaryContact(email?: string, phoneNumber?: string): Promise<IdentifyResponse> {
    const contactData: CreateContactData = {
      linkPrecedence: LinkPrecedence.PRIMARY,
    };

    if (email) {
      contactData.email = email;
    }

    if (phoneNumber) {
      contactData.phoneNumber = phoneNumber;
    }

    const newContact = await this.database.createContact(contactData);

    return {
      contact: {
        primaryContactId: newContact.id,
        emails: email ? [email] : [],
        phoneNumbers: phoneNumber ? [phoneNumber] : [],
        secondaryContactIds: [],
      },
    };
  }

  private findPrimaryContacts(contacts: Contact[]): Contact[] {
    const primaryContacts: Contact[] = [];
    const primaryIds = new Set<number>();

    for (const contact of contacts) {
      if (contact.linkPrecedence === LinkPrecedence.PRIMARY) {
        primaryContacts.push(contact);
        primaryIds.add(contact.id);
      } else if (contact.linkedId && !primaryIds.has(contact.linkedId)) {
        // This is a secondary contact, find its primary
        const primary = contacts.find(c => c.id === contact.linkedId);
        if (primary) {
          primaryContacts.push(primary);
          primaryIds.add(primary.id);
        }
      }
    }

    return primaryContacts;
  }

  private needsSecondaryContact(primaryContact: Contact, email?: string, phoneNumber?: string): boolean {
    // Check if the primary contact already has this email and phone number
    const hasEmail = !email || primaryContact.email === email;
    const hasPhone = !phoneNumber || primaryContact.phoneNumber === phoneNumber;

    // If both provided fields already exist in primary, no secondary needed
    if (hasEmail && hasPhone) {
      return false;
    }

    // If we have new information (email or phone), create secondary
    const hasNewEmail = email && primaryContact.email !== email;
    const hasNewPhone = phoneNumber && primaryContact.phoneNumber !== phoneNumber;
    
    return Boolean(hasNewEmail || hasNewPhone);
  }

  private async createSecondaryContact(email?: string, phoneNumber?: string, primaryContactId?: number): Promise<Contact> {
    const contactData: CreateContactData = {
      linkPrecedence: LinkPrecedence.SECONDARY,
    };

    if (email) {
      contactData.email = email;
    }

    if (phoneNumber) {
      contactData.phoneNumber = phoneNumber;
    }

    if (primaryContactId) {
      contactData.linkedId = primaryContactId;
    }

    return await this.database.createContact(contactData);
  }

  private async mergePrimaryContacts(primaryContacts: Contact[], email?: string, phoneNumber?: string): Promise<IdentifyResponse> {
    // Sort by creation date to get the oldest (which becomes the primary)
    primaryContacts.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
    
    const oldestPrimary = primaryContacts[0];
    if (!oldestPrimary) {
      throw new Error('No primary contact found to merge');
    }

    const contactsToMerge = primaryContacts.slice(1);

    // Convert other primary contacts to secondary
    for (const contact of contactsToMerge) {
      await this.database.updateContactToSecondary(contact.id, oldestPrimary.id);
      
      // Update any contacts that were linked to this primary
      await this.database.updateLinkedContactsPrimaryId(contact.id, oldestPrimary.id);
    }

    // Check if we need to create a new secondary contact for the new information
    const allLinkedContacts = await this.database.findAllLinkedContacts(oldestPrimary.id);
    const hasNewInfo = this.hasNewInformation(allLinkedContacts, email, phoneNumber);

    if (hasNewInfo) {
      await this.createSecondaryContact(email, phoneNumber, oldestPrimary.id);
    }

    return await this.buildResponseForPrimary(oldestPrimary.id);
  }

  private hasNewInformation(contacts: Contact[], email?: string, phoneNumber?: string): boolean {
    if (!email && !phoneNumber) {
      return false;
    }

    const existingEmails = new Set(contacts.map(c => c.email).filter(Boolean));
    const existingPhones = new Set(contacts.map(c => c.phoneNumber).filter(Boolean));

    const hasNewEmail = email && !existingEmails.has(email);
    const hasNewPhone = phoneNumber && !existingPhones.has(phoneNumber);

    return Boolean(hasNewEmail || hasNewPhone);
  }

  private async buildResponseForPrimary(primaryContactId: number): Promise<IdentifyResponse> {
    const allLinkedContacts = await this.database.findAllLinkedContacts(primaryContactId);
    
    // Separate primary and secondary contacts
    const primaryContact = allLinkedContacts.find(c => c.linkPrecedence === LinkPrecedence.PRIMARY);
    const secondaryContacts = allLinkedContacts.filter(c => c.linkPrecedence === LinkPrecedence.SECONDARY);

    if (!primaryContact) {
      throw new Error('Primary contact not found');
    }

    // Collect all unique emails and phone numbers
    const emails: string[] = [];
    const phoneNumbers: string[] = [];

    // Add primary contact info first
    if (primaryContact.email) {
      emails.push(primaryContact.email);
    }
    if (primaryContact.phoneNumber) {
      phoneNumbers.push(primaryContact.phoneNumber);
    }

    // Add secondary contact info
    for (const contact of secondaryContacts) {
      if (contact.email && !emails.includes(contact.email)) {
        emails.push(contact.email);
      }
      if (contact.phoneNumber && !phoneNumbers.includes(contact.phoneNumber)) {
        phoneNumbers.push(contact.phoneNumber);
      }
    }

    return {
      contact: {
        primaryContactId: primaryContact.id,
        emails,
        phoneNumbers,
        secondaryContactIds: secondaryContacts.map(c => c.id),
      },
    };
  }

  // Helper method for getting contact groups (useful for testing)
  public async getContactGroup(primaryContactId: number): Promise<ContactGroup | null> {
    const allLinkedContacts = await this.database.findAllLinkedContacts(primaryContactId);
    
    const primaryContact = allLinkedContacts.find(c => c.linkPrecedence === LinkPrecedence.PRIMARY);
    const secondaryContacts = allLinkedContacts.filter(c => c.linkPrecedence === LinkPrecedence.SECONDARY);

    if (!primaryContact) {
      return null;
    }

    const allEmails: string[] = [];
    const allPhoneNumbers: string[] = [];

    // Collect emails and phone numbers from all contacts
    for (const contact of allLinkedContacts) {
      if (contact.email && !allEmails.includes(contact.email)) {
        allEmails.push(contact.email);
      }
      if (contact.phoneNumber && !allPhoneNumbers.includes(contact.phoneNumber)) {
        allPhoneNumbers.push(contact.phoneNumber);
      }
    }

    return {
      primaryContact,
      secondaryContacts,
      allEmails,
      allPhoneNumbers,
    };
  }
}