import { Link } from "react-router";

export default function Home() {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen p-4">
      <h1 className="text-4xl font-bold mb-4">BestSeller Author Pro</h1>
      <p className="text-lg mb-8">AI-Powered Book Creation Platform</p>
      <div className="flex gap-4">
        <Link 
          to="/brainstorm" 
          className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
        >
          Start Brainstorming
        </Link>
        <Link 
          to="/builder" 
          className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700"
        >
          Book Builder
        </Link>
      </div>
    </div>
  );
}
