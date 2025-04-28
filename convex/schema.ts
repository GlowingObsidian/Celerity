import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.

export default defineSchema({
  setting: defineTable({
    name: v.string(),
    value: v.string(),
  }).index("by_name", ["name"]),

  registration: defineTable({
    name: v.string(),
    college: v.string(),
    email: v.string(),
    phone: v.string(),
    events: v.array(v.id("event")),
    amount: v.number(),
    mode: v.union(v.literal("CASH"), v.literal("UPI")),
  }),

  event: defineTable({
    name: v.string(),
    cc: v.string(),
    fee: v.number(),
    room: v.string(),
    registrations: v.array(v.id("registration")),
    link: v.string(),
    type: v.union(v.literal("EVENT"), v.literal("FLASH")),
  })
    .index("by_name", ["name"])
    .index("by_link", ["link"]),

  serviceRecord: defineTable({
    name: v.string(),
    services: v.array(
      v.object({
        service: v.union(
          v.literal("tattoo"),
          v.literal("nail"),
          v.literal("caricature"),
        ),
        count: v.number(),
        price: v.number(),
      }),
    ),
    mode: v.union(v.literal("CASH"), v.literal("UPI")),
    total: v.number(),
  }),
});
