"use client";

import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle
} from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { OcrTextItem } from '@/lib/api';
import { format } from 'date-fns';
import { AppWindowIcon, ChevronLeftIcon, ChevronRightIcon, ClockIcon, InfoIcon, EyeIcon, TerminalIcon } from 'lucide-react';
import React, { useState } from 'react';
import { Badge } from '@/components/ui/badge';

interface OcrTextListProps {
  items: OcrTextItem[];
  total: number;
  currentPage: number;
  pageSize: number;
  loading: boolean;
  onPageChange: (page: number) => void;
  onPageSizeChange: (size: number) => void;
}

export const OcrTextList: React.FC<OcrTextListProps> = ({
  items,
  total,
  currentPage,
  pageSize,
  loading,
  onPageChange,
  onPageSizeChange
}) => {
  const [expandedItem, setExpandedItem] = useState<string | null>(null);

  const formatDate = (dateString: string) => {
    try {
      return format(new Date(dateString), 'yyyy-MM-dd HH:mm:ss');
    } catch (_error) {
      return '无效日期';
    }
  };

  const truncateText = (text: string, maxLength: number = 100) => {
    if (!text) return '';
    return text.length > maxLength ? `${text.substring(0, maxLength)}...` : text;
  };

  const handlePreviousPage = () => {
    if (currentPage > 1) {
      onPageChange(currentPage - 1);
    }
  };

  const handleNextPage = () => {
    const totalPages = Math.ceil(total / pageSize);
    if (currentPage < totalPages) {
      onPageChange(currentPage + 1);
    }
  };

  const toggleExpandItem = (id: string) => {
    if (expandedItem === id) {
      setExpandedItem(null);
    } else {
      setExpandedItem(id);
    }
  };

  const pageSizeOptions = [5, 10, 25, 50];

  return (
    <Card>
      <CardHeader>
        <div className="flex justify-between items-center">
          <div>
            <CardTitle className="flex items-center gap-2">
              <EyeIcon className="h-5 w-5" />
              OCR 文本数据
            </CardTitle>
            <CardDescription>
              共 {total} 条记录
            </CardDescription>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          </div>
        ) : items.length === 0 ? (
          <div className="text-center py-12 flex flex-col items-center gap-3">
            <InfoIcon className="h-10 w-10 text-muted-foreground" />
            <p className="text-muted-foreground">未找到数据</p>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="rounded-md border overflow-hidden">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-[180px]">
                      <div className="flex items-center gap-1">
                        <ClockIcon className="h-4 w-4" />
                        时间戳
                      </div>
                    </TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <AppWindowIcon className="h-4 w-4" />
                        应用程序
                      </div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">窗口</TableHead>
                    <TableHead className="hidden lg:table-cell">OCR文本</TableHead>
                    <TableHead className="hidden md:table-cell">
                      <div className="flex items-center gap-1">
                        <EyeIcon className="h-4 w-4" />
                        聚焦
                      </div>
                    </TableHead>
                    <TableHead className="hidden md:table-cell">长度</TableHead>
                    <TableHead>
                      <div className="flex items-center gap-1">
                        <TerminalIcon className="h-4 w-4" />
                        客户端 ID
                      </div>
                    </TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {items.map((item, index) => (
                    <React.Fragment key={index}>
                      <TableRow
                        className="cursor-pointer hover:bg-muted/50"
                        onClick={() => toggleExpandItem(`${item.client_id}-${item.frame_id}`)}
                      >
                        <TableCell className="font-medium">
                          {formatDate(item.timestamp)}
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="bg-primary/10 hover:bg-primary/20">
                            {item.app_name}
                          </Badge>
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {truncateText(item.window_name, 30)}
                        </TableCell>
                        <TableCell className="hidden lg:table-cell max-w-[300px] truncate">
                          {truncateText(item.text, 50)}
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {item.focused ? 
                            <Badge variant="outline" className="bg-green-100 hover:bg-green-200 text-green-800 border-green-200">是</Badge> : 
                            <Badge variant="outline" className="bg-gray-100 hover:bg-gray-200 text-gray-800 border-gray-200">否</Badge>
                          }
                        </TableCell>
                        <TableCell className="hidden md:table-cell">
                          {item.text_length}
                        </TableCell>
                        <TableCell>
                          <code className="relative rounded bg-muted px-[0.3rem] py-[0.2rem] font-mono text-xs">
                            {truncateText(item.client_id, 10)}
                          </code>
                        </TableCell>
                      </TableRow>
                      {expandedItem === `${item.client_id}-${item.frame_id}` && (
                        <TableRow>
                          <TableCell colSpan={7} className="p-0">
                            <div className="p-4 bg-muted/30 border-t">
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                                <div>
                                  <h4 className="text-sm font-medium mb-2">详细信息</h4>
                                  <dl className="grid grid-cols-[100px_1fr] gap-1 text-sm">
                                    <dt className="text-muted-foreground">客户端 ID:</dt>
                                    <dd className="font-mono">{item.client_id}</dd>
                                    <dt className="text-muted-foreground">报告 ID:</dt>
                                    <dd className="font-mono">{item.report_id}</dd>
                                    <dt className="text-muted-foreground">帧 ID:</dt>
                                    <dd>{item.frame_id}</dd>
                                    <dt className="text-muted-foreground">应用程序:</dt>
                                    <dd>{item.app_name}</dd>
                                    <dt className="text-muted-foreground">窗口:</dt>
                                    <dd>{item.window_name}</dd>
                                    <dt className="text-muted-foreground">聚焦状态:</dt>
                                    <dd>{item.focused ? '是' : '否'}</dd>
                                    <dt className="text-muted-foreground">平台:</dt>
                                    <dd>{item.platform}</dd>
                                    <dt className="text-muted-foreground">操作系统:</dt>
                                    <dd>{item.os} {item.os_version}</dd>
                                    <dt className="text-muted-foreground">主机名:</dt>
                                    <dd>{item.hostname}</dd>
                                  </dl>
                                </div>
                                <div>
                                  <h4 className="text-sm font-medium mb-2">OCR文本内容</h4>
                                  <div className="bg-muted p-3 rounded-md max-h-[200px] overflow-y-auto">
                                    <pre className="text-xs whitespace-pre-wrap font-mono">
                                      {item.text || '无内容'}
                                    </pre>
                                  </div>
                                </div>
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </React.Fragment>
                  ))}
                </TableBody>
              </Table>
            </div>
          </div>
        )}
      </CardContent>
      {!loading && items.length > 0 && (
        <CardFooter className="flex items-center justify-between border-t p-4">
          <div className="flex items-center space-x-2 text-sm text-muted-foreground">
            <span>每页行数</span>
            <select
              className="h-8 w-16 rounded-md border border-input bg-background px-2 text-xs"
              value={pageSize}
              onChange={(e) => onPageSizeChange(Number(e.target.value))}
            >
              {pageSizeOptions.map((size) => (
                <option key={size} value={size}>
                  {size}
                </option>
              ))}
            </select>
          </div>
          <div className="flex items-center gap-6">
            <div className="text-sm text-muted-foreground">
              第 {currentPage} 页，共 {Math.max(1, Math.ceil(total / pageSize))} 页
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                onClick={handlePreviousPage}
                disabled={currentPage <= 1}
              >
                <ChevronLeftIcon className="h-4 w-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                onClick={handleNextPage}
                disabled={currentPage >= Math.ceil(total / pageSize)}
              >
                <ChevronRightIcon className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardFooter>
      )}
    </Card>
  );
};

export default OcrTextList; 