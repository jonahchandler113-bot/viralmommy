# Upload Components

Beautiful, accessible video upload components for ViralMommy.

## Components

### VideoUploadZone

Drag-and-drop upload zone with file validation.

```tsx
import { VideoUploadZone } from '@/components/upload/VideoUploadZone'

<VideoUploadZone
  onFileSelect={(file) => console.log('Selected:', file)}
  isUploading={false}
  error={null}
/>
```

### UploadProgress

Upload progress indicator with multiple states.

```tsx
import { UploadProgress } from '@/components/upload/UploadProgress'

<UploadProgress
  fileName="my-video.mp4"
  fileSize={5242880}
  progress={75}
  status="uploading"
  onCancel={() => console.log('Cancelled')}
/>
```

## Hook

### useVideoUpload

Complete upload management with progress tracking.

```tsx
import { useVideoUpload } from '@/hooks/useVideoUpload'

const { upload, progress, status, cancel } = useVideoUpload({
  onSuccess: (video) => console.log('Success!', video),
  onError: (error) => console.error('Error:', error)
})

// Upload a file
upload(file)

// Cancel upload
cancel()
```

## Full Example

```tsx
'use client'

import { useState } from 'react'
import { VideoUploadZone } from '@/components/upload/VideoUploadZone'
import { UploadProgress } from '@/components/upload/UploadProgress'
import { useVideoUpload } from '@/hooks/useVideoUpload'
import { useToast } from '@/components/ui/toast'

export function UploadExample() {
  const [file, setFile] = useState<File | null>(null)
  const { showToast } = useToast()

  const {
    upload,
    progress,
    status,
    error,
    cancel,
    reset,
    isUploading,
  } = useVideoUpload({
    onSuccess: (video) => {
      showToast({
        title: 'Upload Complete!',
        description: video.filename,
        variant: 'success',
      })
      setTimeout(() => {
        setFile(null)
        reset()
      }, 2000)
    },
    onError: (error) => {
      showToast({
        title: 'Upload Failed',
        description: error.message,
        variant: 'error',
      })
    },
  })

  const handleFileSelect = (selectedFile: File) => {
    setFile(selectedFile)
    upload(selectedFile)
  }

  return (
    <div className="space-y-4">
      <VideoUploadZone
        onFileSelect={handleFileSelect}
        isUploading={isUploading}
        error={error}
      />

      {file && status !== 'idle' && (
        <UploadProgress
          fileName={file.name}
          fileSize={file.size}
          progress={progress}
          status={status as any}
          error={error}
          onCancel={isUploading ? cancel : undefined}
          onClose={() => {
            setFile(null)
            reset()
          }}
        />
      )}
    </div>
  )
}
```

## Features

- Drag and drop support
- Click to browse
- File validation (type & size)
- Real-time progress tracking
- Cancel/retry functionality
- Beautiful animations
- Toast notifications
- Fully responsive
- Accessible (WCAG AA)

## File Validation

**Supported formats:**
- MP4 (video/mp4)
- MOV (video/quicktime)
- AVI (video/x-msvideo)
- MKV (video/x-matroska)
- WebM (video/webm)

**Max file size:** 100MB

## Styling

All components follow the ViralMommy design system with purple/pink gradients and smooth animations.

For more details, see the full documentation in `docs/VIDEO_UPLOAD_UI.md`.
