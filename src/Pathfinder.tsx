import { Box } from '@chakra-ui/react';
import type { Schema } from "../amplify/data/resource"

const client = generateClient<Schema>()


export default function Pathfinder() {
  return <Box p={4}>Pathfinder placeholder.</Box>;
}
client.queries.sayHello({
  name: "Amplify",
})