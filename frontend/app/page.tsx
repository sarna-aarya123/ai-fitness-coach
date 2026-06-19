import Link from "next/link";

export default function Home() {
  return (
    <main className="p-6">
      <h1 className="text-2xl font-bold mb-4">AI Fitness Coach</h1>
      <Link href="/weight" className="text-blue-600 hover:underline">
        Weight Log
      </Link>
    </main>
  );
}
