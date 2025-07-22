import { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import {
  Box,
  Button,
  Flex,
  NumberInput,
  NumberInputField,
  NumberInputStepper,
  NumberIncrementStepper,
  NumberDecrementStepper,
  Select,
  FormControl,
  FormLabel,
  FormErrorMessage,
  Slider,
  SliderTrack,
  SliderFilledTrack,
  SliderThumb,
  Switch,
  Stepper,
  Step,
  StepIndicator,
  StepStatus,
  StepIcon,
  StepNumber,
  StepTitle,
  StepDescription,
  StepSeparator,
  Text,
  type ChakraProps,
  useBreakpointValue
} from '@chakra-ui/react';

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max);
import Grid from './Grid';
import { findClosestDmcColor, getColorUsage, reduceColors, generateSymbolMap, applyConfettiLevel, calculateConfettiScore } from './utils';
import Collapsible from './Collapsible';
import UsedColors from './UsedColors';
import ColorPalette, { DMC_COLORS } from './ColorPalette';
import { useAuthenticator } from '@aws-amplify/ui-react';
import { generateClient } from 'aws-amplify/data';
import type { Schema } from '../amplify/data/resource';

export interface ImportWizardProps {
  img: HTMLImageElement;
  maxGridPx?: number;
  onCancel: () => void;
  onComplete: (details: {
    grid: string[][];
    fabricCount: number;
    widthIn: number;
    heightIn: number;
    colors: string[];
    colorUsage: Record<string, number>;
    symbols: Record<string, string>;
    confettiLevel: number;
  }) => void;
}

export default function ImportWizard({
  img,
  maxGridPx = 400,
  onCancel,
  onComplete
}: ImportWizardProps) {
  // Limit the preview/crop area so the wizard modal stays usable on large screens
  // and adjust for small viewports
  const [containerSize, setContainerSize] = useState(() =>
    Math.min(maxGridPx, 700)
  );

  useEffect(() => {
    const handleResize = () => {
      const vw = window.innerWidth;
      const limit = 0.45 * vw - 40;
      setContainerSize(Math.min(maxGridPx, 700, Math.max(100, limit)));
    };
    handleResize();
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, [maxGridPx]);
  // Outer modal width keeps a small margin around the image area
  const modalWidth = containerSize + 40;
  const sliderWidth = containerSize / 2;

  const [step, setStep] = useState<number>(0); // 0-based index
  const [fabricCount, setFabricCount] = useState<number>(14);
  const [widthIn, setWidthIn] = useState<number>(4);
  const [heightIn, setHeightIn] = useState<number>(4);

  const inchFormatter = useMemo(
    () =>
      new Intl.NumberFormat(undefined, {
        style: 'unit',
        unit: 'inch',
        unitDisplay: 'long',
        maximumFractionDigits: 1
      }),
    []
  );

  const inchCell = 12; // size of a single stitch preview cell

  const gridWidth = Math.round(widthIn * fabricCount);
  const gridHeight = Math.round(heightIn * fabricCount);

  // Dimensions for the cropping overlay in step 3
  const maxDim = Math.max(gridWidth, gridHeight);
  const cellPx = containerSize / maxDim;
  const cropWidth = gridWidth * cellPx;
  const cropHeight = gridHeight * cellPx;

  // Crop state
  const minScale = Math.min(cropWidth / img.width, cropHeight / img.height);
  const initialScale = Math.max(cropWidth / img.width, cropHeight / img.height);
  const [scale, setScale] = useState<number>(initialScale);
  const scaleRef = useRef<number>(initialScale);
  const [offset, setOffset] = useState<{ x: number; y: number }>({
    x: (cropWidth - img.width * initialScale) / 2,
    y: (cropHeight - img.height * initialScale) / 2
  });
  const dragRef = useRef<{ x: number; y: number; start: { x: number; y: number } } | null>(null);

  const [grid, setGrid] = useState<string[][] | null>(null);
  const [preview, setPreview] = useState<string[][] | null>(null);
  const [reduceTo, setReduceTo] = useState<number>(1);
  const [maxColors, setMaxColors] = useState<number>(1);
  const colorUsage = useMemo(() => (preview ? getColorUsage(preview) : {}), [preview]);
  const { user } = useAuthenticator(ctx => [ctx.user]);
  const client = useMemo(() => generateClient<Schema>(), []);
  const [floss, setFloss] = useState<{ id: string; code: string }[]>([]);
  const [showMine, setShowMine] = useState(false);
  const [selectedColor, setSelectedColor] = useState<string | null>(null);
  const [confetti, setConfetti] = useState<number>(1);
  const confettiScore = useMemo(
    () => (preview ? calculateConfettiScore(preview) : null),
    [preview]
  );
  
  useEffect(() => {
    if (!user) return;
    client.models.Floss.list().then(({ data }) => {
      setFloss(data as { id: string; code: string }[]);
    });
  }, [client, user]);

  const flossPalette = useMemo(() => {
    const set = new Set(floss.map(f => f.code));
    return DMC_COLORS.filter(c => set.has(c.code));
  }, [floss]);

  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    if (step !== 3) return;
    const g = generateGrid();
    setGrid(g);
    const count = Object.keys(getColorUsage(g)).length;
    setMaxColors(count);
    const val = Math.min(reduceTo, count);
    setReduceTo(val);
    const reduced = reduceColors(g, val);
    setPreview(applyConfettiLevel(reduced, confetti));
  }, [showMine]);
  /* eslint-enable react-hooks/exhaustive-deps */

  // Size preview scale so the design preview fits inside the wizard
  const previewScale = Math.min(
    containerSize / gridWidth,
    containerSize / gridHeight
  );
  const inchPx = fabricCount * previewScale;


  const updateOffset = useCallback((x: number, y: number, s: number) => {
    const w = img.width * s;
    const h = img.height * s;
    if (w <= cropWidth) x = (cropWidth - w) / 2;
    else x = clamp(x, cropWidth - w, 0);
    if (h <= cropHeight) y = (cropHeight - h) / 2;
    else y = clamp(y, cropHeight - h, 0);
    setOffset({ x, y });
  }, [img.width, img.height, cropWidth, cropHeight]);

  const handleDrag = useCallback(
    (clientX: number, clientY: number) => {
      if (!dragRef.current) return;
      const dx = clientX - dragRef.current.x;
      const dy = clientY - dragRef.current.y;
      updateOffset(
        dragRef.current.start.x + dx,
        dragRef.current.start.y + dy,
        scale
      );
    },
    [updateOffset, scale]
  );

  const handleMouseMoveWindow = useCallback((e: MouseEvent) => {
    handleDrag(e.clientX, e.clientY);
  }, [handleDrag]);

  const handleTouchMoveWindow = useCallback(
    (e: TouchEvent) => {
      if (e.touches[0]) {
        handleDrag(e.touches[0].clientX, e.touches[0].clientY);
        if (dragRef.current) e.preventDefault();
      }
    },
    [handleDrag]
  );

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    handleDrag(e.clientX, e.clientY);
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      handleDrag(e.touches[0].clientX, e.touches[0].clientY);
      e.preventDefault();
    }
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLDivElement>) => {
    dragRef.current = { x: e.clientX, y: e.clientY, start: offset };
    window.addEventListener('mousemove', handleMouseMoveWindow);
  };

  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>) => {
    if (e.touches[0]) {
      dragRef.current = { x: e.touches[0].clientX, y: e.touches[0].clientY, start: offset };
      window.addEventListener('touchmove', handleTouchMoveWindow, { passive: false });
    }
  };

  useEffect(() => {
    const handleUp = () => {
      dragRef.current = null;
      window.removeEventListener('mousemove', handleMouseMoveWindow);
      window.removeEventListener('touchmove', handleTouchMoveWindow);
    };
    window.addEventListener('mouseup', handleUp);
    window.addEventListener('touchend', handleUp);
    return () => {
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [handleMouseMoveWindow, handleTouchMoveWindow]);

  useEffect(() => {
    const prev = scaleRef.current;
    scaleRef.current = scale;
    updateOffset(
      offset.x + (img.width * prev - img.width * scale) / 2,
      offset.y + (img.height * prev - img.height * scale) / 2,
      scale
    );
  }, [scale, offset.x, offset.y, img.height, img.width, updateOffset]);

  const generateGrid = (): string[][] => {
    const canvas = document.createElement('canvas');
    canvas.width = gridWidth;
    canvas.height = gridHeight;
    const ctx = canvas.getContext('2d');
    if (!ctx) return [];
    const srcX = Math.max(0, -offset.x / scale);
    const srcY = Math.max(0, -offset.y / scale);
    const srcW = cropWidth / scale;
    const srcH = cropHeight / scale;
    ctx.drawImage(img, srcX, srcY, srcW, srcH, 0, 0, gridWidth, gridHeight);
    const data = ctx.getImageData(0, 0, gridWidth, gridHeight).data;
    const g = [];
    for (let y = 0; y < gridHeight; y++) {
      const row = [];
      for (let x = 0; x < gridWidth; x++) {
        const idx = (y * gridWidth + x) * 4;
        const rgb = [data[idx], data[idx + 1], data[idx + 2]];
        const palette = showMine ? flossPalette : DMC_COLORS;
        row.push(findClosestDmcColor(rgb, palette));
      }
      g.push(row);
    }
    return g;
  };

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 0));

  const handleNext = () => {
    if (step === 2) {
      const g = generateGrid();
      setGrid(g);
      const count = Object.keys(getColorUsage(g)).length;
      setMaxColors(count);
      setReduceTo(count);
      setPreview(applyConfettiLevel(g, confetti));
    }
    if (step === 3) {
      // proceed to done
    }
    nextStep();
  };

  const handleFinish = () => {
    const colors = Object.keys(colorUsage);
    onComplete({
      grid: preview!,
      fabricCount,
      widthIn,
      heightIn,
      colors,
      colorUsage,
      symbols: generateSymbolMap(colors),
      confettiLevel: confetti
    });
  };

  const handleReduceChange = (val: number) => {
    setReduceTo(val);
    if (grid) {
      const reduced = reduceColors(grid, val);
      setPreview(applyConfettiLevel(reduced, confetti));
    } else {
      setPreview(null);
    }
  };

  const handleConfettiChange = (val: number) => {
    setConfetti(val);
    if (grid) {
      const reduced = reduceColors(grid, reduceTo);
      setPreview(applyConfettiLevel(reduced, val));
    }
  };

  const steps = [
    { title: 'Fabric', description: 'Select fabric type' },
    { title: 'Size', description: 'Design dimensions' },
    { title: 'Overlay', description: 'Position image' },
    { title: 'Colors', description: 'Limit palette' },
    { title: 'Done', description: 'Finish' }
  ];

  const overlayProps: ChakraProps = {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    bg: 'rgba(0,0,0,0.7)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 1000
  };

  const stepOrientation =
    useBreakpointValue<'horizontal' | 'vertical'>({
      base: 'vertical',
      md: 'horizontal'
    }) ?? 'horizontal';

  return (
    <Box {...overlayProps}>
      <Box
        bg='white'
        p={4}
        borderRadius='md'
        width={modalWidth * 2}
        maxWidth="90vw"
        maxHeight="90vh"
        overflowY="auto"
      >

{/* Mobile-friendly heading for current step */}
  <Box display={{ base: 'flex', md: 'none' }} alignItems="center" mb={4} gap={3}>
    <Box
    display={{ base: 'flex', md: 'none' }}
    alignItems="center"
    gap={3}
    mb={4}
    px={4}
    py={2}
    bg="green.900"
    color="yellow.100"
    borderRadius="md"
    width="calc(100% + 2rem)"  // compensate for parent Box p={4}
  >
    <Box
      borderRadius="full"
      w="32px"
      h="32px"
      display="flex"
      alignItems="center"
      justifyContent="center"
      fontWeight="bold"
      bg="yellow.100"
      color="green.900"
    >
      {step + 1}
    </Box>
    <Box>
      <Text fontWeight="bold" fontSize="md">{steps[step].title}</Text>
      <Text fontSize="sm" opacity={0.8}>{steps[step].description}</Text>
    </Box>
  </Box>

</Box>

<Box display={{ base: 'none', md: 'block' }} mb={4}>
  <Box bg="green.900" color="yellow.100" borderRadius="md" p={4}>
        <Stepper
          index={step}
          mb={4}
          size='sm'
          colorScheme='yellow'
          orientation={stepOrientation}
          height={stepOrientation === 'vertical' ? '240px' : 'auto'}
          display={{ base: 'none', md: 'flex' }}
        >

          {steps.map((s, i) => (
            <Step key={i}>
              <StepIndicator>
                <StepStatus complete={<StepIcon />} incomplete={<StepNumber />} active={<StepNumber />} />
              </StepIndicator>
              <Box flexShrink='0'>
                <StepTitle>{s.title}</StepTitle>
                <StepDescription><Text color="yellow.100" fontSize="sm">{s.description}</Text></StepDescription>
              </Box>
              <StepSeparator />
            </Step>
          ))}
        </Stepper>
  </Box>
</Box>
        {step === 0 && (
          <Box>
            <Flex
              justify='space-between'
              mb={2}
              display='flex'
              position='sticky'
              top={0}
              bg='white'
              zIndex={1}
            >
              <Button mr={2} onClick={onCancel}>Cancel</Button>
              <Button bg='green.900' color='yellow.100' onClick={handleNext}>Next</Button>
            </Flex>
            <Select value={fabricCount} onChange={e => setFabricCount(Number(e.target.value))} mb={2}>
              <option value={11}>11-count Aida</option>
              <option value={14}>14-count Aida</option>
              <option value={16}>16-count Aida</option>
              <option value={18}>18-count Aida</option>
            </Select>
            <Text fontSize='sm' mb={4}>
              Fabric type is Aida and the number is stitches per inch. For example, 14-count Aida is Aida fabric with 14 stitches per inch.
            </Text>
            <Box textAlign='center' mb={4}>
              <Text mb={1}>1"</Text>
              <Box
                display='grid'
                gridTemplateColumns={`repeat(${fabricCount}, ${inchCell}px)`}
                gridTemplateRows={`${inchCell}px`}
                border='1px solid #444'
                w={fabricCount * inchCell}
                m='0 auto'
              >
                {Array.from({ length: fabricCount }).map((_, i) => (
                  <Box key={i} border='1px solid #ccc' />
                ))}
              </Box>
              <Text fontSize='sm' mt={1}>{fabricCount} stitches in 1"</Text>
            </Box>
            <Box textAlign='center' mb={4}>
              <Flex justify='center' align='center'>
                <Text transform='rotate(-90deg)' mr={1}>1"</Text>
                <Box>
                  <Text mb={1}>1"</Text>
                  <Box
                    display='grid'
                    gridTemplateColumns={`repeat(${fabricCount}, ${inchCell}px)`}
                    gridTemplateRows={`repeat(${fabricCount}, ${inchCell}px)`}
                    border='1px solid #444'
                    w={fabricCount * inchCell}
                    m='0 auto'
                  >
                    {Array.from({ length: fabricCount * fabricCount }).map((_, i) => (
                      <Box key={i} border='1px solid #ccc' />
                    ))}
                  </Box>
                </Box>
                <Text transform='rotate(90deg)' ml={1}>1"</Text>
              </Flex>
              <Text fontSize='sm' mt={1}>
                {fabricCount} × {fabricCount} = {fabricCount * fabricCount} stitches per square inch
              </Text>
            </Box>
            <Flex justify='space-between' display='none'>
              <Button mr={2} onClick={onCancel}>Cancel</Button>
              <Button bg='green.900' color='yellow.100' onClick={handleNext}>Next</Button>
            </Flex>
          </Box>
        )}

        {step === 1 && (
          <Box>
            <Flex
              justify='space-between'
              mb={2}
              display='flex'
              position='sticky'
              top={0}
              bg='white'
              zIndex={1}
            >
              <Button onClick={prevStep}>Back</Button>
              <Button bg='green.900' color='yellow.100' onClick={handleNext}>Next</Button>
            </Flex>
            <Flex gap={2} mb={2} align='center' flexDir={{ base: 'column', sm: 'row' }}>
              <FormControl isInvalid={widthIn < 2}>
                <FormLabel>Width (inches)</FormLabel>
                <NumberInput
                  value={widthIn}
                  onChange={(_, v) => setWidthIn(v)}
                  min={2}
                  max={10}
                  width='full'
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>
                  Patterns need to be at least 2 inches by 2 inches
                </FormErrorMessage>
              </FormControl>
              <FormControl isInvalid={heightIn < 2}>
                <FormLabel>Height (inches)</FormLabel>
                <NumberInput
                  value={heightIn}
                  onChange={(_, v) => setHeightIn(v)}
                  min={2}
                  max={10}
                  width='full'
                >
                  <NumberInputField />
                  <NumberInputStepper>
                    <NumberIncrementStepper />
                    <NumberDecrementStepper />
                  </NumberInputStepper>
                </NumberInput>
                <FormErrorMessage>
                  Patterns need to be at least 2 inches by 2 inches
                </FormErrorMessage>
              </FormControl>
            </Flex>
            <Text fontSize='sm'>
              Ratio {widthIn}:{heightIn}. Add a 2" border on each side for framing or hooping.
              Total fabric ~ {inchFormatter.format(widthIn + 4)}–{inchFormatter.format(widthIn + 6)} x {inchFormatter.format(heightIn + 4)}–{inchFormatter.format(heightIn + 6)}.
            </Text>
            <Box textAlign='center' mt={4}>
              <Box
                position='relative'
                width={gridWidth * previewScale}
                height={gridHeight * previewScale}
                bg='#f8f8f8'
                display='inline-block'
              >
                <Box
                  pointerEvents='none'
                  position='absolute'
                  left={0}
                  top={0}
                  right={0}
                  bottom={0}
                  style={{
                    backgroundImage: `repeating-linear-gradient(to right, rgba(0,0,0,0.6) 0, rgba(0,0,0,0.6) 2px, transparent 2px, transparent ${inchPx}px), repeating-linear-gradient(to bottom, rgba(0,0,0,0.6) 0, rgba(0,0,0,0.6) 2px, transparent 2px, transparent ${inchPx}px), repeating-linear-gradient(to right, rgba(0,0,0,0.3) 0, rgba(0,0,0,0.3) 1px, transparent 1px, transparent ${previewScale}px), repeating-linear-gradient(to bottom, rgba(0,0,0,0.3) 0, rgba(0,0,0,0.3) 1px, transparent 1px, transparent ${previewScale}px)`,
                    backgroundSize: '100% 100%'
                  }}
                />
                <Box
                  pointerEvents='none'
                  position='absolute'
                  left={0}
                  top={0}
                  right={0}
                  bottom={0}
                  borderRight='2px solid rgba(0,0,0,1)'
                  borderBottom='2px solid rgba(0,0,0,1)'
                />
              </Box>
            </Box>
            <Flex justify='space-between' mt={4} display='none'>
              <Button onClick={prevStep}>Back</Button>
              <Button bg='green.900' color='yellow.100' onClick={handleNext}>Next</Button>
            </Flex>
          </Box>
        )}

        {step === 2 && (
          <Box>
            <Flex
              justify='space-between'
              mb={2}
              display='flex'
              position='sticky'
              top={0}
              bg='white'
              zIndex={1}
            >
              <Button onClick={prevStep}>Back</Button>
              <Button bg='green.900' color='yellow.100' onClick={handleNext}>Next</Button>
            </Flex>
            <Box
              position='relative'
              width={cropWidth}
              height={cropHeight}
              overflow='hidden'
              bg='#fff'
              m='0 auto'
              cursor='move'
              onMouseDown={handleMouseDown}
              onMouseMove={handleMouseMove}
              onTouchStart={handleTouchStart}
              onTouchMove={handleTouchMove}
              style={{ touchAction: 'none' }}
            >
              <img
                src={img.src}
                alt='crop'
                draggable={false}
                style={{
                  position: 'absolute',
                  left: offset.x,
                  top: offset.y,
                  width: img.width * scale,
                  height: img.height * scale,
                  maxWidth: 'none',
                  userSelect: 'none'
                }}
              />
              <Box
                pointerEvents='none'
                position='absolute'
                left={0}
                top={0}
                right={0}
                bottom={0}
                style={{
                  backgroundImage: `linear-gradient(to right, rgba(0,0,0,0.3) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.3) 1px, transparent 1px)`,
                  backgroundSize: `${cellPx}px ${cellPx}px`
                }}
              />
            </Box>
            <Box mt={2} textAlign='center'>
              <Slider
                size='lg'
                width={`${sliderWidth}px`}
                colorScheme='green'
                min={minScale}
                max={initialScale * 3}
                step={0.1}
                value={scale}
                onChange={setScale}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
            </Box>
            <Text fontSize='sm' mt={2} textAlign='center'>
              Drag the image so the part inside the grid looks right. Only what you see here will turn into stitches.
            </Text>
            <Flex justify='space-between' mt={4} display='none'>
              <Button onClick={prevStep}>Back</Button>
              <Button bg='green.900' color='yellow.100' onClick={handleNext}>Next</Button>
            </Flex>
          </Box>
        )}

        {step === 3 && (
          <Box>
            <Flex
              justify='space-between'
              mb={2}
              display='flex'
              position='sticky'
              top={0}
              bg='white'
              zIndex={1}
            >
              <Button onClick={prevStep}>Back</Button>
              <Button bg='green.900' color='yellow.100' onClick={handleNext}>Next</Button>
            </Flex>
            <Grid
              grid={preview || []}
              setGrid={() => {}}
              selectedColor={null}
              showGrid={false}
              maxGridPx={containerSize}
            />
            <Box mt={2} px={2}>
              <Slider
                size='lg'
                width={`${sliderWidth}px`}
                colorScheme='green'
                min={1}
                max={maxColors}
                value={reduceTo}
                onChange={handleReduceChange}
              >
                <SliderTrack>
                  <SliderFilledTrack />
                </SliderTrack>
                <SliderThumb />
              </Slider>
              <Collapsible label={<Text textAlign='center'>{reduceTo} colors</Text>}>
                <UsedColors colors={Object.keys(colorUsage)} usage={colorUsage} />
              </Collapsible>
              {user && (
                <Box textAlign='center' mt={2}>
                  <FormControl display='flex' alignItems='center' justifyContent='center'>
                    <FormLabel htmlFor='floss-toggle' mb='0'>Use my floss box</FormLabel>
                    <Switch
                      id='floss-toggle'
                      colorScheme='green'
                      isChecked={showMine}
                      onChange={e => setShowMine(e.target.checked)}
                      isDisabled={floss.length === 0}
                    />
                  </FormControl>
                  {floss.length === 0 && (
                    <Text fontSize='sm' mt={1}>
                      Add any floss you currently have to create a design limited to your current gear.
                    </Text>
                  )}
                </Box>
              )}
              <Collapsible label={<Text textAlign='center'>Palette</Text>}>
                <ColorPalette
                  selected={selectedColor}
                  setSelected={setSelectedColor}
                  colors={showMine ? flossPalette : DMC_COLORS}
                />
              </Collapsible>
              <FormControl mt={4} textAlign='center'>
                <FormLabel textAlign='center'>
                  Confetti Level: {confetti} {confettiScore !== null && `| Score: ${confettiScore}`}
                </FormLabel>
                <Slider
                  size='lg'
                  width={`${sliderWidth}px`}
                  colorScheme='green'
                  min={1}
                  max={10}
                  step={1}
                  value={confetti}
                  onChange={handleConfettiChange}
                >
                  <SliderTrack>
                    <SliderFilledTrack />
                  </SliderTrack>
                  <SliderThumb />
                </Slider>
              </FormControl>
            </Box>
            <Flex justify='space-between' mt={4} display='none'>
              <Button onClick={prevStep}>Back</Button>
              <Button bg='green.900' color='yellow.100' onClick={handleNext}>Next</Button>
            </Flex>
          </Box>
        )}

        {step === 4 && (
          <Box textAlign='center'>
            <Text mb={4}>All set! Use this image?</Text>
            <Button bg='green.900' color='yellow.100' mr={2} onClick={handleFinish}>Use Image</Button>
            <Button onClick={onCancel}>Cancel</Button>
          </Box>
        )}
      </Box>
    </Box>
  );
}
