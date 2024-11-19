import { useEffect, useRef } from 'react';

export interface MediaPlayerProps {
  stream: MediaStream | null;
  muted?: boolean;
  className?: string;
}

function VideoPlayer({ stream, muted = true, className = '' }: MediaPlayerProps) {
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    if (videoRef.current && stream) {
      videoRef.current.srcObject = stream;
    }
  }, [stream]);

  // eslint-disable-next-line jsx-a11y/media-has-caption
  return <video ref={videoRef} autoPlay muted={muted} className={className} />;
}
export default VideoPlayer;