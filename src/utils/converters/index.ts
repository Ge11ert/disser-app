export function fromMilesToMeters(valueInMiles: number): number {
  return valueInMiles * 1852;
}

export function fromMetersToMiles(valueInMeters: number): number {
  return valueInMeters / 1852;
}

export function fromMetersPerSecondToKnots(valueInMs: number) {
  return valueInMs * 1.944;
}

export function fromKnotsToMetersPerSecond(valueInKnots: number) {
  return valueInKnots / 1.944;
}

export function fromRadToDegrees(value: number): number {
  return value * 180 / Math.PI;
}

export function fromDegreesToRad(value: number): number {
  return value * Math.PI / 180;
}

export function fromFeetToMeters(valueInFeet: number): number {
  return valueInFeet / 3.28084;
}

export function fromMetersToFeet(valueInMeters: number): number {
  return valueInMeters * 3.28084;
}
