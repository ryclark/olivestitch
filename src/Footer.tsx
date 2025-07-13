import { Box, Flex, Link } from '@chakra-ui/react';

export default function Footer() {
  return (
    <Box as="footer" bg="gray.700" color="gray.100" py={4} mt={8}>
      <Flex maxW="960px" mx="auto" justify="center">
        <Link href="/about" color="gray.100">About</Link>
      </Flex>
    </Box>
  );
}
