"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { clientApi } from "@/components/trpc-provider"

type TimePeriod = "weekly" | "monthly" | "quarterly"

export default function DeliveryReportChart() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("monthly")

  const { data: reportData, isLoading } = clientApi.report.getDeliveryStats.useQuery({
    timePeriod,
  })

  const formatLabel = (value: string) => {
    if (timePeriod === "weekly") {
      const [_, week] = value.split("-")
      return `W${week}`
    } else if (timePeriod === "monthly") {
      const [year, month] = value.split("-")
      return new Date(Number.parseInt(year ?? "0"), Number.parseInt(month ?? "0") - 1).toLocaleString("default", { month: "short" })
    } else {
      const [_, quarter] = value.split("-")
      return `Q${quarter}`
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Delivery Report</CardTitle>
        <CardDescription>Overview of deliveries by {timePeriod.slice(0, -2)} period</CardDescription>
        <Tabs defaultValue="monthly" onValueChange={(value) => setTimePeriod(value as TimePeriod)}>
          <TabsList>
            <TabsTrigger value="weekly">Weekly</TabsTrigger>
            <TabsTrigger value="monthly">Monthly</TabsTrigger>
            <TabsTrigger value="quarterly">Quarterly</TabsTrigger>
          </TabsList>
        </Tabs>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex h-[300px] w-full items-center justify-center">
            <Skeleton className="h-[300px] w-full" />
          </div>
        ) : (
          <ChartContainer
            config={{
              breakfast: {
                label: "Breakfast",
                color: "hsl(var(--chart-1))",
              },
              lunch: {
                label: "Lunch",
                color: "hsl(var(--chart-2))",
              },
              dinner: {
                label: "Dinner",
                color: "hsl(var(--chart-3))",
              },
            }}
            className="min-h-[300px]"
          >
            <BarChart
              accessibilityLayer
              data={reportData?.data.map((item) => ({
                period: item.timePeriod,
                breakfast: item.breakfastCount,
                lunch: item.lunchCount,
                dinner: item.dinnerCount,
              }))}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="period" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={formatLabel} />
              <YAxis tickLine={false} axisLine={false} />
              <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
              <Bar dataKey="breakfast" fill="var(--color-breakfast)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="lunch" fill="var(--color-lunch)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="dinner" fill="var(--color-dinner)" radius={[0, 0, 4, 4]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
