import React from 'react';
import { Box, Flex, Heading, Spacer, Button, Image } from '@chakra-ui/react';
import logo from './images/logo.webp'; // adjust the path if the file is in public/

// ...



export default function Header() {
  return (
    <Box as="header" position="sticky" width="100%" top="0" zIndex="docked" bg="teal.800" boxShadow="sm">
      <Flex align="center"  minW="960px" width="100%" maxW="960px" mx="auto" p={2}>
        <Image src={logo} alt="SnapStitch logo" boxSize="50px" borderRadius="md" mr={3} />
        //<Heading
          size="2xl"
          fontFamily="'Bebas Neue', sans-serif"
          letterSpacing="normal"
          color="teal.100"
          textTransform="uppercase"
        >
          Olive Stitch
        </Heading>
        <Spacer />
        <Button colorScheme="teal" size="sm">Join or Sign in</Button>
      </Flex>
    </Box>
  );
}
