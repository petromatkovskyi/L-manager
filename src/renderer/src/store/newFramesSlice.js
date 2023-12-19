import { createSlice } from '@reduxjs/toolkit';

const initialState = {
  setup: {
    pathType: 'root',
    searchingPath: '',
    destPath: '',
    operatorName: '',
    spreadsheetLink: '',
    spreadsheetId: '',
    sheetName: '',
  },
  frames: [],
};

export const newFramesSlice = createSlice({
  name: 'newFrames',
  initialState,
  reducers: {
    setSetup(state, action) {
      state.setup = action.payload;
    },
    setFrames(state, action) {
      state.frames = action.payload;
    },
    changeDownloadStatus(state, action) {
      // idle progress done error
      state.frames = state.frames.map((row) =>
        row.num === action.payload.num ? { ...row, status: action.payload.status } : row
      );
    },
  },
});

export const { setSetup, setFrames, changeDownloadStatus } = newFramesSlice.actions;

export const fetchSetup = () => async (dispatch) => {
  const setup = await electronApi.getSetups();
  if (Object.keys(setup).length > 0) {
    dispatch(setSetup(setup));
  }
};

export const fetchNewFrames = () => async (dispatch) => {
  const frames = await electronApi.findNewFrames();
  if (Array.isArray(frames) && frames.length > 0) {
    frames.forEach((item) => (item.status = 'Idle'));
    dispatch(setFrames(frames));
  }
};

export default newFramesSlice.reducer;
