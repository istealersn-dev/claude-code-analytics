import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/debug')({
  component: DebugPage,
});

function DebugPage() {
  return (
    <div className="p-8">
      <h1 className="text-3xl font-bold text-white mb-4">Debug Page</h1>
      <p className="text-gray-300">
        If you can see this page, the basic routing and React rendering is working.
      </p>
      <div className="mt-4 p-4 bg-gray-800 rounded">
        <h2 className="text-xl font-semibold text-white mb-2">Status Check</h2>
        <ul className="space-y-2 text-gray-300">
          <li>✅ React is rendering</li>
          <li>✅ TanStack Router is working</li>
          <li>✅ Tailwind CSS is applied</li>
          <li>✅ TypeScript is compiling</li>
        </ul>
      </div>
    </div>
  );
}
