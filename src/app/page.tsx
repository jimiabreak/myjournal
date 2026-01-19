import { auth } from '@clerk/nextjs/server';
import { PublicHomepage } from '@/components/PublicHomepage';
import { AuthenticatedHomepage } from '@/components/AuthenticatedHomepage';

export default async function Home() {
  const { userId } = await auth();

  if (userId) {
    return <AuthenticatedHomepage />;
  }

  return <PublicHomepage />;
}
