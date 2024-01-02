import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronApi', {
  title: 'L-Manager',
  auth: async () => {
    const res = await ipcRenderer.invoke('auth')
    return res
  },
  findNewFrames: async () => {
    const res = await ipcRenderer.invoke('findNewFrames')
    return res
  },
  checkFolders: async (block) => {
    // data = {block: 2728, fileNames:['M-34-54-C-b-1-2-3-3', 'M-34-54-C-b-1-2-3-4']}
    //block = 2728

    const res = await ipcRenderer.invoke('checkFolders', block)
    return res
  },
  downloadFile: async (data) => {
    const res = await ipcRenderer.invoke('downloadFile', data)
    return res
  },
  unArchive: (path) => {
    ipcRenderer.invoke('unArchive', path)
  },
  choosePath: async () => {
    const path = await ipcRenderer.invoke('choosePath')
    return path
  },
  saveSetups: async (setups) => {
    const feedback = await ipcRenderer.invoke('saveSetups', setups)
    return feedback
  },
  getSetups: async () => {
    const res = await ipcRenderer.invoke('getSetups')
    return res
  },
  getSheetNames: async (data = { spreadsheetId: '' }) => {
    const sheetNames = await ipcRenderer.invoke('getSheetNames', data)
    return sheetNames
  },
  checkSpreadSheetId: async (id) => {
    const isIdValid = await ipcRenderer.invoke('checkSpreadSheetId', id)
    return isIdValid
  },
  saveNewFramesInDB: (data) => {
    console.log('currLocation preload', '2')

    const res = ipcRenderer.invoke('saveNewFramesInDB', data)
    return res
  },
  fetchTakenFrames: async () => ipcRenderer.invoke('fetchTakenFrames'),
  deleteFramesData: (id) => ipcRenderer.invoke('deleteFramesData', id),
  isPathValid: async (path) => await ipcRenderer.invoke('isPathValid', path),

  currLocation: (callback) => ipcRenderer.on('currLocation', callback),
  getCurrLocation: async () => await ipcRenderer.invoke('getCurrLocation')
})
