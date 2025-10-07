export enum LinkPrecedence {
  PRIMARY = 'primary',
  SECONDARY = 'secondary'
}

export interface Contact {
  id: number;
  phoneNumber?: string;
  email?: string;
  linkedId?: number;
  linkPrecedence: LinkPrecedence;
  createdAt: Date;
  updatedAt: Date;
  deletedAt?: Date;
}

export interface CreateContactData {
  phoneNumber?: string;
  email?: string;
  linkedId?: number;
  linkPrecedence: LinkPrecedence;
}

export interface IdentifyRequest {
  email?: string;
  phoneNumber?: string;
}

export interface IdentifyResponse {
  contact: {
    primaryContactId: number;
    emails: string[];
    phoneNumbers: string[];
    secondaryContactIds: number[];
  };
}

export interface ContactGroup {
  primaryContact: Contact;
  secondaryContacts: Contact[];
  allEmails: string[];
  allPhoneNumbers: string[];
}