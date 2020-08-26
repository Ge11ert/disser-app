import React from 'react';
import Table from '@material-ui/core/Table';
import TableBody from '@material-ui/core/TableBody';
import TableCell from '@material-ui/core/TableCell';
import TableContainer from '@material-ui/core/TableContainer';
import TableRow from '@material-ui/core/TableRow';
import BlockIcon from '@material-ui/icons/Block';
import SvgIcon  from '@material-ui/core/SvgIcon';
import { green, blue } from '@material-ui/core/colors';

import { AirConditions } from '../../types/interfaces';

interface Props {
  air: AirConditions,
}

const AirConditionsTable = (props: Props) => {
  const { air } = props;
  return (
    <TableContainer>
      <Table size="small">
        <TableBody>
          { air.map((row, index) => (
            <TableRow key={`air-row-${index}`}>
              { row.map((cell, index) => (
                <TableCell
                  align="center"
                  padding="none"
                  key={`air-cell-${index}`}
                >
                  { getCellLabel(cell) }
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </TableContainer>
  )
};

export default AirConditionsTable;

function getCellLabel(cell: number|string): React.ReactNode {
  if (typeof cell === 'number') {
    if (cell < 0) {
      return (
        <>
          <SvgIcon
            fontSize="small"
            style={{ color: blue[500] }}
          >
            <path d="M18.41,7.41L17,6L11,12L17,18L18.41,16.59L13.83,12L18.41,7.41M12.41,7.41L11,6L5,12L11,18L12.41,16.59L7.83,12L12.41,7.41Z" />
          </SvgIcon>
          {' '}
          {cell}
        </>
      );
    }
    if (cell > 0) {
      return (
        <>
          <SvgIcon
            fontSize="small"
            style={{ color: green[500] }}
          >
            <path d="M5.59,7.41L7,6L13,12L7,18L5.59,16.59L10.17,12L5.59,7.41M11.59,7.41L13,6L19,12L13,18L11.59,16.59L16.17,12L11.59,7.41Z" />
          </SvgIcon>
          {' '}
          {cell}
        </>
      );
    }

    return (
      <>
        <SvgIcon
          fontSize="small"
          color="disabled"
        >
          <path d="M12 6C9.33 6 7.67 7.33 7 10C8 8.67 9.17 8.17 10.5 8.5C11.26 8.69 11.81 9.24 12.41 9.85C13.39 10.85 14.5 12 17 12C19.67 12 21.33 10.67 22 8C21 9.33 19.83 9.83 18.5 9.5C17.74 9.31 17.2 8.76 16.59 8.15C15.61 7.15 14.5 6 12 6M7 12C4.33 12 2.67 13.33 2 16C3 14.67 4.17 14.17 5.5 14.5C6.26 14.69 6.8 15.24 7.41 15.85C8.39 16.85 9.5 18 12 18C14.67 18 16.33 16.67 17 14C16 15.33 14.83 15.83 13.5 15.5C12.74 15.31 12.2 14.76 11.59 14.15C10.61 13.15 9.5 12 7 12Z" />
        </SvgIcon>
        {' '}
        {cell}
      </>
    );
  } else {
    return (
      <BlockIcon fontSize="small" color="error"/>
    );
  }
}
