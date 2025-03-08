"use client";

import { getStore, useSettings } from "@/lib/hooks/use-settings";

import { ChangelogDialog } from "@/components/changelog-dialog";
import Header from "@/components/header";
import NotificationHandler from "@/components/notification-handler";
import { useToast } from "@/components/ui/use-toast";
import { useChangelogDialog } from "@/lib/hooks/use-changelog-dialog";
import { useSettingsDialog } from "@/lib/hooks/use-settings-dialog";
import { useStatusDialog } from "@/lib/hooks/use-status-dialog";
import React, { useEffect } from "react";

import { LoginDialog } from "@/components/login-dialog";
import { PipeStore } from "@/components/pipe-store";
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
  const { setShowChangelogDialog } = useChangelogDialog();
  const { open: openStatusDialog } = useStatusDialog();
  const { setIsOpen: setSettingsOpen } = useSettingsDialog();
  const isProcessingRef = React.useRef(false);
  const router = useRouter();

  // 检查用户是否已登录，如果未登录则重定向到登录页面
  useEffect(() => {
    if (!settings.user?.token) {
      router.push("/login");
    }
  }, [settings.user?.token, router]);

  useEffect(() => {
    if (settings.user?.token) {
      loadUser(settings.user.token);
    }
  }, [settings.user?.token]);

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
              updateSettings({ user: { token: apiKey } });
              toast({
                title: "logged in!",
                description: "you have been logged in",
              });
            }
          }

          if (url.includes("settings")) {
            setSettingsOpen(true);
          }

          if (url.includes("changelog")) {
            setShowChangelogDialog(true);
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

  // 如果用户未登录，不渲染主页内容
  if (!settings.user?.token) {
    return null;
  }

  return (
    <div className="flex flex-col items-center flex-1 max-w-screen-2xl mx-auto relative">
      <LoginDialog />

      <NotificationHandler />
      <>
        <ChangelogDialog />
        {/* <BreakingChangesInstructionsDialog /> */}
        <Header />
        <div className=" w-full">
          <PipeStore />
        </div>
      </>
    </div>
  );
}
