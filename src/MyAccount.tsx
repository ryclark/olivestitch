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
import { Auth } from 'aws-amplify';
import { useAuthenticator } from '@aws-amplify/ui-react';

export default function MyAccount() {
  const { user } = useAuthenticator(ctx => [ctx.user]);

  const handleChangePassword = async () => {
    const oldPassword = window.prompt('Current password');
    const newPassword = window.prompt('New password');
    if (oldPassword && newPassword) {
      try {
        await Auth.changePassword(user, oldPassword, newPassword);
        window.alert('Password updated');
      } catch (err) {
        window.alert('Failed to change password');
      }
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm('Delete your account? This action cannot be undone.')) return;
    try {
      await Auth.deleteUser();
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
                <Input value={user.attributes?.given_name ?? ''} isReadOnly />
              </FormControl>
              <FormControl>
                <FormLabel>Family Name</FormLabel>
                <Input value={user.attributes?.family_name ?? ''} isReadOnly />
              </FormControl>
              <FormControl>
                <FormLabel>Email</FormLabel>
                <Input value={user.attributes?.email ?? ''} isReadOnly />
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
