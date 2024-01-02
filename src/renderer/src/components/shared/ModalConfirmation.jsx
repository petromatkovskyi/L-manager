import WarningRoundedIcon from '@mui/icons-material/WarningRounded'
import PropTypes from 'prop-types'
import {
  Button,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  Modal,
  ModalDialog
} from '@mui/joy'

function ModalConfirmation({ label, callback }) {
  return (
    <Modal open={!!label}>
      <ModalDialog variant="outlined" role="alertdialog" color="danger">
        <DialogTitle>
          <WarningRoundedIcon />
          Confirmation
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ gap: 1, flexDirection: 'row' }}>{label}</DialogContent>
        <DialogActions>
          <Button variant="solid" color="danger" onClick={() => callback(true)}>
            Discard notes
          </Button>
          <Button variant="plain" color="neutral" onClick={() => callback(false)}>
            Cancel
          </Button>
        </DialogActions>
      </ModalDialog>
    </Modal>
  )
}

ModalConfirmation.propTypes = {
  label: PropTypes.string,
  callback: PropTypes.func
}

export default ModalConfirmation
