"use client";

import { Box, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { generateClient } from "aws-amplify/api";
import type { Schema } from "../amplify/data/resource";
import type { PatternDetails } from "./types";

const client = generateClient<Schema>();

interface LocationState {
  pattern?: PatternDetails;
}


function isStringGrid(value: unknown): value is string[][] {
  return Array.isArray(value) &&
    value.every(row =>
      Array.isArray(row) &&
      row.every(cell => typeof cell === "string")
    );
}

export default function Pathfinder() {
  const location = useLocation();
  const { pattern } = (location.state as LocationState) || {};
  const [result, setResult] = useState<string | null>(null);



  useEffect(() => {
    async function fetchPath() {
      if (!pattern) {
        setResult("No pattern selected.");
        return;
      }
      try {
        const response = await client.queries.pathFinder({ grid: pattern.grid });

        // Full logging for visibility
        console.log("Full response from pathFinder:", response);

        if (response?.data) {
          setResult(response.data);
        } else {
          setResult("No data returned.");
        }
      } catch (err: unknown) {
        console.error("pathFinder error:", err);
        setResult("Error occurred");
      }
    }

    fetchPath();
  }, [pattern]);

  return (
    <Box p={4}>
      <Text>`There are {pattern.grid.length} rows and {pattern.grid[0].length} columns.`;</Text>
      <Text>Pathfinder result: {result ?? "Loading..."}</Text>
    </Box>
  );
}
