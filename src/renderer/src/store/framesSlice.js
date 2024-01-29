import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  setup: {
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
  },
  frames: [],
  filters: {
    new: true,
    //?block = {name, selected}
    blocks: [],
    selectedBlock: ''
  },
  filteredFrames: [],
  message: ''
}

const DATE_REG_EX = /^\d{2}.\d{2}$/

export const newFramesSlice = createSlice({
  name: 'frames',
  initialState,
  reducers: {
    setSetup: (state, action) => {
      state.setup = action.payload
    },
    setFrames: (state, action) => {
      state.frames = action.payload
    },
    setFilterFrames: (state, action) => {
      if (!action.payload.length) {
        state.filteredFrames = []
        return
      }

      state.filteredFrames = filterFrames(state.frames, state.filters)
    },
    setTakenFrames: (state, action) => {
      state.takenFrames = action.payload
    },
    changeDownloadStatus: (state, action) => {
      // idle progress done error
      if (!action.payload) {
        state.frames = state.frames.map((row) => ({ ...row, status: 'idle' }))
        return
      }
      state.frames = state.frames.map((row) =>
        row.section === action.payload.section ? { ...row, status: action.payload.status } : row
      )

      state.filteredFrames = filterFrames(state.frames, state.filters)
    },
    setMessage: (state, action) => {
      state.message = action.payload
    },
    toggleFilterNew: (state, action) => {
      state.filters.new = action.payload

      state.filteredFrames = filterFrames(state.frames, state.filters)
    },
    setBlocks: (state, action) => {
      state.filters.blocks = action.payload
    },
    selectBlock: (state, action) => {
      if (state.filters.blocks.includes(action.payload)) {
        state.filters.selectedBlock = action.payload

        state.filteredFrames = filterFrames(state.frames, state.filters)
      }
    },
    filterFrames: (state) => {
      state.filteredFrames = state.frames.filter((frame) => {
        if (state.filters.new && frame.new && state.filters.blocks) return frame
      })
    },
    toggleFrameSelect: (state, action) => {
      state.frames = state.frames.map((frame) =>
        frame.section === action.payload.section
          ? { ...frame, selected: action.payload.select }
          : frame
      )

      state.filteredFrames = filterFrames(state.frames, state.filters)
    },
    toggleAllSelect(state, action) {
      if (state.frames.length === 0) return

      state.frames = state.frames.map((frame) => ({
        ...frame,
        selected: action.payload
      }))

      state.filteredFrames = filterFrames(state.frames, state.filters)
    }
  }
})

export const {
  setSetup,
  setFrames,
  changeDownloadStatus,
  setTakenFrames,
  setMessage,
  toggleFilterNew,
  setBlocks,
  selectBlock,
  toggleFrameSelect,
  setFilterFrames,
  toggleAllSelect
} = newFramesSlice.actions

export const fetchSetup = () => async (dispatch) => {
  const setup = await window.electronApi.getSetups()
  if (Object.keys(setup).length > 0) {
    dispatch(setSetup(setup))
  }
}

export const fetchFrames = () => async (dispatch) => {
  dispatch(setFrames([]))
  dispatch(setMessage(''))

  const frames = await window.electronApi.findNewFrames()

  if (Array.isArray(frames) && frames.length > 0) {
    frames.forEach(
      (frame) => (
        (frame.status = 'Idle'),
        (frame.selected = true),
        (frame.new =
          frame.done === '0,000' && (frame.check === undefined || !frame.check?.match(DATE_REG_EX)))
      )
    )
    //frame ={rowNumber, !!block, !part, section, operator, done, left, check, status, selected, new}

    const blocks = frames.reduce((acc, currElem) => {
      !acc.includes(currElem.part) && acc.push(currElem.part)
      return acc
    }, [])

    dispatch(setFrames(frames))
    dispatch(setBlocks(blocks))
    dispatch(selectBlock(blocks[0]))
    dispatch(setFilterFrames(frames))
  }
  if (typeof frames === 'string') {
    dispatch(setMessage(frames))
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

function filterFrames(frames, filters) {
  const filteredFrames = frames.filter((frame) => {
    if (frame.part === filters.selectedBlock) {
      if (filters.new) return frame.new

      return true
    }
    return false
  })
  return filteredFrames
}
