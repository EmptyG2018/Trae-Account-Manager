import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Info } from "lucide-react";

interface InfoModalProps {
  isOpen: boolean;
  title: string;
  icon?: string;
  sections: {
    title?: string;
    content: string;
    type?: "text" | "code" | "list";
  }[];
  confirmText?: string;
  onConfirm: () => void;
  onCancel: () => void;
}

export function InfoModal({
  isOpen,
  title,
  sections,
  confirmText = "确定",
  onConfirm,
  onCancel,
}: InfoModalProps) {
  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onCancel()}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <div className="flex items-center gap-2">
            <Info className="h-5 w-5 text-muted-foreground" />
            <DialogTitle>{title}</DialogTitle>
          </div>
        </DialogHeader>

        <div className="space-y-4">
          {sections.map((section, index) => (
            <div key={index} className="space-y-1.5">
              {section.title && (
                <h4 className="text-sm font-medium">{section.title}</h4>
              )}
              {section.type === "code" ? (
                <pre className="overflow-x-auto rounded-lg bg-muted p-3 text-xs">
                  <code>{section.content}</code>
                </pre>
              ) : section.type === "list" ? (
                <div
                  className="text-sm text-muted-foreground [&_li]:ml-4 [&_li]:list-disc [&_ol]:space-y-1 [&_ul]:space-y-1"
                  dangerouslySetInnerHTML={{ __html: section.content }}
                />
              ) : (
                <p className="text-sm text-muted-foreground">{section.content}</p>
              )}
            </div>
          ))}
        </div>

        <DialogFooter>
          <DialogClose render={<Button variant="outline" onClick={onCancel} />}>
            取消
          </DialogClose>
          <Button onClick={onConfirm}>{confirmText}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
