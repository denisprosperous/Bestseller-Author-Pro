import { Link } from "react-router";
import { Sparkles, BookOpen, Wand2, Download, Shield, Zap } from "lucide-react";
import type { Route } from "./+types/home";
import { Navigation } from "~/components/navigation";
import { ProtectedRoute } from "~/components/protected-route";
import styles from "./home.module.css";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "Bestseller Author Pro - AI-Powered Ebook Creation" },
    {
      name: "description",
      content:
        "Create bestselling-quality ebooks with AI. Brainstorm, write, humanize, and export KDP-compliant books.",
    },
  ];
}

export default function Home() {
  return (
    <ProtectedRoute>
      <div className={styles.container}>
        <Navigation />

      <section className={styles.hero}>
        <div className={styles.content}>
          <h1 className={styles.title}>Create Bestselling Ebooks with AI</h1>
          <p className={styles.subtitle}>Your Complete AI-Powered Writing Assistant</p>
          <p className={styles.description}>
            Transform your ideas into professional, KDP-compliant ebooks. Brainstorm concepts, generate outlines, write
            complete chapters, humanize AI content, and export in multiple formats—all in one powerful platform.
          </p>
          <Link to="/brainstorm" className={styles.cta}>
            <Sparkles className={styles.ctaIcon} />
            Start Creating Now
          </Link>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresContainer}>
          <h2 className={styles.featuresTitle}>Everything You Need to Write Your Book</h2>

          <div className={styles.featuresGrid}>
            <div className={styles.feature}>
              <Sparkles className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>AI Brainstorming</h3>
              <p className={styles.featureDescription}>
                Generate compelling book titles and detailed outlines from your ideas. Choose from multiple AI providers
                for the best results.
              </p>
            </div>

            <div className={styles.feature}>
              <BookOpen className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Smart Outline Builder</h3>
              <p className={styles.featureDescription}>
                Upload existing outlines or create new ones. AI improves structure, adds depth, and ensures logical flow
                throughout your book.
              </p>
            </div>

            <div className={styles.feature}>
              <Wand2 className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Content Humanization</h3>
              <p className={styles.featureDescription}>
                Advanced 4-phase humanization transforms robotic AI text into natural, engaging writing that passes
                detection tools.
              </p>
            </div>

            <div className={styles.feature}>
              <Download className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>KDP-Ready Export</h3>
              <p className={styles.featureDescription}>
                Export your finished book as PDF, EPUB, HTML, or Markdown—all formatted to meet Amazon KDP publishing
                standards.
              </p>
            </div>

            <div className={styles.feature}>
              <Shield className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Secure API Management</h3>
              <p className={styles.featureDescription}>
                Your API keys are encrypted and stored securely. Support for OpenAI, Anthropic, Google Gemini, xAI Grok,
                and DeepSeek.
              </p>
            </div>

            <div className={styles.feature}>
              <Zap className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Multi-Provider Support</h3>
              <p className={styles.featureDescription}>
                Choose your preferred AI model or let the system auto-select the best option for each task. Maximum
                flexibility and quality.
              </p>
            </div>
          </div>
        </div>
      </section>
    </ProtectedRoute>
  );
}
