import React from 'react';
import Box from '@material-ui/core/Box';
import Typography from '@material-ui/core/Typography';

interface Props {
  title: string,
  children: React.ReactChild,
  level?: 'h1'|'h2'|'h3'|'h4'|'h5'|'h6',
}

const ContentSection = (props: Props) => {
  return (
    <Box component="section">
      <Typography
        variant={props.level || 'h4'}
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
