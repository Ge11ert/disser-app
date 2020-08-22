import React from 'react';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

interface Props {
  blocked?: boolean,
}

const PathfinderController = (props: Props) => {
  const onClick = () => {
    // fix of "Object could not be cloned"
    window.electron.findPath();
  };

  return (
    <Box>
      <Typography
        variant="subtitle1"
      >
        Нажмите кнопку для расчета параметров множества существующих четырехмерных траекторий
      </Typography>

      <Box my={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={onClick}
          disabled={props.blocked}
        >
          Найти траектории
        </Button>
      </Box>
    </Box>
  );
};

export default PathfinderController;
