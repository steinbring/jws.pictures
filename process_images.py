import sys
import os
import subprocess
from PIL import Image
import exifread
import json

def create_thumbnail(image_path):
    base, ext = os.path.splitext(image_path)
    thumbnail_path = f"{base}_thumbnail{ext}"
    
    with Image.open(image_path) as img:
        img.thumbnail((128, 128))
        img.save(thumbnail_path)
    
    return thumbnail_path

def extract_exif(image_path):
    with open(image_path, 'rb') as image_file:
        tags = exifread.process_file(image_file)
    
    exif_data = {tag: str(tags[tag]) for tag in tags.keys()}
    return exif_data

def get_git_commit_info(file_path):
    # Get the commit hash for the first commit where this file was added
    commit_hash = subprocess.check_output(
        ['git', 'log', '--diff-filter=A', '--pretty=format:%H', '--', file_path],
        text=True
    ).strip()

    # Get the commit summary and description
    commit_summary = subprocess.check_output(
        ['git', 'log', '-1', '--pretty=format:%s', commit_hash],
        text=True
    ).strip()
    
    commit_description = subprocess.check_output(
        ['git', 'log', '-1', '--pretty=format:%b', commit_hash],
        text=True
    ).strip()

    return {
        "commit_hash": commit_hash,
        "commit_summary": commit_summary,
        "commit_description": commit_description
    }

def save_exif_and_commit_info(exif_data, commit_info, image_path):
    data = {
        "exif": exif_data,
        "commit_info": commit_info
    }
    exif_path = f"{os.path.splitext(image_path)[0]}.json"
    
    with open(exif_path, 'w') as exif_file:
        json.dump(data, exif_file, indent=4)
    
    return exif_path

if __name__ == "__main__":
    image_path = sys.argv[1]
    
    thumbnail_path = create_thumbnail(image_path)
    exif_data = extract_exif(image_path)
    commit_info = get_git_commit_info(image_path)
    
    exif_path = save_exif_and_commit_info(exif_data, commit_info, image_path)
    
    print(f"Created thumbnail: {thumbnail_path}")
    print(f"Extracted EXIF data and commit info to: {exif_path}")