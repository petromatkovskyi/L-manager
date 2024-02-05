import { configureStore } from '@reduxjs/toolkit'
import framesSlice from './framesSlice'
import setupSlice from './setupSlice'

export const store = configureStore({
  reducer: { frames: framesSlice, setup: setupSlice }
})
