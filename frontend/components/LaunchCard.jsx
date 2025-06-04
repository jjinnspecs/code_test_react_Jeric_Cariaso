import React, { useState } from 'react';
import { 
  Box, 
  Text, 
  Button, 
  useColorModeValue, 
  HStack, 
  Link, 
  Image, 
  VStack,
  Badge,
  SimpleGrid,
  AspectRatio,
  Skeleton,
  useDisclosure,
  Modal,
  ModalOverlay,
  ModalContent,
  ModalHeader,
  ModalCloseButton,
  ModalBody,
  IconButton,
  Tooltip
} from '@chakra-ui/react';
import { ExternalLinkIcon, ViewIcon } from '@chakra-ui/icons';
import { FaReddit, FaWikipediaW, FaYoutube, FaFlickr, FaFileAlt } from 'react-icons/fa';

const LaunchCard = ({ launch }) => {
  const [showDetails, setShowDetails] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);
  const [imageError, setImageError] = useState(false);
  const { isOpen: isGalleryOpen, onOpen: onGalleryOpen, onClose: onGalleryClose } = useDisclosure();

  const cardBg = useColorModeValue('gray.50', 'gray.800');
  const detailBg = useColorModeValue('white', 'gray.700');
  const borderColor = useColorModeValue('gray.200', 'gray.600');
  const linkColor = useColorModeValue('blue.600', 'blue.300');
  const headerTextColor = useColorModeValue('gray.600', 'gray.400');
  const badgeBg = useColorModeValue('gray.100', 'gray.600');
  const hoverBg = useColorModeValue('gray.200', 'gray.500');

  // calculate time ago or time until
  const getTimeAgo = (dateString) => {
    const launchDate = new Date(dateString);
    const now = new Date();
    const diffInMs = launchDate - now;
    const absDiffInMs = Math.abs(diffInMs);
    const diffInYears = Math.floor(absDiffInMs / (1000 * 60 * 60 * 24 * 365));
    const diffInMonths = Math.floor(absDiffInMs / (1000 * 60 * 60 * 24 * 30));
    const diffInDays = Math.floor(absDiffInMs / (1000 * 60 * 60 * 24));

    if (launch.upcoming || diffInMs > 0) {
      if (diffInYears > 0) {
        return `in ${diffInYears} year${diffInYears > 1 ? 's' : ''}`;
      } else if (diffInMonths > 0) {
        return `in ${diffInMonths} month${diffInMonths > 1 ? 's' : ''}`;
      } else if (diffInDays > 0) {
        return `in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
      } else {
        return 'Soon';
      }
    }

    if (diffInYears > 0) {
      return `${diffInYears} year${diffInYears > 1 ? 's' : ''} ago`;
    } else if (diffInMonths > 0) {
      return `${diffInMonths} month${diffInMonths > 1 ? 's' : ''} ago`;
    } else if (diffInDays > 0) {
      return `${diffInDays} day${diffInDays > 1 ? 's' : ''} ago`;
    } else {
      return 'Today';
    }
  };

  // get launch status
  const getLaunchStatus = () => {
    if (launch.upcoming) {
      return { text: 'Upcoming', color: 'blue' };
    } else if (launch.launch_success === true) {
      return { text: 'Success', color: 'green' };
    } else if (launch.launch_success === false) {
      return { text: 'Failed', color: 'red' };
    } else {
      return { text: 'Unknown', color: 'gray' };
    }
  };

  // get available links
  const getAvailableLinks = () => {
    const links = [];
    
    if (launch.links?.article_link) {
      links.push({ type: 'article', url: launch.links.article_link, icon: FaFileAlt, label: 'Article' });
    }
    if (launch.links?.video_link) {
      links.push({ type: 'video', url: launch.links.video_link, icon: FaYoutube, label: 'Video' });
    }
    if (launch.links?.wikipedia) {
      links.push({ type: 'wikipedia', url: launch.links.wikipedia, icon: FaWikipediaW, label: 'Wikipedia' });
    }
    if (launch.links?.reddit_campaign) {
      links.push({ type: 'reddit_campaign', url: launch.links.reddit_campaign, icon: FaReddit, label: 'Reddit Campaign' });
    }
    if (launch.links?.reddit_launch) {
      links.push({ type: 'reddit_launch', url: launch.links.reddit_launch, icon: FaReddit, label: 'Reddit Launch' });
    }
    if (launch.links?.presskit) {
      links.push({ type: 'presskit', url: launch.links.presskit, icon: FaFileAlt, label: 'Press Kit' });
    }
    
    return links;
  };

  const status = getLaunchStatus();
  const availableLinks = getAvailableLinks();
  const hasMissionPatch = launch.links?.mission_patch && !imageError;
  const hasFlickrImages = launch.links?.flickr_images && launch.links.flickr_images.length > 0;

  return (
    <Box 
      p={6} 
      borderWidth="1px" 
      borderRadius="lg" 
      bg={cardBg} 
      borderColor={borderColor}
      shadow="sm"
      _hover={{ shadow: 'md' }}
      transition="all 0.2s"
    >
      {/* main content area */}
      <HStack align="start" spacing={4}>
        {/* mission patch */}
        {hasMissionPatch && (
          <Box flexShrink={0}>
            <Skeleton isLoaded={imageLoaded} borderRadius="md">
              <Image
                src={launch.links.mission_patch_small || launch.links.mission_patch}
                alt={`${launch.mission_name} mission patch`}
                boxSize="80px"
                objectFit="contain"
                borderRadius="md"
                onLoad={() => setImageLoaded(true)}
                onError={() => setImageError(true)}
                fallback={<Box boxSize="80px" bg={badgeBg} borderRadius="md" />}
              />
            </Skeleton>
          </Box>
        )}

        {/* main content */}
        <VStack align="start" flex="1" spacing={2}>
          <HStack justify="space-between" w="full" align="start">
            <VStack align="start" spacing={1}>
              <Text fontWeight="bold" fontSize="xl">
                {launch.mission_name}
              </Text>
              <HStack spacing={2}>
                <Badge colorScheme={status.color} variant="subtle">
                  {status.text}
                </Badge>
                <Text fontSize="sm" color={headerTextColor}>
                  {getTimeAgo(launch.launch_date_utc)}
                </Text>
              </HStack>
            </VStack>
            
            <VStack spacing={6}>
              {hasFlickrImages && (
                <Tooltip label="View Photos">
                  <IconButton
                    icon={<ViewIcon />}
                    size="sm"
                    variant="outline"
                    onClick={onGalleryOpen}
                    aria-label="View photos"
                  />
                </Tooltip>
              )}
              <Button size="sm" bgColor="blue.500" color="white" _hover={{ bg: "blue.700"}} onClick={() => setShowDetails(prev => !prev)}>
                {showDetails ? 'Hide Details' : 'View Details'}
              </Button>
            </VStack>
          </HStack>

          {/* quick links */}
          {availableLinks.length > 0 && (
            <HStack spacing={2} flexWrap="wrap">
              {availableLinks.slice(0, 4).map((link, index) => {
                const IconComponent = link.icon;
                return (
                  <Tooltip key={index} label={link.label}>
                    <Link
                      href={link.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      _hover={{ textDecoration: 'none' }}
                    >
                      <IconButton
                        icon={<IconComponent />}
                        size="xs"
                        variant="ghost"
                        colorScheme={link.type.includes('reddit') ? 'orange' : 'blue'}
                        aria-label={link.label}
                      />
                    </Link>
                  </Tooltip>
                );
              })}
              {availableLinks.length > 4 && (
                <Text fontSize="xs" color={headerTextColor}>
                  +{availableLinks.length - 4} more
                </Text>
              )}
            </HStack>
          )}
        </VStack>
      </HStack>

      {/* detailed view */}
      {showDetails && (
        <Box mt={6} pt={4} borderTop="1px" borderColor={borderColor}>
          <VStack spacing={4} align="stretch">
            {/* launch info */}
            <SimpleGrid columns={{ base: 1, md: 2 }} spacing={4}>
              <Box>
                <Text fontSize="sm" color={headerTextColor} mb={2}>
                  <strong>Launch Date:</strong> {new Date(launch.launch_date_utc).toLocaleString()}
                </Text>
                <Text fontSize="sm" color={headerTextColor} mb={2}>
                  <strong>Rocket:</strong> {launch.rocket?.rocket_name || 'N/A'}
                </Text>
                <Text fontSize="sm" color={headerTextColor}>
                  <strong>Launch Site:</strong> {launch.launch_site?.site_name_long || 'N/A'}
                </Text>
              </Box>
              
              <Box>
                <Text fontSize="sm" color={headerTextColor} mb={2}>
                  <strong>Flight Number:</strong> {launch.flight_number}
                </Text>
                <Text fontSize="sm" color={headerTextColor} mb={2}>
                  <strong>Status:</strong>{' '}
                  <Badge colorScheme={status.color} size="sm">
                    {status.text}
                  </Badge>
                </Text>
              </Box>
            </SimpleGrid>

            {/* description */}
            {launch.details && (
              <Box p={4} bg={detailBg} borderRadius="md" borderWidth="1px" borderColor={borderColor}>
                <Text fontSize="sm" lineHeight="1.6">
                  <strong>Mission Details:</strong> {launch.details}
                </Text>
              </Box>
            )}

            {/* all available links */}
            {availableLinks.length > 0 && (
              <Box>
                <Text fontSize="sm" fontWeight="semibold" mb={3} color={headerTextColor}>
                  Resources:
                </Text>
                <SimpleGrid columns={{ base: 1, sm: 2, md: 3 }} spacing={2}>
                  {availableLinks.map((link, index) => {
                    const IconComponent = link.icon;
                    return (
                      <Link
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        _hover={{ textDecoration: 'none' }}
                      >
                        <HStack
                          p={2}
                          borderRadius="md"
                          bg={badgeBg}
                          _hover={{ bg: hoverBg }}
                          transition="background 0.2s"
                        >
                          <IconComponent size="14px" />
                          <Text fontSize="xs">{link.label}</Text>
                          <ExternalLinkIcon boxSize="10px" />
                        </HStack>
                      </Link>
                    );
                  })}
                </SimpleGrid>
              </Box>
            )}
          </VStack>
        </Box>
      )}

      {/* photo gallery modal */}
      {hasFlickrImages && (
        <Modal isOpen={isGalleryOpen} onClose={onGalleryClose} size="6xl">
          <ModalOverlay />
          <ModalContent>
            <ModalHeader>{launch.mission_name} - Photo Gallery</ModalHeader>
            <ModalCloseButton />
            <ModalBody pb={6}>
              <SimpleGrid columns={{ base: 1, md: 2, lg: 3 }} spacing={4}>
                {launch.links.flickr_images.map((imageUrl, index) => (
                  <AspectRatio key={index} ratio={16/9}>
                    <Image
                      src={imageUrl}
                      alt={`${launch.mission_name} photo ${index + 1}`}
                      objectFit="cover"
                      borderRadius="md"
                      cursor="pointer"
                      _hover={{ transform: 'scale(1.02)' }}
                      transition="transform 0.2s"
                      onClick={() => window.open(imageUrl, '_blank')}
                    />
                  </AspectRatio>
                ))}
              </SimpleGrid>
            </ModalBody>
          </ModalContent>
        </Modal>
      )}
    </Box>
  );
};

export default LaunchCard;
