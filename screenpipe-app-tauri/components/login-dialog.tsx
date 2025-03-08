import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { ExternalLinkIcon } from "lucide-react";
import { open as openUrl } from "@tauri-apps/plugin-shell";
import { create } from "zustand";

export function LoginDialog() {
  const { isOpen, setIsOpen } = useLoginDialog();

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="text-xl font-medium">Login required</DialogTitle>
          <DialogDescription className="text-zinc-500 dark:text-zinc-400">
            Please login to continue using ScreenPipe
          </DialogDescription>
        </DialogHeader>
        <div className="flex justify-end mt-4">
          <Button
            variant="default"
            className="bg-[#e25822] hover:bg-[#d24812] text-white transition-colors"
            onClick={() => {
              openUrl("https://screenpi.pe/login");
              setIsOpen(false);
            }}
          >
            Login <ExternalLinkIcon className="w-4 h-4 ml-2" />
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}

interface LoginDialogState {
  isOpen: boolean;
  setIsOpen: (open: boolean) => void;
  checkLogin: (user: any | null, showDialog?: boolean) => boolean;
}

export const useLoginDialog = create<LoginDialogState>((set) => ({
  isOpen: false,
  setIsOpen: (open) => set({ isOpen: open }),
  checkLogin: (user, showDialog = true) => {
    if (!user?.token) {
      if (showDialog) {
        set({ isOpen: true });
      }
      return false;
    }
    return true;
  },
}));
