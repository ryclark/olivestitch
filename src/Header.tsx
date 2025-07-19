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
  useDisclosure,
} from '@chakra-ui/react';
import { Authenticator, useAuthenticator } from '@aws-amplify/ui-react';
import { useNavigate } from 'react-router-dom';
import logo from './images/logo.webp';


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
    <Box as="header" position="sticky" width="100%" top="0" zIndex="docked" bg="teal.800" boxShadow="sm">
      <Flex align="center" minW="960px" width="100%" maxW="960px" mx="auto" p={2}>
        <Image src={logo} alt="SnapStitch logo" boxSize="50px" borderRadius="md" mr={3} />
        <Heading
          size="xl"
          fontFamily="'Playfair Display SC', serif"
          letterSpacing="widest"
          color="teal.100"
          textTransform="none"
        >
          Olive & Thread
        </Heading>
        <Spacer />
        {user && (
          <>
            <Button
              colorScheme="teal"
              size="sm"
              mr={2}
              onClick={() => navigate('/projects')}
            >
              My Projects
            </Button>
            <Button
              colorScheme="teal"
              size="sm"
              mr={2}
              onClick={() => navigate('/floss-box')}
            >
              Floss Box
            </Button>
          </>
        )}
        <Button colorScheme="teal" size="sm" onClick={user ? signOut : onOpen}>
          {user ? 'Logout' : 'Join or Sign in'}
        </Button>
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
