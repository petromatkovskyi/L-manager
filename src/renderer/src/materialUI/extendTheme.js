import { extendTheme, CssVarsProvider } from '@mui/joy/styles';
import KeyboardArrowDown from '@mui/icons-material/KeyboardArrowDown';

const theme = extendTheme({
  components: {
    JoySelect: {
      defaultProps: {
        indicator: `${KeyboardArrowDown}`,
      },
    },
  },
});

export default theme;
