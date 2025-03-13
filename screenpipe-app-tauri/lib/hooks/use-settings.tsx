import { homeDir } from "@tauri-apps/api/path";
import { platform } from "@tauri-apps/plugin-os";
import { Pipe } from "./use-pipes";
import { Language } from "@/lib/language";
import {
	action,
	Action,
	persist,
	PersistStorage,
	createContextStore,
} from "easy-peasy";
import { LazyStore, LazyStore as TauriStore } from "@tauri-apps/plugin-store";
import { localDataDir } from "@tauri-apps/api/path";
import { flattenObject, unflattenObject } from "../utils";
import { useEffect } from "react";
import localforage from "localforage";
import { UserApi } from "@/lib/api";

export type VadSensitivity = "low" | "medium" | "high";

export type AIProviderType =
	| "native-ollama"
	| "openai"
	| "custom"
	| "embedded"
	| "screenpipe-cloud";

export type EmbeddedLLMConfig = {
	enabled: boolean;
	model: string;
	port: number;
};

export enum Shortcut {
	SHOW_SCREENPIPE = "show_screenpipe",
	START_RECORDING = "start_recording",
	STOP_RECORDING = "stop_recording",
}

export type User = {
  // 基本信息
  id: string;
  email: string;
  name: string;
  avatar?: string;
  created_at?: string; // ISO格式的日期字符串
  updated_at?: string; // ISO格式的日期字符串
  last_login_at?: string; // ISO格式的日期字符串
  last_login_ip?: string;
  
  // OAuth相关
  oauth_provider?: string;
  oauth_id?: string;
  
  // 设备信息 - 整合到用户表中
  device_name?: string;
  device_type?: string;
  device_os?: string;
  device_os_version?: string;
  device_browser?: string;
  device_browser_version?: string;
  device_last_active_at?: string; // ISO格式的日期字符串
};

export type AIPreset = {
	id: string;
	maxContextChars: number;
	url: string;
	model: string;
	defaultPreset: boolean;
	prompt: string;
	//provider: AIProviderType;
} & (
	| {
			provider: "openai";
			apiKey: string;
	  }
	| {
			provider: "native-ollama";
	  }
	| {
			provider: "screenpipe-cloud";
	  }
	| {
			provider: "custom";
			apiKey?: string;
	  }
);

export type Settings = {
  openaiApiKey: string;
  deepgramApiKey: string;
  isLoading: boolean;
  aiModel: string;
  installedPipes: Pipe[];
  userId: string;
  customPrompt: string;
  devMode: boolean;
  audioTranscriptionEngine: string;
  ocrEngine: string;
  monitorIds: string[];
  audioDevices: string[];
  usePiiRemoval: boolean;
  restartInterval: number;
  port: number;
  dataDir: string;
  disableAudio: boolean;
  ignoredWindows: string[];
  includedWindows: string[];
  aiProviderType: AIProviderType;
  aiUrl: string;
  aiMaxContextChars: number;
  fps: number;
  vadSensitivity: VadSensitivity;
  analyticsEnabled: boolean;
  audioChunkDuration: number; // new field
  useChineseMirror: boolean; // Add this line
  embeddedLLM: EmbeddedLLMConfig;
  languages: Language[];
  enableBeta: boolean;
  isFirstTimeUser: boolean;
  autoStartEnabled: boolean
  enableFrameCache: boolean; // Add this line
  enableUiMonitoring: boolean; // Add this line
  platform: string; // Add this line
  disabledShortcuts: Shortcut[];
  user: User;
  authToken: string; // JWT令牌
  showScreenpipeShortcut: string;
  startRecordingShortcut: string;
  stopRecordingShortcut: string;
  startAudioShortcut: string;
  stopAudioShortcut: string;
  pipeShortcuts: Record<string, string>;
  enableRealtimeAudioTranscription: boolean;
  realtimeAudioTranscriptionEngine: string;
  disableVision: boolean;
  useAllMonitors: boolean;
  enableRealtimeVision: boolean;
};

export const DEFAULT_PROMPT = `Rules:
- You can analyze/view/show/access videos to the user by putting .mp4 files in a code block (we'll render it) like this: \`/users/video.mp4\`, use the exact, absolute, file path from file_path property
- Do not try to embed video in links (e.g. [](.mp4) or https://.mp4) instead put the file_path in a code block using backticks
- Do not put video in multiline code block it will not render the video (e.g. \`\`\`bash\n.mp4\`\`\` IS WRONG) instead using inline code block with single backtick
- Always answer my question/intent, do not make up things
`;

const DEFAULT_SETTINGS: Settings = {
	openaiApiKey: "",
	deepgramApiKey: "", // for now we hardcode our key (dw about using it, we have bunch of credits)
	isLoading: true,
	aiModel: "gpt-4o",
	installedPipes: [],
	userId: "",
	customPrompt: `Rules:
- You can analyze/view/show/access videos to the user by putting .mp4 files in a code block (we'll render it) like this: \`/users/video.mp4\`, use the exact, absolute, file path from file_path property
- Do not try to embed video in links (e.g. [](.mp4) or https://.mp4) instead put the file_path in a code block using backticks
- Do not put video in multiline code block it will not render the video (e.g. \`\`\`bash\n.mp4\`\`\` IS WRONG) instead using inline code block with single backtick
- Always answer my question/intent, do not make up things
`,
  devMode: false,
  audioTranscriptionEngine: "whisper-tiny",
  ocrEngine: "default",
  monitorIds: ["default"],
  audioDevices: ["default"],
  usePiiRemoval: false,
  restartInterval: 0,
  port: 3030,
  dataDir: "default",
  disableAudio: false,
  ignoredWindows: [],
  includedWindows: [],
  aiProviderType: "openai",
  aiUrl: "https://api.openai.com/v1",
  aiMaxContextChars: 512000,
  fps: 0.5,
  vadSensitivity: "high",
  analyticsEnabled: true,
  audioChunkDuration: 30, // default to 10 seconds
  useChineseMirror: false, // Add this line
  languages: [],
  embeddedLLM: {
    enabled: false,
    model: "llama3.2:1b-instruct-q4_K_M",
    port: 11434,
  },
  enableBeta: false,
  isFirstTimeUser: true,
  autoStartEnabled: true,
  enableFrameCache: true, // Add this line
  enableUiMonitoring: false, // Change from true to false
  platform: "unknown", // Add this line
  disabledShortcuts: [],
  user: {
    id: "",
    email: "",
    name: "",
  },
  authToken: "", // JWT令牌
  showScreenpipeShortcut: "Super+Alt+S",
  startRecordingShortcut: "Super+Alt+R",
  stopRecordingShortcut: "Super+Alt+X",
  startAudioShortcut: "",
  stopAudioShortcut: "",
  pipeShortcuts: {},
  enableRealtimeAudioTranscription: false,
  realtimeAudioTranscriptionEngine: "whisper-large-v3-turbo",
  disableVision: false,
  useAllMonitors: false,
  enableRealtimeVision: false,
};

const DEFAULT_IGNORED_WINDOWS_IN_ALL_OS = [
	"bit",
	"VPN",
	"Trash",
	"Private",
	"Incognito",
	"Wallpaper",
	"Settings",
	"Keepass",
	"Recorder",
	"Vaults",
	"OBS Studio",
	"screenpipe",
];

const DEFAULT_IGNORED_WINDOWS_PER_OS: Record<string, string[]> = {
	macos: [
		".env",
		"Item-0",
		"App Icon Window",
		"Battery",
		"Shortcuts",
		"WiFi",
		"BentoBox",
		"Clock",
		"Dock",
		"DeepL",
		"Control Center",
	],
	windows: ["Nvidia", "Control Panel", "System Properties"],
	linux: ["Info center", "Discover", "Parted"],
};

// Model definition
export interface StoreModel {
	settings: Settings;
	setSettings: Action<StoreModel, Partial<Settings>>;
	resetSettings: Action<StoreModel>;
	resetSetting: Action<StoreModel, keyof Settings>;
}

export function createDefaultSettingsObject(): Settings {
	let defaultSettings = { ...DEFAULT_SETTINGS };
	try {
		const currentPlatform = platform();

		const ocrModel =
			currentPlatform === "macos"
				? "apple-native"
				: currentPlatform === "windows"
					? "windows-native"
					: "tesseract";

		defaultSettings.ocrEngine = ocrModel;
		defaultSettings.fps = currentPlatform === "macos" ? 0.5 : 1;
		defaultSettings.platform = currentPlatform;

		defaultSettings.ignoredWindows = [
			...DEFAULT_IGNORED_WINDOWS_IN_ALL_OS,
			...(DEFAULT_IGNORED_WINDOWS_PER_OS[currentPlatform] ?? []),
		];

		return defaultSettings;
	} catch (e) {
		return DEFAULT_SETTINGS;
	}
}

// Create a singleton store instance
let storePromise: Promise<LazyStore> | null = null;

/**
 * @warning Do not change autoSave to true, it causes race conditions
 */
export const getStore = async () => {
	if (!storePromise) {
		storePromise = (async () => {
			const dir = await localDataDir();
			const profilesStore = new TauriStore(`${dir}/screenpipe/profiles.bin`, {
				autoSave: false,
			});
			const activeProfile =
				(await profilesStore.get("activeProfile")) || "default";
			const file =
				activeProfile === "default"
					? `store.bin`
					: `store-${activeProfile}.bin`;
			console.log("activeProfile", activeProfile, file);
			return new TauriStore(`${dir}/screenpipe/${file}`, {
				autoSave: false,
			});
		})();
	}
	return storePromise;
};

const tauriStorage: PersistStorage = {
	getItem: async (_key: string) => {
		const tauriStore = await getStore();
		const allKeys = await tauriStore.keys();
		const values: Record<string, any> = {};

		for (const k of allKeys) {
			values[k] = await tauriStore.get(k);
		}

		return { settings: unflattenObject(values) };
	},
	setItem: async (_key: string, value: any) => {
		const tauriStore = await getStore();

		delete value.settings.customSettings;
		const flattenedValue = flattenObject(value.settings);

		// Only delete keys that are present in the new settings
		for (const key of Object.keys(flattenedValue)) {
			await tauriStore.delete(key);
		}

		// Set new flattened values
		for (const [key, val] of Object.entries(flattenedValue)) {
			if (!key || !key.length) continue;
			const defaultValue = key in DEFAULT_SETTINGS ? DEFAULT_SETTINGS[key as keyof Settings] : "";
			await tauriStore.set(key, val === undefined ? defaultValue : val);
		}

		await tauriStore.save();
	},
	removeItem: async (_key: string) => {
		const tauriStore = await getStore();
		const keys = await tauriStore.keys();
		for (const key of keys) {
			await tauriStore.delete(key);
		}
		await tauriStore.save();
	},
};

export const store = createContextStore<StoreModel>(
	persist(
		{
			settings: createDefaultSettingsObject(),
			setSettings: action((state, payload) => {
				console.log(state, payload);
				state.settings = {
					...state.settings,
					...payload,
				};
			}),
			resetSettings: action((state) => {
				state.settings = createDefaultSettingsObject();
			}),
			resetSetting: action((state, key) => {
				const defaultValue = createDefaultSettingsObject()[key];
				(state.settings as any)[key] = defaultValue;
			}),
		},
		{
			storage: tauriStorage,
			mergeStrategy: "mergeDeep",
		},
	),
);

export function useSettings() {
	const settings = store.useStoreState((state) => state.settings);
	const setSettings = store.useStoreActions((actions) => actions.setSettings);
	const resetSettings = store.useStoreActions(
		(actions) => actions.resetSettings,
	);
	const resetSetting = store.useStoreActions((actions) => actions.resetSetting);

  // 在组件挂载时从存储中加载设置
  useEffect(() => {
    const initializeSettings = async () => {
      try {
        // 获取存储实例
        const store = await getStore();
        
        // 确保存储已加载
        await store.reload();
        
        console.log("Tauri存储已初始化");
      } catch (error) {
        console.error("初始化Tauri存储失败:", error);
      }
    };
    
    initializeSettings();
  }, []);

	const getDataDir = async () => {
		const homeDirPath = await homeDir();

		if (
			settings.dataDir !== "default" &&
			settings.dataDir &&
			settings.dataDir !== ""
		)
			return settings.dataDir;

		let p = "macos";
		try {
			p = platform();
		} catch (e) {}

		return p === "macos" || p === "linux"
			? `${homeDirPath}/.screenpipe`
			: `${homeDirPath}\\.screenpipe`;
	};

	const loadUser = async (token: string, forceReload = false) => {
		try {
			// try to get from cache first (unless force reload)
			const cacheKey = `user_data_${token}`;
			if (!forceReload) {
				const cached = await localforage.getItem<{
					data: User;
					timestamp: number;
				}>(cacheKey);

				// use cache if less than 30s old
				if (cached && Date.now() - cached.timestamp < 30000) {
					setSettings({
						user: cached.data,
					});
					return;
				}
			}

      // 使用后端API获取用户信息
      const userApi = new UserApi();
      const userData = await userApi.getCurrentUser(token);

			// cache the result
			await localforage.setItem(cacheKey, {
				data: userData,
				timestamp: Date.now(),
			});

      setSettings({
        user: userData,
      });
    } catch (err) {
      console.error("failed to load user:", err);
      // 当认证失败时，清除认证令牌和用户信息
      setSettings({
        user: undefined,
        authToken: undefined
      });
      throw err;
    }
  };

	const reloadStore = async () => {
		const store = await getStore();
		await store.reload();

		const allKeys = await store.keys();
		const values: Record<string, any> = {};

		for (const k of allKeys) {
			values[k] = await store.get(k);
		}

    setSettings(unflattenObject(values));
  };

  // 添加一个函数来确保设置被保存到本地存储
  const saveSettings = async (newSettings: Partial<Settings>) => {
    // 更新状态
    setSettings(newSettings);
    
    // 获取存储实例
    const store = await getStore();
    
    // 将设置扁平化并保存到存储中
    const flattenedSettings = flattenObject(newSettings);
    for (const [key, value] of Object.entries(flattenedSettings)) {
      await store.set(key, value);
    }
    
    // 保存更改
    await store.save();
    
    console.log("设置已保存到本地存储", newSettings);
  };

  return {
    settings,
    updateSettings: setSettings,
    saveSettings, // 添加新函数到返回对象
    resetSettings,
    reloadStore,
    loadUser,
    resetSetting,
    getDataDir,
  };
}
