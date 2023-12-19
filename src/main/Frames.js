import fs from 'fs'
import * as path from 'path'

const FRAMES_PATH = path.resolve('resources/frames.json')

class Frames {
  constructor(path) {
    this.path = path

    !this.isFileExist() && this.createFile([])
  }

  createFile(data) {
    const jsonData = JSON.stringify(data, null, 2)

    try {
      fs.writeFileSync(this.path, jsonData)
      return true
    } catch (err) {
      console.error(`Error create file ${this.path}: ${err.message}`)
      return err.message
    }
  }

  isFileExist() {
    try {
      fs.accessSync(this.path, fs.constants.F_OK)
      return true
    } catch (err) {
      return false
    }
  }

  getFramesData() {
    try {
      console.log(this.path)
      const fileContent = fs.readFileSync(this.path, 'utf-8')
      const framesData = JSON.parse(fileContent)

      return framesData
    } catch (err) {
      console.error(`Error reading file ${this.path}: ${err.message}`)
      return null
    }
  }

  addNewFrames(frames) {
    // data={
    //    frames:['N-34-124-C-c-1-3-1-1', 'N-34-124-C-c-1-3-1-2', 'N-34-124-C-c-1-3-1-3', 'N-34-124-C-c-1-3-1-4'],
    //    block: '2701',
    //    framesLocation:"C:\lidar\test\2701\1",
    //    schema:[]
    //    adjacentFrames:[]
    //    id: uuidv4()
    // };

    const dataFrames = this.getFramesData()

    dataFrames.push(frames)

    this.saveFrames(dataFrames)
  }

  deleteFrames(id) {
    const dataFrames = this.getFramesData()

    const filteredDataFrames = dataFrames.filter((frameObj) => frameObj.id !== id)

    this.saveFrames(filteredDataFrames)
  }

  saveFrames(frames) {
    try {
      const jsonFrames = JSON.stringify(frames, null, 2)

      fs.writeFileSync(this.path, jsonFrames)

      console.log(`Frames data successfully saved to ${this.path}.`)
      return true
    } catch (err) {
      console.error(`Error saving frames data to ${this.path}: ${err.message}`)
      return false
    }
  }
}

const frames = new Frames(FRAMES_PATH)

export { frames }
