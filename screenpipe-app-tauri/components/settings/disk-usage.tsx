"use client";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "@/components/ui/use-toast";
import { invoke } from "@tauri-apps/api/core";
import { motion } from "framer-motion";
import localforage from "localforage";
import { Database, FileAudio, FileVideo, HardDrive, HardDriveDownload, Package } from "lucide-react";
import React, { useEffect, useState } from "react";

interface DiskUsageData {
  media: {
    audios_size: string;
    videos_size: string;
    total_media_size: string;
  };
  pipes: {
    pipes: [string, string][];
    total_pipes_size: string;
  };
  total_data_size: string;
  total_cache_size: string;
  avaiable_space: string;
}

// 动画变体
const containerVariants = {
  hidden: { opacity: 0 },
  visible: {
    opacity: 1,
    transition: {
      staggerChildren: 0.1
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

const UsageItem = ({ label, value, icon }: { label: string; value: string; icon: React.ReactNode }) => (
  <div className="flex items-center justify-between py-2">
    <div className="flex items-center gap-2">
      <div className="text-primary">{icon}</div>
      <span className="text-gray-800">{label}</span>
    </div>
    <Badge
      variant={"outline"}
      className="min-w-[5.5rem] flex flex-row justify-center bg-primary/10 text-primary border-primary/20"
    >
      {value}
    </Badge>
  </div>
);

const DiskUsageSection = ({
  title,
  description,
  icon,
  children
}: {
  title: string;
  description: string;
  icon: React.ReactNode;
  children: React.ReactNode;
}) => (
  <motion.div variants={itemVariants}>
    <Card className="border border-gray-100 shadow-sm hover:shadow-md transition-shadow">
      <CardContent className="p-6">
        <div className="space-y-4">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              {icon}
            </div>
            <div>
              <h4 className="font-medium text-gray-800">{title}</h4>
              <p className="text-sm text-gray-500">{description}</p>
            </div>
          </div>
          <div className="pt-2 space-y-1 border-t border-gray-100">
            {children}
          </div>
        </div>
      </CardContent>
    </Card>
  </motion.div>
);

export default function DiskUsage() {
  const [diskUsage, setDiskUsage] = useState<DiskUsageData | null>(null);
  const [loading, setLoading] = useState<boolean>(false);

  const getDisk = async () => {
    setLoading(true);
    try {
      const cachedData = await localforage.getItem<{
        diskData: DiskUsageData;
        lastUpdated: number;
      }>("diskUsage");
      const now = Date.now();
      const twoDaysInMillis = 2 * 24 * 60 * 60 * 1000;
      if (cachedData && now - cachedData.lastUpdated < twoDaysInMillis) {
        setDiskUsage(cachedData.diskData);
        setLoading(false);
      } else {
        const result = await invoke<DiskUsageData>("get_disk_usage");
        await new Promise<DiskUsageData>((resolve) => {
          setTimeout(() => resolve(result), 3000);
        });
        await localforage.setItem("diskUsage", {
          diskData: result,
          lastUpdated: now,
        });
        setDiskUsage(result);
        setLoading(false);
      }
    } catch (error) {
      console.error("Failed to fetch disk usage:", error);
      toast({
        title: "错误",
        description: "获取磁盘使用信息失败，请重试！",
        variant: "destructive",
      });
    }
  };

  useEffect(() => {
    getDisk();
  }, []);

  return (
    <motion.div
      className="w-full space-y-8"
      variants={containerVariants}
      initial="hidden"
      animate="visible"
    >
      {loading && !diskUsage ? (
        <div className="space-y-4">
          <Skeleton className="h-[120px] w-full rounded-lg" />
          <Skeleton className="h-[120px] w-full rounded-lg" />
          <Skeleton className="h-[120px] w-full rounded-lg" />
        </div>
      ) : (
        <>
          {diskUsage && diskUsage.pipes && (
            <DiskUsageSection
              title="管道占用空间"
              description="已安装管道的总空间使用量"
              icon={<Package size={20} />}
            >
              {diskUsage.pipes.pipes.map(([name, size], index) => (
                <UsageItem key={index} label={name} value={size} icon={<Package size={16} />} />
              ))}
            </DiskUsageSection>
          )}

          {diskUsage && diskUsage.media && (
            <DiskUsageSection
              title="已捕获的数据总量"
              description="Screenpipe 随时间捕获的数据量"
              icon={<Database size={20} />}
            >
              <UsageItem label="视频数据" value={diskUsage.media.videos_size} icon={<FileVideo size={16} />} />
              <UsageItem label="音频数据" value={diskUsage.media.audios_size} icon={<FileAudio size={16} />} />
            </DiskUsageSection>
          )}

          {diskUsage && diskUsage.total_data_size && diskUsage.avaiable_space && (
            <DiskUsageSection
              title="磁盘使用概览"
              description="Screenpipe 应用程序的磁盘使用情况"
              icon={<HardDrive size={20} />}
            >
              <UsageItem
                label="Screenpipe 缓存大小"
                value={diskUsage.total_cache_size}
                icon={<HardDrive size={16} />}
              />
              <UsageItem
                label="Screenpipe 使用的磁盘空间"
                value={diskUsage.total_data_size}
                icon={<FileVideo size={16} />}
              />
              <UsageItem
                label="可用磁盘空间"
                value={diskUsage.avaiable_space}
                icon={<HardDriveDownload size={16} />}
              />
            </DiskUsageSection>
          )}
        </>
      )}
    </motion.div>
  );
}

