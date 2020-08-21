import React from 'react';
import Button from '@material-ui/core/Button';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

const PathfinderController = () => {
  const onClick = () => {
    // fix of "Object could not be cloned"
    window.electron.findPath();
  };

  return (
    <div className="pathfinder-controller">
      <Typography
        variant="h4"
        gutterBottom
        className="pathfinder-controller__title"
      >
        Расчёт множества траекторий
      </Typography>

      <Typography
        variant="subtitle1"
        className="pathfinder-controller__subtitle"
      >
        Нажмите кнопку для расчета параметров множества существующих четырехмерных траекторий
      </Typography>

      <Box my={2}>
        <Button
          variant="contained"
          color="primary"
          onClick={onClick}
        >
          Найти траектории
        </Button>
      </Box>
    </div>
  );
};

export default PathfinderController;
