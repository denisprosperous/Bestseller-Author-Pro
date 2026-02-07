export interface BookOutline {
  title: string;
  subtitle: string;
  chapters: Chapter[];
}

export interface Chapter {
  id: string;
  number: number;
  title: string;
  sections: string[];
  content?: string;
}

export const SAMPLE_OUTLINES: BookOutline[] = [
  {
    title: "The Digital Entrepreneur's Handbook",
    subtitle: "Building a Thriving Online Business from Scratch",
    chapters: [
      {
        id: "1",
        number: 1,
        title: "Finding Your Niche",
        sections: ["Understanding Market Demand", "Identifying Your Unique Value", "Validating Your Business Idea"],
      },
      {
        id: "2",
        number: 2,
        title: "Building Your Online Presence",
        sections: ["Creating a Professional Website", "Social Media Strategy", "Content Marketing Fundamentals"],
      },
      {
        id: "3",
        number: 3,
        title: "Monetization Strategies",
        sections: ["Digital Products and Services", "Affiliate Marketing", "Subscription Models"],
      },
    ],
  },
];

export const SAMPLE_BRAINSTORM_RESULTS = {
  titles: [
    "The Complete Guide to Mindful Living",
    "Mindfulness Mastery: Transform Your Life in 30 Days",
    "The Peaceful Mind: A Practical Guide to Daily Meditation",
    "From Chaos to Calm: Your Journey to Inner Peace",
    "The Modern Meditator's Handbook",
  ],
  outline: {
    title: "The Complete Guide to Mindful Living",
    subtitle: "Practical Techniques for a More Present and Peaceful Life",
    chapters: [
      {
        id: "1",
        number: 1,
        title: "Understanding Mindfulness",
        sections: ["What is Mindfulness?", "The Science Behind Mindfulness", "Benefits of Daily Practice"],
      },
      {
        id: "2",
        number: 2,
        title: "Getting Started",
        sections: ["Creating Your Practice Space", "Basic Breathing Techniques", "Your First 5-Minute Meditation"],
      },
      {
        id: "3",
        number: 3,
        title: "Building a Daily Habit",
        sections: ["Morning Mindfulness Routines", "Mindful Eating Practices", "Evening Reflection Exercises"],
      },
    ],
  },
};
