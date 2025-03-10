"use client"

import Image from "next/image"
import Link from "next/link"
import { ChevronDown, ChevronRight, MapPin, Search } from "lucide-react"

// import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/payload/components/ui/accordion"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group"

export default function HomePage() {
  return (
    <div className="flex min-h-screen flex-col">
      {/* Hero Section */}
      <section className="relative h-[300px] w-full md:h-[400px]">
        <div className="absolute inset-0 z-10 bg-black/40" />
        <Image
          src="/images/placeholder.svg?height=400&width=600"
          alt="Delicious food background"
          fill
          className="object-cover"
          priority
        />
        <div className="relative z-20 container mx-auto flex h-full flex-col items-center justify-center px-4 text-white">
          <h1 className="mb-2 text-3xl font-bold md:text-4xl">foodie</h1>
          <p className="mb-6 text-center text-lg md:text-xl">Discover the best food & drinks in your city</p>
          <div className="w-full max-w-3xl">
            <div className="mb-3 flex items-center rounded-md bg-white p-2">
              <MapPin className="mr-1 ml-2 flex-shrink-0 text-red-500" />
              <Input
                placeholder="Saket Nagar Colony, Sankata Mochan Express, Varanasi"
                className="border-0 text-black focus-visible:ring-0"
              />
              <ChevronDown className="mr-2 flex-shrink-0 text-gray-400" />
            </div>
            <div className="flex items-center rounded-md bg-white p-2">
              <Search className="mr-1 ml-2 flex-shrink-0 text-gray-400" />
              <Input placeholder="Search for restaurant, cuisine or a dish" className="border-0 text-black focus-visible:ring-0" />
            </div>
          </div>
        </div>
      </section>

      {/* Service Categories */}
      <section className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <div className="overflow-hidden rounded-lg border shadow-sm">
            <div className="relative h-48">
              <Image src="/placeholder.svg?height=400&width=600" alt="Order Online" fill className="object-cover" />
            </div>
            <div className="p-4">
              <h3 className="mb-1 text-lg font-semibold">Order Online</h3>
              <p className="text-muted-foreground">Stay home and order to your doorstep</p>
            </div>
          </div>
          <div className="overflow-hidden rounded-lg border shadow-sm">
            <div className="relative h-48">
              <Image src="/placeholder.svg?height=400&width=600" alt="Dining" fill className="object-cover" />
            </div>
            <div className="p-4">
              <h3 className="mb-1 text-lg font-semibold">Dining</h3>
              <p className="text-muted-foreground">View the city&apos;s favorite dining venues</p>
            </div>
          </div>
        </div>
      </section>

      {/* Collections */}
      <section className="container mx-auto px-4 py-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="mb-1 text-2xl font-bold">Collections</h2>
            <p className="text-muted-foreground">Explore curated lists of top restaurants, cafes, pubs, and bars, based on trends</p>
          </div>
          <Link href="#" className="flex items-center text-red-500">
            All collections <ChevronRight className="h-4 w-4" />
          </Link>
        </div>
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {[
            { title: "Fine Veg Places", count: 23 },
            { title: "Must-Visit Restaurants", count: 14 },
            { title: "Best Breakfast Places", count: 10 },
            { title: "Best Family Friendly Places", count: 11 },
          ].map((collection, index) => (
            <Link href="#" key={index} className="group relative overflow-hidden rounded-lg">
              <div className="absolute inset-0 z-10 bg-gradient-to-t from-black/70 to-black/20" />
              <Image
                src={`/placeholder.svg?height=300&width=300`}
                alt={collection.title}
                width={300}
                height={300}
                className="aspect-square w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
              <div className="absolute bottom-0 left-0 z-20 p-4 text-white">
                <h3 className="font-semibold">{collection.title}</h3>
                <p className="text-sm">{collection.count} places</p>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Popular Localities */}

      {/* App Download */}
      <section className="container mx-auto px-4 py-12">
        <div className="mx-auto flex max-w-4xl flex-col items-center gap-8 md:flex-row">
          <div className="md:w-1/2">
            <Image src="/placeholder.svg?height=500&width=300" alt="Mobile app" width={300} height={500} className="mx-auto" />
          </div>
          <div className="md:w-1/2">
            <h2 className="mb-4 text-2xl font-bold md:text-3xl">Get the Foodie app</h2>
            <p className="text-muted-foreground mb-6">We will send you a link, open it on your phone to download the app</p>
            <div className="mb-6">
              <RadioGroup defaultValue="email" className="flex gap-6">
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="email" id="email" />
                  <Label htmlFor="email">Email</Label>
                </div>
                <div className="flex items-center space-x-2">
                  <RadioGroupItem value="phone" id="phone" />
                  <Label htmlFor="phone">Phone</Label>
                </div>
              </RadioGroup>
            </div>
            <div className="flex gap-2">
              <Input placeholder="Email" className="flex-grow" />
              <Button className="bg-red-500 text-white hover:bg-red-600">Share App Link</Button>
            </div>
            <div className="mt-6">
              <p className="text-muted-foreground mb-3 text-sm">Download app from</p>
              <div className="flex gap-4">
                <Link href="#">
                  <Image src="/placeholder.svg?height=40&width=120" alt="Google Play" width={120} height={40} />
                </Link>
                <Link href="#">
                  <Image src="/placeholder.svg?height=40&width=120" alt="App Store" width={120} height={40} />
                </Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Explore Options */}
      <section className="container mx-auto bg-gray-50 px-4 py-8">
        <h2 className="mb-6 text-2xl font-bold">Explore options near me</h2>
        <div className="mx-auto max-w-3xl">
          {/* <Accordion type="single" collapsible className="w-full">
            {["Popular cuisines near me", "Popular restaurant types near me", "Top restaurant chains", "Cities we deliver to"].map(
              (item, index) => (
                <AccordionItem value={`item-${index}`} key={index}>
                  <AccordionTrigger className="py-4">{item}</AccordionTrigger>
                  <AccordionContent>
                    <div className="grid grid-cols-2 gap-2 py-2 md:grid-cols-3">
                      {Array.from({ length: 6 }).map((_, i) => (
                        <Link href="#" key={i} className="text-muted-foreground hover:text-foreground">
                          Example Link {i + 1}
                        </Link>
                      ))}
                    </div>
                  </AccordionContent>
                </AccordionItem>
              )
            )}
          </Accordion> */}
        </div>
      </section>
    </div>
  )
}
