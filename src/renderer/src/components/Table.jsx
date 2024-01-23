import InfoOutlined from '@mui/icons-material/InfoOutlined'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import {
  Button,
  ButtonGroup,
  Checkbox,
  CircularProgress,
  FormControl,
  FormHelperText,
  Option,
  Select,
  Sheet,
  Table,
  Typography,
  Box
} from '@mui/joy'
import { selectClasses } from '@mui/joy/Select'
import PropTypes from 'prop-types'

import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import { changeDownloadStatus, fetchNewFrames, fetchTakenFrames } from '../store/framesSlice'
import { useFormik } from 'formik'
import SpanDecorator from './shared/SpanDecorator'

const DATE_REG_EX = /^\d{2}.\d{2}$/

function TableStripe({ isSaved, isDownloading, setIsDownloading }) {
  const { frames, message } = useSelector((state) => state.frames)
  const [framesDisplayingData, setFramesDisplayingData] = useState({
    filteredFrames: [],
    blocks: []
  })
  const [filter, setFilter] = useState({
    new: true
  })
  const { handleSubmit, values, handleChange, errors, setValues, status, setStatus } = useFormik({
    initialValues: { block: '', frames: [] },
    onSubmit: downloadFrames
  })
  const dispatch = useDispatch()

  const onFindFrames = () => dispatch(fetchNewFrames())

  async function downloadFrames(data) {
    console.log(data)
    if (!data.frames.length) return

    setIsDownloading(true)

    data.frames.forEach((section) => {
      dispatch(changeDownloadStatus({ section, status: 'pending' }))
    })

    try {
      // make check for block name
      const foldersPaths = await window.electronApi.checkFolders(data.block)

      if (foldersPaths.searchingPath && foldersPaths.destinationFolderPath) {
        for (const frame of data.frames) {
          dispatch(changeDownloadStatus({ section: frame, status: 'progress' }))

          const res = await window.electronApi.downloadFile({
            foldersPaths,
            fileName: frame
          })
          dispatch(changeDownloadStatus({ section: frame, status: res ? 'done' : 'error' }))
        }

        // unarchive downloaded files in destination folder
        window.electronApi.unArchive(foldersPaths.destinationFolderPath)

        const dataForDB = {
          frames: data.frames,
          block: data.block,
          framesLocation: foldersPaths.destinationFolderPath,
          takenFrom: foldersPaths.searchingPath
        }

        await window.electronApi.saveNewFramesInDB(dataForDB)
      }
    } catch (e) {
      console.error(e.message)
    } finally {
      // make some ui changes
      dispatch(fetchTakenFrames())
      setIsDownloading(false)
    }
  }

  useEffect(() => {
    if (!frames.length) {
      setFramesDisplayingData({
        filteredFrames: [],
        blocks: []
      })
      setValues({ frames: [], block: '' })

      return
    }

    const blocks = frames.reduce((acc, item) => {
      !acc.includes(item.part) && acc.push(item.part)
      return acc
    }, [])

    setValues({ ...values, block: blocks[0] })

    setFramesDisplayingData((prev) => ({
      ...prev,
      blocks: blocks
    }))
  }, [frames])

  useEffect(() => {
    if (filter.new) {
      const filteredFrames = frames.filter(
        (item) =>
          item.done === '0,000' && (item.check === undefined || !item.check?.match(DATE_REG_EX))
      )

      setFramesDisplayingData((prev) => ({ ...prev, filteredFrames }))
      setValues((prev) => ({
        ...prev,
        frames: filteredFrames.map((item) => item.section)
      }))

      return
    }

    const filteredFrames = frames.filter((item) => item.part === values.block)

    setValues((prev) => ({ ...prev, frames: filteredFrames.map((item) => item.section) }))
    setFramesDisplayingData((prev) => ({
      ...prev,
      filteredFrames
    }))
  }, [filter.new, values.block])

  const onSelectChange = (e, newValue, name) => {
    const synthEvent = {
      target: {
        value: newValue,
        name
      }
    }
    handleChange(synthEvent)
  }

  // figure out how to combine selected frames with necessary block for downloading
  return (
    <Sheet>
      {/* {console.log(frames)} */}
      <Box component="form" onSubmit={handleSubmit}>
        <ButtonGroup spacing={1} variant="outlined" sx={{ mb: 1 }}>
          <Button color="primary" onClick={onFindFrames} disabled={!isSaved || isDownloading}>
            Find frames
          </Button>
          <Button
            color="success"
            // onClick={!isDownloading ? downloadFrames : () => {}}
            variant={isDownloading ? 'solid' : ''}
            type="submit"
            startDecorator={isDownloading ? <CircularProgress variant="solid" /> : ''}
          >
            {isDownloading ? 'Downloading' : 'Download frames'}
          </Button>
          <Checkbox
            label="New"
            onChange={(e) => setFilter((prev) => ({ ...prev, new: e.target.checked }))}
            checked={filter.new}
          />
        </ButtonGroup>
        <Table
          aria-label="striped table"
          color="primary"
          variant="outlined"
          stripe="odd"
          // borderAxis="xBetween"
          borderAxis="both"
        >
          <thead>
            <tr>
              <th style={{ width: '5%' }}>
                <Checkbox label="All" indeterminate={true} size="sm" />
              </th>
              {/* {console.log(values)} */}
              {/* <Box>Row #</Box> */}
              <Box sx={{ verticalAlign: 'middle' }} component="th">
                <FormControl error={!!errors.block}>
                  <Select
                    indicator={<KeyboardArrowDown />}
                    startDecorator={<SpanDecorator label="Block" />}
                    name="block"
                    id="block"
                    value={values.block}
                    onChange={(e, newValue) => onSelectChange(e, newValue, 'block')}
                    sx={{
                      widBox: '100%',
                      [`& .${selectClasses.indicator}`]: {
                        transition: '0.2s',
                        [`&.${selectClasses.expanded}`]: {
                          transform: 'rotate(-180deg)'
                        }
                      }
                    }}
                  >
                    {framesDisplayingData.blocks.map((item, index) => (
                      <Option key={item} value={item} selected={index === 0}>
                        {item}
                      </Option>
                    ))}
                    {/* {console.log(filteredFrames)} */}
                  </Select>
                  {!!errors.block && (
                    <FormHelperText>
                      <InfoOutlined />
                      {errors.block}
                    </FormHelperText>
                  )}
                </FormControl>
              </Box>
              <th>Section</th>
              <th>Operator</th>
              <th style={{ width: '8%' }}>Done</th>
              <th style={{ width: '8%' }}>Left</th>
              <th>Check</th>
              <th style={{ width: '8%' }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {message ? (
              <tr>
                <td colSpan={7}>
                  <Typography level="title-sm">{message}</Typography>
                </td>
              </tr>
            ) : (
              framesDisplayingData.filteredFrames.map((row) => (
                <tr key={row.num}>
                  <td>
                    <Checkbox
                      value={row.section}
                      size="sm"
                      checked={values.frames.includes(row.section)}
                      onChange={handleChange}
                      name="frames"
                    />
                  </td>
                  {/* <td>{row.num}</td> */}
                  {/* <td>{row.block}</td> */}
                  <td>{row.part}</td>
                  <td>{row.section}</td>
                  <td>{row.operator}</td>
                  {/* <td>{row.total}</td> */}
                  <td>{row.done}</td>
                  <td>{row.left}</td>
                  <td>{row.check}</td>
                  <td>
                    <Typography
                      color={
                        row.status === 'done'
                          ? 'success'
                          : row.status === 'progress'
                            ? 'primary'
                            : row.status === 'error'
                              ? 'danger'
                              : row.status === 'pending'
                                ? 'warning'
                                : 'neutral'
                      }
                      level="title-md"
                      variant="plain"
                      // textAlign="center"
                    >
                      {row.status}
                    </Typography>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </Table>
      </Box>
    </Sheet>
  )
}

TableStripe.propTypes = {
  isSaved: PropTypes.bool.isRequired,
  isDownloading: PropTypes.bool.isRequired,
  setIsDownloading: PropTypes.func.isRequired
}

export default TableStripe
