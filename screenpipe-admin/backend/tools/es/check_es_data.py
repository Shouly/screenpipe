#!/usr/bin/env python
"""
查看Elasticsearch中的TimeGlass相关索引和数据统计

此脚本会列出所有TimeGlass相关索引，并显示每个索引的文档数量和大小。
"""

import os
import sys
import asyncio
import argparse
from elasticsearch import AsyncElasticsearch
from dotenv import load_dotenv
from datetime import datetime

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

async def list_indices(client):
    """列出所有TimeGlass相关索引"""
    try:
        indices = await client.indices.get("timeglass-*")
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

def format_size(size_in_bytes):
    """将字节大小转换为可读格式"""
    for unit in ['B', 'KB', 'MB', 'GB', 'TB']:
        if size_in_bytes < 1024.0:
            return f"{size_in_bytes:.2f} {unit}"
        size_in_bytes /= 1024.0
    return f"{size_in_bytes:.2f} PB"

async def get_latest_documents(client, index_name, count=5):
    """获取索引中最新的文档"""
    try:
        result = await client.search(
            index=index_name,
            body={
                "query": {"match_all": {}},
                "sort": [{"timestamp": {"order": "desc"}}],
                "size": count
            }
        )
        
        return result['hits']['hits']
    except Exception as e:
        print(f"获取索引 {index_name} 最新文档时出错: {str(e)}")
        return []

async def main(args):
    """主函数"""
    # 获取ES客户端
    client = await get_es_client()
    
    try:
        # 列出索引
        indices = await list_indices(client)
        
        if not indices:
            print("没有找到TimeGlass相关索引")
            return
        
        print(f"找到 {len(indices)} 个TimeGlass相关索引:\n")
        
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
        
        # 如果指定了详细模式，显示最新文档
        if args.verbose:
            print("\n最新文档示例:")
            
            for idx in sorted(indices):
                if await get_index_stats(client, idx)['docs_count'] > 0:
                    print(f"\n索引: {idx}")
                    docs = await get_latest_documents(client, idx, args.count)
                    
                    if not docs:
                        print("  没有找到文档")
                        continue
                    
                    for i, doc in enumerate(docs, 1):
                        print(f"  文档 {i}:")
                        print(f"    ID: {doc['_id']}")
                        
                        # 打印文档的一些关键字段
                        source = doc['_source']
                        if 'timestamp' in source:
                            print(f"    时间戳: {source['timestamp']}")
                        if 'clientId' in source:
                            print(f"    客户端ID: {source['clientId']}")
                        if 'reportType' in source:
                            print(f"    报告类型: {source['reportType']}")
                        
                        # 限制打印的字段数量
                        print(f"    字段数: {len(source)}")
    finally:
        # 关闭客户端
        await client.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="查看Elasticsearch中的TimeGlass相关索引和数据统计")
    parser.add_argument("-v", "--verbose", action="store_true", help="显示详细信息，包括最新文档")
    parser.add_argument("-c", "--count", type=int, default=3, help="每个索引显示的最新文档数量")
    args = parser.parse_args()
    
    # 运行主函数
    asyncio.run(main(args)) 