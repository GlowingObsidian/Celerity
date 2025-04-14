import { v } from "convex/values";
import { action } from "./_generated/server";

export const sendMail = action({
  args: {
    first_name: v.string(),
    name: v.string(),
    date: v.string(),
    college: v.string(),
    total: v.number(),
    email: v.string(),
    phone: v.string(),
    events: v.string(),
  },
  handler: async (ctx, args) => {
    const response = await fetch(
      "https://api.emailjs.com/api/v1.0/email/send",
      {
        method: "POST",
        headers: {
          origin: "http://localhost", // any origin, just required by EmailJS
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          service_id: process.env.service_id,
          template_id: process.env.template_id,
          user_id: process.env.user_id,
          template_params: args,
        }),
      },
    );
    if (!response.ok) {
      const error = await response.text();
      console.log(error);
    }
    return { status: response.status };
  },
});
