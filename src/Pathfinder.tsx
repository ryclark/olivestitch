"use client";

import { Box, Text, VStack, Code } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { generateClient } from "aws-amplify/api";
import type { Schema } from "../amplify/data/resource";

const client = generateClient<Schema>();

export default function Pathfinder() {
  const [result, setResult] = useState<
    { color: string; path: [number, number][] }[] | null
  >(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function fetchPath() {
      try {
        // Example grid: a 5x5 grid with some colors
        const grid = [
          ["red", "red", "blue", "blue", "green"],
          ["red", "blue", "blue", "green", "green"],
          ["yellow", "yellow", "blue", "green", "green"],
          ["yellow", "blue", "blue", "green", "green"],
          ["yellow", "blue", "purple", "purple", "purple"],
        ];

        const response = await client.queries.pathFinder({
          grid,
          max_stitches: 150,
          max_jump: 5,
        });

        console.log("Full response from pathFinder:", response);

        if (response?.data) {
          setResult(response.data);
        } else {
          setError("No data returned.");
        }

      } catch (err: any) {
        console.error("pathFinder error:", err);
        setError("Error occurred");
      }
    }

    fetchPath();
  }, []);

  return (
    <Box p={4}>
      <Text fontSize="xl" mb={4}>Pathfinder result:</Text>

      {error && <Text color="red.500">{error}</Text>}
      {!result && !error && <Text>Loading...</Text>}

      {result && (
        <VStack align="start" spacing={4}>
          {result.map((seg, index) => (
            <Box key={index} border="1px solid #ccc" p={2} borderRadius="md">
              <Text fontWeight="bold">Color: {seg.color}</Text>
              <Code fontSize="sm">
                {JSON.stringify(seg.path)}
              </Code>
            </Box>
          ))}
        </VStack>
      )}
    </Box>
  );
}
