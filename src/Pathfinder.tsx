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
  id?: string;
}



export default function Pathfinder() {
  const location = useLocation();
  const { pattern, id } = (location.state as LocationState) || {};
  const [result, setResult] = useState<string | null>(null);



  useEffect(() => {
    async function fetchPath() {
      if (!pattern) {
        setResult("No pattern selected.");
        return;
      }
      try {
        const response = await client.queries.pathFinder({
          grid: pattern.grid,
          projectID: id ?? "",
        });

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
  }, [pattern, id]);

  return (
    <Box p={4}>
      {pattern && (
        <Text >
          {`There are ${pattern.grid.length} rows and ${pattern.grid[0].length} columns.`}
        </Text>
      )}
      <Text style={{ fontFamily: 'monospace' }}>
        {`Pathfinder result:\n${result}`}
      </Text>
    </Box>
  );
}
