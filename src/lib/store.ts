import { configureStore } from '@reduxjs/toolkit';
  import progressReducer from './progressSlice';

  export const store = configureStore({
    reducer: {
      progress: progressReducer,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: {
          ignoredActions: ['persist/PERSIST'],
        },
      }),
  });

  // Infer the `RootState` and `AppDispatch` types from the store itself
  export type RootState = ReturnType<typeof store.getState>;
  export type AppDispatch = typeof store.dispatch;