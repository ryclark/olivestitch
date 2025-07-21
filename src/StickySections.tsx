import { Box, Heading, Table, Thead, Tbody, Tr, Th, Td } from '@chakra-ui/react';

interface Row {
  id: number;
  name: string;
  value: string;
}

interface Section {
  title: string;
  rows: Row[];
}

const sections: Section[] = Array.from({ length: 3 }).map((_, sIndex) => {
  const rows: Row[] = Array.from({ length: 10 }).map((__, rIndex) => ({
    id: rIndex,
    name: `Item ${rIndex + 1}`,
    value: `Value ${sIndex + 1}-${rIndex + 1}`,
  }));
  return {
    title: `Section ${sIndex + 1}`,
    rows,
  };
});

const HEADER_HEIGHT = 48; // px

export default function StickySections() {
  return (
    <Box>
      {sections.map((section) => (
        <Box key={section.title} mb={8}>
          <Box
            bg="green.900"
            color="yellow.100"
            px={4}
            py={2}
            position="sticky"
            top={0}
            zIndex={2}
          >
            <Heading size="md">{section.title}</Heading>
          </Box>
          <Table variant="simple">
            <Thead
              position="sticky"
              top={`${HEADER_HEIGHT}px`}
              zIndex={1}
              bg="yellow.50"
            >
              <Tr>
                <Th>Name</Th>
                <Th>Value</Th>
              </Tr>
            </Thead>
            <Tbody>
              {section.rows.map((row) => (
                <Tr key={row.id}>
                  <Td>{row.name}</Td>
                  <Td>{row.value}</Td>
                </Tr>
              ))}
            </Tbody>
          </Table>
        </Box>
      ))}
    </Box>
  );
}
