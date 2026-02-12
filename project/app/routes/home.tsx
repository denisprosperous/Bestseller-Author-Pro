import { Link } from "react-router";
import { BookOpen, Lightbulb, FileEdit, Mic, Palette } from "lucide-react";

export default function Home() {
  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Hero Section */}
      <div className="flex flex-col items-center justify-center pt-20 pb-16 px-4 text-center max-w-4xl mx-auto">
        <h1 className="text-4xl font-bold mb-6 text-slate-900 leading-tight">
          Create Professional Content That Sells
        </h1>
        <h2 className="text-2xl font-semibold mb-6 text-slate-700">
          Your Complete Multi-Format Publishing Platform
        </h2>
        <p className="text-lg mb-10 text-slate-600 max-w-2xl">
          Transform your ideas into professional, KDP-compliant ebooks, audiobooks, and illustrated children's books. 
          Brainstorm concepts, generate outlines, write complete chapters, and export in multiple formats—all in one powerful platform.
        </p>
        
        <div className="flex flex-wrap gap-4 justify-center">
          <Link 
            to="/brainstorm" 
            className="px-8 py-4 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium shadow-lg hover:shadow-xl transition-all flex items-center gap-2"
          >
            <Lightbulb className="w-5 h-5" />
            Start Brainstorming
          </Link>
          <Link 
            to="/builder" 
            className="px-8 py-4 bg-white text-slate-700 border border-slate-200 rounded-lg hover:bg-slate-50 font-medium shadow-sm hover:shadow-md transition-all flex items-center gap-2"
          >
            <FileEdit className="w-5 h-5" />
            Book Builder
          </Link>
        </div>
      </div>

      {/* Feature Grid */}
      <div className="max-w-6xl mx-auto px-4 py-16 grid md:grid-cols-3 gap-8">
        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mb-6 text-blue-600">
            <FileEdit className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-900">Professional Ebooks</h3>
          <p className="text-slate-600">
            Generate comprehensive, well-structured ebooks ready for Kindle Direct Publishing.
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-6 text-purple-600">
            <Mic className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-900">Audiobooks</h3>
          <p className="text-slate-600">
            Convert your content into high-quality audiobooks with natural-sounding AI narration.
          </p>
        </div>

        <div className="bg-white p-8 rounded-xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
          <div className="w-12 h-12 bg-pink-100 rounded-lg flex items-center justify-center mb-6 text-pink-600">
            <Palette className="w-6 h-6" />
          </div>
          <h3 className="text-xl font-bold mb-3 text-slate-900">Children's Books</h3>
          <p className="text-slate-600">
            Create illustrated children's stories with consistent characters and beautiful artwork.
          </p>
        </div>
      </div>
    </div>
  );
}
