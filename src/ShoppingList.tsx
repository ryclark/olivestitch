import {
  Box,
  Heading,
  Text,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Flex,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverBody,
  IconButton,
  Button,
} from '@chakra-ui/react';
import { FiInfo } from 'react-icons/fi';
import { useLocation, useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';
import { useEffect, useState, useMemo } from 'react';
import type { PatternDetails } from './types';
import { DMC_COLORS } from './ColorPalette';

interface LocationState {
  pattern?: PatternDetails;
}

const STITCHES_PER_SKEIN = 400; // approximate stitches per skein using two strands

function getNeedleSize(fabricCount: number): number {
  if (fabricCount <= 11) return 22;
  if (fabricCount <= 14) return 24;
  if (fabricCount <= 18) return 26;
  if (fabricCount <= 32) return 26;
  return 28;
}

function closestHoopSize(d: number): number {
  const sizes = [4, 5, 6, 7, 8, 9, 10, 12, 14, 17, 18];
  for (const s of sizes) {
    if (d <= s) return s;
  }
  return sizes[sizes.length - 1];
}

const client = generateClient<Schema>();

interface FlossRecord {
  id: string;
  code: string;
}

export default function ShoppingList() {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuthenticator(ctx => [ctx.user]);
  const { pattern } = (location.state as LocationState) || {};
  const [floss, setFloss] = useState<FlossRecord[]>([]);

  useEffect(() => {
    if (!user) return;
    client.models.Floss.list().then(({ data }) => {
      setFloss(data as FlossRecord[]);
    });
  }, [user]);


  const stitchWidth = pattern?.grid[0]?.length || 0;
  const stitchHeight = pattern?.grid.length || 0;
  const fabricInchWidth = pattern ? stitchWidth / pattern.fabricCount : 0;
  const fabricInchHeight = pattern ? stitchHeight / pattern.fabricCount : 0;
  const margin = 3; // inches of buffer on each side
  const fabricWidth = fabricInchWidth + margin * 2;
  const fabricHeight = fabricInchHeight + margin * 2;

  const needle = getNeedleSize(pattern?.fabricCount ?? 14);
  const hoopDim = Math.max(fabricInchWidth, fabricInchHeight) + 4;
  const hoop = closestHoopSize(hoopDim);

  const ownedSet = useMemo(() => new Set(floss.map(f => f.code)), [floss]);
  const flossRows = useMemo(() => {
    if (!pattern) return [];
    return pattern.colors.map(hex => {
      const dmc = DMC_COLORS.find(c => c.hex.toLowerCase() === hex.toLowerCase());
      const stitches = pattern.colorUsage[hex] || 0;
      const skeins = Math.ceil((stitches / STITCHES_PER_SKEIN) * 100) / 100;
      return { hex, dmc, stitches, skeins };
    });
  }, [pattern]);

  const needRows = flossRows.filter(r => !r.dmc || !ownedSet.has(r.dmc.code));
  const haveRows = flossRows.filter(r => r.dmc && ownedSet.has(r.dmc.code));

  if (!pattern) {
    return <Box p={4}>No pattern selected.</Box>;
  }

  return (
    <Box p={4} maxW="600px" m="0 auto">
      <Button mb={4} onClick={() => navigate(-1)} bg="green.900" color="yellow.100">Back</Button>
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
        <Flex align="center" mb={1}>
          <Text fontWeight="bold">Needle:</Text>
          <Popover placement="right">
            <PopoverTrigger>
              <IconButton aria-label="needle-info" icon={<FiInfo />} variant="ghost" size="xs" ml={1} />
            </PopoverTrigger>
            <PopoverContent width="260px">
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverBody fontSize="sm">
                <Table size="sm">
                  <Thead>
                    <Tr>
                      <Th>Fabric</Th>
                      <Th>Count</Th>
                      <Th>Needle</Th>
                    </Tr>
                  </Thead>
                  <Tbody>
                    <Tr>
                      <Td>Aida</Td>
                      <Td>11</Td>
                      <Td>22</Td>
                    </Tr>
                    <Tr>
                      <Td>Aida</Td>
                      <Td>14</Td>
                      <Td>24</Td>
                    </Tr>
                    <Tr>
                      <Td>Aida</Td>
                      <Td>16</Td>
                      <Td>26</Td>
                    </Tr>
                    <Tr>
                      <Td>Linen</Td>
                      <Td>28-32</Td>
                      <Td>26-28</Td>
                    </Tr>
                  </Tbody>
                </Table>
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </Flex>
        <Text>Tapestry size {needle}</Text>
      </Box>
      <Box mb={4}>
        <Flex align="center" mb={1}>
          <Text fontWeight="bold">Hoop or Frame:</Text>
          <Popover placement="right">
            <PopoverTrigger>
              <IconButton aria-label="hoop-info" icon={<FiInfo />} variant="ghost" size="xs" ml={1} />
            </PopoverTrigger>
            <PopoverContent width="260px">
              <PopoverArrow />
              <PopoverCloseButton />
              <PopoverBody fontSize="sm">
                We take the larger dimension of your design, add four inches for comfortable working area,
                then choose the next available hoop size that is at least that big.
              </PopoverBody>
            </PopoverContent>
          </Popover>
        </Flex>
        <Text>Use at least a {hoop}" hoop or frame</Text>
      </Box>
      <Box mb={4}>
        <Text fontWeight="bold" mb={2}>Floss:</Text>
        <Table size="sm">
          <Thead>
            <Tr>
              <Th>Color</Th>
              <Th>Stitches</Th>
              <Th>
                <Flex align="center">
                  Skeins
                  <Popover placement="right">
                    <PopoverTrigger>
                      <IconButton aria-label="skein-info" icon={<FiInfo />} variant="ghost" size="xs" ml={1} />
                    </PopoverTrigger>
                    <PopoverContent width="260px">
                      <PopoverArrow />
                      <PopoverCloseButton />
                      <PopoverBody fontSize="sm">
                        We assume about {STITCHES_PER_SKEIN} stitches per skein using two strands of floss.
                        The stitch count for each color is divided by this number and rounded up.
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                </Flex>
              </Th>
            </Tr>
          </Thead>
          <Tbody>
            {needRows.map(row => (
              <Tr key={row.hex}>
                <Td>{row.dmc ? `${row.dmc.name} (#${row.dmc.code})` : row.hex}</Td>
                <Td>{row.stitches}</Td>
                <Td>{row.skeins.toFixed(2)}</Td>
              </Tr>
            ))}
          </Tbody>
        </Table>
        {haveRows.length > 0 && (
          <Box mt={4}>
            <Text fontWeight="bold" mb={2}>Floss You Said You Have (double check quantity)</Text>
            <Table size="sm">
              <Thead>
                <Tr>
                  <Th>Color</Th>
                  <Th>Stitches</Th>
                  <Th>Skeins</Th>
                </Tr>
              </Thead>
              <Tbody>
                {haveRows.map(row => (
                  <Tr key={row.hex}>
                    <Td>{row.dmc ? `${row.dmc.name} (#${row.dmc.code})` : row.hex}</Td>
                    <Td>{row.stitches}</Td>
                    <Td>{row.skeins.toFixed(2)}</Td>
                  </Tr>
                ))}
              </Tbody>
            </Table>
          </Box>
        )}
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
