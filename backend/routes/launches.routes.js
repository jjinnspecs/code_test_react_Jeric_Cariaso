import express from 'express';
import fetch from 'node-fetch';

const router = express.Router();

// helper function to deduplicate launches
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

// GET /api/launches
router.get('/', async (req, res) => {
  try {
    const { search = '', year = '', status = '', offset = 0, limit = 10 } = req.query;

    const apiUrl = 'https://api.spacexdata.com/v3/launches';
    const response = await fetch(`${apiUrl}?limit=1000`); // get all launches
    const data = await response.json();

    // deduplicate first
    const uniqueData = deduplicateLaunches(data);

    // filter logic
    const filtered = uniqueData.filter(launch => {
      const matchesSearch = search
        ? launch.mission_name.toLowerCase().includes(search.toLowerCase())
        : true;

      const matchesYear = year ? launch.launch_year === year : true;

      // handle status filter (success, failed, upcoming)
      let matchesStatus = true;
      if (status) {
        if (status === 'success') {
          matchesStatus = launch.launch_success === true;
        } else if (status === 'failed') {
          matchesStatus = launch.launch_success === false;
        } else if (status === 'upcoming') {
          matchesStatus = launch.upcoming === true;
        }
      }

      return matchesSearch && matchesYear && matchesStatus;
    });

    // sort by year (newest first) and then by launch date
    const sorted = filtered.sort((a, b) => {
      // first sort by year (descending)
      const yearDiff = parseInt(b.launch_year) - parseInt(a.launch_year);
      if (yearDiff !== 0) return yearDiff;
      
      // then sort by launch date (newest first within the same year)
      return new Date(b.launch_date_utc) - new Date(a.launch_date_utc);
    });

    // paginate
    const start = Number(offset);
    const end = start + Number(limit);
    const paginated = sorted.slice(start, end);
    const hasMore = end < sorted.length;

    res.json({
      launches: paginated,
      hasMore,
      total: sorted.length
    });
  } catch (error) {
    // console.error('Failed to fetch launches:', error);
    res.status(500).json({ error: 'Failed to fetch data' });
  }
});

export default router;
