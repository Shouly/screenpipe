import { open } from "@tauri-apps/plugin-dialog";
import { FolderOpen, Layers, Layout, RefreshCw } from "lucide-react";
import React, { useEffect, useState } from "react";
import remarkGfm from "remark-gfm";
import remarkMath from "remark-math";
import { MemoizedReactMarkdown } from "./markdown";
import { PipeWithStatus } from "./pipe-store/types";
import { SqlAutocompleteInput } from "./sql-autocomplete-input";
import { Button } from "./ui/button";
import { Checkbox } from "./ui/checkbox";
import { CodeBlock } from "./ui/codeblock";
import { Input } from "./ui/input";
import { Label } from "./ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "./ui/tooltip";

type PipeConfigFormProps = {
  pipe: PipeWithStatus;
  onConfigSave: (config: Record<string, any>) => void;
};

type FieldConfig = {
  name: string;
  type: string;
  default: any;
  description: string;
  value: any;
};

export const PipeConfigForm: React.FC<PipeConfigFormProps> = ({
  pipe,
  onConfigSave,
}) => {
  const [config, setConfig] = useState(pipe.installed_config);

  useEffect(() => {
    setConfig(pipe.installed_config);
  }, [pipe]);

  const handleInputChange = (name: string, value: any) => {
    if (!config) return;
    setConfig((prevConfig) => {
      if (!prevConfig) return prevConfig;
      return {
        ...prevConfig,
        fields: prevConfig.fields?.map((field: FieldConfig) =>
          field.name === name ? { ...field, value } : field
        ),
      };
    });
  };

  const renderConfigInput = (field: FieldConfig) => {
    const value = field?.value ?? field?.default;

    const resetToDefault = () => {
      handleInputChange(field.name, field.default);
    };

    switch (field.type) {
      case "boolean":
        return (
          <div className="flex items-center space-x-2">
            <Checkbox
              id={field.name}
              checked={value}
              onCheckedChange={(checked) =>
                handleInputChange(field.name, checked)
              }
            />
            <Label htmlFor={field.name}>{field.name}</Label>
          </div>
        );
      case "number":
        return (
          <div className="flex items-center space-x-2">
            <Input
              id={field.name}
              type="number"
              value={value}
              onChange={(e) =>
                handleInputChange(field.name, parseFloat(e.target.value) || 0)
              }
              onWheel={(e) => e.preventDefault()} // prevent scrolling down breaking stuff
              step="any"
              autoCorrect="off"
              spellCheck="false"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={resetToDefault}
                    className="h-8 w-8"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset to default</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      case "time":
        return (
          <div className="flex items-center space-x-2">
            <Input
              id={field.name}
              type="time"
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              autoCorrect="off"
              spellCheck="false"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={resetToDefault}
                    className="h-8 w-8"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset to default</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      case "window":
        return (
          <div className="flex items-center space-x-2 w-full">
            <SqlAutocompleteInput
              className="w-full"
              id={field.name}
              placeholder={`Enter ${field.name}`}
              value={value}
              onChange={(newValue) => handleInputChange(field.name, newValue)}
              type="window"
              icon={<Layout className="h-4 w-4" />}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={resetToDefault}
                    className="h-8 w-8"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset to default</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      case "app":
        return (
          <div className="flex items-center space-x-2 w-full">
            <SqlAutocompleteInput
              className="w-full"
              id={field.name}
              placeholder={`Enter ${field.name}`}
              value={value}
              onChange={(newValue) => handleInputChange(field.name, newValue)}
              type="app"
              icon={<Layout className="h-4 w-4" />}
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={resetToDefault}
                    className="h-8 w-8"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset to default</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      case "contentType":
        return (
          <div className="space-y-2">
            <div className="flex items-center space-x-2">
              <Select
                value={value}
                onValueChange={(newValue) =>
                  handleInputChange(field.name, newValue)
                }
              >
                <SelectTrigger id={field.name} className="relative w-full">
                  <Layers
                    className="absolute left-2 top-1/2 transform -translate-y-1/2 text-gray-400"
                    size={18}
                  />
                  <SelectValue placeholder="content type" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">
                    <span className="pl-6">all</span>
                  </SelectItem>
                  <SelectItem value="ocr">
                    <span className="pl-6">ocr</span>
                  </SelectItem>
                  <SelectItem value="audio">
                    <span className="pl-6">audio</span>
                  </SelectItem>
                </SelectContent>
              </Select>
              <TooltipProvider>
                <Tooltip>
                  <TooltipTrigger asChild>
                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={resetToDefault}
                      className="h-8 w-8"
                    >
                      <RefreshCw className="h-4 w-4" />
                    </Button>
                  </TooltipTrigger>
                  <TooltipContent>
                    <p>Reset to default</p>
                  </TooltipContent>
                </Tooltip>
              </TooltipProvider>
            </div>
          </div>
        );
      case "path":
        return (
          <div className="flex items-center space-x-2">
            <Input
              id={field.name}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              autoCorrect="off"
              spellCheck="false"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={async () => {
                      try {
                        const selectedPath = await open({
                          directory: true,
                          multiple: false,
                        });
                        if (selectedPath) {
                          handleInputChange(field.name, selectedPath);
                        }
                      } catch (error) {
                        console.error("failed to select path:", error);
                      }
                    }}
                    className="h-8 w-8"
                  >
                    <FolderOpen className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Select folder</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={resetToDefault}
                    className="h-8 w-8"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset to default</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
      default:
        return (
          <div className="flex items-center space-x-2">
            <Input
              id={field.name}
              type="text"
              value={value}
              onChange={(e) => handleInputChange(field.name, e.target.value)}
              autoCorrect="off"
              spellCheck="false"
            />
            <TooltipProvider>
              <Tooltip>
                <TooltipTrigger asChild>
                  <Button
                    size="icon"
                    variant="ghost"
                    onClick={resetToDefault}
                    className="h-8 w-8"
                  >
                    <RefreshCw className="h-4 w-4" />
                  </Button>
                </TooltipTrigger>
                <TooltipContent>
                  <p>Reset to default</p>
                </TooltipContent>
              </Tooltip>
            </TooltipProvider>
          </div>
        );
    }
  };

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold">pipe configuration</h3>

      <div className="space-y-2">
        <Label htmlFor="port" className="font-medium">
          port (number)
        </Label>
        <div className="flex items-center space-x-2">
          <Input
            id="port"
            type="number"
            value={config?.port ?? ""}
            onChange={(e) =>
              setConfig((prev) =>
                prev
                  ? {
                    ...prev,
                    port: parseInt(e.target.value) || 3000,
                  }
                  : prev
              )
            }
            onWheel={(e) => e.preventDefault()}
            step="1"
            min="1"
            max="65535"
            autoCorrect="off"
            spellCheck="false"
          />
          <TooltipProvider>
            <Tooltip>
              <TooltipTrigger asChild>
                <Button
                  size="icon"
                  variant="ghost"
                  onClick={() =>
                    setConfig((prev) => (prev ? { ...prev, port: 3000 } : prev))
                  }
                  className="h-8 w-8"
                >
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </TooltipTrigger>
              <TooltipContent>
                <p>Reset to default (3000)</p>
              </TooltipContent>
            </Tooltip>
          </TooltipProvider>
        </div>
        <MemoizedReactMarkdown
          className="prose prose-sm break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 w-full"
          remarkPlugins={[remarkGfm, remarkMath]}
          components={{
            p({ children }) {
              return <p className="mb-2 last:mb-0">{children}</p>;
            },
            a({ node, href, children, ...props }) {
              return (
                <a
                  href={href}
                  target="_blank"
                  rel="noopener noreferrer"
                  {...props}
                >
                  {children}
                </a>
              );
            },
            code({ node, className, children, ...props }) {
              const content = String(children).replace(/\n$/, "");
              const match = /language-(\w+)/.exec(className || "");

              if (!match) {
                return (
                  <code
                    className="px-1 py-0.5 rounded-sm font-mono text-sm"
                    {...props}
                  >
                    {content}
                  </code>
                );
              }

              return (
                <CodeBlock
                  key={Math.random()}
                  language={(match && match[1]) || ""}
                  value={content}
                  {...props}
                />
              );
            },
          }}
        >
          Port number for this pipe. If the selected port is already in use when
          starting the pipe, a random available port will be automatically
          assigned.
        </MemoizedReactMarkdown>
      </div>

      {config?.fields?.map((field: FieldConfig) => (
        <div key={field.name} className="space-y-2">
          <Label htmlFor={field.name} className="font-medium">
            {field.name} ({field.type})
          </Label>
          {renderConfigInput(field)}
          <MemoizedReactMarkdown
            className="prose prose-sm break-words dark:prose-invert prose-p:leading-relaxed prose-pre:p-0 w-full"
            remarkPlugins={[remarkGfm, remarkMath]}
            components={{
              p({ children }) {
                return <p className="mb-2 last:mb-0">{children}</p>;
              },
              a({ node, href, children, ...props }) {
                return (
                  <a
                    href={href}
                    target="_blank"
                    rel="noopener noreferrer"
                    {...props}
                  >
                    {children}
                  </a>
                );
              },
              code({ node, className, children, ...props }) {
                const content = String(children).replace(/\n$/, "");
                const match = /language-(\w+)/.exec(className || "");

                if (!match) {
                  return (
                    <code
                      className="px-1 py-0.5 rounded-sm font-mono text-sm"
                      {...props}
                    >
                      {content}
                    </code>
                  );
                }

                return (
                  <CodeBlock
                    key={Math.random()}
                    language={(match && match[1]) || ""}
                    value={content}
                    {...props}
                  />
                );
              },
            }}
          >
            {field.description}
          </MemoizedReactMarkdown>
        </div>
      ))}
      <Button type="submit" onClick={() => onConfigSave(config || {})}>
        save configuration
      </Button>
    </div>
  );
};
