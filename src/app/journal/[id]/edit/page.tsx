import { getEntry, updateEntry } from '@/lib/actions/journal';
import { requireAuth } from '@/lib/auth';
import { EntryForm } from '@/components/EntryForm';
import { notFound } from 'next/navigation';

type PageProps = {
  params: {
    id: string;
  };
};

export default async function EditEntryPage({ params }: PageProps) {
  const user = await requireAuth();
  const result = await getEntry(params.id, user.id);

  if (result.error) {
    notFound();
  }

  const entry = result.entry!;

  // Verify ownership
  if (entry.userId !== user.id) {
    notFound();
  }

  const handleUpdateEntry = async (data: any) => {
    'use server';
    
    const result = await updateEntry(params.id, data);
    
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
        entryId={params.id}
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