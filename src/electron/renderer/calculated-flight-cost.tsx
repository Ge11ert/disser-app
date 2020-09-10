import React from 'react';
import Box from '@material-ui/core/Box';
import Tabs from '@material-ui/core/Tabs';
import Tab from '@material-ui/core/Tab';
import RoutesTable from './routes-table';

interface Props {
  routesSummary: Record<string, number[][]>,
}

interface TabPanelProps {
  children?: React.ReactNode;
  index: any;
  value: any;
}

function TabPanel(props: TabPanelProps) {
  const { children, value, index, ...other } = props;

  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`simple-tabpanel-${index}`}
      aria-labelledby={`simple-tab-${index}`}
      {...other}
    >
      {value === index && (
        <Box p={3}>
          {children}
        </Box>
      )}
    </div>
  );
}

const CalculatedFlightCost = (props: Props) => {
  const [value, setValue] = React.useState(0);
  const { fuel, time, combined } = props.routesSummary;

  const handleChange = (event: React.ChangeEvent<{}>, newValue: number) => {
    setValue(newValue);
  };

  return (
    <Box>
      <Tabs
        value={value}
        onChange={handleChange}
        indicatorColor="primary"
        textColor="primary"
        centered
      >
        <Tab label="Расчёт по топливу" />
        <Tab label="Расчёт по времени" />
        <Tab label="Смешанный расчёт" />
      </Tabs>
      <TabPanel index={0} value={value}>
        <RoutesTable routesData={fuel}/>
      </TabPanel>
      <TabPanel index={1} value={value}>
        <RoutesTable routesData={time}/>
      </TabPanel>
      <TabPanel index={2} value={value}>
        <RoutesTable routesData={combined}/>
      </TabPanel>
    </Box>
  );
};

CalculatedFlightCost.defaultProps = {
  routesSummary: {},
};

export default CalculatedFlightCost;
