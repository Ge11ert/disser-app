import React from 'react';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';
import CircularProgress from '@material-ui/core/CircularProgress';
import CheckIcon from '@material-ui/icons/Check';

const FileSelector = () => {
  const [processing, setProcessing] = React.useState(false);
  const [loaded, setLoaded] = React.useState(false);

  const onClick = () => {
    setProcessing(true);
    window.electron.listenToAirConditionsLoaded(() => {
      setProcessing(false);
      setLoaded(true);
    });
    window.electron.loadAirConditions();
  };

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
            >
              Загрузить
            </Button>
          )}
        </Box>
      )}
      { loaded && (
        <Box my={2} color="success.main">
          <Typography variant="body1">
            <CheckIcon color="inherit" fontSize="small"/>
            Параметры среды успешно загружены
          </Typography>
        </Box>
      )}
    </Box>
  );
}

export default FileSelector;
