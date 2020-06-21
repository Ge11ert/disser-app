export type readResult<T> = {
  status: string,
  result: T,
};

export interface Reader<T> {
  read(path: string): Promise<readResult<T>>
}

export interface ElectronWindowAPI {
  loadAirConditions: () => void;
}

export interface DisserAppAPI {
  startElectronApp: () => void;

  // TODO: использовать нормальный тип для airConditionsArray
  applyAirConditions: (airConditionsArray: any[][]) => void;
}
