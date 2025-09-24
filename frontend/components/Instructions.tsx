"use client";

import { useKeenSlider } from "keen-slider/react";
import "keen-slider/keen-slider.min.css";
import {
  Card,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { useEffect, useRef } from "react";

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
    video: "join.mov",
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

export function Instructions() {
  const teacherVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);
  const studentVideoRefs = useRef<(HTMLVideoElement | null)[]>([]);

  // Teacher slider
  const [teacherRef, teacherSlider] = useKeenSlider<HTMLDivElement>({
    slides: { perView: 1, spacing: 16 },
    loop: true,
  });

  // Student slider
  const [studentRef, studentSlider] = useKeenSlider<HTMLDivElement>({
    slides: { perView: 1, spacing: 16 },
    loop: true,
  });

  // Teacher autoplay
  useEffect(() => {
    if (!teacherSlider?.current) return;
    teacherSlider.current.on("slideChanged", (s) => {
      teacherVideoRefs.current.forEach((v, idx) => {
        if (!v) return;
        if (idx === s.track.details.rel) {
          v.currentTime = 0;
          v.play().catch(() => {});
        } else v.pause();
      });
    });
  }, [teacherSlider]);

  // Student autoplay
  useEffect(() => {
    if (!studentSlider?.current) return;
    studentSlider.current.on("slideChanged", (s) => {
      studentVideoRefs.current.forEach((v, idx) => {
        if (!v) return;
        if (idx === s.track.details.rel) {
          v.currentTime = 0;
          v.play().catch(() => {});
        } else v.pause();
      });
    });
  }, [studentSlider]);

  return (
    <section className="py-20">
      <div className="container">
        <h2 className="text-3xl font-bold text-center mb-8">Зааварчилгаа</h2>

        <Tabs defaultValue="teacher" className="w-full">
          <TabsList className="flex w-full bg-white items-center justify-center mb-6">
            <TabsTrigger value="teacher">Багш</TabsTrigger>
            <TabsTrigger value="student">Оюутан</TabsTrigger>
          </TabsList>

          {/* Teacher Instructions */}
          <TabsContent value="teacher">
            <div className="relative">
              <div ref={teacherRef} className="keen-slider">
                {teacherSteps.map((step, i) => (
                  <div key={i} className="keen-slider__slide p-4">
                    <Card className="p-6 text-center">
                      <CardHeader>
                        <CardTitle>{step.title}</CardTitle>
                        <CardDescription>{step.desc}</CardDescription>
                      </CardHeader>
                      {step.video && (
                        <video
                          ref={(el) => {
                            teacherVideoRefs.current[i] = el;
                          }}
                          src={step.video}
                          controls
                          className="w-full aspect-video rounded-lg shadow-md"
                        />
                      )}
                    </Card>
                  </div>
                ))}
              </div>

              {/* Navigation Buttons */}
              <button
                className="absolute top-1/2 left-0 -translate-y-1/2 bg-white p-3 rounded-full shadow-md"
                onClick={() => teacherSlider.current?.prev()}
              >
                ◀
              </button>
              <button
                className="absolute top-1/2 right-0 -translate-y-1/2 bg-white p-3 rounded-full shadow-md"
                onClick={() => teacherSlider.current?.next()}
              >
                ▶
              </button>
            </div>
          </TabsContent>

          {/* Student Instructions */}
          <TabsContent value="student">
            <div className="relative">
              <div ref={studentRef} className="keen-slider">
                {studentSteps.map((step, i) => (
                  <div key={i} className="keen-slider__slide p-4">
                    <Card className="p-6 text-center">
                      <CardHeader>
                        <CardTitle>{step.title}</CardTitle>
                        <CardDescription>{step.desc}</CardDescription>
                      </CardHeader>
                      {step.video && (
                        <video
                          ref={(el) => {
                            studentVideoRefs.current[i] = el;
                          }}
                          src={step.video}
                          controls
                          className="w-full aspect-video rounded-lg shadow-md mt-4"
                        />
                      )}
                    </Card>
                  </div>
                ))}
              </div>

              {/* Navigation Buttons */}
              <button
                className="absolute top-1/2 left-0 -translate-y-1/2 bg-white p-3 rounded-full shadow-md"
                onClick={() => studentSlider.current?.prev()}
              >
                ◀
              </button>
              <button
                className="absolute top-1/2 right-0 -translate-y-1/2 bg-white p-3 rounded-full shadow-md"
                onClick={() => studentSlider.current?.next()}
              >
                ▶
              </button>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </section>
  );
}
