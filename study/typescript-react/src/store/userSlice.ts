// src/store/userSlice.ts
import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import {
  CalendarEvent,
  User,
  Permission,
  Role,
  UserState,
} from "../type/types";

const initialState: UserState = {
  userInfo: null,
  roles: [],
  allUsers: [],
  permissions: [],
  events: [],
  isUserInfoInvalidated: true,
  isRolesInvalidated: true,
  isUsersInvalidated: true,
  isPermissionsInvalidated: true,
  isEventsInvalidated: true,
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserInfo: (state, action: PayloadAction<User | null>) => {
      state.userInfo = action.payload;
      state.isUserInfoInvalidated = false;
    },
    setRoles: (state, action: PayloadAction<Role[]>) => {
      state.roles = action.payload;
      state.isRolesInvalidated = false;
    },
    setAllUsers: (state, action: PayloadAction<User[]>) => {
      state.allUsers = action.payload;
      state.isUsersInvalidated = false;
    },
    setPermissions: (state, action: PayloadAction<Permission[]>) => {
      state.permissions = action.payload;
      state.isPermissionsInvalidated = false;
    },
    setEvents: (state, action: PayloadAction<CalendarEvent[]>) => {
      state.events = action.payload;
      state.isEventsInvalidated = false;
    },
    invalidateUserInfo: (state) => {
      state.isUserInfoInvalidated = true;
    },
    invalidateRoles: (state) => {
      state.isRolesInvalidated = true;
    },
    invalidateUsers: (state) => {
      state.isUsersInvalidated = true;
    },
    invalidatePermissions: (state) => {
      state.isPermissionsInvalidated = true;
    },
    invalidateEvents: (state) => {
      state.isEventsInvalidated = true;
    },
    clearUserData: (state) => {
      state.userInfo = null;
      state.roles = [];
      state.allUsers = [];
      state.permissions = [];
      state.events = [];
      state.isUserInfoInvalidated = true;
      state.isRolesInvalidated = true;
      state.isUsersInvalidated = true;
      state.isPermissionsInvalidated = true;
      state.isEventsInvalidated = true;
    },
    clearUserInfo: (state) => {
      state.userInfo = null;
    },
  },
});

export const {
  setUserInfo,
  setRoles,
  setAllUsers,
  setPermissions,
  setEvents,
  invalidateUserInfo,
  invalidateRoles,
  invalidateUsers,
  invalidatePermissions,
  invalidateEvents,
  clearUserData,
  clearUserInfo,
} = userSlice.actions;

export default userSlice.reducer;

