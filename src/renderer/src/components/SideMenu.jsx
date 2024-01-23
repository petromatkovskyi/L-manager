import InboxIcon from '@mui/icons-material/MoveToInbox'
import StarBorder from '@mui/icons-material/StarBorder'
import { List, ListItem, ListItemButton, ListItemDecorator, ListSubheader } from '@mui/joy'
import { Link, useLocation } from 'react-router-dom'

export default function SideMenu() {
  let { pathname } = useLocation()

  return (
    <List
      sx={{
        '--List-padding': 0,
        '& [role="button"]': {
          borderRadius: '0 20px 20px 0'
        }
      }}
      // component="nav"
      aria-labelledby="nested-list-subheader"
      subheader={
        <ListSubheader component="div" id="nested-list-subheader">
          Take Frames
        </ListSubheader>
      }
    >
      <Link to="/">
        <ListItem>
          <ListItemButton
            selected={pathname === '/'}
            color={pathname === '/' ? 'primary' : undefined}
          >
            <ListItemDecorator sx={{ minWidth: '40px' }}>
              <InboxIcon />
            </ListItemDecorator>
            Take frames
          </ListItemButton>
        </ListItem>
      </Link>

      <Link to="adjacent-frames">
        <ListItem>
          <ListItemButton
            selected={pathname === '/adjacent-frames'}
            color={pathname === '/adjacent-frames' ? 'primary' : undefined}
          >
            <ListItemDecorator sx={{ minWidth: '40px' }}>
              <StarBorder />
            </ListItemDecorator>
            Adjacent frames
          </ListItemButton>
        </ListItem>
      </Link>

      <ListItem nested>
        <ListSubheader>Soon...</ListSubheader>
        <List component="nav" aria-labelledby="nested-list-subheader">
          <ListItem>
            <ListItemButton>Submit frames</ListItemButton>
          </ListItem>
          <ListItem>
            <ListItemButton>Table*</ListItemButton>
          </ListItem>
        </List>
      </ListItem>
    </List>
  )
}
