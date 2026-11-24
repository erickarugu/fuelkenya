import Link from "next/link";
import { slugifyTown } from "@/lib/api";

// Major towns by population and traffic. Linking them from every page gives
// the /town/ pages internal links, which they otherwise only get from the
// sitemap and the All Towns index.
const LINKED_TOWNS = [
  "Nairobi",
  "Mombasa",
  "Kisumu",
  "Nakuru",
  "Eldoret",
  "Thika",
  "Machakos",
  "Nyeri",
  "Meru",
  "Kakamega",
  "Kisii",
  "Kericho",
  "Naivasha",
  "Nanyuki",
  "Malindi",
  "Kitale",
  "Embu",
  "Garissa",
  "Bungoma",
  "Narok",
  "Kitui",
  "Voi",
  "Lodwar",
  "Mandera"
];

interface TownLinksProps {
  towns: string[];
  currentTown?: string;
}

export default function TownLinks({ towns, currentTown }: TownLinksProps) {
  const available = new Map(towns.map((t) => [t.toLowerCase(), t]));
  const current = currentTown?.toLowerCase();
  const links = LINKED_TOWNS.map((t) => available.get(t.toLowerCase()))
    .filter((t): t is string => Boolean(t))
    .filter((t) => t.toLowerCase() !== current);

  if (links.length === 0) return null;

  return (
    <nav aria-label="Fuel prices by town" className="flex flex-wrap gap-2">
      {links.map((town) => (
        <Link
          key={town}
          href={`/town/${slugifyTown(town)}`}
          className="rounded-full border border-black/[0.08] dark:border-white/[0.07] bg-black/[0.02] dark:bg-white/[0.02] px-3 py-1 text-xs font-medium text-stone-600 dark:text-stone-400 transition-colors hover:border-black/[0.14] dark:hover:border-white/15 hover:text-stone-900 dark:hover:text-stone-200"
        >
          {town} fuel prices
        </Link>
      ))}
      <Link
        href="/towns"
        className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-semibold text-emerald-700 dark:text-emerald-300 transition-colors hover:bg-emerald-500/15"
      >
        All {towns.length} towns →
      </Link>
    </nav>
  );
}
