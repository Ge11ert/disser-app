import React from 'react';
import Stepper from '@material-ui/core/Stepper';
import Step from '@material-ui/core/Step';
import StepLabel from '@material-ui/core/StepLabel';

const AsideStepper = () => {
  return (
    <Stepper orientation="vertical">
      <Step>
        <StepLabel>Ввод исходных данных</StepLabel>
      </Step>

      <Step>
        <StepLabel>Загрузка параметров воздушного пространства</StepLabel>
      </Step>

      <Step>
        <StepLabel>Расчёт параметров множества существующих четырехмерных траекторий</StepLabel>
      </Step>
    </Stepper>
  );
}

export default AsideStepper;
