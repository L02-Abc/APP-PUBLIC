import * as z from "zod";

const UserPublicScheme = z.object({
  alias: z.string(),
  followed_threads: z.array(z.any()).optional(),
})

const NotificationSchema = z.object({
  id: z.number(),
  title: z.string(),
  noti_message: z.string(),
  time_created: z.string(),
  is_read: z.boolean(),
  link_to_newpost: z.string().nullable(),
  user: UserPublicScheme,
})

export type Notification = z.infer<typeof NotificationSchema>;

export const NotificationListSchema = z.array(NotificationSchema);