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

        // Full logging for visibility
        console.log("Full response from pathFinder:", response);

        if (response?.data) {
          setResult(response.data);
        } else {
          setResult("No data returned.");
        }

      } catch (err: any) {
        console.error("pathFinder error:", err);
        setResult("Error occurred");
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
