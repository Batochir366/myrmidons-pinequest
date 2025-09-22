"use client";

import React from "react";
import { Navigation } from "@/components/Navigation";
import AntiSpoofTest from "@/components/AntiSpoofTest";
import AntiSpoofCamera from "@/components/AntiSpoofCamera";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { TestTube, Camera } from "lucide-react";
import { testAntiSpoofDetection } from "@/utils/testAntiSpoof";
import { runQuickTest } from "@/utils/quickTest";

export default function TestPage() {
  const handleCameraSuccess = (imageData: string) => {
    console.log("Camera test successful:", imageData.substring(0, 50) + "...");
  };

  const handleCameraError = (error: string) => {
    console.error("Camera test error:", error);
  };

  const runImageLoadingTest = async () => {
    console.log("Running image loading test...");
    try {
      const result = await testAntiSpoofDetection();
      console.log("Test result:", result);
    } catch (error) {
      console.error("Test error:", error);
    }
  };

  const runQuickDetectionTest = async () => {
    console.log("Running quick detection test...");
    try {
      const result = await runQuickTest();
      console.log("Quick test result:", result);
    } catch (error) {
      console.error("Quick test error:", error);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Navigation />

      <div className="container mx-auto py-8 px-4">
        <div className="max-w-4xl mx-auto space-y-8">
          <div className="text-center">
            <h1 className="text-3xl font-bold mb-2">
              Anti-Spoof Detection Test
            </h1>
            <p className="text-muted-foreground">
              Test the anti-spoof detection system with different scenarios
            </p>
          </div>

          <Tabs defaultValue="camera" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="camera" className="flex items-center gap-2">
                <Camera className="h-4 w-4" />
                Live Camera Test
              </TabsTrigger>
              <TabsTrigger value="mock" className="flex items-center gap-2">
                <TestTube className="h-4 w-4" />
                Mock Data Test
              </TabsTrigger>
            </TabsList>

            <TabsContent value="camera" className="space-y-6">
              <Card>
                <CardHeader>
                  <CardTitle>Live Camera Anti-Spoof Detection</CardTitle>
                  <CardDescription>
                    Test the anti-spoof detection with your actual camera feed.
                    Try different scenarios like using a photo, video, or real
                    face.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AntiSpoofCamera
                    onSuccess={handleCameraSuccess}
                    onError={handleCameraError}
                    isActive={true}
                  />
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Test Scenarios</CardTitle>
                  <CardDescription>
                    Try these scenarios to test the anti-spoof detection:
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <h4 className="font-medium text-green-600">
                        Should Pass (Live Face)
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Look directly at camera</li>
                        <li>• Blink naturally</li>
                        <li>• Move head slightly</li>
                        <li>• Ensure good lighting</li>
                      </ul>
                    </div>
                    <div className="space-y-2">
                      <h4 className="font-medium text-red-600">
                        Should Fail (Spoof)
                      </h4>
                      <ul className="text-sm text-muted-foreground space-y-1">
                        <li>• Show a printed photo</li>
                        <li>• Display video on screen</li>
                        <li>• Use a mask or mannequin</li>
                        <li>• Show a static image</li>
                      </ul>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="mock" className="space-y-6">
              <AntiSpoofTest />

              <Card>
                <CardHeader>
                  <CardTitle>Image Loading Test</CardTitle>
                  <CardDescription>
                    Test the image loading and processing functionality
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    <Button
                      onClick={runImageLoadingTest}
                      variant="outline"
                      className="w-full"
                    >
                      Run Image Loading Test
                    </Button>
                    <Button
                      onClick={runQuickDetectionTest}
                      variant="outline"
                      className="w-full"
                    >
                      Run Quick Detection Test
                    </Button>
                  </div>
                  <p className="text-sm text-muted-foreground mt-2">
                    These tests create synthetic images and test the anti-spoof
                    detection. Check the browser console for detailed results.
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Mock Data Testing</CardTitle>
                  <CardDescription>
                    Test the detection algorithms with simulated image data.
                    This helps verify the core detection logic without camera
                    access.
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <h4 className="font-medium text-blue-900 mb-2">
                        Quick Test
                      </h4>
                      <p className="text-sm text-blue-700">
                        Fast detection using simplified algorithms. Good for
                        basic validation.
                      </p>
                    </div>

                    <div className="p-4 bg-green-50 rounded-lg">
                      <h4 className="font-medium text-green-900 mb-2">
                        Comprehensive Test
                      </h4>
                      <p className="text-sm text-green-700">
                        Full analysis including all detection methods. Provides
                        detailed results with confidence scores and specific
                        reasons for detection decisions.
                      </p>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          <Card>
            <CardHeader>
              <CardTitle>Detection Methods</CardTitle>
              <CardDescription>
                The anti-spoof system uses multiple detection techniques to
                achieve 80% accuracy
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                <div className="space-y-2">
                  <h4 className="font-medium">Face Detection</h4>
                  <p className="text-sm text-muted-foreground">
                    Basic face presence verification using image analysis
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Blink Detection</h4>
                  <p className="text-sm text-muted-foreground">
                    Monitors natural eye blinks to confirm liveness
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Movement Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Detects head movement between consecutive frames
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Texture Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Analyzes image texture to identify spoofing materials
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Lighting Check</h4>
                  <p className="text-sm text-muted-foreground">
                    Verifies consistent lighting across image regions
                  </p>
                </div>

                <div className="space-y-2">
                  <h4 className="font-medium">Confidence Scoring</h4>
                  <p className="text-sm text-muted-foreground">
                    Combines all methods for final liveness determination
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
