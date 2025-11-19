import { useState, useEffect } from 'react';

interface VideoStreamUrls {
  videoUrl: string;
  thumbnailUrl?: string;
  expiresIn: number;
  isLoading: boolean;
  error: string | null;
}

/**
 * Hook to get signed URLs for video playback from R2
 * Automatically refreshes before expiration
 */
export function useVideoStream(videoId: string | null, storageUrl?: string) {
  const [urls, setUrls] = useState<VideoStreamUrls>({
    videoUrl: '',
    thumbnailUrl: undefined,
    expiresIn: 0,
    isLoading: false,
    error: null,
  });

  useEffect(() => {
    if (!videoId || !storageUrl) {
      return;
    }

    // Check if this is an R2 video
    const isR2Video = storageUrl.startsWith('r2://');

    // If it's a local video (legacy), use the URL directly
    if (!isR2Video) {
      setUrls({
        videoUrl: storageUrl,
        thumbnailUrl: undefined,
        expiresIn: 0,
        isLoading: false,
        error: null,
      });
      return;
    }

    // For R2 videos, fetch signed URLs
    let cancelled = false;
    let refreshTimeout: NodeJS.Timeout;

    const fetchUrls = async () => {
      setUrls(prev => ({ ...prev, isLoading: true, error: null }));

      try {
        const response = await fetch(`/api/videos/${videoId}/stream`);

        if (!response.ok) {
          const error = await response.json();
          throw new Error(error.error || 'Failed to get video URL');
        }

        const data = await response.json();

        if (!cancelled) {
          setUrls({
            videoUrl: data.videoUrl,
            thumbnailUrl: data.thumbnailUrl,
            expiresIn: data.expiresIn,
            isLoading: false,
            error: null,
          });

          // Refresh URLs 5 minutes before expiration
          const refreshIn = (data.expiresIn - 300) * 1000;
          if (refreshIn > 0) {
            refreshTimeout = setTimeout(() => {
              fetchUrls();
            }, refreshIn);
          }
        }
      } catch (error) {
        if (!cancelled) {
          setUrls(prev => ({
            ...prev,
            isLoading: false,
            error: error instanceof Error ? error.message : 'Failed to load video',
          }));
        }
      }
    };

    fetchUrls();

    return () => {
      cancelled = true;
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [videoId, storageUrl]);

  return urls;
}
