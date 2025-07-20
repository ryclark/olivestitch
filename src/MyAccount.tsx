import {
  Box,
  Tabs,
  TabList,
  TabPanels,
  Tab,
  TabPanel,
  FormControl,
  FormLabel,
  Input,
  Button,
  VStack,
} from '@chakra-ui/react';
import {
  updatePassword,
  deleteUser,
  fetchUserAttributes,
  type FetchUserAttributesOutput,
} from 'aws-amplify/auth';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { useEffect, useState } from 'react';

export default function MyAccount() {
  const { user } = useAuthenticator(ctx => [ctx.user]);
  const [attributes, setAttributes] = useState<FetchUserAttributesOutput | null>(
    null,
  );

  useEffect(() => {
    const loadAttributes = async () => {
      try {
        const attrs = await fetchUserAttributes();
        setAttributes(attrs);
      } catch {
        setAttributes(null);
      }
    };
    if (user) {
      loadAttributes();
    }
  }, [user]);

  const handleChangePassword = async () => {
    const oldPassword = window.prompt('Current password');
    const newPassword = window.prompt('New password');
    if (oldPassword && newPassword) {
      try {
        await updatePassword({ oldPassword, newPassword });
        window.alert('Password updated');
      } catch (err) {
        window.alert('Failed to change password');
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your account? This action cannot be undone.')) return;
    try {
      await deleteUser();
    } catch (err) {
      window.alert('Failed to delete account');
    }
  };

  if (!user) {
    return <Box p={4}>Please sign in to manage your account.</Box>;
  }

  return (
    <Box p={4} maxW="600px" mx="auto">
      <Tabs isFitted variant="enclosed">
        <TabList mb={4}>
          <Tab>Profile</Tab>
          <Tab>Achievements</Tab>
          <Tab>Olive &amp; Thread Pro</Tab>
        </TabList>
        <TabPanels>
          <TabPanel>
            <VStack spacing={4} align="stretch">
              <FormControl>
                <FormLabel>Given Name</FormLabel>
                <Input value={attributes?.given_name ?? ''} isReadOnly />
              </FormControl>
              <FormControl>
                <FormLabel>Family Name</FormLabel>
                <Input value={attributes?.family_name ?? ''} isReadOnly />
              </FormControl>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input value={attributes?.email ?? ''} isReadOnly />
              </FormControl>
              <Button alignSelf="flex-start" bg="green.900" color="yellow.100" onClick={handleChangePassword}>
                Change Password
              </Button>
              <Button alignSelf="flex-start" colorScheme="red" variant="outline" onClick={handleDeleteAccount}>
                Delete Account
              </Button>
            </VStack>
          </TabPanel>
          <TabPanel>
            Achievements coming soon.
          </TabPanel>
          <TabPanel>
            Olive &amp; Thread Pro coming soon.
          </TabPanel>
        </TabPanels>
      </Tabs>
    </Box>
  );
}
