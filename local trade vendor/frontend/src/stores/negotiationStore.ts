import { create } from 'zustand'
import { Negotiation, Message } from '../types'

interface NegotiationState {
  negotiations: Negotiation[]
  activeNegotiation: Negotiation | null
  messages: Record<string, Message[]>
  unreadCount: number
  setNegotiations: (negotiations: Negotiation[]) => void
  setActiveNegotiation: (negotiation: Negotiation | null) => void
  addNegotiation: (negotiation: Negotiation) => void
  updateNegotiation: (id: string, updates: Partial<Negotiation>) => void
  setMessages: (negotiationId: string, messages: Message[]) => void
  addMessage: (negotiationId: string, message: Message) => void
  incrementUnreadCount: () => void
  resetUnreadCount: () => void
}

export const useNegotiationStore = create<NegotiationState>((set) => ({
  negotiations: [],
  activeNegotiation: null,
  messages: {},
  unreadCount: 0,

  setNegotiations: (negotiations: Negotiation[]) => set({ negotiations }),

  setActiveNegotiation: (negotiation: Negotiation | null) =>
    set({ activeNegotiation: negotiation }),

  addNegotiation: (negotiation: Negotiation) =>
    set((state) => ({
      negotiations: [...state.negotiations, negotiation],
    })),

  updateNegotiation: (id: string, updates: Partial<Negotiation>) =>
    set((state) => ({
      negotiations: state.negotiations.map((n) =>
        n.id === id ? { ...n, ...updates } : n
      ),
      activeNegotiation:
        state.activeNegotiation?.id === id
          ? { ...state.activeNegotiation, ...updates }
          : state.activeNegotiation,
    })),

  setMessages: (negotiationId: string, messages: Message[]) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [negotiationId]: messages,
      },
    })),

  addMessage: (negotiationId: string, message: Message) =>
    set((state) => ({
      messages: {
        ...state.messages,
        [negotiationId]: [
          ...(state.messages[negotiationId] || []),
          message,
        ],
      },
    })),

  incrementUnreadCount: () =>
    set((state) => ({ unreadCount: state.unreadCount + 1 })),

  resetUnreadCount: () => set({ unreadCount: 0 }),
}))
