import { createFileRoute } from '@tanstack/react-router';

import MediaContainer from '@/components/live';

export const Route = createFileRoute('/live/$ticleId')({
  component: RouteComponent,
});

function RouteComponent() {
  return <MediaContainer />;
}
