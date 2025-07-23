"use client";

import { Box, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/api";
import type { Schema } from "../amplify/data/resource";

const client = generateClient<Schema>();

export default function Pathfinder() {
  const [result, setResult] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPath() {
      try {
        const response = await client.queries.pathFinder({ name: "Amplify" });
        setResult(response.data);
      } catch (err) {
        console.error("pathFinder error:", err);
      }
    }

    fetchPath();
  }, []);

  return (
    <Box p={4}>
      <Text>Pathfinder result: {result ?? "Loading..."}</Text>
    </Box>
  );
}
