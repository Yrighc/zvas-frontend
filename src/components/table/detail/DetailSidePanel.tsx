import type { ReactNode } from "react";

import {
  Button,
  Drawer,
  DrawerBody,
  DrawerContent,
  DrawerFooter,
  DrawerHeader,
} from "@heroui/react";

interface DetailSidePanelProps {
  isOpen: boolean;
  title: string;
  description?: ReactNode;
  children: ReactNode;
  footer?: ReactNode;
  onClose: () => void;
}

export function DetailSidePanel({
  isOpen,
  title,
  description,
  children,
  footer,
  onClose,
}: DetailSidePanelProps) {
  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      placement="right"
      backdrop="blur"
      size="lg"
    >
      <DrawerContent>
        <>
          <DrawerHeader className="flex flex-col gap-2 border-b border-white/8">
            <h2 className="text-lg font-bold text-white">{title}</h2>
            {description ? <p className="text-sm text-apple-text-tertiary">{description}</p> : null}
          </DrawerHeader>
          <DrawerBody className="space-y-6 overflow-y-auto bg-[#09111d]">{children}</DrawerBody>
          <DrawerFooter className="border-t border-white/8 bg-[#0b1220]">
            {footer}
            <Button
              size="sm"
              variant="flat"
              className="rounded-xl bg-white/5 font-bold text-white hover:bg-white/10"
              onPress={onClose}
            >
              关闭
            </Button>
          </DrawerFooter>
        </>
      </DrawerContent>
    </Drawer>
  );
}
