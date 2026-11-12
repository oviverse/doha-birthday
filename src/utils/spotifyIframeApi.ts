export interface SpotifyPlaybackUpdateData {
  playingURI: string;
  isPaused: boolean;
  isBuffering: boolean;
  duration: number;
  position: number;
}

export interface SpotifyEmbedController {
  loadUri: (uri: string, preferVideo?: boolean, timestampInSeconds?: number) => void;
  play: () => void;
  pause: () => void;
  togglePlay: () => void;
  destroy: () => void;
  addListener: (
    event: 'ready' | 'playback_started' | 'playback_update' | 'error',
    callback: (event: { data: SpotifyPlaybackUpdateData }) => void
  ) => void;
}

export interface SpotifyIFrameAPI {
  createController: (
    element: HTMLElement,
    options: {
      width?: string | number;
      height?: string | number;
      uri: string;
      theme?: 'dark' | 'light';
    },
    callback: (controller: SpotifyEmbedController) => void
  ) => void;
}

declare global {
  interface Window {
    onSpotifyIframeApiReady?: (api: SpotifyIFrameAPI) => void;
  }
}

let apiPromise: Promise<SpotifyIFrameAPI> | null = null;

/**
 * Loads the official Spotify Embed IFrame API once and caches the resolved API instance.
 */
export function loadSpotifyIframeApi(): Promise<SpotifyIFrameAPI> {
  if (apiPromise) return apiPromise;

  apiPromise = new Promise<SpotifyIFrameAPI>((resolve, reject) => {
    const previousReady = window.onSpotifyIframeApiReady;

    window.onSpotifyIframeApiReady = (api: SpotifyIFrameAPI) => {
      previousReady?.(api);
      resolve(api);
    };

    if (!document.getElementById('spotify-iframe-api-loader')) {
      const script = document.createElement('script');
      script.id = 'spotify-iframe-api-loader';
      script.src = 'https://open.spotify.com/embed/iframe-api/v1';
      script.async = true;
      script.onerror = () => {
        apiPromise = null;
        reject(new Error('Failed to load Spotify IFrame API'));
      };
      document.head.appendChild(script);
    }
  });

  return apiPromise;
}
