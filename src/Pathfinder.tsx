import { Box } from '@chakra-ui/react';
import type { Schema } from "../amplify/data/resource"
import { generateClient } from "aws-amplify/api"


const client = generateClient<Schema>()


export default function Pathfinder() {
  return <Box p={4}>Pathfinder placeholder.</Box>;
}
client.queries.sayHello({
  name: "Amplify",
})