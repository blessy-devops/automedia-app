import Link from "next/link";
import { RainbowButton } from "@/components/ui/rainbow-button";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background">
      <div className="container flex flex-col items-center justify-center gap-12 px-4 py-16">
        <h1 className="text-5xl font-extrabold tracking-tight text-foreground sm:text-[5rem]">
          Vamo ficar rico porraaaaa
        </h1>
        <Link href="/benchmark/channels">
          <RainbowButton>Acessar Automedia</RainbowButton>
        </Link>
      </div>
    </main>
  );
}
