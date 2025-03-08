#!/usr/bin/env python
"""
强制清空Elasticsearch中的所有TimeGlass相关索引

此脚本会删除所有以'timeglass-'开头的索引，无需用户确认。
警告：此脚本会直接删除数据，请谨慎使用！
"""

import os
import sys
import asyncio
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

async def list_indices(client):
    """列出所有TimeGlass相关索引"""
    indices = await client.indices.get("timeglass-*")
    return list(indices.keys())

async def delete_indices(client, indices):
    """删除指定的索引"""
    if not indices:
        print("没有找到TimeGlass相关索引")
        return
    
    print(f"找到以下TimeGlass相关索引:")
    for idx in indices:
        print(f"  - {idx}")
    
    print("\n正在强制删除所有索引...")
    
    # 删除索引
    for idx in indices:
        try:
            await client.indices.delete(index=idx)
            print(f"已删除索引: {idx}")
        except Exception as e:
            print(f"删除索引 {idx} 时出错: {str(e)}")
    
    print("操作完成")

async def main():
    """主函数"""
    # 获取ES客户端
    client = await get_es_client()
    
    try:
        # 列出索引
        indices = await list_indices(client)
        
        # 删除索引
        await delete_indices(client, indices)
    finally:
        # 关闭客户端
        await client.close()

if __name__ == "__main__":
    print("警告：此脚本将强制删除所有TimeGlass相关索引，无需确认！")
    print("按Ctrl+C取消操作，或等待3秒继续...\n")
    
    try:
        # 等待3秒，给用户取消的机会
        asyncio.run(asyncio.sleep(3))
        
        # 运行主函数
        asyncio.run(main())
    except KeyboardInterrupt:
        print("\n操作已取消")
        sys.exit(0) 