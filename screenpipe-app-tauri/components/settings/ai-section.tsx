/* eslint-disable @next/next/no-img-element */
import { Badge } from "@/components/ui/badge";
import {
  Command,
  CommandEmpty,
  CommandGroup,
  CommandInput,
  CommandItem,
  CommandList
} from "@/components/ui/command";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Slider } from "@/components/ui/slider";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { AIProviderType, useSettings } from "@/lib/hooks/use-settings";
import { cn } from "@/lib/utils";
import { motion } from "framer-motion";
import {
  ChevronsUpDown,
  Cloud,
  Eye,
  EyeOff,
  Key,
  Loader2,
  MessageSquare,
  RefreshCw,
  Server,
  Sparkles,
  Zap
} from "lucide-react";
import React, { useEffect, useState } from "react";
import { Button } from "../ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "../ui/card";
import { Input } from "../ui/input";
import { Textarea } from "../ui/textarea";

export interface AIProviderCardProps {
  type: "screenpipe-cloud" | "openai" | "native-ollama" | "custom" | "embedded";
  title: string;
  description: string;
  imageSrc: string;
  selected: boolean;
  onClick: () => void;
  disabled?: boolean;
  warningText?: string;
  imageClassName?: string;
}

export interface OllamaModel {
  name: string;
  size: number;
  digest: string;
  modified_at: string;
}

export interface AIModel {
  id: string;
  name: string;
  provider: string;
}

export const AIProviderCard = ({
  type,
  title,
  description,
  imageSrc,
  selected,
  onClick,
  disabled,
  warningText,
  imageClassName,
}: AIProviderCardProps) => {
  return (
    <motion.div
      whileHover={{ scale: 1.02 }}
      whileTap={{ scale: 0.98 }}
      transition={{ type: "spring", stiffness: 400, damping: 17 }}
    >
      <Card
        onClick={onClick}
        className={cn(
          "flex py-4 px-4 rounded-lg hover:bg-accent transition-colors h-[145px] w-full cursor-pointer border shadow-sm",
          selected ? "border-primary border-[1.5px] bg-primary/5" : "",
          disabled && "opacity-50 cursor-not-allowed"
        )}
      >
        <CardContent className="flex flex-col p-0 w-full">
          <div className="flex items-center gap-2 mb-2">
            <div className={cn(
              "w-10 h-10 rounded-lg flex items-center justify-center",
              selected ? "bg-primary/20" : "bg-muted"
            )}>
              <img
                src={imageSrc}
                alt={title}
                className={cn(
                  "rounded-lg shrink-0 size-8",
                  type === "native-ollama" &&
                  "outline outline-gray-300 outline-1 outline-offset-2",
                  imageClassName
                )}
              />
            </div>
            <span className="text-lg font-medium truncate">{title}</span>
            {selected && (
              <Badge className="ml-auto bg-primary/20 text-primary border-none">
                已选择
              </Badge>
            )}
          </div>
          <p className="text-sm text-muted-foreground line-clamp-3">
            {description}
          </p>
          {warningText && <Badge variant="outline" className="w-fit mt-2 bg-amber-50 text-amber-700 border-amber-200">{warningText}</Badge>}
        </CardContent>
      </Card>
    </motion.div>
  );
};

const AISection = () => {
  const { settings, updateSettings, resetSetting } = useSettings();
  const [showApiKey, setShowApiKey] = React.useState(false);
  const [activeTab, setActiveTab] = useState("provider");
  const [models, setModels] = useState<AIModel[]>([]);
  const [isLoadingModels, setIsLoadingModels] = useState(false);

  // 动画变体
  const containerVariants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.06
      }
    }
  };

  const itemVariants = {
    hidden: { y: 10, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: "spring",
        stiffness: 100,
        damping: 15
      }
    }
  };

  const handleApiKeyChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    updateSettings({ openaiApiKey: e.target.value });
  };

  const handleMaxContextCharsChange = (value: number[]) => {
    updateSettings({ aiMaxContextChars: value[0] });
  };

  const handleCustomPromptChange = (
    e: React.ChangeEvent<HTMLTextAreaElement>,
  ) => {
    updateSettings({ customPrompt: e.target.value });
  };

  const handleResetCustomPrompt = () => {
    resetSetting("customPrompt");
  };

  const handleAiProviderChange = (newValue: AIProviderType) => {
    let newUrl = "";
    let newModel = settings.aiModel;

    switch (newValue) {
      case "openai":
        newUrl = "https://api.openai.com/v1";
        break;
      case "native-ollama":
        newUrl = "http://localhost:11434/v1";
        break;
      case "embedded":
        newUrl = `http://localhost:${settings.embeddedLLM.port}/v1`;
        newModel = settings.embeddedLLM.model;
        break;
      case "screenpipe-cloud":
        newUrl = "https://ai-proxy.i-f9f.workers.dev/v1";
        break;
      case "custom":
        newUrl = settings.aiUrl;
        break;
    }

    updateSettings({
      aiProviderType: newValue,
      aiUrl: newUrl,
      aiModel: newModel,
    });
  };

  const isApiKeyRequired =
    settings.aiUrl !== "https://ai-proxy.i-f9f.workers.dev/v1" &&
    settings.aiUrl !== "http://localhost:11434/v1" &&
    settings.aiUrl !== "embedded";

  const fetchModels = async () => {
    setIsLoadingModels(true);
    console.log(settings.aiProviderType, settings.openaiApiKey, settings.aiUrl);
    try {
      switch (settings.aiProviderType) {
        case "screenpipe-cloud":
          const response = await fetch(
            "https://ai-proxy.i-f9f.workers.dev/v1/models",
            {
              headers: {
                Authorization: `Bearer ${settings.user?.id || ""}`,
              },
            },
          );
          if (!response.ok) throw new Error("Failed to fetch models");
          const data = await response.json();
          setModels(data.models);
          break;

        case "native-ollama":
          const ollamaResponse = await fetch("http://localhost:11434/api/tags");
          if (!ollamaResponse.ok)
            throw new Error("Failed to fetch Ollama models");
          const ollamaData = (await ollamaResponse.json()) as {
            models: OllamaModel[];
          };
          setModels(
            (ollamaData.models || []).map((model) => ({
              id: model.name,
              name: model.name,
              provider: "ollama",
            })),
          );
          break;

        case "openai":
          setModels([
            { id: "gpt-4", name: "gpt-4", provider: "openai" },
            { id: "gpt-3.5-turbo", name: "gpt-3.5-turbo", provider: "openai" },
          ]);
          break;

        case "custom":
          try {
            const customResponse = await fetch(`${settings.aiUrl}/models`, {
              headers: settings.openaiApiKey
                ? { Authorization: `Bearer ${settings.openaiApiKey}` }
                : {},
            });
            if (!customResponse.ok)
              throw new Error("Failed to fetch custom models");
            const customData = await customResponse.json();
            console.log(customData);
            setModels(
              (customData.data || []).map((model: { id: string }) => ({
                id: model.id,
                name: model.id,
                provider: "custom",
              })),
            );
          } catch (error) {
            console.error(
              "Failed to fetch custom models, allowing manual input:",
              error,
            );
            setModels([]);
          }
          break;

        default:
          setModels([]);
      }
    } catch (error) {
      console.error(
        `Failed to fetch models for ${settings.aiProviderType}:`,
        error,
      );
      setModels([]);
    } finally {
      setIsLoadingModels(false);
    }
  };

  useEffect(() => {
    fetchModels();
  }, [settings.aiProviderType, settings.openaiApiKey, settings.aiUrl]);

  return (
    <motion.div
      className="max-w-4xl mx-auto"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      <Tabs
        defaultValue="provider"
        value={activeTab}
        onValueChange={setActiveTab}
        className="w-full"
      >
        <div className="flex justify-between items-center mb-6">
          <TabsList className="bg-muted/50">
            <TabsTrigger value="provider" className="data-[state=active]:bg-white">
              AI 服务与模型
            </TabsTrigger>
            <TabsTrigger value="prompt" className="data-[state=active]:bg-white">
              提示词配置
            </TabsTrigger>
          </TabsList>
        </div>

        <TabsContent value="provider" className="mt-0 space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-none shadow-sm bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center">
                    <Cloud className="h-4 w-4 text-primary" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">AI 提供商</CardTitle>
                    <CardDescription>选择您想要使用的 AI 服务提供商</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <AIProviderCard
                    type="openai"
                    title="OpenAI"
                    description="使用您自己的 OpenAI API 密钥访问 GPT-4 和其他模型"
                    imageSrc="/images/openai.png"
                    selected={settings.aiProviderType === "openai"}
                    onClick={() => handleAiProviderChange("openai")}
                  />

                  <AIProviderCard
                    type="screenpipe-cloud"
                    title="Screenpipe Cloud"
                    description="使用 OpenAI、Anthropic 和 Google 模型，无需担心 API 密钥或使用量"
                    imageSrc="/images/screenpipe.png"
                    selected={settings.aiProviderType === "screenpipe-cloud"}
                    onClick={() => handleAiProviderChange("screenpipe-cloud")}
                    disabled={!settings.user}
                    warningText={
                      !settings.user
                        ? "需要登录"
                        : undefined
                    }
                  />

                  <AIProviderCard
                    type="native-ollama"
                    title="Ollama"
                    description="使用您现有的 Ollama 安装在本地运行 AI 模型"
                    imageSrc="/images/ollama.png"
                    selected={settings.aiProviderType === "native-ollama"}
                    onClick={() => handleAiProviderChange("native-ollama")}
                  />

                  <AIProviderCard
                    type="custom"
                    title="自定义"
                    description="连接到您自己的 AI 提供商或自托管模型"
                    imageSrc="/images/custom.png"
                    selected={settings.aiProviderType === "custom"}
                    onClick={() => handleAiProviderChange("custom")}
                  />
                </div>
              </CardContent>
            </Card>
          </motion.div>

          {settings.aiProviderType === "custom" && (
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-none shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center">
                      <Server className="h-4 w-4 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">自定义 URL</CardTitle>
                      <CardDescription>设置您的自定义 AI 服务 URL</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Input
                    id="customAiUrl"
                    value={settings.aiUrl}
                    onChange={(e) => {
                      const newUrl = e.target.value;
                      updateSettings({ aiUrl: newUrl });
                    }}
                    className="flex-grow"
                    placeholder="输入自定义 AI URL"
                    autoCorrect="off"
                    autoCapitalize="off"
                    autoComplete="off"
                    type="text"
                  />
                </CardContent>
              </Card>
            </motion.div>
          )}

          {isApiKeyRequired && (
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-none shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center">
                      <Key className="h-4 w-4 text-amber-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">API 密钥</CardTitle>
                      <CardDescription>输入您的 API 密钥以访问 AI 服务</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="relative">
                    <Input
                      id="aiApiKey"
                      type={showApiKey ? "text" : "password"}
                      value={settings.openaiApiKey}
                      onChange={handleApiKeyChange}
                      className="pr-10"
                      placeholder="输入您的 AI API 密钥"
                      autoCorrect="off"
                      autoCapitalize="off"
                      autoComplete="off"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="icon"
                      className="absolute right-0 top-0 h-full"
                      onClick={() => setShowApiKey(!showApiKey)}
                    >
                      {showApiKey ? (
                        <EyeOff className="h-4 w-4" />
                      ) : (
                        <Eye className="h-4 w-4" />
                      )}
                    </Button>
                  </div>
                </CardContent>
              </Card>
            </motion.div>
          )}

          {settings.aiProviderType !== "embedded" && (
            <motion.div variants={itemVariants}>
              <Card className="overflow-hidden border-none shadow-sm bg-white">
                <CardHeader className="pb-3">
                  <div className="flex items-center gap-2">
                    <div className="w-8 h-8 rounded-full bg-purple-100 flex items-center justify-center">
                      <Sparkles className="h-4 w-4 text-purple-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">AI 模型</CardTitle>
                      <CardDescription>选择您想要使用的 AI 模型</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <Popover modal={true}>
                    <PopoverTrigger asChild>
                      <Button
                        variant="outline"
                        role="combobox"
                        className="w-full justify-between"
                      >
                        {settings.aiModel || "选择模型..."}
                        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
                      </Button>
                    </PopoverTrigger>
                    <PopoverContent className="w-full p-0">
                      <Command>
                        <CommandInput
                          placeholder="选择或输入模型名称"
                          onValueChange={(value) => {
                            if (value) {
                              updateSettings({ aiModel: value });
                            }
                          }}
                        />
                        <CommandList>
                          <CommandEmpty>
                            按回车键使用 &quot;{settings.aiModel}&quot;
                          </CommandEmpty>
                          <CommandGroup heading="推荐模型">
                            {isLoadingModels ? (
                              <CommandItem value="loading" disabled>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                加载模型中...
                              </CommandItem>
                            ) : (
                              models.map((model) => (
                                <CommandItem
                                  key={model.id}
                                  value={model.id}
                                  onSelect={() => {
                                    updateSettings({ aiModel: model.id });
                                  }}
                                >
                                  {model.name}
                                  <Badge variant="outline" className="ml-2">
                                    {model.provider}
                                  </Badge>
                                </CommandItem>
                              ))
                            )}
                          </CommandGroup>
                        </CommandList>
                      </Command>
                    </PopoverContent>
                  </Popover>
                </CardContent>
              </Card>
            </motion.div>
          )}

          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-none shadow-sm bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-green-100 flex items-center justify-center">
                    <Zap className="h-4 w-4 text-green-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">最大上下文</CardTitle>
                    <CardDescription>设置发送到 AI 模型的最大字符数</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex-grow flex items-center gap-4">
                  <Slider
                    id="aiMaxContextChars"
                    min={10000}
                    max={1000000}
                    step={10000}
                    value={[settings.aiMaxContextChars]}
                    onValueChange={handleMaxContextCharsChange}
                    className="flex-grow"
                  />
                  <span className="min-w-[80px] text-right font-medium">
                    {settings.aiMaxContextChars.toLocaleString()}
                  </span>
                </div>
                <p className="text-xs text-muted-foreground mt-2">
                  通常，OpenAI 模型支持最多 200k 令牌，大约相当于 1M 字符。我们会在 UI 中显示您可以发送的内容量。
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>

        <TabsContent value="prompt" className="mt-0 space-y-6">
          <motion.div variants={itemVariants}>
            <Card className="overflow-hidden border-none shadow-sm bg-white">
              <CardHeader className="pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-indigo-100 flex items-center justify-center">
                    <MessageSquare className="h-4 w-4 text-indigo-600" />
                  </div>
                  <div>
                    <CardTitle className="text-lg">自定义提示词</CardTitle>
                    <CardDescription>配置发送给 AI 模型的提示词</CardDescription>
                  </div>
                </div>
              </CardHeader>
              <CardContent>
                <div className="relative">
                  <Textarea
                    id="customPrompt"
                    value={settings.customPrompt}
                    onChange={handleCustomPromptChange}
                    className="min-h-[200px] resize-y"
                    placeholder="在此输入您的自定义提示词"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    className="absolute right-2 top-2"
                    onClick={handleResetCustomPrompt}
                  >
                    <RefreshCw className="h-4 w-4 mr-2" />
                    重置
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground mt-4">
                  提示词将用于指导 AI 模型生成回复。您可以使用变量如 {"{context}"} 来引用上下文内容。
                </p>
              </CardContent>
            </Card>
          </motion.div>
        </TabsContent>
      </Tabs>
    </motion.div>
  );
};

export default AISection;
