import { useState, useEffect } from 'react';
import { Box, Input, SimpleGrid, Button, Text } from '@chakra-ui/react';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { DMC_COLORS } from './ColorPalette';
import UsedColors from './UsedColors';

const client = generateClient<Schema>();

interface FlossRecord {
  id: string;
  code: string;
}

export default function FlossBox() {
  const { user } = useAuthenticator(ctx => [ctx.user]);
  const [floss, setFloss] = useState<FlossRecord[]>([]);
  const [search, setSearch] = useState('');

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
  const ownedHexes = floss
    .map(f => DMC_COLORS.find(c => c.code === f.code)?.hex)
    .filter((h): h is string => !!h);

  const filtered = DMC_COLORS.filter(c =>
    c.name.toLowerCase().includes(search.toLowerCase()) ||
    c.code.includes(search)
  );

  return (
    <Box p={4}>
      <Box mb={4}>
        <Text fontWeight="bold" mb={2}>My Floss Box</Text>
        <UsedColors
          colors={ownedHexes}
          onColorClick={hex => {
            const dmc = DMC_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
            if (dmc) removeColor(dmc.code);
          }}
        />
      </Box>
      <Input
        placeholder="Search by name or code"
        value={search}
        onChange={e => setSearch(e.target.value)}
        mb={4}
      />
      <SimpleGrid columns={{ base: 2, md: 4, lg: 6 }} spacing={4}>
        {filtered.map(c => (
          <Box key={c.code} textAlign="center">
            <Box
              w="24px"
              h="24px"
              bg={c.hex}
              border="1px solid #ccc"
              borderRadius="md"
              m="0 auto"
            />
            <Text mt={1}>{c.code}</Text>
            <Button
              size="xs"
              mt={1}
              onClick={() =>
                ownedSet.has(c.code) ? removeColor(c.code) : addColor(c.code)
              }
            >
              {ownedSet.has(c.code) ? 'Remove' : 'Add'}
            </Button>
          </Box>
        ))}
      </SimpleGrid>
    </Box>
  );
}
