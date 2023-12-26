import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  setup: {
    pathType: 'root',
    searchingPath: '',
    destPath: '',
    operatorName: '',
    spreadsheetLink: '',
    spreadsheetId: '',
    sheetName: ''
  },
  frames: [],
  takenFrames: []
}

export const newFramesSlice = createSlice({
  name: 'frames',
  initialState,
  reducers: {
    setSetup(state, action) {
      state.setup = action.payload
    },
    setFrames(state, action) {
      action.payload.forEach((item) => (item.status = 'Idle'))
      state.frames = action.payload
    },
    setTakenFrames(state, action) {
      state.takenFrames = action.payload
    },
    changeDownloadStatus(state, action) {
      // idle progress done error
      state.frames = state.frames.map((row) =>
        row.num === action.payload.num ? { ...row, status: action.payload.status } : row
      )
    }
  }
})

export const { setSetup, setFrames, changeDownloadStatus, setTakenFrames } = newFramesSlice.actions

export const fetchSetup = () => async (dispatch) => {
  const setup = await electronApi.getSetups()

  if (Object.keys(setup).length > 0) {
    dispatch(setSetup(setup))
  }
}

export const fetchNewFrames = () => async (dispatch) => {
  const frames = await electronApi.findNewFrames()

  if (Array.isArray(frames) && frames.length > 0) {
    dispatch(setFrames(frames))
  }
}

export const fetchTakenFrames = () => async (dispatch) => {
  const takenFrames = await electronApi.fetchTakenFrames()
  console.log(takenFrames)
  if (Array.isArray(takenFrames)) {
    dispatch(setTakenFrames(takenFrames))
  }
}

export const framesSelector = (store) => store.frames

export default newFramesSlice.reducer
