import { Box,
  Flex,
  HStack,
  Link,
  Text,
  Stack,
  Icon
} from '@chakra-ui/react';
import { FaInstagram, FaPinterest, FaReddit } from "react-icons/fa";


export default function Footer() {
  return (
    <Box as="footer" bg="green.900" color="yellow.100" py={4} mt={8}>
  <Flex
    direction={{ base: "column", md: "row" }}
    justify="space-between"
    align={{ base: "flex-start", md: "center" }}
    px={{ base: 4, md: 8 }} // <-- This creates horizontal padding
  >
    {/* Left: Brand Info */}
    <Box mb={{ base: 4, md: 0 }}>
      <Text fontSize="sm">
        <Text as="span" fontWeight="bold">Made with 🧵 and ❤️ in Seattle</Text> <Text as="span" mx={4}>
    •
  </Text>  © {new Date().getFullYear()} Olive Industries. All rights reserved. 
      </Text>
    </Box>

    {/* Right: Navigation + Social */}
    <Stack
      direction={{ base: "column", sm: "row" }}
      spacing={{ base: 2, sm: 6 }}
      align="center"
    >
      <Link href="/about" _hover={{ textDecoration: "underline" }}>
        About
      </Link>
      <Link href="/faq" _hover={{ textDecoration: "underline" }}>
        FAQ
      </Link>
      <Link href="/terms" _hover={{ textDecoration: "underline" }}>
        Terms
      </Link>
      <Link href="/privacy" _hover={{ textDecoration: "underline" }}>
        Privacy
      </Link>

      <HStack spacing={3}>
        <Link href="https://instagram.com/yourhandle" isExternal>
          <Icon as={FaInstagram} boxSize={5} />
        </Link>
        <Link href="https://pinterest.com/yourhandle" isExternal>
          <Icon as={FaPinterest} boxSize={5} />
        </Link>
<Link href="https://reddit.com/yourhandle" isExternal>
  <Icon as={FaReddit} boxSize={5} />
</Link>
      </HStack>
    </Stack>
  </Flex>
</Box>

  );
}
