"use client";
import React, { useState, useRef, useEffect } from "react";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Step {
  title: string;
  desc: string;
  video: string;
}

interface CustomCarouselProps {
  steps: Step[];
  type: string;
}

const teacherSteps = [
  {
    title: "Sign up,Login",
    desc: "Багш бүртгүүлнэ.",
    video: "SignupTeacher.MOV",
  },
  {
    title: "Using QR PIP",
    desc: "PIP горимд ашиглаж, багш өөр таб руу шилжсэн ч QR кодыг харуулна.",
    video: "/TeacherQRPIP.MOV",
  },
  {
    title: "See attendance history",
    desc: "Өнгөрсөн ирцийн мэдээллээ харах боломжтой.",
    video: "See.MOV",
  },
];

const studentSteps = [
  {
    title: "Sign up & Join classroom",
    desc: "Оюутан бүртгүүлээд ангидаа нэгдэнэ.",
    video: "Joinshuud.MOV",
  },
  {
    title: "Sign up only",
    desc: "Зөвхөн бүртгүүлээд дараа ангидаа нэгдэх боломжтой.",
    video: "join.MOV",
  },
  {
    title: "Trying to spoof",
    desc: "Систем хуурах оролдлого хийвэл блок болно.",
    video: "/Spoof.MOV",
  },
  {
    title: "Scan QR",
    desc: "QR код уншуулаад ирцээ бүртгүүлнэ.",
    video: "/Attend.MOV",
  },
  {
    title: "Байршлын шалгалт",
    desc: "Оюутан өөр байршлаас ирц өгөх оролдлого хийвэл систем таныг илрүүлнэ.",
    video: "/Location.MOV",
  },
];

const CustomCarousel: React.FC<CustomCarouselProps> = ({ steps, type }) => {
  const [currentSlide, setCurrentSlide] = useState<number>(0);
  const [isTransitioning, setIsTransitioning] = useState<boolean>(false);
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const touchStartX = useRef<number>(0);
  const touchEndX = useRef<number>(0);

  const nextSlide = (): void => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev + 1) % steps.length);
  };

  const prevSlide = (): void => {
    if (isTransitioning) return;
    setIsTransitioning(true);
    setCurrentSlide((prev) => (prev - 1 + steps.length) % steps.length);
  };

  const goToSlide = (index: number): void => {
    if (isTransitioning || index === currentSlide) return;
    setIsTransitioning(true);
    setCurrentSlide(index);
  };

  // Handle video autoplay
  useEffect(() => {
    const currentVideo = videoRefs.current[currentSlide];

    // Pause all videos
    videoRefs.current.forEach((video, index) => {
      if (video && index !== currentSlide) {
        video.pause();
        video.currentTime = 0;
      }
    });

    // Play current video
    if (currentVideo) {
      currentVideo.currentTime = 0;
      const playPromise = currentVideo.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Auto-play was prevented, user interaction required
        });
      }
    }

    // Reset transition state
    const timer = setTimeout(() => setIsTransitioning(false), 300);
    return () => clearTimeout(timer);
  }, [currentSlide]);

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent<HTMLDivElement>): void => {
    // Don't start swipe if touching video controls
    const target = e.target as HTMLElement;
    if (target.tagName === "VIDEO" || target.closest("video")) {
      return;
    }
    touchStartX.current = e.touches[0].clientX;
  };

  const handleTouchMove = (e: React.TouchEvent<HTMLDivElement>): void => {
    // Don't handle move if touching video
    const target = e.target as HTMLElement;
    if (target.tagName === "VIDEO" || target.closest("video")) {
      return;
    }
    touchEndX.current = e.touches[0].clientX;
  };

  const handleTouchEnd = (): void => {
    const deltaX = touchStartX.current - touchEndX.current;
    const minSwipeDistance = 50;

    if (Math.abs(deltaX) > minSwipeDistance) {
      if (deltaX > 0) {
        nextSlide();
      } else {
        prevSlide();
      }
    }
  };

  return (
    <div className="relative w-full max-w-4xl mx-auto">
      {/* Main carousel container */}
      <div
        className="relative overflow-hidden rounded-lg"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        style={{ touchAction: "pan-y pinch-zoom" }}
      >
        <div
          className="flex transition-transform duration-300 ease-out"
          style={{
            transform: `translateX(-${currentSlide * 100}%)`,
          }}
        >
          {steps.map((step, index) => (
            <div key={index} className="w-full flex-shrink-0">
              <Card className="mx-2 h-full min-h-[500px] sm:min-h-[600px]">
                <CardHeader className="text-center space-y-4">
                  <CardTitle className="text-lg sm:text-xl lg:text-2xl text-balance leading-tight px-2">
                    {step.title}
                  </CardTitle>
                  <CardDescription className="text-sm sm:text-base text-pretty leading-relaxed px-2">
                    {step.desc}
                  </CardDescription>
                </CardHeader>

                {step.video && (
                  <div className="px-4 pb-6 flex-1 flex items-center">
                    <div className="relative w-full aspect-video bg-muted rounded-md overflow-hidden max-w-full">
                      <video
                        ref={(el: HTMLVideoElement | null) => {
                          videoRefs.current[index] = el;
                        }}
                        src={step.video}
                        controls
                        controlsList="nodownload"
                        className="w-full h-full object-contain touch-manipulation"
                        playsInline
                        preload="metadata"
                        poster=""
                        style={{
                          touchAction: "manipulation",
                          WebkitTouchCallout: "none",
                          WebkitUserSelect: "none",
                        }}
                      />
                    </div>
                  </div>
                )}
              </Card>
            </div>
          ))}
        </div>
      </div>

      {/* Navigation arrows */}
      <button
        onClick={prevSlide}
        disabled={isTransitioning}
        className="absolute left-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-2 sm:p-3 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 z-10 disabled:opacity-50"
        aria-label="Previous slide"
      >
        <ChevronLeft className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      <button
        onClick={nextSlide}
        disabled={isTransitioning}
        className="absolute right-2 top-1/2 -translate-y-1/2 bg-white/90 dark:bg-gray-800/90 backdrop-blur-sm border border-gray-200 dark:border-gray-700 p-2 sm:p-3 rounded-full shadow-lg hover:bg-white dark:hover:bg-gray-800 transition-all duration-200 z-10 disabled:opacity-50"
        aria-label="Next slide"
      >
        <ChevronRight className="w-4 h-4 sm:w-5 sm:h-5" />
      </button>

      {/* Dots indicator */}
      <div className="flex justify-center space-x-2 mt-6">
        {steps.map((_, index) => (
          <button
            key={index}
            onClick={() => goToSlide(index)}
            disabled={isTransitioning}
            className={`w-2 h-2 sm:w-3 sm:h-3 rounded-full transition-all duration-200 ${
              index === currentSlide
                ? "bg-primary scale-110"
                : "bg-gray-300 dark:bg-gray-600 hover:bg-gray-400 dark:hover:bg-gray-500"
            }`}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Mobile swipe hint */}
      <div className="text-center mt-4 text-xs text-muted-foreground sm:hidden">
        Swipe left or right to navigate
      </div>
    </div>
  );
};

export function Instructions() {
  return (
    <section className="py-8 sm:py-12 lg:py-20">
      <div className="container mx-auto px-4">
        <h2 className="text-2xl sm:text-3xl lg:text-4xl font-bold text-center mb-8 sm:mb-12 text-balance">
          Зааварчилгаа
        </h2>

        <Tabs defaultValue="teacher" className="w-full">
          <TabsList className="grid w-full grid-cols-2 bg-muted mb-8 max-w-sm mx-auto h-12">
            <TabsTrigger
              className="text-sm lg:text-base px-4 py-2 cursor-pointer"
              value="teacher"
            >
              Багш
            </TabsTrigger>
            <TabsTrigger
              className="text-sm lg:text-base px-4 py-2 cursor-pointer"
              value="student"
            >
              Оюутан
            </TabsTrigger>
          </TabsList>

          <TabsContent value="teacher" className="mt-8">
            <CustomCarousel steps={teacherSteps} type="teacher" />
          </TabsContent>

          <TabsContent value="student" className="mt-8">
            <CustomCarousel steps={studentSteps} type="student" />
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
