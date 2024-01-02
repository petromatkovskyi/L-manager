import DeleteForever from '@mui/icons-material/DeleteForever'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'
import { Button, Typography } from '@mui/joy'
import { Grid } from '@mui/material'
import { useSelector } from 'react-redux'

import { FormControl, Option, Select } from '@mui/joy'
import { selectClasses } from '@mui/joy/Select'
import { useEffect, useState } from 'react'
import { useDispatch } from 'react-redux'
import { framesSelector, setTakenFrames } from '../store/framesSlice'
import AdjacentForm from './AdjacentForm'
import ModalConfirmation from './shared/ModalConfirmation'
import SpanDecorator from './shared/SpanDecorator'

export default function AdjacentFrames() {
  const { takenFrames } = useSelector(framesSelector)
  const [dataForSelect, setDataForSelect] = useState([])
  const [selected, setSelected] = useState('')
  const [framesObj, setFramesObj] = useState(null)
  const [confirmData, setConfirmData] = useState(null)
  const dispatch = useDispatch()

  useEffect(() => {
    setDataForSelect(
      takenFrames.map((frame) => {
        return { id: frame.id, label: frame.framesLocation.split('\\').slice(-2).join('-') }
      })
    )
  }, [takenFrames])

  useEffect(() => {
    if (!selected) return

    const selectedFramesObj = JSON.parse(
      JSON.stringify(takenFrames.filter((item) => item.id === selected)[0])
    )

    selectedFramesObj.adjacentSchema = selectedFramesObj.adjacentSchema.map((row) =>
      row.map((item) => ({ ...item, downloadStatus: 'idle' }))
    )

    setFramesObj(selectedFramesObj)
  }, [selected])

  const onSelectChange = (_, newValue) => {
    setSelected(newValue)
  }

  const deleteFramesData = async (eliminate) => {
    if (!eliminate) {
      setConfirmData(null)
      return
    }

    const res = await window.electronApi.deleteFramesData(confirmData.id)

    if (Array.isArray(res)) dispatch(setTakenFrames(res))

    setConfirmData(null)
  }

  return (
    <>
      <FormControl>
        <Grid container>
          <Grid item xs={12} md={4}>
            <Select
              placeholder="Select Frames"
              startDecorator={<SpanDecorator label="Frames" />}
              name="Frames"
              indicator={<KeyboardArrowDown />}
              id="frames"
              value={selected}
              onChange={onSelectChange}
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
              {dataForSelect.map((item) => (
                <Option
                  key={`${item.label}-${item.id}`}
                  value={item.id}
                  sx={{ display: 'flex', justifyContent: 'space-between' }}
                >
                  {item.label}
                  <Button
                    onClick={(e) => {
                      e.preventDefault()
                      e.stopPropagation()
                      setConfirmData(item)
                    }}
                    variant="plain"
                    color="danger"
                    size="sm"
                    sx={{ borderRadius: '50%', border: 0, padding: 1 }}
                  >
                    <DeleteForever />
                  </Button>
                </Option>
              ))}
            </Select>
          </Grid>
        </Grid>
      </FormControl>

      {!!framesObj && <AdjacentForm framesObj={framesObj} />}
      <ModalConfirmation
        callback={deleteFramesData}
        label={
          confirmData?.label && (
            <Typography>
              Are you sure you want to delete all data of <b>{confirmData?.label}</b>?
            </Typography>
          )
        }
      />
    </>
  )
}
