'use client';

import { useState, useCallback, createContext, useContext, ReactNode } from 'react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Loader2, AlertTriangle, CheckCircle, XCircle, Info } from 'lucide-react';

type ConfirmVariant = 'default' | 'destructive' | 'warning' | 'success';

interface ConfirmOptions {
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  onConfirm?: () => Promise<void> | void;
  onCancel?: () => void;
}

interface ConfirmDialogContextValue {
  confirm: (options: ConfirmOptions) => Promise<boolean>;
}

const ConfirmDialogContext = createContext<ConfirmDialogContextValue | null>(null);

/**
 * Hook pour utiliser le dialogue de confirmation
 */
export function useConfirm() {
  const context = useContext(ConfirmDialogContext);
  if (!context) {
    throw new Error('useConfirm doit être utilisé dans un ConfirmDialogProvider');
  }
  return context.confirm;
}

/**
 * Provider pour le système de confirmation
 */
export function ConfirmDialogProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [options, setOptions] = useState<ConfirmOptions | null>(null);
  const [resolvePromise, setResolvePromise] = useState<((value: boolean) => void) | null>(null);

  const confirm = useCallback((opts: ConfirmOptions): Promise<boolean> => {
    setOptions(opts);
    setIsOpen(true);

    return new Promise<boolean>((resolve) => {
      setResolvePromise(() => resolve);
    });
  }, []);

  const handleConfirm = async () => {
    if (!options) return;

    setIsLoading(true);
    try {
      if (options.onConfirm) {
        await options.onConfirm();
      }
      resolvePromise?.(true);
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
      resolvePromise?.(false);
    } finally {
      setIsLoading(false);
      setIsOpen(false);
      setOptions(null);
    }
  };

  const handleCancel = () => {
    options?.onCancel?.();
    resolvePromise?.(false);
    setIsOpen(false);
    setOptions(null);
  };

  const getVariantStyles = (variant: ConfirmVariant = 'default') => {
    switch (variant) {
      case 'destructive':
        return {
          icon: <XCircle className="h-6 w-6 text-red-600" />,
          buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
          buttonClass: 'bg-orange-600 hover:bg-orange-700 text-white',
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
        };
      default:
        return {
          icon: <Info className="h-6 w-6 text-green-600" />,
          buttonClass: 'bg-primary hover:bg-primary/90',
        };
    }
  };

  const variantStyles = getVariantStyles(options?.variant);

  return (
    <ConfirmDialogContext.Provider value={{ confirm }}>
      {children}

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {variantStyles.icon}
              <DialogTitle>{options?.title || 'Confirmation'}</DialogTitle>
            </div>
            <DialogDescription className="pt-2">
              {options?.description || 'Êtes-vous sûr de vouloir continuer ?'}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              {options?.cancelText || 'Annuler'}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={variantStyles.buttonClass}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                options?.confirmText || 'Confirmer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </ConfirmDialogContext.Provider>
  );
}

/**
 * Composant de bouton avec confirmation intégrée
 */
interface ConfirmButtonProps {
  children: ReactNode;
  title: string;
  description: string;
  confirmText?: string;
  cancelText?: string;
  variant?: ConfirmVariant;
  buttonVariant?: 'default' | 'destructive' | 'outline' | 'secondary' | 'ghost' | 'link';
  size?: 'default' | 'sm' | 'lg' | 'icon';
  className?: string;
  disabled?: boolean;
  onConfirm: () => Promise<void> | void;
  onCancel?: () => void;
}

export function ConfirmButton({
  children,
  title,
  description,
  confirmText,
  cancelText,
  variant = 'default',
  buttonVariant = 'default',
  size = 'default',
  className,
  disabled,
  onConfirm,
  onCancel,
}: ConfirmButtonProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = async () => {
    setIsLoading(true);
    try {
      await onConfirm();
      setIsOpen(false);
    } catch (error) {
      console.error('Erreur lors de la confirmation:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleCancel = () => {
    onCancel?.();
    setIsOpen(false);
  };

  const getVariantStyles = () => {
    switch (variant) {
      case 'destructive':
        return {
          icon: <XCircle className="h-6 w-6 text-red-600" />,
          buttonClass: 'bg-red-600 hover:bg-red-700 text-white',
        };
      case 'warning':
        return {
          icon: <AlertTriangle className="h-6 w-6 text-orange-600" />,
          buttonClass: 'bg-orange-600 hover:bg-orange-700 text-white',
        };
      case 'success':
        return {
          icon: <CheckCircle className="h-6 w-6 text-green-600" />,
          buttonClass: 'bg-green-600 hover:bg-green-700 text-white',
        };
      default:
        return {
          icon: <Info className="h-6 w-6 text-green-600" />,
          buttonClass: 'bg-primary hover:bg-primary/90',
        };
    }
  };

  const variantStyles = getVariantStyles();

  return (
    <>
      <Button
        variant={buttonVariant}
        size={size}
        className={className}
        disabled={disabled}
        onClick={() => setIsOpen(true)}
      >
        {children}
      </Button>

      <Dialog open={isOpen} onOpenChange={(open) => !open && handleCancel()}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <div className="flex items-center gap-3">
              {variantStyles.icon}
              <DialogTitle>{title}</DialogTitle>
            </div>
            <DialogDescription className="pt-2">{description}</DialogDescription>
          </DialogHeader>
          <DialogFooter className="gap-2 sm:gap-0">
            <Button variant="outline" onClick={handleCancel} disabled={isLoading}>
              {cancelText || 'Annuler'}
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={isLoading}
              className={variantStyles.buttonClass}
            >
              {isLoading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Traitement...
                </>
              ) : (
                confirmText || 'Confirmer'
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

export default ConfirmButton;

