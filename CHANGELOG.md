# Changelog

## 2026-02-05 - Bug Fixes & Feature Additions

### Fixed
1. **System Status Modal - Last Heartbeat**: Now shows actual timestamp from metrics.json instead of hardcoded "Recent"
2. **System Status Modal - Uptime**: Now shows real dashboard uptime (time since page load) instead of "—"
3. **System Status Modal - Active Sessions**: Now fetches real session count from metrics.json instead of "Loading..."

### Added
4. **Site Status Monitoring**: New section displaying real-time status of all arialabs.ai properties:
   - dashboard.arialabs.ai
   - reps.arialabs.ai (Accountability Dashboard)
   - suppr.arialabs.ai
   - jeremyspofford.dev (Portfolio)
   - Shows online/offline status with latency measurements

5. **Backlog/Blocked Tasks Display**: Added 4th column to kanban board showing blocked tasks with blocker reasons
   - Displays tasks from kanban.json's "blocked" array
   - Shows blocker reason in task metadata
   - Red left border to indicate blocked status

### Technical Details

#### System Status Improvements
- Added `pageLoadTime` tracking on initial load
- Created `formatUptime()` function to convert milliseconds to human-readable format
- Modified `showSystemStatus()` to async function that fetches latest metrics
- Pulls `sessions.active` and `generatedAt` from metrics.json

#### Site Status Monitoring
- Created `checkSiteStatus()` function that tests each site
- Uses `fetch()` with `no-cors` mode and 10s timeout
- Displays latency in milliseconds for online sites
- Shows "Timeout" for sites that don't respond within 10s
- Updates on page load and when "Refresh" is clicked

#### Kanban Board Updates
- Changed grid from 3 columns to 4 columns
- Added "Blocked" column between "Up Next" and "Done Today"
- Updated `loadKanban()` to populate blocked items
- Modified `showTaskModal()` to display blocker field for blocked tasks
- Updated mobile responsiveness:
  - Tablets (768px): 2 columns
  - Mobile (480px): 1 column

### Testing
- Created test.html with validation tests for:
  - `formatUptime()` function correctness
  - Kanban JSON structure validation
  - Metrics JSON required fields
  - Site status URL validity

### Files Modified
- index.html (main changes)

### Files Added
- test.html (validation tests)
- CHANGELOG.md (this file)
