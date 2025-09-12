"use client";

export default function Home() {
  return (
    <main className="container mx-auto px-4 py-8 text-red-500">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">
            Full-Stack GraphQL App
          </h1>
          <p className="text-lg text-gray-600 mb-6">
            Built with Next.js, Apollo Server, MongoDB, and TypeScript
          </p>
        </div>
      </div>
    </main>
  );
}
