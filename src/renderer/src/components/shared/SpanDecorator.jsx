import { FormLabel } from '@mui/joy'
import PropTypes from 'prop-types'

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

SpanDecorator.propTypes = {
  label: PropTypes.string.isRequired
}

export default SpanDecorator
