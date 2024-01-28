import AppBar from '@mui/material/AppBar'
import Box from '@mui/material/Box'
import Toolbar from '@mui/material/Toolbar'
import Typography from '@mui/material/Typography'
// import Button from '@mui/material/Button'

export default function Header() {
  return (
    <Box sx={{ flexGrow: 1 }}>
      <AppBar position="static" sx={{ height: '3rem' }}>
        <Box sx={{ justifyContent: 'space-between', height: '100%', p: 1 }}>
          {/* <IconButton
            size="large"
            edge="start"
            color="inherit"
            aria-label="menu"
            sx={{ mr: 2 }}
          >
            <MenuIcon />
          </IconButton> */}
          <Typography variant="h6" component="div" to="/">
            L-Manager
          </Typography>
          {/* <Button color="inherit">Login</Button> */}
        </Box>
      </AppBar>
    </Box>
  )
}
