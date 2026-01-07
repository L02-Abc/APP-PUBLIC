import * as z from "zod";

const ReportSchema = z.object({
    id: z.number(),
    time_created: z.string(),
    report_status: z.string(),
    title: z.string(),
    report_message: z.string(),
    post_id: z.number().optional(),
    claim_id: z.number().optional(),
    user: z.object({
        id: z.number(),
        alias: z.string(),
        role: z.string(),
        followedThreads: z.array(z.any()).optional(),
    })
})

export type Report = z.infer<typeof ReportSchema>;

export const ReportListSchema = z.array(ReportSchema);