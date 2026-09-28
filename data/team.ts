/*
 * The team section on /about. Hidden until you fill it in.
 *
 * To show it:
 *   1. Add each person below (name, role, a short bio, and a photo placed in
 *      public/team/, e.g. "/team/firstname.jpg", ideally 1200x1500).
 *   2. Set SHOW_TEAM to true.
 */

export const SHOW_TEAM = false;

export type Member = {
  name: string;
  role: string;
  bio: string;
  /** Path under /public, e.g. "/team/firstname.jpg". Leave empty for none. */
  photo?: string;
};

export const team: Member[] = [
  // { name: "", role: "Design", bio: "", photo: "/team/.jpg" },
  // { name: "", role: "Development", bio: "", photo: "/team/.jpg" },
];
