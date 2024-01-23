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
  takenFrames: [],
  message: ''
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
        row.section === action.payload.section ? { ...row, status: action.payload.status } : row
      )
    },
    setMessage(state, action) {
      state.message = action.payload
    }
  }
})

export const { setSetup, setFrames, changeDownloadStatus, setTakenFrames, setMessage } =
  newFramesSlice.actions

export const fetchSetup = () => async (dispatch) => {
  const setup = await window.electronApi.getSetups()

  if (Object.keys(setup).length > 0) {
    dispatch(setSetup(setup))
  }
}

export const fetchNewFrames = () => async (dispatch) => {
  dispatch(setFrames([]))
  dispatch(setMessage(''))

  const res = await window.electronApi.findNewFrames()

  if (Array.isArray(res) && res.length > 0) {
    dispatch(setFrames(res))
  }
  if (typeof res === 'string') {
    dispatch(setMessage(res))
  }
}

export const fetchTakenFrames = () => async (dispatch) => {
  const takenFrames = await window.electronApi.fetchTakenFrames()
  if (Array.isArray(takenFrames)) {
    dispatch(setTakenFrames(takenFrames))
  }
}

export const framesSelector = (store) => store.frames

export default newFramesSlice.reducer
