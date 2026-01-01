import * as React from "react"

const Dialog = ({ children, open, onOpenChange }: {
  children: React.ReactNode;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div 
        className="fixed inset-0 bg-black/50" 
        onClick={() => onOpenChange(false)}
      />
      <div className="relative z-50 bg-background rounded-lg shadow-lg max-w-md w-full mx-4">
        {children}
      </div>
    </div>
  );
};

const DialogContent = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={`p-6 ${className || ''}`}>{children}</div>;
};

const DialogHeader = ({ children }: { children: React.ReactNode }) => {
  return <div className="space-y-2">{children}</div>;
};

const DialogTitle = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <h2 className={`text-lg font-semibold ${className || ''}`}>{children}</h2>;
};

const DialogDescription = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <p className={`text-sm text-muted-foreground ${className || ''}`}>{children}</p>;
};

const DialogFooter = ({ children, className }: { children: React.ReactNode; className?: string }) => {
  return <div className={`flex justify-end gap-2 mt-6 ${className || ''}`}>{children}</div>;
};

export { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription, DialogFooter };
