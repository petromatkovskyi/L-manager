import { BrowserWindow, dialog } from 'electron'
// import express from 'express';
import fs from 'fs'
import { google } from 'googleapis'
import sqlite3 from 'sqlite3'
// import { exec } from 'child_process';
import * as path from 'path'

const SCOPES = ['https://www.googleapis.com/auth/spreadsheets']
const { operators } = require(path.resolve('src/main/OPERATORS.json'))

const SETUP_PATH = path.resolve('src/main/setup.json')
const TOKEN_PATH = path.resolve('src/main/token.json')
const CREDENTIALS_PATH = path.resolve('src/main/cred/credentials.json')
const dbPath = path.resolve('src/main/db/appdata.sql')

const credentials = require(CREDENTIALS_PATH)

const { client_secret, client_id, redirect_uris } = credentials.installed

const oAuth2Client = new google.auth.OAuth2(client_id, client_secret, redirect_uris)

const db = new sqlite3.Database(dbPath)

async function authorize() {
  return new Promise((res) => {
    const authUrl = oAuth2Client.generateAuthUrl({
      access_type: 'offline',
      scope: SCOPES,
      prompt: 'select_account '
    })

    // console.log('authUrl', authUrl);

    const authWindow = new BrowserWindow({
      width: 1000,
      height: 800,
      webPreferences: {
        nodeIntegration: true,
        contextIsolation: false
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

          // mainWindow.loadURL(`http://localhost:3000/form`);
          res()
        })
      }
    })
  })
}

async function checkAccessToken(clientToken) {
  let token = clientToken || null
  try {
    if (!clientToken) {
      const tokenData = fs.readFileSync(TOKEN_PATH, 'utf8')
      token = JSON.parse(tokenData)
    }

    if (token && token.expiry_date > Date.now()) {
      oAuth2Client.setCredentials(token)

      return true
    } else if (token && token.refresh_token) {
      await refreshAccessToken(token.refresh_token)

      return true
    } else {
      await authorize()
      return null
    }
  } catch (error) {
    console.error('Error while reading file: ', error.message)
    return null
  }
}

async function refreshAccessToken(refreshToken) {
  return await new Promise((resolve, reject) => {
    oAuth2Client.setCredentials({ refresh_token: refreshToken })

    oAuth2Client.refreshAccessToken((err, newToken) => {
      if (err) {
        reject(err)
      } else {
        oAuth2Client.setCredentials(newToken)
        fs.writeFileSync(TOKEN_PATH, JSON.stringify(newToken))

        resolve(newToken)
      }
    })
  })
}

function getSetups() {
  try {
    const data = fs.readFileSync(SETUP_PATH, 'utf8')
    // console.log(data);
    if (data) {
      const jsonData = JSON.parse(data)
      return jsonData
    }
    return false
  } catch (err) {
    console.error('Error getting JSON:', err)
    throw err
  }
}

function saveSetups(req, setups) {
  const {
    pathType,
    searchingPath,
    destPath,
    operatorName,
    spreadsheetLink,
    spreadsheetId,
    sheetName
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
    fs.writeFileSync(SETUP_PATH, JSON.stringify(setups), (err) => {
      if (err) {
        console.error('Error saving setups: ', err.message)
      }
      console.log('Setups stored in setup.json')
    })

    // fs.writeFile(SETUP_PATH, JSON.stringify(data), (err) => {
    //   if (err) {
    //     console.error('Error saving setups: ', err.message);
    //   }
    //   console.log('Setups stored in setup.json');
    // });

    return { success: true, message: 'Setups are saved' }
  } else if (operators.includes(operatorName)) {
    return { success: false, message: 'Operator is not appropriate' }
  } else {
    return { success: false, message: 'Something went wrong...' }
  }
}

async function choosePath() {
  try {
    const result = await dialog.showOpenDialog({
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
  }
}

async function getSheetNames(req, data) {
  const auth = oAuth2Client

  await checkAccessToken(auth.credentials)

  const { spreadsheetId } = data?.spreadsheetId ? data : getSetups()

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

async function checkSpreadSheetId(req, id) {
  const auth = oAuth2Client

  await checkAccessToken(auth.credentials)

  if (!id) {
    throw new Error('Spreed sheet id empty')
  }

  const sheets = google.sheets({ version: 'v4', auth })

  try {
    const response = await sheets.spreadsheets.get({
      spreadsheetId: id
    })
    return !!response?.data?.properties?.title
  } catch (error) {
    console.error('Error getting sheet titles:', error.message)
    return null
  }
}

async function findNewFrames() {
  const auth = oAuth2Client

  await checkAccessToken(auth.credentials)

  const { spreadsheetId, sheetName, operatorName } = getSetups()

  const sheets = google.sheets({ version: 'v4', auth })

  const range = `${sheetName}`

  const DATE_REG_EX = /^\d{2}.\d{2}$/

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId,
      range
    })

    const values = response.data.values
    if (!values || values.length === 0) {
      throw new Error('У таблиці немає даних.')
    }

    const results = []
    for (let i = 0; i < values.length; i++) {
      const operatorCell = values[i][4]

      const rowNumber = i + 1
      const block = values[i][1] // Column B
      const section = values[i][3] // Column D
      const operator = values[i][4] // Column E
      const done = values[i][6] // Column G
      const check = values[i][9] // Column J

      if (
        operatorCell &&
        operatorCell.includes(operatorName) &&
        done === '0,000' &&
        (check === undefined || !check?.match(DATE_REG_EX))
      ) {
        results.push({ num: rowNumber, block, section, operator, done, check })
      }
    }

    return results
  } catch (error) {
    console.error(`Error getting data from Google Sheets: ${error.message}`)
    throw error
  }
}

function createFramesScheme(files) {
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
        console.log('12')
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

  const newMap = configuredLists.map((row) =>
    row.map((listName) => (files.includes(listName) ? listName : null))
  )

  return trimSchema(newMap)
}

function trimSchema(schema) {
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

  trimmedEmptyRows = trimmedEmptyRows.map((row) => row.slice(trimIndexes[0], trimIndexes[1] + 1))

  return trimmedEmptyRows
}

async function downloadFile(req, data) {
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

async function checkFolders(req, data) {
  const { searchingPath, destPath, pathType } = getSetups()
  console.log(searchingPath, destPath, pathType)
  const { block } = data
  const blockPath = path.join(destPath, block)
  console.log(blockPath)

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
  data.setup = JSON.stringify(getSetups())
  data.schema = `${createFramesScheme(await getAllBlocksFrames(data.block))}`
  data.adjacentFrames = getAdjacentFrames(data.frames, data.schema)

  await insertDataIntoFramesTable(data)
  const dbData = await getAllFrames()

  return dbData
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
  console.log(adjacentFrames)
  return adjacentFrames
}

async function getAllBlocksFrames(block) {
  await checkAccessToken(oAuth2Client.credentials)

  const sheets = google.sheets({ version: 'v4', auth: oAuth2Client })
  const range = `${getSetups().sheetName}`

  try {
    const response = await sheets.spreadsheets.values.get({
      spreadsheetId: getSetups().spreadsheetId,
      range
    })

    const values = response.data.values
    if (!values || values.length === 0) {
      throw new Error('У таблиці немає даних.')
    }

    const results = []
    for (let i = 0; i < values.length; i++) {
      const currentBlock = values[i][1] // Column B
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

async function insertDataIntoFramesTable(dataToInsert) {
  const insertQuery = `
    INSERT INTO frames (schema, block, frames, siblings, framesLocation, setup)
    VALUES (?, ?, ?, ?, ?, ?)
  `

  return await new Promise((resolve, reject) => {
    db.run(
      insertQuery,
      [
        dataToInsert.schema,
        dataToInsert.block,
        dataToInsert.frames,
        dataToInsert.siblings,
        dataToInsert.framesLocation,
        dataToInsert.setup
      ],
      function (err) {
        if (err) {
          console.error(`Error inserting data: ${err.message}`)
          reject(err)
        } else {
          console.log(`Data inserted successfully with row ID ${this.lastID}`)
          resolve(this.lastID)
        }

        db.close()
      }
    )
  })
}

async function getAllFrames() {
  const selectQuery = 'SELECT * FROM frames'

  return await new Promise((resolve, reject) => {
    db.all(selectQuery, [], (err, rows) => {
      if (err) {
        console.error(`Error querying frames: ${err.message}`)
        reject(err)
      } else {
        resolve(rows)
      }

      db.close()
    })
  })
}
export const func = {
  getAllFrames,
  insertDataIntoFramesTable,
  getAllBlocksFrames,
  getAdjacentFrames,
  isDirectoryHas,
  checkFolders,
  saveNewFramesInDB,
  downloadFile,
  trimSchema,
  createFramesScheme,
  findNewFrames,
  checkSpreadSheetId,
  getSheetNames,
  choosePath,
  saveSetups,
  getSetups,
  refreshAccessToken,
  checkAccessToken,
  authorize
}
