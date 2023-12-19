import Tabs from '@mui/joy/Tabs';
import TabList from '@mui/joy/TabList';
import Tab, { tabClasses } from '@mui/joy/Tab';

export default function WorkTabs() {
  return (
    <Tabs aria-label="tabs" defaultValue={0} sx={{ bgcolor: 'inherit' }}>
      <TabList
        disableUnderline
        sx={{
          p: 0.5,
          gap: 0.5,
          borderRadius: 'xl',
          bgcolor: 'background.level1',
          [`& .${tabClasses.root}[aria-selected="true"]`]: {
            boxShadow: 'sm',
            bgcolor: 'background.surface',
          },
        }}
      >
        <Tab disableIndicator>Take</Tab>
        <Tab disableIndicator disabled>
          Submit
        </Tab>
        <Tab disableIndicator disabled>
          Table*
        </Tab>
      </TabList>
    </Tabs>
  );
}
