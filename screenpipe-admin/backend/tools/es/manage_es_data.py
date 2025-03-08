#!/usr/bin/env python
"""
TimeGlass Elasticsearch数据管理工具

此脚本提供了一个综合管理工具，用于管理Elasticsearch中的TimeGlass数据。
功能包括：
- 列出所有索引
- 查看索引详情
- 清空特定索引数据
- 删除索引
- 查询数据
"""

import os
import sys
import asyncio
import argparse
import json
from elasticsearch import AsyncElasticsearch
from dotenv import load_dotenv
from datetime import datetime, timedelta

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '../..')))

# 导入应用相关模块
from backend.app.core.config import settings

# 加载环境变量
load_dotenv()

async def get_es_client():
    """获取Elasticsearch客户端"""
    es_url = os.getenv("ES_URL", settings.ES_URL)
    es_user = os.getenv("ES_USER", settings.ES_USER)
    es_pwd = os.getenv("ES_PWD", settings.ES_PWD)
    
    # 创建ES客户端
    if es_user and es_pwd:
        client = AsyncElasticsearch(
            es_url,
            basic_auth=(es_user, es_pwd),
            verify_certs=False
        )
    else:
        client = AsyncElasticsearch(es_url, verify_certs=False)
    
    return client

def format_size(size_in_bytes):
    """将字节大小转换为可读格式"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_in_bytes < 1024.0:
            return f"{size_in_bytes:.2f} {unit}"
        size_in_bytes /= 1024.0
    return f"{size_in_bytes:.2f} PB"

async def list_indices(client, pattern="timeglass-*"):
    """列出所有匹配模式的索引"""
    try:
        indices = await client.indices.get(pattern)
        return list(indices.keys())
    except Exception as e:
        print(f"获取索引列表时出错: {str(e)}")
        return []

async def get_index_stats(client, index_name):
    """获取索引统计信息"""
    try:
        stats = await client.indices.stats(index=index_name)
        index_stats = stats['indices'][index_name]['total']
        
        docs_count = index_stats['docs']['count']
        size_in_bytes = index_stats['store']['size_in_bytes']
        
        # 转换大小为可读格式
        size_readable = format_size(size_in_bytes)
        
        return {
            'docs_count': docs_count,
            'size_in_bytes': size_in_bytes,
            'size_readable': size_readable
        }
    except Exception as e:
        print(f"获取索引 {index_name} 统计信息时出错: {str(e)}")
        return {
            'docs_count': 0,
            'size_in_bytes': 0,
            'size_readable': '0 B'
        }

async def cmd_list(client, args):
    """列出所有索引"""
    pattern = args.pattern if args.pattern else "timeglass-*"
    indices = await list_indices(client, pattern)
    
    if not indices:
        print(f"没有找到匹配 '{pattern}' 的索引")
        return
    
    print(f"找到 {len(indices)} 个匹配 '{pattern}' 的索引:\n")
    
    # 显示索引统计信息
    total_docs = 0
    total_size_bytes = 0
    
    print(f"{'索引名称':<40} {'文档数':<10} {'大小':<15} {'创建时间':<20}")
    print("-" * 85)
    
    for idx in sorted(indices):
        # 获取索引统计信息
        stats = await get_index_stats(client, idx)
        
        # 获取索引创建时间
        index_info = await client.indices.get(index=idx)
        creation_date = index_info[idx]['settings']['index']['creation_date']
        creation_date = int(creation_date) / 1000  # 转换为秒
        creation_date = datetime.fromtimestamp(creation_date).strftime('%Y-%m-%d %H:%M:%S')
        
        # 打印索引信息
        print(f"{idx:<40} {stats['docs_count']:<10} {stats['size_readable']:<15} {creation_date:<20}")
        
        # 累计总数
        total_docs += stats['docs_count']
        total_size_bytes += stats['size_in_bytes']
    
    # 打印总计
    print("-" * 85)
    print(f"{'总计':<40} {total_docs:<10} {format_size(total_size_bytes):<15}")

async def cmd_info(client, args):
    """查看索引详情"""
    index_name = args.index
    
    # 检查索引是否存在
    if not await client.indices.exists(index=index_name):
        print(f"索引 {index_name} 不存在")
        return
    
    # 获取索引信息
    index_info = await client.indices.get(index=index_name)
    
    # 获取索引统计信息
    stats = await get_index_stats(client, index_name)
    
    # 获取索引映射
    mappings = index_info[index_name]['mappings']
    
    # 获取索引设置
    settings_info = index_info[index_name]['settings']
    
    # 打印索引详情
    print(f"索引名称: {index_name}")
    print(f"文档数量: {stats['docs_count']}")
    print(f"索引大小: {stats['size_readable']}")
    
    # 打印创建时间
    creation_date = settings_info['index']['creation_date']
    creation_date = int(creation_date) / 1000  # 转换为秒
    creation_date = datetime.fromtimestamp(creation_date).strftime('%Y-%m-%d %H:%M:%S')
    print(f"创建时间: {creation_date}")
    
    # 打印分片信息
    print(f"分片数量: {settings_info['index']['number_of_shards']}")
    print(f"副本数量: {settings_info['index']['number_of_replicas']}")
    
    # 打印映射信息
    if args.verbose:
        print("\n映射信息:")
        print(json.dumps(mappings, indent=2))
    else:
        print("\n字段列表:")
        if 'properties' in mappings:
            for field in mappings['properties']:
                field_type = mappings['properties'][field].get('type', 'unknown')
                print(f"  - {field} ({field_type})")

async def cmd_clear(client, args):
    """清空索引数据"""
    index_name = args.index
    
    # 检查索引是否存在
    if not await client.indices.exists(index=index_name):
        print(f"索引 {index_name} 不存在")
        return
    
    # 获取文档数量
    stats = await get_index_stats(client, index_name)
    doc_count = stats['docs_count']
    
    print(f"索引 {index_name} 中有 {doc_count} 个文档")
    
    if doc_count == 0:
        print("索引中没有文档，无需清空")
        return
    
    # 确认删除
    if not args.force:
        confirm = input(f"\n确认要删除索引 {index_name} 中的所有 {doc_count} 个文档吗? [y/N]: ").lower()
        if confirm != 'y':
            print("操作已取消")
            return
    
    # 删除文档
    try:
        result = await client.delete_by_query(
            index=index_name,
            body={"query": {"match_all": {}}},
            refresh=True
        )
        deleted = result['deleted']
        print(f"已从索引 {index_name} 中删除 {deleted} 个文档")
    except Exception as e:
        print(f"删除索引 {index_name} 中的文档时出错: {str(e)}")

async def cmd_delete(client, args):
    """删除索引"""
    index_name = args.index
    
    # 检查索引是否存在
    if not await client.indices.exists(index=index_name):
        print(f"索引 {index_name} 不存在")
        return
    
    # 确认删除
    if not args.force:
        confirm = input(f"\n确认要删除索引 {index_name} 吗? [y/N]: ").lower()
        if confirm != 'y':
            print("操作已取消")
            return
    
    # 删除索引
    try:
        await client.indices.delete(index=index_name)
        print(f"已删除索引: {index_name}")
    except Exception as e:
        print(f"删除索引 {index_name} 时出错: {str(e)}")

async def cmd_search(client, args):
    """搜索数据"""
    index_name = args.index
    query_str = args.query
    
    # 检查索引是否存在
    if not await client.indices.exists(index=index_name):
        print(f"索引 {index_name} 不存在")
        return
    
    # 构建查询
    if query_str:
        query = {
            "query": {
                "query_string": {
                    "query": query_str
                }
            }
        }
    else:
        query = {
            "query": {
                "match_all": {}
            }
        }
    
    # 添加排序
    query["sort"] = [{"timestamp": {"order": "desc"}}]
    
    # 添加大小限制
    query["size"] = args.limit
    
    # 执行搜索
    try:
        result = await client.search(
            index=index_name,
            body=query
        )
        
        hits = result['hits']['hits']
        total = result['hits']['total']['value']
        
        print(f"在索引 {index_name} 中找到 {total} 个匹配文档，显示前 {len(hits)} 个:\n")
        
        for i, hit in enumerate(hits, 1):
            print(f"文档 {i}:")
            print(f"  ID: {hit['_id']}")
            print(f"  得分: {hit['_score']}")
            
            # 打印文档的一些关键字段
            source = hit['_source']
            if 'timestamp' in source:
                print(f"  时间戳: {source['timestamp']}")
            if 'clientId' in source:
                print(f"  客户端ID: {source['clientId']}")
            
            # 如果是详细模式，打印完整文档
            if args.verbose:
                print("  文档内容:")
                print(json.dumps(source, indent=4))
            else:
                # 打印文档的前几个字段
                print("  字段预览:")
                count = 0
                for key, value in source.items():
                    if count >= 5:
                        break
                    
                    # 对于复杂类型，只打印类型信息
                    if isinstance(value, (dict, list)):
                        value_type = type(value).__name__
                        value_len = len(value)
                        print(f"    {key}: {value_type}[{value_len}]")
                    else:
                        # 截断长字符串
                        if isinstance(value, str) and len(value) > 50:
                            value = value[:50] + "..."
                        print(f"    {key}: {value}")
                    
                    count += 1
                
                if len(source) > 5:
                    print(f"    ... 还有 {len(source) - 5} 个字段")
            
            print()
        
    except Exception as e:
        print(f"搜索索引 {index_name} 时出错: {str(e)}")

async def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="TimeGlass Elasticsearch数据管理工具")
    subparsers = parser.add_subparsers(dest="command", help="子命令")
    
    # list命令
    list_parser = subparsers.add_parser("list", help="列出所有索引")
    list_parser.add_argument("-p", "--pattern", help="索引名称模式，默认为timeglass-*")
    
    # info命令
    info_parser = subparsers.add_parser("info", help="查看索引详情")
    info_parser.add_argument("index", help="索引名称")
    info_parser.add_argument("-v", "--verbose", action="store_true", help="显示详细信息")
    
    # clear命令
    clear_parser = subparsers.add_parser("clear", help="清空索引数据")
    clear_parser.add_argument("index", help="索引名称")
    clear_parser.add_argument("-f", "--force", action="store_true", help="强制清空，不需要确认")
    
    # delete命令
    delete_parser = subparsers.add_parser("delete", help="删除索引")
    delete_parser.add_argument("index", help="索引名称")
    delete_parser.add_argument("-f", "--force", action="store_true", help="强制删除，不需要确认")
    
    # search命令
    search_parser = subparsers.add_parser("search", help="搜索数据")
    search_parser.add_argument("index", help="索引名称")
    search_parser.add_argument("-q", "--query", help="查询字符串")
    search_parser.add_argument("-l", "--limit", type=int, default=10, help="结果数量限制")
    search_parser.add_argument("-v", "--verbose", action="store_true", help="显示详细信息")
    
    args = parser.parse_args()
    
    if not args.command:
        parser.print_help()
        return
    
    # 获取ES客户端
    client = await get_es_client()
    
    try:
        # 执行对应的命令
        if args.command == "list":
            await cmd_list(client, args)
        elif args.command == "info":
            await cmd_info(client, args)
        elif args.command == "clear":
            await cmd_clear(client, args)
        elif args.command == "delete":
            await cmd_delete(client, args)
        elif args.command == "search":
            await cmd_search(client, args)
    finally:
        # 关闭客户端
        await client.close()

if __name__ == "__main__":
    asyncio.run(main()) 