import { configureStore } from '@reduxjs/toolkit';
import newFramesSlice from './newFramesSlice';

export const store = configureStore({
  reducer: { newFrames: newFramesSlice },
});
