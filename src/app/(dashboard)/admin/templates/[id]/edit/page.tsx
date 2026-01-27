'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useParams, useRouter } from 'next/navigation';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { Breadcrumbs } from '@/components/shared/Breadcrumbs';
import { LoadingState } from '@/components/shared/LoadingState';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import {
    Save,
    Eye,
    ZoomIn,
    ZoomOut,
    Trash2,
    Type,
    Calendar,
    QrCode,
    PenTool,
    Layout,
    Move,
    FileText,
    Loader2,
    Grid3X3,
    Magnet,
    ArrowUp,
    ArrowDown,
    ArrowLeft,
    ArrowRight,
    Copy,
} from 'lucide-react';
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from '@/components/ui/select';

interface TemplateField {
    id: string;
    label: string;
    type: 'text' | 'date' | 'qrcode' | 'signature';
    x: number;
    y: number;
    width?: number;
    height?: number;
    fontSize: number;
    fontFamily: string;
    fontWeight: string;
    color: string;
    textAlign: string;
    format?: string;
    prefix?: string;
    suffix?: string;
}

interface TemplateConfig {
    version: number;
    backgroundImage: string;
    pageWidth: number;
    pageHeight: number;
    pageOrientation: string;
    fields: TemplateField[];
    layout?: {
        margeHaut: number;
        margeBas: number;
        margeGauche: number;
        margeDroite: number;
    };
    signaturePosition?: {
        x: number;
        y: number;
        width: number;
        height: number;
    };
    qrCodePosition?: {
        x: number;
        y: number;
        size: number;
    };
}

interface Template {
    id: string;
    nom: string;
    fichierPath: string;
    config: TemplateConfig | null;
}

// Données de test pour la prévisualisation
const SAMPLE_DATA: Record<string, string> = {
    numero: 'MES/IT/DGE/DESP/DAEPU/001/2026',
    civilite: 'M.',
    prenomNom: 'Ibrahim AMADOU',
    dateNaissance: '15 mai 1995',
    lieuNaissance: 'Niamey',
    diplome: 'Licence en Informatique',
    lieuService: "Ministère de l'Éducation",
    dateDebutService: '01/01/2024',
    dateFinService: '31/12/2024',
    dateSignature: '15 janvier 2026',
    nomDirecteur: 'Dr. DOUMA SOUMANA M.C',
    promotion: '2023-2024',
};

const DEFAULT_LAYOUT = {
    margeHaut: 20,
    margeBas: 20,
    margeGauche: 25,
    margeDroite: 25,
};

const DEFAULT_SIGNATURE_POSITION = {
    x: 550,
    y: 450,
    width: 150,
    height: 60,
};

const DEFAULT_QR_POSITION = {
    x: 50,
    y: 450,
    size: 80,
};

export default function TemplateEditorPage() {
    const params = useParams();
    const router = useRouter();
    const canvasRef = useRef<HTMLDivElement>(null);

    const [template, setTemplate] = useState<Template | null>(null);
    const [config, setConfig] = useState<TemplateConfig | null>(null);
    const [availableFields, setAvailableFields] = useState<TemplateField[]>([]);
    const [selectedField, setSelectedField] = useState<string | null>(null);
    const [selectedFields, setSelectedFields] = useState<Set<string>>(new Set());
    const [loading, setLoading] = useState(true);
    const [saving, setSaving] = useState(false);
    const [generatingPreview, setGeneratingPreview] = useState(false);
    const [error, setError] = useState('');
    const [success, setSuccess] = useState('');
    const [zoom, setZoom] = useState(0.8);
    const [dragging, setDragging] = useState<string | null>(null);
    const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
    const [activeTab, setActiveTab] = useState('champ');
    const [showGrid, setShowGrid] = useState(true);
    const [snapToGrid, setSnapToGrid] = useState(true);
    const gridSize = 20; // Taille de la grille en points

    useEffect(() => {
        fetchTemplate();
        fetchAvailableFields();
    }, [params.id]);

    // Gestion des touches clavier pour déplacement et suppression
    useEffect(() => {
        const handleKeyDown = (e: KeyboardEvent) => {
            if (!selectedField || !config) return;

            // Ne pas interférer avec les inputs
            if (e.target instanceof HTMLInputElement || e.target instanceof HTMLTextAreaElement) return;

            // Ctrl+flèche = mouvement précis 1px
            // Shift+flèche = mouvement large 10px
            // Flèche seule = mouvement moyen (grille ou 5px)
            let moveStep: number;
            if (e.ctrlKey || e.metaKey) {
                moveStep = 1; // Mouvement précis
            } else if (e.shiftKey) {
                moveStep = 10; // Mouvement large
            } else {
                moveStep = snapToGrid ? gridSize : 5; // Mouvement normal
            }

            switch (e.key) {
                case 'ArrowUp':
                    e.preventDefault();
                    updateField(selectedField, {
                        y: Math.max(0, (config.fields.find(f => f.id === selectedField)?.y || 0) - moveStep)
                    });
                    break;
                case 'ArrowDown':
                    e.preventDefault();
                    updateField(selectedField, {
                        y: Math.min(config.pageHeight - 20, (config.fields.find(f => f.id === selectedField)?.y || 0) + moveStep)
                    });
                    break;
                case 'ArrowLeft':
                    e.preventDefault();
                    updateField(selectedField, {
                        x: Math.max(0, (config.fields.find(f => f.id === selectedField)?.x || 0) - moveStep)
                    });
                    break;
                case 'ArrowRight':
                    e.preventDefault();
                    updateField(selectedField, {
                        x: Math.min(config.pageWidth - 50, (config.fields.find(f => f.id === selectedField)?.x || 0) + moveStep)
                    });
                    break;
                case 'Delete':
                case 'Backspace':
                    if (!(e.target instanceof HTMLInputElement)) {
                        e.preventDefault();
                        removeField(selectedField);
                    }
                    break;
            }
        };

        window.addEventListener('keydown', handleKeyDown);
        return () => window.removeEventListener('keydown', handleKeyDown);
    }, [selectedField, config, snapToGrid, gridSize]);

    const fetchTemplate = async () => {
        try {
            const response = await fetch(`/api/admin/templates/${params.id}`);
            if (response.ok) {
                const data = await response.json();
                setTemplate(data);
                setConfig(data.config || {
                    version: 1,
                    backgroundImage: data.fichierPath,
                    pageWidth: 842,
                    pageHeight: 595,
                    pageOrientation: 'landscape',
                    fields: [],
                    layout: DEFAULT_LAYOUT,
                    signaturePosition: DEFAULT_SIGNATURE_POSITION,
                    qrCodePosition: DEFAULT_QR_POSITION,
                });
            }
        } catch (err) {
            setError('Erreur lors du chargement');
        } finally {
            setLoading(false);
        }
    };

    const fetchAvailableFields = async () => {
        try {
            const response = await fetch('/api/admin/templates/fields');
            if (response.ok) {
                const data = await response.json();
                setAvailableFields(data);
            }
        } catch (err) {
            console.error('Erreur chargement champs:', err);
        }
    };

    const handleSave = async () => {
        if (!config) return;

        setSaving(true);
        setError('');
        setSuccess('');

        try {
            const response = await fetch(`/api/admin/templates/${params.id}`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config }),
            });

            if (response.ok) {
                setSuccess('Template enregistré avec succès');
            } else {
                const data = await response.json();
                setError(data.error || "Erreur lors de l'enregistrement");
            }
        } catch (err) {
            setError('Erreur de connexion');
        } finally {
            setSaving(false);
        }
    };

    const handlePreviewPDF = async () => {
        if (!config) return;

        setGeneratingPreview(true);
        setError('');

        try {
            const response = await fetch(`/api/admin/templates/${params.id}/preview`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ config }),
            });

            if (response.ok) {
                const blob = await response.blob();
                const url = URL.createObjectURL(blob);
                window.open(url, '_blank');
            } else {
                const data = await response.json();
                setError(data.error || 'Erreur lors de la génération');
            }
        } catch (err) {
            setError('Erreur de connexion');
        } finally {
            setGeneratingPreview(false);
        }
    };

    const addField = (fieldTemplate: TemplateField) => {
        if (!config) return;

        if (config.fields.find((f) => f.id === fieldTemplate.id)) {
            setError(`Le champ "${fieldTemplate.label}" est déjà ajouté`);
            return;
        }

        const newField: TemplateField = {
            ...fieldTemplate,
            x: 100,
            y: 100,
        };

        setConfig({
            ...config,
            fields: [...config.fields, newField],
        });

        setSelectedField(newField.id);
    };

    const removeField = (fieldId: string) => {
        if (!config) return;

        setConfig({
            ...config,
            fields: config.fields.filter((f) => f.id !== fieldId),
        });

        if (selectedField === fieldId) {
            setSelectedField(null);
        }
    };

    const updateField = (fieldId: string, updates: Partial<TemplateField>) => {
        if (!config) return;

        setConfig({
            ...config,
            fields: config.fields.map((f) =>
                f.id === fieldId ? { ...f, ...updates } : f
            ),
        });
    };

    const updateLayout = (updates: Partial<typeof DEFAULT_LAYOUT>) => {
        if (!config) return;
        setConfig({
            ...config,
            layout: { ...config.layout || DEFAULT_LAYOUT, ...updates },
        });
    };

    const updateSignaturePosition = (updates: Partial<typeof DEFAULT_SIGNATURE_POSITION>) => {
        if (!config) return;
        setConfig({
            ...config,
            signaturePosition: { ...config.signaturePosition || DEFAULT_SIGNATURE_POSITION, ...updates },
        });
    };

    const updateQrCodePosition = (updates: Partial<typeof DEFAULT_QR_POSITION>) => {
        if (!config) return;
        setConfig({
            ...config,
            qrCodePosition: { ...config.qrCodePosition || DEFAULT_QR_POSITION, ...updates },
        });
    };

    const handleMouseDown = (e: React.MouseEvent, fieldId: string) => {
        e.preventDefault();
        e.stopPropagation();
        const field = config?.fields.find((f) => f.id === fieldId);
        if (!field || !canvasRef.current) return;

        const rect = canvasRef.current.getBoundingClientRect();
        const mouseX = (e.clientX - rect.left) / zoom;
        const mouseY = (e.clientY - rect.top) / zoom;

        setDragOffset({
            x: mouseX - field.x,
            y: mouseY - field.y,
        });
        setDragging(fieldId);
        setSelectedField(fieldId);
    };

    const handleMouseMove = useCallback(
        (e: React.MouseEvent) => {
            if (!dragging || !config || !canvasRef.current) return;

            const rect = canvasRef.current.getBoundingClientRect();
            let x = Math.max(0, (e.clientX - rect.left) / zoom - dragOffset.x);
            let y = Math.max(0, (e.clientY - rect.top) / zoom - dragOffset.y);

            // Snap to grid si activé
            if (snapToGrid) {
                x = Math.round(x / gridSize) * gridSize;
                y = Math.round(y / gridSize) * gridSize;
            }

            // Limiter aux dimensions de la page
            x = Math.min(x, config.pageWidth - 50);
            y = Math.min(y, config.pageHeight - 20);

            updateField(dragging, { x: Math.round(x), y: Math.round(y) });
        },
        [dragging, zoom, dragOffset, config, snapToGrid, gridSize]
    );

    const handleMouseUp = () => {
        setDragging(null);
    };

    const getFieldIcon = (type: string) => {
        switch (type) {
            case 'date':
                return <Calendar className="h-4 w-4" />;
            case 'qrcode':
                return <QrCode className="h-4 w-4" />;
            case 'signature':
                return <PenTool className="h-4 w-4" />;
            default:
                return <Type className="h-4 w-4" />;
        }
    };

    const selectedFieldData = config?.fields.find((f) => f.id === selectedField);
    const layout = config?.layout || DEFAULT_LAYOUT;
    const signaturePos = config?.signaturePosition || DEFAULT_SIGNATURE_POSITION;
    const qrPos = config?.qrCodePosition || DEFAULT_QR_POSITION;

    if (loading) {
        return (
            <div className="container mx-auto p-6">
                <LoadingState type="page" />
            </div>
        );
    }

    if (!template || !config) {
        return (
            <div className="container mx-auto p-6">
                <Alert variant="destructive">
                    <AlertDescription>Template non trouvé</AlertDescription>
                </Alert>
            </div>
        );
    }

    return (
        <div className="h-screen flex flex-col">
            {/* Header */}
            <div className="border-b bg-white px-2 sm:px-4 lg:px-6 py-2 lg:py-3">
                <div className="flex items-center justify-between flex-wrap gap-2">
                    <div className="flex items-center gap-1 lg:gap-2 flex-wrap">
                        <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.max(0.3, z - 0.1))}>
                            <ZoomOut className="h-4 w-4" />
                        </Button>
                        <span className="text-sm w-16 text-center">{Math.round(zoom * 100)}%</span>
                        <Button variant="outline" size="sm" onClick={() => setZoom((z) => Math.min(2, z + 0.1))}>
                            <ZoomIn className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-6 bg-gray-200 mx-2" />
                        <Button
                            variant={showGrid ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setShowGrid(!showGrid)}
                            title="Afficher/masquer la grille"
                        >
                            <Grid3X3 className="h-4 w-4" />
                        </Button>
                        <Button
                            variant={snapToGrid ? 'default' : 'outline'}
                            size="sm"
                            onClick={() => setSnapToGrid(!snapToGrid)}
                            title="Aimanter à la grille"
                        >
                            <Magnet className="h-4 w-4" />
                        </Button>
                        <div className="w-px h-6 bg-gray-200 mx-2" />
                        <Button
                            variant="outline"
                            onClick={handlePreviewPDF}
                            disabled={generatingPreview}
                        >
                            {generatingPreview ? (
                                <Loader2 className="h-4 w-4 mr-2 animate-spin" />
                            ) : (
                                <Eye className="h-4 w-4 mr-2" />
                            )}
                            Aperçu PDF
                        </Button>
                        <Button variant="outline" onClick={() => router.back()}>
                            Annuler
                        </Button>
                        <Button onClick={handleSave} disabled={saving}>
                            <Save className="h-4 w-4 mr-2" />
                            {saving ? 'Enregistrement...' : 'Enregistrer'}
                        </Button>
                    </div>
                </div>
                {error && (
                    <Alert variant="destructive" className="mt-2">
                        <AlertDescription>{error}</AlertDescription>
                    </Alert>
                )}
                {success && (
                    <Alert className="mt-2 bg-green-50 border-green-200 text-green-800">
                        <AlertDescription>{success}</AlertDescription>
                    </Alert>
                )}
            </div>

            {/* Main content */}
            <div className="flex-1 flex overflow-hidden">
                {/* Palette des champs */}
                <div className="w-40 lg:w-56 border-r bg-gray-50 p-2 lg:p-3 overflow-y-auto hidden md:block">
                    <h3 className="font-semibold mb-2 text-sm">Champs disponibles</h3>
                    <p className="text-xs text-gray-500 mb-2">
                        Cliquez pour ajouter un champ
                    </p>
                    <div className="space-y-2">
                        {availableFields.map((field) => {
                            const isAdded = config.fields.some((f) => f.id === field.id);
                            return (
                                <button
                                    key={field.id}
                                    onClick={() => !isAdded && addField(field as TemplateField)}
                                    disabled={isAdded}
                                    className={`w-full flex items-center gap-2 p-2 rounded-lg text-left text-sm transition ${isAdded
                                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                                        : 'bg-white hover:bg-blue-50 border hover:border-blue-300'
                                        }`}
                                >
                                    {getFieldIcon(field.type)}
                                    <span className="flex-1 truncate">{field.label}</span>
                                    {isAdded && <span className="text-xs">✓</span>}
                                </button>
                            );
                        })}
                    </div>
                </div>

                {/* Canvas */}
                <div
                    className="flex-1 overflow-auto bg-gray-200 p-2 lg:p-8"
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                >
                    <div
                        ref={canvasRef}
                        className="relative bg-white shadow-xl mx-auto"
                        style={{
                            width: config.pageWidth * zoom,
                            height: config.pageHeight * zoom,
                            backgroundImage: `url(${config.backgroundImage})`,
                            backgroundSize: 'contain',
                            backgroundRepeat: 'no-repeat',
                            backgroundPosition: 'center',
                        }}
                    >
                        {/* Grille de positionnement */}
                        {showGrid && (
                            <svg
                                className="absolute inset-0 pointer-events-none"
                                width={config.pageWidth * zoom}
                                height={config.pageHeight * zoom}
                            >
                                <defs>
                                    <pattern
                                        id="grid"
                                        width={gridSize * zoom}
                                        height={gridSize * zoom}
                                        patternUnits="userSpaceOnUse"
                                    >
                                        <path
                                            d={`M ${gridSize * zoom} 0 L 0 0 0 ${gridSize * zoom}`}
                                            fill="none"
                                            stroke="rgba(59, 130, 246, 0.3)"
                                            strokeWidth="0.5"
                                        />
                                    </pattern>
                                    {/* Pattern pour les lignes majeures (tous les 100px) */}
                                    <pattern
                                        id="gridMajor"
                                        width={100 * zoom}
                                        height={100 * zoom}
                                        patternUnits="userSpaceOnUse"
                                    >
                                        <path
                                            d={`M ${100 * zoom} 0 L 0 0 0 ${100 * zoom}`}
                                            fill="none"
                                            stroke="rgba(59, 130, 246, 0.5)"
                                            strokeWidth="1"
                                        />
                                    </pattern>
                                </defs>
                                <rect width="100%" height="100%" fill="url(#grid)" />
                                <rect width="100%" height="100%" fill="url(#gridMajor)" />
                            </svg>
                        )}

                        {/* Champs placés */}
                        {config.fields.map((field) => (
                            <div
                                key={field.id}
                                className={`absolute cursor-move group ${selectedField === field.id ? 'ring-2 ring-blue-500' : ''
                                    }`}
                                style={{
                                    left: field.x * zoom,
                                    top: field.y * zoom,
                                    fontSize: field.fontSize * zoom,
                                    fontFamily: field.fontFamily,
                                    fontWeight: field.fontWeight === 'bold' ? 'bold' : 'normal',
                                    color: field.color,
                                    textAlign: field.textAlign as any,
                                    width: field.width ? field.width * zoom : 'auto',
                                    height: field.height ? field.height * zoom : 'auto',
                                }}
                                onMouseDown={(e) => handleMouseDown(e, field.id)}
                            >
                                <div className="bg-yellow-100/80 px-1 py-0.5 rounded">
                                    {field.type === 'qrcode' ? (
                                        <div
                                            className="bg-gray-300 flex items-center justify-center"
                                            style={{
                                                width: (field.width || 80) * zoom,
                                                height: (field.height || 80) * zoom,
                                            }}
                                        >
                                            <QrCode className="text-gray-500" style={{ width: 40 * zoom, height: 40 * zoom }} />
                                        </div>
                                    ) : field.type === 'signature' ? (
                                        <div
                                            className="bg-gray-200 flex items-center justify-center border-b-2 border-gray-400"
                                            style={{
                                                width: (field.width || 150) * zoom,
                                                height: (field.height || 60) * zoom,
                                            }}
                                        >
                                            <span className="text-gray-400 text-xs">Signature</span>
                                        </div>
                                    ) : (
                                        <span>
                                            {field.prefix || ''}
                                            {SAMPLE_DATA[field.id] || `[${field.label}]`}
                                            {field.suffix || ''}
                                        </span>
                                    )}
                                </div>
                                {/* Handle de suppression */}
                                <button
                                    onClick={(e) => {
                                        e.stopPropagation();
                                        removeField(field.id);
                                    }}
                                    className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 opacity-0 group-hover:opacity-100 transition"
                                >
                                    <Trash2 className="h-3 w-3" />
                                </button>
                            </div>
                        ))}

                        {/* Les indicateurs QR Code et Signature ont été supprimés.
                            Les positions sont configurables via l'onglet "Positions" du panneau de droite */}
                    </div>
                </div>

                {/* Panel de propriétés avec onglets */}
                <div className="w-56 lg:w-72 border-l bg-white overflow-y-auto">
                    <Tabs value={activeTab} onValueChange={setActiveTab} className="h-full flex flex-col">
                        <TabsList className="w-full grid grid-cols-3 p-0.5 m-1">
                            <TabsTrigger value="champ" className="text-[10px] lg:text-xs px-1 lg:px-2">
                                <Type className="h-3 w-3 mr-0.5 lg:mr-1" />
                                <span className="hidden sm:inline">Champ</span>
                            </TabsTrigger>
                            <TabsTrigger value="layout" className="text-[10px] lg:text-xs px-1 lg:px-2">
                                <Layout className="h-3 w-3 mr-0.5 lg:mr-1" />
                                <span className="hidden sm:inline">Layout</span>
                            </TabsTrigger>
                            <TabsTrigger value="positions" className="text-[10px] lg:text-xs px-1 lg:px-2">
                                <Move className="h-3 w-3 mr-0.5 lg:mr-1" />
                                <span className="hidden sm:inline">Pos.</span>
                            </TabsTrigger>
                        </TabsList>

                        {/* Onglet Champ */}
                        <TabsContent value="champ" className="flex-1 p-2 lg:p-3 overflow-y-auto">
                            <h3 className="font-semibold mb-2 text-sm">Propriétés du champ</h3>
                            {selectedFieldData ? (
                                <div className="space-y-4">
                                    <p className="text-sm text-gray-500">{selectedFieldData.label}</p>

                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs">X</Label>
                                            <Input
                                                type="number"
                                                value={selectedFieldData.x}
                                                onChange={(e) =>
                                                    updateField(selectedFieldData.id, { x: parseInt(e.target.value) || 0 })
                                                }
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Y</Label>
                                            <Input
                                                type="number"
                                                value={selectedFieldData.y}
                                                onChange={(e) =>
                                                    updateField(selectedFieldData.id, { y: parseInt(e.target.value) || 0 })
                                                }
                                            />
                                        </div>
                                    </div>

                                    {/* Boutons de positionnement précis */}
                                    <div className="bg-gray-50 rounded-lg p-3">
                                        <Label className="text-xs mb-2 block text-gray-600">Déplacement fin</Label>
                                        <div className="flex items-center justify-center gap-1">
                                            <div className="flex flex-col items-center gap-1">
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => updateField(selectedFieldData.id, { y: Math.max(0, selectedFieldData.y - (snapToGrid ? gridSize : 1)) })}
                                                    title="Monter (↑)"
                                                >
                                                    <ArrowUp className="h-4 w-4" />
                                                </Button>
                                                <div className="flex gap-1">
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => updateField(selectedFieldData.id, { x: Math.max(0, selectedFieldData.x - (snapToGrid ? gridSize : 1)) })}
                                                        title="Gauche (←)"
                                                    >
                                                        <ArrowLeft className="h-4 w-4" />
                                                    </Button>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-8 w-8 p-0"
                                                        onClick={() => updateField(selectedFieldData.id, { x: Math.min(config.pageWidth - 50, selectedFieldData.x + (snapToGrid ? gridSize : 1)) })}
                                                        title="Droite (→)"
                                                    >
                                                        <ArrowRight className="h-4 w-4" />
                                                    </Button>
                                                </div>
                                                <Button
                                                    variant="outline"
                                                    size="sm"
                                                    className="h-8 w-8 p-0"
                                                    onClick={() => updateField(selectedFieldData.id, { y: Math.min(config.pageHeight - 20, selectedFieldData.y + (snapToGrid ? gridSize : 1)) })}
                                                    title="Descendre (↓)"
                                                >
                                                    <ArrowDown className="h-4 w-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <p className="text-xs text-gray-500 text-center mt-2">
                                            Utilisez les flèches clavier ou Shift+flèches pour déplacement ×10
                                        </p>
                                    </div>

                                    {selectedFieldData.type === 'text' || selectedFieldData.type === 'date' ? (
                                        <>
                                            <div>
                                                <Label className="text-xs">Taille police</Label>
                                                <Input
                                                    type="number"
                                                    min={8}
                                                    max={48}
                                                    value={selectedFieldData.fontSize}
                                                    onChange={(e) =>
                                                        updateField(selectedFieldData.id, { fontSize: parseInt(e.target.value) || 12 })
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs">Police</Label>
                                                <Select
                                                    value={selectedFieldData.fontFamily}
                                                    onValueChange={(value) =>
                                                        updateField(selectedFieldData.id, { fontFamily: value })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="Helvetica">Helvetica</SelectItem>
                                                        <SelectItem value="Times">Times</SelectItem>
                                                        <SelectItem value="Courier">Courier</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label className="text-xs">Graisse</Label>
                                                <Select
                                                    value={selectedFieldData.fontWeight}
                                                    onValueChange={(value) =>
                                                        updateField(selectedFieldData.id, { fontWeight: value })
                                                    }
                                                >
                                                    <SelectTrigger>
                                                        <SelectValue />
                                                    </SelectTrigger>
                                                    <SelectContent>
                                                        <SelectItem value="normal">Normal</SelectItem>
                                                        <SelectItem value="bold">Gras</SelectItem>
                                                    </SelectContent>
                                                </Select>
                                            </div>

                                            <div>
                                                <Label className="text-xs">Couleur</Label>
                                                <Input
                                                    type="color"
                                                    value={selectedFieldData.color}
                                                    onChange={(e) =>
                                                        updateField(selectedFieldData.id, { color: e.target.value })
                                                    }
                                                />
                                            </div>

                                            <div>
                                                <Label className="text-xs">Préfixe</Label>
                                                <Input
                                                    value={selectedFieldData.prefix || ''}
                                                    onChange={(e) =>
                                                        updateField(selectedFieldData.id, { prefix: e.target.value })
                                                    }
                                                    placeholder="Ex: Né(e) le "
                                                />
                                            </div>
                                        </>
                                    ) : (
                                        <div className="grid grid-cols-2 gap-2">
                                            <div>
                                                <Label className="text-xs">Largeur</Label>
                                                <Input
                                                    type="number"
                                                    value={selectedFieldData.width || 80}
                                                    onChange={(e) =>
                                                        updateField(selectedFieldData.id, { width: parseInt(e.target.value) || 80 })
                                                    }
                                                />
                                            </div>
                                            <div>
                                                <Label className="text-xs">Hauteur</Label>
                                                <Input
                                                    type="number"
                                                    value={selectedFieldData.height || 80}
                                                    onChange={(e) =>
                                                        updateField(selectedFieldData.id, { height: parseInt(e.target.value) || 80 })
                                                    }
                                                />
                                            </div>
                                        </div>
                                    )}

                                    <Button
                                        variant="destructive"
                                        size="sm"
                                        className="w-full"
                                        onClick={() => removeField(selectedFieldData.id)}
                                    >
                                        <Trash2 className="h-4 w-4 mr-2" />
                                        Supprimer ce champ
                                    </Button>
                                </div>
                            ) : (
                                <p className="text-sm text-gray-500">
                                    Sélectionnez un champ pour modifier ses propriétés
                                </p>
                            )}
                        </TabsContent>

                        {/* Onglet Layout */}
                        <TabsContent value="layout" className="flex-1 p-2 lg:p-3 overflow-y-auto">
                            <h3 className="font-semibold mb-2 text-sm">Mise en page</h3>

                            <Card className="mb-4">
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Marges (mm)</CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs">Haut</Label>
                                            <Input
                                                type="number"
                                                value={layout.margeHaut}
                                                onChange={(e) => updateLayout({ margeHaut: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Bas</Label>
                                            <Input
                                                type="number"
                                                value={layout.margeBas}
                                                onChange={(e) => updateLayout({ margeBas: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Gauche</Label>
                                            <Input
                                                type="number"
                                                value={layout.margeGauche}
                                                onChange={(e) => updateLayout({ margeGauche: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Droite</Label>
                                            <Input
                                                type="number"
                                                value={layout.margeDroite}
                                                onChange={(e) => updateLayout({ margeDroite: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card>
                                <CardHeader className="pb-2">
                                    <CardTitle className="text-sm">Orientation</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <Select
                                        value={config.pageOrientation}
                                        onValueChange={(value) => setConfig({ ...config, pageOrientation: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="landscape">Paysage (A4)</SelectItem>
                                            <SelectItem value="portrait">Portrait (A4)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </CardContent>
                            </Card>
                        </TabsContent>

                        {/* Onglet Positions */}
                        <TabsContent value="positions" className="flex-1 p-2 lg:p-3 overflow-y-auto">
                            <h3 className="font-semibold mb-2 text-sm">Positions fixes</h3>
                            <p className="text-xs text-gray-500 mb-2">
                                Ces positions sont utilisées lors de la signature électronique
                            </p>

                            <Card className="mb-4 border-orange-200">
                                <CardHeader className="pb-2 bg-orange-50">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <PenTool className="h-4 w-4 text-orange-600" />
                                        Signature
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs">Position X</Label>
                                            <Input
                                                type="number"
                                                value={signaturePos.x}
                                                onChange={(e) => updateSignaturePosition({ x: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Position Y</Label>
                                            <Input
                                                type="number"
                                                value={signaturePos.y}
                                                onChange={(e) => updateSignaturePosition({ y: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Largeur</Label>
                                            <Input
                                                type="number"
                                                value={signaturePos.width}
                                                onChange={(e) => updateSignaturePosition({ width: parseInt(e.target.value) || 150 })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Hauteur</Label>
                                            <Input
                                                type="number"
                                                value={signaturePos.height}
                                                onChange={(e) => updateSignaturePosition({ height: parseInt(e.target.value) || 60 })}
                                            />
                                        </div>
                                    </div>
                                </CardContent>
                            </Card>

                            <Card className="border-purple-200">
                                <CardHeader className="pb-2 bg-purple-50">
                                    <CardTitle className="text-sm flex items-center gap-2">
                                        <QrCode className="h-4 w-4 text-purple-600" />
                                        QR Code
                                    </CardTitle>
                                </CardHeader>
                                <CardContent className="space-y-3 pt-3">
                                    <div className="grid grid-cols-2 gap-2">
                                        <div>
                                            <Label className="text-xs">Position X</Label>
                                            <Input
                                                type="number"
                                                value={qrPos.x}
                                                onChange={(e) => updateQrCodePosition({ x: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                        <div>
                                            <Label className="text-xs">Position Y</Label>
                                            <Input
                                                type="number"
                                                value={qrPos.y}
                                                onChange={(e) => updateQrCodePosition({ y: parseInt(e.target.value) || 0 })}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <Label className="text-xs">Taille</Label>
                                        <Input
                                            type="number"
                                            value={qrPos.size}
                                            onChange={(e) => updateQrCodePosition({ size: parseInt(e.target.value) || 80 })}
                                        />
                                    </div>
                                </CardContent>
                            </Card>
                        </TabsContent>
                    </Tabs>
                </div>
            </div>
        </div>
    );
}
