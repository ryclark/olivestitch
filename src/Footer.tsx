import {
  Box,
  Flex,
  HStack,
  Link,
  Text,
  Stack,
  Icon,
  Drawer,
  DrawerOverlay,
  DrawerContent,
  DrawerHeader,
  DrawerBody,
  DrawerCloseButton,
  useDisclosure
} from '@chakra-ui/react';
import { FaInstagram, FaPinterest, FaReddit } from "react-icons/fa";


export default function Footer() {
  const {
    isOpen: isTermsOpen,
    onOpen: openTerms,
    onClose: closeTerms,
  } = useDisclosure();
  const {
    isOpen: isPrivacyOpen,
    onOpen: openPrivacy,
    onClose: closePrivacy,
  } = useDisclosure();
  return (
    <Box as="footer" bg="green.900" color="yellow.100" py={4} mt={8}>
  <Flex
    direction={{ base: "column", md: "row" }}
    justify="space-between"
    align={{ base: "flex-start", md: "center" }}
    px={{ base: 4, md: 8 }} // <-- This creates horizontal padding
  >
    {/* Left: Brand Info */}
    <Box mb={{ base: 4, md: 0 }}>
      <Text fontSize="sm">
        <Text as="span" fontWeight="bold">Made with 🧵 and ❤️ in Seattle</Text> <Text as="span" mx={4}>
    •
  </Text>  © {new Date().getFullYear()} Olive Industries. All rights reserved. 
      </Text>
    </Box>

    {/* Right: Navigation + Social */}
    <Stack
      direction={{ base: "column", sm: "row" }}
      spacing={{ base: 2, sm: 6 }}
      align="center"
    >
      <Link href="/about" _hover={{ textDecoration: "underline" }}>
        About
      </Link>
      <Link href="/faq" _hover={{ textDecoration: "underline" }}>
        FAQ
      </Link>
      <Link href="#" onClick={openTerms} _hover={{ textDecoration: "underline" }}>
        Terms
      </Link>
      <Link href="#" onClick={openPrivacy} _hover={{ textDecoration: "underline" }}>
        Privacy
      </Link>

      <HStack spacing={3}>
        <Link href="https://instagram.com/yourhandle" isExternal>
          <Icon as={FaInstagram} boxSize={5} />
        </Link>
        <Link href="https://pinterest.com/yourhandle" isExternal>
          <Icon as={FaPinterest} boxSize={5} />
        </Link>
<Link href="https://reddit.com/yourhandle" isExternal>
  <Icon as={FaReddit} boxSize={5} />
</Link>
      </HStack>
    </Stack>
  </Flex>
  <Drawer placement="bottom" size="lg" onClose={closeTerms} isOpen={isTermsOpen}>
    <DrawerOverlay />
    <DrawerContent>
      <DrawerCloseButton />
      <DrawerHeader>Terms of Use</DrawerHeader>
      <DrawerBody>
        <Text mb={4}>Effective Date: [Insert Date Here]</Text>
        <Text mb={4}>
          Welcome to Olive &amp; Thread, operated by Olive Industries LLC ("we,"
          "us," or "our"). These Terms of Use ("Terms") govern your use of the
          Olive &amp; Thread app and related services ("Service"). By using the
          Service, you agree to these Terms. If you do not agree, do not use the
          Service.
        </Text>
        <Text fontWeight="bold">1. Eligibility</Text>
        <Text mb={4}>
          You must be at least 13 years old to use the Service. By using the
          Service, you represent that you meet this requirement.
        </Text>
        <Text fontWeight="bold">2. Account Registration</Text>
        <Text mb={4}>
          To access certain features, you must create an account. You agree to
          provide accurate information and keep it up to date. You are
          responsible for maintaining the confidentiality of your login
          credentials.
        </Text>
        <Text fontWeight="bold">3. Subscriptions and Payments</Text>
        <Text mb={4}>
          Olive &amp; Thread offers both a free tier and a paid subscription with
          enhanced features. Subscriptions may be monthly or annual. Payments are
          processed by Stripe, and we do not store your payment details. You may
          cancel your subscription at any time. Refunds are issued only in
          exceptional circumstances and at our discretion.
        </Text>
        <Text fontWeight="bold">4. User Content and Ownership</Text>
        <Text mb={4}>
          When you upload an image to be converted into a pattern or save
          project progress, you retain ownership of that content. We do not claim
          any rights to user-submitted images or patterns.
        </Text>
        <Text fontWeight="bold">5. Acceptable Use</Text>
        <Text mb={4}>
          You agree not to use the Service for any unlawful purpose or to upload
          offensive or harmful content. While we do not currently moderate user
          content, we reserve the right to remove content that violates these
          Terms or applicable laws.
        </Text>
        <Text fontWeight="bold">6. Modifications to the Service</Text>
        <Text mb={4}>
          We reserve the right to update or discontinue the Service at any time,
          with or without notice.
        </Text>
        <Text fontWeight="bold">7. Disclaimer of Warranties</Text>
        <Text mb={4}>
          The Service is provided "as is" without warranties of any kind. We do
          not guarantee that the Service will be error-free or uninterrupted.
        </Text>
        <Text fontWeight="bold">8. Limitation of Liability</Text>
        <Text mb={4}>
          To the maximum extent permitted by law, Olive Industries LLC shall not
          be liable for any indirect, incidental, or consequential damages
          arising from your use of the Service.
        </Text>
        <Text fontWeight="bold">9. Governing Law</Text>
        <Text mb={4}>
          These Terms are governed by the laws of the State of Washington, USA,
          without regard to its conflict of laws principles.
        </Text>
        <Text fontWeight="bold">10. Contact Us</Text>
        <Text>
          For questions about these Terms, please contact us at [insert legal
          email address once set up].
        </Text>
      </DrawerBody>
    </DrawerContent>
  </Drawer>
  <Drawer placement="bottom" size="lg" onClose={closePrivacy} isOpen={isPrivacyOpen}>
    <DrawerOverlay />
    <DrawerContent>
      <DrawerCloseButton />
      <DrawerHeader>Privacy Policy</DrawerHeader>
      <DrawerBody>
        <Text mb={4}>Effective Date: [Insert Date Here]</Text>
        <Text mb={4}>
          Olive Industries LLC ("we," "us," or "our") respects your privacy. This
          Privacy Policy describes how we collect, use, and share information when
          you use the Olive &amp; Thread app and related services ("Service").
        </Text>
        <Text fontWeight="bold">1. Information We Collect</Text>
        <Text mb={4}>
          Email address (for account creation and support)
          <br />
          Image uploads (used to generate cross-stitch patterns)
          <br />
          Pattern data and progress (stored for your personal use)
          <br />
          Technical information (IP address, device info)
        </Text>
        <Text fontWeight="bold">2. How We Use Your Information</Text>
        <Text mb={4}>
          To provide and improve the Service
          <br />
          To communicate with you about your account
          <br />
          To offer customer support
          <br />
          To send updates or promotional content (if/when opted in)
        </Text>
        <Text fontWeight="bold">3. Sharing Your Information</Text>
        <Text mb={4}>
          We do not sell your personal data. We may share your information only
          with:
          <br />
          Stripe, for payment processing
          <br />
          Service providers who help us operate our app (e.g., cloud storage)
          <br />
          Authorities, if required by law
        </Text>
        <Text fontWeight="bold">4. Data Security</Text>
        <Text mb={4}>
          We implement reasonable safeguards to protect your data, but no system
          is 100% secure. Please use strong passwords and protect your login
          credentials.
        </Text>
        <Text fontWeight="bold">5. Data Retention</Text>
        <Text mb={4}>
          We retain your data as long as your account is active or as needed to
          provide the Service.
        </Text>
        <Text fontWeight="bold">6. International Users</Text>
        <Text mb={4}>
          If you are accessing the Service from outside the U.S., your data may
          be transferred to and processed in the United States.
        </Text>
        <Text fontWeight="bold">7. Your Rights</Text>
        <Text mb={4}>
          You may request to access, update, or delete your personal information
          by contacting us at [insert legal email address once set up].
        </Text>
        <Text fontWeight="bold">8. Changes to This Policy</Text>
        <Text mb={4}>
          We may update this Privacy Policy periodically. We will notify you of
          material changes by posting a notice in the app or via email.
        </Text>
        <Text fontWeight="bold">9. Contact Us</Text>
        <Text>
          For questions about this Privacy Policy, please contact us at [insert
          legal email address once set up].
        </Text>
      </DrawerBody>
    </DrawerContent>
  </Drawer>
</Box>

  );
}
