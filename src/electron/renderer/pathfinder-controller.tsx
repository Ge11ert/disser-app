import React from 'react';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import CheckIcon from '@material-ui/icons/Check';
import Grid from '@material-ui/core/Grid';
import Dialog from './dialog';
import CalculatedRoutes from './calculated-routes';
import ArrivalTimeField from './arrival-time-field';

import { AirConditions, TotalRun } from '../../types/interfaces';

interface Props {
  blocked?: boolean,
  onRoutesCalculated(): void,
  air: Map<number, AirConditions>|null,
}

const PathfinderController = (props: Props) => {
  const [processing, setProcessing] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [flightRoutes, setFlightRoutes] = React.useState<TotalRun|null>(null);
  const [open, setOpen] = React.useState(false);

  const onClick = () => {
    setProcessing(true);
    window.electron.listenToFlightRoutesCalculated((result: TotalRun) => {
      setProcessing(false);
      setLoaded(true);
      setFlightRoutes(result);
      props.onRoutesCalculated();
    });
    window.electron.findPath();
  };

  const showRoutesDialog = () => {
    setOpen(true);
  };

  const closeRoutesDialog = () => {
    setOpen(false);
  };

  return (
    <Box>
      <Typography
        variant="subtitle1"
      >
        Нажмите кнопку для расчета параметров множества существующих четырехмерных траекторий
      </Typography>

      { !loaded && (
        <Box my={2}>
          { processing ? (
            <CircularProgress size={34}/>
          ) : (
            <Button
              variant="contained"
              color="primary"
              onClick={onClick}
              disabled={props.blocked}
            >
              Найти траектории
            </Button>
          )}
        </Box>
      )}

      { loaded && (
        <Box my={2} color="success.main">
          <Grid container spacing={1}>
            <Grid item xs={6}>
              <Typography variant="body1">
                <CheckIcon color="inherit" fontSize="small"/>
                Оптимальные маршруты найдены
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Button
                variant="outlined"
                size="small"
                onClick={showRoutesDialog}
              >
                Просмотреть все маршруты
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      <Box my={2}>
        <ArrivalTimeField/>
      </Box>

      <Dialog
        isOpen={open}
        onClose={closeRoutesDialog}
        title="Рассчитанные маршруты"
      >
        { flightRoutes && (
          <CalculatedRoutes totalRun={flightRoutes} air={props.air}/>
        )}
      </Dialog>
    </Box>
  );
};

export default PathfinderController;
