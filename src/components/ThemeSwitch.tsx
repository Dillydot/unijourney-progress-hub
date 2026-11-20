import { useEffect, useState } from "react";
import { Switch } from "@/components/ui/switch";

export const themeStorageKey = "unijourney:theme";

export function ThemeSwitch({ label }: { label: string }) {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    setDark(document.documentElement.classList.contains("dark"));
  }, []);

  function changeTheme(checked: boolean) {
    document.documentElement.classList.toggle("dark", checked);
    setDark(checked);
    try {
      localStorage.setItem(themeStorageKey, checked ? "dark" : "light");
    } catch {
      // The chosen theme still applies when browser storage is unavailable.
    }
  }

  return (
    <label className="flex min-h-11 shrink-0 cursor-pointer items-center px-2">
      <span className="sr-only">{label}</span>
      <Switch checked={dark} onCheckedChange={changeTheme} />
    </label>
  );
}
