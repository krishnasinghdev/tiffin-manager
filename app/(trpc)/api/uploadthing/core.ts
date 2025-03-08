import { createUploadthing, type FileRouter } from "uploadthing/next"
import { UploadThingError } from "uploadthing/server"

import { auth } from "@/lib/next-auth"

const f = createUploadthing()

export const ourFileRouter = {
  imageUploader: f({
    image: {
      maxFileSize: "4MB",
      maxFileCount: 1,
    },
  })
    .middleware(async () => {
      const session = await auth()
      if (!session || !session.user) throw new UploadThingError("Unauthorized")

      return { userId: session.user.id }
    })
    .onUploadComplete(async ({ metadata }: { metadata: { userId: string } }) => {
      console.log("Upload complete for userId:", metadata.userId)
      return { uploadedBy: metadata.userId }
    }),
} satisfies FileRouter

export type OurFileRouter = typeof ourFileRouter
