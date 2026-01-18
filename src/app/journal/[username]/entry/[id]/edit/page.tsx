import { getEntry, updateEntry } from '@/lib/actions/journal';
import { requireAuth } from '@/lib/auth';
import { EntryForm } from '@/components/EntryForm';
import { notFound } from 'next/navigation';

type PageProps = {
  params: Promise<{
    username: string;
    id: string;
  }>;
};

export default async function EditEntryPage({ params }: PageProps) {
  const { username, id } = await params;
  const user = await requireAuth();
  const result = await getEntry(id, user.id);

  if (result.error) {
    notFound();
  }

  const entry = result.entry!;

  // Verify ownership and username match
  if (entry.userId !== user.id || entry.user.username !== username) {
    notFound();
  }

  const handleUpdateEntry = async (data: any) => {
    'use server';
    
    const result = await updateEntry(id, data);
    
    if (result.success) {
      return { 
        success: true, 
        username: user.username 
      };
    }
    
    return result;
  };

  return (
    <div>
      <EntryForm
        mode="edit"
        entryId={id}
        initialData={{
          subject: entry.subject || '',
          contentHtml: entry.contentHtml,
          security: entry.security,
          mood: entry.mood || '',
          music: entry.music || '',
          location: entry.location || '',
        }}
        onSubmit={handleUpdateEntry}
      />
    </div>
  );
}