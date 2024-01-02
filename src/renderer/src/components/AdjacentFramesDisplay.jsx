import Done from '@mui/icons-material/Done'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import {
  Checkbox,
  CircularProgress,
  FormControl,
  FormHelperText,
  List,
  ListItem,
  Switch,
  Typography
} from '@mui/joy'
import { Box } from '@mui/material'
import PropTypes from 'prop-types'
import { useEffect, useState } from 'react'

function AdjacentFramesDisplay({ framesObj, values, handleChange, errors }) {
  const [isSchemaType, setIsSchemaType] = useState(false)

  useEffect(() => {
    setIsSchemaType(framesObj.schemaAble)
  }, [framesObj])

  return (
    <>
      <Switch
        color={isSchemaType ? 'primary' : 'danger'}
        sx={{ mb: 1 }}
        startDecorator={
          <Typography
            level="title-md"
            sx={{
              // py: 1,
              px: 2,
              color: !isSchemaType ? 'primary.500' : 'neutral.300',
              border: '1px solid',
              borderColor: !isSchemaType ? 'primary.500' : 'neutral.100',
              borderRadius: 5
            }}
          >
            List
          </Typography>
        }
        endDecorator={
          <Typography
            level="title-md"
            sx={{
              // py: 1,
              px: 2,
              color: isSchemaType ? 'primary.500' : 'neutral.300',
              border: '1px solid',
              borderColor: isSchemaType ? 'primary.500' : 'neutral.100',
              borderRadius: 5
            }}
          >
            Schema
          </Typography>
        }
        checked={isSchemaType}
        onChange={(e) => {
          if (framesObj.schemaAble) setIsSchemaType(e.target.checked)
        }}
      />
      {isSchemaType ? (
        <Box>
          {framesObj.adjacentSchema.map((row, index) => {
            return (
              <Box
                key={index}
                sx={{ mb: 1 }}
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
                    // variant="solid"
                    variant={values.frameNames.includes(frameObj.frameLabel) ? 'soft' : 'outlined'}
                    label={
                      <Typography
                        level="body-md"
                        color={
                          !frameObj.selectable || frameObj.isTakenFrames ? 'neutral.200' : 'primary'
                        }
                      >
                        {frameObj.frameLabel}
                      </Typography>
                    }
                    value={frameObj.frameLabel}
                    name="frameNames"
                    onChange={handleChange}
                    sx={{
                      // fontSize: { xs: '10px', md: '20px' },
                      height: '60px',
                      alignItems: 'center',
                      px: 1,
                      mr: 1,
                      backgroundColor:
                        !frameObj.selectable || frameObj.isTakenFrames ? 'neutral.100' : ''
                    }}
                    checked={values.frameNames.includes(frameObj.frameLabel)}
                    slotProps={{
                      action: ({ checked }) => ({
                        sx: checked
                          ? {
                              border: '1px solid',
                              borderColor: 'primary.500'
                            }
                          : {}
                      })
                    }}
                  />
                ))}
              </Box>
            )
          })}
        </Box>
      ) : (
        <List sx={{ display: 'flex', flexDirection: 'row', gap: 1, flexWrap: 'wrap' }}>
          {framesObj.adjacentFrames.map((frameName) => (
            <ListItem key={frameName}>
              <Checkbox
                disableIcon
                label={
                  <Typography level="body-md" color={'primary'}>
                    {frameName}
                  </Typography>
                }
                value={frameName}
                variant={values.frameNames.includes(frameName) ? 'soft' : 'outlined'}
                name="frameNames"
                onChange={handleChange}
                sx={{ height: '60px', alignItems: 'center', px: 1 }}
                checked={values.frameNames.includes(frameName)}
                slotProps={{
                  action: ({ checked }) => ({
                    sx: checked
                      ? {
                          border: '1px solid',
                          borderColor: 'primary.500'
                        }
                      : {}
                  })
                }}
              />
            </ListItem>
          ))}
        </List>
      )}

      <FormControl error={!!errors.frameNames}>
        {!!errors.frameNames && (
          <FormHelperText>
            <InfoOutlined />
            {errors.frameNames}
          </FormHelperText>
        )}
      </FormControl>
    </>
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

AdjacentFramesDisplay.propTypes = {
  framesObj: PropTypes.shape({
    schemaAble: PropTypes.bool,
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
  }),
  values: PropTypes.shape({
    copyFrom: PropTypes.string,
    pasteTo: PropTypes.string,
    frameNames: PropTypes.array
  }),
  handleChange: PropTypes.func,
  errors: PropTypes.shape({
    copyFrom: PropTypes.string,
    pasteTo: PropTypes.string,
    frameNames: PropTypes.string
  })
}

export default AdjacentFramesDisplay
