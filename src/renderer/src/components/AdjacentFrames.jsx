import { Grid } from '@mui/material'
import AdjacentForm from './AdjacentForm'
import AdjacentFramesSelect from './AdjacentFramesSelect'
import { Box } from '@mui/material'
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown'

import { selectClasses } from '@mui/joy/Select'
import { FormControl, FormLabel, Option, Select } from '@mui/joy'
import { useEffect, useState } from 'react'

export default function AdjacentFrames() {
  const [dataForSelect, setDataForSelect] = useState([])

  const [frames, setFrames] = useState([])

  useEffect(() => {
    ;(async () => {
      const takenFrames = await electronApi.getTakenFrames()
      console.log(takenFrames)
      !!takenFrames.length && setFrames(takenFrames)
    })()
    // setDataForSelect(
    //   takenFrames.map(
    //     (takenFrame) =>
    //       `${takenFrame.block} first frame ${takenFrame.frames[0].section}`
    //   )
    // );
  }, [])

  return (
    <FormControl>
      <Select
        placeholder="Select operator"
        startDecorator={<SpanDecorator label="Operator" />}
        indicator={<KeyboardArrowDown />}
        name="operatorName"
        id="operatorName"
        // value={values.operatorName}
        // onChange={(e, newValue) => onSelectChange(e, newValue, 'operatorName')}
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
      </Select>
    </FormControl>
  )

  // return (
  //   <Grid container direction="column" spacing={2}>
  //     <Grid item>
  //       <AdjacentForm frames={frames} />
  //     </Grid>
  //     <Grid item>
  //       <AdjacentFramesSelect />
  //     </Grid>
  //   </Grid>
  // );
}

function SpanDecorator({ label }) {
  return (
    <FormLabel
      sx={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%'
      }}
    >
      {label}
    </FormLabel>
  )
}
