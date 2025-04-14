import { clsx, type ClassValue } from "clsx";
import { Doc } from "convex/_generated/dataModel";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

export const createTableBody = (
  events: { name: string; fee: number; room: string }[],
) => `<tbody>
${events.map((event, index) => `<tr style="background-color:#fafafa"><td style="padding:12px;border-bottom:1px solid #eee;text-align:left">${index + 1}</td><td style="padding:12px;border-bottom:1px solid #eee;text-align:left">${event.name}</td><td style="padding:12px;border-bottom:1px solid #eee;text-align:left">₹${event.fee}</td><td style="padding:12px;border-bottom:1px solid #eee;text-align:left">${event.room}</td></tr><tr style="background-color:#fafafa">`).join("")}
</tbody>`;

export function getSettingValue(
  settings: Doc<"setting">[] | undefined,
  key: string,
) {
  if (!settings) return undefined;
  const setting = settings.find((s) => s.name === key);
  return setting?.value;
}
