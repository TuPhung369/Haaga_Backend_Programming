// src/store/userSlice.js
import { createSlice } from "@reduxjs/toolkit";

const initialState = {
  userInfo: null,
  roles: [],
  allUsers: [],
  permissions: [],
  events: [], // Thêm events để quản lý lịch
  isUserInfoInvalidated: true,
  isRolesInvalidated: true,
  isUsersInvalidated: true,
  isPermissionsInvalidated: true,
  isEventsInvalidated: true, // Thêm flag cho events
};

const userSlice = createSlice({
  name: "user",
  initialState,
  reducers: {
    setUserInfo: (state, action) => {
      state.userInfo = action.payload;
      state.isUserInfoInvalidated = false;
    },
    setRoles: (state, action) => {
      state.roles = action.payload;
      state.isRolesInvalidated = false;
    },
    setAllUsers: (state, action) => {
      state.allUsers = action.payload;
      state.isUsersInvalidated = false;
    },
    setPermissions: (state, action) => {
      state.permissions = action.payload;
      state.isPermissionsInvalidated = false;
    },
    setEvents: (state, action) => {
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
} = userSlice.actions;
export default userSlice.reducer;
