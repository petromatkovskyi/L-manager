import { configureStore } from '@reduxjs/toolkit'
import framesSlice from './framesSlice'

export const store = configureStore({
  reducer: { frames: framesSlice }
})
