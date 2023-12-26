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
import { useDispatch } from 'react-redux'
import { setTakenFrames } from '../store/framesSlice'

function ModalConfirmation({ confirmData, setConfirmData }) {
  const dispatch = useDispatch()

  const deleteFramesData = async () => {
    const res = await electronApi.deleteFramesData(confirmData.id)
    console.log(res)

    if (Array.isArray(res)) dispatch(setTakenFrames(res))

    setConfirmData(null)
  }
  return (
    <Modal open={!!confirmData}>
      <ModalDialog variant="outlined" role="alertdialog" color="danger">
        <DialogTitle>
          <WarningRoundedIcon />
          Confirmation
        </DialogTitle>
        <Divider />
        <DialogContent sx={{ gap: 1, flexDirection: 'row' }}>
          Are you sure you want to delete all data of <b>{confirmData?.label}</b> ?
        </DialogContent>
        <DialogActions>
          <Button variant="solid" color="danger" onClick={deleteFramesData}>
            Discard notes
          </Button>
          <Button variant="plain" color="neutral" onClick={() => setConfirmData(null)}>
            Cancel
          </Button>
        </DialogActions>
      </ModalDialog>
    </Modal>
  )
}

ModalConfirmation.propTypes = {
  confirmData: PropTypes.shape({
    id: PropTypes.string.isRequired,
    label: PropTypes.string.isRequired
  }),
  setConfirmData: PropTypes.func
}

export default ModalConfirmation
