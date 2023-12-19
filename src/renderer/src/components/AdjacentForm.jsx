import { Box } from '@mui/material';
import {
  FormControl,
  FormHelperText,
  FormLabel,
  Grid,
  Input,
  Option,
  Radio,
  RadioGroup,
  Select,
} from '@mui/joy';

export default function AdjacentForm({ frames }) {
  return (
    <Box component="form">
      {/* <FormControl error={!!errors.operatorName}>
        <Select
          placeholder="Select operator"
          startDecorator={<SpanDecorator label="Operator" />}
          indicator={<KeyboardArrowDown />}
          name="operatorName"
          id="operatorName"
          value={values.operatorName}
          onChange={(e, newValue) => onSelectChange(e, newValue, 'operatorName')}
          sx={{
            width: '100%',
            [`& .${selectClasses.indicator}`]: {
              transition: '0.2s',
              [`&.${selectClasses.expanded}`]: {
                transform: 'rotate(-180deg)',
              },
            },
          }}
        >
          <Option selected disabled value="">
            Choose...
          </Option>
          <Option value="Матковський Петро">Матковський Петро</Option>
          <Option value="Мовяка Оксана">Мовяка Оксана</Option>
          <Option value="Сернюк Ірина">Сернюк Ірина</Option>
          <Option value="Страз Ольга">Страз Ольга</Option>
          <Option value="Бучелюк Ксенія">Бучелюк Ксенія</Option>
          <Option value="Лісник Вікторія">Лісник Вікторія</Option>
          <Option value="Жук Вікторія">Жук Вікторія</Option>
          <Option value="Марзанич Наталія">Марзанич Наталія</Option>
        </Select>
        {!!errors.operatorName && (
          <FormHelperText>
            <InfoOutlined />
            {errors.operatorName}
          </FormHelperText>
        )}
      </FormControl> */}
    </Box>
  );
}
