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
import SpreadsheetLinkAutocomplete from './SpreadsheetLinkAutocomplete'

Yup.addMethod(Yup.string, 'checkSpreadsheetId', function (errMsg) {
  return this.test('test-valid-spreadsheet-id', errMsg, async function (value) {
    const { path, createError } = this
    const isIdValid = await window.electronApi.checkSpreadSheetId(value)
    return isIdValid || createError({ path, message: errMsg })
  })
})

Yup.addMethod(Yup.string, 'checkSpreadsheetLinkId', function (errMsg) {
  return this.test('test-valid-spreadsheet-link-id', errMsg, async function (value) {
    const regex = /\/d\/([a-zA-Z0-9-_]+)\//
    const linkId = value.match(regex)?.[1]
    const { path, createError } = this
    const isIdValid = await window.electronApi.checkSpreadSheetId(linkId)
    return isIdValid || createError({ path, message: errMsg })
  })
})

const SetupSchema = Yup.object().shape({
  pathType: Yup.string().required('Path type is required'),
  searchingPath: Yup.string().required('Searching path is required'),
  destPath: Yup.string().required('Destination path is required'),
  operatorName: Yup.string().required('Operator name is required'),
  selectedSpreadsheet: Yup.object().shape({
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
    color: 'success',
    duration: 5000,
    vertical: 'bottom',
    horizontal: 'left'
  })

  const [sheetNames, setSheetNames] = useState([])

  const onSelectChange = (e, newValue, name) => {
    if (name === 'operatorName') {
      const synthEvent = {
        target: {
          value: newValue,
          name
        }
      }
      onFieldChange(synthEvent)
      return
    }

    if (values.selectedSpreadsheet.sheetName && !newValue) return

    setValues((prev) => ({
      ...prev,
      selectedSpreadsheet: { ...prev.selectedSpreadsheet, sheetName: newValue },
      spreadsheets: prev.spreadsheets.map((spreadsheet) => ({
        ...spreadsheet,
        sheetName:
          prev.selectedSpreadsheet.spreadsheetId === spreadsheet.spreadsheetId
            ? newValue
            : spreadsheet.sheetName
      }))
    }))
    status === 'saved' && setStatus('changed')
  }

  const onChoosePath = async (e) => {
    const path = await window.electronApi.choosePath()
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

  const getSheetNames = async (_, id) => {
    if (values?.selectedSpreadsheet?.spreadsheetId || id) {
      const sheetNamesRes = await window.electronApi.getSheetNames({
        selectedSpreadsheet: {
          spreadsheetId: id || values?.selectedSpreadsheet?.spreadsheetId
        }
      })
      if (sheetNamesRes?.length) {
        setSheetNames(sheetNamesRes)
        return
      }
      setSheetNames([])
    }
  }

  const onFieldChange = (e) => {
    status === 'saved' && setStatus('changed')
    handleChange(e)
  }

  async function onSubmitSetups(setups) {
    const res = await window.electronApi.saveSetups(setups)
    setFeedback((prev) => ({
      ...prev,
      color: res.success ? 'success' : 'danger',
      message: res.message,
      open: true
    }))
    res.success && setStatus('saved')
  }

  useEffect(() => {
    dispatch(fetchSetup())
  }, [])

  useEffect(() => {
    setValues(framesState.setup)
    getSheetNames(null, framesState.setup.selectedSpreadsheet.spreadsheetId)
    setStatus(Object.values(framesState.setup).some((item) => item == false) ? 'changed' : 'saved')
  }, [framesState.setup])

  useEffect(() => {
    setIsSaved(status === 'saved')
  }, [status])

  useEffect(() => {
    getSheetNames(null, values.selectedSpreadsheet.spreadsheetId)
  }, [values.selectedSpreadsheet])

  return (
    <Box component="form" title="Setups" gap="2" onSubmit={handleSubmit}>
      <Grid container spacing={1} direction="column">
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
                  height: 30,
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
        <Grid container>
          <Grid sm={12} md={6}>
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
          <Grid sm={12} md={6}>
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
        </Grid>
        <Grid>
          <SpreadsheetLinkAutocomplete
            spreadsheets={values.spreadsheets}
            errors={errors}
            selectedSpreadsheet={values.selectedSpreadsheet}
            setValues={setValues}
            status={status}
            setStatus={setStatus}
          />
        </Grid>
        <Grid container>
          <Grid sm={12} md={7}>
            <FormControl error={!!errors?.selectedSpreadsheet?.sheetName}>
              <Select
                placeholder="Select Sheet Name"
                startDecorator={<SpanDecorator label="Sheet Name" />}
                indicator={<KeyboardArrowDown />}
                name="selectedSpreadsheet.sheetName"
                id="sheetName"
                value={values.selectedSpreadsheet.sheetName}
                onChange={(e, newValue) =>
                  onSelectChange(e, newValue, 'selectedSpreadsheet.sheetName')
                }
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
                {sheetNames?.length ? (
                  sheetNames.map((sheetName) => (
                    <Option
                      key={sheetName}
                      value={sheetName}
                      selected={sheetName === values.selectedSpreadsheet.sheetName}
                    >
                      {sheetName}
                    </Option>
                  ))
                ) : values.selectedSpreadsheet.sheetName ? (
                  <Option value={values.selectedSpreadsheet.sheetName} selected disabled>
                    {values.selectedSpreadsheet.sheetName}
                  </Option>
                ) : (
                  ''
                )}
              </Select>
              {!!errors?.selectedSpreadsheet?.sheetName && (
                <FormHelperText>
                  <InfoOutlined />
                  {errors.selectedSpreadsheet.sheetName}
                </FormHelperText>
              )}
            </FormControl>
          </Grid>
          <Grid sm={12} md={5}>
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
        </Grid>

        <Grid>
          <Button
            variant="outlined"
            color="success"
            size="md"
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
        color={feedback.color}
        onClose={(_, reason) => {
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
