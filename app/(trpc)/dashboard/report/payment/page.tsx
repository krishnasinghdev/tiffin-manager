"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { clientApi } from "@/components/trpc-provider"

type TimePeriod = "weekly" | "monthly" | "quarterly"

export default function PaymentReportChart() {
  const [timePeriod, setTimePeriod] = useState<TimePeriod>("monthly")

  const { data: reportData, isLoading } = clientApi.report.getPaymentStats.useQuery({
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

  const formatCurrency = (value: number) => {
    return new Intl.NumberFormat("en-IN", {
      style: "currency",
      currency: "INR",
      minimumFractionDigits: 0,
    }).format(value)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Payment Report</CardTitle>
        <CardDescription>Overview of payments by {timePeriod.slice(0, -2)} period and payment mode</CardDescription>
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
              cash: {
                label: "Cash",
                color: "hsl(var(--chart-1))",
              },
              upi: {
                label: "UPI",
                color: "hsl(var(--chart-2))",
              },
              bank: {
                label: "Bank Transfer",
                color: "hsl(var(--chart-3))",
              },
              card: {
                label: "Card",
                color: "hsl(var(--chart-4))",
              },
              other: {
                label: "Other",
                color: "hsl(var(--chart-5))",
              },
            }}
            className="min-h-[300px]"
          >
            <BarChart
              accessibilityLayer
              data={reportData?.data.map((item) => ({
                period: item.timePeriod,
                cash: item.cashAmount,
                upi: item.upiAmount,
                bank: item.bankAmount,
                card: item.cardAmount,
                other: item.otherAmount,
              }))}
            >
              <CartesianGrid vertical={false} />
              <XAxis dataKey="period" tickLine={false} tickMargin={10} axisLine={false} tickFormatter={formatLabel} />
              <YAxis tickLine={false} axisLine={false} tickFormatter={formatCurrency} />
              <ChartTooltip content={<ChartTooltipContent />} cursor={false} />
              <Bar dataKey="cash" fill="var(--color-cash)" radius={[4, 4, 0, 0]} />
              <Bar dataKey="upi" fill="var(--color-upi)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="bank" fill="var(--color-bank)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="card" fill="var(--color-card)" radius={[0, 0, 0, 0]} />
              <Bar dataKey="other" fill="var(--color-other)" radius={[0, 0, 4, 4]} />
            </BarChart>
          </ChartContainer>
        )}
      </CardContent>
    </Card>
  )
}
