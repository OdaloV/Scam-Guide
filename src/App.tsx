import { useState, useRef, ChangeEvent } from "react";
import { Shield, ShieldAlert, ShieldCheck, ShieldQuestion, MessageSquare, Mic, History, Trash2, Upload, Loader2, AlertTriangle, CheckCircle2, Info } from "lucide-react";
import { motion, AnimatePresence } from "motion/react";
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { Progress } from "@/components/ui/progress";
import { ScrollArea } from "@/components/ui/scroll-area";
import { analyzeText, analyzeAudio, ScamAnalysisResult } from "./services/gemini";
import { cn } from "@/lib/utils";

interface ScanHistoryItem extends ScamAnalysisResult {
  id: string;
  timestamp: number;
  type: "text" | "audio";
  content: string;
}

export default function App() {
  const [text, setText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [result, setResult] = useState<ScamAnalysisResult | null>(null);
  const [history, setHistory] = useState<ScanHistoryItem[]>([]);
  const [audioFile, setAudioFile] = useState<File | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleTextAnalysis = async () => {
    if (!text.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeText(text);
      setResult(res);
      const historyItem: ScanHistoryItem = {
        ...res,
        id: Math.random().toString(36).substring(7),
        timestamp: Date.now(),
        type: "text",
        content: text.length > 100 ? text.substring(0, 100) + "..." : text
      };
      setHistory(prev => [historyItem, ...prev]);
    } catch (error) {
      console.error(error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleAudioUpload = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setAudioFile(file);
    }
  };

  const handleAudioAnalysis = async () => {
    if (!audioFile) return;
    setIsAnalyzing(true);
    try {
      const reader = new FileReader();
      reader.readAsDataURL(audioFile);
      reader.onload = async () => {
        const base64Data = (reader.result as string).split(",")[1];
        const res = await analyzeAudio(base64Data, audioFile.type);
        setResult(res);
        const historyItem: ScanHistoryItem = {
          ...res,
          id: Math.random().toString(36).substring(7),
          timestamp: Date.now(),
          type: "audio",
          content: `Audio file: ${audioFile.name}`
        };
        setHistory(prev => [historyItem, ...prev]);
        setIsAnalyzing(false);
      };
    } catch (error) {
      console.error(error);
      setIsAnalyzing(false);
    }
  };

  const clearHistory = () => setHistory([]);

  const getRiskColor = (level: string) => {
    switch (level) {
      case "Low": return "text-green-500 bg-green-500/10 border-green-500/20";
      case "Medium": return "text-yellow-500 bg-yellow-500/10 border-yellow-500/20";
      case "High": return "text-orange-500 bg-orange-500/10 border-orange-500/20";
      case "Critical": return "text-red-500 bg-red-500/10 border-red-500/20";
      default: return "text-gray-500 bg-gray-500/10 border-gray-500/20";
    }
  };

  const getRiskIcon = (level: string) => {
    switch (level) {
      case "Low": return <ShieldCheck className="w-5 h-5" />;
      case "Medium": return <ShieldQuestion className="w-5 h-5" />;
      case "High": return <ShieldAlert className="w-5 h-5" />;
      case "Critical": return <AlertTriangle className="w-5 h-5" />;
      default: return <Shield className="w-5 h-5" />;
    }
  };

  return (
    <div className="min-h-screen bg-[#F8F9FA] dark:bg-[#0A0A0A] text-foreground p-4 md:p-8">
      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Header & Main Section */}
        <div className="lg:col-span-2 space-y-8">
          <header className="flex items-center gap-4 mb-8">
            <div className="p-3 bg-primary rounded-2xl shadow-lg shadow-primary/20">
              <Shield className="w-8 h-8 text-primary-foreground" />
            </div>
            <div>
              <h1 className="text-3xl font-bold tracking-tight">ScamGuard AI</h1>
              <p className="text-muted-foreground">Advanced fraud detection for your safety</p>
            </div>
          </header>

          <Tabs defaultValue="text" className="w-full">
            <TabsList className="grid w-full grid-cols-2 mb-8 p-1 bg-muted/50 rounded-xl">
              <TabsTrigger value="text" className="rounded-lg py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <MessageSquare className="w-4 h-4 mr-2" />
                Text Message
              </TabsTrigger>
              <TabsTrigger value="audio" className="rounded-lg py-3 data-[state=active]:bg-background data-[state=active]:shadow-sm">
                <Mic className="w-4 h-4 mr-2" />
                Audio File
              </TabsTrigger>
            </TabsList>

            <TabsContent value="text" className="mt-0">
              <Card className="border-none shadow-xl shadow-black/5 overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle>Analyze Message</CardTitle>
                  <CardDescription>Paste the suspicious text message, email, or social media post below.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <Textarea 
                    placeholder="Example: 'Congratulations! You've won a $1000 gift card. Click here to claim...'"
                    className="min-h-[200px] resize-none bg-muted/30 border-muted focus-visible:ring-primary/20 text-lg p-4"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                  />
                  <Button 
                    className="w-full h-12 text-lg font-semibold rounded-xl transition-all active:scale-[0.98]"
                    onClick={handleTextAnalysis}
                    disabled={isAnalyzing || !text.trim()}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Analyzing Patterns...
                      </>
                    ) : (
                      "Scan for Scams"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="audio" className="mt-0">
              <Card className="border-none shadow-xl shadow-black/5 overflow-hidden">
                <CardHeader className="pb-4">
                  <CardTitle>Analyze Audio</CardTitle>
                  <CardDescription>Upload a voice note or recording to check for deepfakes or social engineering.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div 
                    className={cn(
                      "border-2 border-dashed rounded-2xl p-12 flex flex-col items-center justify-center transition-all cursor-pointer",
                      audioFile ? "border-primary bg-primary/5" : "border-muted hover:border-primary/50 hover:bg-muted/30"
                    )}
                    onClick={() => fileInputRef.current?.click()}
                  >
                    <input 
                      type="file" 
                      ref={fileInputRef} 
                      className="hidden" 
                      accept="audio/*" 
                      onChange={handleAudioUpload}
                    />
                    <div className="p-4 bg-background rounded-full shadow-sm mb-4">
                      {audioFile ? <CheckCircle2 className="w-8 h-8 text-primary" /> : <Upload className="w-8 h-8 text-muted-foreground" />}
                    </div>
                    <p className="font-medium text-center">
                      {audioFile ? audioFile.name : "Click to upload or drag and drop"}
                    </p>
                    <p className="text-sm text-muted-foreground mt-1">MP3, WAV, M4A (Max 10MB)</p>
                  </div>
                  <Button 
                    className="w-full h-12 text-lg font-semibold rounded-xl transition-all active:scale-[0.98]"
                    onClick={handleAudioAnalysis}
                    disabled={isAnalyzing || !audioFile}
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-5 w-5 animate-spin" />
                        Processing Audio...
                      </>
                    ) : (
                      "Scan Audio Recording"
                    )}
                  </Button>
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>

          {/* Results Section */}
          <AnimatePresence mode="wait">
            {result && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -20 }}
                className="space-y-6"
              >
                <Card className={cn(
                  "border-l-8 overflow-hidden shadow-2xl",
                  result.isScam ? "border-l-red-500" : "border-l-green-500"
                )}>
                  <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                    <div>
                      <CardTitle className="text-2xl">Analysis Verdict</CardTitle>
                      <CardDescription>AI-driven scam pattern identification</CardDescription>
                    </div>
                    <Badge variant="outline" className={cn("px-4 py-1 text-sm font-bold uppercase tracking-wider", getRiskColor(result.riskLevel))}>
                      {result.riskLevel} Risk
                    </Badge>
                  </CardHeader>
                  <CardContent className="pt-6 space-y-8">
                    <div className="flex items-center gap-6">
                      <div className={cn(
                        "p-6 rounded-3xl",
                        result.isScam ? "bg-red-500/10 text-red-500" : "bg-green-500/10 text-green-500"
                      )}>
                        {result.isScam ? <ShieldAlert className="w-12 h-12" /> : <ShieldCheck className="w-12 h-12" />}
                      </div>
                      <div className="flex-1 space-y-2">
                        <div className="flex justify-between text-sm font-medium mb-1">
                          <span>Scam Probability</span>
                          <span>{Math.round(result.confidence * 100)}%</span>
                        </div>
                        <Progress value={result.confidence * 100} className={cn(
                          "h-3",
                          result.isScam ? "[&>div]:bg-red-500" : "[&>div]:bg-green-500"
                        )} />
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
                      <div className="space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                          <AlertTriangle className="w-4 h-4 text-orange-500" />
                          Detected Patterns
                        </h3>
                        <div className="flex flex-wrap gap-2">
                          {result.patterns.map((pattern, i) => (
                            <Badge key={i} variant="secondary" className="bg-muted/50 text-foreground/80 px-3 py-1">
                              {pattern}
                            </Badge>
                          ))}
                        </div>
                        <p className="text-sm text-muted-foreground leading-relaxed">
                          {result.explanation}
                        </p>
                      </div>

                      <div className="space-y-4">
                        <h3 className="font-bold flex items-center gap-2">
                          <CheckCircle2 className="w-4 h-4 text-green-500" />
                          Safety Recommendations
                        </h3>
                        <ul className="space-y-3">
                          {result.recommendations.map((rec, i) => (
                            <li key={i} className="flex gap-3 text-sm">
                              <div className="mt-1 w-1.5 h-1.5 rounded-full bg-primary shrink-0" />
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Sidebar - History */}
        <div className="space-y-6">
          <Card className="border-none shadow-xl shadow-black/5 h-fit sticky top-8">
            <CardHeader className="flex flex-row items-center justify-between">
              <div className="flex items-center gap-2">
                <History className="w-5 h-5 text-primary" />
                <CardTitle className="text-lg">Recent Scans</CardTitle>
              </div>
              {history.length > 0 && (
                <Button variant="ghost" size="icon" onClick={clearHistory} className="h-8 w-8 text-muted-foreground hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </CardHeader>
            <CardContent>
              <ScrollArea className="h-[calc(100vh-250px)] pr-4">
                {history.length === 0 ? (
                  <div className="flex flex-col items-center justify-center py-12 text-center text-muted-foreground">
                    <ShieldQuestion className="w-12 h-12 mb-4 opacity-20" />
                    <p className="text-sm">No recent scans yet.</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {history.map((item) => (
                      <div 
                        key={item.id} 
                        className="p-4 rounded-xl bg-muted/30 border border-transparent hover:border-primary/20 transition-all cursor-pointer group"
                        onClick={() => setResult(item)}
                      >
                        <div className="flex items-center justify-between mb-2">
                          <div className="flex items-center gap-2">
                            {item.type === "text" ? <MessageSquare className="w-3 h-3 text-primary" /> : <Mic className="w-3 h-3 text-primary" />}
                            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                              {new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>
                          <Badge variant="outline" className={cn("text-[10px] h-5 px-2", getRiskColor(item.riskLevel))}>
                            {item.riskLevel}
                          </Badge>
                        </div>
                        <p className="text-xs font-medium line-clamp-2 text-foreground/80 group-hover:text-foreground transition-colors">
                          {item.content}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </ScrollArea>
            </CardContent>
            {history.length > 0 && (
              <CardFooter className="pt-0">
                <Alert className="bg-primary/5 border-primary/10 py-3">
                  <Info className="w-4 h-4 text-primary" />
                  <AlertDescription className="text-[11px] text-muted-foreground">
                    History is stored locally and cleared on refresh.
                  </AlertDescription>
                </Alert>
              </CardFooter>
            )}
          </Card>
        </div>
      </div>
    </div>
  );
}

