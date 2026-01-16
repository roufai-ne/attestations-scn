'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogTrigger,
} from '@/components/ui/dialog';
import { PDFViewer } from '@/components/shared/PDFViewer';
import { Eye, FileText } from 'lucide-react';

interface AttestationPreviewProps {
    attestationId: string;
    numero: string;
    statut: string;
}

/**
 * Composant de prévisualisation d'attestation dans un modal
 */
export function AttestationPreview({
    attestationId,
    numero,
    statut,
}: AttestationPreviewProps) {
    const [open, setOpen] = useState(false);

    const pdfUrl = `/api/attestations/${attestationId}/download`;

    return (
        <Dialog open={open} onOpenChange={setOpen}>
            <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                    <Eye className="h-4 w-4 mr-1" />
                    Aperçu
                </Button>
            </DialogTrigger>
            <DialogContent className="max-w-4xl max-h-[90vh]">
                <DialogHeader>
                    <DialogTitle className="flex items-center gap-2">
                        <FileText className="h-5 w-5" />
                        Attestation {numero}
                        <span
                            className={`
                ml-2 px-2 py-0.5 text-xs rounded-full
                ${statut === 'SIGNEE' ? 'bg-green-100 text-green-800' : ''}
                ${statut === 'GENEREE' ? 'bg-yellow-100 text-yellow-800' : ''}
                ${statut === 'EN_ATTENTE_SIGNATURE' ? 'bg-blue-100 text-blue-800' : ''}
              `}
                        >
                            {statut}
                        </span>
                    </DialogTitle>
                </DialogHeader>
                <PDFViewer
                    fileUrl={pdfUrl}
                    fileName={`${numero}.pdf`}
                    height="600px"
                    showDownload={true}
                    showFullScreen={false}
                />
            </DialogContent>
        </Dialog>
    );
}

export default AttestationPreview;
