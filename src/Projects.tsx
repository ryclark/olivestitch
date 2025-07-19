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
  Td
} from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { getUrl, remove } from '@aws-amplify/storage';
import type { Schema } from '../amplify/data/resource';
import ImportWizard from './ImportWizard';
import type { PatternDetails } from './types';
import { saveProject } from './utils';

const client = generateClient<Schema>();

interface ProjectRecord {
  id: string;
  image: string;
  imageKey: string;
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
        if (p.image) {
          // Images are stored in identity-scoped paths, so the default access level is sufficient
          const { url } = await getUrl({ path: p.image });
          return { ...p, image: url.href, imageKey: p.image };
        }
        return { ...p, imageKey: p.image };
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
            <Th>Thumbnail</Th>
            <Th>Start Date</Th>
            <Th>Est. Hours</Th>
            <Th></Th>
          </Tr>
        </Thead>
        <Tbody>
          {projects.map(p => {
            const pattern: PatternDetails = JSON.parse(p.pattern);
            const stitches = pattern.grid.length * (pattern.grid[0]?.length || 0);
            const est = `${(stitches / 80).toFixed(1)}-${(stitches / 60).toFixed(1)}`;
            const start = p.createdAt ? new Date(p.createdAt).toLocaleDateString() : '';
            return (
              <Tr key={p.id}>
                <Td>
                  <Image src={p.image} alt="project" boxSize="80px" objectFit="cover" />
                </Td>
                <Td>{start}</Td>
                <Td>{est}</Td>
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
