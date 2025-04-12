// src/types/RootStateTypes.ts
// Types related to the Redux store root state

import { AuthState } from "./AuthTypes";
import { UserState } from "./UserTypes";
import { KanbanState } from "./KanbanTypes";
import { AssistantAIState } from "./AssistantAITypes";
import { LanguageState } from "./LanguageAITypes";
import { ChatState, MessageState, ContactState } from "./ChatTypes";

export interface RootState {
  auth: AuthState;
  user: UserState;
  kanban: KanbanState;
  assistantAI: AssistantAIState;
  language: LanguageState;
  messages: MessageState;
  contacts: ContactState;
  chat: ChatState;
}

