import { ClimbDescentProfile, CruiseProfile } from '../types/interfaces';

const cruiseProfileJSON: CruiseProfile = require('../assets/cruise_profile.json');
const climbProfileJSON: ClimbDescentProfile = require('../assets/climb_profile.json');
const descentProfileJSON: ClimbDescentProfile = require('../assets/descent_profile.json');

export function getCruiseProfileRowsByAltitude(altitude: number): CruiseProfile {
  return cruiseProfileJSON.filter((profileRow) => (
    profileRow.altitude === altitude
  ));
}

export function getClimbProfileRowsBySpeed(speedM: number): ClimbDescentProfile {
  return climbProfileJSON.filter(row => (row.speedM === speedM));
}

export function getClimbProfileRowBySpeedAndAlt(speedM: number, alt: number): ClimbDescentProfile[0]|undefined {
  const profileRowsBySpeed = getClimbProfileRowsBySpeed(speedM);
  return profileRowsBySpeed.find(row => (row.altitude === alt));
}

export function getDescentProfileRowsBySpeed(speedM: number): ClimbDescentProfile {
  return descentProfileJSON.filter(row => (row.speedM === speedM));
}

export function getDescentProfileRowBySpeedAndAlt(speedM: number, alt: number): ClimbDescentProfile[0]|undefined {
  const profileRowsBySpeed = getDescentProfileRowsBySpeed(speedM);
  return profileRowsBySpeed.find(row => (row.altitude === alt));
}
