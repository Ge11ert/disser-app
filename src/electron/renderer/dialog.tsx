import React from 'react';
import AppBar from '@material-ui/core/AppBar';
import Toolbar from '@material-ui/core/Toolbar';
import IconButton from '@material-ui/core/IconButton';
import Dialog from '@material-ui/core/Dialog';
import CloseIcon from '@material-ui/icons/Close';
import Typography from '@material-ui/core/Typography';

interface Props {
  isOpen: boolean;
  onClose(): void;
  title: string;
  children: React.ReactNode;
}

const _Dialog = (props: Props) => {
  return (
    <Dialog open={props.isOpen} fullScreen>
      <AppBar style={{ position: 'relative' }}>
        <Toolbar>
          <IconButton
            edge="start"
            color="inherit"
            onClick={props.onClose}
            aria-label="close"
          >
            <CloseIcon />
          </IconButton>

          <Typography variant="h6">
            {props.title}
          </Typography>
        </Toolbar>
      </AppBar>

      {props.children}
    </Dialog>
  )
};

export default _Dialog;
