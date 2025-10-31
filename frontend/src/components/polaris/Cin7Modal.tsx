import React from 'react';
import { Modal as PolarisModal } from '@shopify/polaris';

export type Cin7ModalSize = 'small' | 'medium' | 'large' | 'full';

export interface Cin7ModalAction {
  content: string;
  onAction?: () => void;
  disabled?: boolean;
  destructive?: boolean;
  loading?: boolean;
}

export interface Cin7ModalProps {
  open: boolean;
  onClose: () => void;
  title: string;
  children?: React.ReactNode;
  primaryAction?: Cin7ModalAction;
  secondaryActions?: Cin7ModalAction[];
  size?: Cin7ModalSize;
  loading?: boolean;
  instant?: boolean;
  className?: string;
}

export const Cin7Modal: React.FC<Cin7ModalProps> = ({
  open,
  onClose,
  title,
  children,
  primaryAction,
  secondaryActions,
  size = 'medium',
  loading,
  instant,
  className,
}) => {
  const polarisSize: 'small' | 'large' = size === 'small' ? 'small' : 'large';

  return (
    <div className={className}>
      <PolarisModal
        open={open}
        onClose={onClose}
        title={title}
        primaryAction={primaryAction}
        secondaryActions={secondaryActions}
        size={polarisSize}
        loading={loading}
        instant={instant}
      >
        <PolarisModal.Section>{children}</PolarisModal.Section>
      </PolarisModal>
    </div>
  );
};

Cin7Modal.displayName = 'Cin7Modal';

// Compatibility wrapper components for Radix UI Dialog API
export interface DialogProps {
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  children?: React.ReactNode;
  defaultOpen?: boolean;
  modal?: boolean;
}

export interface DialogContentProps {
  children?: React.ReactNode;
  className?: string;
  onEscapeKeyDown?: (event: KeyboardEvent) => void;
  onPointerDownOutside?: (event: PointerEvent) => void;
  onInteractOutside?: (event: Event) => void;
}

export interface DialogHeaderProps {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogFooterProps {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogTitleProps {
  children?: React.ReactNode;
  className?: string;
}

export interface DialogDescriptionProps {
  children?: React.ReactNode;
  className?: string;
}

// Context to share dialog state between compound components
const DialogContext = React.createContext<{
  open: boolean;
  onOpenChange: (open: boolean) => void;
  title?: React.ReactNode;
  setTitle: (title: React.ReactNode) => void;
  description?: React.ReactNode;
  setDescription: (description: React.ReactNode) => void;
  content?: React.ReactNode;
  setContent: (content: React.ReactNode) => void;
}>({
  open: false,
  onOpenChange: () => {},
  setTitle: () => {},
  setDescription: () => {},
  setContent: () => {},
});

export const Dialog: React.FC<DialogProps> = ({ open, onOpenChange, children, defaultOpen, modal }) => {
  const [internalOpen, setInternalOpen] = React.useState(defaultOpen || false);
  const [title, setTitle] = React.useState<React.ReactNode>();
  const [description, setDescription] = React.useState<React.ReactNode>();
  const [content, setContent] = React.useState<React.ReactNode>();

  const isOpen = open !== undefined ? open : internalOpen;

  const handleOpenChange = (newOpen: boolean) => {
    if (open === undefined) {
      setInternalOpen(newOpen);
    }
    onOpenChange?.(newOpen);
  };

  return (
    <DialogContext.Provider
      value={{
        open: isOpen,
        onOpenChange: handleOpenChange,
        title,
        setTitle,
        description,
        setDescription,
        content,
        setContent,
      }}
    >
      {children}
    </DialogContext.Provider>
  );
};

export const DialogTrigger: React.FC<{ children?: React.ReactNode; asChild?: boolean }> = ({ children, asChild }) => {
  const context = React.useContext(DialogContext);

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as any;
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        context.onOpenChange(true);
        if (childProps.onClick) {
          childProps.onClick(e);
        }
      },
    } as any);
  }

  return <div onClick={() => context.onOpenChange(true)}>{children}</div>;
};

export const DialogPortal: React.FC<{ children?: React.ReactNode }> = ({ children }) => {
  return <>{children}</>;
};

export const DialogOverlay: React.FC<{ className?: string }> = ({ className }) => {
  return null; // Polaris handles the overlay internally
};

export const DialogClose: React.FC<{ children?: React.ReactNode; asChild?: boolean }> = ({ children, asChild }) => {
  const context = React.useContext(DialogContext);

  if (asChild && React.isValidElement(children)) {
    const childProps = children.props as any;
    return React.cloneElement(children, {
      onClick: (e: React.MouseEvent) => {
        context.onOpenChange(false);
        if (childProps.onClick) {
          childProps.onClick(e);
        }
      },
    } as any);
  }

  return <div onClick={() => context.onOpenChange(false)}>{children}</div>;
};

export const DialogContent: React.FC<DialogContentProps> = ({ children, className }) => {
  const context = React.useContext(DialogContext);

  React.useEffect(() => {
    context.setContent(children);
  }, [children, context]);

  // Render the actual Polaris Modal if we have a title
  if (context.open && context.title) {
    return (
      <PolarisModal
        open={context.open}
        onClose={() => context.onOpenChange(false)}
        title={context.title as string}
      >
        <PolarisModal.Section>
          {context.description && <div style={{ marginBottom: '1rem' }}>{context.description}</div>}
          {context.content}
        </PolarisModal.Section>
      </PolarisModal>
    );
  }

  return null;
};

export const DialogHeader: React.FC<DialogHeaderProps> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export const DialogFooter: React.FC<DialogFooterProps> = ({ children, className }) => {
  return <div className={className}>{children}</div>;
};

export const DialogTitle: React.FC<DialogTitleProps> = ({ children, className }) => {
  const context = React.useContext(DialogContext);

  React.useEffect(() => {
    context.setTitle(children);
  }, [children, context]);

  return null;
};

export const DialogDescription: React.FC<DialogDescriptionProps> = ({ children, className }) => {
  const context = React.useContext(DialogContext);

  React.useEffect(() => {
    context.setDescription(children);
  }, [children, context]);

  return null;
};
