import VideoPlayer from './VideoPlayer';

import { StreamData } from '.';

interface SubVideoGridProps {
  videoStreamData: StreamData[];
  onVideoClick?: (socketId: string) => void;
  pinnedSocketId?: string;
}

function SubVideoGrid({ videoStreamData, onVideoClick, pinnedSocketId }: SubVideoGridProps) {
  return (
    <div className="absolute flex w-full justify-center gap-5">
      {videoStreamData.map(
        (streamData) =>
          streamData.socketId !== pinnedSocketId && (
            <div
              key={streamData.socketId}
              className="aspect-video w-44"
              onClick={() => onVideoClick(streamData.socketId)}
            >
              <VideoPlayer stream={streamData.stream} avatarSize="sm" />
            </div>
          )
      )}
    </div>
  );
}

export default SubVideoGrid;
