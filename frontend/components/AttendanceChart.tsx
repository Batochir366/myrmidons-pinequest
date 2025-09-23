"use client"

import * as React from "react"
import { CartesianGrid, Line, LineChart, XAxis, YAxis } from "recharts"
import { Button } from "@/components/ui/button"
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card"
import {
    ChartConfig,
    ChartContainer,
    ChartTooltip,
    ChartTooltipContent,
} from "@/components/ui/chart"

interface AttendanceRecord {
    id: number
    lectureName: string
    lectureDate: string
    date: string
    startTime: string
    endTime: string
    qrStartTime: string
    qrEndTime: string
    totalStudents: number
    presentStudents: number
    attendanceRate: number
    students: {
        id: number
        name: string
        code: string
        photo: string
        timestamp?: string
    }[]
}

interface AttendanceChartProps {
    data: { date: string; attendanceRate: number; presentStudents: number; totalStudents: number }[]
    attendanceData: AttendanceRecord[]
    selectedLectureName?: string | null
}

const chartConfig = {
    presentStudents: {
        label: "Ирсэн сурагчид",
        color: "var(--chart-1)",
    },
} satisfies ChartConfig

export function AttendanceChart({ data, attendanceData, selectedLectureName }: AttendanceChartProps) {
    const [selectedLecture, setSelectedLecture] = React.useState<string | null>(null)

    const uniqueLectures = React.useMemo(() => {
        const lectureMap = new Map()
        attendanceData.forEach(record => {
            if (!lectureMap.has(record.lectureName)) {
                lectureMap.set(record.lectureName, record.lectureName)
            }
        })
        return Array.from(lectureMap.values())
    }, [attendanceData])

    // attendanceData орж ирсний дараа эхний хичээлийг сонгоно
    React.useEffect(() => {
        if (selectedLectureName) {
            setSelectedLecture(selectedLectureName)
        } else if (uniqueLectures.length > 0 && !selectedLecture) {
            setSelectedLecture(uniqueLectures[0])
        }
    }, [selectedLectureName, uniqueLectures])

    const chartData = React.useMemo(() => {
        if (!selectedLecture) return []
        return attendanceData
            .filter(record => record.lectureName === selectedLecture)
            .map(record => ({
                date: record.date,
                attendanceRate: record.attendanceRate,
                presentStudents: record.presentStudents,
                totalStudents: record.totalStudents
            }))
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
    }, [selectedLecture, attendanceData])

    if (uniqueLectures.length === 0) {
        return (
            <div className="w-full text-center py-12 text-muted-foreground">
                Одоогоор ирцийн мэдээлэл алга байна.
            </div>
        )
    }

    const chartTitle = `${selectedLecture} - Ирцийн график`
    const chartDescription = `${selectedLecture} хичээлийн бүх өдрийн ирцийн мэдээлэл`

    return (
        <Card>
            <CardHeader>
                <CardTitle>{chartTitle}</CardTitle>
                <CardDescription>{chartDescription}</CardDescription>
                {/* Lecture Selection Buttons */}
                {uniqueLectures.length > 0 && (
                    <div className="px-6 py-4">
                        <div className="flex flex-wrap gap-2">
                            {uniqueLectures.map((lectureName) => {
                                const isSelected = selectedLecture === lectureName
                                return (
                                    <Button
                                        key={lectureName}
                                        variant={isSelected ? "default" : "outline"}
                                        size="sm"
                                        onClick={() => setSelectedLecture(lectureName)}
                                        className={`rounded-full font-bold ${isSelected
                                            ? "bg-slate-700 text-white hover:bg-accent hover:text-black hover:border"
                                            : "text-accent-foreground hover:bg-accent/80"
                                            }`}
                                    >
                                        {lectureName}
                                    </Button>
                                )
                            })}
                        </div>
                    </div>
                )}
            </CardHeader>
            <CardContent>
                <ChartContainer
                    config={chartConfig}
                    className="aspect-auto h-[250px] w-full"
                >
                    <LineChart
                        accessibilityLayer
                        data={chartData}
                        margin={{ left: 12, right: 12 }}
                    >
                        <CartesianGrid vertical={false} />
                        <XAxis
                            dataKey="date"
                            tickLine={false}
                            axisLine={false}
                            tickMargin={8}
                            minTickGap={32}
                            tickFormatter={(value) => {
                                const date = new Date(value)
                                return date.toLocaleDateString("en-US", {
                                    month: "short",
                                    day: "numeric",
                                })
                            }}
                        />
                        <YAxis
                            yAxisId="left"
                            orientation="left"
                            allowDecimals={false}
                            tickFormatter={(val) => `${val}`}
                            label={{
                                value: "Ирц өгсөн оюутны тоо",
                                angle: -90,
                                position: "insideCenter",
                            }}
                        />
                        <ChartTooltip
                            content={
                                <ChartTooltipContent
                                    className="w-[50px]"
                                    labelFormatter={(value) =>
                                        new Date(value).toLocaleDateString("en-US", {
                                            month: "short",
                                            day: "numeric",
                                            year: "numeric",
                                        })
                                    }
                                    formatter={(value, name) => {
                                        if (name === "presentStudents") {
                                            const data = chartData.find(d => d.date === value) || chartData[0]
                                            return [`${value}/${data?.totalStudents || 0}`, " сурагч"]
                                        }
                                        return [`${value}%`, " ирцтэй"]
                                    }}
                                />
                            }
                        />
                        <Line
                            yAxisId="left"
                            dataKey="presentStudents"
                            type="monotone"
                            stroke="var(--color-presentStudents)"
                            strokeWidth={3}
                            dot={{ r: 4 }}
                            name="presentStudents"
                        />
                    </LineChart>
                </ChartContainer>
            </CardContent>
        </Card>
    )
}
