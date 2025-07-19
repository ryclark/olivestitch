import { useState, useRef, useEffect } from 'react';
import { Box, Button, Image, Input, SimpleGrid, Text } from '@chakra-ui/react';
import { useNavigate } from 'react-router-dom';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import { getUrl } from '@aws-amplify/storage';
import type { Schema } from '../amplify/data/resource';
import ImportWizard from './ImportWizard';
import type { PatternDetails } from './types';
import { saveProject } from './utils';

const client = generateClient<Schema>();

interface ProjectRecord {
  id: string;
  image: string;
  pattern: string;
  progress: string[];
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
      (data as ProjectRecord[]).map(async p => {
        if (p.image) {
          // Images are stored in identity-scoped paths, so the default access level is sufficient
          const { url } = await getUrl({ key: p.image });
          return { ...p, image: url.href };
        }
        return p;
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
      <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
        {projects.map(p => {
          const pattern: PatternDetails = JSON.parse(p.pattern);
          const done = (p.progress ? p.progress.length : 0);
          const total =
            Math.ceil(pattern.grid.length / pattern.fabricCount) *
            Math.ceil(pattern.grid[0].length / pattern.fabricCount);
          return (
            <Box
              key={p.id}
              borderWidth="1px"
              p={2}
              borderRadius="md"
              cursor="pointer"
              onClick={() =>
                navigate('/deep-dive', { state: { pattern, progress: p.progress, id: p.id } })
              }
            >
              <Image src={p.image} alt="project" mb={2} />
              <Text>Progress: {done} / {total}</Text>
            </Box>
          );
        })}
      </SimpleGrid>
    </Box>
  );
}
