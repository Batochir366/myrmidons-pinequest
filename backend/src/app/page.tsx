export default function Home() {
  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <h1 className="text-4xl font-bold text-gray-800 mb-4">
          GraphQL Backend API
        </h1>
        <p className="text-lg text-gray-600 mb-8">
          Your GraphQL API is running successfully!
        </p>
        <div className="space-y-2">
          <p className="text-sm text-gray-500">
            <strong>GraphQL Endpoint:</strong> <code>/api</code>
          </p>
          <p className="text-sm text-gray-500">
            <strong>Port:</strong> 4000
          </p>
        </div>
      </div>
    </div>
  );
}
