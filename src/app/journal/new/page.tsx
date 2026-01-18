import { requireAuth } from '@/lib/auth';
import { createEntry } from '@/lib/actions/journal';
import { EntryForm, EntryInput } from '@/components/EntryForm';

export default async function NewEntryPage() {
  const user = await requireAuth();

  const handleCreateEntry = async (data: EntryInput) => {
    'use server';
    
    const result = await createEntry(data);
    
    if (result.success) {
      return { 
        success: true, 
        entryId: result.entryId,
        username: user.username 
      };
    }
    
    return result;
  };

  return (
    <div>
      <EntryForm
        mode="create"
        onSubmitAction={handleCreateEntry}
      />
    </div>
  );
}