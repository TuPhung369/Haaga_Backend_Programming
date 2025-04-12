// src/types/ContactTypes.ts
// Types related to contacts management

export interface Contact {
  id: string;
  name: string;
  email: string;
  status: "online" | "offline" | "away";
  lastSeen?: string;
}

export interface ContactState {
  contacts: Contact[];
  selectedContact: Contact | null;
  loading: boolean;
  error: string | null;
}
