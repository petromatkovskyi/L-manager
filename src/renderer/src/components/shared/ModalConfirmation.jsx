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

function ModalConfirmation({ label, callback, header = '' }) {
  return (
    <Modal open={!!label}>
      <ModalDialog variant="outlined" role="alertdialog" color="danger">
        <DialogTitle>
          <WarningRoundedIcon />
          {header ? header : 'Confirmation'}
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ gap: 1, flexDirection: 'row' }}>{label}</DialogContent>
        <DialogActions>
          <Button variant="solid" color="danger" onClick={() => callback(true)}>
            Confirm
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
  label: PropTypes.oneOfType([PropTypes.element, PropTypes.bool]),
  callback: PropTypes.func,
  header: PropTypes.string
}

export default ModalConfirmation
