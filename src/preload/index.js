import { contextBridge, ipcRenderer } from 'electron'

contextBridge.exposeInMainWorld('electronApi', {
  title: 'L-Manager',
  auth: async () => {
    const res = await ipcRenderer.invoke('auth')
    return res
  },
  findNewFrames: async () => {
    const res = await ipcRenderer.invoke('findFrames')
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
  convertFiles: (path) => {
    ipcRenderer.invoke('convertFiles', path)
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
  getSheetNames: async (data = { selectedSpreadsheet: { spreadsheetId: '' } }) => {
    return await ipcRenderer.invoke('getSheetNames', data)
  },
  getSpreadsheetTitle: async (id) => {
    return await ipcRenderer.invoke('getSpreadsheetTitle', id)
  },
  checkSpreadSheetId: async (id) => {
    const isIdValid = await ipcRenderer.invoke('checkSpreadSheetId', id)
    return isIdValid
  },
  saveNewFramesInDB: (data) => {
    const res = ipcRenderer.invoke('saveNewFramesInDB', data)
    return res
  },
  fetchTakenFrames: async () => ipcRenderer.invoke('fetchTakenFrames'),
  deleteFramesData: (id) => ipcRenderer.invoke('deleteFramesData', id),
  deleteSpreadsheet: async (spreadsheet) =>
    await ipcRenderer.invoke('deleteSpreadsheet', spreadsheet),
  isPathValid: async (path) => await ipcRenderer.invoke('isPathValid', path),

  currLocation: (callback) => ipcRenderer.on('currLocation', callback),
  getCurrLocation: async () => await ipcRenderer.invoke('getCurrLocation')
})
