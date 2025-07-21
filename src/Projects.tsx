import { useState, useRef, useEffect } from "react";
import {
  Box,
  Button,
  Image,
  Input,
  Table,
  Thead,
  Tbody,
  Tr,
  Th,
  Td,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverBody,
  IconButton,
  Heading,
  Flex,
  Menu,
  MenuButton,
  MenuList,
  MenuItem,
  useBreakpointValue,
} from "@chakra-ui/react";
import { useNavigate } from "react-router-dom";
import { useAuthenticator } from "@aws-amplify/ui-react";
import { generateClient } from "aws-amplify/data";
import { getUrl, remove } from "@aws-amplify/storage";
import type { Schema } from "../amplify/data/resource";
import ImportWizard from "./ImportWizard";
import type { PatternDetails } from "./types";
import { saveProject } from "./utils";
import { estimateTimeRange } from "./timeEstimator";
import { FiInfo, FiTrash2, FiChevronDown } from "react-icons/fi";

//const SECTION_HEADER_HEIGHT = 48; // px
//const PAGE_HEADER_HEIGHT = 66;


const client = generateClient<Schema>();

interface ProjectRecord {
  id: string;
  image: string;
  imageKey: string;
  gridImage: string;
  gridKey: string;
  pattern: string;
  progress: string[];
  createdAt?: string;
}

interface ProjectActionsProps {
  continueLabel: string;
  onContinue: () => void;
  onShoppingList: () => void;
  onPathfinder: () => void;
  onDelete: () => void;
}

function ProjectActions({
  continueLabel,
  onContinue,
  onShoppingList,
  onPathfinder,
  onDelete,
}: ProjectActionsProps) {
  const useMenu = useBreakpointValue({ base: true, md: true });

  if (useMenu) {
    return (
      <Menu>
        <MenuButton
          as={Button}
          size="sm"
          bg="green.900"
          color="yellow.100"
          rightIcon={<FiChevronDown />}
        >
          Project Actions
        </MenuButton>
        <MenuList>
          <MenuItem onClick={onContinue}>{continueLabel}</MenuItem>
          <MenuItem onClick={onShoppingList}>Shopping List</MenuItem>
          <MenuItem onClick={onPathfinder}>Pathfinder</MenuItem>
          <MenuItem icon={<FiTrash2 />} onClick={onDelete}>
            Delete
          </MenuItem>
        </MenuList>
      </Menu>
    );
  }

  return (
    <>
      <Button
        size="sm"
        bg="green.900"
        color="yellow.100"
        mr={2}
        onClick={onContinue}
      >
        {continueLabel}
      </Button>
      <Button
        size="sm"
        bg="green.900"
        color="yellow.100"
        mr={2}
        onClick={onShoppingList}
      >
        Shopping List
      </Button>
      <Button
        size="sm"
        bg="green.900"
        color="yellow.100"
        mr={2}
        onClick={onPathfinder}
      >
        Pathfinder
      </Button>
      <Button size="sm" colorScheme="red" onClick={onDelete}>
        <FiTrash2 />
      </Button>
    </>
  );
}

export default function Projects() {
  const { user } = useAuthenticator((ctx) => [ctx.user]);
  const navigate = useNavigate();
  const [projects, setProjects] = useState<ProjectRecord[]>([]);
  const [importImage, setImportImage] = useState<HTMLImageElement | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const fetchProjects = async () => {
    const { data } = await client.models.Project.list();
    const records = await Promise.all(
      (data as unknown[]).map(async (raw) => {
        const p = raw as ProjectRecord;
        let imgUrl = p.image;
        let gridUrl = p.gridImage;
        if (p.image) {
          const { url } = await getUrl({ path: p.image });
          imgUrl = url.href;
        }
        if (p.gridImage) {
          const { url } = await getUrl({ path: p.gridImage });
          gridUrl = url.href;
        }
        return {
          ...p,
          image: imgUrl,
          gridImage: gridUrl,
          imageKey: p.image,
          gridKey: p.gridImage,
        };
      }),
    );
    setProjects(records);
  };

  useEffect(() => {
    if (user) {
      fetchProjects();
    }
  }, [user]);

  const handleImageUpload = (file: File | null) => {
    if (!file) return;
    const img = new window.Image();
    const reader = new FileReader();
    reader.onload = (evt) => {
      img.onload = () => setImportImage(img);
      const result = evt.target?.result;
      if (typeof result === "string") {
        img.src = result;
      }
    };
    reader.readAsDataURL(file);
    setImportFile(file);
  };

  const handleWizardComplete = async (details: PatternDetails) => {
    if (!importImage) return;
    const data = await saveProject(importFile ?? importImage.src, details);
    await fetchProjects();
    setImportImage(null);
    setImportFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
    if (data) {
      navigate("/deep-dive", {
        state: { pattern: details, progress: [], id: data.id },
      });
    }
  };

  const handleWizardCancel = () => {
    setImportImage(null);
    setImportFile(null);
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const openFileDialog = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const deleteProject = async (p: ProjectRecord) => {
    if (!window.confirm("Delete this project?")) return;
    await Promise.all([
      client.models.Project.delete({ id: p.id }),
      p.imageKey ? remove({ path: p.imageKey }) : Promise.resolve(),
      p.gridKey ? remove({ path: p.gridKey }) : Promise.resolve(),
    ]);
    fetchProjects();
  };

  const openProjects = projects.filter((p) => {
    const pattern: PatternDetails = {
      confettiLevel: 1,
      ...JSON.parse(p.pattern),
    };
    const totalSections =
      Math.ceil(pattern.grid.length / pattern.fabricCount) *
      Math.ceil((pattern.grid[0]?.length || 0) / pattern.fabricCount);
    return p.progress.length < totalSections;
  });

  const completedProjects = projects.filter((p) => {
    const pattern: PatternDetails = {
      confettiLevel: 1,
      ...JSON.parse(p.pattern),
    };
    const totalSections =
      Math.ceil(pattern.grid.length / pattern.fabricCount) *
      Math.ceil((pattern.grid[0]?.length || 0) / pattern.fabricCount);
    return p.progress.length >= totalSections;
  });

  if (!user) {
    return <Box p={4}>Please sign in to manage your projects.</Box>;
  }

  return (
    <Box p={4}>
      <Input
        type="file"
        accept="image/*"
        display="none"
        ref={fileInputRef}
        onChange={(e) =>
          handleImageUpload(e.target.files ? e.target.files[0] : null)
        }
      />
      <Box mb={8}>
        <Flex
          bg="green.900"
          color="yellow.100"
          px={4}
          py={2}
          position="sticky"
          zIndex={2}
          alignItems="center"
          top="66px"

        >
          <Heading size="md" mr={2} flex="1">
            Your Projects
          </Heading>
          <Button
            size="sm"
            bg="yellow.100"
            color="green.900"
            onClick={openFileDialog}
          >
            New Project
          </Button>
        </Flex>
        {importImage && (
          <ImportWizard
            img={importImage}
            onCancel={handleWizardCancel}
            onComplete={handleWizardComplete}
          />
        )}
        <Table variant="simple">
          <Thead
            position="sticky"
            top="114px"//{`${PAGE_HEADER_HEIGHT + SECTION_HEADER_HEIGHT}px`}
            zIndex={1}
            bg="yellow.50"
          >
          <Tr>
            <Th>Pattern</Th>
            <Th className="projects-reference-column">Reference Image</Th>
            <Th className="projects-created-column">Creation Date</Th>
            <Th className="projects-esthours-column">Est. Total Hours</Th>
            <Th className="projects-progress-column">Progress</Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          {openProjects.map((p) => {
            const pattern: PatternDetails = {
              confettiLevel: 1,
              ...JSON.parse(p.pattern),
            };
            const stitches =
              pattern.grid.length * (pattern.grid[0]?.length || 0);
            const times = estimateTimeRange(
              stitches,
              pattern.colors.length,
              pattern.confettiLevel ?? 1,
            );
            const est = `${times[4].toFixed(1)} hrs - ${times[0].toFixed(1)} hrs `;
            const created = p.createdAt
              ? new Date(p.createdAt).toLocaleDateString()
              : "";
            const totalSections =
              Math.ceil(pattern.grid.length / pattern.fabricCount) *
              Math.ceil((pattern.grid[0]?.length || 0) / pattern.fabricCount);
            const completedSections = p.progress.length;
            const percent = totalSections
              ? Math.round((completedSections / totalSections) * 100)
              : 0;
            const progressText = `${percent}% (${completedSections} / ${totalSections} Sections Complete)`;
            const remainingStitches = Math.round(
              (stitches * (totalSections - completedSections)) / totalSections,
            );
            const remainingTimes = estimateTimeRange(
              remainingStitches,
              pattern.colors.length,
              pattern.confettiLevel ?? 1,
            );
            const remainingEst = `${remainingTimes[4].toFixed(1)} hrs - ${remainingTimes[0].toFixed(1)} hrs`;
            return (
              <Tr key={p.id}>
                <Td>
                  <Image
                    src={p.gridImage}
                    alt="pattern"
                    boxSize="80px"
                    objectFit="cover"
                  />
                </Td>
                <Td className="projects-reference-column">
                  <Image
                    src={p.image}
                    alt="reference"
                    boxSize="80px"
                    objectFit="cover"
                  />
                </Td>
                <Td className="projects-created-column">{created}</Td>
                <Td className="projects-esthours-column">
                  {est}
                  <Popover placement="right">
                    <PopoverTrigger>
                      <IconButton
                        aria-label="time-info"
                        icon={<FiInfo />}
                        variant="ghost"
                        size="xs"
                        ml={1}
                      />
                    </PopoverTrigger>
                    <PopoverContent width="260px">
                      <PopoverArrow />
                      <PopoverCloseButton />
                      <PopoverBody fontSize="sm">
                        <Box fontSize="sm" mt={1}>
                          Beginner: {times[0].toFixed(1)} hrs
                          <br />
                          Level 2: {times[1].toFixed(1)} hrs
                          <br />
                          Level 3: {times[2].toFixed(1)} hrs
                          <br />
                          Level 4: {times[3].toFixed(1)} hrs
                          <br />
                          Expert: {times[4].toFixed(1)} hrs
                        </Box>
                        <Box fontSize="sm" mt={1}>
                          {" "}
                          Estimated time is based on total stitch count, number
                          of floss colors (which affect thread changes), and a
                          confetti level (how scattered the colors are). We
                          provide a range based on the stitching speed depending
                          on whether you're a beginner or advanced stitcher.
                        </Box>
                      </PopoverBody>
                    </PopoverContent>
                  </Popover>
                </Td>
                <Td className="projects-progress-column">
                  {progressText}
                  <Box fontSize="sm" mt={1} color="gray.600">
                    Time Remaining: {remainingEst}
                  </Box>
                </Td>
                <Td>
                  <ProjectActions
                    continueLabel="Continue"
                    onContinue={() =>
                      navigate("/deep-dive", {
                        state: { pattern, progress: p.progress, id: p.id },
                      })
                    }
                    onShoppingList={() =>
                      navigate("/shopping-list", { state: { pattern } })
                    }
                    onPathfinder={() =>
                      navigate("/pathfinder", { state: { pattern } })
                    }
                    onDelete={() => deleteProject(p)}
                  />
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
      </Box>
      {completedProjects.length > 0 && (
        <Box mb={8}>
          <Box
             bg="green.900"
          color="yellow.100"
          px={4}
          py={2}
          position="sticky"
          zIndex={2}
          alignItems="center"
          top="66px"

          >
            <Heading size="md">Completed</Heading>
          </Box>
          <Table variant="simple">
            <Thead
              position="sticky"
            top="100px"//{`${PAGE_HEADER_HEIGHT + SECTION_HEADER_HEIGHT}px`}
              zIndex={1}
              bg="yellow.50"
            >
              <Tr>
                <Th>Pattern</Th>
                <Th className="projects-reference-column">Reference Image</Th>
                <Th className="projects-created-column">Creation Date</Th>
                <Th className="projects-esthours-column">Est. Total Hours</Th>
                <Th className="projects-progress-column">Progress</Th>
                <Th></Th>
              </Tr>
            </Thead>
            <Tbody>
              {completedProjects.map((p) => {
                const pattern: PatternDetails = {
                  confettiLevel: 1,
                  ...JSON.parse(p.pattern),
                };
                const stitches =
                  pattern.grid.length * (pattern.grid[0]?.length || 0);
                const times = estimateTimeRange(
                  stitches,
                  pattern.colors.length,
                  pattern.confettiLevel ?? 1,
                );
                const est = `${times[4].toFixed(1)} hrs - ${times[0].toFixed(1)} hrs`;
                const created = p.createdAt
                  ? new Date(p.createdAt).toLocaleDateString()
                  : "";
                const totalSections =
                  Math.ceil(pattern.grid.length / pattern.fabricCount) *
                  Math.ceil(
                    (pattern.grid[0]?.length || 0) / pattern.fabricCount,
                  );
                const completedSections = p.progress.length;
                const percent = totalSections
                  ? Math.round((completedSections / totalSections) * 100)
                  : 0;
                const progressText = `${percent}% (${completedSections} / ${totalSections} Sections Complete)`;
                const remainingStitches = Math.round(
                  (stitches * (totalSections - completedSections)) /
                    totalSections,
                );
                const remainingTimes = estimateTimeRange(
                  remainingStitches,
                  pattern.colors.length,
                  pattern.confettiLevel ?? 1,
                );
                const remainingEst = `${remainingTimes[4].toFixed(1)} hrs - ${remainingTimes[0].toFixed(1)} hrs`;
                return (
                  <Tr key={p.id}>
                    <Td>
                      <Image
                        src={p.gridImage}
                        alt="pattern"
                        boxSize="80px"
                        objectFit="cover"
                      />
                    </Td>
                    <Td className="projects-reference-column">
                      <Image
                        src={p.image}
                        alt="reference"
                        boxSize="80px"
                        objectFit="cover"
                      />
                    </Td>
                    <Td className="projects-created-column">{created}</Td>
                    <Td className="projects-esthours-column">
                      {est}
                      <Popover placement="right">
                        <PopoverTrigger>
                          <IconButton
                            aria-label="time-info"
                            icon={<FiInfo />}
                            variant="ghost"
                            size="xs"
                            ml={1}
                          />
                        </PopoverTrigger>
                        <PopoverContent width="260px">
                          <PopoverArrow />
                          <PopoverCloseButton />
                          <PopoverBody fontSize="sm">
                            <Box fontSize="sm" mt={1}>
                              Beginner: {times[0].toFixed(1)} hrs
                              <br />
                              Level 2: {times[1].toFixed(1)} hrs
                              <br />
                              Level 3: {times[2].toFixed(1)} hrs
                              <br />
                              Level 4: {times[3].toFixed(1)} hrs
                              <br />
                              Expert: {times[4].toFixed(1)} hrs
                            </Box>
                            <Box fontSize="sm" mt={1}>
                              {" "}
                              Estimated time is based on total stitch count,
                              number of floss colors (which affect thread
                              changes), and a confetti level (how scattered the
                              colors are). We provide a range based on the
                              stitching speed depending on whether you're a
                              beginner or advanced stitcher.
                            </Box>
                          </PopoverBody>
                        </PopoverContent>
                      </Popover>
                    </Td>
                    <Td className="projects-progress-column">
                      {progressText}
                      <Box fontSize="sm" mt={1} color="gray.600">
                        Time Remaining: {remainingEst}
                      </Box>
                    </Td>
                    <Td>
                      <ProjectActions
                        continueLabel="Revisit"
                        onContinue={() =>
                          navigate("/deep-dive", {
                            state: { pattern, progress: p.progress, id: p.id },
                          })
                        }
                        onShoppingList={() =>
                          navigate("/shopping-list", { state: { pattern } })
                        }
                        onPathfinder={() =>
                          navigate("/pathfinder", { state: { pattern } })
                        }
                        onDelete={() => deleteProject(p)}
                      />
                    </Td>
                  </Tr>
                );
              })}
            </Tbody>
          </Table>
        </Box>
      )}
    </Box>
  );
}
