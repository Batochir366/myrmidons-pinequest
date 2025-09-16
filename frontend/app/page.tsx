import Link from "next/link";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  QrCode,
  Users,
  BarChart3,
  Shield,
  Clock,
  CheckCircle,
} from "lucide-react";
import { Navigation } from "@/components/Navigation";

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-background flex justify-center flex-col items-center px-4 md:px-0">
      <Navigation />

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="container">
          <div className="mx-auto max-w-4xl text-center">
            <h1 className="text-4xl font-bold tracking-tight text-balance sm:text-6xl lg:text-7xl">
              Хялбар, хурдан ирцээ өгөх шийдэл
            </h1>
            <p className="mt-6 text-lg leading-8 text-muted-foreground text-pretty max-w-2xl mx-auto">
              QR кодын тусламжтайгаар ирцээ хурдан аваарай. Сургууль, олон
              нийтийн арга хэмжээ, эвентэд тохиромжтой.
            </p>
          </div>
        </div>

        {/* Hero Image */}
        <div className="mt-16 flow-root sm:mt-24">
          <div className="relative mx-auto max-w-5xl">
            <img
              src="https://media.istockphoto.com/id/1171806748/photo/aerial-phto-of-palma-de-mallorca-coastal-seaside.jpg?s=612x612&w=0&k=20&c=u2eOoY7cd_Q6eiML0GPUobEUVe3vixEhK3kUSwS0HNU="
              alt="AttendanceTracker Dashboard"
              className="rounded-xl shadow-2xl ring-1 ring-border w-full"
            />
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="container">
          <div className="mx-auto max-w-3xl text-center">
            <h2 className="text-3xl font-bold tracking-tight sm:text-4xl text-balance">
              Ирцийн бүртгэлд хэрэгтэй бүх шийдэл
            </h2>
            <p className="mt-4 text-lg text-muted-foreground text-pretty">
              Ирцийн бүртгэлийг хялбар, үнэн зөв болгох зориулалттай хүчирхэг
              боломжууд.
            </p>
          </div>

          <div className="mx-auto mt-16 max-w-6xl">
            <div className="grid grid-cols-1 gap-8 sm:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <QrCode className="h-10 w-10 text-primary" />
                  <CardTitle>QR код үүсгэх</CardTitle>
                  <CardDescription>
                    Тус бүрийн хичээл, үйл ажиллагаанд зориулсан давтагдашгүй QR
                    код үүсгэнэ.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Users className="h-10 w-10 text-primary" />
                  <CardTitle>Бодит цагийн хяналт</CardTitle>
                  <CardDescription>
                    Ирц өгч байгаа оюутнуудыг шууд харах боломжтой.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <BarChart3 className="h-10 w-10 text-primary" />
                  <CardTitle>Ирцийн мэдээлэл</CardTitle>
                  <CardDescription>
                    Хичээл, сургалт дууссаны дараа ирцийн мэдээлэл харах
                    боломжтой.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Shield className="h-10 w-10 text-primary" />
                  <CardTitle>Хамгаалалт ба нууцлал</CardTitle>
                  <CardDescription>
                    QR код 5 секунд тутамд шинэчлэгдэнэ.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <Clock className="h-10 w-10 text-primary" />
                  <CardTitle>Цагийн хэмнэлт</CardTitle>
                  <CardDescription>
                    Бүртгэлд биечлэн нэр дуудахаа больсноор цаг хэмнэнэ.
                  </CardDescription>
                </CardHeader>
              </Card>

              <Card>
                <CardHeader>
                  <CheckCircle className="h-10 w-10 text-primary" />
                  <CardTitle>Энгийн, ойлгомжтой</CardTitle>
                  <CardDescription>
                    Хэн ч ашиглахад энгийн, ойлгомжтой
                  </CardDescription>
                </CardHeader>
              </Card>
            </div>
          </div>
        </div>
      </section>

      <footer className="border-t bg-muted/30 w-full flex items-center justify-center">
        <div className="container py-12">
          <div className="flex flex-col items-center justify-between gap-4 md:flex-row">
            <div className="flex items-center gap-2">
              <QrCode className="h-5 w-5 text-primary" />
              <span className="font-semibold">AttendanceTracker</span>
            </div>
            <div className="flex gap-6 text-sm text-muted-foreground">
              <Link href="#" className="hover:text-foreground">
                Privacy Policy
              </Link>
              <Link href="#" className="hover:text-foreground">
                Terms of Service
              </Link>
              <Link href="#" className="hover:text-foreground">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
