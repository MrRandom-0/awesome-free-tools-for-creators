// The fixed category set for the list. This file is the single place where
// categories are defined: the validator rejects anything outside this set,
// and the README builder renders sections in exactly this order.
//
// To add a category, add it here AND at least a few entries in tools.json.
// Category ids are lowercase slugs — they are also used as URL anchors.

export const CATEGORIES = [
  {
    id: "video",
    title: "Video & Animation",
    blurb: "Edit, record, convert and animate video without paying for an editor.",
  },
  {
    id: "audio",
    title: "Audio & Music",
    blurb: "Record and edit podcasts, voiceovers and music.",
  },
  {
    id: "design",
    title: "Design & Images",
    blurb: "Thumbnails, graphics, logos, photo editing and illustrations.",
  },
  {
    id: "writing",
    title: "Writing & Blogging",
    blurb: "Draft, check and publish writing — from posts to full newsletters.",
  },
  {
    id: "seo-marketing",
    title: "SEO & Marketing",
    blurb: "Get found, grow an audience and send email people actually open.",
  },
  {
    id: "social",
    title: "Social Media",
    blurb: "Schedule posts, read your numbers and keep every profile in one link.",
  },
  {
    id: "productivity",
    title: "Productivity",
    blurb: "Tasks, notes, files and automation for a one-person business.",
  },
  {
    id: "ai",
    title: "AI Tools",
    blurb: "Assistants, image and voice generators, and research helpers with real free tiers.",
  },
  {
    id: "learning",
    title: "Learning",
    blurb: "Free courses, libraries and practice to learn the skills behind the tools.",
  },
];

export const CATEGORY_IDS = CATEGORIES.map((c) => c.id);

export function categoryById(id) {
  return CATEGORIES.find((c) => c.id === id);
}
