import InfoOutlined from '@mui/icons-material/InfoOutlined'
import {
  Button,
  Checkbox,
  FormControl,
  FormHelperText,
  Input,
  FormLabel,
  CircularProgress
} from '@mui/joy'
import { Grid, Box } from '@mui/material'
import { useFormik } from 'formik'
import PropTypes from 'prop-types'
import * as Yup from 'yup'
import SpanDecorator from './shared/SpanDecorator'
import { useEffect } from 'react'
import Done from '@mui/icons-material/Done'

Yup.addMethod(Yup.string, 'isPathValid', function (errMsg) {
  return this.test('test-valid-path', errMsg, async function (value) {
    const { path, createError } = this
    const isIdValid = await electronApi.isPathValid(value)
    return isIdValid || createError({ path, message: errMsg })
  })
})

const AdjacentSchema = Yup.object().shape({
  copyFrom: Yup.string().required('Copying path is required').isPathValid('Path is not valid'),
  pasteTo: Yup.string().required('Pasting path is required').isPathValid('Path is not valid'),
  frameNames: Yup.array().min(1, 'You must select at least one frame name')
})

function AdjacentForm({ framesObj }) {
  const { handleSubmit, values, handleChange, errors, status, setStatus, resetForm } = useFormik({
    initialValues: {
      copyFrom: framesObj.takenFrom,
      pasteTo: framesObj.framesLocation,
      frameNames: []
    },
    onSubmit: onSubmit,
    validationSchema: AdjacentSchema
  })

  async function onSubmit(data) {
    try {
      setStatus('progress')
      for (const frameName of data.frameNames) {
        // ! make: add changing download status for a file

        const res = await electronApi.downloadFile({
          foldersPaths: {
            searchingPath: data.copyFrom,
            destinationFolderPath: data.pasteTo
          },
          fileName: frameName
        })

        console.log(frameName)
      }

      electronApi.unArchive(data.pasteTo)

      resetForm()
    } catch (e) {
      console.error(e)
    } finally {
      setStatus('')
    }
  }

  useEffect(() => {}, [framesObj])

  const onChoosePath = async (e) => {
    const path = await electronApi.choosePath()
    if (path) {
      const synthEvent = {
        target: {
          value: path,
          name: e.target.name
        }
      }
      handleChange(synthEvent)
    }
  }
  return (
    <Box
      component="form"
      onSubmit={handleSubmit}
      sx={{ mt: 2 }}
      onClick={(e) => {
        if (status !== 'progress') return
        e.preventDefault()
      }}
    >
      <Grid container spacing={1} direction="column">
        <Grid item>
          <FormLabel
            id="storage-label"
            sx={{
              fontWeight: 'xl',
              textTransform: 'uppercase',
              fontSize: 'xs',
              letterSpacing: '0.15rem'
            }}
          >
            Adjacent frames
          </FormLabel>
        </Grid>

        <Grid item>
          <FormControl error={!!errors.copyFrom}>
            <Input
              startDecorator={<SpanDecorator label="Copy from" />}
              endDecorator={
                <Button onClick={onChoosePath} variant="soft" name="copyFrom">
                  Change Path
                </Button>
              }
              onChange={handleChange}
              name="copyFrom"
              value={values.copyFrom}
              readOnly
            />
            {!!errors.copyFrom && (
              <FormHelperText>
                <InfoOutlined />
                {errors.copyFrom}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item>
          <FormControl error={!!errors.pasteTo}>
            <Input
              startDecorator={<SpanDecorator label="Paste to" />}
              endDecorator={
                <Button onClick={onChoosePath} variant="soft" name="pasteTo">
                  Change Path
                </Button>
              }
              name="pasteTo"
              onChange={handleChange}
              value={values.pasteTo}
              readOnly
            />
            {!!errors.pasteTo && (
              <FormHelperText>
                <InfoOutlined />
                {errors.pasteTo}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>

        {
          //! with big scale might not work. Leak of space could brake structure
        }
        <Grid item>
          {framesObj.adjacentSchema.map((row, index) => {
            return (
              <Box
                key={index}
                // onClick={(e) => {
                //   e.preventDefault()
                // }}
              >
                {row.map((frameObj) => (
                  // frameObj = {
                  //   "frameLabel": "N-34-123-D-d-2-2-4-4",
                  //   "selectable": false,
                  //   "isTakenFrames": false
                  // }
                  <Checkbox
                    key={frameObj.frameLabel}
                    disableIcon
                    disabled={!frameObj.selectable || frameObj.isTakenFrames}
                    variant="solid"
                    label={
                      <>
                        <DownloadStatusFeedback status={frameObj.downloadStatus} />
                        {frameObj.frameLabel}
                      </>
                    }
                    value={frameObj.frameLabel}
                    name="frameNames"
                    onChange={handleChange}
                    sx={{ height: '60px', alignItems: 'center', px: 1 }}
                    checked={values.frameNames.includes(frameObj.frameLabel)}
                  />
                ))}
              </Box>
            )
          })}

          <FormControl error={!!errors.frameNames}>
            {!!errors.frameNames && (
              <FormHelperText>
                <InfoOutlined />
                {errors.frameNames}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid item>
          <Button type="submit" endDecorator={<DownloadStatusFeedback status={status} />}>
            Copy
          </Button>
        </Grid>
      </Grid>
    </Box>
  )
}

function DownloadStatusFeedback({ status }) {
  return status === 'progress' ? (
    <CircularProgress color="neutral" variant="plain" size="sm" />
  ) : status === 'done' ? (
    <Done fontSize="medium" color="success" sx={{ ml: -0.5, zIndex: 2, pointerEvents: 'none' }} />
  ) : (
    ''
  )
}

AdjacentForm.propTypes = {
  framesObj: PropTypes.shape({
    adjacentFrames: PropTypes.arrayOf(PropTypes.string),
    adjacentSchema: PropTypes.arrayOf(
      PropTypes.arrayOf(
        PropTypes.shape({
          frameLabel: PropTypes.string.isRequired,
          isTakenFrames: PropTypes.bool.isRequired,
          selectable: PropTypes.bool.isRequired
        })
      )
    ),
    block: PropTypes.string.isRequired,
    frames: PropTypes.arrayOf(PropTypes.string),
    framesLocation: PropTypes.string.isRequired,
    id: PropTypes.string.isRequired,
    schema: PropTypes.arrayOf(PropTypes.array),
    setup: PropTypes.object,
    takenFrom: PropTypes.string.isRequired
  })
}

export default AdjacentForm
