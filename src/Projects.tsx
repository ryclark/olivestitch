import { useState, useRef, useEffect } from 'react';
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
  IconButton
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { getUrl, remove } from '@aws-amplify/storage';
import type { Schema } from '../amplify/data/resource';
import ImportWizard from './ImportWizard';
import type { PatternDetails } from './types';
import { saveProject } from './utils';
import { estimateTimeRange } from './timeEstimator';
import { FiInfo } from "react-icons/fi";


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

export default function Projects() {
  const { user } = useAuthenticator(ctx => [ctx.user]);
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
      })
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
    reader.onload = evt => {
      img.onload = () => setImportImage(img);
      const result = evt.target?.result;
      if (typeof result === 'string') {
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
    if (fileInputRef.current) fileInputRef.current.value = '';
    if (data) {
      navigate('/deep-dive', {
        state: { pattern: details, progress: [], id: data.id },
      });
    }
  };

  const handleWizardCancel = () => {
    setImportImage(null);
    setImportFile(null);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const openFileDialog = () => {
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const deleteProject = async (p: ProjectRecord) => {
    if (!window.confirm('Delete this project?')) return;
    await Promise.all([
      client.models.Project.delete({ id: p.id }),
      p.imageKey ? remove({ path: p.imageKey }) : Promise.resolve(),
      p.gridKey ? remove({ path: p.gridKey }) : Promise.resolve(),
    ]);
    fetchProjects();
  };

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
        onChange={e => handleImageUpload(e.target.files ? e.target.files[0] : null)}
      />
      <Button mb={4} colorScheme="teal" onClick={openFileDialog}>
        New Project
      </Button>
      {importImage && (
        <ImportWizard
          img={importImage}
          onCancel={handleWizardCancel}
          onComplete={handleWizardComplete}
        />
      )}
      <Table variant="simple">
        <Thead>
          <Tr>
            <Th>Pattern</Th>
            <Th>Reference Image</Th>
            <Th>Creation Date</Th>
            <Th>Est. Hours</Th>
            <Th>Progress</Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          {projects.map(p => {
            const pattern: PatternDetails = {
              confettiLevel: 1,
              ...JSON.parse(p.pattern)
            };
            const stitches = pattern.grid.length * (pattern.grid[0]?.length || 0);
            const times = estimateTimeRange(
              stitches,
              pattern.colors.length,
              pattern.confettiLevel ?? 1
            );
            const est = `${times[4].toFixed(1)} hrs - ${times[0].toFixed(1)} hrs `;
            const created = p.createdAt
              ? new Date(p.createdAt).toLocaleDateString()
              : '';
            const totalSections =
              Math.ceil(pattern.grid.length / pattern.fabricCount) *
              Math.ceil((pattern.grid[0]?.length || 0) / pattern.fabricCount);
            const completedSections = p.progress.length;
            const percent = totalSections
              ? Math.round((completedSections / totalSections) * 100)
              : 0;
            const progressText = `${percent}% (${completedSections} / ${totalSections} Sections Complete)`;
            return (
              <Tr key={p.id}>
                <Td>
                  <Image src={p.gridImage} alt="pattern" boxSize="80px" objectFit="cover" />
                </Td>
                <Td>
                  <Image src={p.image} alt="reference" boxSize="80px" objectFit="cover" />
                </Td>
                <Td>{created}</Td>
                <Td>{est} 
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
                              <Box fontSize="sm" mt={1}> Estimated time is based on total stitch count, number of floss colors
                              (which affect thread changes), and a confetti level (how scattered the
                              colors are). We provide a range based on the stitching speed depending on
                              whether you're a beginner or advanced stitcher.
                            </Box>
                            </PopoverBody>
                          </PopoverContent>
                        </Popover>
                </Td>
                <Td>{progressText}</Td>
                <Td>
                  <Button
                    size="sm"
                    colorScheme="teal"
                    mr={2}
                    onClick={() =>
                      navigate('/deep-dive', { state: { pattern, progress: p.progress, id: p.id } })
                    }
                  >
                    Continue
                  </Button>
                  <Button
                    size="sm"
                    colorScheme="red"
                    onClick={() => deleteProject(p)}
                  >
                    Delete
                  </Button>
                </Td>
              </Tr>
            );
          })}
        </Tbody>
      </Table>
    </Box>
  );
}
