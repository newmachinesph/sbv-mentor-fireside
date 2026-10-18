"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import { Navbar } from "@/components/navbar";
import { Footer } from "@/components/footer";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import {
  Search,
  Star,
  Users,
  CalendarCheck,
  Wrench,
  Package,
  Briefcase,
  Rocket,
  Palette,
  DollarSign,
  ChevronLeft,
  ChevronRight,
} from "lucide-react";

type ExpertiseCategory =
  | "technical"
  | "product"
  | "business"
  | "growth"
  | "design"
  | "fundraising";

interface MentorListItem {
  id: string;
  name: string;
  title: string;
  company: string;
  avatar: string | null;
  bio: string;
  expertise: ExpertiseCategory[];
  skills: string[];
  rating: number;
  totalSessions: number;
  featured: boolean;
  socialLinks: { linkedin?: string; twitter?: string; website?: string };
  location: string | null;
}

const expertiseColors: Record<ExpertiseCategory, string> = {
  technical: "bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300",
  product:
    "bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300",
  business:
    "bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-300",
  growth:
    "bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-300",
  design: "bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-300",
  fundraising:
    "bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-300",
};

const expertiseIcons: Record<ExpertiseCategory, React.ElementType> = {
  technical: Wrench,
  product: Package,
  business: Briefcase,
  growth: Rocket,
  design: Palette,
  fundraising: DollarSign,
};

const categoryFilters: { value: "all" | ExpertiseCategory; label: string }[] = [
  { value: "all", label: "All Mentors" },
  { value: "technical", label: "Technical" },
  { value: "product", label: "Product" },
  { value: "business", label: "Business" },
  { value: "growth", label: "Growth" },
  { value: "design", label: "Design" },
  { value: "fundraising", label: "Fundraising" },
];

const MENTORS_PER_PAGE = 12;

function StarRating({ rating }: { rating: number }) {
  return (
    <div className="flex items-center gap-1">
      {Array.from({ length: 5 }).map((_, i) => (
        <Star
          key={i}
          className={`h-3.5 w-3.5 ${
            i < Math.floor(rating)
              ? "fill-yellow-400 text-yellow-400"
              : i < rating
                ? "fill-yellow-400/50 text-yellow-400"
                : "text-muted-foreground/30"
          }`}
        />
      ))}
      <span className="ml-1 text-sm font-medium">{rating.toFixed(1)}</span>
    </div>
  );
}

export default function MentorsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [activeFilter, setActiveFilter] = useState<"all" | ExpertiseCategory>("all");
  const [currentPage, setCurrentPage] = useState(1);
  const [mentors, setMentors] = useState<MentorListItem[]>([]);
  const [totalCount, setTotalCount] = useState(0);
  const [loading, setLoading] = useState(true);

  const totalPages = Math.ceil(totalCount / MENTORS_PER_PAGE);

  const fetchMentors = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({
        page: currentPage.toString(),
        limit: MENTORS_PER_PAGE.toString(),
      });
      if (activeFilter !== "all") params.set("expertise", activeFilter);
      if (searchQuery) params.set("search", searchQuery);

      const res = await fetch(`/api/mentors?${params}`);
      const data = await res.json();

      if (res.ok) {
        setMentors(data.mentors);
        setTotalCount(data.totalCount);
      }
    } catch (error) {
      console.error("Failed to fetch mentors:", error);
    } finally {
      setLoading(false);
    }
  }, [currentPage, activeFilter, searchQuery]);

  useEffect(() => {
    fetchMentors();
  }, [fetchMentors]);

  const handleFilterChange = (value: "all" | ExpertiseCategory) => {
    setActiveFilter(value);
    setCurrentPage(1);
  };

  const handleSearchChange = (value: string) => {
    setSearchQuery(value);
    setCurrentPage(1);
  };

  return (
    <div className="min-h-screen">
      <Navbar />

      {/* Header */}
      <section className="border-b bg-gradient-to-b from-primary/5 to-background">
        <div className="container mx-auto px-4 py-12 md:py-16">
          <div className="mx-auto max-w-3xl text-center">
            <h1 className="mb-4 text-3xl font-bold tracking-tight md:text-5xl">
              Browse Mentors
            </h1>
            <p className="mb-8 text-lg text-muted-foreground">
              Connect with experienced professionals across tech, product,
              business, growth, design, and fundraising.
            </p>

            {/* Search */}
            <div className="relative mx-auto max-w-xl">
              <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                placeholder="Search by name, skill, or company..."
                className="pl-10"
                value={searchQuery}
                onChange={(e) => handleSearchChange(e.target.value)}
              />
            </div>
          </div>
        </div>
      </section>

      {/* Filters + Grid */}
      <section className="py-8 md:py-12">
        <div className="container mx-auto px-4">
          {/* Category Filters */}
          <div className="mb-8 flex flex-wrap gap-2">
            {categoryFilters.map((filter) => {
              const isActive = activeFilter === filter.value;
              return (
                <Button
                  key={filter.value}
                  variant={isActive ? "default" : "outline"}
                  size="sm"
                  onClick={() => handleFilterChange(filter.value)}
                  className="gap-1.5"
                >
                  {filter.value !== "all" && (() => {
                    const Icon = expertiseIcons[filter.value];
                    return <Icon className="h-3.5 w-3.5" />;
                  })()}
                  {filter.label}
                </Button>
              );
            })}
          </div>

          {/* Results Count */}
          {!loading && (
            <p className="mb-6 text-sm text-muted-foreground">
              {totalCount > 0 ? (
                <>
                  Showing {(currentPage - 1) * MENTORS_PER_PAGE + 1}&ndash;{Math.min(currentPage * MENTORS_PER_PAGE, totalCount)} of{" "}
                  {totalCount} mentor{totalCount !== 1 ? "s" : ""}
                </>
              ) : (
                "No mentors found"
              )}
              {activeFilter !== "all" && (
                <span>
                  {" "}in{" "}
                  <span className="font-medium capitalize text-foreground">
                    {activeFilter}
                  </span>
                </span>
              )}
              {searchQuery && (
                <span>
                  {" "}matching{" "}
                  <span className="font-medium text-foreground">
                    &quot;{searchQuery}&quot;
                  </span>
                </span>
              )}
            </p>
          )}

          {/* Loading State */}
          {loading ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {Array.from({ length: 8 }).map((_, i) => (
                <Card key={i} className="animate-pulse">
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <div className="h-12 w-12 rounded-full bg-muted" />
                      <div className="flex-1 space-y-2">
                        <div className="h-4 w-3/4 rounded bg-muted" />
                        <div className="h-3 w-1/2 rounded bg-muted" />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex gap-2">
                      <div className="h-5 w-16 rounded-full bg-muted" />
                      <div className="h-5 w-14 rounded-full bg-muted" />
                    </div>
                    <div className="flex gap-1">
                      <div className="h-5 w-20 rounded bg-muted" />
                      <div className="h-5 w-16 rounded bg-muted" />
                    </div>
                    <div className="h-8 w-full rounded bg-muted" />
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : mentors.length > 0 ? (
            <div className="grid gap-6 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
              {mentors.map((mentor) => (
                <Card
                  key={mentor.id}
                  className="group relative transition-all hover:shadow-lg"
                >
                  {mentor.featured && (
                    <div className="absolute right-4 top-4">
                      <Badge variant="secondary" className="text-xs">
                        Featured
                      </Badge>
                    </div>
                  )}
                  <CardHeader className="pb-3">
                    <div className="flex items-start gap-3">
                      <Avatar className="h-12 w-12">
                        <AvatarImage
                          src={mentor.avatar || undefined}
                          alt={mentor.name}
                        />
                        <AvatarFallback className="text-sm font-semibold">
                          {mentor.name
                            .split(" ")
                            .map((n) => n[0])
                            .join("")}
                        </AvatarFallback>
                      </Avatar>
                      <div className="min-w-0 flex-1">
                        <CardTitle className="text-base leading-tight">
                          {mentor.name}
                        </CardTitle>
                        <CardDescription className="mt-0.5 text-xs leading-tight">
                          {mentor.title}
                        </CardDescription>
                        <p className="mt-0.5 text-xs font-medium text-muted-foreground">
                          {mentor.company}
                        </p>
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    {/* Expertise Badges */}
                    <div className="flex flex-wrap gap-1.5">
                      {(mentor.expertise as ExpertiseCategory[]).map((exp) => (
                        <span
                          key={exp}
                          className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${expertiseColors[exp]}`}
                        >
                          {exp.charAt(0).toUpperCase() + exp.slice(1)}
                        </span>
                      ))}
                    </div>

                    {/* Skills Preview */}
                    <div className="flex flex-wrap gap-1">
                      {(mentor.skills as string[]).slice(0, 3).map((skill) => (
                        <Badge
                          key={skill}
                          variant="outline"
                          className="text-[10px]"
                        >
                          {skill}
                        </Badge>
                      ))}
                      {(mentor.skills as string[]).length > 3 && (
                        <Badge variant="outline" className="text-[10px]">
                          +{(mentor.skills as string[]).length - 3}
                        </Badge>
                      )}
                    </div>

                    {/* Rating + Sessions */}
                    <div className="flex items-center justify-between">
                      <StarRating rating={mentor.rating} />
                      <div className="flex items-center gap-1 text-xs text-muted-foreground">
                        <Users className="h-3 w-3" />
                        <span>{mentor.totalSessions}</span>
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-2 pt-1">
                      <Button size="sm" className="flex-1" asChild>
                        <Link href={`/mentors/${mentor.id}`}>
                          <CalendarCheck className="mr-1.5 h-3.5 w-3.5" />
                          Book Session
                        </Link>
                      </Button>
                      <Button size="sm" variant="outline" asChild>
                        <Link href={`/mentors/${mentor.id}`}>Profile</Link>
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="py-20 text-center">
              <Search className="mx-auto mb-4 h-12 w-12 text-muted-foreground/30" />
              <h3 className="mb-2 text-lg font-semibold">No mentors found</h3>
              <p className="text-sm text-muted-foreground">
                {searchQuery || activeFilter !== "all"
                  ? "Try adjusting your search or filter to find mentors."
                  : "No mentors have been added yet. Check back later!"}
              </p>
              {(searchQuery || activeFilter !== "all") && (
                <Button
                  variant="outline"
                  className="mt-4"
                  onClick={() => {
                    handleSearchChange("");
                    handleFilterChange("all");
                  }}
                >
                  Clear Filters
                </Button>
              )}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="mt-10 flex items-center justify-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
              >
                <ChevronLeft className="mr-1 h-4 w-4" />
                Previous
              </Button>

              <div className="flex items-center gap-1">
                {Array.from({ length: totalPages }).map((_, i) => {
                  const page = i + 1;
                  return (
                    <Button
                      key={page}
                      variant={currentPage === page ? "default" : "outline"}
                      size="sm"
                      className="h-8 w-8 p-0"
                      onClick={() => setCurrentPage(page)}
                    >
                      {page}
                    </Button>
                  );
                })}
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
              >
                Next
                <ChevronRight className="ml-1 h-4 w-4" />
              </Button>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
}
