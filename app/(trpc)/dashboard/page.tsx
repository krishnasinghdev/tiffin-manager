"use client"

import Image from "next/image"
import Link from "next/link"
import Autoplay from "embla-carousel-autoplay"

import Icons from "@/lib/icons"
import { DASHBOARD_PAGE } from "@/lib/utils"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Carousel, CarouselContent, CarouselItem } from "@/components/ui/carousel"
import { Separator } from "@/components/ui/separator"
import { Skeleton } from "@/components/ui/skeleton"
import { clientApi } from "@/components/trpc-provider"

export default function DashboardPage() {
  const { data: statsData, isLoading, isError } = clientApi.vendor.getStats.useQuery()

  if (isError) {
    return (
      <Alert variant="destructive">
        <Icons.AlertTriangle />
        <AlertTitle>Ohh no!</AlertTitle>
        <AlertDescription>Something went wrong, Please try again later.</AlertDescription>
      </Alert>
    )
  }

  const carouselData = [
    { title: "Active Customers", value: statsData?.data.customers, icon: Icons.Users },
    { title: "Pending Bills", value: statsData?.data.bills, icon: Icons.ReceiptIndianRupee },
    { title: "Total Staff", value: statsData?.data.staffs, icon: Icons.UserCog },
  ]

  return (
    <div className="space-y-4">
      <div className="flex flex-col items-center justify-center">
        <Image src="/icons/apple-icon.png" quality={100} alt="tiffin-mangaer-logo" className="rounded border" width={64} height={64} />
        <h1 className="mt-4 text-center font-serif text-2xl">Your own manager.</h1>
      </div>

      {isLoading && (
        <>
          <Skeleton className="h-24 lg:hidden" />
          <div className="hidden gap-4 lg:grid lg:grid-cols-3">
            {Array.from({ length: 3 }).map((_, index) => (
              <Skeleton key={index} className="h-24" />
            ))}
          </div>
        </>
      )}

      {!isLoading && carouselData && (
        <Carousel
          opts={{
            align: "start",
            loop: true,
          }}
          plugins={[
            Autoplay({
              delay: 5000,
            }),
          ]}
          className="w-full"
        >
          <CarouselContent>
            {carouselData.map((item, index) => (
              <CarouselItem key={index} className="md:basis-1/2 lg:basis-1/3">
                <Card className="flex items-end justify-between">
                  <CardHeader>
                    <CardTitle>
                      <item.icon className="mb-2 h-8 w-8" />
                      <h3 className="text-lg font-semibold">{item.title}</h3>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="p-0">
                    <CardDescription className="text-primary text-4xl font-bold">{item.value}</CardDescription>
                  </CardContent>
                </Card>
              </CarouselItem>
            ))}
          </CarouselContent>
        </Carousel>
      )}
      <Separator />
      <div className="grid grid-cols-2 gap-4 lg:grid-cols-4 lg:justify-items-center">
        <div className="col-span-full grid w-full grid-cols-2 gap-4 lg:grid-cols-4">
          {DASHBOARD_PAGE.cards.map((item, index) => (
            <Link key={index} href={item.url}>
              <Card className="hover:bg-accent h-24 transition-colors">
                <CardContent className="flex h-full flex-col items-center justify-center p-2">
                  <item.icon className="text-primary mb-2 h-6 w-6" />
                  <h3 className="text-center text-sm font-medium">{item.title}</h3>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      </div>
      <Separator />
    </div>
  )
}
