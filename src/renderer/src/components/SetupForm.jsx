import InfoOutlined from '@mui/icons-material/InfoOutlined'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import {
  Box,
  Button,
  FormControl,
  FormHelperText,
  Grid,
  Input,
  Option,
  Radio,
  RadioGroup,
  Select,
  Snackbar
} from '@mui/joy'
import { radioClasses } from '@mui/joy/Radio'
import { selectClasses } from '@mui/joy/Select'
import PropTypes from 'prop-types'

import { useFormik } from 'formik'
import { useEffect, useState } from 'react'
import { useDispatch, useSelector } from 'react-redux'
import * as Yup from 'yup'
import { fetchSetup, framesSelector } from '../store/framesSlice'
import SpanDecorator from './shared/SpanDecorator'

Yup.addMethod(Yup.string, 'checkSpreadsheetId', function (errMsg) {
  return this.test('test-valid-spreadsheet-id', errMsg, async function (value) {
    const { path, createError } = this
    const isIdValid = await electronApi.checkSpreadSheetId(value)
    return isIdValid || createError({ path, message: errMsg })
  })
})

const SetupSchema = Yup.object().shape({
  pathType: Yup.string().required('Path type is required'),
  searchingPath: Yup.string().required('Searching path is required'),
  destPath: Yup.string().required('Destination path is required'),
  operatorName: Yup.string().required('Operator name is required'),
  spreadsheetLink: Yup.string()
    .required('Spreadsheet link is required')
    .matches(/^https:\/\/docs.google.com\/spreadsheets\/d\//, {
      message: 'Spreadsheet link isn`t valid'
    }),
  spreadsheetId: Yup.string()
    .required('Spreadsheet Id is required')
    .checkSpreadsheetId(
      'Spreadsheet Id isn`t valid. Spreadsheet has not been find. Please check link above'
    ),
  sheetName: Yup.string().required('Sheet name is required')
})

function SetupForm({ setIsSaved }) {
  const framesState = useSelector(framesSelector)
  const dispatch = useDispatch()
  const { handleSubmit, values, handleChange, errors, setValues, status, setStatus } = useFormik({
    initialValues: framesState.setup,
    onSubmit: onSubmitSetups,
    validationSchema: SetupSchema
  })
  const [feedback, setFeedback] = useState({
    open: false,
    message: '',
    variant: 'solid',
    color: 'neutral',
    duration: 5000,
    vertical: 'bottom',
    horizontal: 'left'
  })

  const [sheetNames, setSheetNames] = useState([])

  const onSelectChange = (e, newValue, name) => {
    const synthEvent = {
      target: {
        value: newValue,
        name
      }
    }
    onFieldChange(synthEvent)
  }

  const onChoosePath = async (e) => {
    const path = await electronApi.choosePath()
    if (path) {
      const synthEvent = {
        target: {
          value: path,
          name: e.target.name
        }
      }
      onFieldChange(synthEvent)
    }
  }

  const getSheetNames = async (e, id) => {
    if (values?.spreadsheetId || id) {
      const sheetNamesRes = await electronApi.getSheetNames({
        spreadsheetId: id || values?.spreadsheetId
      })
      if (!!sheetNamesRes?.length) {
        setSheetNames(sheetNamesRes)
        return
      }
      setSheetNames([])
    }
  }

  const onChangeSpreadsheetLink = async (e) => {
    const spreadsheetLink = e.target.value
    const regex = /\/d\/([a-zA-Z0-9-_]+)\//
    const match = spreadsheetLink.match(regex)

    status === 'saved' && setStatus('changed')

    setValues({
      ...values,
      spreadsheetLink,
      spreadsheetId: match && match[1] ? match[1] : ''
    })
  }

  const onFieldChange = (e) => {
    status === 'saved' && setStatus('changed')
    handleChange(e)
  }

  async function onSubmitSetups(setups) {
    const res = await electronApi.saveSetups(setups)
    setFeedback((prev) => ({
      ...prev,
      color: res.success ? 'success' : 'danger',
      message: res.message
    }))
    res.success && setStatus('saved')
  }

  useEffect(() => {
    dispatch(fetchSetup())
  }, [])

  useEffect(() => {
    setValues(framesState.setup)
    getSheetNames(null, framesState.setup.spreadsheetId)
    setStatus(Object.values(framesState.setup).some((item) => item == false) ? 'changed' : 'saved')
  }, [framesState.setup])

  useEffect(() => {
    setIsSaved(status === 'saved')
  }, [status])

  return (
    <Box component="form" title="Setups" gap="2" onSubmit={handleSubmit}>
      <Grid container spacing={1} direction="column">
        <Grid>
          {/* <FormLabel
            id="storage-label"
            sx={{
              mb: 2,
              fontWeight: 'xl',
              textTransform: 'uppercase',
              fontSize: 'xs',
              letterSpacing: '0.15rem',
            }}
          >
            Paths
          </FormLabel> */}
        </Grid>
        <Grid xs={4} sm={3} md={2}>
          <RadioGroup
            orientation="horizontal"
            aria-label="Path type"
            name="pathType"
            variant="outlined"
            value={values.pathType}
            onChange={onFieldChange}
          >
            {['root', 'direct'].map((item) => (
              <Box
                key={item}
                sx={(theme) => ({
                  position: 'relative',
                  display: 'flex',
                  justifyContent: 'center',
                  alignItems: 'center',
                  width: '50%',
                  height: 38,
                  '&:not([data-first-child])': {
                    borderLeft: '1px solid',
                    borderColor: 'divider'
                  },
                  [`&[data-first-child] .${radioClasses.action}`]: {
                    borderTopLeftRadius: `calc(${theme.vars.radius.sm} - 1px)`,
                    borderBottomLeftRadius: `calc(${theme.vars.radius.sm} - 1px)`
                  },
                  [`&[data-last-child] .${radioClasses.action}`]: {
                    borderTopRightRadius: `calc(${theme.vars.radius.sm} - 1px)`,
                    borderBottomRightRadius: `calc(${theme.vars.radius.sm} - 1px)`
                  }
                })}
              >
                <Radio
                  value={item}
                  disableIcon
                  overlay
                  label={item.charAt(0).toUpperCase() + item.slice(1)}
                  variant={values.pathType === item ? 'solid' : 'plain'}
                  slotProps={{
                    input: { 'aria-label': item },
                    action: {
                      sx: { borderRadius: 0, transition: 'none' }
                    },
                    label: { sx: { lineHeight: 0 } },
                    checked: { sx: { background: 'red' } }
                  }}
                />
              </Box>
            ))}
          </RadioGroup>
        </Grid>
        <Grid>
          <FormControl error={!!errors.searchingPath}>
            <Input
              startDecorator={<SpanDecorator label="Server" />}
              endDecorator={
                <Button onClick={onChoosePath} name="searchingPath" variant="soft">
                  Searching Path
                </Button>
              }
              readOnly
              name="searchingPath"
              value={values.searchingPath}
              onChange={onFieldChange}
            />
            {!!errors.searchingPath && (
              <FormHelperText>
                <InfoOutlined />
                {errors.searchingPath}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid>
          <FormControl error={!!errors.destPath}>
            <Input
              startDecorator={<SpanDecorator label="Local" />}
              endDecorator={
                <Button onClick={onChoosePath} name="destPath" variant="soft">
                  Destination Path
                </Button>
              }
              name="destPath"
              readOnly
              value={values.destPath}
              onChange={onFieldChange}
            />
            {!!errors.destPath && (
              <FormHelperText>
                <InfoOutlined />
                {errors.destPath}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid sm={6} md={4}>
          <FormControl error={!!errors.operatorName}>
            <Select
              placeholder="Select operator"
              startDecorator={<SpanDecorator label="Operator" />}
              indicator={<KeyboardArrowDown />}
              name="operatorName"
              id="operatorName"
              value={values.operatorName}
              onChange={(e, newValue) => onSelectChange(e, newValue, 'operatorName')}
              sx={{
                width: '100%',
                [`& .${selectClasses.indicator}`]: {
                  transition: '0.2s',
                  [`&.${selectClasses.expanded}`]: {
                    transform: 'rotate(-180deg)'
                  }
                }
              }}
            >
              <Option selected disabled value="">
                Choose...
              </Option>
              <Option value="Матковський Петро">Матковський Петро</Option>
              <Option value="Мовяка Оксана">Мовяка Оксана</Option>
              <Option value="Сернюк Ірина">Сернюк Ірина</Option>
              <Option value="Страз Ольга">Страз Ольга</Option>
              <Option value="Бучелюк Ксенія">Бучелюк Ксенія</Option>
              <Option value="Лісник Вікторія">Лісник Вікторія</Option>
              <Option value="Жук Вікторія">Жук Вікторія</Option>
              <Option value="Марзанич Наталія">Марзанич Наталія</Option>
            </Select>
            {!!errors.operatorName && (
              <FormHelperText>
                <InfoOutlined />
                {errors.operatorName}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>

        <Grid>
          <FormControl error={!!errors.spreadsheetLink}>
            <Input
              startDecorator={<SpanDecorator label="Spreadsheet link" />}
              value={values.spreadsheetLink}
              onChange={onChangeSpreadsheetLink}
              onBlur={getSheetNames}
              name="spreadsheetLink"
            />
            {!!errors.spreadsheetLink && (
              <FormHelperText>
                <InfoOutlined />
                {errors.spreadsheetLink}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid>
          <FormControl
            error={!!errors.spreadsheetId}
            color={errors?.spreadsheetId ? 'danger' : 'neutral'}
          >
            <Input
              startDecorator={<SpanDecorator label="Spreadsheet Id" />}
              endDecorator={<SpanDecorator label="The ID is taken from the link above" />}
              name="spreadsheetId"
              value={values.spreadsheetId}
              onChange={onFieldChange}
              readOnly
            />
            {!!errors.spreadsheetId && (
              <FormHelperText>
                <InfoOutlined />
                {errors.spreadsheetId}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid sm={6} md={4}>
          <FormControl error={!!errors.sheetName}>
            <Select
              placeholder="Select Sheet Name"
              startDecorator={<SpanDecorator label="Sheet Name" />}
              indicator={<KeyboardArrowDown />}
              name="sheetName"
              id="sheetName"
              value={values.sheetName}
              onChange={(e, newValue) => onSelectChange(e, newValue, 'sheetName')}
              sx={{
                width: '100%',
                [`& .${selectClasses.indicator}`]: {
                  transition: '0.2s',
                  [`&.${selectClasses.expanded}`]: {
                    transform: 'rotate(-180deg)'
                  }
                }
              }}
            >
              {!!sheetNames?.length ? (
                sheetNames.map((sheetName) => (
                  <Option
                    key={sheetName}
                    value={sheetName}
                    selected={sheetName === values.sheetName}
                  >
                    {sheetName}
                  </Option>
                ))
              ) : values.sheetName ? (
                <Option value={values.sheetName} selected disabled>
                  {values.sheetName}
                </Option>
              ) : (
                ''
              )}
            </Select>
            {!!errors.sheetName && (
              <FormHelperText>
                <InfoOutlined />
                {errors.sheetName}
              </FormHelperText>
            )}
          </FormControl>
        </Grid>
        <Grid>
          <Button
            variant="outlined"
            color="success"
            size="lg"
            type="submit"
            disabled={status === 'saved'}
          >
            Save
          </Button>
        </Grid>
      </Grid>
      <Snackbar
        autoHideDuration={feedback.duration}
        open={feedback.open}
        variant={feedback.variant}
        anchorOrigin={{ vertical: feedback.vertical, horizontal: feedback.horizontal }}
        onClose={(event, reason) => {
          if (reason === 'clickaway') {
            setFeedback((prev) => ({ ...prev, open: false }))
            return
          }
          setFeedback((prev) => ({ ...prev, open: false }))
        }}
      >
        {feedback.message}
      </Snackbar>
    </Box>
  )
}

SetupForm.propTypes = {
  setIsSaved: PropTypes.func.isRequired
}

export default SetupForm
