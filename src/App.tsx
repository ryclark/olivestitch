import { useState, useRef } from 'react';
import {
  Box,
  Button,
  Image,
  Input,
  SimpleGrid,
  useDisclosure,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  Switch,
  FormControl,
  FormLabel,
  Flex,
  Popover,
  PopoverTrigger,
  PopoverContent,
  PopoverArrow,
  PopoverCloseButton,
  PopoverBody,
  IconButton
} from '@chakra-ui/react';
import { FiInfo } from "react-icons/fi";
import GridMagnifier from './GridMagnifier';
import UsedColors from './UsedColors';
import ImportWizard from './ImportWizard';
import Header from './Header';
import Footer from './Footer';
import DeepDive from './DeepDive';
import Projects from './Projects';
import FlossBox from './FlossBox';
import { useNavigate, useLocation } from 'react-router-dom';
import sample1 from './images/samples/dancer.png';
import sample2 from './images/samples/baloons.png';
import sample3 from './images/samples/rain.png';

import type { PatternDetails } from './types';
import { saveProject } from './utils';
import { estimateTimeRange } from './timeEstimator';

export default function App() {
  const [importImage, setImportImage] = useState<HTMLImageElement | null>(null);
  const [importFile, setImportFile] = useState<File | null>(null);
  const [showImageOptions, setShowImageOptions] = useState<boolean>(false);
  const [pattern, setPattern] = useState<PatternDetails | null>(null);
  const [showGridLines, setShowGridLines] = useState<boolean>(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const { isOpen, onOpen, onClose } = useDisclosure();
  const navigate = useNavigate();
  const location = useLocation();

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
    setShowImageOptions(false);
  };

  const handleWizardComplete = async (details: PatternDetails) => {
    if (!importImage) return;
    const data = await saveProject(importFile ?? importImage.src, details);

    setPattern(details);
    setShowGridLines(false);
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

  const handleSelectSample = (src: string) => {
    const img = new window.Image();
    img.onload = () => {
      const size = Math.min(img.width, img.height);
      const canvas = document.createElement('canvas');
      canvas.width = size;
      canvas.height = size;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.drawImage(
        img,
        (img.width - size) / 2,
        (img.height - size) / 2,
        size,
        size,
        0,
        0,
        size,
        size
      );
      const cropped = new window.Image();
      cropped.onload = () => setImportImage(cropped);
      cropped.src = canvas.toDataURL();
    };
    img.src = src;
    setShowImageOptions(false);
  };

  const openFileDialog = () => {
    setShowImageOptions(false);
    if (fileInputRef.current) fileInputRef.current.click();
  };

  const handleDeepDive = () => {
    if (pattern) {
      navigate('/deep-dive', { state: { pattern } });
    }
  };

  if (location.pathname === '/projects') {
    return (
      <Box minH="100vh" minW="100vw" display="flex" flexDirection="column">
        <Header />
        <Box flex="1">
          <Projects />
        </Box>
        <Footer />
      </Box>
    );
  }

  if (location.pathname === '/floss-box') {
    return (
      <Box minH="100vh" minW="100vw" display="flex" flexDirection="column">
        <Header />
        <Box flex="1">
          <FlossBox />
        </Box>
        <Footer />
      </Box>
    );
  }

  if (location.pathname === '/deep-dive') {
    return (
      <Box minH="100vh" minW="100vw" display="flex" flexDirection="column">
        <Header />
        <Box flex="1">
          <DeepDive />
        </Box>
        <Footer />
      </Box>
    );
  }

  return (
    <Box minH="100vh" minW="100vw" display="flex" flexDirection="column">
      <Header />
      <Box
        flex="1"
        display="flex"
        alignItems="center"
        justifyContent="center"
        flexDirection="column"
      >
        {!pattern && (
          <>
            <Input
              type="file"
              accept="image/*"
              display="none"
              ref={fileInputRef}
              onChange={e => handleImageUpload(e.target.files ? e.target.files[0] : null)}
            />
            <Button
              size="lg"
              colorScheme="teal"
              onClick={() => setShowImageOptions(true)}
            >
              Try it out!
            </Button>
          </>
        )}
        {pattern && (
          <>
            <GridMagnifier
              grid={pattern.grid}
              showGrid={showGridLines}
              maxGridPx={500}
            />
            <FormControl
              display="flex"
              alignItems="center"
              justifyContent="center"
              mt={2}
              width="fit-content"
            >
              <FormLabel htmlFor="grid-toggle" mb="0">
                Show grid
              </FormLabel>
              <Switch
                id="grid-toggle"
                isChecked={showGridLines}
                onChange={e => setShowGridLines(e.target.checked)}
              />
            </FormControl>
            <Box mt={4}>
              <Button colorScheme="teal" mr={2} onClick={onOpen}>
                Pattern Details
              </Button>
              <Button colorScheme="teal" onClick={handleDeepDive}>
                Deep Dive
              </Button>
            </Box>
          </>
        )}
      </Box>
      <Footer />
      {showImageOptions && (
        <Box
          position="fixed"
          top={0}
          left={0}
          right={0}
          bottom={0}
          bg="rgba(0,0,0,0.7)"
          display="flex"
          alignItems="center"
          justifyContent="center"
          zIndex={1000}
        >
          <Box bg="white" p={4} borderRadius="md">
            <SimpleGrid columns={2} spacing={4}>
              <Image
                src={sample1}
                alt="Sample 1"
                boxSize="120px"
                objectFit="cover"
                cursor="pointer"
                onClick={() => handleSelectSample(sample1)}
              />
              <Image
                src={sample2}
                alt="Sample 2"
                boxSize="120px"
                objectFit="cover"
                cursor="pointer"
                onClick={() => handleSelectSample(sample2)}
              />
              <Image
                src={sample3}
                alt="Sample 3"
                boxSize="120px"
                objectFit="cover"
                cursor="pointer"
                onClick={() => handleSelectSample(sample3)}
              />
              <Button
                onClick={openFileDialog}
                boxSize="120px"
                whiteSpace="normal"
              >
                Upload your own image
              </Button>
            </SimpleGrid>
            <Box textAlign="right" mt={4}>
              <Button onClick={() => setShowImageOptions(false)}>Cancel</Button>
            </Box>
          </Box>
        </Box>
      )}
      {importImage && (
        <ImportWizard
          img={importImage}
          onCancel={handleWizardCancel}
          onComplete={handleWizardComplete}
        />
      )}
      {pattern && (
        <Drawer placement="bottom" onClose={onClose} isOpen={isOpen}>
          <DrawerOverlay />
          <DrawerContent>
            <DrawerCloseButton />
            <DrawerHeader>Pattern Details</DrawerHeader>
            <DrawerBody>
              <Box mb={4}>
                <strong>Fabric:</strong> {pattern.fabricCount}-count Aida
              </Box>
              <Box mb={4}>
                <strong>Dimensions:</strong> {pattern.widthIn}&quot; x {pattern.heightIn}&quot;
              </Box>
              <Box mb={4}>
                {(() => {
                  const stitches = pattern.grid.length * (pattern.grid[0]?.length || 0);
                  const times = estimateTimeRange(
                    stitches,
                    pattern.colors.length,
                    pattern.confettiLevel ?? 1
                  );
                  return (
                    <>
                      <Flex align="center">
                        <strong>Estimated Time (hrs)</strong>
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
                              Estimated time is based on total stitch count, number of floss colors
                              (which affect thread changes), and a confetti level (how scattered the
                              colors are). We provide a range based on the stitching speed depending on
                              whether you're a beginner or advanced stitcher.
                            </PopoverBody>
                          </PopoverContent>
                        </Popover>
                      </Flex>
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
                    </>
                  );
                })()}
              </Box>
              <Box mb={2}>
                <strong>Colors</strong>
              </Box>
              <UsedColors
                colors={pattern.colors}
                usage={pattern.colorUsage}
                showSkeins
              />
            </DrawerBody>
          </DrawerContent>
        </Drawer>
      )}
    </Box>
  );
}
