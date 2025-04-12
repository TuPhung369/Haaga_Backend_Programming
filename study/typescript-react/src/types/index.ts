// src/types/index.ts
// Export all types from their respective files for easy importing

// API Types
export * from "./ApiTypes";

// Authentication Types
export * from "./AuthTypes";

// User Types
// Explicitly re-export to resolve naming conflict with AuthTypes
import * as UserTypes from "./UserTypes";
export { UserTypes };
// Export everything except ValidationInput to avoid conflict
export type {
  Permission,
  PermissionResponse,
  PermissionsResponse,
  Role,
  RoleResponse,
  RolesResponse,
  User,
  UserResponse,
  UsersResponse,
  UserState,
  QuantityChart,
  PercentChart,
  FilterDropdownProps,
} from "./UserTypes";

// Calendar Types
export * from "./CalendarTypes";

// Kanban Types
export * from "./KanbanTypes";

// Assistant AI Types
export * from "./AssistantAITypes";

// Language AI Types
export * from "./LanguageAITypes";

// Message Types
export * from "./MessageTypes";

// Contact Types
export * from "./ContactTypes";

// Chat Types
export * from "./ChatTypes";

// Root State Types
export * from "./RootStateTypes";

// Note: Declaration files (.d.ts) are not exported here as they are automatically included
// by TypeScript and don't need to be explicitly imported

