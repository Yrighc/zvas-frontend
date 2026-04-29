import type { ComponentProps, ReactNode } from "react";

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
  size?: ComponentProps<typeof Drawer>["size"];
  scrollBehavior?: ComponentProps<typeof Drawer>["scrollBehavior"];
  drawerClassNames?: ComponentProps<typeof Drawer>["classNames"];
  headerClassName?: string;
  bodyClassName?: string;
  footerClassName?: string;
  closeLabel?: string;
  onClose: () => void;
}

export function DetailSidePanel({
  isOpen,
  title,
  description,
  children,
  footer,
  size = "lg",
  scrollBehavior = "inside",
  drawerClassNames,
  headerClassName = "",
  bodyClassName = "",
  footerClassName = "",
  closeLabel = "关闭",
  onClose,
}: DetailSidePanelProps) {
  const defaultCloseButton = (
    <Button
      size="sm"
      variant="flat"
      className="rounded-xl bg-white/5 font-bold text-white hover:bg-white/10"
      onPress={onClose}
    >
      {closeLabel}
    </Button>
  );

  return (
    <Drawer
      isOpen={isOpen}
      onOpenChange={(open) => !open && onClose()}
      placement="right"
      backdrop="blur"
      size={size}
      scrollBehavior={scrollBehavior}
      classNames={drawerClassNames}
    >
      <DrawerContent>
        <>
          <DrawerHeader className={`flex flex-col gap-2 border-b border-white/8 ${headerClassName}`.trim()}>
            <h2 className="text-lg font-bold text-white">{title}</h2>
            {description ? <p className="text-sm text-apple-text-tertiary">{description}</p> : null}
          </DrawerHeader>
          <DrawerBody className={`space-y-6 overflow-y-auto bg-[#09111d] ${bodyClassName}`.trim()}>
            {children}
          </DrawerBody>
          <DrawerFooter className={`border-t border-white/8 bg-[#0b1220] ${footerClassName}`.trim()}>
            {footer ?? defaultCloseButton}
          </DrawerFooter>
        </>
      </DrawerContent>
    </Drawer>
  );
}
