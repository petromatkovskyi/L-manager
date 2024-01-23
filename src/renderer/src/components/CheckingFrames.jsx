import { Box, FormHelperText, FormControl, Button, Input, Typography, Table } from '@mui/joy'
import { Grid } from '@mui/material'
import { useFormik } from 'formik'
import InfoOutlined from '@mui/icons-material/InfoOutlined'
import SpanDecorator from './shared/SpanDecorator'

export default function CheckingFrames() {
  const { handleSubmit, values, handleChange, errors } = useFormik({
    initialValues: '',
    validationSchema: ''
  })
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
    <Box component="form" onSubmit={handleSubmit}>
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
      <Table
        aria-label="striped table"
        color="primary"
        variant="outlined"
        stripe="odd"
        borderAxis="xBetween"
      >
        <thead>
          <tr>
            <th>Row #</th>
            <th>Block</th>
            <th>Section</th>
            <th>Operator</th>
            <th>Done</th>
            <th>Check</th>
            <th>Status</th>
          </tr>
        </thead>
        <tbody></tbody>
      </Table>
    </Box>
  )
}
