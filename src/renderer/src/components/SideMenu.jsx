import InboxIcon from '@mui/icons-material/MoveToInbox'
import StarBorder from '@mui/icons-material/StarBorder'
import {
  List,
  ListItem,
  ListItemButton,
  ListItemIcon,
  ListItemText,
  ListSubheader,
  Box
} from '@mui/material'
import { Link, useLocation } from 'react-router-dom'

export default function SideMenu() {
  let { pathname } = useLocation()

  return (
    <Box>
      <List
        sx={{ width: '100%' }}
        component="nav"
        aria-labelledby="nested-list-subheader"
        subheader={
          <ListSubheader component="div" id="nested-list-subheader">
            Take Frames
          </ListSubheader>
        }
      >
        <Link to="/">
          <ListItemButton selected={pathname === '/'}>
            <ListItemIcon sx={{ minWidth: '40px' }}>
              <InboxIcon />
            </ListItemIcon>
            <ListItemText primary="New frames" />
          </ListItemButton>
        </Link>

        <Link to="adjacent-frames">
          <ListItemButton selected={pathname === '/adjacent-frames'}>
            <ListItemIcon sx={{ minWidth: '40px' }}>
              <StarBorder />
            </ListItemIcon>
            <ListItemText primary="Adjacent frames" />
          </ListItemButton>
        </Link>
      </List>

      <List
        sx={{ width: '100%' }}
        component="nav"
        aria-labelledby="nested-list-subheader"
        subheader={
          <ListSubheader component="div" id="nested-list-subheader">
            Nested List Items
          </ListSubheader>
        }
      >
        <ListItem>
          <ListItemButton>Submit</ListItemButton>
        </ListItem>
        <ListItem>
          <ListItemButton>Table</ListItemButton>
        </ListItem>
      </List>
    </Box>
  )
}
