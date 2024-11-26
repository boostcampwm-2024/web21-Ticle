import { StreamData } from '@/components/live/StreamView';
import PaginationControls from '@/components/live/StreamView/List/PaginationControls';
import VideoGrid from '@/components/live/StreamView/List/VideoGrid';
import usePagination from '@/hooks/usePagination';

const ITEMS_PER_GRID = 9;

interface UnPinedListProps {
  addPinnedVideo: (stream: StreamData) => void;
  getAudioMutedState: (stream: StreamData) => boolean;
}

function UnPinedList({ addPinnedVideo, getAudioMutedState }: UnPinedListProps) {
  const { paginatedItems: paginatedStreams, ...paginationControlsProps } = usePagination({
    itemsPerPage: ITEMS_PER_GRID,
  });

  return (
    <PaginationControls {...paginationControlsProps}>
      <VideoGrid
        videoStreamData={paginatedStreams}
        onVideoClick={addPinnedVideo}
        getAudioMutedState={getAudioMutedState}
      />
    </PaginationControls>
  );
}

export default UnPinedList;