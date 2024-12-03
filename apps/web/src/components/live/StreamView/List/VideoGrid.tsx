import { cva } from 'class-variance-authority';

import { StreamData } from '@/components/live/StreamView';

import VideoPlayer from './VideoPlayer';

const containerVariants = cva('h-full flex-1 justify-center gap-5', {
  variants: {
    layout: {
      grid: `grid grid-cols-3 items-center justify-center gap-5`,
      flex: 'flex flex-wrap items-center justify-center',
    },
  },
  defaultVariants: {
    layout: 'flex',
  },
});

interface VideoGridProps {
  videoStreamData: StreamData[];
  onVideoClick: (stream: StreamData) => void;
  getAudioMutedState: (stream: StreamData) => boolean;
  activeSocketId: string | null;
}

function VideoGrid({
  videoStreamData,
  onVideoClick,
  getAudioMutedState,
  activeSocketId,
}: VideoGridProps) {
  return (
    <div className={containerVariants({ layout: videoStreamData.length > 3 ? 'grid' : 'flex' })}>
      {videoStreamData.map((streamData, idx) => (
        <div
          key={`${streamData.consumer?.id}${idx}`}
          className="h-full w-full flex-1 overflow-hidden rounded-lg"
          onClick={() => streamData.stream && onVideoClick(streamData)}
        >
          <VideoPlayer
            paused={streamData.paused}
            nickname={streamData.nickname}
            stream={streamData.stream ?? null}
            isMicOn={streamData && getAudioMutedState(streamData)}
            mediaType={streamData.consumer?.appData?.mediaTypes}
            socketId={streamData.socketId}
            activeSocketId={activeSocketId}
          />
        </div>
      ))}
    </div>
  );
}

export default VideoGrid;
