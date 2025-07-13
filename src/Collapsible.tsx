import React, { useState } from 'react';
import { Box, Collapse } from '@chakra-ui/react';

export interface CollapsibleProps {
  label: React.ReactNode;
  children: React.ReactNode;
}

export default function Collapsible({ label, children }: CollapsibleProps) {
  const [open, setOpen] = useState(false);
  return (
    <Box textAlign="center" my={2}>
      <Box
        cursor="pointer"
        fontWeight="bold"
        onClick={() => setOpen(o => !o)}
      >
        {label}
      </Box>
      <Collapse in={open} animateOpacity>
        <Box mt={2}>{children}</Box>
      </Collapse>
    </Box>
  );
}
