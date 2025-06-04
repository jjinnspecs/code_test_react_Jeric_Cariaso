import React, { useEffect, useState, useCallback } from 'react';
import {
  Box,
  Input,
  Spinner,
  Text,
  VStack,
  Container,
  HStack,
  IconButton,
  useColorMode,
  Heading,
  Center,
  Select,
  Modal, 
  ModalOverlay, 
  ModalContent, 
  ModalHeader, 
  ModalCloseButton, 
  ModalBody, 
  ModalFooter, 
  Button,
  useDisclosure,
  Divider
} from '@chakra-ui/react';
import { MoonIcon, SunIcon } from '@chakra-ui/icons';
import { FiFilter } from 'react-icons/fi';
import LaunchCard from '../components/LaunchCard';
import { debounce } from 'lodash';

const API_BASE_URL = 'http://localhost:5000/api';
const LIMIT = 10;

// color mode toggle
const ColorModeToggle = () => {
  const { colorMode, toggleColorMode } = useColorMode();
  return (
    <IconButton
      icon={colorMode === 'light' ? <MoonIcon /> : <SunIcon />}
      onClick={toggleColorMode}
      size="lg"
      variant="ghost"
      aria-label="Toggle color mode"
    />
  );
};

// helper function to deduplicate launches by flight_number
const deduplicateLaunches = (launches) => {
  const seen = new Set();
  return launches.filter(launch => {
    if (seen.has(launch.flight_number)) {
      return false;
    }
    seen.add(launch.flight_number);
    return true;
  });
};

// helper function to create unique key
const createUniqueKey = (launch, index) => {
  return launch.flight_number ? `launch-${launch.flight_number}` : `launch-${index}-${launch.mission_name}`;
};

// helper function to group launches by year
const groupLaunchesByYear = (launches) => {
  const grouped = {};
  launches.forEach(launch => {
    const year = launch.launch_year;
    if (!grouped[year]) {
      grouped[year] = [];
    }
    grouped[year].push(launch);
  });
  
  // sort years in descending order
  const sortedYears = Object.keys(grouped).sort((a, b) => parseInt(b) - parseInt(a));
  
  return sortedYears.map(year => ({
    year,
    launches: grouped[year]
  }));
};

const App = () => {
  const [launches, setLaunches] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(true);
  const [offset, setOffset] = useState(0);
  const [search, setSearch] = useState('');
  const [year, setYear] = useState('');
  const [status, setStatus] = useState('');
  const [allLaunches, setAllLaunches] = useState([]);

  const { isOpen, onOpen, onClose } = useDisclosure();
  const [searchInput, setSearchInput] = useState('');

  // debounce search
  const debouncedSearch = useCallback(
    debounce((value) => {
      setSearch(value);
      // reset pagination when search changes
      setOffset(0);
      setLaunches([]);
      setHasMore(true);
    }, 500),
    []
  );

  useEffect(() => {
    debouncedSearch(searchInput);
  }, [searchInput, debouncedSearch]);

  // fetch all launches for filter options (only once)
  const fetchAllLaunches = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/launches?limit=1000`);
      const data = await response.json();
      
      if (data.launches && Array.isArray(data.launches)) {
        const uniqueLaunches = deduplicateLaunches(data.launches);
        setAllLaunches(uniqueLaunches);
      }
    } catch (error) {
      // console.error('Failed to fetch all launches:', error);
      setAllLaunches([]);
    }
  };

  // fetch launches with filters and pagination
  const fetchLaunches = useCallback(async (isLoadMore = false) => {
    if (isLoadMore) {
      setLoadingMore(true);
    } else {
      setLoading(true);
    }

    try {
      const currentOffset = isLoadMore ? offset : 0;
      const params = new URLSearchParams({
        limit: LIMIT,
        offset: currentOffset,
        ...(search && { search }),
        ...(year && { year }),
        ...(status && { status })
      });

      const response = await fetch(`${API_BASE_URL}/launches?${params}`);
      const data = await response.json();

      if (data.launches && Array.isArray(data.launches)) {
        const uniqueLaunches = deduplicateLaunches(data.launches);
        
        if (isLoadMore) {
          // prevent duplicates when loading more
          setLaunches(prev => {
            const existingIds = new Set(prev.map(launch => launch.flight_number));
            const newLaunches = uniqueLaunches.filter(launch => !existingIds.has(launch.flight_number));
            return [...prev, ...newLaunches];
          });
          setOffset(prev => prev + LIMIT);
        } else {
          // fresh load
          setLaunches(uniqueLaunches);
          setOffset(LIMIT);
        }

        setHasMore(data.hasMore);
      } else {
        // console.error('Expected launches array but got:', data);
        if (!isLoadMore) {
          setLaunches([]);
        }
        setHasMore(false);
      }
    } catch (error) {
      // console.error('Failed to fetch launches:', error);
      if (!isLoadMore) {
        setLaunches([]);
      }
      setHasMore(false);
    }

    if (isLoadMore) {
      setLoadingMore(false);
    } else {
      setLoading(false);
    }
  }, [offset, search, year, status]);

  // initial load
  useEffect(() => {
    fetchAllLaunches();
  }, []);

  // fetch launches when filters change
  useEffect(() => {
    setLaunches([]);
    setOffset(0);
    setHasMore(true);
    fetchLaunches(false);
  }, [search, year, status]);

  // infinite scroll handler
  const handleScroll = useCallback(() => {
    if (loadingMore || !hasMore) return;

    const scrollTop = window.innerHeight + document.documentElement.scrollTop;
    const scrollHeight = document.documentElement.scrollHeight;

    if (scrollTop >= scrollHeight - 100) {
      fetchLaunches(true);
    }
  }, [loadingMore, hasMore, fetchLaunches]);

  useEffect(() => {
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, [handleScroll]);

  const handleFilterChange = (filterType, value) => {
    if (filterType === 'year') {
      setYear(value);
    } else if (filterType === 'status') {
      setStatus(value);
    }
  };

  const clearFilters = () => {
    setYear('');
    setStatus('');
    setSearchInput('');
    setSearch('');
  };

  // group launches by year for display
  const groupedLaunches = groupLaunchesByYear(launches);

  return (
    <Container maxW="container.lg" py={10}>
      <HStack justify="space-between" mb={6}>
        <Heading size="lg" color="teal.500">SpaceX Launches</Heading>
        <ColorModeToggle />
      </HStack>

      <HStack spacing={4} mb={6} wrap="wrap" w="full" align="stretch">
        <Input
          placeholder="Search by mission name..."
          value={searchInput}
          onChange={e => setSearchInput(e.target.value)}
          minW="20px"
          flex="1"
        />
        <IconButton
          icon={<FiFilter />}
          onClick={onOpen}
          aria-label="Open filters"
          variant="outline"
        />
        {(year || status || search) && (
          <Button size="sm" variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        )}
      </HStack>

      {/* initial loading */}
      {loading && launches.length === 0 && (
        <Center mb={4}>
          <Spinner size="lg" />
          <Text ml={3}>Loading launches...</Text>
        </Center>
      )}

      {/* grouped launches by year */}
      <VStack spacing={6} align="stretch">
        {groupedLaunches.map(({ year: launchYear, launches: yearLaunches }) => (
          <Box key={launchYear}>
            <Heading size="md" color="teal.400" mb={4}>
              {launchYear}
            </Heading>
            <VStack spacing={4} align="stretch">
              {yearLaunches.map((launch, index) => (
                <LaunchCard 
                  key={createUniqueKey(launch, index)} 
                  launch={launch} 
                />
              ))}
            </VStack>

            {launchYear !== groupedLaunches[groupedLaunches.length - 1].year && (
              <Divider mt={6} />
            )}
          </Box>
        ))}
      </VStack>

      {/* loading more at bottom */}
      {loadingMore && (
        <Center mt={6} mb={4}>
          <Spinner />
          <Text ml={3}>Loading more launches...</Text>
        </Center>
      )}

      {/* End of list message */}
      {!hasMore && !loading && !loadingMore && launches.length > 0 && (
        <Text mt={6} textAlign="center" color="gray.500">
          End of list.
        </Text>
      )}

      {/* no launches found */}
      {!loading && !loadingMore && launches.length === 0 && (
        <Text mt={6} textAlign="center" color="gray.500">
          No launches found.
        </Text>
      )}

      <Modal isOpen={isOpen} onClose={onClose} isCentered>
        <ModalOverlay />
        <ModalContent>
          <ModalHeader>Filter Launches</ModalHeader>
          <ModalCloseButton />
          <ModalBody>
            <VStack spacing={4}>
              <Select
                placeholder="Filter by year"
                value={year}
                onChange={e => handleFilterChange('year', e.target.value)}
              >
                {Array.isArray(allLaunches) && allLaunches.length > 0 ? 
                  [...new Set(allLaunches.map(l => l.launch_year))]
                    .sort((a, b) => parseInt(b) - parseInt(a))
                    .map((yearOption, index) => (
                      <option key={`year-${yearOption}-${index}`} value={yearOption}>
                        {yearOption}
                      </option>
                    ))
                  : null
                }
              </Select>

              <Select
                placeholder="Filter by status"
                value={status}
                onChange={e => handleFilterChange('status', e.target.value)}
              >
                <option value="success">Success</option>
                <option value="failed">Failed</option>
                <option value="upcoming">Upcoming</option>
              </Select>
            </VStack>
          </ModalBody>

          <ModalFooter>
            <Button onClick={onClose} colorScheme="teal">Apply Filters</Button>
          </ModalFooter>
        </ModalContent>
      </Modal>
    </Container>
  );
};

export default App;
