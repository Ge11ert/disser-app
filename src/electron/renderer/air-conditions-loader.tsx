import React from 'react';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import CheckIcon from '@material-ui/icons/Check';
import Grid from '@material-ui/core/Grid';
import Dialog from './dialog';
import AirConditionsComponent from './air-conditions';

import { AirConditions } from '../../types/interfaces';

interface Props {
  blocked?: boolean,
  onFileLoaded(): void,
}

const AirConditionsLoader = (props: Props) => {
  const [processing, setProcessing] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);
  const [airConditions, setAirConditions] = React.useState<Map<number, AirConditions>|null>(null);
  const [open, setOpen] = React.useState(false);

  const onClick = () => {
    setProcessing(true);
    window.electron.listenToAirConditionsLoaded((result: Map<number, AirConditions>) => {
      setProcessing(false);
      setLoaded(true);
      setAirConditions(result);
      props.onFileLoaded();
    });
    window.electron.loadAirConditions();
  };

  const showAirDialog = () => {
    setOpen(true);
  };

  const closeAirDialog = () => {
    setOpen(false);
  }

  return (
    <Box>
      <Typography variant="subtitle1">
        Загрузите файл с текущими полётными условиями:
      </Typography>

      { !loaded && (
        <Box my={2}>
          { processing ? (
            <CircularProgress size={34}/>
          ) : (
            <Button
              variant="outlined"
              color="primary"
              onClick={onClick}
              disabled={props.blocked}
            >
              Загрузить
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
                Параметры среды успешно загружены
              </Typography>
            </Grid>

            <Grid item xs={6}>
              <Button
                variant="outlined"
                size="small"
                onClick={showAirDialog}
              >
                Просмотреть
              </Button>
            </Grid>
          </Grid>
        </Box>
      )}

      <Dialog
        isOpen={open}
        onClose={closeAirDialog}
        title="Параметры воздушного пространства"
      >
        { airConditions && (
          <AirConditionsComponent airConditions={airConditions}/>
        )}
      </Dialog>
    </Box>
  );
}

export default AirConditionsLoader;
