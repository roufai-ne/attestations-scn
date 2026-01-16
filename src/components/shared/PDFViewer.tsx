'use client';

import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Loader2, Maximize2, Minimize2, Download, ExternalLink, FileText } from 'lucide-react';

interface PDFViewerProps {
    url: string;
    title?: string;
}

/**
 * Composant pour prévisualiser un PDF dans un modal ou inline
 */
export function PDFViewer({ url, title = 'Document' }: PDFViewerProps) {
    const [loading, setLoading] = useState(true);

    return (
        <div className="w-full h-full min-h-[500px] bg-gray-100 rounded-lg overflow-hidden relative">
            {loading && (
                <div className="absolute inset-0 flex items-center justify-center bg-gray-100 z-10">
                    <Loader2 className="h-8 w-8 animate-spin text-green-600" />
                    <span className="ml-2 text-gray-600">Chargement...</span>
                </div>
            )}
            <iframe
                src={`${url}#view=FitH`}
                className="w-full h-full min-h-[500px]"
                onLoad={() => setLoading(false)}
                title={title}
            />
        </div>
    );
}

interface PDFPreviewButtonProps {
    url: string;
    title?: string;
    buttonText?: string;
    variant?: 'default' | 'outline' | 'ghost' | 'link';
}

/**
 * Bouton qui ouvre un modal avec la prévisualisation PDF
 */
export function PDFPreviewButton({
    url,
    title = 'Prévisualisation',
    buttonText = 'Voir le PDF',
    variant = 'outline',
}: PDFPreviewButtonProps) {
    const [open, setOpen] = useState(false);
    const [fullscreen, setFullscreen] = useState(false);

    return (
        <>
            <Button variant={variant} onClick={() => setOpen(true)}>
                <FileText className="h-4 w-4 mr-2" />
                {buttonText}
            </Button>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent
                    className={fullscreen
                        ? 'max-w-[95vw] w-[95vw] h-[95vh] max-h-[95vh]'
                        : 'max-w-4xl w-full h-[80vh]'
                    }
                >
                    <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <DialogTitle>{title}</DialogTitle>
                        <div className="flex items-center gap-2">
                            <Button
                                variant="ghost"
                                size="icon"
                                onClick={() => setFullscreen(!fullscreen)}
                                title={fullscreen ? 'Réduire' : 'Plein écran'}
                            >
                                {fullscreen ? (
                                    <Minimize2 className="h-4 w-4" />
                                ) : (
                                    <Maximize2 className="h-4 w-4" />
                                )}
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                title="Télécharger"
                            >
                                <a href={url} download>
                                    <Download className="h-4 w-4" />
                                </a>
                            </Button>
                            <Button
                                variant="ghost"
                                size="icon"
                                asChild
                                title="Ouvrir dans un nouvel onglet"
                            >
                                <a href={url} target="_blank" rel="noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                        <PDFViewer url={url} title={title} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}

interface PDFCardProps {
    url: string;
    title?: string;
    description?: string;
}

/**
 * Carte avec aperçu miniature et actions PDF
 */
export function PDFCard({ url, title, description }: PDFCardProps) {
    const [open, setOpen] = useState(false);

    return (
        <>
            <div
                className="group cursor-pointer border rounded-lg overflow-hidden hover:shadow-md transition-shadow"
                onClick={() => setOpen(true)}
            >
                <div className="h-48 bg-gray-100 relative overflow-hidden">
                    <iframe
                        src={`${url}#view=FitH&toolbar=0&navpanes=0`}
                        className="w-full h-full pointer-events-none scale-50 origin-top-left"
                        style={{ width: '200%', height: '200%' }}
                        title={title}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <FileText className="h-8 w-8 text-white drop-shadow-lg" />
                        </div>
                    </div>
                </div>
                {(title || description) && (
                    <div className="p-3">
                        {title && <p className="font-medium truncate">{title}</p>}
                        {description && <p className="text-sm text-gray-500 truncate">{description}</p>}
                    </div>
                )}
            </div>

            <Dialog open={open} onOpenChange={setOpen}>
                <DialogContent className="max-w-4xl w-full h-[80vh]">
                    <DialogHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                        <DialogTitle>{title || 'Document PDF'}</DialogTitle>
                        <div className="flex items-center gap-2">
                            <Button variant="ghost" size="icon" asChild>
                                <a href={url} download>
                                    <Download className="h-4 w-4" />
                                </a>
                            </Button>
                            <Button variant="ghost" size="icon" asChild>
                                <a href={url} target="_blank" rel="noreferrer">
                                    <ExternalLink className="h-4 w-4" />
                                </a>
                            </Button>
                        </div>
                    </DialogHeader>
                    <div className="flex-1 overflow-hidden">
                        <PDFViewer url={url} title={title} />
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
}
