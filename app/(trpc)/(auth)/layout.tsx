import Image from "next/image"
import Link from "next/link"

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="grid min-h-svh lg:grid-cols-2">
      <div className="bg-muted hidden items-center justify-center lg:flex">
        <Image src="/images/full-logo.png" priority quality={100} alt="Image" width={460} height={460} />
      </div>
      <div className="flex flex-col p-6 md:p-10 lg:gap-4">
        <div className="flex justify-center gap-2 lg:hidden">
          <Link href="/" className="flex items-center gap-2 font-medium">
            <Image
              src="/images/logo-512.svg"
              alt="tiffin-mangaer-logo"
              priority
              quality={100}
              className="rounded"
              width={100}
              height={100}
            />
          </Link>
        </div>
        <div className="flex flex-1 items-center justify-center">
          <div className="w-full max-w-xs">{children}</div>
        </div>
      </div>
    </div>
  )
}
