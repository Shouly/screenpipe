#!/usr/bin/env python
"""
TimeGlass Elasticsearch 工具启动脚本

此脚本用于启动各种 Elasticsearch 工具，提供统一的入口点。
"""

import os
import sys
import argparse
import importlib.util
import asyncio

# 添加项目根目录到Python路径
sys.path.insert(0, os.path.abspath(os.path.join(os.path.dirname(__file__), '..')))

def import_module_from_file(file_path):
    """从文件导入模块"""
    module_name = os.path.basename(file_path).replace('.py', '')
    spec = importlib.util.spec_from_file_location(module_name, file_path)
    module = importlib.util.module_from_spec(spec)
    spec.loader.exec_module(module)
    return module

def run_tool(tool_name, args):
    """运行指定的工具"""
    # 工具映射
    tools = {
        "check": "tools/es/check_es_data.py",
        "clear": "tools/es/clear_es_data.py",
        "force-clear": "tools/es/clear_es_data_force.py",
        "clear-index": "tools/es/clear_es_index_data.py",
        "manage": "tools/es/manage_es_data.py"
    }
    
    if tool_name not in tools:
        print(f"未知工具: {tool_name}")
        print(f"可用工具: {', '.join(tools.keys())}")
        return 1
    
    # 获取工具路径
    tool_path = os.path.join(os.path.dirname(os.path.dirname(__file__)), tools[tool_name])
    
    if not os.path.exists(tool_path):
        print(f"工具文件不存在: {tool_path}")
        return 1
    
    # 导入工具模块
    try:
        tool_module = import_module_from_file(tool_path)
        
        # 如果是manage工具，直接传递剩余参数
        if tool_name == "manage":
            sys.argv = [tool_path] + args
            asyncio.run(tool_module.main())
        # 如果是clear-index工具，第一个参数是索引名称
        elif tool_name == "clear-index":
            if not args:
                print("错误: 清空索引需要指定索引名称")
                return 1
            
            index_name = args[0]
            force = "-f" in args or "--force" in args
            
            # 创建参数对象
            class Args:
                pass
            
            args_obj = Args()
            args_obj.index = index_name
            args_obj.force = force
            
            asyncio.run(tool_module.main(args_obj))
        # 其他工具
        else:
            # 解析force参数
            force = "-f" in args or "--force" in args
            
            # 创建参数对象
            class Args:
                pass
            
            args_obj = Args()
            args_obj.force = force
            
            if tool_name == "check":
                args_obj.verbose = "-v" in args or "--verbose" in args
                args_obj.count = 3
                for i, arg in enumerate(args):
                    if arg in ["-c", "--count"] and i + 1 < len(args):
                        try:
                            args_obj.count = int(args[i + 1])
                        except ValueError:
                            pass
            
            asyncio.run(tool_module.main(args_obj))
        
        return 0
    except Exception as e:
        print(f"运行工具时出错: {str(e)}")
        import traceback
        traceback.print_exc()
        return 1

def main():
    """主函数"""
    parser = argparse.ArgumentParser(description="TimeGlass Elasticsearch 工具启动脚本")
    parser.add_argument("tool", help="要运行的工具", choices=["check", "clear", "force-clear", "clear-index", "manage"])
    parser.add_argument("args", nargs="*", help="传递给工具的参数")
    
    args = parser.parse_args()
    
    return run_tool(args.tool, args.args)

if __name__ == "__main__":
    sys.exit(main()) 