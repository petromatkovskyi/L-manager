import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  setups: {
    pathType: 'root',
    searchingPath: '',
    destPath: '',
    operatorName: '',
    selectedSpreadsheet: {
      spreadsheetLink: '',
      sheetName: '',
      spreadsheetId: '',
      name: ''
    },
    spreadsheets: []
  }
}

export const setupSlice = createSlice({
  name: 'setup',
  initialState,
  reducers: {
    setSetup: (state, action) => {
      state.setups = action.payload
    }
  }
})

export const { setSetup } = setupSlice.actions

export const fetchSetup = () => async (dispatch) => {
  const setups = await window.electronApi.getSetups()
  if (Object.keys(setups).length > 0) {
    dispatch(setSetup(setups))
  }
}

export const setupSelector = (store) => store.setup.setups

export default setupSlice.reducer
