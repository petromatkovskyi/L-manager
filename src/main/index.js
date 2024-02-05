import { app, BrowserWindow, ipcMain, dialog, shell } from 'electron'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import fs from 'fs'
import { google } from 'googleapis'
import { exec } from 'child_process'
import * as path from 'path'
import { v4 as uuidv4 } from 'uuid'

import { frames } from './Frames'
import operators from './OPERATORS'
import credentials from './cred/credentials.js'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']

const SETUP_PATH =
  process.env.NODE_ENV === 'development'
    ? path.resolve('src/main/setup.json')
    : path.join(app.getPath('userData'), 'setup.json')
const TOKEN_PATH =
  process.env.NODE_ENV === 'development'
    ? path.resolve('src/main/token.json')
    : path.join(app.getPath('userData'), 'token.json')

const { client_secret, client_id, redirect_uris } = credentials.installed

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris)

let mainWindow
let authWindow
let setups

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 1000,
    show: false,
    autoHideMenuBar: true,
    ...(process.platform === 'linux' ? { icon } : {}),
    webPreferences: {
      preload: path.join(__dirname, '../preload/index.js'),
      sandbox: false
    }
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
    mainWindow.webContents.openDevTools()
  } else {
    mainWindow.loadFile(path.join(__dirname, '../renderer/index.html'))
  }
}

app.whenReady().then(async () => {
  electronApp.setAppUserModelId('com.electron')

  // app.on('browser-window-created', (_, window) => {
  //   optimizer.watchWindowShortcuts(window)
  // })
  setups = getSetups()
  if (!setups.selectedSpreadsheet || !setups.spreadsheets) {
    setups.selectedSpreadsheet = {}
    setups.spreadsheets = []
  }

  createWindow()
  await checkAccessToken()

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    saveSetupsInSetupsFile()
    app.quit()
  }
})

ipcMain.handle('getSetups', getSetups)
ipcMain.handle('choosePath', choosePath)
ipcMain.handle('getSheetNames', getSheetNames)
ipcMain.handle('getSpreadsheetTitle', getSpreadsheetTitle)
ipcMain.handle('checkSpreadSheetId', checkSpreadSheetId)
ipcMain.handle('saveSetups', saveSetups)
ipcMain.handle('findFrames', findFrames)
ipcMain.handle('checkFolders', checkFolders)
ipcMain.handle('saveNewFramesInDB', saveNewFramesInDB)
ipcMain.handle('downloadFile', downloadFile)
ipcMain.handle('convertFiles', convertFiles)
ipcMain.handle('fetchTakenFrames', () => frames.getFramesData())
ipcMain.handle('deleteFramesData', (_, id) => frames.deleteFrames(id))
ipcMain.handle('deleteSpreadsheet', deleteSpreadsheet)
ipcMain.handle('isPathValid', isPathValid)
ipcMain.handle('getCurrLocation', () => {
  return is.dev && process.env['ELECTRON_RENDERER_URL']
    ? process.env['ELECTRON_RENDERER_URL']
    : path.join(__dirname, '../renderer/index.html')
})

async function authorize() {
  return new Promise((res) => {
    if (mainWindow) mainWindow.setEnabled(false)

    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'select_account '
    })

    if (authWindow) {
      authWindow.focus()
      return
    }

    authWindow = new BrowserWindow({
      width: 1000,
      height: 800,
      autoHideMenuBar: true,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false,
        sandbox: false
      }
    })

    authWindow.on('closed', () => {
      authWindow = null
      if (mainWindow) {
        mainWindow.setEnabled(true)
        mainWindow.focus()
      }
    })

    authWindow.loadURL(authUrl)

    authWindow.webContents.on('will-redirect', (e, url) => {
      const queryParams = new URL(url).searchParams
      const code = queryParams.get('code')

      if (code) {
        oAuth2Client.getToken(code, async (err, token) => {
          oAuth2Client.setCredentials(token)

          fs.writeFile(TOKEN_PATH, JSON.stringify(token), (err) => {
            if (err) {
              console.error('Error saving access token: ', err.message)
            }

            console.log('Access token stored in token.json')
          })

          authWindow.close()
          res()
        })
      }
    })
  })
}

async function checkAccessToken(clientToken) {
  let token = clientToken || null

  try {
    if (clientToken == null) {
      const tokenData = fs.readFileSync(TOKEN_PATH, 'utf8')

      token = JSON.parse(tokenData)
    }

    if (token && token?.expiry_date > Date.now()) {
      oAuth2Client.setCredentials(token)

      return true
    }

    console.log('181')
    if (token && token?.refresh_token) {
      const isRefreshed = await refreshAccessToken(token.refresh_token)
      isRefreshed || (await authorize())
    } else {
      await authorize()
    }
  } catch (e) {
    console.error('Error while reading file 153: ', e.message)

    fs.writeFile(TOKEN_PATH, JSON.stringify({}), (err) => {
      if (err) {
        console.error('Error saving empty obj: ', err.message)
      }
      console.log('Empty obj saved in token.json')
    })
    return null
  }
}

async function refreshAccessToken(refreshToken) {
  return await new Promise((resolve, reject) => {
    oAuth2Client.setCredentials({ refresh_token: refreshToken })

    oAuth2Client.refreshAccessToken((err, newToken) => {
      if (err) {
        console.log(err.message)
        fs.writeFileSync(TOKEN_PATH, JSON.stringify({}))
        oAuth2Client.setCredentials({})

        reject(false)
      } else {
        oAuth2Client.setCredentials(newToken)
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(newToken))

        resolve(newToken)
      }
    })
  })
}

function getSetups() {
  if (setups) return JSON.parse(JSON.stringify(setups))

  try {
    const savedSetups = getSavedSetups()
    if (!savedSetups) throw new Error('Something went wrong while reading setups file')

    return savedSetups
  } catch (err) {
    console.log(err.message)
    return null
  }
}

function getSavedSetups() {
  try {
    const data = fs.readFileSync(SETUP_PATH, 'utf8')
    if (data) {
      const setups = JSON.parse(data)
      return setups
    }
    console.log('248')
    return null
  } catch (err) {
    console.error(err)
    if (err.code === 'ENOENT') {
      const emptySetups = {
        pathType: '',
        searchingPath: '',
        destPath: '',
        operatorName: '',
        selectedSpreadsheet: {
          sheetName: '',
          name: '',
          spreadsheetLink: '',
          spreadsheetId: ''
        },
        spreadsheets: []
      }
      return emptySetups
    }
    console.error('Error getting JSON:', err.message)
    return null
  }
}

function saveSetups(_, newSetups) {
  const {
    pathType,
    searchingPath,
    destPath,
    operatorName,
    selectedSpreadsheet: { spreadsheetLink, spreadsheetId, sheetName }
  } = newSetups

  if (
    searchingPath &&
    destPath &&
    operatorName &&
    spreadsheetLink &&
    spreadsheetId &&
    sheetName &&
    pathType &&
    operators.includes(operatorName)
  ) {
    try {
      setups = newSetups

      return { success: true, message: 'Setups are saved' }
    } catch (e) {
      console.log(e)
      return { success: false, message: e.message }
    }
  } else if (!operators.includes(operatorName)) {
    return { success: false, message: 'Operator is not appropriate' }
  } else {
    return { success: false, message: 'Something went wrong...' }
  }
}

function saveSetupsInSetupsFile() {
  console.log('saveSetupsInSetupsFile')
  if (!setups) return

  const {
    pathType,
    searchingPath,
    destPath,
    operatorName,
    selectedSpreadsheet: { spreadsheetLink, spreadsheetId, sheetName }
  } = setups

  if (
    searchingPath &&
    destPath &&
    operatorName &&
    spreadsheetLink &&
    spreadsheetId &&
    sheetName &&
    pathType &&
    operators.includes(operatorName)
  ) {
    try {
      fs.writeFile(SETUP_PATH, JSON.stringify(setups), (err) => {
        if (err) {
          console.error('Error saving setups: ', err.message)
        }
        console.log('Setups stored in setup.json')
      })

      return { success: true, message: 'Setups are saved' }
    } catch (e) {
      console.log(e)
      return { success: false, message: e.message }
    }
  } else if (!operators.includes(operatorName)) {
    return { success: false, message: 'Operator is not appropriate' }
  } else {
    return { success: false, message: 'Something went wrong...' }
  }
}

async function choosePath() {
  try {
    const result = await dialog.showOpenDialog(mainWindow, {
      properties: ['openDirectory'],
      title: 'Choose directory',
      defaultPath: '/',
      buttonLabel: 'Choose'
    })

    if (!result.canceled) {
      const folderPath = result.filePaths[0]
      console.log(`You have chosen directory: ${folderPath}`)
      return folderPath
    } else {
      console.log('Choosing was denied.')
      return null
    }
  } catch (err) {
    console.error(err)
    return null
  } finally {
    mainWindow.focus()
  }
}

async function getSheetNames(_, data) {
  const auth = oAuth2Client
  await checkAccessToken(auth.credentials)

  const {
    selectedSpreadsheet: { spreadsheetId }
  } = data?.selectedSpreadsheet?.spreadsheetId ? data : getSetups()

  if (!spreadsheetId) {
    throw new Error('Spreed sheet id empty')
  }

  const sheets = google.sheets({ version: 'v4', auth })
  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId
    })

    const sheetsInfo = response.data.sheets
    const sheetNames = sheetsInfo.map((sheet) => sheet.properties.title)

    return sheetNames
  } catch (error) {
    console.error('Error getting sheet titles:', error.message)
    return null
  }
}

async function checkSpreadSheetId(_, id) {
  await checkAccessToken(oAuth2Client.credentials)

  if (!id) {
    throw new Error('Spreed sheet id empty')
  }

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client })

  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: id
    })
    console.log('390', response?.data?.properties?.title)
    return !!response?.data?.properties?.title
  } catch (error) {
    console.error('Error getting sheet titles:', error.message)
    return null
  }
}

async function getSpreadsheetTitle(_, id) {
  await checkAccessToken(oAuth2Client.credentials)
  console.log('397', id)

  if (!id) {
    throw new Error('Spreed sheet id empty')
  }

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client })

  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: id
    })

    return response?.data?.properties?.title
  } catch (error) {
    console.error('Error getting sheet titles:', error.message)
    return null
  }
}

function deleteSpreadsheet(_, spreadsheet) {
  const localSetups = getSetups()

  if (localSetups.spreadsheets.length > 1) {
    localSetups.spreadsheets = localSetups.spreadsheets.filter(
      (item) => item.spreadsheetId !== spreadsheet.spreadsheetId
    )
    if (localSetups.selectedSpreadsheet.spreadsheetId === spreadsheet.spreadsheetId) {
      localSetups.selectedSpreadsheet = localSetups.spreadsheets.at(-1)
    }

    saveSetups(null, localSetups)

    return localSetups
  }

  return localSetups
}

async function findFrames() {
  const auth = oAuth2Client

  await checkAccessToken(auth.credentials)

  const {
    selectedSpreadsheet: { spreadsheetId, sheetName },
    operatorName
  } = getSetups()
  console.log('438', spreadsheetId, sheetName, operatorName)
  const sheets = google.sheets({ version: 'v4', auth })

  const range = `${sheetName}`

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    })

    const values = response.data.values
    if (!values || values.length === 0) {
      throw new Error('There is not data in table. Please, check spreadsheet link')
    }

    const results = []
    for (let i = 0; i < values.length; i++) {
      const operatorCell = values[i][4]
      if (operatorCell && operatorCell.includes(operatorName) && values[i][3]) {
        const rowNumber = i + 1
        const block = values[i][1] // Column B
        const part = values[i][2] // Column C
        const section = values[i][3] // Column D
        const operator = values[i][4] // Column E
        const done = values[i][6] // Column G
        const left = values[i][7] // Column H
        const check = values[i][9] // Column J

        results.push({ num: rowNumber, block, section, operator, done, check, left, part })
      }

      // if (
      //   operatorCell &&
      //   operatorCell.includes(operatorName) &&
      //   done === '0,000' &&
      //   (check === undefined || !check?.match(DATE_REG_EX))
      // ) {
      //   results.push({ num: rowNumber, block, section, operator, done, check, total, left })
      // }
    }

    return results.length
      ? results
      : 'There is not any new frames. Please, connect with your manager'
  } catch (error) {
    console.error(`Error getting data from Google Sheets: ${error.message}`)
    return error.message
  }
}

function createSchemeNType(files) {
  const prefixes = files.reduce((acc, curr) => {
    const pref = curr.match(/([A-Z]){1}-\d{1,3}-\d{1,3}/)
    if (!acc.includes(pref[0])) acc.push(pref[0])

    return acc
  }, [])

  //M-34-65-i-j-y-u-q-w

  const divisionScheme = [
    [
      ['A', 'B'], //i=0
      ['C', 'D'] //i=1
    ],
    [
      ['a', 'b'],
      ['c', 'd']
    ],
    [
      ['1', '2'],
      ['3', '4']
    ],
    [
      ['1', '2'],
      ['3', '4']
    ],
    [
      ['1', '2'],
      ['3', '4']
    ],
    [
      ['1', '2'],
      ['3', '4']
    ]
  ]

  const fullNomenclature = prefixes.map((prefix) => {
    const nomenclature = []

    for (let i = 0; i < 2; i++) {
      //[]A
      nomenclature.push([])

      for (let ii = 0; ii < 2; ii++) {
        //A

        for (let j = 0; j < 2; j++) {
          //[a]
          if (nomenclature[i].length < 2) nomenclature[i].push([])

          for (let jj = 0; jj < 2; jj++) {
            //a

            for (let y = 0; y < 2; y++) {
              //[1]
              if (nomenclature[i][j].length < 2) nomenclature[i][j].push([])

              for (let yy = 0; yy < 2; yy++) {
                //1

                for (let u = 0; u < 2; u++) {
                  //[1]
                  if (nomenclature[i][j][y].length < 2) nomenclature[i][j][y].push([])

                  for (let uu = 0; uu < 2; uu++) {
                    //1

                    for (let q = 0; q < 2; q++) {
                      //[1]
                      if (nomenclature[i][j][y][u].length < 2) nomenclature[i][j][y][u].push([])

                      for (let qq = 0; qq < 2; qq++) {
                        //1

                        for (let w = 0; w < 2; w++) {
                          //[1]
                          if (nomenclature[i][j][y][u][q].length < 2)
                            nomenclature[i][j][y][u][q].push([])

                          for (let ww = 0; ww < 2; ww++) {
                            //1

                            nomenclature[i][j][y][u][q][w].push(
                              `${prefix}-${divisionScheme[0][i][ii]}-${divisionScheme[1][j][jj]}-${divisionScheme[2][y][yy]}-${divisionScheme[3][u][uu]}-${divisionScheme[4][q][qq]}-${divisionScheme[5][w][ww]}`
                            )
                          }
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
    }
    return nomenclature.flat(5)
  })

  const configuredLists = []

  for (let i = 0; i < prefixes.length; i++) {
    const firstListNum = +prefixes[0].split('-')[2]

    const currListNum = +prefixes[i].split('-')[2]

    if (i === 0) {
      configuredLists.push(...fullNomenclature[0])
      continue
    }

    if (currListNum - firstListNum === 1) {
      configuredLists.forEach((row, index) => row.push(...fullNomenclature[i][index]))
      continue
    }

    if (currListNum - firstListNum === 12) {
      configuredLists.push(...fullNomenclature[i])
      continue
    }

    if (currListNum - firstListNum === 13) {
      const prevListNum = +prefixes[i - 1].split('-')[2]
      if (prevListNum && prevListNum - firstListNum === 12) {
        configuredLists.forEach((row, index) => {
          if (index > 63) {
            row.push(...fullNomenclature[i][index])
          }
        })
        continue
      } else {
        //create empty array for currListNum - 1
        const prevList = Array.from({ length: 64 }, () => Array.from({ length: 64 }, () => null))
        prevList.forEach((row, index) => {
          row.push(...fullNomenclature[i][index])
        })
        configuredLists.push(...prevList)
      }
    }
  }

  const availableNamesScheme = configuredLists.map((row) =>
    row.map((listName) => (files.includes(listName) ? listName : null))
  )

  return trimSchema(availableNamesScheme)
}

function createSchemeNAType(files) {
  const nameRegex = /^([0-9]{1,})([A-Za-z]{1,})$/
  const limit = findLimit(files, nameRegex, false)

  const rowIds = getRowIds(limit)
  const schema = Array.from(rowIds, (id) => {
    const arr = new Array(limit.col.max - limit.col.min + 1).fill(null)

    const mappedArr = arr.map((_, index) => {
      const ID = `${+limit.col.min + index}${id}`
      return ID
    })
    return mappedArr
  })

  const availableNamesScheme = schema.map((row) =>
    row.map((name) => (files.includes(name) ? name : null))
  )
  const trimmedSchema = trimSchema(availableNamesScheme)

  return trimmedSchema
}
//! check naming for validity
function createSchemeA_NType(files) {
  const nameRegex = /^([A-Za-z]{1,})_([0-9]{1,})$/
  const limit = findLimit(files, nameRegex, true)
  const rowIds = getRowIds(limit)
  console.log({ rowIds, limit })

  const schema = Array.from(rowIds, (id) => {
    const arr = new Array(limit.col.max - limit.col.min + 1).fill(null)

    const mappedArr = arr.map((_, index) => {
      const ID = `${id}_${padWithLeadingZeros(+limit.col.min + index, limit.col.max.length)}`
      return ID
    })
    return mappedArr
  })

  const availableNamesScheme = schema.map((row) =>
    row.map((name) => (files.includes(name) ? name : null))
  )

  const trimmedSchema = trimSchema(availableNamesScheme)

  return trimmedSchema
}

function padWithLeadingZeros(num, totalLength) {
  return String(num).padStart(totalLength, '0')
}

function trimSchema(schema) {
  console.log(schema)
  let trimmedEmptyRows = schema.filter((row) => !row.every((item) => item === null))

  let trimIndexes = trimmedEmptyRows.reduce(
    (indexesAcc, subArr) => {
      const startNonNullIndex = subArr.findIndex((item) => item !== null)
      const endNonNullIndex = subArr.findLastIndex((item) => item !== null)

      const indexes = [
        startNonNullIndex < indexesAcc[0] && startNonNullIndex > -1
          ? startNonNullIndex
          : indexesAcc[0],
        endNonNullIndex > indexesAcc[1] ? endNonNullIndex : indexesAcc[1]
      ]

      return indexes
    },
    [trimmedEmptyRows[0].length - 1, 0]
  )

  const trimmedSchema = trimmedEmptyRows.map((row) => row.slice(trimIndexes[0], trimIndexes[1] + 1))

  return trimmedSchema
}

function trimAdjacentSchema(schema, frames, adjacent) {
  const frameLabels = [...frames, ...adjacent]

  let trimmedRows = schema.filter((row) => row.some((item) => frameLabels.includes(item)))

  let trimIndexes = trimmedRows.reduce(
    (indexesAcc, subArr) => {
      const startNonNullIndex = subArr.findIndex((item) => frameLabels.includes(item))
      const endNonNullIndex = subArr.findLastIndex((item) => frameLabels.includes(item))

      const indexes = [
        startNonNullIndex < indexesAcc[0] && startNonNullIndex > -1
          ? startNonNullIndex
          : indexesAcc[0],
        endNonNullIndex > indexesAcc[1] ? endNonNullIndex : indexesAcc[1]
      ]

      return indexes
    },
    [schema[0].length - 1, 0]
  )

  const trimmedSchema = trimmedRows.map((row) =>
    row.slice(trimIndexes[0], trimIndexes[1] + 1).map((frameLabel) => {
      const frameObj = {
        frameLabel,
        selectable: adjacent.includes(frameLabel),
        isTakenFrames: frames.includes(frameLabel),
        id: uuidv4()
      }

      return frameObj
    })
  )

  return trimmedSchema
}

function findLimit(fileNamesArr, nameRegex, isRowIdFirst) {
  const limit = {
    // alfa
    row: {
      min: '',
      max: ''
    },
    // num
    col: {
      min: '',
      max: ''
    }
  }

  for (const item of fileNamesArr) {
    const match = item.match(nameRegex)
    const row = match[isRowIdFirst ? 1 : 2] // alfa
    const col = match[isRowIdFirst ? 2 : 1] // num

    if (!limit.row.min) {
      limit.row.min = row
      limit.row.max = row

      limit.col.min = col
      limit.col.max = col

      continue
    }

    limit.row.min =
      Number(
        limit.row.min.split('').reduce((sum, curr) => sum + curr.charCodeAt().toString(), '')
      ) > row.split('').reduce((sum, curr) => sum + curr.charCodeAt().toString(), '')
        ? row
        : limit.row.min
    limit.row.max =
      Number(
        limit.row.max.split('').reduce((sum, curr) => sum + curr.charCodeAt().toString(), '')
      ) < Number(row.split('').reduce((sum, curr) => sum + curr.charCodeAt().toString(), ''))
        ? row
        : limit.row.max

    limit.col.min = limit.col.min > col ? col : limit.col.min
    limit.col.max = limit.col.max < col ? col : limit.col.max
  }
  return limit
}

function getRowIds(limit) {
  const { min, max } = limit.row

  const codeA = 'A'.charCodeAt(0)
  const codeZ = 'Z'.charCodeAt(0)
  const minCode = min.split('').map((item) => item.charCodeAt())
  const maxCode = max.split('').map((item) => item.charCodeAt())

  const combinations = []

  const currCode = [] //[65, 66]

  while (
    Number(currCode.reduce((sum, curr) => sum + curr.toString(), '')) <
      Number(maxCode.reduce((sum, curr) => sum + curr.toString(), '')) &&
    currCode.length <= max.length
  ) {
    if (!currCode.length) {
      currCode.push(...minCode)
      combinations.push([...currCode])
    }

    if (currCode.length) {
      for (let i = currCode.length - 1; i >= 0; i--) {
        if (currCode[i] < codeZ) {
          currCode[i] += 1
          break
        }

        if (currCode[i] === codeZ) {
          currCode[i] = codeA
          i === 0 ? currCode.unshift(codeA) : (currCode[i - 1] += 1)
          break
        }
      }
    }
    combinations.push([...currCode])
  }

  const rowIds = combinations.map((combCode) => String.fromCharCode(...combCode))

  return rowIds
}

async function downloadFile(_, data) {
  const {
    foldersPaths: { searchingPath, destinationFolderPath },
    fileName
  } = data

  try {
    const isSucceed = new Promise((res, rej) => {
      const searchingFileName = `${searchingPath}/${fileName}.laz`
      const fullName = path.basename(searchingFileName)
      const destinationFilePath = path.join(destinationFolderPath, fullName)
      fs.copyFile(
        searchingFileName,
        destinationFilePath,
        fs.constants.COPYFILE_EXCL,
        async (err) => {
          if (err) {
            console.error('error:', err)
            rej(err)
          } else {
            console.log('success')
            res(true)
          }
        }
      )
    })
      .then((data) => data)
      .catch(() => false)

    return await isSucceed
  } catch (e) {
    console.log(e.message)
    return false
  }
}

async function convertFiles(_, folderPath) {
  try {
    const sourceFilesFolder =
      is.dev && process.env['ELECTRON_RENDERER_URL']
        ? path.resolve('resources/serviceFiles')
        : path.join(__dirname, '../../../app.asar.unpacked/resources/serviceFiles')

    const targetFilesFolder = folderPath
    const batFilePath = path.join(targetFilesFolder, 'laz-searcher_laz_to_las.bat')
    console.log(sourceFilesFolder, targetFilesFolder)

    if (!isDirectoryHas('.laz', targetFilesFolder)) return null
    if (!isDirectoryHas('laszip.exe', targetFilesFolder)) {
      await copyFiles(sourceFilesFolder, targetFilesFolder, ['laszip.exe'])
    }
    if (!isDirectoryHas('laz-searcher_laz_to_las.bat', targetFilesFolder)) {
      createBatFile(targetFilesFolder)
    }

    exec(`start "" "${batFilePath}"`, (error) => {
      if (error) {
        console.error(`Error of execution .bat file: ${error.message}`)
        return
      }
      console.log('Execution .bat file was over.')
    })
  } catch (error) {
    console.error('Error in function unArchive:', error.message)
  }
}

async function copyFiles(sourceFolder, targetFolder, files) {
  for (const file of files) {
    const sourcePath = path.join(sourceFolder, file)
    const targetPath = path.join(targetFolder, file)
    await fs.copyFile(sourcePath, targetPath, fs.constants.COPYFILE_EXCL, async (err) => {
      if (err) {
        console.error('error:', err)
      } else {
        console.log('success')
      }
    })
    console.log(`File '${file}' copied to '${targetFolder}'.`)
  }
}

function createBatFile(destinationFolderPath) {
  const batContent = `@echo off
cd "${destinationFolderPath}"
laszip -i *.laz -olas
del *.laz  rem
exit`

  const batFilePath = path.join(destinationFolderPath, 'laz-searcher_laz_to_las.bat')

  fs.writeFileSync(batFilePath, batContent)

  console.log(`.bat file created at: ${batFilePath}`)
}

async function checkFolders(_, block) {
  const { searchingPath, destPath, pathType } = getSetups()
  const blockPath = path.join(destPath, block)

  let destinationFolderPath
  try {
    if (!fs.existsSync(blockPath)) {
      fs.mkdirSync(blockPath)

      const newFolderPath = path.join(blockPath, '1')
      fs.mkdirSync(newFolderPath)

      destinationFolderPath = newFolderPath

      console.log(`Folder '1' is created in '${block}'.`)

      console.log(`Folder '${block}' was created.`)
    } else {
      console.log(`Folder '${block}' have already exist.`)

      const subFolders = fs
        .readdirSync(blockPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory())
        .map((dirent) => dirent.name)

      if (subFolders.length > 0) {
        const lastFolder = subFolders.sort((a, b) => parseInt(b) - parseInt(a))[0]

        const lastFolderPath = path.join(blockPath, lastFolder)

        console.log('laz', lastFolderPath, !isDirectoryHas('.laz', lastFolderPath))
        console.log('las', !isDirectoryHas('.las', lastFolderPath))

        if (!isDirectoryHas('.laz', lastFolderPath) && !isDirectoryHas('.las', lastFolderPath)) {
          destinationFolderPath = lastFolderPath
        } else {
          const nextFolderNumber = parseInt(lastFolder) + 1

          const newFolderPath = path.join(blockPath, nextFolderNumber.toString())
          fs.mkdirSync(newFolderPath)

          destinationFolderPath = newFolderPath

          console.log(`Folder '${nextFolderNumber}' is created in '${block}'.`)
        }
      } else {
        const newFolderPath = path.join(blockPath, '1')
        destinationFolderPath = 1
        fs.mkdirSync(newFolderPath)

        destinationFolderPath = newFolderPath
        console.log(`Folder '1' is created in '${block}'.`)
      }
    }

    const destinationSearchingPath =
      pathType === 'root' ? `${searchingPath}/${block}/LAZ` : searchingPath

    // const files = fs.readdirSync(searchingPath);
    // files.some((file) => path.extname(file) === '.laz')
    return { searchingPath: destinationSearchingPath, destinationFolderPath }
  } catch (error) {
    console.error('Error checking for .laz files:', error.message)
    return false
  }
}

function isDirectoryHas(type, directoryPath) {
  const regex = new RegExp(`${type}$`)
  try {
    const files = fs.readdirSync(directoryPath)
    return files.some((file) => regex.test(file))
  } catch (error) {
    console.error('Error checking if directory is empty:', error.message)
    return false
  }
}

async function saveNewFramesInDB(_, data) {
  // data={
  //   frames:['N-34-124-C-c-1-3-1-1', 'N-34-124-C-c-1-3-1-2', 'N-34-124-C-c-1-3-1-3', 'N-34-124-C-c-1-3-1-4'],
  //   block: '2701',
  //   framesLocation:"C:\lidar\test\2701\1",
  // };
  //! place where should make checking of file name and then decide how to make schema and save data

  data.setup = getSetups()
  data.blockFrames = await getAllBlocksFrames(data.block)
  data.nameScheme = analyzeFileName(data.frames[0])
  data.schemaAble =
    data.nameScheme.name === 'N' || data.nameScheme.name === 'na' || data.nameScheme.name === 'a_n'

  data.schema = createFramesSchema(data.blockFrames, data.nameScheme)

  data.adjacentFrames = getAdjacentFrames(data.frames, data.schema)
  data.adjacentSchema = trimAdjacentSchema(data.schema, data.frames, data.adjacentFrames)

  data.id = uuidv4()

  frames.addNewFrames(data)
  return data
}

function getAdjacentFrames(frames, schema) {
  const adjacentFrames = []

  schema.forEach((row, index) =>
    row.forEach((frameName, i) => {
      frameName != null &&
      !frames.includes(frameName) &&
      (frames.includes(row[i + 1]) ||
        frames.includes(row[i - 1]) ||
        frames.includes(schema[index - 1]?.[i]) ||
        frames.includes(schema[index + 1]?.[i]))
        ? adjacentFrames.push(frameName)
        : null
    })
  )
  return adjacentFrames
}

function createFramesSchema(frames, nameScheme) {
  let schema
  switch (nameScheme.name) {
    case 'N':
      schema = createSchemeNType(frames)
      break
    case 'na':
      schema = createSchemeNAType(frames)
      break

    case 'a_n':
      schema = createSchemeA_NType(frames)
      break

    default:
      schema = []
      break
  }
  return schema
}

async function getAllBlocksFrames(block) {
  await checkAccessToken(oAuth2Client.credentials)

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client })
  const range = `${getSetups().selectedSpreadsheet.sheetName}`

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: getSetups().selectedSpreadsheet.spreadsheetId,
      range
    })

    const values = response.data.values
    if (!values || values.length === 0) {
      throw new Error('У таблиці немає даних.')
    }

    const results = []
    for (let i = 0; i < values.length; i++) {
      // const currentBlock = values[i][1] // Column B
      const currentBlock = values[i][2] // Column C
      const section = values[i][3] // Column D

      if (currentBlock === block) {
        results.push(section)
      }
    }

    return results
  } catch (error) {
    console.error(`Error getting data from Google Sheets: ${error.message}`)
    throw error
  }
}

function isPathValid(_, path) {
  try {
    fs.accessSync(path, fs.constants.F_OK)
    return true
  } catch (err) {
    return false
  }
}

function analyzeFileName(fileName) {
  let result = {}

  // Check: 'a_1', 'a_2', 'b_1'
  let match = fileName.match(/^([A-Za-z]{1,})_([0-9]{1,})$/)
  if (match) {
    result.name = 'a_n'
    result.regex = /^([A-Za-z]{1,})_([0-9]{1,})$/
    result.isRowIdFirst = true
    result.divider = '_'
    return result
  }
  console.log(result)
  // Check: '1a', '2a', '1b'
  match = fileName.match(/^([0-9]{1,})([A-Za-z]{1,})$/)
  if (match) {
    result.name = 'na'
    result.regex = /^([0-9]{1,})([A-Za-z]{1,})$/
    result.isRowIdFirst = false
    result.divider = ''
    return result
  }

  // Check: 'a1', 'a2', 'b1'
  match = fileName.match(/^([A-Za-z]{1,})([0-9]{1,})$/)
  if (match) {
    result.name = 'an'
    result.regex = /^([A-Za-z]{1,})([0-9]{1,})$/
    result.isRowIdFirst = true
    result.divider = ''
    return result
  }

  // Check: 'N-34-124-C-c-1-3-1-1'
  let match4 = fileName.match(
    /^[A-Z]-([0-9]{1,3})-([0-9]{1,3})-([A-Z])-([a-z])-([0-9])-([0-9])-([0-9])-([0-9])$/
  )
  if (match4) {
    result.name = 'N'
    return result
  }

  result.name = 'Unknown'
  return result
}
