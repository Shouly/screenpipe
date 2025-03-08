#!/usr/bin/env python
"""
清空Elasticsearch中特定索引的数据

此脚本会删除指定索引中的所有文档，但保留索引结构。
可用于清空特定日期的数据或特定类型的数据。
"""

import os
import sys
import asyncio
import argparse
from elasticsearch import AsyncElasticsearch
from dotenv import load_dotenv

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

async def check_index_exists(client, index_name):
    """检查索引是否存在"""
    return await client.indices.exists(index=index_name)

async def get_doc_count(client, index_name):
    """获取索引中的文档数量"""
    try:
        stats = await client.indices.stats(index=index_name)
        return stats['indices'][index_name]['total']['docs']['count']
    except Exception as e:
        print(f"获取索引 {index_name} 文档数量时出错: {str(e)}")
        return 0

async def delete_by_query(client, index_name):
    """删除索引中的所有文档"""
    try:
        result = await client.delete_by_query(
            index=index_name,
            body={"query": {"match_all": {}}},
            refresh=True
        )
        return result['deleted']
    except Exception as e:
        print(f"删除索引 {index_name} 中的文档时出错: {str(e)}")
        return 0

async def main(args):
    """主函数"""
    index_name = args.index
    
    # 获取ES客户端
    client = await get_es_client()
    
    try:
        # 检查索引是否存在
        if not await check_index_exists(client, index_name):
            print(f"索引 {index_name} 不存在")
            return
        
        # 获取文档数量
        doc_count = await get_doc_count(client, index_name)
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
        deleted = await delete_by_query(client, index_name)
        print(f"已从索引 {index_name} 中删除 {deleted} 个文档")
        
    finally:
        # 关闭客户端
        await client.close()

if __name__ == "__main__":
    parser = argparse.ArgumentParser(description="清空Elasticsearch中特定索引的数据")
    parser.add_argument("index", help="要清空的索引名称")
    parser.add_argument("-f", "--force", action="store_true", help="强制删除，不需要确认")
    args = parser.parse_args()
    
    # 运行主函数
    asyncio.run(main(args)) 