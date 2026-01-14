'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ArreteUploadDialog } from './ArreteUploadDialog';
import { Plus } from 'lucide-react';

export function ArreteUploadDialogButton() {
  const [open, setOpen] = useState(false);

  return (
    <>
      <Button onClick={() => setOpen(true)}>
        <Plus className="mr-2 h-4 w-4" />
        Nouvel Arrêté
      </Button>
      <ArreteUploadDialog open={open} onOpenChange={setOpen} />
    </>
  );
}
