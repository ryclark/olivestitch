import { useState, useEffect } from 'react';
import { Box, Input, SimpleGrid, Button, Text, Flex } from '@chakra-ui/react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { DMC_COLORS } from './ColorPalette';

const client = generateClient<Schema>();

interface FlossRecord {
  id: string;
  code: string;
}

export default function FlossBox() {
  const { user } = useAuthenticator(ctx => [ctx.user]);
  const [floss, setFloss] = useState<FlossRecord[]>([]);
  const [searchMine, setSearchMine] = useState('');
  const [searchAll, setSearchAll] = useState('');

  const fetchFloss = async () => {
    const { data } = await client.models.Floss.list();
    setFloss(data as FlossRecord[]);
  };

  useEffect(() => {
    if (user) fetchFloss();
  }, [user]);

  const addColor = async (code: string) => {
    if (floss.some(f => f.code === code)) return;
    await client.models.Floss.create({ code });
    fetchFloss();
  };

  const removeColor = async (code: string) => {
    const entry = floss.find(f => f.code === code);
    if (!entry) return;
    await client.models.Floss.delete({ id: entry.id });
    fetchFloss();
  };

  if (!user) {
    return <Box p={4}>Please sign in to manage your floss box.</Box>;
  }

  const ownedSet = new Set(floss.map(f => f.code));
  const ownedColors = DMC_COLORS.filter(c => ownedSet.has(c.code));
  const availableColors = DMC_COLORS.filter(c => !ownedSet.has(c.code));

  const filteredOwned = ownedColors.filter(c =>
    c.name.toLowerCase().includes(searchMine.toLowerCase()) ||
    c.code.includes(searchMine)
  );

  const filteredAvail = availableColors.filter(c =>
    c.name.toLowerCase().includes(searchAll.toLowerCase()) ||
    c.code.includes(searchAll)
  );

  return (
    <Box p={4}>
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4} alignItems="flex-start">
        <Box>
          <Text fontWeight="bold" mb={2}>My Floss</Text>
          <Input
            placeholder="Search by name or code"
            value={searchMine}
            onChange={e => setSearchMine(e.target.value)}
            mb={2}
          />
          <Box maxH="70vh" overflowY="auto">
            {filteredOwned.map(c => (
              <Flex key={c.code} align="center" mb={1}>
                <Box
                  w="24px"
                  h="24px"
                  bg={c.hex}
                  border="1px solid #ccc"
                  borderRadius="md"
                  mr={2}
                />
                <Text flex="1">{c.code} - {c.name}</Text>
                <Button size="xs" onClick={() => removeColor(c.code)}>Remove</Button>
              </Flex>
            ))}
          </Box>
        </Box>
        <Box>
          <Text fontWeight="bold" mb={2}>DMC Colors</Text>
          <Input
            placeholder="Search by name or code"
            value={searchAll}
            onChange={e => setSearchAll(e.target.value)}
            mb={2}
          />
          <Box maxH="70vh" overflowY="auto">
            {filteredAvail.map(c => (
              <Flex key={c.code} align="center" mb={1}>
                <Box
                  w="24px"
                  h="24px"
                  bg={c.hex}
                  border="1px solid #ccc"
                  borderRadius="md"
                  mr={2}
                />
                <Text flex="1">{c.code} - {c.name}</Text>
                <Button size="xs" onClick={() => addColor(c.code)}>Add</Button>
              </Flex>
            ))}
          </Box>
        </Box>
      </SimpleGrid>
    </Box>
  );
}
