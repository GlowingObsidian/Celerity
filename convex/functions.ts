import { Doc } from "./_generated/dataModel";
import { mutation, query } from "./_generated/server";
import { v } from "convex/values";

export const createEvent = mutation({
  args: {
    name: v.string(),
    cc: v.string(),
    fee: v.number(),
    room: v.string(),
    registrations: v.array(v.id("registration")),
    link: v.string(),
    type: v.union(v.literal("EVENT"), v.literal("FLASH")),
  },
  handler: async (ctx, args) => {
    const newEvent = await ctx.db.insert("event", args);
    return newEvent;
  },
});

export const getEvents = query({
  handler: async (ctx) => {
    return await ctx.db
      .query("event")
      .withIndex("by_name")
      .order("asc")
      .collect();
  },
});

export const getEventByLink = query({
  args: {
    link: v.string(),
  },
  handler: async (ctx, args) => {
    const event = await ctx.db
      .query("event")
      .withIndex("by_link", (q) => q.eq("link", args.link))
      .first();
    return event;
  },
});

export const deleteEvent = mutation({
  args: {
    id: v.id("event"),
  },
  handler: async (ctx, args) => {
    await ctx.db.delete(args.id);
  },
});

export const totalMoneyCollected = query({
  async handler(ctx) {
    const registrations = await ctx.db.query("registration").collect();
    const totalMoney = registrations.reduce(
      (acc, registration) => acc + registration.amount,
      0,
    );
    return totalMoney;
  },
});

export const getSettings = query({
  handler: async (ctx) => await ctx.db.query("setting").collect(),
});

export const updateSettings = mutation({
  args: {
    name: v.string(),
    value: v.string(),
  },
  handler: async (ctx, args) => {
    const setting = await ctx.db
      .query("setting")
      .withIndex("by_name", (q) => q.eq("name", args.name))
      .first();
    if (setting) await ctx.db.patch(setting._id, { value: args.value });
  },
});

export const createNewRegistration = mutation({
  args: {
    name: v.string(),
    college: v.string(),
    email: v.string(),
    phone: v.string(),
    events: v.array(v.id("event")),
    amount: v.number(),
    mode: v.union(v.literal("CASH"), v.literal("UPI")),
  },
  handler: async (ctx, args) => {
    const newRegistration = await ctx.db.insert("registration", { ...args });

    for (const eventId of args.events) {
      const event = await ctx.db.get(eventId);
      if (event) {
        await ctx.db.patch(eventId, {
          registrations: [...(event.registrations ?? []), newRegistration],
        });
      }
    }

    return await ctx.db.get(newRegistration);
  },
});

export const getRegistrations = query({
  args: {
    registrations: v.array(v.id("registration")),
  },
  handler: async (ctx, args) => {
    const registrations: Doc<"registration">[] = [];
    for (const registrationId of args.registrations) {
      const registration = await ctx.db.get(registrationId);
      if (registration) registrations.push(registration);
    }
    return registrations.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const getAllRegistrations = query({
  async handler(ctx) {
    const registrations = await ctx.db.query("registration").collect();
    return registrations.sort((a, b) => b._creationTime - a._creationTime);
  },
});

export const deleteRegistration = mutation({
  args: {
    id: v.id("registration"),
  },
  handler: async (ctx, args) => {
    const registration = await ctx.db.get(args.id);
    if (!registration) return null;

    for (const eventId of registration.events) {
      const event = await ctx.db.get(eventId);
      if (event) {
        const updatedRegistrations = (event.registrations ?? []).filter(
          (id) => id !== args.id,
        );
        await ctx.db.patch(eventId, { registrations: updatedRegistrations });
      }
    }

    await ctx.db.delete(args.id);
    return true;
  },
});
