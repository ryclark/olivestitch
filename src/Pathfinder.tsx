"use client";

import { Box, Text } from "@chakra-ui/react";
import { useEffect, useState } from "react";
import { useLocation } from "react-router-dom";
import { generateClient } from "aws-amplify/api";
import type { Schema } from "../amplify/data/resource";
import type { PatternDetails } from "./types";

// Use explicit auth mode so requests include the user's JWT
const client = generateClient<Schema>({ authMode: 'userPool' });

interface LocationState {
  pattern?: PatternDetails;
  id?: string;
}

interface PathRecord {
  id: string;
  projectID: string;
  segmentID: string;
  color?: string | null;
  pathXs?: number[] | null;
  pathYs?: number[] | null;
}



export default function Pathfinder() {
  const location = useLocation();
  const { pattern, id } = (location.state as LocationState) || {};
  const [result, setResult] = useState<string | null>(null);
  const [segment, setSegment] = useState<PathRecord | null>(null);



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
          if (id) {
            const { data } = await client.models.Path.list({
              filter: { projectID: { eq: id } },
              limit: 1,
            });
            const first = (data as PathRecord[])[0];
            setSegment(first ?? null);
          }
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
      <Text style={{ fontFamily: 'monospace', whiteSpace: 'pre-wrap' }}>
        {`Pathfinder result:\n${result}`}
      </Text>
      {segment && (
        <Box mt={4} fontFamily="monospace" whiteSpace="pre-wrap">
          {`Segment ${segment.segmentID}\nColor: ${segment.color ?? 'N/A'}\nPath: ${
            segment.pathXs && segment.pathYs
              ? segment.pathXs
                  .map((x, idx) => `(${x},${segment.pathYs?.[idx]})`)
                  .join(' \u2192 ')
              : 'None'
          }`}
        </Box>
      )}
    </Box>
  );
}
