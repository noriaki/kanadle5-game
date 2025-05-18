import { GameBoard } from "@/components";

export default function Home() {
  return (
    <div className="grid grid-rows-[auto_1fr_auto] items-center justify-items-center min-h-screen p-4 pb-8 gap-8 sm:p-8 font-[family-name:var(--font-geist-sans)]">
      <header className="w-full text-center py-4">
        <h1 className="text-3xl font-bold">Kanadle5</h1>
      </header>
      <main className="flex flex-col items-center justify-center w-full">
        <GameBoard />
      </main>
      <footer className="row-start-3 flex gap-[24px] flex-wrap items-center justify-center p-4 text-sm text-gray-500">
        <p>© 2025 Kanadle5 Game</p>
      </footer>
    </div>
  );
}
