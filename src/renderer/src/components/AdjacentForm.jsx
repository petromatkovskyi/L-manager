import Done from '@mui/icons-material/Done'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import {
  Button,
  CircularProgress,
  FormControl,
  FormHelperText,
  FormLabel,
  Input,
  Typography
} from '@mui/joy'
import { Box, Grid } from '@mui/material'
import { useFormik } from 'formik'
import PropTypes from 'prop-types'
import { useEffect } from 'react'
import * as Yup from 'yup'
import AdjacentFramesDisplay from './AdjacentFramesDisplay'
import SpanDecorator from './shared/SpanDecorator'

Yup.addMethod(Yup.string, 'isPathValid', function (errMsg) {
  return this.test('test-valid-path', errMsg, async function (value) {
    const { path, createError } = this
    const isIdValid = await window.electronApi.isPathValid(value)
    return isIdValid || createError({ path, message: errMsg })
  })
})

const AdjacentSchema = Yup.object().shape({
  copyFrom: Yup.string().required('Copying path is required').isPathValid('Path is not valid'),
  pasteTo: Yup.string().required('Pasting path is required').isPathValid('Path is not valid'),
  frameNames: Yup.array().min(1, 'You must select at least one frame name')
})

function AdjacentForm({ framesObj }) {
  const { handleSubmit, values, handleChange, errors, status, setStatus, setValues } = useFormik({
    initialValues: {
      copyFrom: '',
      pasteTo: '',
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

        await window.electronApi.downloadFile({
          foldersPaths: {
            searchingPath: data.copyFrom,
            destinationFolderPath: data.pasteTo
          },
          fileName: frameName
        })
      }

      window.electronApi.unArchive(data.pasteTo)
      setValues({
        copyFrom: framesObj.takenFrom,
        pasteTo: framesObj.framesLocation,
        frameNames: []
      })
    } catch (e) {
      console.error(e)
    } finally {
      setStatus('')
    }
  }

  useEffect(() => {
    setValues({
      copyFrom: framesObj.takenFrom,
      pasteTo: framesObj.framesLocation,
      frameNames: []
    })
  }, [framesObj])

  const onChoosePath = async (e) => {
    const path = await window.electronApi.choosePath()
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
          //! with big scale might not work. Leak of space may brake structure
        }
        <Grid item>
          <AdjacentFramesDisplay
            framesObj={framesObj}
            values={values}
            handleChange={handleChange}
            errors={errors}
          />
        </Grid>

        <Grid item>
          <Typography level="title-md" color="warning" pb={1}>
            Copying follows the same sequence of steps as downloading, such as converting. Make sure
            any old laz files is not in the target directory. It may result in data loss.
          </Typography>
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

DownloadStatusFeedback.propTypes = {
  status: PropTypes.string
}

AdjacentForm.propTypes = {
  framesObj: PropTypes.shape({
    adjacentFrames: PropTypes.arrayOf(PropTypes.string),
    adjacentSchema: PropTypes.arrayOf(
      PropTypes.arrayOf(
        PropTypes.shape({
          frameLabel: PropTypes.string,
          isTakenFrames: PropTypes.bool.isRequired,
          selectable: PropTypes.bool.isRequired,
          id: PropTypes.string
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
