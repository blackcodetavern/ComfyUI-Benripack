import os
import shutil
import sys
import os
import filecmp
import shutil

import __main__

from distutils.dir_util import copy_tree
from .nodes import NODE_CLASS_MAPPINGS, NODE_DISPLAY_NAME_MAPPINGS

WEB_DIRECTORY = "./web"

__all__ = ['NODE_CLASS_MAPPINGS', 'NODE_DISPLAY_NAME_MAPPINGS', 'WEB_DIRECTORY']
# Get the current script's directory
current_dir = os.path.dirname(os.path.abspath(__file__))

# Define paths
folder_web = os.path.join(current_dir, "web")
extensions_folder = os.path.join(current_dir,"ComfyUI", "custom_nodes", 'ComfyUI_BenriPack','web')
folder_3d_models = os.path.join(current_dir, "ComfyUI", "3d_models")
destination_3d_models = os.path.join(extensions_folder, "3d_models")

def cleanup():
    if os.path.exists(extensions_folder):
        try:
            shutil.rmtree(extensions_folder)
            print('\033[92mBenriPack: Removed old extension folder\033[0m')
        except Exception as e:
            print(f'\033[91mBenriPack: Error removing old extension folder: {e}\033[0m')

def copy_3d_models():
    try:
        if not os.path.exists(folder_3d_models):
            print(f'\033[93mBenriPack: 3d_models folder not found at {folder_3d_models}\033[0m')
            return

        if not os.path.exists(extensions_folder):
            os.makedirs(extensions_folder)

        
        shutil.copytree(folder_3d_models, destination_3d_models, dirs_exist_ok=True)
        print('\033[92mBenriPack: Copied 3d_models to extension folder\033[0m')
    except Exception as e:
        print(f'\033[91mBenriPack: Error copying 3d_models: {e}\033[0m')

if __name__ == "__main__":
    cleanup()
    copy_3d_models()