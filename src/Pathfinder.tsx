import { Box } from '@chakra-ui/react';
import { useEffect, useState } from 'react';

export default function Pathfinder() {
  const [message, setMessage] = useState('');

  useEffect(() => {
    fetch('/path-finder')
      .then(res => res.text())
      .then(text => setMessage(text))
      .catch(() => setMessage('Error calling function'));
  }, []);

  return <Box p={4}>{message || 'Loading...'}</Box>;
}
