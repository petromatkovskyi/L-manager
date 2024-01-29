import FormControl from '@mui/joy/FormControl'
import FormLabel from '@mui/joy/FormLabel'
import Autocomplete, { createFilterOptions } from '@mui/joy/Autocomplete'
import AutocompleteOption from '@mui/joy/AutocompleteOption'
import ListItemDecorator from '@mui/joy/ListItemDecorator'
import Add from '@mui/icons-material/Add'
import SpanDecorator from './shared/SpanDecorator'
import { useEffect, useState } from 'react'

const filter = createFilterOptions({
  stringify: (option) => `${option.name} ${option.spreadsheetLink}`
})

const linkIdRegex = /\/d\/([a-zA-Z0-9-_]+)\//

export default function SpreadsheetLinkAutocomplete({
  errors,
  spreadsheets,
  selectedSpreadsheet,
  setValues,
  status,
  setStatus
}) {
  const [spreadsheet, setSpreadsheet] = useState(null)

  useEffect(() => {
    setSpreadsheet(selectedSpreadsheet)
  }, [selectedSpreadsheet])

  const onSpreadsheetChange = async (e, newValue) => {
    if (!newValue) return

    if (typeof newValue === 'string' || (newValue && newValue.inputValue)) {
      try {
        const spreadsheetLink = typeof newValue === 'string' ? newValue : newValue.inputValue

        const spreadsheetId = spreadsheetLink.match(linkIdRegex)?.[1]

        if (!spreadsheetId) {
          throw new Error('Link is not valid.')
        }

        const name = await window.electronApi.getSpreadsheetTitle(spreadsheetId)
        console.log(name)

        if (!name) {
          throw new Error('Something went wrong')
        }

        const spreadsheet = {
          sheetName: '',
          name: name,
          spreadsheetLink,
          spreadsheetId
        }
        console.log(spreadsheet)
        setValues((prev) => ({
          ...prev,
          selectedSpreadsheet: spreadsheet,
          spreadsheets: [...prev.spreadsheets, spreadsheet]
        }))

        status === 'saved' && setStatus('changed')
      } catch (err) {
        console.error(err)
        return
      }
    } else {
      setValues((prev) => ({ ...prev, selectedSpreadsheet: newValue }))
      status === 'saved' && setStatus('changed')
    }
  }

  return (
    <FormControl error={!!errors?.selectedSpreadsheet?.spreadsheetLink}>
      <FormLabel sx={{ color: 'primary.500' }}>
        If you wanna use new spreadsheet you should just paste link in the field below
      </FormLabel>
      <Autocomplete
        startDecorator={<SpanDecorator label="Spreadsheets" />}
        value={spreadsheet}
        onChange={onSpreadsheetChange}
        filterOptions={(options, params) => {
          const filtered = filter(options, params)

          const { inputValue } = params
          // Suggest the creation of a new value
          const isExisting = options.some(
            (option) => inputValue === option.name || inputValue === option.spreadsheetLink
          )
          if (inputValue !== '' && !isExisting) {
            filtered.push({
              inputValue,
              name: `Add "${inputValue}"`
            })
          }

          return filtered
        }}
        selectOnFocus
        clearOnBlur
        handleHomeEndKeys
        options={spreadsheets}
        getOptionLabel={(option) => {
          // Value selected with enter, right from the input
          if (typeof option === 'string') {
            return option
          }
          // Add "xxx" option created dynamically
          if (option.inputValue) {
            return option.inputValue
          }
          // Regular option
          if (option.name || option.spreadsheetLink) {
            return option.name || option.spreadsheetLink
          }
          return ''
        }}
        renderOption={(props, option) => (
          <AutocompleteOption {...props}>
            {option.name?.startsWith('Add "') && (
              <ListItemDecorator>
                <Add />
              </ListItemDecorator>
            )}

            {option.name || option.spreadsheetLink}
          </AutocompleteOption>
        )}
      />
    </FormControl>
  )
}
