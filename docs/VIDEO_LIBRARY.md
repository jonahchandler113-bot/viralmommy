# Video Library UI Documentation

## Overview

The Video Library is the core content management interface for ViralMommy, allowing users to view, manage, and analyze their uploaded videos with AI-generated viral strategies.

## Components

### 1. Video Library Page (`app/(dashboard)/videos/page.tsx`)

The main video library interface with comprehensive filtering and sorting capabilities.

**Features:**
- **Grid Layout**: Responsive grid that adapts from 1 column (mobile) to 4 columns (desktop)
- **Status Filtering**: Filter by ALL, READY, PROCESSING, FAILED, or PUBLISHED
- **Sorting**: Sort by upload date, name, or duration (ascending/descending)
- **Pagination**: Navigate through pages with Previous/Next buttons
- **Empty State**: Friendly prompt to upload first video when library is empty
- **Real-time Updates**: Uses React Query for automatic data synchronization

**User Flow:**
1. View all videos in a responsive grid
2. Filter by status to find specific videos
3. Sort to organize videos by preference
4. Click on video card to open player modal
5. Use action menu for download, share, or delete

### 2. Video Card Component (`components/videos/VideoCard.tsx`)

Individual video card displaying thumbnail, metadata, and quick actions.

**Features:**
- **Thumbnail Display**: Shows video thumbnail or placeholder with play icon
- **Status Badge**: Animated indicators for UPLOADING, PROCESSING, READY, FAILED, PUBLISHED
- **Metadata Overlay**: Duration badge, upload time, file size
- **Viral Score**: Progress bar showing AI-calculated viral potential (if available)
- **Hover Effects**: Play button overlay appears on hover
- **Action Menu**: Three-dot menu with Play, Download, Share, Delete options
- **Error Messages**: Shows error details for failed videos

**Visual States:**
- **Uploading**: Blue badge with spinning loader
- **Processing**: Yellow badge with spinning loader
- **Ready**: Green badge with checkmark
- **Failed**: Red badge with X icon, displays error message
- **Published**: Green badge with checkmark

### 3. Video Player Modal (`components/videos/VideoPlayerModal.tsx`)

Full-screen modal for video playback and AI strategy review.

**Features:**
- **Video Player**: Native HTML5 video player with controls
- **Keyboard Support**: ESC key to close modal
- **AI Strategies Display**:
  - Viral Score with animated progress bar
  - Viral Hooks (purple cards)
  - Suggested Captions (pink cards)
  - Hashtag Sets (blue cards with individual tag badges)
  - Target Audience (green card)
  - Content Themes/Pillars (gradient badges)
- **Transcription**: Collapsible section with full video transcript
- **Responsive Design**: Adapts to mobile and desktop screens

**Layout:**
- Top: Video player with controls
- Bottom: Scrollable AI analysis sections
- Close button: Top-right corner

### 4. Video Details Page (`app/(dashboard)/videos/[id]/page.tsx`)

Dedicated page for in-depth video analysis and management.

**Features:**
- **Two-Column Layout**:
  - Left (2/3): Video player, hooks, captions, hashtags, transcription
  - Right (1/3): Viral score chart, target audience, content themes, video info
- **Viral Score Visualization**: Radial chart using Recharts library
  - Green (>70%): High viral potential
  - Orange (40-70%): Good potential
  - Red (<40%): Needs improvement
- **Action Buttons**: Download, Share, Delete
- **Processing States**: Loading spinner while processing
- **Error Handling**: Clear error messages for failed videos

**Navigation:**
- Back to Videos button returns to library
- URL structure: `/videos/[id]`

### 5. Videos Hook (`hooks/useVideos.ts`)

Custom React Query hooks for video data management.

**Exports:**
- `useVideos(options)`: Fetch paginated video list with filters
  - Options: page, pageSize, status, sortBy, sortOrder
  - Returns: videos array, total count, pagination info
  - Caching: 30-second stale time

- `useVideo(videoId)`: Fetch single video details
  - Auto-enabled when videoId provided
  - Used in details page

- `useDeleteVideo()`: Mutation hook for deleting videos
  - Invalidates queries on success
  - Optimistic UI updates

- `useUpdateVideo()`: Mutation hook for updating video metadata
  - Invalidates specific video and list queries

## Design System Integration

### Colors
- **Primary Gradient**: Purple (#9333ea) to Pink (#ec4899)
- **Status Colors**:
  - Uploading: Blue (#3b82f6)
  - Processing: Yellow (#f59e0b)
  - Ready: Green (#22c55e)
  - Failed: Red (#ef4444)

### Typography
- Headings: Font weight 600-700
- Body: Font weight 400
- Badges: Font weight 600, text-xs

### Spacing
- Card padding: 1rem (16px)
- Grid gap: 1.5rem (24px)
- Section spacing: 1.5rem (24px)

### Animations
- Badge status icons: Spin animation for UPLOADING/PROCESSING
- Hover effects: 300ms transition
- Progress bars: 500ms transition
- Modal: Fade and zoom animations

## API Integration

### Expected API Endpoints

```typescript
// GET /api/videos
// Query params: page, pageSize, status, sortBy, sortOrder
Response: {
  videos: Video[]
  total: number
  page: number
  pageSize: number
  totalPages: number
}

// GET /api/videos/[id]
Response: Video (with aiStrategies relation)

// DELETE /api/videos/[id]
Response: { success: boolean }

// PATCH /api/videos/[id]
Body: Partial<Video>
Response: Updated Video
```

### Video Data Model

```typescript
interface Video {
  id: string
  userId: string
  filename: string
  originalName: string
  storageKey: string
  storageUrl: string | null
  thumbnailUrl: string | null
  duration: number | null // seconds
  size: number // bytes
  mimeType: string
  status: 'UPLOADING' | 'PROCESSING' | 'READY' | 'FAILED' | 'PUBLISHED'
  errorMessage: string | null
  aiAnalysis: any | null
  transcription: string | null
  metadata: any | null
  createdAt: string // ISO date
  updatedAt: string // ISO date
  aiStrategies?: AiStrategy[]
}

interface AiStrategy {
  id: string
  videoId: string
  hooks: string[]
  captions: string[]
  hashtags: string[][] // Array of hashtag sets
  bestPostingTimes: any
  targetAudience: string | null
  contentPillars: string[] | null
  viralScore: number | null // 0-1 range
  createdAt: string
  updatedAt: string
}
```

## Mobile Responsiveness

### Breakpoints
- **Mobile** (<640px): 1 column grid, stacked filters
- **Tablet** (640-1024px): 2 column grid
- **Desktop** (1024-1280px): 3 column grid
- **Large Desktop** (>1280px): 4 column grid

### Mobile Optimizations
- Touch-friendly action buttons (min 44px)
- Horizontal scroll for status filters
- Stacked header buttons
- Full-width modals on mobile
- Simplified video details layout

## Accessibility

### Features
- **Keyboard Navigation**: Tab through cards, Enter to play
- **Screen Reader Support**: Descriptive ARIA labels
- **Focus Indicators**: Purple ring on focused elements
- **Alt Text**: All images have descriptive alt text
- **Color Contrast**: WCAG AA compliant
- **Touch Targets**: Minimum 44px for mobile

### ARIA Labels
```html
<button aria-label="Play video: [video name]">
<img alt="Thumbnail for [video name]">
<div role="status">Processing video...</div>
```

## Performance Optimizations

### React Query Caching
- 30-second stale time for video list
- Automatic background refetching
- Optimistic UI updates for mutations
- Query invalidation on data changes

### Image Loading
- Lazy loading for thumbnails
- Error fallback to gradient placeholder
- Responsive image sizing

### Code Splitting
- Dynamic imports for modal components
- Lazy load Recharts on details page

## Error Handling

### User-Facing Errors
1. **Network Errors**: "Failed to load videos. Please try again."
2. **No Videos**: Empty state with upload prompt
3. **Video Not Found**: Redirect to library with error message
4. **Delete Failed**: Alert with error details
5. **Processing Failed**: Display error message on card

### Developer Errors
- Console.error for debugging
- Sentry integration ready (add error boundaries)

## Future Enhancements

### Planned Features
1. **Bulk Actions**: Select multiple videos for batch operations
2. **Advanced Search**: Search by title, tags, content
3. **Video Editing**: Trim, crop, add overlays
4. **Folders/Collections**: Organize videos into categories
5. **Infinite Scroll**: Alternative to pagination
6. **Grid/List Toggle**: Switch between card and list view
7. **Video Analytics**: View count, engagement metrics
8. **Publishing Scheduler**: Schedule posts from library
9. **Duplicate Detection**: Warn before uploading duplicates
10. **Export Options**: Download with strategies as PDF

### Analytics Integration
- Track most viewed videos
- Monitor viral score trends
- A/B test different strategies
- Engagement rate tracking

## Testing Checklist

### Unit Tests
- [ ] VideoCard renders correctly
- [ ] Status badges display proper state
- [ ] Viral score calculations
- [ ] Date formatting

### Integration Tests
- [ ] Video list fetching
- [ ] Filtering works correctly
- [ ] Sorting updates list
- [ ] Pagination navigation
- [ ] Delete confirmation flow

### E2E Tests
- [ ] Upload and view video
- [ ] Play video in modal
- [ ] Navigate to details page
- [ ] Delete video from library
- [ ] Filter and sort interactions

## Troubleshooting

### Common Issues

**Videos not loading:**
- Check API endpoint configuration
- Verify authentication token
- Check network tab for errors

**Thumbnails not showing:**
- Verify storageUrl is accessible
- Check CORS configuration
- Ensure image format is supported

**Viral score not displaying:**
- Confirm aiStrategies relation is loaded
- Check viralScore is not null
- Verify data type (should be 0-1)

**Modal not opening:**
- Check video status is READY
- Verify onClick handler
- Check console for errors

## Dependencies

### Required Packages
```json
{
  "@tanstack/react-query": "^5.90.8",
  "@radix-ui/react-dialog": "^1.1.15",
  "@radix-ui/react-dropdown-menu": "^2.1.16",
  "date-fns": "^3.0.0",
  "recharts": "^3.4.1",
  "lucide-react": "^0.553.0"
}
```

### UI Components Used
- Button
- Card (Header, Content, Title)
- Badge
- Dialog (Modal)
- DropdownMenu
- Avatar
- Progress (for viral score bars)

## Conclusion

The Video Library provides a comprehensive, user-friendly interface for managing viral video content. With AI-powered insights, intuitive filtering, and responsive design, it empowers content creators to maximize their viral potential.

For questions or feature requests, contact the development team.
