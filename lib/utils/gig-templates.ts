interface GigTemplate {
  title: string;
  description: string;
  suggestedPrice: number;
  suggestedTimeline: string;
}

const SKILL_TEMPLATES: Record<string, GigTemplate> = {
  // Frontend
  'React': {
    title: 'I will build your React web application',
    description: 'I\'ll create a modern, responsive React application tailored to your needs. Clean code, best practices, and fast performance guaranteed.',
    suggestedPrice: 500,
    suggestedTimeline: '7 days',
  },
  'Next.js': {
    title: 'I will build your Next.js website or web app',
    description: 'Professional Next.js development with server-side rendering, optimized performance, and SEO-friendly structure. Perfect for modern web applications.',
    suggestedPrice: 600,
    suggestedTimeline: '7 days',
  },
  'TypeScript': {
    title: 'I will develop your TypeScript application',
    description: 'Type-safe, maintainable code with TypeScript. I\'ll build robust applications with excellent developer experience and fewer bugs.',
    suggestedPrice: 550,
    suggestedTimeline: '7 days',
  },
  'JavaScript': {
    title: 'I will build your JavaScript web application',
    description: 'Modern JavaScript development with ES6+, clean architecture, and best practices. Responsive, fast, and user-friendly applications.',
    suggestedPrice: 450,
    suggestedTimeline: '7 days',
  },
  // Design
  'UI Design': {
    title: 'I will design a modern UI for your product',
    description: 'Beautiful, user-friendly interface design that converts. Clean aesthetics, intuitive navigation, and pixel-perfect execution.',
    suggestedPrice: 400,
    suggestedTimeline: '5 days',
  },
  'UX Design': {
    title: 'I will create a user experience strategy and design',
    description: 'User-centered design process with research, wireframes, prototypes, and testing. I\'ll create experiences users love.',
    suggestedPrice: 500,
    suggestedTimeline: '7 days',
  },
  'Logo Design': {
    title: 'I will design a professional logo for your brand',
    description: 'Unique, memorable logo design that represents your brand identity. Multiple concepts, revisions, and final files in all formats.',
    suggestedPrice: 150,
    suggestedTimeline: '3 days',
  },
  'Brand Identity': {
    title: 'I will create a complete brand identity package',
    description: 'Comprehensive brand identity including logo, color palette, typography, and brand guidelines. Professional, cohesive brand presence.',
    suggestedPrice: 600,
    suggestedTimeline: '7 days',
  },
  // Writing
  'Copywriting': {
    title: 'I will write compelling copy for your business',
    description: 'Persuasive, conversion-focused copy that speaks to your audience. Website copy, landing pages, emails, and marketing materials.',
    suggestedPrice: 300,
    suggestedTimeline: '3 days',
  },
  'Content Writing': {
    title: 'I will create engaging content for your brand',
    description: 'High-quality blog posts, articles, and web content that engage readers and drive results. SEO-optimized and well-researched.',
    suggestedPrice: 200,
    suggestedTimeline: '3 days',
  },
  // Development
  'WordPress': {
    title: 'I will build your WordPress website',
    description: 'Custom WordPress development with themes, plugins, and customization. Fast, secure, and easy to manage.',
    suggestedPrice: 400,
    suggestedTimeline: '5 days',
  },
  'Shopify': {
    title: 'I will set up and customize your Shopify store',
    description: 'Complete Shopify store setup with custom theme, product pages, and payment integration. Ready to sell in days.',
    suggestedPrice: 500,
    suggestedTimeline: '5 days',
  },
  'Webflow': {
    title: 'I will design and build your Webflow website',
    description: 'Beautiful, responsive Webflow website with custom animations and interactions. No-code solution with professional results.',
    suggestedPrice: 600,
    suggestedTimeline: '7 days',
  },
  // Video/Photo
  'Video Editing': {
    title: 'I will edit your video professionally',
    description: 'Professional video editing with color grading, transitions, sound design, and motion graphics. High-quality results.',
    suggestedPrice: 300,
    suggestedTimeline: '3 days',
  },
  'Photo Editing': {
    title: 'I will edit your photos professionally',
    description: 'Professional photo retouching, color correction, and enhancement. High-resolution results ready for print or web.',
    suggestedPrice: 50,
    suggestedTimeline: '1 day',
  },
};

export function getGigTemplate(skills: string[]): GigTemplate {
  // Find the first skill that has a template
  for (const skill of skills) {
    if (SKILL_TEMPLATES[skill]) {
      return SKILL_TEMPLATES[skill];
    }
  }

  // Default template
  return {
    title: 'I will help you with your project',
    description: 'Professional service tailored to your needs. I\'ll work closely with you to deliver high-quality results that exceed expectations.',
    suggestedPrice: 300,
    suggestedTimeline: '5 days',
  };
}

export function getAllTemplates(): Record<string, GigTemplate> {
  return SKILL_TEMPLATES;
}

