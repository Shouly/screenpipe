"use client";

import { getStore, useSettings } from "@/lib/hooks/use-settings";

import NotificationHandler from "@/components/notification-handler";
import { useToast } from "@/components/ui/use-toast";
import { useSettingsDialog } from "@/lib/hooks/use-settings-dialog";
import { useStatusDialog } from "@/lib/hooks/use-status-dialog";
import React, { useEffect, useState } from "react";

import HomeDashboard from "@/components/home-dashboard";
import Navigation from "@/components/navigation";
import { PipeStore } from "@/components/pipe-store";
import { Settings } from "@/components/settings";
import { PipeApi } from "@/lib/api";
import { useProfiles } from "@/lib/hooks/use-profiles";
import { invoke } from "@tauri-apps/api/core";
import { listen } from "@tauri-apps/api/event";
import { onOpenUrl } from "@tauri-apps/plugin-deep-link";
import { relaunch } from "@tauri-apps/plugin-process";
import { useRouter } from "next/navigation";

export default function Home() {
  const { settings, updateSettings, loadUser, reloadStore } = useSettings();
  const { setActiveProfile } = useProfiles();
  const { toast } = useToast();
  const { open: openStatusDialog } = useStatusDialog();
  const { setIsOpen: setSettingsOpen } = useSettingsDialog();
  const isProcessingRef = React.useRef(false);
  const router = useRouter();
  const [isInitialized, setIsInitialized] = useState(false);
  const [activePage, setActivePage] = useState<string>("home");

  // 在页面加载时从本地存储中恢复设置
  useEffect(() => {
    const loadSettings = async () => {
      try {
        console.log("开始从Tauri存储中加载设置...");
        await reloadStore();
        console.log("设置已从Tauri存储中恢复", {
          hasAuthToken: !!settings.authToken,
          hasUser: !!settings.user
        });
        setIsInitialized(true);
      } catch (error) {
        console.error("恢复设置失败:", error);
        setIsInitialized(true); // 即使失败也标记为已初始化，以便进行后续检查
      }
    };

    loadSettings();
  }, []);

  // 检查用户是否已登录，如果未登录则重定向到登录页面
  // 只有在设置初始化完成后才进行检查
  useEffect(() => {
    if (isInitialized) {
      console.log("检查认证状态...", {
        hasAuthToken: !!settings.authToken,
        hasUser: !!settings.user
      });

      if (!settings.authToken) {
        console.log("未找到认证令牌，重定向到登录页面");
        router.push("/login");
      } else {
        console.log("认证令牌有效，保持在主页");
      }
    }
  }, [isInitialized, settings.authToken, router]);

  useEffect(() => {
    if (settings.authToken) {
      loadUser(settings.authToken);
    }
  }, [settings.authToken]);

  useEffect(() => {
    const getAudioDevices = async () => {
      const store = await getStore();
      const devices = (await store.get("audioDevices")) as string[];
      return devices;
    };

    const setupDeepLink = async () => {
      const unsubscribeDeepLink = await onOpenUrl(async (urls) => {
        console.log("received deep link urls:", urls);
        for (const url of urls) {
          const parsedUrl = new URL(url);

          // Handle API key auth
          if (url.includes("api_key=")) {
            const apiKey = parsedUrl.searchParams.get("api_key");
            if (apiKey) {
              // 创建一个包含必填字段的用户对象
              const currentDate = new Date().toISOString();
              const mockUser = {
                id: "api-key-user-" + Date.now(),
                email: "api-user@example.com",
                name: "API用户",
                last_login_at: currentDate,
                last_login_ip: "127.0.0.1"
              };

              updateSettings({
                user: mockUser,
                authToken: apiKey
              });
              toast({
                title: "登录成功",
                description: "您已通过API密钥登录",
              });
            }
          }

          if (url.includes("settings")) {
            setSettingsOpen(true);
          }

          if (url.includes("status")) {
            openStatusDialog();
          }
        }
      });
      return unsubscribeDeepLink;
    };

    let deepLinkUnsubscribe: (() => void) | undefined;

    setupDeepLink().then((unsubscribe) => {
      deepLinkUnsubscribe = unsubscribe;
    });

    const unlisten = Promise.all([
      listen("shortcut-start-recording", async () => {
        await invoke("spawn_screenpipe");

        toast({
          title: "recording started",
          description: "screen recording has been initiated",
        });
      }),

      listen("shortcut-stop-recording", async () => {
        await invoke("stop_screenpipe");

        toast({
          title: "recording stopped",
          description: "screen recording has been stopped",
        });
      }),

      listen<string>("switch-profile", async (event) => {
        const profile = event.payload;
        setActiveProfile(profile);

        toast({
          title: "profile switched",
          description: `switched to ${profile} profile, restarting screenpipe now`,
        });

        await invoke("stop_screenpipe");

        await new Promise((resolve) => setTimeout(resolve, 1000));

        await invoke("spawn_screenpipe");

        await new Promise((resolve) => setTimeout(resolve, 1000));
        relaunch();
      }),

      listen<string>("open-pipe", async (event) => {
        const pipeId = event.payload;

        const pipeApi = new PipeApi();
        const pipeList = await pipeApi.listPipes();
        const pipe = pipeList.find((p) => p.id === pipeId);
        if (pipe) {
          await invoke("open_pipe_window", {
            port: pipe.port,
            title: pipe.id,
          });
        }
      }),

      listen("shortcut-start-audio", async () => {
        if (isProcessingRef.current) return;
        isProcessingRef.current = true;
        try {
          const devices = await getAudioDevices();
          const pipeApi = new PipeApi();
          console.log("audio-devices", devices);
          await Promise.all(
            devices.map((device) => pipeApi.startAudio(device))
          );
          toast({
            title: "audio started",
            description: "audio has been started",
          });
        } catch (error) {
          console.error("error starting audio:", error);
          toast({
            title: "error starting audio",
            description:
              error instanceof Error ? error.message : "unknown error occurred",
            variant: "destructive",
          });
        } finally {
          isProcessingRef.current = false;
        }
      }),

      listen("shortcut-stop-audio", async (event) => {
        try {
          const devices = await getAudioDevices();
          const pipeApi = new PipeApi();
          devices.forEach((device) => {
            pipeApi.stopAudio(device);
          });
          toast({
            title: "audio stopped",
            description: "audio has been stopped",
          });
        } catch (error) {
          console.error("error stopping audio:", error);
          toast({
            title: "error stopping audio",
            description:
              error instanceof Error ? error.message : "unknown error occurred",
            variant: "destructive",
          });
        }
      }),
    ]);

    return () => {
      unlisten.then((listeners) => {
        listeners.forEach((unlistenFn) => unlistenFn());
      });
      if (deepLinkUnsubscribe) deepLinkUnsubscribe();
    };
  }, [setSettingsOpen]);

  useEffect(() => {
    const unlisten = listen("cli-login", async (event) => {
      console.log("received cli-login event:", event);
      await reloadStore();
    });

    return () => {
      unlisten.then((unlistenFn) => unlistenFn());
    };
  }, []);

  // 处理导航切换
  const handleNavigate = (page: string) => {
    setActivePage(page);
  };

  // 渲染当前活动页面
  const renderActivePage = () => {
    switch (activePage) {
      case "home":
        return <HomeDashboard onNavigate={handleNavigate} />;
      case "store":
        return <PipeStore />;
      default:
        return <HomeDashboard onNavigate={handleNavigate} />;
    }
  };

  return (
    <main className="flex min-h-screen">
      <Navigation activePage={activePage} onNavigate={handleNavigate} />
      <div className="flex-1 overflow-auto">
        {renderActivePage()}
      </div>
      <NotificationHandler />
      <Settings />
    </main>
  );
}
