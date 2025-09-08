import Profile from "./profile";
import { ThemeToggle } from "./theme-toggle";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Button } from "./ui/button";

export default function TopNav() {
  return (
    <nav className="px-3 sm:px-6 flex items-center justify-between bg-white dark:bg-[#0F0F12] border-b border-gray-200 dark:border-[#1F1F23] h-full">
      <a href="/">
        <span className="text-lg font-semibold hover:cursor-pointer text-black dark:text-white">
          BSCS 4B
        </span>
      </a>

      <div className="flex items-center gap-2 sm:gap-4 ml-auto sm:ml-0">
        <ThemeToggle />

        {false ? (
          <DropdownMenu>
            <DropdownMenuTrigger className="focus:outline-none">
              <img
                src="https://ferf1mheo22r9ira.public.blob.vercel-storage.com/avatar-01-n0x8HFv8EUetf9z6ht0wScJKoTHqf8.png"
                alt="User avatar"
                width={28}
                height={28}
                className="rounded-full ring-2 ring-gray-200 dark:ring-[#2B2B30] sm:w-8 sm:h-8 cursor-pointer"
              />
            </DropdownMenuTrigger>
            <DropdownMenuContent
              align="end"
              sideOffset={8}
              className="w-[280px] sm:w-80 bg-background border-border rounded-lg shadow-lg"
            >
              <Profile avatar="https://ferf1mheo22r9ira.public.blob.vercel-storage.com/avatar-01-n0x8HFv8EUetf9z6ht0wScJKoTHqf8.png" />
            </DropdownMenuContent>
          </DropdownMenu>
        ) : (
          <Button className="bg-primary text-primary-foreground shadow-xs hover:bg-primary/90 cursor-pointer">
            Connect Wallet
          </Button>
        )}
      </div>
    </nav>
  );
}
