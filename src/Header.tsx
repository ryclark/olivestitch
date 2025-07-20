import { useEffect } from 'react';
import {
  Box,
  Flex,
  Heading,
  Spacer,
  Button,
  Image,
  Modal,
  ModalOverlay,
  ModalContent,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useDisclosure,
} from '@chakra-ui/react';
import { FiUser } from 'react-icons/fi';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { useNavigate } from 'react-router-dom';
//import logo from './images/logo.webp';
import logo from './images/logo2.webp';

export default function Header() {
  const { isOpen, onOpen, onClose } = useDisclosure();
  const { user, signOut } = useAuthenticator(ctx => [ctx.user]);
  const navigate = useNavigate();
  useEffect(() => {
    if (user) {
      onClose();
    }
  }, [user, onClose]);

  return (
    <Box as="header" position="sticky" width="100%" top="0" zIndex="docked" bg="green.900" boxShadow="sm">
      <Flex align="center" minW="960px" width="100%" maxW="960px" mx="auto" p={2}>
        <Image src={logo} alt="SnapStitch logo" boxSize="50px" borderRadius="md" mr={3} />
        <Heading
          size="xl"
          fontFamily="'Playfair Display SC', serif"
          letterSpacing="tight"
          color="yellow.100"
          textTransform="none"
        >
          Olive{' '}
          <Box as="span" fontSize="0.8em">
            &amp;
          </Box>{' '}
          Thread
        </Heading>
        <Spacer />
        {user ? (
          <Menu>
            <MenuButton
              as={Button}
              bg="yellow.100"
              color="green.900"
              _hover={{ bg: "green.900", color: "yellow.100", borderColor: "yellow.100" }}
              size="sm"
              mr={2}
            >
              <FiUser fontSize="1.2rem" />
            </MenuButton>
            <MenuList bg="green.900" color="yellow.100" borderColor="yellow.100">
              <MenuItem bg="green.900" _hover={{ bg: "yellow.100", color: "green.900" }} onClick={() => navigate('/projects')}>
                Projects
              </MenuItem>
              <MenuItem bg="green.900" _hover={{ bg: "yellow.100", color: "green.900" }} onClick={() => navigate('/floss-box')}>
                Floss Box
              </MenuItem>
              <MenuItem bg="green.900" _hover={{ bg: "yellow.100", color: "green.900" }} onClick={() => navigate('/my-account')}>
                My Account
              </MenuItem>
              <MenuItem bg="green.900" _hover={{ bg: "yellow.100", color: "green.900" }} onClick={signOut}>
                Logout
              </MenuItem>
            </MenuList>
          </Menu>
        ) : (
          <Button bg="green.900" color="yellow.100" size="sm" onClick={onOpen}>
            Join or Sign in
          </Button>
        )}
      </Flex>
      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
            <Authenticator />
        </ModalContent>
      </Modal>
    </Box>
  );
}
