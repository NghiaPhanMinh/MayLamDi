import { v } from "convex/values";

import { mutation, query } from "./_generated/server";
import { requireAuthUser } from "./lib/auth";

function cleanSkills(values: string[], label: string) {
  const skills = [...new Set(values.map((value) => value.trim()))]
    .filter(Boolean)
    .slice(0, 30);

  if (skills.some((skill) => skill.length > 60)) {
    throw new Error(`${label} must be 60 characters or fewer.`);
  }

  return skills;
}

export const getOrNull = query({
  args: {},
  handler: async (ctx) => {
    const authUser = await requireAuthUser(ctx);

    return await ctx.db
      .query("userProfiles")
      .withIndex("by_auth_user_id", (indexQuery) =>
        indexQuery.eq("authUserId", authUser._id),
      )
      .unique();
  },
});

export const ensureCurrent = mutation({
  args: {},
  handler: async (ctx) => {
    const authUser = await requireAuthUser(ctx);
    const existing = await ctx.db
      .query("userProfiles")
      .withIndex("by_auth_user_id", (indexQuery) =>
        indexQuery.eq("authUserId", authUser._id),
      )
      .unique();

    const now = Date.now();
    const displayName = authUser.name?.trim();
    const email = authUser.email?.trim().toLowerCase();

    if (!displayName || !email) {
      throw new Error(
        "Google did not provide the required name and email profile fields.",
      );
    }

    if (existing !== null) {
      const nextImage = authUser.image ?? undefined;
      const needsUpdate =
        existing.displayName !== displayName ||
        existing.email !== email ||
        existing.imageUrl !== nextImage;

      if (needsUpdate) {
        await ctx.db.patch(existing._id, {
          displayName,
          email,
          imageUrl: nextImage,
          updatedAt: now,
        });
      }

      return existing._id;
    }

    return await ctx.db.insert("userProfiles", {
      authUserId: authUser._id,
      displayName,
      email,
      imageUrl: authUser.image ?? undefined,
      createdAt: now,
      updatedAt: now,
    });
  },
});

export const saveCurrent = mutation({
  args: {
    skills: v.array(v.string()),
    softwareSkills: v.array(v.string()),
    weeklyCapacity: v.number(),
  },
  handler: async (ctx, args) => {
    const authUser = await requireAuthUser(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_auth_user_id", (indexQuery) =>
        indexQuery.eq("authUserId", authUser._id),
      )
      .unique();

    const skills = cleanSkills(args.skills, "Skills");
    const softwareSkills = cleanSkills(args.softwareSkills, "Software skills");

    if (skills.length === 0 && softwareSkills.length === 0) {
      throw new Error("Choose at least one skill so your team knows how you work.");
    }
    if (
      !Number.isFinite(args.weeklyCapacity) ||
      args.weeklyCapacity <= 0 ||
      args.weeklyCapacity > 168
    ) {
      throw new Error("Weekly capacity must be between 1 and 168 hours.");
    }

    const now = Date.now();
    if (profile === null) {
      const displayName = authUser.name?.trim() ?? "Teammate";
      const email = authUser.email?.trim().toLowerCase() ?? "";

      return await ctx.db.insert("userProfiles", {
        authUserId: authUser._id,
        displayName,
        email,
        imageUrl: authUser.image ?? undefined,
        skills,
        softwareSkills,
        weeklyCapacity: args.weeklyCapacity,
        profileCompletedAt: now,
        createdAt: now,
        updatedAt: now,
      });
    }

    await ctx.db.patch(profile._id, {
      skills,
      softwareSkills,
      weeklyCapacity: args.weeklyCapacity,
      profileCompletedAt: profile.profileCompletedAt ?? now,
      updatedAt: now,
    });

    return profile._id;
  },
});

export const resetCurrentForTesting = mutation({
  args: {},
  handler: async (ctx) => {
    const authUser = await requireAuthUser(ctx);
    const profile = await ctx.db
      .query("userProfiles")
      .withIndex("by_auth_user_id", (indexQuery) =>
        indexQuery.eq("authUserId", authUser._id),
      )
      .unique();

    if (profile === null) {
      return { success: true };
    }

    // 1. Remove all team memberships for this profile
    const memberships = await ctx.db
      .query("teamMembers")
      .withIndex("by_user", (q) => q.eq("profileId", profile._id))
      .collect();

    for (const member of memberships) {
      await ctx.db.delete(member._id);
    }

    // 2. Reset user profile fields to uncompleted state
    await ctx.db.patch(profile._id, {
      skills: [],
      softwareSkills: [],
      weeklyCapacity: undefined,
      profileCompletedAt: undefined,
      characterFill: undefined,
      characterOutline: undefined,
      spellType: undefined,
      updatedAt: Date.now(),
    });

    return { success: true };
  },
});

