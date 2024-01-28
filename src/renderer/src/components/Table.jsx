import InfoOutlined from '@mui/icons-material/InfoOutlined'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import {
  Box,
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
  Typography
} from '@mui/joy'
import { selectClasses } from '@mui/joy/Select'
import PropTypes from 'prop-types'

import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import {
  changeDownloadStatus,
  fetchFrames,
  fetchTakenFrames,
  selectBlock,
  toggleAllSelect,
  toggleFilterNew,
  toggleFrameSelect
} from '../store/framesSlice'
import SpanDecorator from './shared/SpanDecorator'

function TableStripe({ isSaved, isDownloading, setIsDownloading }) {
  const { message, filters, filteredFrames } = useSelector((state) => state.frames)
  const dispatch = useDispatch()

  const [allFlag, setAllFlag] = useState({ indeterminate: false, checked: false })
  const { handleSubmit, errors, setValues } = useFormik({
    initialValues: { block: '', frames: [] },
    onSubmit: downloadFrames
  })

  const onFindFrames = () => dispatch(fetchFrames())

  async function downloadFrames(data) {
    dispatch(changeDownloadStatus())

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
    const selectedFrames = filteredFrames
      .filter((frame) => frame.selected)
      .map((frame) => frame.section)

    setAllFlag(
      selectedFrames.length === 0 || filteredFrames.length === 0
        ? { indeterminate: false, checked: false }
        : selectedFrames.length === filteredFrames.length
          ? { indeterminate: false, checked: true }
          : { indeterminate: true, checked: false }
    )

    if (!filteredFrames.length) {
      setValues({ frames: [], block: '' })
      return
    }

    setValues({
      frames: selectedFrames,
      block: filters.selectedBlock
    })
  }, [filteredFrames, filters])

  const onToggleNew = (e) => dispatch(toggleFilterNew(e.target.checked))

  const onSelectBlock = (_, newValue) => {
    return dispatch(selectBlock(newValue))
  }
  const onFrameChecked = (e) => {
    dispatch(toggleFrameSelect({ select: e.target.checked, section: e.target.value }))
  }
  const onAllChange = (e) => {
    dispatch(toggleAllSelect(e.target.checked))
  }

  return (
    <Sheet>
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
          <Checkbox label="New" onChange={onToggleNew} checked={filters.new} />
        </ButtonGroup>
        <Table
          aria-label="striped table"
          color="primary"
          variant="outlined"
          stripe="odd"
          borderAxis="xBetween"
          // borderAxis="both"
        >
          <thead>
            <tr>
              <th style={{ width: '5%' }}>
                <Checkbox
                  label="All"
                  indeterminate={allFlag.indeterminate}
                  checked={allFlag.checked}
                  onChange={onAllChange}
                  size="sm"
                />
              </th>
              {/* <Box>Row #</Box> */}
              <Box sx={{ verticalAlign: 'middle' }} component="th">
                <FormControl error={!!errors.block}>
                  <Select
                    indicator={<KeyboardArrowDown />}
                    startDecorator={<SpanDecorator label="Block" />}
                    name="block"
                    id="block"
                    value={filters.selectedBlock}
                    onChange={onSelectBlock}
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
                    {filters.blocks.map((block) => (
                      <Option key={block} value={block} selected={block === filters.selectedBlock}>
                        {block}
                      </Option>
                    ))}
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
              filteredFrames?.map((frame) => (
                <tr key={frame.num}>
                  <td>
                    <Checkbox
                      value={frame.section}
                      size="sm"
                      checked={frame.selected}
                      onChange={onFrameChecked}
                      name="frames"
                    />
                  </td>
                  {/* <td>{row.num}</td> */}
                  {/* <td>{row.block}</td> */}
                  <td>{frame.part}</td>
                  <td>{frame.section}</td>
                  <td>{frame.operator}</td>
                  {/* <td>{row.total}</td> */}
                  <td>{frame.done}</td>
                  <td>{frame.left}</td>
                  <td>{frame.check}</td>
                  <td>
                    <Typography
                      color={
                        frame.status === 'done'
                          ? 'success'
                          : frame.status === 'progress'
                            ? 'primary'
                            : frame.status === 'error'
                              ? 'danger'
                              : frame.status === 'pending'
                                ? 'warning'
                                : 'neutral'
                      }
                      level="title-md"
                      variant="plain"
                      // textAlign="center"
                    >
                      {frame.status}
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
