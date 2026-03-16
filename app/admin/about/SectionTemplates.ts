export const sectionTemplates: Record<string, any> = {
  hero: {
    type: "hero",
    enabled: true,
    content: {
      headline: "",
      subheadline: "",
      image_url: "",
      ctas: [],
    },
  },

  philosophy: {
    type: "philosophy",
    enabled: true,
    content: {
      heading: "",
      paragraphs: [],
    },
  },

  story: {
    type: "story",
    enabled: true,
    content: {
      heading: "",
      image_url: "",
      paragraphs: [],
      pull_quote: "",
    },
  },

  community_intro: {
    type: "community_intro",
    enabled: true,
    content: {
      subheading: "",
      heading: "",
      body: "",
      bullets: [],
      image_url: "",
      video_url: "",
      layout: "image-right",
      cta: null,
    },
  },

  visual_break: {
    type: "visual_break",
    enabled: true,
    content: {
      headline: "",
      subheadline: "",
    },
  },

  community_cta: {
    type: "community_cta",
    enabled: true,
    content: {
      heading: "",
      paragraphs: [],
      cta_text: "",
      cta_url: "",
      icon: "fa-solid fa-heart",
    },
  },

  team: {
    type: "team",
    enabled: true,
    content: {
      heading: "Meet the Team",
      subheading: "",
      members: [],
    },
  },

  generic: {
    type: "generic",
    enabled: true,
    content: {
      headline: "",
      body: "",
      bullets: [],
      image_url: "",
      video_url: "",
      layout: "image_left",
    },
  },

  offers: {
    type: "offers",
    enabled: true,
    content: {
      heading: "Ways We Work Together",
      subheading: "",
      categories: [],
    },
  },
}

export const SECTION_LABELS: Record<string, string> = {
  hero: "Hero",
  philosophy: "Philosophy",
  story: "Story",
  community_intro: "Community Intro",
  visual_break: "Visual Break",
  community_cta: "Community CTA",
  team: "Team",
  generic: "Generic",
  offers: "Offers",
}

export const sectionPresets: Record<string, Array<{ label: string; template: any }>> = {
  community_intro: [
    {
      label: "Image Right, CTA",
      template: {
        type: "community_intro",
        enabled: true,
        content: {
          subheading: "OUR APPROACH",
          heading: "Community That Grows With You",
          body: "We believe in building something together. Join a space where ideas are shared, progress is celebrated, and every voice matters.",
          bullets: ["Live sessions twice a month", "Private community access", "Direct access to experts"],
          image_url: "",
          video_url: "",
          layout: "image-right",
          cta: { mode: "community", label: "Join the Community", url: "" },
        },
      },
    },
    {
      label: "Video Left, No CTA",
      template: {
        type: "community_intro",
        enabled: true,
        content: {
          subheading: "WATCH & LEARN",
          heading: "See How It Works",
          body: "A short video walkthrough of our community and how members get value from it.",
          bullets: [],
          image_url: "",
          video_url: "https://example.com/video",
          layout: "image-right",
          cta: null,
        },
      },
    },
  ],
  offers: [
    {
      label: "Masterclasses / Tools / Coaching",
      template: {
        type: "offers",
        enabled: true,
        content: {
          heading: "Ways We Work Together",
          subheading: "Choose the path that fits you",
          categories: [
            {
              title: "Masterclasses",
              layout: "grid",
              items: [
                { title: "Foundations Masterclass", description: "Core principles in 6 modules.", image_url: "", icon: "fa-solid fa-graduation-cap" },
                { title: "Advanced Strategy", description: "Take it to the next level.", image_url: "", icon: "fa-solid fa-chart-line" },
              ],
            },
            {
              title: "Tools & Resources",
              layout: "grid",
              items: [
                { title: "Templates Library", description: "Ready-to-use frameworks.", image_url: "", icon: "fa-solid fa-folder-open" },
                { title: "Coaching Calls", description: "1:1 support when you need it.", image_url: "", icon: "fa-solid fa-phone" },
              ],
            },
          ],
        },
      },
    },
    {
      label: "Simple Cards",
      template: {
        type: "offers",
        enabled: true,
        content: {
          heading: "What We Offer",
          subheading: "",
          categories: [
            {
              title: "",
              layout: "grid",
              items: [
                { title: "Membership", description: "Full access to all content and community.", image_url: "" },
                { title: "Workshops", description: "Live workshops every month.", image_url: "" },
                { title: "Coaching", description: "One-on-one coaching sessions.", image_url: "" },
              ],
            },
          ],
        },
      },
    },
  ],
  team: [
    {
      label: "Sample Team (3 members)",
      template: {
        type: "team",
        enabled: true,
        content: {
          heading: "Meet the Team",
          members: [
            { name: "Jane Smith", role: "Founder & Lead", image_url: "", bio: "10+ years building communities. Passionate about helping creators thrive." },
            { name: "Alex Rivera", role: "Community Manager", image_url: "", bio: "Keeps our community vibrant and supportive every day." },
            { name: "Sam Chen", role: "Content Lead", image_url: "", bio: "Crafts learning experiences that members love." },
          ],
        },
      },
    },
  ],
  generic: [
    {
      label: "Image Left",
      template: {
        type: "generic",
        enabled: true,
        content: {
          headline: "How We Got Started",
          body: "Our story began with a simple idea: make expert knowledge accessible to everyone. We've grown into a thriving community of learners and creators.",
          bullets: ["Founded in 2020", "10,000+ members", "50+ expert instructors"],
          image_url: "",
          video_url: "",
          layout: "image_left",
        },
      },
    },
    {
      label: "Video Right",
      template: {
        type: "generic",
        enabled: true,
        content: {
          headline: "Watch Our Story",
          body: "Hear from our founders about the vision behind this community and what makes it special.",
          bullets: [],
          image_url: "",
          video_url: "https://example.com/our-story",
          layout: "video_right",
        },
      },
    },
  ],
  story: [
    {
      label: "Founder Story",
      template: {
        type: "story",
        enabled: true,
        content: {
          heading: "Our Story",
          image_url: "",
          paragraphs: [
            "We started with a question: what if learning could feel like being part of something bigger?",
            "That question led us here—a place where people come to grow, share, and support each other.",
            "Today we're proud to serve thousands of members, and we're just getting started.",
          ],
          pull_quote: "We believe in progress over perfection.",
        },
      },
    },
  ],
}
