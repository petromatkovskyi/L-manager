import { Grid } from '@mui/material'

import SetupForm from './SetupForm'
import TableStripe from './Table'
import { useState } from 'react'

export default function NewFrames() {
  const [isSaved, setIsSaved] = useState(false)
  const [isDownloading, setIsDownloading] = useState(false)

  return (
    <Grid container direction="column" spacing={3}>
      <Grid item>
        <SetupForm setIsSaved={setIsSaved} isDownloading={isDownloading} />
      </Grid>
      <Grid item>
        <TableStripe
          isSaved={isSaved}
          isDownloading={isDownloading}
          setIsDownloading={setIsDownloading}
        />
      </Grid>
    </Grid>
  )
}
