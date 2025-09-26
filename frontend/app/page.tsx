import { Instructions } from "@/components/Instructions";
import { Navigation } from "@/components/Navigation";
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
  Mail,
  Phone,
  MapPin,
} from "lucide-react";

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

        <Instructions />
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

      {/* Footer */}
      <footer className="w-full bg-muted/50 border-t mt-20">
        <div className="container mx-auto px-4 py-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 justify-items-center text-center">
            {/* Company Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">A +</h3>
              <p className="text-sm text-muted-foreground">
                Орчин үеийн технологийн тусламжтайгаар ирцийн бүртгэлийг
                хялбарчилсан шийдэл.
              </p>
            </div>

            {/* Contact Info */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Холбоо барих</h3>
              <div className="space-y-2 text-sm text-muted-foreground">
                <div className="flex items-center justify-center gap-2">
                  <Mail className="h-4 w-4" />
                  <span>info@qr-attendance.mn</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <Phone className="h-4 w-4" />
                  <span>+976 1234 5678</span>
                </div>
                <div className="flex items-center justify-center gap-2">
                  <MapPin className="h-4 w-4" />
                  <span>Улаанбаатар хот, Монгол улс</span>
                </div>
              </div>
            </div>

            {/* Quick Links */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Холбоос</h3>
              <div className="space-y-2 text-sm">
                <a
                  href=""
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  Тусламж
                </a>
                <a
                  href=""
                  className="block text-muted-foreground hover:text-primary transition-colors"
                >
                  Нууцлалын бодлого
                </a>
              </div>
            </div>
          </div>

          <div className="mt-8 pt-8 border-t border-border">
            <div className="text-center text-sm text-muted-foreground">
              © 2025 A+. Бүх эрх хуулиар хамгаалагдсан.
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
