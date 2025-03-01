// src/store/resetActions.ts
import { createAction } from "@reduxjs/toolkit";

// This is a global action that can be dispatched to reset all data
export const resetAllData = createAction("app/resetAllData");
