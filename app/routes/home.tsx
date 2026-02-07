import { Link } from "react-router";
import { Sparkles, BookOpen, Wand2, Download, Shield, Zap, Volume2, Palette } from "lucide-react";
import { Navigation } from "~/components/navigation";
import { ProtectedRoute } from "~/components/protected-route";
import styles from "./home.module.css";

export function meta() {
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
          <h1 className={styles.title}>Create Professional Content That Sells</h1>
          <p className={styles.subtitle}>Your Complete Multi-Format Publishing Platform</p>
          <p className={styles.description}>
            Transform your ideas into professional, KDP-compliant ebooks, audiobooks, and illustrated children's books. 
            Brainstorm concepts, generate outlines, write complete chapters, and export in multiple formats—all in one powerful platform.
          </p>
          <Link to="/brainstorm" className={styles.cta}>
            <Sparkles className={styles.ctaIcon} />
            Start Creating Now
          </Link>
        </div>
      </section>

      <section className={styles.features}>
        <div className={styles.featuresContainer}>
          <h2 className={styles.featuresTitle}>Everything You Need to Publish Your Book</h2>

          <div className={styles.featuresGrid}>
            <div className={styles.feature}>
              <Sparkles className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Intelligent Brainstorming</h3>
              <p className={styles.featureDescription}>
                Generate compelling book titles and detailed outlines from your ideas. Choose from multiple providers
                for the best results.
              </p>
            </div>

            <div className={styles.feature}>
              <BookOpen className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Smart Content Builder</h3>
              <p className={styles.featureDescription}>
                Upload existing outlines or create new ones. Intelligent tools improve structure, add depth, and ensure 
                logical flow throughout your book.
              </p>
            </div>

            <div className={styles.feature}>
              <Volume2 className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Professional Audiobooks</h3>
              <p className={styles.featureDescription}>
                Convert your ebooks to professional audiobooks with realistic voices. Multiple voice options and 
                audio quality enhancement included.
              </p>
            </div>

            <div className={styles.feature}>
              <Palette className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Children's Ebooks</h3>
              <p className={styles.featureDescription}>
                Create illustrated children's ebooks with AI-generated stories and artwork. Age-appropriate content 
                with consistent character designs and multiple illustration styles.
              </p>
            </div>

            <div className={styles.feature}>
              <Wand2 className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Content Enhancement</h3>
              <p className={styles.featureDescription}>
                Advanced content refinement transforms text into natural, engaging writing that resonates with readers
                and passes quality checks.
              </p>
            </div>

            <div className={styles.feature}>
              <Download className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>KDP-Compliant Export</h3>
              <p className={styles.featureDescription}>
                Export your finished book as PDF, EPUB, HTML, or Markdown—all formatted to meet Amazon KDP publishing
                standards for immediate upload.
              </p>
            </div>

            <div className={styles.feature}>
              <Shield className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Secure Key Management</h3>
              <p className={styles.featureDescription}>
                Your API keys are encrypted and stored securely. Support for OpenAI, Anthropic, Google Gemini, xAI Grok,
                and DeepSeek.
              </p>
            </div>

            <div className={styles.feature}>
              <Zap className={styles.featureIcon} />
              <h3 className={styles.featureTitle}>Multi-Provider Flexibility</h3>
              <p className={styles.featureDescription}>
                Choose your preferred model or let the system auto-select the best option for each task. Maximum
                flexibility and quality with fallback support.
              </p>
            </div>
          </div>
        </div>
      </section>
      </div>
    </ProtectedRoute>
  );
}
