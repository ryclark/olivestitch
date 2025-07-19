import { Box, Heading, Text, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';
import { useLocation } from 'react-router-dom';
import type { PatternDetails } from './types';
import { DMC_COLORS } from './ColorPalette';

interface LocationState {
  pattern?: PatternDetails;
}

const STITCHES_PER_SKEIN = 400; // approximate stitches per skein using two strands

function getNeedleSize(fabricCount: number): number {
  if (fabricCount <= 14) return 24; // e.g. Aida 14
  if (fabricCount <= 18) return 26; // Aida 16-18
  if (fabricCount <= 28) return 26; // Linen/Evenweave 28
  if (fabricCount <= 32) return 24; // Linen 32
  return 22;
}

function closestHoopSize(d: number): number {
  const sizes = [4, 5, 6, 7, 8, 9, 10, 12, 14, 17, 18];
  for (const s of sizes) {
    if (d <= s) return s;
  }
  return sizes[sizes.length - 1];
}

export default function ShoppingList() {
  const location = useLocation();
  const { pattern } = (location.state as LocationState) || {};

  if (!pattern) {
    return <Box p={4}>No pattern selected.</Box>;
  }

  const stitchWidth = pattern.grid[0]?.length || 0;
  const stitchHeight = pattern.grid.length;
  const fabricInchWidth = stitchWidth / pattern.fabricCount;
  const fabricInchHeight = stitchHeight / pattern.fabricCount;
  const margin = 3; // inches of buffer on each side
  const fabricWidth = fabricInchWidth + margin * 2;
  const fabricHeight = fabricInchHeight + margin * 2;

  const needle = getNeedleSize(pattern.fabricCount);
  const hoopDim = Math.max(fabricInchWidth, fabricInchHeight) + 4;
  const hoop = closestHoopSize(hoopDim);

  return (
    <Box p={4} maxW="600px" m="0 auto">
      <Heading size="lg" mb={4}>Shopping List</Heading>
      <Box mb={4}>
        <Text fontWeight="bold">Fabric:</Text>
        <Box as="ul" pl={4} mt={1}>
          <li>
            <Text>{pattern.fabricCount}-count Aida</Text>
          </li>
          <li>
            <Text>
              Dimensions: at least {fabricWidth.toFixed(1)}" x {fabricHeight.toFixed(1)}" ({fabricInchWidth.toFixed(1)}" x {fabricInchHeight.toFixed(1)}" for the pattern, at least {margin}" buffer on each side and to accommodate the hoop size)
            </Text>
          </li>
        </Box>
      </Box>
      <Box mb={4}>
        <Text fontWeight="bold">Needle:</Text>
        <Text>Tapestry size {needle}</Text>
      </Box>
      <Box mb={4}>
        <Text fontWeight="bold">Hoop or Frame:</Text>
        <Text>Use at least a {hoop}" hoop or frame</Text>
      </Box>
      <Box mb={4}>
        <Text fontWeight="bold" mb={2}>Floss:</Text>
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Color</Th>
              <Th>Stitches</Th>
              <Th>Skeins</Th>
            </Tr>
          </Thead>
          <Tbody>
            {pattern.colors.map(hex => {
              const dmc = DMC_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
              const stitches = pattern.colorUsage[hex] || 0;
              const skeins = Math.ceil((stitches / STITCHES_PER_SKEIN) * 100) / 100;
              return (
                <Tr key={hex}>
                  <Td>{dmc ? `${dmc.name} (#${dmc.code})` : hex}</Td>
                  <Td>{stitches}</Td>
                  <Td>{skeins.toFixed(2)}</Td>
                </Tr>
              );
            })}
          </Tbody>
        </Table>
      </Box>
      <Box>
        <Text fontWeight="bold" mb={1}>Optional:</Text>
        <ul>
          <li>Needle threader – easier threading</li>
          <li>Floss bobbins or organizers</li>
          <li>Project bag or pouch</li>
          <li>Magnifier or good lighting</li>
        </ul>
      </Box>
    </Box>
  );
}
