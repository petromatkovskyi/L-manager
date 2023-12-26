import { Grid } from '@mui/material'
import { Outlet } from 'react-router-dom'
import Header from './Header'
import SideMenu from './SideMenu'

export default function Main() {
  return (
    <>
      <Grid
        container
        direction="row"
        maxWidth={2000}
        columnSpacing={{ xs: 0.5, md: 1, lg: 3 }}
        rowSpacing={2}
      >
        <Grid item xs={12}>
          <Header />
        </Grid>
        <Grid item xs={3} md={2} sx={{ borderRight: '1px solid gray' }}>
          <SideMenu />
        </Grid>

        <Grid item xs={9} md={10}>
          <Outlet />
        </Grid>
      </Grid>
    </>
  )
}
