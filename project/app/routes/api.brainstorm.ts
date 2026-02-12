import type { ActionFunctionArgs } from "react-router";
import { AuthService } from "~/services/auth-service";
import { apiKeyService } from "~/services/api-key-service.server";
import { aiService } from "~/utils/ai-service";
import { sessionService } from "~/services/session-service";
import type { BrainstormResult, BookOutline } from "~/services/session-service";
import { isUsingPlaceholders } from "~/lib/supabase";

export async function action({ request }: ActionFunctionArgs): Promise<Response> {
  try {
    let user = await AuthService.getCurrentUser();
    if (!user && (import.meta.env.DEV || isUsingPlaceholders)) {
      user = { id: "dev-user" } as any;
    }
    if (!user) {
      return Response.json({ error: "Authentication required" }, { status: 401 });
    }

    const formData = await request.formData();
    const idea = (formData.get("idea") as string) ?? "";
    const provider = (formData.get("provider") as string) ?? "auto";
    const model = (formData.get("model") as string) ?? "auto";
    const sessionId = formData.get("sessionId") as string;

    if (!idea.trim()) {
      return Response.json({ error: "Please enter a book idea" }, { status: 400 });
    }
    if (!sessionId) {
      return Response.json({ error: "Session not found. Please refresh the page." }, { status: 400 });
    }

    const apiKey = await apiKeyService.getApiKey(user.id, provider === "auto" ? "openai" : provider);
    if (!apiKey) {
      return Response.json({ error: "No API key found. Please add an API key in Settings." }, { status: 400 });
    }

    const results = await aiService.brainstorm(idea.trim(), provider, model, apiKey);

    let outline: BookOutline = { title: results.titles[0] || "Generated Outline", chapters: [] };
    try {
      const parsed = JSON.parse(results.outline);
      if (parsed && parsed.chapters && Array.isArray(parsed.chapters)) {
        outline = {
          title: parsed.title || (results.titles[0] || "Generated Outline"),
          subtitle: parsed.subtitle,
          chapters: parsed.chapters.map((ch: any, idx: number) => ({
            id: `${idx + 1}-${typeof ch.title === "string" ? ch.title : "chapter"}`,
            number: typeof ch.number === "number" ? ch.number : idx + 1,
            title: typeof ch.title === "string" ? ch.title : `Chapter ${idx + 1}`,
            sections: Array.isArray(ch.sections) ? ch.sections : [],
          })),
        };
      }
    } catch (e) {
      // Fallback: Try to parse markdown/text outline
      console.warn("Failed to parse AI response as JSON, attempting text parsing", e);
      
      const lines = results.outline.split('\n');
      let currentChapter: any = null;
      let chapterCount = 0;
      
      for (const line of lines) {
        const trimmed = line.trim();
        if (trimmed.match(/^#+\s*Chapter/i) || trimmed.match(/^\d+\.\s+Chapter/i) || trimmed.match(/^Chapter\s+\d+/i)) {
          if (currentChapter) {
            outline.chapters.push(currentChapter);
          }
          chapterCount++;
          currentChapter = {
            id: `chapter-${chapterCount}`,
            number: chapterCount,
            title: trimmed.replace(/^#+\s*/, '').replace(/^\d+\.\s*/, ''),
            sections: []
          };
        } else if (trimmed.startsWith('-') || trimmed.startsWith('*')) {
          if (currentChapter) {
            currentChapter.sections.push(trimmed.replace(/^[-*]\s*/, ''));
          }
        }
      }
      if (currentChapter) {
        outline.chapters.push(currentChapter);
      }
      
      // If still empty, create a generic outline based on titles
      if (outline.chapters.length === 0) {
        outline.chapters = [
          { id: '1', number: 1, title: 'Introduction', sections: ['Overview', 'Key Concepts'] },
          { id: '2', number: 2, title: 'Getting Started', sections: ['First Steps', 'Tools'] },
          { id: '3', number: 3, title: 'Core Principles', sections: ['Principle 1', 'Principle 2'] },
          { id: '4', number: 4, title: 'Advanced Techniques', sections: ['Strategy 1', 'Strategy 2'] },
          { id: '5', number: 5, title: 'Conclusion', sections: ['Summary', 'Next Steps'] }
        ];
      }
    }

    const saveResult: BrainstormResult = {
      titles: results.titles,
      outline,
      topic: idea.trim(),
      provider,
      model,
    };

    await sessionService.saveBrainstormResult(user.id, sessionId, saveResult);

    return Response.json({
      success: true,
      results: {
        titles: results.titles,
        outline: JSON.stringify(outline, null, 2),
        topic: idea.trim(),
        provider,
        model,
      },
      sessionId,
    });
  } catch (error) {
    return Response.json(
      { error: error instanceof Error ? error.message : "Failed to generate brainstorm ideas" },
      { status: 500 },
    );
  }
}

export async function loader() {
  return Response.json({ error: "Method not allowed" }, { status: 405 });
}
