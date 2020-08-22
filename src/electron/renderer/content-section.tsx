import React from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

interface Props {
  title: string,
  children: React.ReactChild,
  level?: 'h1'|'h2'|'h3'|'h4'|'h5'|'h6',
  blocked?: boolean,
}

const ContentSection = (props: Props) => {
  return (
    <Box component="section" color={props.blocked ? 'text.disabled' : 'text.primary'}>
      <Typography
        variant={props.level || 'h4'}
        color="inherit"
      >
        {props.title}
      </Typography>

      <Box mt={3}>
        {props.children}
      </Box>
    </Box>
  )
};

export default ContentSection;
